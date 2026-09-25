import type { MosaicConfig } from "../lib/mosaic";

/**
 * Forme de l'allée « Ce que nous réalisons ».
 * Modifier ces valeurs puis relancer `npm run dev` : la mosaïque est recalculée.
 *
 * Repère : (0, 0) = coin haut-gauche, x vers la droite, y vers le bas.
 * Il faut autant de `points` que de réalisations types (5).
 *
 * `depart` et `arrivee` sont hors de la zone : l'allée est tranchée net par le bord
 * qu'elle franchit, comme si elle continuait au-delà de la page.
 */

/**
 * Écrans ≥ 1280 px : allée horizontale, dessinée à l'échelle 1:1 (`taille="fixe"`
 * dans index.astro). Les unités ci-dessous sont donc des pixels réels : les dalles
 * font la même taille sur tous les écrans, et une fenêtre plus large montre une
 * allée plus longue, avec plus de pavés, au lieu d'une allée plus grosse.
 *
 * La zone fait 2560 de large pour couvrir les très grands écrans ; elle est centrée
 * et rognée. Les cinq dalles photo tiennent dans les 1280 px centraux (x de 640 à
 * 1920) pour rester visibles dès 1280 px ; de part et d'autre, l'allée continue en
 * pavés jusqu'aux bords.
 */
export const allee: MosaicConfig = {
  width: 2560,
  height: 800,
  depart: [-300, 430],
  points: [
    [775, 300],
    [1028, 520],
    [1280, 380],
    [1532, 250],
    [1785, 470],
  ],
  arrivee: [2860, 400],
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
 * Moins de 1280 px : allée verticale qui descend en serpentant, elle aussi dessinée à
 * l'échelle 1:1 (`taille="fixe"`) — les unités sont donc des pixels réels et les dalles
 * gardent la même taille d'un téléphone à l'autre.
 *
 * La zone fait 1280 de large, centrée et rognée ; l'allée n'en occupe que 480 au milieu
 * (x de 400 à 880). Un chemin vertical ne peut pas être pleine largeur à toutes les
 * largeurs d'écran à échelle fixe : il l'est jusqu'à 480 px, ce qui couvre les
 * téléphones, et au-delà il est centré avec du fond noir de part et d'autre.
 *
 * `depart` et `arrivee` sont au-dessus et en dessous de la zone : l'allée entre par le
 * bord haut de la section et sort par le bord bas.
 */
export const alleeMobile: MosaicConfig = {
  width: 1280,
  height: 1640,
  depart: [640, -260],
  points: [
    [620, 200],
    [660, 510],
    [620, 820],
    [660, 1130],
    [620, 1440],
  ],
  arrivee: [640, 1900],
  largeur: 450,
  espacement: 56,
  degagementPhoto: 240,
  joint: 9,
  arrondi: 4,
  lisere: 7,
  decoupe: 0.14,
  graine: 4,
};
