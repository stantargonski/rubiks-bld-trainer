import { useMemo } from 'react'
import { LETTERS, pieceOf, type Letter, type PieceKind } from '../../cube/speffz'
import type { Settings } from '../../settings/defaults'
import { blankEntry, cellLevel, hasImage, type PairEntry, type PairStore } from './types'
import { blindSets, pairFlag, nextEmptyCode, liveCodes, type PairFlag } from './scope'
import { suggestFor } from './suggester'
import { BUILT_IN_SUGGESTIONS } from './suggestions'
import PairEditor from './PairEditor'

const ALL_PAIRS = LETTERS.length * LETTERS.length - LETTERS.length
const pct = (part: number, whole: number) =>
  (whole === 0 ? 0 : Math.round((part / whole) * 100))

const FLAG_LABEL: Record<PairFlag, string> = {
  dead: 'never traced with these buffers',
  normal: '',
  flip: 'flipped edge',
  twist: 'twisted corner',
}

interface PairGridProps {
  store: PairStore
  settings: Settings
  onSettings: (next: Settings) => void
  selected: string | null
  onSelect: (code: string) => void
  onChangeEntry: (entry: PairEntry) => void
  onFill: () => void
}

export default function PairGrid({
  store, settings, onSettings, selected, onSelect, onChangeEntry, onFill,
}: PairGridProps) {
  const blind = useMemo(() => blindSets(settings), [settings]);
  const codes = useMemo(() => liveCodes(settings), [settings]);

  // Dead pairs are excluded from the numerator *and* the denominator —
  // otherwise changing buffers can print over 100%.
  const totals = useMemo(() => {
    let started = 0;
    for (const code of codes) {
      if (hasImage(store.pairs[code])) started += 1;
    }
    return { live: codes.length, started };
  }, [codes, store]);

  const percent = pct(totals.started, totals.live);

  const entry: PairEntry | null = selected
    ? (store.pairs[selected] ?? blankEntry(selected))
    : null;

  return (
    <div className="pairs-layout">
      <div className="grid-panel">
        <h2 className="panel-title">Coverage — first letter down, second across</h2>

        <div className="grid">
          <div className="head" />
          {LETTERS.map((letter) => (
            <div className="head" key={`col-${letter}`}>{letter}</div>
          ))}

          {LETTERS.map((first) => (
            <Row
              key={first}
              first={first}
              settings={settings}
              pairs={store.pairs}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div className="legend">
          <span><i className="swatch" style={{ background: 'var(--fill-0)' }} /> no image</span>
          <span><i className="swatch" style={{ background: 'var(--fill-1)' }} /> weak</span>
          <span><i className="swatch" style={{ background: 'var(--fill-2)' }} /> ok</span>
          <span><i className="swatch" style={{ background: 'var(--fill-3)' }} /> solid</span>
          <span><i className="swatch" style={{ background: 'var(--flag)' }} /> flip / twist pair</span>
          <span><i className="swatch" style={{ background: 'var(--dead)' }} /> never traced</span>
        </div>
      </div>
    <div className="side-stack">
      <aside className="panel method-panel">
        <h2 className="panel-title">Method</h2>

        <BufferPicker
          label="Corner buffer"
          kind="corner"
          value={settings.cornerBuffer}
          onChange={(letter) => onSettings({ ...settings, cornerBuffer: letter })}
        />
        <BufferPicker
          label="Edge buffer"
          kind="edge"
          value={settings.edgeBuffer}
          onChange={(letter) => onSettings({ ...settings, edgeBuffer: letter })}
        />

        <p className="blind">
          Dead letters — corners {blind.corner.join(' ')} · edges {blind.edge.join(' ')}
          <br />
          {totals.live} live pairs of {ALL_PAIRS}
        </p>

        <h2 className="panel-title" style={{ marginTop: 22 }}>Progress</h2>
        <div className="meter">
          <i style={{ width: `${percent}%` }} />
        </div>
        <div className="stat">
          <span>{totals.started} / {totals.live} pairs</span>
          <span>{percent}%</span>
        </div>
        <div className="actions">
          <button onClick={onFill}>Fill images</button>
        </div>
      </aside>

      <aside className="panel editor-panel">
        {entry ? (
          <PairEditor
            key={entry.code}
            entry={entry}
            flagLabel={FLAG_LABEL[pairFlag(entry.code[0] as Letter, entry.code[1] as Letter, settings)]}
            suggestions={suggestFor(entry.code, BUILT_IN_SUGGESTIONS)}
            onChange={onChangeEntry}
            onNext={() => {
              const next = nextEmptyCode(entry.code, store.pairs, settings);
              if (next) onSelect(next);
            }}
          />
        ) : (
          <p className="stub" style={{ marginTop: 24 }}>Pick a cell to see its pair.</p>
        )}
      </aside>
    </div>
   </div>
  );
}

interface BufferPickerProps {
  label: string
  kind: PieceKind
  value: Letter
  onChange: (letter: Letter) => void
}
function BufferPicker({ label, kind, value, onChange }: BufferPickerProps) {
  return (
    <label className="picker">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as Letter)}>
        {LETTERS.map((letter) => (
          <option key={letter} value={letter}>
            {letter} — {pieceOf(letter, kind).name}
          </option>
        ))}
      </select>
    </label>
  );
}

interface RowProps {
  first: Letter
  settings: Settings
  pairs: Record<string, PairEntry>
  selected: string | null
  onSelect: (code: string) => void
}
function Row({ first, settings, pairs, selected, onSelect }: RowProps) {
  return (
    <>
      <div className="head">{first}</div>
      {LETTERS.map((second) => {
        const code = first + second;
        const flag = pairFlag(first, second, settings);

        if (flag === 'dead') {
          return <div className="cell dead" key={code} title={`${code} — ${FLAG_LABEL.dead}`} />;
        }

        const level = cellLevel(pairs[code]);
        const classes = [
          'cell',
          `f${level}`,
          flag === 'normal' ? '' : 'flagged',
          selected === code ? 'selected' : '',
        ].filter(Boolean).join(' ');

        const image = pairs[code]?.image.trim();
        const title = [
          code,
          image || 'no image',
          flag === 'normal' ? '' : flag,
        ].filter(Boolean).join(' — ');

        return (
          <button
            key={code}
            className={classes}
            title={title}
            onClick={() => onSelect(code)}
          />
        );
      })}
    </>
  );
}