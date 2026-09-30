# AvenTP — site vitrine

Site vitrine d'AvenTP (paysagisme et terrassement), construit avec
[Astro](https://astro.build) et [Tailwind CSS](https://tailwindcss.com).
Le site est **statique** : `npm run build` produit des fichiers HTML/CSS/JS
dans `dist/`, hébergeables n'importe où (Netlify, Vercel, Cloudflare Pages, GitHub Pages…).

## Démarrer

```bash
npm install
npm run dev      # serveur de dev sur http://localhost:4321
npm run build    # génère le site dans dist/
npm run preview  # sert dist/ en local pour vérifier le build
npm run check    # vérification TypeScript des fichiers .astro
```

Node ≥ 22.12 requis.

## Organisation

```
src/
├─ assets/img/            photos et illustrations (optimisées au build : WebP, plusieurs tailles)
├─ components/            briques réutilisables (Header, Footer, Carousel, ProjectCard, Contact…)
├─ content/realisations/  un fichier Markdown par chantier
├─ content.config.ts      schéma des fiches chantier (validé au build)
├─ data/site.ts           coordonnées, réseaux sociaux, menu, catégories
├─ layouts/               BaseLayout (<head>, en-tête, pied de page) et TextLayout (pages de texte)
├─ pages/                 une page = une URL (index → /, services, a-propos, devis, realisations…)
└─ styles/global.css      thème Tailwind (couleurs, polices) et utilitaires maison
```

## Ajouter un chantier

1. Déposer la photo dans `src/assets/img/`.
2. Créer `src/content/realisations/mon-chantier.md` :

   ```md
   ---
   title: "Terrasse en pierre"
   category: terrasses        # allees | terrasses | jardins | clotures | piscines
   city: "Nantes"
   year: "2026"
   image: ../../assets/img/terrasse-pierre.jpg
   alt: "Terrasse en pierre naturelle avec salon de jardin"
   featured: true             # true = apparaît dans le diaporama de l'accueil
   order: 1                   # plus petit = affiché en premier
   ---
   ```

La page Réalisations, ses filtres et leurs compteurs se mettent à jour
automatiquement. Une catégorie inconnue ou une image introuvable fait échouer
le build avec un message explicite.

## Thème

Les couleurs sont déclarées une seule fois dans `src/styles/global.css` (`@theme`) :
noir `#000`, blanc `#fff`, accent `#49c5b6`. L'accent sert de fond, de trait ou de
texte **sur fond noir** (contraste ≈ 10:1), jamais de texte sur fond blanc (≈ 2,1:1).

## Le formulaire de devis

Le site est statique, mais l'hébergement web OVH exécute PHP : le formulaire est donc
reçu par **`public/envoi.php`**, déposé avec le reste du site. Aucun service tiers
n'intervient, ce qui évite l'abonnement que facturent les relais de formulaires pour
les pièces jointes, et leur plafond de 5 à 10 Mo.

- Les photos sont **réduites dans le navigateur** (2400 px sur le grand côté, JPEG
  qualité 0,85) avant l'envoi, puis jointes à l'email. Huit au maximum.
- Les limites PHP sont dans **`public/.user.ini`** (fichier lu par OVH). Si l'envoi
  échoue sur des photos volumineuses, c'est `upload_max_filesize` et `post_max_size`
  qu'il faut remonter — `post_max_size` doit rester supérieur au total attendu, sinon
  PHP vide la requête sans prévenir.
- Le script demande **PHP 8.1 ou plus** (type de retour `never`). La version PHP se
  choisit dans l'espace client OVH ou via un fichier `.ovhconfig`.
- En cas de refus, `envoi.php` renvoie sur `/devis/?erreur=…` et la page affiche le
  message correspondant.

Pour tester en local, un serveur PHP suffit :

```bash
npm run build
php -S localhost:8000 -t dist   # le formulaire fonctionne, l'envoi dépend du système
```

## À faire avant la mise en ligne

Ce qui demande des informations que seule l'entreprise a :

- **Remplacer les valeurs entre crochets.** `src/data/site.ts` (téléphone, courriel,
  adresse), `public/envoi.php` (adresses d'envoi), `src/pages/a-propos.astro`
  (prénom, fonction, parcours, années, chiffres, qualifications, assurances,
  matériel, citation, et la photo de portrait à déposer dans `src/assets/img/`),
  `src/pages/index.astro` (phrase d'accroche du bandeau
  d'accueil, présentation courte), `src/pages/services.astro` (gratuité et délai du
  premier rendez-vous, zone d'intervention, DT-DICT, échantillons, validité du devis,
  acompte, délais de chantier, garantie décennale), `src/pages/mentions-legales.astro` (raison sociale,
  forme juridique, capital, SIREN/SIRET, RCS, TVA, responsable de publication,
  hébergeur, assurances, médiateur de la consommation),
  `src/pages/confidentialite.astro` (durées de conservation, hébergeur) et les
  fiches de `src/content/realisations/`
  (`[Ville]`, `[Année]`).
- **Valider les tranches de budget** du formulaire (`src/pages/devis.astro`, tableau
  `budgets`) : ce sont des propositions, et elles annoncent implicitement un
  positionnement tarifaire.
- **Renseigner les deux adresses de `public/envoi.php`** : `DESTINATAIRE` (la boîte
  qui reçoit les demandes) et `EXPEDITEUR`, qui doit être une adresse **du domaine
  hébergé chez OVH**. Une adresse extérieure (gmail, orange…) ferait passer le
  message pour une usurpation et l'enverrait en indésirables. Envoyer ensuite une
  demande de test avec des photos.
- **Remplacer les illustrations** `illu-*.svg` par de vraies photos de chantiers
  (deux des cinq dalles photo de l'accueil en sont encore), et s'assurer de détenir
  les droits sur toutes les photos.
- **Vérifier le domaine** dans `astro.config.mjs` (`site`). Il sert au sitemap, aux
  balises canoniques, à l'image de partage et à l'adresse de retour du formulaire :
  s'il est faux, le formulaire renvoie le visiteur au mauvais endroit.
- **Mettre à jour `Sitemap:`** dans `public/robots.txt` si le domaine change.
- **Renseigner les liens des réseaux sociaux** dans `site.socials` (ils pointent
  sur `#`), ou retirer les entrées inutiles.

Déjà en place : formulaire reçu par `public/envoi.php` avec page de confirmation `/merci`,
mentions légales et politique de confidentialité reliées au pied de page,
`sitemap-index.xml`, `robots.txt`, image de partage et balises Open Graph.
