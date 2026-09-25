# AvenTP — site vitrine

Site vitrine d'AvenTP, entreprise de **paysagisme et terrassement**. Sobre, sombre, orienté
photos de chantiers et demande de devis.

## Façon de travailler

- Répondre **en français**, de façon **pédagogique** : le propriétaire est en M2 IA/algorithmique,
  expliquer les choix techniques (le « pourquoi »), pas seulement le « quoi ».
- Changements **petits et ciblés** : ne modifier que ce qui est demandé. En cas de doute sur une
  intention visuelle, demander avant de refaire une section entière.
- Avant de dire « c'est fait » : `npx astro check` (0 erreur) et `npm run build` doivent passer.
  Pour un changement visuel, vérifier le rendu à **390, 768, 1024, 1440 et 1920 px** (responsive).
- Ne jamais inventer d'informations sur l'entreprise : les inconnues restent entre crochets
  (`[TÉLÉPHONE]`, `[Ville]`, `[Année]`…).
- Git : un commit par changement cohérent, message en français. Pour annuler un commit déjà
  poussé, utiliser `git revert` (jamais `reset` + force-push).

## Stack

- **Astro 7** (site 100 % statique) + **Tailwind CSS 4** (plugin Vite, config dans le CSS via `@theme`).
- Node ≥ 22.12. Polices locales via Fontsource (Space Grotesk titres, Work Sans texte).
- `embla-carousel` (diaporama), `d3-delaunay` + `clipper-lib` (mosaïque, calcul au build).

```bash
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # sert dist/
npx astro check  # types
```

## Organisation

```
src/
├─ pages/index.astro          accueil : hero, « Ce que nous réalisons » (mosaïque), diaporama, bandeau, contact
├─ pages/realisations.astro   grille de chantiers + filtres par catégorie (hash d'URL : /realisations#allees)
├─ layouts/BaseLayout.astro   <head>, en-tête, pied de page, View Transitions, apparition au scroll
├─ components/                Header, Footer, Mosaic, Carousel, ProjectCard, CtaBand, Contact, Icon…
├─ content/realisations/*.md  une fiche par chantier (schéma Zod dans src/content.config.ts)
├─ data/site.ts               coordonnées, réseaux, menu, catégories (source unique)
├─ data/mosaic.ts             réglages de l'allée en mosaïque (desktop + mobile)
├─ lib/mosaic.ts              générateur de la mosaïque
├─ styles/global.css          thème Tailwind, utilitaires maison (@utility btn, eyebrow…), texture pierre
└─ assets/img/                photos (JPEG) + illustrations provisoires (illu-*.svg)
```

Ajouter un chantier = ajouter une photo + un fichier Markdown ; filtres, compteurs et diaporama
(`featured: true`) se mettent à jour seuls.

## Design — contraintes

- Palette : **noir `#000` dominant**, blanc pour le texte, accent **`#49c5b6`** (token `accent`).
  L'accent ne sert JAMAIS de couleur de texte sur fond clair (contraste 2,1:1) ; sur noir il est OK (≈ 10:1).
  Texte posé sur un fond accent : noir.
- Sobre : pas de dégradés décoratifs, pas d'emoji, icônes en SVG trait (`components/Icon.astro`).
- Accessibilité : vrais `<button>`/`<a>`, `aria-*` sur les contrôles, cibles ≥ 44 px,
  `prefers-reduced-motion` respecté, contenu visible sans JS.
- Images via `<Image>` d'`astro:assets` (WebP + `srcset` générés au build).

## La mosaïque (section « Ce que nous réalisons »)

Allée de dalles irrégulières qui s'emboîtent ; les 5 réalisations types (Allées, Terrasses, Jardins,
Clôtures, Piscines) sont des dalles photo cliquables vers `/realisations#<catégorie>`.
Pipeline (`src/lib/mosaic.ts`, exécuté au build, déterministe via `graine`) :

1. spline de Catmull-Rom par les `points`, épaissie de `largeur` → contour de l'allée ;
2. dalles photo posées d'abord (polygone irrégulier autour de chaque point) ;
3. graines des petites dalles : échantillonnage de Poisson (`espacement`), hors dalles photo ;
4. Voronoï (d3-delaunay), arêtes cassées de façon identique des deux côtés (`decoupe`,
   hachage FNV de l'arête), découpe « allée − dalles photo » ;
5. rétrécissement de `joint/2` puis arrondi (`clipper-lib`, coordonnées ×100 car Clipper est entier) ;
6. sortie en `clip-path` en **pourcentages** + `aspect-ratio` → s'adapte à la largeur.

Deux configurations dans `src/data/mosaic.ts` : `allee` (≥ md, S horizontal) et `alleeMobile`
(vertical). L'allée reste **contenue dans sa section**, sur fond noir.

Essais abandonnés (voir `git log`) : allée qui remonte dans la photo d'accueil avec fondu (10feed9),
allée qui sort par les côtés de la page (c7504a2) — rejetés car ils s'adaptaient mal aux tailles
d'écran. Ne pas les réintroduire sans demande explicite.

## Points ouverts connus

- En haut à gauche et à droite, les bouts du S touchent le bord supérieur de la zone et sont
  coupés à plat (impression de débordement) → à fermer proprement si demandé.
- Au-delà d'environ 1600 px, la mosaïque grossit avec la largeur (photos très grandes) → plafonner ?
- Vers 1024 px, le texte d'intro de la section peut frôler les dalles.

## Avant mise en ligne (TODO)

- Remplacer les valeurs entre crochets (`src/data/site.ts`, `index.astro`, fiches chantier).
- Vraies photos de chantiers à la place des `illu-*.svg` ; vérifier les droits des photos actuelles.
- Brancher le formulaire (`components/Contact.astro`, site statique → Formspree/Netlify Forms…).
- Vrai domaine dans `astro.config.mjs` (`site`) ; mentions légales + politique de confidentialité.
- Déploiement (Netlify / Vercel / Cloudflare Pages).
