import type { MosaicConfig } from "../lib/mosaic";

/**
 * Forme de l'allée « Ce que nous réalisons ».
 * Modifier ces valeurs puis relancer `npm run dev` : la mosaïque est recalculée.
 *
 * Repère : (0, 0) = coin haut-gauche, x vers la droite, y vers le bas,
 * dans une zone de `width` × `height` (redimensionnée ensuite à l'écran).
 * Il faut autant de `points` que de réalisations types (5).
 */

/**
 * Grands écrans (≥ 1024 px) : l'allée sort de la photo d'accueil par la gauche,
 * serpente sous le titre et remonte dans la photo par la droite.
 * Les 360 premières unités (y < 360) passent sous la photo d'accueil (fondu) et
 * autour du titre, placé dans le creux entre les deux branches.
 */
export const allee: MosaicConfig = {
  width: 1440,
  height: 1250,
  depart: [120, -40],
  points: [
    [205, 670],
    [475, 955],
    [745, 670],
    [1010, 955],
    [1265, 670],
  ],
  arrivee: [1320, -40],
  largeur: 470,
  espacement: 70,
  degagementPhoto: 300,
  joint: 12,
  arrondi: 5,
  lisere: 9,
  decoupe: 0.14,
  graine: 7,
};

/**
 * Téléphones et tablettes : allée verticale qui sort de la photo d'accueil (fondu)
 * et descend en serpentant ; le titre est posé dans un encadré noir par-dessus.
 */
export const alleeMobile: MosaicConfig = {
  width: 400,
  height: 1880,
  depart: [200, -60],
  points: [
    [185, 440],
    [215, 750],
    [185, 1060],
    [215, 1370],
    [185, 1680],
  ],
  largeur: 390,
  espacement: 56,
  degagementPhoto: 240,
  joint: 9,
  arrondi: 4,
  lisere: 7,
  decoupe: 0.14,
  graine: 3,
};
