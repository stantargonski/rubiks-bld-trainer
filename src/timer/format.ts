/**
 * Speedcubing convention: truncate, never round — 12.999s is 12.99, not 13.00.
 * Minutes only appear once they exist, so most solves read "14.27".
 *
 * The two non-numbers come from stats.ts: Infinity is a DNF, NaN is "not enough
 * solves yet". Handling them here means no caller has to.
 */
export function formatTime(ms: number, decimals: 2 | 3 = 2): string {
  if (Number.isNaN(ms)) return '—';
  if (!Number.isFinite(ms)) return 'DNF';

  const unit = decimals === 3 ? 1 : 10;   // ms per displayed tick
  const perSecond = 1000 / unit;
  const ticks = Math.floor(ms / unit);

  const fraction = ticks % perSecond;
  const seconds = Math.floor(ticks / perSecond) % 60;
  const minutes = Math.floor(ticks / (perSecond * 60));

  const pad = minutes > 0 && seconds < 10 ? '0' : '';
  const tail = `${pad}${seconds}.${String(fraction).padStart(decimals, '0')}`;
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
