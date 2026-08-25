import { useState } from 'react';
import { LETTERS, pairKind, type Letter} from '../../cube/speffz';
import { FIELDS, blankEntry, filledCount, type PairEntry} from './types'
import { loadStore } from './storage'

const TOTAL_PAIRS = LETTERS.length * LETTERS.length - LETTERS.length;
const TOTAL_FIELDS = TOTAL_PAIRS * FIELDS.length;

export default function PairGrid() {
    const [store] = useState(loadStore);
    const [selected, setSelected] = useState<string | null>(null);

    let done = 0;
    for (const code of Object.keys(store.pairs)) {
        done += filledCount(store.pairs[code]);
    }
    const percent = Math.round((done / TOTAL_FIELDS) * 100);

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
                    <div className="head" key={`col-${letter}`}>
                    {letter}
                    </div>
                ))}

                {LETTERS.map((first) => (
                <Row
                key={first}
                first={first}
                selected={selected}
                onSelect={setSelected}
                pairs={store.pairs}
                />
                ))}
                </div>

                <div className="legend">
                    <span><i className="swatch" style={{ background: 'var(--fill-0)' }} /> 0 of 3</span>
                    <span><i className="swatch" style={{ background: 'var(--fill-1)' }} /> 1 of 3</span>
                    <span><i className="swatch" style={{ background: 'var(--fill-2)' }} /> 2 of 3</span>
                    <span><i className="swatch" style={{ background: 'var(--fill-3)' }} /> complete</span>
                    <span><i className="swatch" style={{ background: 'var(--flag)' }} /> flip / twist pair</span>
                    <span><i className="swatch" style={{ background: 'var(--dead)' }} /> impossible</span>
                </div>
                </div>

                    <aside className="side-panel">
                        <h2 className="panel-title">Progress</h2>
                        <div className="meter">
                            <i style={{ width: `${percent}%` }} />
                        </div>
                        <div className="stat">
                            <span>{done} / {TOTAL_FIELDS} fields</span>
                            <span>{percent}%</span>
                        </div>

                        {entry ? <Detail entry={entry} /> : (
                            <p className="stub" style={{ marginTop: 24 }}>
                                Pick a cell to see its pair.
                            </p>
                        )}
                    </aside>
            </div>  
            );
}

interface RowProps {
    first: Letter;
    selected: string | null;
    onSelect: (code: string) => void;
    pairs: Record<string, PairEntry>;
}

function Row({ first, selected, onSelect, pairs}: RowProps) {
    return (
    <>
      <div className="head">{first}</div>
      {LETTERS.map((second) => {
        const code = first + second;
        const kind = pairKind(first, second);
        const level = filledCount(pairs[code]);
        if (kind === 'impossible') {
          return <div className="cell dead" key={code} title={`${code} — impossible`} />;
        }
        const classes = [
          'cell',
          `f${level}`,
          kind === 'normal' ? '' : 'flagged',
          selected === code ? 'selected' : '',
        ].filter(Boolean).join(' ');
        return (
          <button
            key={code}
            className={classes}
            title={`${code} — ${level}/3${kind === 'normal' ? '' : ` — ${kind}`}`}
            onClick={() => onSelect(code)}
          />
        );
      })}
    </> 
    );
}

function Detail({ entry }: { entry: PairEntry }) {
  const kind = pairKind(entry.code[0] as Letter, entry.code[1] as Letter);
  return (
    <div style={{ marginTop: 24 }}>
      <p className="code">{entry.code}</p>
      {kind !== 'normal' && (
        <p className="kind">{kind === 'flip' ? 'flipped edge' : 'twisted corner'}</p>
      )}
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