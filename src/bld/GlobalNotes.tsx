interface GlobalNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export default function GlobalNotes({ value, onChange }: GlobalNotesProps) {
  return (
    <div className="notes-page">
      <div className="panel">
        <h2 className="panel-title">Global notes</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          Method notes, memo rules, setup algs you keep forgetting. Saved with your pairs.
        </p>
        <textarea
          className="notes-area"
          value={value}
          placeholder={'e.g. break in alphabetically\ne.g. parity → do the edge first'}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}
