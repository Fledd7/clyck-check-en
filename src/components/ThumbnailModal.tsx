import { useEffect, useRef, useState } from "react";
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

function RuleOfThirdsGrid() {
  const lines = (
    <>
      <div className="absolute left-[33.33%] top-0 h-full w-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      <div className="absolute left-[66.66%] top-0 h-full w-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      <div className="absolute top-[33.33%] left-0 w-full h-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      <div className="absolute top-[66.66%] left-0 w-full h-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
    </>
  );
  const points = [
    { top: "33.33%", left: "33.33%" },
    { top: "33.33%", left: "66.66%" },
    { top: "66.66%", left: "33.33%" },
    { top: "66.66%", left: "66.66%" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      {lines}
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ top: p.top, left: p.left, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 3px rgba(0,0,0,0.6)" }}
        />
      ))}
    </div>
  );
}

export default function ThumbnailModal({ video, analysis, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const recommendation = analysis ? getThumbnailRecommendation(analysis) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thumbnail-Analyse"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
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
          className="absolute right-3 top-3 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-base text-white transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-ink/60"
        >
          ✕
        </button>

        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-line/40">
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
          {showGrid && <RuleOfThirdsGrid />}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <h3 className="text-base font-semibold leading-snug">{video.title}</h3>
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className="flex-shrink-0 text-xs font-medium text-ink/60 underline-offset-2 hover:text-ink/80 hover:underline"
          >
            {showGrid ? "✕ Grid ausblenden" : "⊞ Rule of Thirds"}
          </button>
        </div>

        {showGrid && (
          <p className="mt-1 text-[11px] leading-relaxed text-ink/50">
            Die Schnittpunkte (●) sind die stärksten Positionen für Gesichter,
            Text und Hauptmotive.
          </p>
        )}

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
