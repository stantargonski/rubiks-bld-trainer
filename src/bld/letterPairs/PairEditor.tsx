import { useState, type KeyboardEvent } from 'react';
import { FIELDS, type Confidence, type Field, type PairEntry } from './types';

const CONFIDENCE: { level: Confidence; label: string }[] = [
  { level: 0, label: 'unset' },
  { level: 1, label: 'weak' },
  { level: 2, label: 'ok' },
  { level: 3, label: 'solid' },
];

function parseTags(text: string): string[] {
  return text.split(',').map((tag) => tag.trim()).filter(Boolean);
}

interface PairEditorProps {
  entry: PairEntry;
  flagLabel: string;
  onChange: (entry: PairEntry) => void;
  onNext: () => void;
}

export default function PairEditor({ entry, flagLabel, onChange, onNext }: PairEditorProps) {
  // Tags are the one field that can't round-trip through the store on every
  // keystroke — "cat, " would parse to ["cat"] and eat the comma as you type.
  // So this one field keeps a draft and commits on blur.
  const [tagText, setTagText] = useState(entry.tags.join(', '));

  function setField(field: Field, value: string) {
    onChange({ ...entry, [field]: value });
  }

  function commitTags() {
    onChange({ ...entry, tags: parseTags(tagText) });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter') return;
    if (!(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
    commitTags();
    onNext();
  }

  return (
    <div className="editor" onKeyDown={handleKeyDown}>
      <p className="code">{entry.code}</p>
      {flagLabel && <p className="kind">{flagLabel}</p>}

      <div className="fields">
        {FIELDS.map((field, index) => (
          <label className="field" key={field}>
            <span>{field}</span>
            <input
              autoFocus={index === 0}
              value={entry[field]}
              placeholder={field}
              onChange={(event) => setField(field, event.target.value)}
            />
          </label>
        ))}

        <label className="field">
          <span>notes</span>
          <input
            value={entry.notes}
            placeholder="optional"
            onChange={(event) => onChange({ ...entry, notes: event.target.value })}
          />
        </label>

        <label className="field">
          <span>tags</span>
          <input
            value={tagText}
            placeholder="comma separated"
            onChange={(event) => setTagText(event.target.value)}
            onBlur={commitTags}
          />
        </label>
      </div>

      <div className="chips">
        {CONFIDENCE.map(({ level, label }) => (
          <button
            key={level}
            type="button"
            className={`chip c${level}`}
            aria-pressed={entry.confidence === level}
            onClick={() => onChange({ ...entry, confidence: level })}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="hint">Enter → next empty pair</p>
    </div>
  );
}