import { formatTime } from '../timer/format'
import type { TimerSettings } from '../timer/settings'

/**
 * What the timer will look like, shown next to the switches that change it.
 *
 * Deliberately built from the timer's own class names inside a scaled wrapper,
 * rather than from a set of preview-only styles. A mock with its own stylesheet
 * starts out looking like the timer and drifts from it the first time either one
 * is touched; this one cannot drift, because it is the same CSS.
 */
export default function TimerPreview({ settings }: { settings: TimerSettings }) {
  const clock = settings.runningDisplay === 'hidden'
    ? 'solve'
    : formatTime(12_340, settings.decimals)

  return (
    <div className="timer-preview" aria-hidden="true">
      <div className="timer-preview-scale">
        <div className="timer-frame">
          {settings.showSolveList && (
            <aside className="timer-rail">
              <div className="rail-head">
                <span className="session-select">3x3x3 (24)</span>
              </div>
              <div className="rail-list">
                <ol className="solve-list">
                  {[12.34, 13.91, 11.08, 14.62, 12.77].map((time, index) => (
                    <li key={time}>
                      <span className="solve-row">
                        <span className="solve-n">{5 - index}</span>
                        <span className="solve-t">{time.toFixed(settings.decimals)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              {settings.showStats && (
                <div className="rail-stats">
                  <table className="stats">
                    <tbody>
                      <tr><th scope="row">ao5</th><td>12.88</td></tr>
                      <tr><th scope="row">ao12</th><td>13.20</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </aside>
          )}

          <div className="timer-main">
            {settings.showScramble && (
              <div className="scramble-bar">
                <div className="scramble-head"><span className="event-picker">3x3x3</span></div>
                <div className="scramble-body">
                  <span className="scramble-text">
                    {"D2 F' U R2 B L' F2 U'".split(' ').map((move, index) => (
                      <span key={index}>{move}</span>
                    ))}
                  </span>
                </div>
              </div>
            )}

            <div className="timer-stage">
              <div className="stage-clock">
                <div className="clock">{clock}</div>
                {settings.showAverages && (
                  <div className="averages">
                    <span>ao5 <b>12.88</b></span>
                    <span>ao12 <b>13.20</b></span>
                  </div>
                )}
              </div>
            </div>

            <div className="timer-dock">
              {settings.showCubeNet && (
                <div
                  className="scramble-preview"
                  style={{ width: settings.previewWidth, height: settings.previewHeight }}
                >
                  <span className="preview-title">3x3 scramble</span>
                  <div className="preview-body"><div className="preview-stub" /></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
