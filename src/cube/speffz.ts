// Speffz: each face is lettered clockwise starting from its top-left sticker,
// viewed head-on, with white on U and green on F.
//   U = ABCD   L = EFGH   F = IJKL   R = MNOP   B = QRST   D = UVWX

export const LETTERS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
] as const;

export type Letter = (typeof LETTERS)[number];
export type PieceKind = 'corner' | 'edge';

export interface Piece {
    name: string;
    kind: PieceKind;
    stickers: Letter[];
}

export const CORNERS: Piece[] = [
  { name: 'ULB', kind: 'corner', stickers: ['A', 'E', 'R'] },
  { name: 'UBR', kind: 'corner', stickers: ['B', 'Q', 'N'] },
  { name: 'URF', kind: 'corner', stickers: ['C', 'M', 'J'] },
  { name: 'UFL', kind: 'corner', stickers: ['D', 'I', 'F'] },
  { name: 'DFL', kind: 'corner', stickers: ['U', 'L', 'G'] },
  { name: 'DFR', kind: 'corner', stickers: ['V', 'K', 'P'] },
  { name: 'DRB', kind: 'corner', stickers: ['W', 'O', 'T'] },
  { name: 'DBL', kind: 'corner', stickers: ['X', 'S', 'H'] },
];
export const EDGES: Piece[] = [
  { name: 'UB', kind: 'edge', stickers: ['A', 'Q'] },
  { name: 'UR', kind: 'edge', stickers: ['B', 'M'] },
  { name: 'UF', kind: 'edge', stickers: ['C', 'I'] },
  { name: 'UL', kind: 'edge', stickers: ['D', 'E'] },
  { name: 'FR', kind: 'edge', stickers: ['J', 'P'] },
  { name: 'FL', kind: 'edge', stickers: ['L', 'F'] },
  { name: 'BL', kind: 'edge', stickers: ['R', 'H'] },
  { name: 'BR', kind: 'edge', stickers: ['T', 'N'] },
  { name: 'DF', kind: 'edge', stickers: ['U', 'K'] },
  { name: 'DR', kind: 'edge', stickers: ['V', 'O'] },
  { name: 'DB', kind: 'edge', stickers: ['W', 'S'] },
  { name: 'DL', kind: 'edge', stickers: ['X', 'G'] },
];

function buildIndex(pieces: Piece[]): Record<Letter, Piece> {
  const index = {} as Record<Letter, Piece>;
  for (const piece of pieces) {
    for (const sticker of piece.stickers) index[sticker] = piece;
  }
  return index;
}

export const CORNER_OF = buildIndex(CORNERS);
export const EDGE_OF = buildIndex(EDGES);

export function pieceOf(letter: Letter, kind: PieceKind): Piece {
  return kind === 'corner' ? CORNER_OF[letter] : EDGE_OF[letter];
}

export function breakInSticker(piece: Piece): Letter {
  return piece.stickers.reduce((best, sticker) =>
    LETTERS.indexOf(sticker) < LETTERS.indexOf(best) ? sticker : best,
  );
}

export function blindStickers(buffer: Letter, kind: PieceKind): Letter[] {
  return pieceOf(buffer, kind).stickers;
}

// export function faceOf(piece: Piece, letter: Letter): string {
//   return piece.name[piece.stickers.indexOf(letter)];
// }
