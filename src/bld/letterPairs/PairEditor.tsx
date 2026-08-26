import { useEffect, useRef, type KeyboardEvent } from 'react';
import {
  CONFIDENCE_LABELS, IMAGE_TIP, type Confidence, type PairEntry,
} from './types';

const LEVELS: Confidence[] = [0, 1, 2, 3];

interface PairEditorProps {
  entry: PairEntry;
  flagLabel: string;
  suggestions: string[];
  onChange: (entry: PairEntry) => void;
  onNext: () => void;
}

export default function PairEditor({
  entry, flagLabel, suggestions, onChange, onNext,
}: PairEditorProps) {
  const imageInput = useRef<HTMLInputElement>(null);

  // Runs once per pair: PairGrid passes key={entry.code}, so picking a
  // different cell remounts this component and the effect fires again.
  useEffect(() => {
    imageInput.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onNext();
  }

  return (
    <div className="editor">
      <p className="code">{entry.code}</p>
      {flagLabel && <p className="kind">{flagLabel}</p>}

      <div className="fields">
        <label className="field">
          <span>
            image
            <button type="button" className="tip" data-tip={IMAGE_TIP} aria-label={IMAGE_TIP}>
              ?
            </button>
          </span>
          <input
            ref={imageInput}
            value={entry.image}
            placeholder={`what you picture for ${entry.code}`}
            onChange={(event) => onChange({ ...entry, image: event.target.value })}
            onKeyDown={handleKeyDown}
          />
        </label>

        <label className="field">
          <span>notes</span>
          <input
            value={entry.notes}
            placeholder="optional"
            onChange={(event) => onChange({ ...entry, notes: event.target.value })}
            onKeyDown={handleKeyDown}
          />
        </label>
      </div>

      {suggestions.length > 0 && (
        <div className="fill-suggestions">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion"
              onClick={() => onChange({ ...entry, image: suggestion })}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="chips">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={`chip c${level}`}
            aria-pressed={entry.confidence === level}
            onClick={() => onChange({ ...entry, confidence: level })}
          >
            {CONFIDENCE_LABELS[level]}
          </button>
        ))}
      </div>

      <p className="hint">Enter → next pair without an image</p>
    </div>
  );
}
