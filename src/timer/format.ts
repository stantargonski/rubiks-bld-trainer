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
