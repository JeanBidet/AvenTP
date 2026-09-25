import type { MosaicConfig } from "../lib/mosaic";

/**
 * Forme de l'allée « Ce que nous réalisons ».
 * Modifier ces valeurs puis relancer `npm run dev` : la mosaïque est recalculée.
 *
 * Repère : (0, 0) = coin haut-gauche, x vers la droite, y vers le bas,
 * dans une zone de `width` × `height` (redimensionnée ensuite à l'écran).
 * Il faut autant de `points` que de réalisations types (5).
 *
 * Les deux bouts de l'allée sont arrondis et doivent tenir dans la zone :
 * garder le premier et le dernier point à au moins `largeur / 2 + joint`
 * des bords vers lesquels ils pointent, sinon le bout est rogné à plat.
 */

/** Écrans ≥ 768 px : allée horizontale ondulée, bouts arrondis dans la zone */
export const allee: MosaicConfig = {
  width: 1440,
  height: 800,
  points: [
    [320, 300],
    [550, 520],
    [790, 385],
    [1010, 250],
    [1185, 445],
  ],
  largeur: 355,
  espacement: 70,
  degagementPhoto: 190,
  joint: 12,
  arrondi: 5,
  lisere: 9,
  decoupe: 0,
  graine: 8,
};

/**
 * Téléphones : allée verticale qui descend en serpentant.
 * Plus large que la zone (390 pour 400) : elle est volontairement coupée sur ses
 * deux flancs, pleine largeur, mais ses bouts haut et bas restent arrondis.
 */
export const alleeMobile: MosaicConfig = {
  width: 400,
  height: 1700,
  points: [
    [185, 230],
    [215, 540],
    [185, 850],
    [215, 1160],
    [185, 1470],
  ],
  largeur: 390,
  espacement: 56,
  degagementPhoto: 240,
  joint: 9,
  arrondi: 4,
  lisere: 7,
  decoupe: 0.14,
  graine: 4,
};
