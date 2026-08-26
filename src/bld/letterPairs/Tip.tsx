import { useEffect, useRef, useState } from "react";

export default function Tip({text}: { text: string}) {
    const [open, setOpen] = useState(false)
    const wrap = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (!open) return

    function onDown(event: MouseEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="tip-wrap" ref={wrap}>
      <button
        type="button"
        className="tip"
        aria-expanded={open}
        aria-label={text}
        onClick={() => setOpen((prev) => !prev)}
      >
        ?
      </button>
      {open && <span className="tip-bubble">{text}</span>}
    </span>
  );
}