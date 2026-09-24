// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // À remplacer par le vrai nom de domaine (sert au sitemap et aux balises canoniques).
  site: "https://www.aventp.fr",
  vite: {
    plugins: [tailwindcss()],
  },
});
