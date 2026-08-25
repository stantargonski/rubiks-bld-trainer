// scope.ts — replaces isLivePair + scopedPairKind
import {
  LETTERS, blindStickers, breakInSticker, pieceOf,
  type Letter, type PieceKind,
} from '../../cube/speffz';
import type { Settings } from '../../settings/defaults';

export type PairFlag = 'dead' | 'normal' | 'flip' | 'twist';

export function blindSets(settings: Settings): { corner: Letter[]; edge: Letter[] } {
  return {
    corner: blindStickers(settings.cornerBuffer, 'corner'),
    edge: blindStickers(settings.edgeBuffer, 'edge'),
  };
}

export function activeLetters(settings: Settings): Letter[] {
  if (settings.scope === 'shared') return [...LETTERS];
  const blind = blindSets(settings);
  const dead = settings.scope === 'corners' ? blind.corner : blind.edge;
  return LETTERS.filter((letter) => !dead.includes(letter));
}

function reachable(
  first: Letter, second: Letter, kind: PieceKind, blind: Letter[],
): boolean {
  if (first === second) return false;

  const a = pieceOf(first, kind);
  const b = pieceOf(second, kind);

  // Different pieces: an ordinary target, unless either sticker is on the buffer.
  if (a !== b) return !blind.includes(first) && !blind.includes(second);

  // Same piece: only an in-place flip/twist produces this pair, and the tracer
  // always enters it on the break-in sticker — so only one of the two orders.
  if (blind.includes(first)) return false; // buffer twist: alg, not memo
  return first === breakInSticker(a);
}

export function pairFlag(first: Letter, second: Letter, settings: Settings): PairFlag {
  const blind = blindSets(settings);
  const asCorner = settings.scope !== 'edges'
    && reachable(first, second, 'corner', blind.corner);
  const asEdge = settings.scope !== 'corners'
    && reachable(first, second, 'edge', blind.edge);

  if (!asCorner && !asEdge) return 'dead';
  if (asCorner && pieceOf(first, 'corner') === pieceOf(second, 'corner')) return 'twist';
  if (asEdge && pieceOf(first, 'edge') === pieceOf(second, 'edge')) return 'flip';
  return 'normal';
}

export function livePairCount(settings: Settings): number {
  const letters = activeLetters(settings);
  let count = 0;
  for (const first of letters) {
    for (const second of letters) {
      if (pairFlag(first, second, settings) !== 'dead') count++;
    }
  }
  return count;
}