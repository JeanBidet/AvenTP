<?php
/**
 * Réception du formulaire de devis — à déposer sur l'hébergement OVH avec le reste
 * du site (tout ce qui est dans public/ est recopié tel quel dans dist/).
 *
 * Pourquoi ce fichier plutôt qu'un service extérieur : le site est statique, mais
 * l'hébergement web OVH exécute PHP. Recevoir le formulaire ici évite l'abonnement
 * que demandent les relais tiers pour les pièces jointes, et surtout leur plafond
 * de 5 à 10 Mo. Ici, la seule limite est celle de PHP (voir .user.ini) et les
 * photos arrivent en pleine qualité.
 *
 * Le formulaire est un POST HTML classique : aucun JavaScript n'est nécessaire pour
 * l'envoi, et la réponse est une redirection 303 vers /merci.
 */

declare(strict_types=1);

// ---------------------------------------------------------------------------
// À RENSEIGNER
// ---------------------------------------------------------------------------

/** Boîte qui reçoit les demandes. */
const DESTINATAIRE = '[EMAIL]';

/**
 * Expéditeur technique. Doit être une adresse du domaine hébergé chez OVH :
 * une adresse extérieure (gmail, orange…) ferait passer le message pour une
 * usurpation et l'enverrait en indésirables.
 */
const EXPEDITEUR = '[ADRESSE@VOTRE-DOMAINE.FR]';

/** Page de confirmation et page du formulaire, pour les redirections. */
const PAGE_MERCI = '/merci/';
const PAGE_FORMULAIRE = '/devis/';

// ---------------------------------------------------------------------------
// Limites
// ---------------------------------------------------------------------------

const MAX_PHOTOS = 8;
const MAX_OCTETS_PAR_PHOTO = 10 * 1024 * 1024;   // 10 Mo
const MAX_OCTETS_TOTAL = 40 * 1024 * 1024;       // 40 Mo
const TYPES_ACCEPTES = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/heic' => 'heic',
    'image/heif' => 'heif',
];

// ---------------------------------------------------------------------------

/** Renvoie le visiteur sur une page du site et coupe court. */
function rediriger(string $chemin): never
{
    header('Location: ' . $chemin, true, 303);
    exit;
}

/** Nettoie une valeur postée : pas de retour à la ligne dans un en-tête d'email. */
function texte(string $cle, int $max = 2000): string
{
    $v = is_string($_POST[$cle] ?? null) ? trim($_POST[$cle]) : '';
    return mb_substr(str_replace(["\r", "\n", "\0"], ' ', $v), 0, $max);
}

