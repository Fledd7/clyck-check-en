type Props = {
  thumbnails: string[];
  onSelect?: (index: number) => void;
};

export default function ThumbnailGrid({ thumbnails, onSelect }: Props) {
  if (!thumbnails || thumbnails.length === 0) return null;
  const clickable = !!onSelect;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {thumbnails.slice(0, 12).map((src, i) =>
        clickable ? (
          <button
            key={i}
            type="button"
            onClick={() => onSelect?.(i)}
            aria-label={`Thumbnail ${i + 1} öffnen`}
            className="group relative aspect-video overflow-hidden rounded-xl border border-line bg-line transition hover:border-ink/40"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:opacity-80"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink">
                Details
              </span>
            </span>
          </button>
        ) : (
          <div
            key={i}
            className="aspect-video overflow-hidden rounded-xl border border-line bg-line"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )
      )}
    </div>
  );
}
