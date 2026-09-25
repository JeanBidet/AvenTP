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

1. une spline de Catmull-Rom va de `depart` à `arrivee` en passant par les `points` ;
   épaissie de `largeur`, elle donne l'allée. `depart` et `arrivee` sont hors de la zone,
   donc l'allée est tranchée net par le bord qu'elle franchit, comme si elle continuait
   au-delà de la page ;
2. une dalle photo irrégulière est posée sur chaque point ;
3. les graines des petites dalles sont tirées par échantillonnage de Poisson
   (au moins `espacement` entre elles), hors des dalles photo ;
4. leur diagramme de Voronoï (`d3-delaunay`), aux arêtes cassées en ligne brisée (`decoupe`),
   est découpé par « allée moins dalles photo » : tout l'espace est pavé, sans trou ;
5. chaque dalle est rétrécie de la moitié du `joint` puis arrondie (`clipper-lib`) ;
6. les polygones deviennent des `clip-path` en pourcentages de la zone de dessin.

Les réglages sont dans `src/data/mosaic.ts` : `allee` (écrans ≥ 1280 px) et `alleeMobile`.

| Réglage | Effet |
|---|---|
| `width`, `height` | taille de la zone de dessin |
| `points` | tracé de l'allée ; une photo est centrée sur chaque point (5 points = 5 types) |
| `depart`, `arrivee` | par où l'allée entre et sort ; **hors de la zone**, sinon le bout arrondi se voit |
| `largeur` | épaisseur de l'allée |
| `espacement` | taille des petites dalles (plus grand = moins de dalles, plus grosses) |
| `degagementPhoto` | taille des dalles photo (diamètre ≈ 1,25 × la valeur) |
| `decoupe` | irrégularité des bords : `0` = polygones droits, `0.25` = pierres très découpées |
| `joint`, `arrondi`, `lisere` | largeur des joints, arrondi des angles, bord de pierre autour des photos |
| `graine` | autre tirage aléatoire des petites dalles pour la même forme |

### Deux échelles

Le composant `Mosaic` prend une prop `taille`. **Les deux allées utilisent `"fixe"`.**

- `taille="fixe"` : la zone est posée à sa taille **en pixels**, centrée, et rognée par la
  largeur de l'écran. Les unités de la config sont donc des pixels réels. Les dalles
  gardent la même taille partout, et un écran plus large montre **plus d'allée**, pas une
  allée plus grosse : de 63 dalles vues à 1280 px à 124 à 2560 px sur l'horizontale, de 70
  à 101 entre 320 et 480 px sur la verticale. La section garde une hauteur constante de
  `height` pixels — la verticale mesurait sinon 1 600 px de haut sur un téléphone mais
  5 200 px à 1 279 px de large.
- `taille="elastique"` : la zone s'étire à la largeur disponible et tout grossit ensemble,
  dalles photo comprises. Plus utilisé, gardé pour comparaison.

C'est ce qui fixe le palier `xl` (1280 px) entre les deux allées dans `index.astro` :
à l'échelle 1:1, cinq dalles photo de ~220 px ne tiennent pas dans une fenêtre plus
étroite. Les points sont donc placés dans les 1280 px centraux de la zone (x de 640 à
1920) pour que les cinq photos soient visibles dès 1280 px ; de part et d'autre, l'allée
continue en pavés jusqu'aux bords.

### Règles à respecter en déplaçant les points

- laisser au moins `1,25 × degagementPhoto` entre deux points voisins, sinon les dalles
  photo se touchent ;
- garder l'allée à plus de `largeur / 2` des bords haut et bas, sinon elle y est tranchée
  aussi et la coupe ne se lit plus comme une sortie de page ;
- en échelle fixe, garder les dalles photo dans la fenêtre la plus étroite prévue
  (ici x de 640 à 1920), sinon elles sortent du champ sur les petits écrans.

L'allée verticale entre par le bord haut de la section et sort par le bord bas. Elle
n'occupe que 490 px au milieu d'une zone de 1280, donc elle est pleine largeur jusqu'à
480 px d'écran — ce qui couvre les téléphones — et au-delà elle est centrée avec du fond
noir de part et d'autre. À échelle fixe, un chemin vertical ne peut pas être pleine
largeur à toutes les largeurs d'écran : c'est le compromis retenu.

Modifier une valeur puis `npm run dev` : la page se recalcule.

Si une petite dalle manque (tache sombre au milieu du pavage), c'est une cellule trop
fine supprimée par le seuil d'aire de `finish()` : changer `graine` plutôt que le seuil.

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
