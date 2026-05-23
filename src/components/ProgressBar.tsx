type Props = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: Props) {
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  return (
    <div className="container-narrow pt-6">
      <div className="flex items-center justify-between text-xs text-gray1">
        <span>Schritt {Math.min(current, total)} / {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-ink transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
