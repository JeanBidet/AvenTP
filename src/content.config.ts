import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { categoryIds } from "./data/site";

/**
 * Collection « realisations » : un fichier Markdown par chantier,
 * dans src/content/realisations/. Le schéma Zod valide chaque fiche au build :
 * une catégorie mal orthographiée ou une photo manquante fait échouer la
 * compilation avec un message clair, plutôt qu'un bug silencieux en ligne.
 */
const realisations = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/realisations" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(categoryIds),
      city: z.string().default("[Ville]"),
      year: z.string().default("[Année]"),
      image: image(),
      alt: z.string(),
      /** Affiché dans le diaporama de l'accueil */
      featured: z.boolean().default(false),
      /** Tri : plus petit = affiché en premier */
      order: z.number().default(100),
    }),
});

export const collections = { realisations };
