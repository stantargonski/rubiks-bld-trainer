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

/**
 * The same cube seen the way alg sheets draw the last layer: yellow on top.
 *
 * An x2 of the standard scheme, so it is a real cube rather than a recolouring
 * — every sticker is where a legal rotation would put it. Yellow is on top
 * because that is where it is when you get to the last layer with a white
 * cross, and a diagram that disagrees with the cube in your hands is one more
 * thing to translate at exactly the moment you can least afford to.
 */
export const LAST_LAYER_COLOR: Record<Face, string> = {
  U: 'var(--cube-d)',
  D: 'var(--cube-u)',
  F: 'var(--cube-b)',
  B: 'var(--cube-f)',
  L: 'var(--cube-l)',
  R: 'var(--cube-r)',
};
