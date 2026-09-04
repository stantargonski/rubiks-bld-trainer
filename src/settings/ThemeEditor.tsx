import { useState } from 'react'
import ColorField from './ColorPicker'
import { parseColor } from '../theme/color'
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
 * A colour is a swatch and nothing else until you press it. Eighteen colours
 * each carrying a swatch and a text box was a form you had to read; eighteen
 * swatches is the palette itself, and the picker with its typing field is one
 * click away in ./ColorPicker.
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

export default function ThemeEditor({ appearance, onAppearance }: {
  appearance: Appearance
  onAppearance: (next: Appearance) => void
}) {
  /** Which colour's picker is open, if any. One at a time: two pickers over one
      grid is two answers to what you are editing. */
  const [openKey, setOpenKey] = useState<keyof Palette | null>(null)

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
    // Normalised on the way in, so an rgb value typed into the picker is stored
    // as the hex the rest of the app can read.
    const color = parseColor(value)
    if (!color) return

    // The light/dark flag follows the background until you say otherwise, so the
    // scrollbars and the native selects turn over with the palette rather than
    // needing a second thought.
    set(key === 'bg' ? { bg: color, dark: isDark(color) } : { [key]: color })
  }

  return (
    <div className="theme-editor">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <h3>{group.title}</h3>
          <p>{group.note}</p>

          <div className="swatch-grid">
            {group.fields.map((field) => (
              <div key={field.key} className="swatch-field">
                <ColorField
                  value={theme[field.key]}
                  label={field.name}
                  open={openKey === field.key}
                  onOpen={(open) => setOpenKey(open ? field.key : null)}
                  onChange={(next) => setColor(field.key, next)}
                />
                <span className="swatch-name">
                  {field.name}
                  {field.hint && <i>{field.hint}</i>}
                </span>
              </div>
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
