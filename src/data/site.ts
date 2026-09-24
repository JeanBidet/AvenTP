/**
 * Informations de l'entreprise, centralisées ici : un seul endroit à modifier.
 * Les valeurs entre crochets sont à remplacer par les vraies coordonnées.
 */
export const site = {
  name: "AvenTP",
  tagline: "Paysagisme · Terrassement",
  description:
    "AvenTP, entreprise de paysagisme et de terrassement : allées, terrasses, jardins, clôtures et abords de piscine.",
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

export const nav = [
  { label: "Accueil", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/#apropos" },
  { label: "Contact", href: "/#contact" },
] as const;

/** Catégories de réalisations : l'ordre ici est l'ordre des filtres. */
export const categories = {
  allees: "Allées",
  terrasses: "Terrasses",
  jardins: "Jardins",
  clotures: "Clôtures",
  piscines: "Piscines",
} as const;

export type Category = keyof typeof categories;
export const categoryIds = Object.keys(categories) as [Category, ...Category[]];
