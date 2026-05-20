import type { ChannelData, ResultCategory } from "../lib/types";
import ThumbnailGrid from "./ThumbnailGrid";

type Props = {
  category: ResultCategory;
  channelData: ChannelData | null;
  channelNote: string | null;
  onContinue: () => void;
};

export default function ResultPreview({ category, channelData, channelNote, onContinue }: Props) {
  return (
    <section className="container-narrow fade-in py-8">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/60">
        Erste Einschätzung
      </p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
        {category.headline}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink/80">{category.text}</p>

      {channelData && (
        <div className="mt-6 card">
          <h2 className="text-base font-semibold">
            {channelData.title ?? "Dein Kanal"}
            {channelData.handle ? (
              <span className="ml-2 text-ink/55">@{channelData.handle}</span>
            ) : null}
          </h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink/70 sm:grid-cols-3">
            {typeof channelData.subscriberCount === "number" && (
              <li>Abonnenten: {channelData.subscriberCount.toLocaleString("de-DE")}</li>
            )}
            {typeof channelData.videoCount === "number" && (
              <li>Videos: {channelData.videoCount.toLocaleString("de-DE")}</li>
            )}
            {typeof channelData.uploadCadenceDays === "number" && channelData.uploadCadenceDays > 0 && (
              <li>Ø Upload-Abstand: ca. {channelData.uploadCadenceDays} Tage</li>
            )}
            {typeof channelData.medianViews === "number" && (
              <li>Median-Views: {channelData.medianViews.toLocaleString("de-DE")}</li>
            )}
          </ul>
          {channelData.thumbnails && channelData.thumbnails.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-ink/70">Deine letzten Thumbnails</p>
              <ThumbnailGrid thumbnails={channelData.thumbnails} />
            </div>
          )}
        </div>
      )}

      {channelNote && (
        <p className="mt-5 text-sm italic text-ink/70">{channelNote}</p>
      )}

      <div className="mt-8 card">
        <p className="text-base font-medium">{category.cta}</p>
        <button type="button" onClick={onContinue} className="btn-primary mt-4">
          Persönliche Einschätzung anfragen
        </button>
      </div>
    </section>
  );
}
