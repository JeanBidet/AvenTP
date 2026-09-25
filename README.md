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
├─ data/mosaic.ts         forme de l'allée en mosaïque (accueil)
├─ lib/mosaic.ts          générateur de la mosaïque (Voronoï), exécuté au build
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

## Modifier l'allée en mosaïque

La section « Ce que nous réalisons » est une allée de dalles qui s'emboîtent,
**calculée au build** par `src/lib/mosaic.ts` :

1. une spline de Catmull-Rom passe par les `points` ; épaissie de `largeur`, elle donne l'allée ;
2. une dalle photo irrégulière est posée sur chaque point ;
3. les graines des petites dalles sont tirées par échantillonnage de Poisson
   (au moins `espacement` entre elles), hors des dalles photo ;
4. leur diagramme de Voronoï (`d3-delaunay`), aux arêtes cassées en ligne brisée (`decoupe`),
   est découpé par « allée moins dalles photo » : tout l'espace est pavé, sans trou ;
5. chaque dalle est rétrécie de la moitié du `joint` puis arrondie (`clipper-lib`) ;
6. les polygones deviennent des `clip-path` en pourcentages, donc la mosaïque s'adapte à l'écran.

Les réglages sont dans `src/data/mosaic.ts` : `allee` (écrans ≥ 768 px) et `alleeMobile`.

| Réglage | Effet |
|---|---|
| `points` | tracé de l'allée ; une photo est centrée sur chaque point (5 points = 5 types) |
| `depart`, `arrivee` | optionnels : d'où vient l'allée et où elle va ; un point hors cadre (y < 0) la fait sortir de la zone |
| `largeur` | épaisseur de l'allée |
| `espacement` | taille des petites dalles (plus grand = moins de dalles, plus grosses) |
| `degagementPhoto` | taille des dalles photo (diamètre ≈ 1,25 × la valeur) |
| `decoupe` | irrégularité des bords : `0` = polygones droits, `0.25` = pierres très découpées |
| `joint`, `arrondi`, `lisere` | largeur des joints, arrondi des angles, bord de pierre autour des photos |
| `graine` | autre tirage aléatoire des petites dalles pour la même forme |

Sur grand écran, la zone commence 360 unités plus haut que la section : l'allée remonte
dans la photo d'accueil (marge négative `lg:-mt-[13.9%]` dans `index.astro`, fondu `fadeTop`)
et le titre est placé dans le creux entre les deux branches (`lg:top-[21%]`). Si vous
déplacez fortement les points, ajustez ces deux valeurs.

Modifier une valeur puis `npm run dev` : la page se recalcule. Exemple, une diagonale :
`points: [[150, 750], [450, 600], [750, 450], [1050, 300], [1320, 150]]`.

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
