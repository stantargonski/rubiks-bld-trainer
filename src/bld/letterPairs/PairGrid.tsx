import { useMemo } from 'react'
import { LETTERS, pieceOf, type Letter, type PieceKind } from '../../cube/speffz'
import type { Settings } from '../../settings/defaults'
import { FIELDS, blankEntry, filledCount , type PairEntry, type PairStore } from './types'
import { blindSets, pairFlag, type PairFlag } from './scope'

const ALL_PAIRS = LETTERS.length * LETTERS.length - LETTERS.length

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
}

export default function PairGrid({store, settings,onSettings, selected, onSelect,}: PairGridProps) {
  const blind = useMemo(() => blindSets(settings), [settings]);

  // One pass for both numbers. Dead pairs are excluded from the denominator
  // *and* the numerator — otherwise changing buffers can print over 100%.
  const totals = useMemo(() => {
    let live = 0;
    let done = 0;
    for (const first of LETTERS) {
      for (const second of LETTERS) {
        if (pairFlag(first, second, settings) === 'dead') continue;
        live += 1;
        done += filledCount(store.pairs[first + second]);
      }
    }
    return { live, done, fields: live * FIELDS.length };
  }, [settings, store]);

  const percent = totals.fields === 0
    ? 0
    : Math.round((totals.done / totals.fields) * 100);

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
          <span><i className="swatch" style={{ background: 'var(--fill-0)' }} /> 0 of 3</span>
          <span><i className="swatch" style={{ background: 'var(--fill-1)' }} /> 1 of 3</span>
          <span><i className="swatch" style={{ background: 'var(--fill-2)' }} /> 2 of 3</span>
          <span><i className="swatch" style={{ background: 'var(--fill-3)' }} /> complete</span>
          <span><i className="swatch" style={{ background: 'var(--flag)' }} /> flip / twist pair</span>
          <span><i className="swatch" style={{ background: 'var(--dead)' }} /> never traced</span>
        </div>
      </div>

      <aside className="side-panel">
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
        </p>

        <h2 className="panel-title" style={{ marginTop: 22 }}>Progress</h2>
        <div className="meter">
          <i style={{ width: `${percent}%` }} />
        </div>
        <div className="stat">
          <span>{totals.done} / {totals.fields} fields</span>
          <span>{percent}%</span>
        </div>
        <div className="stat">
          <span>{totals.live} live pairs</span>
          <span>of {ALL_PAIRS}</span>
        </div>

        {entry
          ? <Detail entry={entry} settings={settings} />
          : <p className="stub" style={{ marginTop: 24 }}>Pick a cell to see its pair.</p>}
      </aside>
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

        const level = filledCount(pairs[code]);
        const classes = [
          'cell',
          `f${level}`,
          flag === 'normal' ? '' : 'flagged',
          selected === code ? 'selected' : '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={code}
            className={classes}
            title={`${code} — ${level}/3${flag === 'normal' ? '' : ` — ${flag}`}`}
            onClick={() => onSelect(code)}
          />
        );
      })}
    </>
  );
}

function Detail({ entry, settings }: { entry: PairEntry; settings: Settings }) {
  const flag = pairFlag(entry.code[0] as Letter, entry.code[1] as Letter, settings);
  return (
    <div style={{ marginTop: 24 }}>
      <p className="code">{entry.code}</p>
      {flag !== 'normal' && <p className="kind">{FLAG_LABEL[flag]}</p>}
      <div className="rows">
        {FIELDS.map((field) => (
          <div className="row" key={field}>
            <b>{field}</b>
            <span className={entry[field] ? '' : 'empty'}>
              {entry[field] || 'empty'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}