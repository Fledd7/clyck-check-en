import { useState } from "react";
import type { FitResult, VideoItem } from "../lib/types";

type Props = {
  videos: VideoItem[];
  onComplete: (results: FitResult[]) => void;
};

type VideoState = "unanswered" | "yes" | "no";

export default function TitleThumbnailFitCheck({ videos, onComplete }: Props) {
  const shown = videos.slice(0, 6);
  const [ratings, setRatings] = useState<Record<string, VideoState>>({});

  function rate(videoId: string, fit: "yes" | "no") {
    const next = { ...ratings, [videoId]: fit };
    setRatings(next);
    const allRated = shown.every((v) => next[v.id] === "yes" || next[v.id] === "no");
    if (allRated) {
      const results: FitResult[] = shown.map((v) => ({
        videoId: v.id,
        title: v.title,
        fit: next[v.id] as "yes" | "no",
      }));
      onComplete(results);
    }
  }

  const ratedCount = shown.filter((v) => ratings[v.id] && ratings[v.id] !== "unanswered").length;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">Titel-Thumbnail-Fit</h2>
      <p className="mt-2 text-sm text-ink/65">
        Bewertest du kurz, ob Bild und Titel bei diesen Videos eine gemeinsame Botschaft erzeugen?
      </p>
      <p className="mt-1 text-xs text-ink/50">
        {ratedCount} / {shown.length} bewertet
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {shown.map((v) => {
          const rating = ratings[v.id] as VideoState | undefined;
          return (
            <div key={v.id} className="card overflow-hidden p-0">
              <div className="aspect-video w-full overflow-hidden bg-line/40">
                <img
                  src={v.thumbnail}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => rate(v.id, "yes")}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                      rating === "yes"
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-line bg-white text-ink/70 hover:border-green-400 hover:bg-green-50"
                    }`}
                  >
                    ✓ Passt zusammen
                  </button>
                  <button
                    type="button"
                    onClick={() => rate(v.id, "no")}
                    className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                      rating === "no"
                        ? "border-red-500 bg-red-50 text-red-800"
                        : "border-line bg-white text-ink/70 hover:border-red-400 hover:bg-red-50"
                    }`}
                  >
                    ✗ Passt nicht
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FitSummary({ results }: { results: FitResult[] }) {
  const total = results.length;
  const fitCount = results.filter((r) => r.fit === "yes").length;
  const noFitCount = total - fitCount;
  const ratio = total > 0 ? fitCount / total : 0;

  if (ratio >= 0.7) {
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="font-medium text-green-900">✓ Starker Titel-Thumbnail-Fit</p>
        <p className="mt-1 text-sm text-green-800">
          Bei den meisten deiner Videos arbeiten Bild und Titel zusammen. Das ist eine der
          wichtigsten Grundlagen für klickstarke Videos.
        </p>
        <p className="mt-2 text-xs text-green-700">
          Diese Einschätzung basiert auf deiner eigenen Bewertung.
        </p>
      </div>
    );
  }
  if (ratio >= 0.4) {
    return (
      <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
        <p className="font-medium text-yellow-900">⚠ Gemischter Titel-Thumbnail-Fit</p>
        <p className="mt-1 text-sm text-yellow-800">
          {noFitCount} von {total} deiner Videos haben ein schwaches Zusammenspiel aus Titel und
          Bild. Das kann den Klickreiz schwächen — auch wenn das Thumbnail selbst gut aussieht.
        </p>
        <p className="mt-2 text-xs text-yellow-700">
          Diese Einschätzung basiert auf deiner eigenen Bewertung.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-900">✗ Schwacher Titel-Thumbnail-Fit</p>
      <p className="mt-1 text-sm text-red-800">
        Bei den meisten deiner Videos arbeiten Titel und Bild gegeneinander, nicht miteinander. Das
        kann Klickpotenzial kosten — unabhängig davon, wie gut die einzelnen Thumbnails sind.
      </p>
      <p className="mt-2 text-xs text-red-700">
        Diese Einschätzung basiert auf deiner eigenen Bewertung.
      </p>
    </div>
  );
}
