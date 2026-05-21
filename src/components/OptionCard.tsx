type Props = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  multi?: boolean;
  onSelect: () => void;
};

export default function OptionCard({ label, selected, disabled, multi, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`option-card ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span
        aria-hidden
        className={`mt-1 inline-flex flex-shrink-0 items-center justify-center ${
          multi
            ? `h-4 w-4 rounded border ${
                selected ? "border-ink bg-ink" : "border-line bg-white"
              }`
            : `h-4 w-4 rounded-full border ${
                selected ? "border-ink bg-ink" : "border-line bg-white"
              }`
        }`}
      >
        {multi && selected && (
          <svg
            viewBox="0 0 12 12"
            fill="none"
            className="h-2.5 w-2.5 text-white"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-ink">{label}</span>
    </button>
  );
}
