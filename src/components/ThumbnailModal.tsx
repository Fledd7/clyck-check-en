import { useEffect, useRef } from "react";
import type { TitleAnalysisResult } from "../lib/types";
import { getThumbnailRecommendation } from "../lib/results";

type Props = {
  video: { id: string; title: string; thumbnail: string };
  analysis: TitleAnalysisResult | null;
  onClose: () => void;
};

function textIssueCopy(issue: string): string {
  if (issue === "zu lang") return "Mehr als 3 Wörter — kürzer ist stärker";
  if (issue === "wiederholt Titel") return "Text wiederholt den Titel — verschenkte Fläche";
  return "Text verstärkt den Klick-Anreiz nicht";
}

function scoreColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score === 3) return "bg-yellow-500";
  return "bg-red-500";
}

export default function ThumbnailModal({ video, analysis, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const recommendation = analysis ? getThumbnailRecommendation(analysis) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thumbnail-Analyse"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-ink/60 hover:bg-line/50 hover:text-ink"
        >
          ✕
        </button>

        <div className="aspect-video w-full overflow-hidden rounded-md bg-line/40">
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <h3 className="mt-4 text-base font-semibold leading-snug">{video.title}</h3>

        {analysis ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-2 w-2 rounded-full ${
                      n <= analysis.score ? scoreColor(analysis.score) : "bg-line"
                    }`}
                  />
                ))}
              </span>
              <span
                className={`text-xs font-medium ${
                  analysis.score >= 4
                    ? "text-green-700"
                    : analysis.score === 3
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}
              >
                {analysis.label}
              </span>
              {analysis.format && analysis.format !== "Keines davon" && (
                <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/65">
                  {analysis.format}
                </span>
              )}
              {analysis.contrast && analysis.contrast !== "Keiner" && (
                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  Kontrast: {analysis.contrast}
                </span>
              )}
            </div>

            {analysis.reason && (
              <p className="mt-3 text-sm italic leading-relaxed text-ink/70">
                „{analysis.reason}"
              </p>
            )}

            {analysis.strong && (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                <span className="font-medium text-green-700">✓ Was funktioniert: </span>
                {analysis.strong}
              </p>
            )}
            {analysis.weak && (
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                <span className="font-medium text-red-700">✗ Was fehlt: </span>
                {analysis.weak}
              </p>
            )}

            {(analysis.elementCount > 3 ||
              analysis.textIssue ||
              analysis.contrast === "Keiner") && (
              <div className="mt-3 space-y-1">
                {analysis.elementCount > 3 && (
                  <p className="text-xs text-orange-600">
                    ⚠ {analysis.elementCount} Elemente — wirkt überladen (max. 3
                    empfohlen)
                  </p>
                )}
                {analysis.textIssue && (
                  <p className="text-xs text-orange-600">
                    ⚠ Text: {textIssueCopy(analysis.textIssue)}
                  </p>
                )}
                {analysis.contrast === "Keiner" && (
                  <p className="text-xs text-orange-600">
                    ⚠ Kein klarer Kontrast erkennbar
                  </p>
                )}
              </div>
            )}

            {recommendation && (
              <div className="mt-4 rounded-lg border border-line bg-line/10 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink/55">
                  Empfehlung
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/80">{recommendation}</p>
              </div>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-ink/60">
            Für dieses Thumbnail liegt noch keine Analyse vor.
          </p>
        )}
      </div>
    </div>
  );
}
