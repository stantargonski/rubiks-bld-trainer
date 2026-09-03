import { useState } from 'react'
import {
  CUSTOM_THEME_ID, isDark, seedCustomTheme, THEMES,
  type Appearance, type CustomTheme, type Palette,
} from '../theme/theme'

/**
 * A palette of your own, one colour at a time.
 *
 * The stock themes are ten opinions; this is for everyone whose opinion is the
 * eleventh. It edits every colour the app has rather than the nine a theme is
 * built from — the clock's green and red and the six faces of the cube are in
 * here too, which makes a colourblind palette a thing you can sit down and make
 * rather than a feature someone has to add.
 *
 * Two controls per colour, deliberately. The swatch is for choosing one and the
 * field is for pasting one: a palette usually arrives from somewhere else as six
 * hex codes, and picking those out of a colour wheel by eye is not choosing them.
 */

interface Field {
  key: keyof Palette
  name: string
  hint?: string
}

const GROUPS: { title: string; note: string; fields: Field[] }[] = [
  {
    title: 'the app',
    note: 'The nine a stock theme is built from. Everything else is mixed out of these.',
    fields: [
      { key: 'bg', name: 'background', hint: 'behind everything' },
      { key: 'panel', name: 'panel', hint: 'the cards, the bars, the rail' },
      { key: 'panel2', name: 'inset', hint: 'boxes inside a panel' },
      { key: 'line', name: 'lines', hint: 'borders and rules' },
      { key: 'text', name: 'text' },
      { key: 'textDim', name: 'quiet text', hint: 'labels, captions, column heads' },
      { key: 'accent', name: 'accent', hint: 'the selected thing' },
      { key: 'accentInk', name: 'accent ink', hint: 'text sitting on the accent' },
      { key: 'dead', name: 'dead', hint: 'squares that are not in play' },
    ],
  },
  {
    title: 'what the clock is doing',
    note: 'Read at a glance from across a room, so these want to be unmistakable.',
    fields: [
      { key: 'go', name: 'ready', hint: 'held long enough to start' },
      { key: 'holding', name: 'holding', hint: 'and DNF, and every delete button' },
      { key: 'flag', name: 'flag', hint: 'a letter pair worth a second look' },
    ],
  },
  {
    title: 'the cube',
    note: 'The scramble picture. Worth changing for a stickerless cube, or for any pair of these you cannot tell apart.',
    fields: [
      { key: 'cubeU', name: 'up' },
      { key: 'cubeD', name: 'down' },
      { key: 'cubeF', name: 'front' },
      { key: 'cubeB', name: 'back' },
      { key: 'cubeR', name: 'right' },
      { key: 'cubeL', name: 'left' },
    ],
  },
]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * The hex box beside a swatch.
 *
 * Its text is local rather than read straight off the palette, because a
 * controlled field would erase every half-typed colour: `#e0` is not a colour,
 * so nothing would be stored, so the field would snap back to what it was
 * before the second character landed.
 *
 * It still has to follow the palette when the palette moves underneath it —
 * pressing "start from Paper" changes eighteen colours at once, and a box left
 * showing the old one is a box lying about what it controls.
 */
function HexField({ value, label, onChange }: {
  value: string
  label: string
  onChange: (next: string) => void
}) {
  const [text, setText] = useState(value)
  // Adjusted during the render that brings the new colour in, rather than in an
  // effect afterwards: an effect would paint the stale value first and correct
  // it a frame later, which on eighteen fields at once is a visible flicker.
  const [shown, setShown] = useState(value)
  if (value !== shown) {
    setShown(value)
    setText(value)
  }

  return (
    <input
      type="text"
      spellCheck={false}
      aria-label={`${label} as hex`}
      value={text}
      onChange={(change) => {
        const next = change.target.value.trim()
        setText(next)
        if (HEX.test(next)) onChange(next)
      }}
    />
  )
}

export default function ThemeEditor({ appearance, onAppearance }: {
  appearance: Appearance
  onAppearance: (next: Appearance) => void
}) {
  // Seeded from whatever is currently on screen rather than from stock: opening
  // this to warm up one colour of Nord should not throw the other seventeen away.
  const theme = appearance.customTheme
    ?? seedCustomTheme(appearance.themeId === CUSTOM_THEME_ID ? THEMES[0].id : appearance.themeId)

  /** Any edit also selects the custom theme — there is nothing else it could mean. */
  function set(next: Partial<CustomTheme>) {
    onAppearance({
      ...appearance,
      themeId: CUSTOM_THEME_ID,
      customTheme: { ...theme, ...next },
    })
  }

  function setColor(key: keyof Palette, value: string) {
    if (!HEX.test(value)) return
    // The light/dark flag follows the background until you say otherwise, so the
    // scrollbars and the native selects turn over with the palette rather than
    // needing a second thought.
    set(key === 'bg' ? { bg: value, dark: isDark(value) } : { [key]: value })
  }

  return (
    <div className="theme-editor">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <p>{group.note}</p>

          <div className="swatch-grid">
            {group.fields.map((field) => (
              <label key={field.key} className="swatch-field">
                <span className="swatch-name">
                  {field.name}
                  {field.hint && <i>{field.hint}</i>}
                </span>
                <span className="swatch-controls">
                  <input
                    type="color"
                    value={expand(theme[field.key])}
                    onChange={(change) => setColor(field.key, change.target.value)}
                  />
                  <HexField
                    value={theme[field.key]}
                    label={field.name}
                    onChange={(next) => setColor(field.key, next)}
                  />
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h3>light or dark</h3>
        <p>
          Sets the scrollbars and the drop-downs the browser draws itself, which
          this palette cannot reach. Guessed from the background each time you
          change it; press to disagree.
        </p>
        <div className="choice">
          <button
            type="button"
            aria-pressed={theme.dark}
            onClick={() => set({ dark: !theme.dark })}
          >
            {theme.dark ? 'dark' : 'light'}
          </button>
        </div>
      </section>

      <div className="actions">
        {/* Ten starting points, which is a great deal less work than eighteen
            colours from nothing. Overwrites the palette rather than merging, so
            it is a fresh start and not a half-applied theme. */}
        {THEMES.map((stock) => (
          <button
            key={stock.id}
            type="button"
            onClick={() => onAppearance({
              ...appearance,
              themeId: CUSTOM_THEME_ID,
              customTheme: seedCustomTheme(stock.id),
            })}
          >
            start from {stock.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/** `<input type="color">` only understands the six-digit form. */
function expand(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (!short) return value

  const [, red, green, blue] = short
  return `#${red}${red}${green}${green}${blue}${blue}`
}
