import { useEffect, useRef, useState } from "react";
import type { TitleAnalysisResult } from "../lib/types";
import { getThumbnailRecommendation } from "../lib/results";

type Props = {
  video: { id: string; title: string; thumbnail: string; duration?: string; views?: number; publishedAt?: string };
  analysis: TitleAnalysisResult | null;
  onClose: () => void;
};

function textIssueCopy(issue: string): string {
  if (issue === "zu lang") return "Mehr als 5 Wörter — kürzer ist stärker";
  if (issue === "wiederholt Titel") return "Text wiederholt den Titel — verschenkte Fläche";
  return "Text verstärkt den Klick-Anreiz nicht";
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (views >= 1_000) return Math.round(views / 1_000) + "K";
  return views.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "heute";
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `vor ${weeks} ${weeks === 1 ? "Woche" : "Wochen"}`;
  const months = Math.floor(days / 30);
  if (days < 365) return `vor ${months} ${months === 1 ? "Monat" : "Monaten"}`;
  const years = Math.floor(days / 365);
  return `vor ${years} ${years === 1 ? "Jahr" : "Jahren"}`;
}

function scoreColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score === 3) return "bg-amber-400";
  return "bg-accent";
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const h = parseInt(match[1] ?? "0");
  const m = parseInt(match[2] ?? "0");
  const s = parseInt(match[3] ?? "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
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
  const durationStr = video.duration ? parseDuration(video.duration) : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thumbnail-Analyse"
      onClick={onClose}
      className="fixed inset-0 z-40 overflow-y-auto bg-black/70 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[20px] bg-white p-5 shadow-xl"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 50,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.6)",
            border: "1.5px solid rgba(255,255,255,0.3)",
            color: "#ffffff",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
          }}
        >
          ✕
        </button>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-line">
          <img
            src={video.thumbnail}
            alt=""
            className="h-full w-full object-cover"
          />
          {durationStr && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                right: "8px",
                background: "rgba(0,0,0,0.8)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: "4px",
                letterSpacing: "0.02em",
              }}
            >
              {durationStr}
            </div>
          )}
          {showGrid && <RuleOfThirdsGrid />}
        </div>

        <button
          type="button"
          onClick={() => setShowGrid((v) => !v)}
          className="mt-1 mb-3 text-xs text-gray1 hover:underline"
        >
          {showGrid ? "✕ Grid ausblenden" : "⊞ Rule of Thirds"}
        </button>

        {showGrid && (
          <p className="mb-3 text-[11px] leading-relaxed text-gray1">
            Die Schnittpunkte (●) markieren die stärksten Positionen für Gesichter,
            Text und Hauptmotive.
          </p>
        )}

        <h3 className="text-base font-bold leading-snug">{video.title}</h3>

        {(video.views !== undefined || video.publishedAt) && (
          <p className="mt-1 mb-3 flex items-center gap-2 text-xs text-gray1">
            {video.views !== undefined && (
              <span>{formatViews(video.views)} Views</span>
            )}
            {video.publishedAt && (
              <span>· {timeAgo(video.publishedAt)}</span>
            )}
          </p>
        )}

        {localAnalysis ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-2.5 w-2.5 rounded-full ${
                      n <= localAnalysis.score ? scoreColor(localAnalysis.score) : "bg-line"
                    }`}
                  />
                ))}
              </span>
              <span
                className={`text-xs font-semibold ${
                  localAnalysis.score >= 4
                    ? "text-green-700"
                    : localAnalysis.score === 3
                    ? "text-amber-600"
                    : "text-accent"
                }`}
              >
                {localAnalysis.label}
              </span>
              {localAnalysis.contrast && localAnalysis.contrast !== "Keiner" && (
                <span className="text-xs font-medium text-green-600">
                  Kontrast: {localAnalysis.contrast}
                </span>
              )}
            </div>

            {localAnalysis.reason && (
              <p className="mt-3 text-sm italic leading-relaxed text-gray1">
                „{localAnalysis.reason}"
              </p>
            )}

            {localAnalysis.strong && (
              <p className="mt-3 text-sm leading-relaxed text-gray1">
                <span className="font-semibold text-green-700">✓ Was funktioniert: </span>
                {localAnalysis.strong}
              </p>
            )}
            {localAnalysis.weak && (
              <p className="mt-2 text-sm leading-relaxed text-gray1">
                <span className="font-semibold text-accent">✗ Was fehlt: </span>
                {localAnalysis.weak}
              </p>
            )}

            {(localAnalysis.overloaded ||
              localAnalysis.textIssue ||
              localAnalysis.contrast === "Keiner") && (
              <div className="mt-3 space-y-1">
                {localAnalysis.overloaded && (
                  <p className="text-xs text-accent">
                    ⚠ Visuell überladen — zu viele Elemente auf einmal
                  </p>
                )}
                {localAnalysis.textIssue && (
                  <p className="text-xs text-accent">
                    ⚠ Text: {textIssueCopy(localAnalysis.textIssue)}
                  </p>
                )}
                {localAnalysis.contrast === "Keiner" && (
                  <p className="text-xs text-accent">
                    ⚠ Kein klarer Kontrast erkennbar
                  </p>
                )}
              </div>
            )}

            {localAnalysis.styleAge === "veraltet" && (
              <div className="mt-2 rounded-xl border border-orange-200 bg-[#FFF8F0] p-3">
                <p className="text-xs font-semibold text-orange-700">
                  Stilrichtung: Ältere Thumbnail-Ästhetik
                </p>
                <p className="mt-0.5 text-xs text-orange-800">
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
              <div className="mt-4 rounded-[10px] bg-bg p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray1">
                  Empfehlung
                </p>
                <p className="mt-1 text-[13px] font-medium">{recommendation}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {!analyzing && (
              <button
                type="button"
                onClick={analyzeNow}
                className="mt-3 w-full rounded-xl border border-line px-4 py-2 text-sm text-gray1 transition-colors hover:bg-bg"
              >
                Dieses Thumbnail jetzt analysieren
              </button>
            )}
            {analyzing && (
              <p className="mt-3 text-sm text-gray1">
                Analysiere Thumbnail und Titel...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
