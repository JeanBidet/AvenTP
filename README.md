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
├─ pages/                 une page = une URL (index → /, services, devis, realisations…)
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

## À faire avant la mise en ligne

Ce qui demande des informations que seule l'entreprise a :

- **Remplacer les valeurs entre crochets.** `src/data/site.ts` (téléphone, courriel,
  adresse, clé Web3Forms), `src/pages/index.astro` (phrase d'accroche du bandeau
  d'accueil, présentation courte), `src/pages/services.astro` (gratuité et délai du
  premier rendez-vous, zone d'intervention, DT-DICT, échantillons, validité du devis,
  acompte, délais de chantier, garantie décennale), `src/pages/mentions-legales.astro` (raison sociale,
  forme juridique, capital, SIREN/SIRET, RCS, TVA, responsable de publication,
  hébergeur, assurances, médiateur de la consommation),
  `src/pages/confidentialite.astro` (durées de conservation, hébergeur, localisation
  des serveurs de Web3Forms) et les fiches de `src/content/realisations/`
  (`[Ville]`, `[Année]`).
- **Souscrire l'offre payante Web3Forms si vous voulez recevoir les photos.** Les
  pièces jointes sont une fonction Pro : avec une clé gratuite, le reste du
  formulaire part normalement mais les photos ne sont pas transmises. Sans
  abonnement, retirer le bloc « Photos du terrain » de `src/pages/devis.astro`
  plutôt que de laisser un champ sans effet.
- **Valider les tranches de budget** du formulaire (`src/pages/devis.astro`, tableau
  `budgets`) : ce sont des propositions, et elles annoncent implicitement un
  positionnement tarifaire.
- **Créer la clé Web3Forms** sur [web3forms.com](https://web3forms.com) et la coller
  dans `site.formAccessKey`, puis envoyer un message de test : sans clé valide, le
  formulaire de contact ne part pas. Au premier test, vérifier que les cases
  « Type d'aménagement » cochées arrivent bien toutes dans l'email : elles
  partagent un même `name`, et tous les relais ne regroupent pas les valeurs
  multiples de la même façon.
- **Remplacer les illustrations** `illu-*.svg` par de vraies photos de chantiers
  (deux des cinq dalles photo de l'accueil en sont encore), et s'assurer de détenir
  les droits sur toutes les photos.
- **Vérifier le domaine** dans `astro.config.mjs` (`site`). Il sert au sitemap, aux
  balises canoniques, à l'image de partage et à l'adresse de retour du formulaire :
  s'il est faux, le formulaire renvoie le visiteur au mauvais endroit.
- **Mettre à jour `Sitemap:`** dans `public/robots.txt` si le domaine change.
- **Renseigner les liens des réseaux sociaux** dans `site.socials` (ils pointent
  sur `#`), ou retirer les entrées inutiles.

Déjà en place : formulaire relié à Web3Forms avec page de confirmation `/merci`,
mentions légales et politique de confidentialité reliées au pied de page,
`sitemap-index.xml`, `robots.txt`, image de partage et balises Open Graph.
