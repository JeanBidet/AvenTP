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
├─ layouts/BaseLayout.astro  <head>, en-tête, pied de page, transitions
├─ pages/                 une page = une URL (index → /, realisations → /realisations)
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

- Remplacer les valeurs entre crochets (`[TÉLÉPHONE]`, `[Ville]`…) dans `src/data/site.ts`,
  `src/pages/index.astro` et les fiches chantier.
- Remplacer les illustrations (`illu-*.svg`) par de vraies photos de chantiers,
  et s'assurer de détenir les droits sur toutes les photos.
- Brancher le formulaire de contact (`src/components/Contact.astro`) sur un service
  d'envoi (Formspree, Netlify Forms, Web3Forms…).
- Renseigner le vrai domaine dans `astro.config.mjs` (`site`).
- Rédiger les mentions légales et la politique de confidentialité.
