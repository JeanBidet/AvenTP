/**
 * Informations de l'entreprise, centralisées ici : un seul endroit à modifier.
 * Les valeurs entre crochets sont à remplacer par les vraies coordonnées.
 */
export const site = {
  name: "AvenTP",
  tagline: "Terrassement · Aménagement extérieur",
  description:
    "AvenTP, entreprise de terrassement et d'aménagement extérieur : allées, terrasses, clôtures et abords de piscine.",
  phone: "[TÉLÉPHONE]",
  phoneHref: "tel:+33000000000",
  email: "[EMAIL]",
  address: "[ADRESSE, CODE POSTAL, VILLE]",
  socials: [
    { name: "Facebook", icon: "facebook", href: "#" },
    { name: "Instagram", icon: "instagram", href: "#" },
    { name: "LinkedIn", icon: "linkedin", href: "#" },
  ],
} as const;

/**
 * Vrai si la valeur a été renseignée, faux si c'est encore un emplacement
 * « [À COMPLÉTER] » ou un lien vide « # ». Sert à ne jamais publier une
 * information factice là où une machine la lirait (données structurées, liens).
 */
export const estRenseigne = (valeur: string) => !valeur.startsWith("[") && valeur !== "#";

export const nav = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/devis" },
] as const;

/** Catégories de réalisations : l'ordre ici est l'ordre des filtres. */
export const categories = {
  allees: "Allées",
  terrasses: "Terrasses",
  clotures: "Clôtures",
  piscines: "Piscines",
} as const;

export type Category = keyof typeof categories;
export const categoryIds = Object.keys(categories) as [Category, ...Category[]];
