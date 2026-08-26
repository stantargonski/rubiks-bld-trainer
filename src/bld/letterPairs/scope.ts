import {
  LETTERS, blindStickers, breakInSticker, pieceOf,
  type Letter, type PieceKind,
} from '../../cube/speffz';
import type { Settings } from '../../settings/defaults';
import { filledCount, type Field, type PairEntry } from './types';

export type PairFlag = 'dead' | 'normal' | 'flip' | 'twist';

export function blindSets(settings: Settings): { corner: Letter[]; edge: Letter[] } {
  return {
    corner: blindStickers(settings.cornerBuffer, 'corner'),
    edge: blindStickers(settings.edgeBuffer, 'edge'),
  };
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
  const asCorner = reachable(first, second, 'corner', blind.corner);
  const asEdge = reachable(first, second, 'edge', blind.edge);

  if (!asCorner && !asEdge) return 'dead';
  if (asCorner && pieceOf(first, 'corner') === pieceOf(second, 'corner')) return 'twist';
  if (asEdge && pieceOf(first, 'edge') === pieceOf(second, 'edge')) return 'flip';
  return 'normal';
}

export function livePairCount(settings: Settings): number {
  let count = 0;
  for (const first of LETTERS) {
    for (const second of LETTERS) {
      if (pairFlag(first, second, settings) !== 'dead') count += 1;
    }
  }
  return count;
}

export function nextEmptyCode(
  fromCode: string | null,
  pairs: Record<string, PairEntry>,
  settings: Settings,
): string | null {
  const codes: string[] = []
  for (const first of LETTERS) {
    for (const second of LETTERS) {
      if (pairFlag(first, second, settings) !== 'dead') codes.push(first + second)
  }
 }
 const start = fromCode ? codes.indexOf(fromCode) + 1 : 0
 for ( let step = 0; step < codes.length; step += 1) {
  const code = codes[(start + step) % codes.length]
  if (filledCount(pairs[code]) === 0) return code
 }
 return null
}
/** Pairs still missing this field. Flip/twist pairs first — they are guaranteed. */
export function buildFillQueue(
  pairs: Record<string, PairEntry>,
  settings: Settings,
  field: Field,
): string[] {
  const flagged: string[] = [];
  const rest: string[] = [];

  for (const first of LETTERS) {
    for (const second of LETTERS) {
      const flag = pairFlag(first, second, settings);
      if (flag === 'dead') continue;

      const code = first + second;
      if ((pairs[code]?.[field] ?? '').trim() !== '') continue;

      if (flag === 'normal') rest.push(code);
      else flagged.push(code);
    }
  }

  return [...flagged, ...rest];
}