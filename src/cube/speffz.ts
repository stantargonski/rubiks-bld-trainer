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

export const PIECES: Piece[] = [...CORNERS,...EDGES];

const PIECE_BY_STICKER: Record<string, Piece> = {};
for (const piece of PIECES) {
    for (const sticker of piece.stickers) {
        PIECE_BY_STICKER[sticker] = piece;
    }
}

export function pieceOf(letter: Letter): Piece {
    return PIECE_BY_STICKER[letter];
}

export type PairKind = 'normal' | 'flip' | 'twist' | 'impossible'

export function pairKind(first: Letter, second: Letter): PairKind {
    if (first === second) return 'impossible';
    const piece = pieceOf(first);
    if (!piece.stickers.includes(second)) return 'normal';
    return piece.kind === 'edge' ? 'flip' : 'twist';
}

export function isSamePiecePair(first: Letter, second: Letter): boolean {
    const kind = pairKind(first, second);
    return kind === 'flip' || kind === 'twist';
}

export const EDGE_BUFFER = {piece: 'DF', sticker: 'U' as Letter, partner: 'K' as Letter};
export const CORNER_BUFFER = {piece: 'ULB', sticker: 'A' as Letter};