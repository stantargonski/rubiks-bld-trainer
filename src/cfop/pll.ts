import type { AlgCase } from './types';

/**
 * The 21 PLL cases.
 *
 * `group` is the recognition family, not a filing category — it's the question
 * you answer first when the case comes up (which corners swap, or none), and
 * it's what makes the set learnable in order rather than as 21 unrelated algs.
 *
 * Every alg here is checked by `npm run check:algs`, which runs the table
 * through src/cube/moves.ts and asserts three things: applied to a solved cube
 * each one leaves the U face uniform and the bottom two layers untouched (so it
 * really is a PLL), and all 21 land on distinct cases. Rotations are written
 * out and closed — an alg that ends the cube in a different orientation is a
 * bug the checker catches, not a style choice.
 *
 * Add a case by adding the alg and running the checker. `activeAlg` prefers
 * whatever you type in yourself, so your own alg is never checked — override
 * freely.
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
    alg: "x L2 D2 L' U' L D2 L' U L' x'" },
  { id: 'pll-ab', set: 'pll', name: 'Ab', group: 'corners only',
    alg: "x R2 D2 R U R' D2 R U' R x'" },
  { id: 'pll-e', set: 'pll', name: 'E', group: 'corners only',
    alg: "x' L' U L D' L' U' L D L' U' L D' L' U L D x" },

  // ----- adjacent corner swap: the two swapping corners share an edge -----
  { id: 'pll-t', set: 'pll', name: 'T', group: 'adjacent swap',
    alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: 'pll-ja', set: 'pll', name: 'Ja', group: 'adjacent swap',
    alg: "R' U L' U2 R U' R' U2 R L" },
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
    alg: "R' U R' U' y R' F' R2 U' R' U R' F R F y'" },
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
