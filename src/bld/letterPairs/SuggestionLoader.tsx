import { useState } from 'react';
import { parseSuggestionList } from './suggester';

interface SuggestionLoaderProps {
  words: Record<string, string[]>;
  onLoad: (words: Record<string, string[]>) => void;
}

export default function SuggestionLoader({ words, onLoad }: SuggestionLoaderProps) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  const loaded = Object.keys(words).length;

  function handleLoad() {
    const parsed = parseSuggestionList(text);
    const count = Object.keys(parsed).length;

    if (count === 0) {
      setMessage('No lines matched. Expected "AB - word, word".');
      return;
    }

    onLoad({ ...words, ...parsed });   // merge, so you can paste several sources
    setText('');
    setMessage(`Loaded ${count} pairs.`);
  }

  return (
    <details className="loader">
      <summary>Suggestions — {loaded} pairs loaded</summary>

      <textarea
        value={text}
        placeholder={'AB - Abacus, Ali Baba\nAC - Air Conditioner'}
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