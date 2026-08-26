import { useState, type KeyboardEvent } from 'react';
import type { Settings } from '../../settings/defaults';
import { blankEntry, type Field, type PairEntry, type PairStore } from './types';
import { buildFillQueue } from './scope';
import { suggestFor } from './suggester';

interface FillModeProps {
  store: PairStore;
  settings: Settings;
  field: Field;
  words: Record<string, string[]>;
  onChangeEntry: (entry: PairEntry) => void;
  onExit: () => void;
}

export default function FillMode({
  store, settings, field, words, onChangeEntry, onExit,
}: FillModeProps) {
  // Frozen at mount. If this rebuilt as you typed, the pair under your cursor
  // would drop out of the list and the next one would jump into its place.
  const [queue] = useState(() => buildFillQueue(store.pairs, settings, field));
  const [index, setIndex] = useState(0);

  function go(delta: number) {
    setIndex((prev) => Math.min(Math.max(prev + delta, 0), queue.length - 1));
  }

  if (queue.length === 0) {
    return (
      <div className="fill">
        <p className="fill-code">done</p>
        <p className="hint">Nothing left to fill for {field}.</p>
        <button className="ghost" onClick={onExit}>Back to grid</button>
      </div>
    );
  }

  const code = queue[index];
  const entry = store.pairs[code] ?? blankEntry(code);
  const suggestions = suggestFor(code, words);

  function accept(value: string) {
    onChangeEntry({ ...entry, [field]: value });
    go(1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === 'ArrowDown') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'Escape') {
      onExit();
    }
  }

  return (
    <div className="fill">
      <div className="fill-head">
        <span>{field} · {index + 1} of {queue.length}</span>
        <button className="ghost" onClick={onExit}>Done (Esc)</button>
      </div>

      <p className="fill-code">{code}</p>

      <input
        key={code}
        autoFocus
        className="fill-input"
        value={entry[field]}
        placeholder={`${field} for ${code}`}
        onChange={(event) => onChangeEntry({ ...entry, [field]: event.target.value })}
        onKeyDown={handleKeyDown}
      />

      <div className="fill-suggestions">
        {suggestions.length === 0 ? (
          <p className="hint">No starter list for {field} yet — type your own.</p>
        ) : (
          suggestions.map((suggestion) => (
            <button key={suggestion} className="suggestion" onClick={() => accept(suggestion)}>
              {suggestion}
            </button>
          ))
        )}
      </div>

      <p className="hint">Enter or ↓ next · ↑ back · click a suggestion to take it</p>
    </div>
  );
}