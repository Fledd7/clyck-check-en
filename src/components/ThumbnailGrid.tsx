type Props = {
  thumbnails: string[];
};

export default function ThumbnailGrid({ thumbnails }: Props) {
  if (!thumbnails || thumbnails.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {thumbnails.slice(0, 12).map((src, i) => (
        <div key={i} className="aspect-video overflow-hidden rounded-md border border-line bg-line/40">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
