import { useEffect, useRef, useState } from "react";
import type { TitleAnalysisResult } from "../lib/types";
import { getThumbnailRecommendation } from "../lib/results";

type Props = {
  video: { id: string; title: string; thumbnail: string };
  analysis: TitleAnalysisResult | null;
  onClose: () => void;
};

function textIssueCopy(issue: string): string {
  if (issue === "zu lang") return "Mehr als 5 Wörter — kürzer ist stärker";
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
  const [localAnalysis, setLocalAnalysis] = useState<TitleAnalysisResult | null>(
    analysis ?? null
  );
  const [analyzing, setAnalyzing] = useState(false);

  async function analyzeNow() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/title-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videos: [{ id: video.id, title: video.title, thumbnail: video.thumbnail }],
        }),
      });
      const data = await res.json();
      if (data.ok && data.results?.length > 0) {
        setLocalAnalysis(data.results[0] as TitleAnalysisResult);
      }
    } catch {
      // silent fail
    } finally {
      setAnalyzing(false);
    }
  }

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

  const recommendation = localAnalysis ? getThumbnailRecommendation(localAnalysis) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thumbnail-Analyse"
      onClick={onClose}
      className="fixed inset-0 z-40 overflow-y-auto bg-black/60 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
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

        <button
          type="button"
          onClick={() => setShowGrid((v) => !v)}
          className="mt-1 mb-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          {showGrid ? "✕ Grid ausblenden" : "⊞ Rule of Thirds"}
        </button>

        {showGrid && (
          <p className="mb-3 text-[11px] leading-relaxed text-gray-400">
            Die Schnittpunkte (●) markieren die stärksten Positionen für Gesichter,
            Text und Hauptmotive.
          </p>
        )}

        <h3 className="text-base font-semibold leading-snug">{video.title}</h3>

        {localAnalysis ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-2 w-2 rounded-full ${
                      n <= localAnalysis.score ? scoreColor(localAnalysis.score) : "bg-line"
                    }`}
                  />
                ))}
              </span>
              <span
                className={`text-xs font-medium ${
                  localAnalysis.score >= 4
                    ? "text-green-700"
                    : localAnalysis.score === 3
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}
              >
                {localAnalysis.label}
              </span>
              {localAnalysis.format && localAnalysis.format !== "Keines davon" && (
                <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/65">
                  {localAnalysis.format}
                </span>
              )}
              {localAnalysis.contrast && localAnalysis.contrast !== "Keiner" && (
                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-800">
                  Kontrast: {localAnalysis.contrast}
                </span>
              )}
            </div>

            {localAnalysis.reason && (
              <p className="mt-3 text-sm italic leading-relaxed text-ink/70">
                „{localAnalysis.reason}"
              </p>
            )}

            {localAnalysis.strong && (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                <span className="font-medium text-green-700">✓ Was funktioniert: </span>
                {localAnalysis.strong}
              </p>
            )}
            {localAnalysis.weak && (
              <p className="mt-2 text-sm leading-relaxed text-ink/80">
                <span className="font-medium text-red-700">✗ Was fehlt: </span>
                {localAnalysis.weak}
              </p>
            )}

            {(localAnalysis.elementCount > 3 ||
              localAnalysis.textIssue ||
              localAnalysis.contrast === "Keiner") && (
              <div className="mt-3 space-y-1">
                {localAnalysis.elementCount > 3 && (
                  <p className="text-xs text-orange-600">
                    ⚠ {localAnalysis.elementCount} Elemente — wirkt überladen (max. 3
                    empfohlen)
                  </p>
                )}
                {localAnalysis.textIssue && (
                  <p className="text-xs text-orange-600">
                    ⚠ Text: {textIssueCopy(localAnalysis.textIssue)}
                  </p>
                )}
                {localAnalysis.contrast === "Keiner" && (
                  <p className="text-xs text-orange-600">
                    ⚠ Kein klarer Kontrast erkennbar
                  </p>
                )}
              </div>
            )}

            {localAnalysis.styleAge === "veraltet" && (
              <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-700">
                  Stilrichtung: Ältere Thumbnail-Ästhetik
                </p>
                <p className="mt-0.5 text-xs text-amber-600">
                  Dieser Stil war 2018–2022 weit verbreitet.
                  Klarere, bildstärkere Thumbnails performen
                  in den meisten Nischen heute oft besser.
                </p>
              </div>
            )}
            {localAnalysis.styleAge === "zeitgemäß" && (
              <p className="mt-1 text-xs text-green-600">
                ✓ Stilrichtung: Zeitgemäß
              </p>
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
          <>
            {!analyzing && (
              <button
                type="button"
                onClick={analyzeNow}
                className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
              >
                Dieses Thumbnail jetzt analysieren
              </button>
            )}
            {analyzing && (
              <p className="mt-3 text-sm text-gray-400">
                Analysiere Thumbnail und Titel...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
