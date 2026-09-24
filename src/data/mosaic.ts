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
 * Grands écrans (≥ 1024 px) : l'allée entre par le bord gauche de la page,
 * serpente en S sous le titre et sort par le bord droit.
 * `depart` et `arrivee` sont hors cadre (x < 0 et x > width) : l'allée est coupée
 * par les bords de la page, comme si elle continuait au-delà.
 */
export const allee: MosaicConfig = {
  width: 1440,
  height: 1000,
  depart: [-220, 580],
  points: [
    [210, 480],
    [480, 765],
    [745, 480],
    [1010, 765],
    [1235, 480],
  ],
  arrivee: [1660, 580],
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
 * Téléphones et tablettes : allée verticale qui entre par le bord gauche en haut,
 * descend en serpentant et sort par le bord droit en bas.
 */
export const alleeMobile: MosaicConfig = {
  width: 400,
  height: 1720,
  depart: [-260, 90],
  points: [
    [190, 300],
    [215, 610],
    [185, 920],
    [215, 1230],
    [190, 1510],
  ],
  arrivee: [660, 1740],
  largeur: 390,
  espacement: 56,
  degagementPhoto: 240,
  joint: 9,
  arrondi: 4,
  lisere: 7,
  decoupe: 0.14,
  graine: 3,
};
