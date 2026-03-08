import { useState, useRef, useEffect, type FC, type KeyboardEvent } from 'react';

export interface InlineEditableValueProps {
  value: string | number;
  onCommit: (newValue: string) => void;
  format?: (value: string | number) => string;
  parse?: (raw: string) => string | number;
  validate?: (raw: string) => string | null;
  type?: 'text' | 'number';
  className?: string;
  inputClassName?: string;
}

export const InlineEditableValue: FC<InlineEditableValueProps> = ({
  value,
  onCommit,
  format,
  parse,
  validate,
  type = 'text',
  className = '',
  inputClassName = '',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value));
      setError(null);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, value]);

  const commit = () => {
    if (validate) {
      const err = validate(draft);
      if (err) {
        setError(err);
        return;
      }
    }
    const parsed = parse ? parse(draft) : draft;
    onCommit(String(parsed));
    setEditing(false);
  };

  const cancel = () => {
    setDraft(String(value));
    setError(null);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        onFocus={() => setEditing(true)}
        className={`cursor-pointer hover:bg-theme-surface2/50 rounded px-1 -mx-1 transition-colors ${className}`}
        tabIndex={0}
        role="button"
      >
        {format ? format(value) : String(value)}
      </span>
    );
  }

  return (
    <span className="relative inline-block">
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`bg-theme-bg border rounded-inner px-1 outline-none text-theme-text ${
          error
            ? 'border-red-500 focus:ring-red-500/30'
            : 'border-theme-border focus:border-theme-cyan focus:ring-theme-cyan/30'
        } focus:ring-1 ${inputClassName}`}
      />
      {error && (
        <span className="absolute left-0 top-full mt-1 text-[9px] text-red-400 bg-theme-bg border border-red-500/30 rounded px-2 py-0.5 whitespace-nowrap z-50">
          {error}
        </span>
      )}
    </span>
  );
};
