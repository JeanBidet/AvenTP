import type { MosaicConfig } from "../lib/mosaic";

/**
 * Forme de l'allée « Ce que nous réalisons ».
 * Modifier ces valeurs puis relancer `npm run dev` : la mosaïque est recalculée.
 *
 * Repère : (0, 0) = coin haut-gauche, x vers la droite, y vers le bas,
 * dans une zone de `width` × `height` (redimensionnée ensuite à l'écran).
 * Il faut autant de `points` que de réalisations types (5).
 */

/** Écrans ≥ 768 px : allée horizontale en S */
export const allee: MosaicConfig = {
  width: 1440,
  height: 1000,
  points: [
    [210, 200],
    [380, 465],
    [745, 380],
    [950, 185],
    [1235, 380],
  ],
  largeur: 355,
  espacement: 70,
  degagementPhoto: 190,
  joint: 12,
  arrondi: 5,
  lisere: 9,
  decoupe: 0,
  graine: 7,
};

/** Téléphones : allée verticale qui descend en serpentant */
export const alleeMobile: MosaicConfig = {
  width: 400,
  height: 1640,
  points: [
    [185, 200],
    [215, 510],
    [185, 820],
    [215, 1130],
    [185, 1440],
  ],
  largeur: 390,
  espacement: 56,
  degagementPhoto: 190,
  joint: 9,
  arrondi: 4,
  lisere: 7,
  decoupe: 0.14,
  graine: 3,
};
