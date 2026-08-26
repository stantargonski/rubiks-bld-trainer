import { useState } from 'react';
import { parseSuggestionList } from './suggester';

interface SuggestionLoaderProps {
  words: Record<string, string[]>;
  liveCodes: string[];
  onLoad: (words: Record<string, string[]>) => void;
}

export default function SuggestionLoader({ words, liveCodes, onLoad }: SuggestionLoaderProps) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  const missing = liveCodes.filter((code) => !words[code]);
  const covered = liveCodes.length - missing.length;

  function handleLoad() {
    const parsed = parseSuggestionList(text);
    const added = Object.keys(parsed).length;

    if (added === 0) {
      setMessage('No pairs found. Each code needs to be on its own line.');
      return;
    }

    const next = { ...words, ...parsed };
    const gaps = liveCodes.filter((code) => !next[code]);

    onLoad(next);
    setText('');
    setMessage(
      gaps.length === 0
        ? `Loaded ${added} pairs. Every live pair is covered.`
        : `Loaded ${added} pairs. Missing ${gaps.length}: ${gaps.slice(0, 15).join(' ')}${
            gaps.length > 15 ? ' …' : ''
          }`,
    );
  }

  return (
    <details className="loader">
      <summary>Suggestions — {covered} of {liveCodes.length} live pairs</summary>

      <textarea
        value={text}
        placeholder={'AB\nAbacus\nAli Baba'}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="actions">
        <button onClick={handleLoad}>Load</button>
        <button
          onClick={() => {
            onLoad({});
            setMessage('Cleared.');
          }}
        >
          Clear
        </button>
      </div>

      {message && <p className="hint">{message}</p>}
    </details>
  );
}