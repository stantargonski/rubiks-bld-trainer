import type { AlgCase } from './types';

/**
 * The 21 PLL cases.
 *
 * `group` is the recognition family, not a filing category — it's the question
 * you answer first when the case comes up (which corners swap, or none), and
 * it's what makes the set learnable in order rather than as 21 unrelated algs.
 *
 * !! THE ALGORITHMS BELOW ARE NOT YET VERIFIED. !!
 *
 * Running each one through src/cube/moves.ts against a solved cube shows:
 *   - Ab and Ja are simply wrong — no closing rotation rescues them.
 *   - Aa, E and V are missing their closing rotation (x', x and y').
 *   - Z, Jb, the four G perms and several others come out with a U-layer
 *     rotation baked in, i.e. the alg leaves an AUF after it "solves".
 *
 * Do not drill from these until the table has been replaced from a trusted
 * source and re-checked with the engine. `activeAlg` already prefers whatever
 * you type in yourself, so overriding one is the safe path meanwhile.
 */
export const PLL_CASES: AlgCase[] = [
  // ----- edges only: all four corners already solved -----
  { id: 'pll-ua', set: 'pll', name: 'Ua', group: 'edges only',
    alg: "M2 U M U2 M' U M2" },
  { id: 'pll-ub', set: 'pll', name: 'Ub', group: 'edges only',
    alg: "M2 U' M U2 M' U' M2" },
  { id: 'pll-h', set: 'pll', name: 'H', group: 'edges only',
    alg: "M2 U M2 U2 M2 U M2" },
  { id: 'pll-z', set: 'pll', name: 'Z', group: 'edges only',
    alg: "M' U M2 U M2 U M' U2 M2" },

  // ----- corners only: all four edges already solved -----
  { id: 'pll-aa', set: 'pll', name: 'Aa', group: 'corners only',
    alg: "x L2 D2 L' U' L D2 L' U L'" },
  { id: 'pll-ab', set: 'pll', name: 'Ab', group: 'corners only',
    alg: "x L2 D2 L U L' D2 L U' L" },
  { id: 'pll-e', set: 'pll', name: 'E', group: 'corners only',
    alg: "x' L' U L D' L' U' L D L' U' L D' L' U L D" },

  // ----- adjacent corner swap: the two swapping corners share an edge -----
  { id: 'pll-t', set: 'pll', name: 'T', group: 'adjacent swap',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'pll-ja', set: 'pll', name: 'Ja', group: 'adjacent swap',
    alg: "x R2 F R F' R U2 R' U R U2 R'" },
  { id: 'pll-jb', set: 'pll', name: 'Jb', group: 'adjacent swap',
    alg: "R U R' F' R U R' U' R' F R2 U' R'" },
  { id: 'pll-ra', set: 'pll', name: 'Ra', group: 'adjacent swap',
    alg: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
  { id: 'pll-rb', set: 'pll', name: 'Rb', group: 'adjacent swap',
    alg: "R' U2 R U2 R' F R U R' U' R' F' R2" },
  { id: 'pll-f', set: 'pll', name: 'F', group: 'adjacent swap',
    alg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: 'pll-ga', set: 'pll', name: 'Ga', group: 'adjacent swap',
    alg: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
  { id: 'pll-gb', set: 'pll', name: 'Gb', group: 'adjacent swap',
    alg: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { id: 'pll-gc', set: 'pll', name: 'Gc', group: 'adjacent swap',
    alg: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
  { id: 'pll-gd', set: 'pll', name: 'Gd', group: 'adjacent swap',
    alg: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },

  // ----- diagonal corner swap: the swapping corners are across from each other -----
  { id: 'pll-v', set: 'pll', name: 'V', group: 'diagonal swap',
    alg: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
  { id: 'pll-y', set: 'pll', name: 'Y', group: 'diagonal swap',
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { id: 'pll-na', set: 'pll', name: 'Na', group: 'diagonal swap',
    alg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: 'pll-nb', set: 'pll', name: 'Nb', group: 'diagonal swap',
    alg: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
];

/** Recognition families in teaching order — easiest to hardest. */
export const PLL_GROUPS = [
  'edges only',
  'corners only',
  'adjacent swap',
  'diagonal swap',
] as const;