/** Idem mais en conservant les sauts de ligne (corps du message). */
function bloc(string $cle, int $max = 8000): string
{
    $v = is_string($_POST[$cle] ?? null) ? trim($_POST[$cle]) : '';
    return mb_substr(str_replace("\0", '', $v), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    rediriger(PAGE_FORMULAIRE);
}

// Piège à robots : le champ est caché en CSS, un humain ne le remplit jamais.
// On répond comme si tout s'était bien passé, pour ne rien apprendre au robot.
if (texte('site_web') !== '') {
    rediriger(PAGE_MERCI);
}

$nom = texte('nom', 120);
$email = texte('email', 200);
$telephone = texte('telephone', 40);
$projet = bloc('projet');

$emailValide = filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
if ($nom === '' || !$emailValide || $projet === '') {
    rediriger(PAGE_FORMULAIRE . '?erreur=champs');
}
if (texte('consentement') === '') {
    rediriger(PAGE_FORMULAIRE . '?erreur=consentement');
}

// Noms de champs en ASCII sans espace : PHP remplace espaces et points par des
// underscores dans les clés de $_POST, si bien qu'un champ « Type d'aménagement »
// n'arriverait jamais sous ce nom. Les libellés lisibles sont reconstruits ici.
$types = array_filter(
    array_map('strval', (array) ($_POST['amenagement'] ?? [])),
    static fn (string $t): bool => $t !== '' && mb_strlen($t) < 60,
);

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

$photos = [];
$total = 0;
$fichiers = $_FILES['photos'] ?? null;

if (is_array($fichiers) && is_array($fichiers['error'])) {
    foreach ($fichiers['error'] as $i => $erreur) {
        if ($erreur === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        // Un fichier trop gros pour PHP arrive avec UPLOAD_ERR_INI_SIZE : on refuse
        // l'ensemble plutôt que d'envoyer une demande amputée sans le dire.
        if ($erreur !== UPLOAD_ERR_OK) {
            rediriger(PAGE_FORMULAIRE . '?erreur=photo');
        }
        if (count($photos) >= MAX_PHOTOS) {
            rediriger(PAGE_FORMULAIRE . '?erreur=nombre');
        }

        $tmp = $fichiers['tmp_name'][$i];
        if (!is_uploaded_file($tmp)) {
            rediriger(PAGE_FORMULAIRE . '?erreur=photo');
        }

        $taille = (int) $fichiers['size'][$i];
        $total += $taille;
        if ($taille > MAX_OCTETS_PAR_PHOTO || $total > MAX_OCTETS_TOTAL) {
            rediriger(PAGE_FORMULAIRE . '?erreur=poids');
        }

        // Le type est lu dans le fichier lui-même, jamais dans l'en-tête envoyé
        // par le navigateur, qui se falsifie en une ligne.
        $type = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
        if (!isset(TYPES_ACCEPTES[$type])) {
            rediriger(PAGE_FORMULAIRE . '?erreur=format');
        }

        $photos[] = [
            'nom' => sprintf('photo-%d.%s', count($photos) + 1, TYPES_ACCEPTES[$type]),
            'type' => $type,
            'contenu' => (string) file_get_contents($tmp),
        ];
    }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

$lignes = [
    'Nom              : ' . $nom,
    'Email            : ' . $email,
    'Téléphone        : ' . ($telephone !== '' ? $telephone : '—'),
    'Type de chantier : ' . ($types !== [] ? implode(', ', $types) : '—'),
    'Budget           : ' . (texte('budget', 60) ?: '—'),
    'Nous a connus par: ' . (texte('origine', 80) ?: '—'),
    'Photos jointes   : ' . count($photos),
    '',
    'Projet :',
    $projet,
    '',
    '— Envoyé depuis le formulaire de devis du site.',
];
$corps = implode("\n", $lignes);

$frontiere = 'b' . bin2hex(random_bytes(16));
$sujet = '=?UTF-8?B?' . base64_encode('Demande de devis — ' . $nom) . '?=';

$entetes = implode("\r\n", [
    'MIME-Version: 1.0',
    'From: =?UTF-8?B?' . base64_encode('Site AvenTP') . '?= <' . EXPEDITEUR . '>',
    'Reply-To: ' . $email,
    'Content-Type: multipart/mixed; boundary="' . $frontiere . '"',
]);

$message = "--{$frontiere}\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($corps)) . "\r\n";

foreach ($photos as $photo) {
    $message .= "--{$frontiere}\r\n"
        . "Content-Type: {$photo['type']}; name=\"{$photo['nom']}\"\r\n"
        . "Content-Transfer-Encoding: base64\r\n"
        . "Content-Disposition: attachment; filename=\"{$photo['nom']}\"\r\n\r\n"
        . chunk_split(base64_encode($photo['contenu'])) . "\r\n";
}
$message .= "--{$frontiere}--";

// Le cinquième paramètre force l'enveloppe d'expédition sur le domaine : sans lui,
// OVH envoie avec l'adresse technique du compte d'hébergement et le SPF échoue.
$envoye = mail(DESTINATAIRE, $sujet, $message, $entetes, '-f' . EXPEDITEUR);

rediriger($envoye ? PAGE_MERCI : PAGE_FORMULAIRE . '?erreur=envoi');
