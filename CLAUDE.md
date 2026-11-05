# AvenTP — site vitrine

Site vitrine d'AvenTP, entreprise de **terrassement et d'aménagement extérieur**. Sobre, sombre, orienté
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
- `embla-carousel` (diaporama), `@astrojs/sitemap` (sitemap au build).

```bash
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # sert dist/
npx astro check  # types
```
