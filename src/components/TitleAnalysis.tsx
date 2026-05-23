import { useEffect, useState } from "react";
import type { TitleAnalysisResult, TitleAnalysisScore } from "../lib/types";

type Props = {
  results: TitleAnalysisResult[];
  loading: boolean;
  onSelect?: (id: string) => void;
};

const TOTAL_VIDEOS = 5;

function scoreTone(score: TitleAnalysisScore): { dot: string; text: string } {
  if (score >= 4) return { dot: "bg-green-500", text: "text-green-700" };
  if (score === 3) return { dot: "bg-amber-400", text: "text-amber-600" };
  return { dot: "bg-accent", text: "text-accent" };
}

function textIssueCopy(issue: string): string {
  if (issue === "zu lang") return "Mehr als 5 Wörter — kürzer ist stärker";
  if (issue === "wiederholt Titel") return "Text wiederholt den Titel — verschenkte Fläche";
  return "Text verstärkt den Klick-Anreiz nicht";
}

function AnimatedDots({ score }: { score: TitleAnalysisScore }) {
  const tone = scoreTone(score);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setVisible(current);
      if (current >= score) clearInterval(timer);
    }, 150);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
            n <= visible ? tone.dot : "bg-line"
          }`}
        />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="card flex gap-3 p-3 animate-pulse">
      <div className="h-20 w-36 flex-shrink-0 rounded-lg bg-line" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-line" />
        <div className="h-3 w-1/2 rounded bg-line/60" />
        <div className="h-3 w-2/3 rounded bg-line/60" />
      </div>
    </div>
  );
}

function CriteriaPanel() {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-bg p-4 text-sm leading-relaxed text-gray1">
      <p className="mb-3">
        Die Analyse basiert auf zwei bewährten Frameworks: „How To Make
        Effective Thumbnails" (Jay Alto) und „The Thumbnail System"
        (thumbnailsystem.com).
      </p>
      <p className="mb-3">Bewertet wird nach diesen Kriterien:</p>
      <dl className="space-y-3">
        <div>
          <dt className="font-semibold text-ink">Klick-Format</dt>
          <dd>
            Nutzt das Thumbnail ein bewährtes psychologisches Format
            (Kontrovers, Extrem, Unlogisch, Emotional, Trending, Informativ)?
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">3-Element-Regel</dt>
          <dd>
            Maximal 3 Hauptinformationen. Mehr bedeutet Überladung — der Blick
            des Zuschauers verliert sich.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Text-Regel</dt>
          <dd>
            Text erst wenn er den Klick-Anreiz direkt verstärkt. Unter 3
            Wörter. Den Videotitel nie 1:1 wiederholen.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Kontrast</dt>
          <dd>
            Hell/Dunkel, Komplementärfarben oder Sättigung —
            mindestens einer muss sitzen.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Titel-Thumbnail-Fit</dt>
          <dd>
            Verstärken Bild und Titel sich gegenseitig — oder arbeiten sie
            aneinander vorbei?
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-gray1">
        Kein Zugriff auf interne YouTube-Daten wie Klickrate oder Impressionen.
      </p>
    </div>
  );
}

function Summary({ results }: { results: TitleAnalysisResult[] }) {
  const total = results.length;
  const sum = results.reduce((acc, r) => acc + r.score, 0);
  const avg = sum / total;
  const weakCount = results.filter((r) => r.score <= 2).length;
  const avgFormatted = avg.toFixed(1);

  const overloadedCount = results.filter((r) => r.overloaded).length;
  const textIssueCount = results.filter((r) => r.textIssue !== "").length;
  const noContrastCount = results.filter((r) => r.contrast === "Keiner").length;
  const brandingCount = results.filter((r) => r.branding).length;
  const outdatedCount = results.filter((r) => r.styleAge === "veraltet").length;
  const modernCount = results.filter((r) => r.styleAge === "zeitgemäß").length;

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
    <div className="mt-5 rounded-2xl border border-line bg-white p-4">
      <p className="font-bold">{headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray1">{body}</p>

      {(overloadedCount > 0 ||
        textIssueCount > 0 ||
        noContrastCount > 0 ||
        brandingCount > 0 ||
        (outdatedCount > 0 && outdatedCount >= total / 2) ||
        modernCount >= total * 0.7) && (
        <div className="mt-3 space-y-1">
          {overloadedCount > 0 && (
            <p className="text-sm text-gray1">
              ⚠ {overloadedCount} von {total} Videos wirken visuell überladen.
            </p>
          )}
          {textIssueCount > 0 && (
            <p className="text-sm text-gray1">
              ⚠ Bei {textIssueCount} Videos gibt es ein Text-Problem im
              Thumbnail.
            </p>
          )}
          {noContrastCount > 0 && (
            <p className="text-sm text-gray1">
              ⚠ {noContrastCount} Videos haben keinen klaren visuellen Kontrast.
            </p>
          )}
          {brandingCount > 0 && (
            <p className="text-sm text-gray1">
              ✓ {brandingCount} von {total} Videos zeigen einen wiederkehrenden
              Kanal-Stil.
            </p>
          )}
          {outdatedCount > 0 && outdatedCount >= total / 2 && (
            <p className="mt-1 text-sm text-amber-600">
              ⚠ Mehrere Thumbnails zeigen einen älteren visuellen Stil. Ein
              moderneres Packaging-System könnte die Klickstärke deutlich
              verbessern.
            </p>
          )}
          {modernCount >= total * 0.7 && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Die meisten Thumbnails wirken visuell zeitgemäß.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray1">
        KI-basierte Analyse. Kein Zugriff auf interne YouTube-Daten.
      </p>
    </div>
  );
}

export default function TitleAnalysis({ results, loading, onSelect }: Props) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [translating, setTranslating] = useState(false);
  const [translatedResults, setTranslatedResults] = useState<TitleAnalysisResult[] | null>(null);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      setAnalyzedCount(0);
      return;
    }
    const timeoutTimer = setTimeout(() => setTimedOut(true), 15000);
    const progressTimer = setInterval(() => {
      setAnalyzedCount((prev) => (prev >= TOTAL_VIDEOS - 1 ? prev : prev + 1));
    }, 2000);
    return () => {
      clearTimeout(timeoutTimer);
      clearInterval(progressTimer);
    };
  }, [loading]);

  async function translateResults() {
    if (translating) return;
    if (language === "en") {
      setTranslatedResults(null);
      setLanguage("de");
      return;
    }
    setTranslating(true);
    const textsToTranslate = results.flatMap((r) =>
      [r.reason, r.strong, r.weak].filter(Boolean)
    );
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: textsToTranslate, targetLang: "en" }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.translations)) {
        let i = 0;
        const translated = results.map((r) => ({
          ...r,
          reason: r.reason ? (data.translations[i++] as string) : r.reason,
          strong: r.strong ? (data.translations[i++] as string) : r.strong,
          weak: r.weak ? (data.translations[i++] as string) : r.weak,
        }));
        setTranslatedResults(translated);
        setLanguage("en");
      }
    } catch {
      // silent fail
    } finally {
      setTranslating(false);
    }
  }

  if (!loading && results.length === 0) return null;

  const displayResults = translatedResults ?? results;

  const progressPct =
    Math.min(analyzedCount + 1, TOTAL_VIDEOS) * (100 / TOTAL_VIDEOS);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold">Titel-Thumbnail-Fit</h3>
        {!loading && results.length > 0 && (
          <button
            type="button"
            onClick={translateResults}
            disabled={translating}
            className="rounded-full border border-line px-3 py-1 text-xs text-gray1 transition hover:bg-bg disabled:opacity-50"
          >
            {translating
              ? "Wird übersetzt..."
              : language === "de"
              ? "Show in English"
              : "Auf Deutsch anzeigen"}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-gray1 leading-relaxed">
        Deine Thumbnails werden nach Klickpsychologie und
        Thumbnail-Systematik analysiert.
      </p>

      <button
        type="button"
        onClick={() => setCriteriaOpen((v) => !v)}
        aria-expanded={criteriaOpen}
        className="mt-2 text-xs font-medium text-gray1 underline-offset-2 hover:text-ink hover:underline"
      >
        ⓘ Wie wird bewertet?
      </button>

      {criteriaOpen && <CriteriaPanel />}

      {loading ? (
        <div className="mt-4">
          <p className="text-sm text-gray1">
            {timedOut
              ? "Die KI-Analyse dauert gerade länger als üblich. Das kann an der Serverlast liegen."
              : `Analysiere Video ${Math.min(analyzedCount + 1, TOTAL_VIDEOS)} von ${TOTAL_VIDEOS} …`}
          </p>
          <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ink transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3">
            {displayResults.map((r) => {
              const tone = scoreTone(r.score);
              const cardClass = onSelect
                ? "rounded-2xl border border-line bg-white p-3 shadow-card flex gap-3 text-left transition hover:border-ink/40 cursor-pointer w-full"
                : "rounded-2xl border border-line bg-white p-3 shadow-card flex gap-3";
              const inner = (
                <>
                  {r.thumbnail && (
                    <div className="h-20 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-line">
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <AnimatedDots score={r.score} />
                      <span className={`text-xs font-semibold ${tone.text}`}>
                        {r.label}
                      </span>
                    </div>
                    {r.reason && (
                      <p className="mt-1.5 text-xs italic text-gray1 leading-relaxed">
                        „{r.reason}"
                      </p>
                    )}
                    <div className="mt-1.5 space-y-0.5">
                      {r.overloaded && (
                        <p className="text-xs text-accent">
                          ⚠ {r.elementCount} Elemente — wirkt überladen (max. 3
                          empfohlen)
                        </p>
                      )}
                      {r.textIssue && (
                        <p className="text-xs text-accent">
                          ⚠ Text: {textIssueCopy(r.textIssue)}
                        </p>
                      )}
                      {r.contrast && r.contrast !== "Keiner" && (
                        <p className="text-xs text-green-600">
                          ✓ Kontrast: {r.contrast}
                        </p>
                      )}
                      {r.contrast === "Keiner" && (
                        <p className="text-xs text-accent">
                          ⚠ Kein klarer Kontrast erkennbar
                        </p>
                      )}
                    </div>
                    {r.styleAge === "veraltet" && (
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
                    {r.styleAge === "zeitgemäß" && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Stilrichtung: Zeitgemäß
                      </p>
                    )}
                    {r.strong && (
                      <p className="mt-1.5 text-xs text-gray1 leading-relaxed">
                        <span className="font-semibold text-green-700">✓ </span>
                        {r.strong}
                      </p>
                    )}
                    {r.weak && (
                      <p className="mt-0.5 text-xs text-gray1 leading-relaxed">
                        <span className="font-semibold text-accent">✗ </span>
                        {r.weak}
                      </p>
                    )}
                  </div>
                </>
              );
              return onSelect ? (
                <button key={r.id} type="button" className={cardClass} onClick={() => onSelect(r.id)}>
                  {inner}
                </button>
              ) : (
                <div key={r.id} className={cardClass}>
                  {inner}
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
