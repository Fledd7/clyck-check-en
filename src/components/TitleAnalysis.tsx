import { useEffect, useState } from "react";
import type { TitleAnalysisResult, TitleAnalysisScore } from "../lib/types";

type Props = {
  results: TitleAnalysisResult[];
  loading: boolean;
};

function scoreTone(score: TitleAnalysisScore): {
  dot: string;
  text: string;
} {
  if (score >= 4) return { dot: "bg-green-500", text: "text-green-700" };
  if (score === 3) return { dot: "bg-yellow-500", text: "text-yellow-700" };
  return { dot: "bg-red-500", text: "text-red-700" };
}

function Dots({ score }: { score: TitleAnalysisScore }) {
  const tone = scoreTone(score);
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2 w-2 rounded-full ${n <= score ? tone.dot : "bg-line"}`}
        />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="card flex gap-3 p-3 animate-pulse">
      <div className="h-20 w-36 flex-shrink-0 rounded-md bg-line/70" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-line" />
        <div className="h-3 w-1/2 rounded bg-line/60" />
        <div className="h-3 w-2/3 rounded bg-line/60" />
      </div>
    </div>
  );
}

function Summary({ results }: { results: TitleAnalysisResult[] }) {
  const total = results.length;
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const avg = sum / total;
  const weakCount = results.filter((r) => r.score <= 2).length;
  const avgFormatted = avg.toFixed(1);

  let headline = "";
  let body = "";

  if (avg >= 4.0) {
    headline = `Ø ${avgFormatted} / 5  —  Starker Titel-Thumbnail-Fit`;
    body =
      "Die meisten deiner Videos nutzen das Zusammenspiel aus Bild und Titel gut.";
  } else if (avg >= 3.0) {
    headline = `Ø ${avgFormatted} / 5  —  Gemischter Titel-Thumbnail-Fit`;
    body = `${weakCount} von ${total} Videos haben einen schwachen Fit. Hier verlierst du Klicks, auch wenn die einzelnen Thumbnails gut aussehen.`;
  } else {
    headline = `Ø ${avgFormatted} / 5  —  Schwacher Titel-Thumbnail-Fit`;
    body =
      "Bei den meisten Videos arbeiten Titel und Bild nicht als Team. Das ist einer der häufigsten Gründe für schlechte Klickraten.";
  }

  return (
    <div className="mt-5 rounded-xl border border-line bg-white p-4">
      <p className="font-medium text-ink">{headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/75">{body}</p>
      <p className="mt-3 text-xs text-ink/45">
        KI-basierte Analyse. Kein Zugriff auf interne YouTube-Daten.
      </p>
    </div>
  );
}

function CriteriaPanel() {
  return (
    <div className="mt-3 rounded-lg border border-line bg-line/10 p-4 text-sm leading-relaxed text-ink/75">
      <p className="mb-3 text-ink/80">
        Gemini bewertet jedes Video nach 3 Kriterien:
      </p>
      <dl className="space-y-3">
        <div>
          <dt className="font-medium text-ink">Visuelle Einheit</dt>
          <dd className="text-ink/70">
            Transportieren Bild und Titel dieselbe Kernbotschaft?
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Neugier-Hebel</dt>
          <dd className="text-ink/70">
            Entsteht durch die Kombination ein stärkerer Klickanreiz als durch
            jedes Element allein?
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Konkretheit</dt>
          <dd className="text-ink/70">
            Ist das Bild spezifisch genug, um den Titel zu visualisieren?
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ink/55">
        Bewertung: 1 (Kein Fit) bis 5 (Perfekter Fit). Kein Zugriff auf
        interne YouTube-Daten wie CTR oder Impressionen.
      </p>
    </div>
  );
}

export default function TitleAnalysis({ results, loading }: Props) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading && results.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-semibold">Titel-Thumbnail-Fit</h3>
      <p className="mt-1 text-sm text-ink/55 leading-relaxed">
        Bewertet durch KI-Analyse — Gemini schaut sich Thumbnail und Titel
        gemeinsam an.
      </p>

      <button
        type="button"
        onClick={() => setCriteriaOpen((v) => !v)}
        aria-expanded={criteriaOpen}
        className="mt-2 text-xs font-medium text-ink/60 underline-offset-2 hover:text-ink/80 hover:underline"
      >
        ⓘ Wie wird bewertet?
      </button>

      {criteriaOpen && <CriteriaPanel />}

      {loading ? (
        <>
          <p className="mt-4 text-sm text-ink/60">
            {timedOut
              ? "Die KI-Analyse dauert gerade länger als üblich. Das kann an der Serverlast liegen."
              : "Gemini analysiert Thumbnail und Titel …"}
          </p>
          <div className="mt-4 grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {results.map((r) => {
              const tone = scoreTone(r.score);
              return (
                <div key={r.id} className="card flex gap-3 p-3">
                  {r.thumbnail && (
                    <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded-md bg-line/40">
                      <img
                        src={r.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {r.title}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Dots score={r.score} />
                      <span className={`text-xs font-medium ${tone.text}`}>
                        {r.label}
                      </span>
                    </div>
                    {r.reason && (
                      <p className="mt-1.5 text-xs italic text-ink/65 leading-relaxed">
                        „{r.reason}"
                      </p>
                    )}
                    {r.strong && (
                      <p className="mt-1.5 text-xs text-ink/70 leading-relaxed">
                        <span className="font-medium text-green-700">✓ </span>
                        {r.strong}
                      </p>
                    )}
                    {r.weak && (
                      <p className="mt-0.5 text-xs text-ink/70 leading-relaxed">
                        <span className="font-medium text-red-700">✗ </span>
                        {r.weak}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Summary results={results} />
        </>
      )}
    </div>
  );
}
