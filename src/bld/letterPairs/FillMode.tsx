import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Settings } from '../../settings/defaults';
import { blankEntry, IMAGE_TIP, type PairEntry, type PairStore } from './types';
import { buildFillQueue } from './scope';
import { suggestFor } from './suggester';
import Tip from './Tip'

interface FillModeProps {
  store: PairStore;
  settings: Settings;
  words: Record<string, string[]>;
  onChangeEntry: (entry: PairEntry) => void;
  onExit: () => void;
}

export default function FillMode({
  store, settings, words, onChangeEntry, onExit,
}: FillModeProps) {
  // Frozen at mount. If this rebuilt as you typed, the pair under your cursor
  // would drop out of the list and the next one would jump into its place.
  const [queue] = useState(() => buildFillQueue(store.pairs, settings));
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const code = queue[index];

  // Hooks have to run in the same order every render, so this sits above the
  // early return below rather than next to the markup it affects.
  useEffect(() => {
    input.current?.focus();
  }, [code]);

  function go(delta: number) {
    setIndex((prev) => Math.min(Math.max(prev + delta, 0), queue.length - 1));
  }

  if (queue.length === 0) {
    return (
      <div className="fill">
        <p className="fill-code">done</p>
        <p className="hint">Every live pair has an image.</p>
        <button className="ghost" onClick={onExit}>Back to grid</button>
      </div>
    );
  }

  const entry = store.pairs[code] ?? blankEntry(code);
  const suggestions = suggestFor(code, words);

  function accept(value: string) {
    onChangeEntry({ ...entry, image: value });
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
        <span>
          image · {index + 1} of {queue.length}
          <Tip text={IMAGE_TIP}/>
        </span>
        <button className="ghost" onClick={onExit}>Done (Esc)</button>
      </div>

      <p className="fill-code">{code}</p>

      <input
        ref={input}
        className="fill-input"
        value={entry.image}
        placeholder={`what you picture for ${code}`}
        onChange={(event) => onChangeEntry({ ...entry, image: event.target.value })}
        onKeyDown={handleKeyDown}
      />

      <div className="fill-suggestions">
        {suggestions.length === 0 ? (
          <p className="hint">No suggestions for {code} — paste a list on the grid screen.</p>
        ) : (
          suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion"
              onClick={() => accept(suggestion)}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>

      <p className="hint">Enter or ↓ next · ↑ back · click a suggestion to take it</p>
    </div>
  );
}
