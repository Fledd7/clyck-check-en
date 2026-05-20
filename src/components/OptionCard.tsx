type Props = {
  label: string;
  selected: boolean;
  onSelect: () => void;
};

export default function OptionCard({ label, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="option-card"
    >
      <span
        aria-hidden
        className={`mt-1 inline-block h-4 w-4 flex-shrink-0 rounded-full border ${
          selected ? "border-ink bg-ink" : "border-line bg-white"
        }`}
      />
      <span className="text-ink">{label}</span>
    </button>
  );
}
