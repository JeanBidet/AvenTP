// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Nom de domaine du site. Il sert au sitemap, aux balises canoniques, à l'image
  // de partage et à l'adresse de retour du formulaire de contact : à vérifier avant
  // la mise en ligne, tout en dépend.
  site: "https://www.aventp.fr",
  integrations: [
    // Génère /sitemap-index.xml et /sitemap-0.xml au build, à partir des pages de src/pages.
    // /merci n'est qu'une confirmation d'envoi du formulaire : hors sitemap, et en
    // noindex dans la page elle-même.
    sitemap({ filter: (page) => !page.endsWith("/merci/") }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
