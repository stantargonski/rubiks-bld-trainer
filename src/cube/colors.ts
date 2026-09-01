import type { Face } from './moves';

/**
 * The standard western scheme — white on top, yellow underneath, green front,
 * blue back, red right, orange left. This is the arrangement every scramble
 * image on the internet uses, so a preview drawn any other way would be one
 * more thing to translate mid-solve.
 *
 * Indirected through CSS variables rather than hex literals so a theme can
 * restyle the cube along with everything else, and so a colourblind palette is
 * a settings change rather than a code change.
 */
export const FACE_COLOR: Record<Face, string> = {
  U: 'var(--cube-u)',
  R: 'var(--cube-r)',
  F: 'var(--cube-f)',
  D: 'var(--cube-d)',
  L: 'var(--cube-l)',
  B: 'var(--cube-b)',
};
