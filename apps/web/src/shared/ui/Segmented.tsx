interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg bg-win p-0.5 shadow-[inset_0_0_0_1px_var(--win-line)]"
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-md px-3 py-1 text-step--1 transition-colors ${checked ? 'bg-win-line text-win-text' : 'text-win-muted hover:text-win-text'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
