/**
 * Speedcubing convention: truncate, never round — 12.999s is 12.99, not 13.00.
 * Minutes only appear once they exist, so most solves read "14.27".
 *
 * The two non-numbers come from stats.ts: Infinity is a DNF, NaN is "not enough
 * solves yet". Handling them here means no caller has to.
 */
export type Decimals = 0 | 1 | 2 | 3;

export function formatTime(ms: number, decimals: Decimals = 2): string {
  if (Number.isNaN(ms)) return '—';
  if (!Number.isFinite(ms)) return 'DNF';

  const unit = 10 ** (3 - decimals);      // ms per displayed tick
  const perSecond = 1000 / unit;
  const ticks = Math.floor(ms / unit);

  const fraction = ticks % perSecond;
  const seconds = Math.floor(ticks / perSecond) % 60;
  const minutes = Math.floor(ticks / (perSecond * 60));

  const pad = minutes > 0 && seconds < 10 ? '0' : '';
  // At zero places there is no fraction to separate, so there is no point either.
  const tail = decimals === 0
    ? `${pad}${seconds}`
    : `${pad}${seconds}.${String(fraction).padStart(decimals, '0')}`;
  return minutes > 0 ? `${minutes}:${tail}` : tail;
}

/**
 * The other direction, for a goal you type: "18.42", "1:23.4" and "83" all
 * parse. NaN means it isn't a time yet — which formatTime renders as an em
 * dash, so a half-typed goal shows as nothing rather than as a wrong number.
 */
export function parseTime(text: string): number {
  const match = /^(?:(\d+):)?(\d+)(?:[.,](\d+))?$/.exec(text.trim());
  if (!match) return NaN;

  const [, minutes, seconds, fraction] = match;
  // Padded, not parsed: ".4" is four tenths, so it has to become 400ms, and
  // anything past milliseconds is precision the timer never had.
  const ms = (fraction ?? '').slice(0, 3).padEnd(3, '0');
  return (Number(minutes ?? 0) * 60 + Number(seconds)) * 1000 + Number(ms);
}
