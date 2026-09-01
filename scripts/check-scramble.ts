/**
 * Asserts every event produces a scramble the rest of the app can use.
 *
 * Run with `npm run check:scramble`.
 *
 * The thing worth checking is the join between the generators and the engine:
 * a scramble is only useful if the preview can parse it, and notation is exactly
 * the sort of thing that looks right and isn't — `U3w2` instead of `3Uw2` reads
 * fine in a list and fails the moment something tries to apply it.
 */
import { EVENTS, eventOf } from '../src/timer/events';
import { scrambleFor, scrambleText } from '../src/timer/scramble';
import { warmUp, isReady, randomStateScramble } from '../src/timer/scramble/twoByTwo';
import { solvedCube, stateAfter } from '../src/cube/nxn';

const failures: string[] = [];

function check(ok: boolean, message: string): void {
  if (!ok) failures.push(message);
}

/** Every WCA face token, wherever it sits in the string. */
function faceOfToken(token: string): string | null {
  const match = /[UDLRFB]/.exec(token);
  return match ? match[0] : null;
}

function checkEveryEvent(): void {
  for (const event of EVENTS) {
    for (let trial = 0; trial < 200; trial += 1) {
      const scramble = scrambleFor(event);
      const text = scrambleText(scramble);

      check(text.trim() !== '', `${event.id}: produced an empty scramble`);

      // Whatever the preview claims it can draw, it has to actually draw.
      if (event.preview === 'nxn') {
        check(event.size !== undefined, `${event.id}: previewable but has no size`);
        try {
          const state = stateAfter(event.size!, scramble.moves);
          const counts = new Map<string, number>();
          for (const colour of state) counts.set(colour, (counts.get(colour) ?? 0) + 1);
          for (const [colour, count] of counts) {
            check(
              count === event.size! * event.size!,
              `${event.id}: ${count} ${colour} stickers, want ${event.size! * event.size!}`,
            );
          }
        } catch (error) {
          failures.push(`${event.id}: preview cannot parse "${scramble.moves.join(' ')}" — ${(error as Error).message}`);
        }
      }

      // Only blindfolded events get a reorientation, and it never lands in the moves.
      const expectsRotation = event.id.endsWith('bf');
      check(
        (scramble.rotation.length > 0) === (expectsRotation && scramble.rotation.length > 0),
        `${event.id}: unexpected rotation ${scramble.rotation.join(' ')}`,
      );
      if (!expectsRotation) {
        check(scramble.rotation.length === 0, `${event.id}: should have no reorientation`);
      }
      // Only meaningful for cubes: clock's `y2` is part of its own notation,
      // an instruction to turn the puzzle over, not a cube reorientation.
      if (event.preview === 'nxn') {
        check(
          !scramble.moves.some((token) => /^[xyz]/.test(token)),
          `${event.id}: a rotation leaked into the move list`,
        );
      }

      // No scrambler should ever emit the same face twice running.
      let prev: string | null = null;
      for (const token of scramble.moves) {
        const face = faceOfToken(token);
        if (face && event.preview === 'nxn') {
          check(face !== prev, `${event.id}: repeated face in ${scramble.moves.join(' ')}`);
        }
        prev = face;
      }
    }
  }
}

/** A scramble that leaves the puzzle solved is not a scramble. */
function checkNotSolved(): void {
  for (const event of EVENTS.filter((item) => item.preview === 'nxn')) {
    const solved = solvedCube(event.size!).join('');
    let identical = 0;

    for (let trial = 0; trial < 100; trial += 1) {
      if (stateAfter(event.size!, scrambleFor(event).moves).join('') === solved) identical += 1;
    }
    check(identical === 0, `${event.id}: ${identical} scrambles left the puzzle solved`);
  }
}

/**
 * The 2x2 table, once it exists, has to give optimal solutions — which is
 * checkable without a second solver: the mean optimal solution length over the
 * whole state space is a published constant, near 8.76 moves.
 */
async function checkTwoByTwo(): Promise<void> {
  warmUp();
  await new Promise((resolve) => setTimeout(resolve, 50));
  check(isReady(), '2x2 table did not build');
  if (!isReady()) return;

  const solved = solvedCube(2).join('');
  let total = 0;
  const samples = 5000;

  for (let trial = 0; trial < samples; trial += 1) {
    const moves = randomStateScramble()!;
    total += moves.length;
    check(moves.length <= 11, `2x2 solution longer than God's number: ${moves.join(' ')}`);
    check(stateAfter(2, moves).join('') !== solved, `2x2 scramble did nothing: ${moves.join(' ')}`);
  }

  const mean = total / samples;
  check(
    mean > 8.5 && mean < 9.0,
    `2x2 mean optimal length ${mean.toFixed(2)}, expected about 8.76 — the solver is not optimal`,
  );
  console.log(`  2x2 mean optimal scramble length ${mean.toFixed(2)} over ${samples} samples`);
}

function checkEventTable(): void {
  for (const event of EVENTS) {
    check(eventOf(event.id).id === event.id, `${event.id}: not findable by its own id`);
    check(event.split === event.id.includes('bf'), `${event.id}: split disagrees with being blindfolded`);
    if (!event.inspection) {
      check(
        event.id.includes('bf') || event.id === '333fm',
        `${event.id}: skips inspection but is neither blindfolded nor FMC`,
      );
    }
  }
  check(eventOf('nonsense').id === '333', 'an unknown event id should fall back to 3x3');
}

checkEventTable();
checkEveryEvent();
checkNotSolved();
await checkTwoByTwo();

if (failures.length > 0) {
  console.error(`✗ ${failures.length} failure(s):`);
  for (const message of failures.slice(0, 20)) console.error(`  ${message}`);
  if (failures.length > 20) console.error(`  ... and ${failures.length - 20} more`);
  process.exit(1);
}

console.log(`✓ all ${EVENTS.length} events scramble, and every previewable one parses`);
