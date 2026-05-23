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
  if (score === 3) return { dot: "bg-yellow-500", text: "text-yellow-700" };
  return { dot: "bg-red-500", text: "text-red-700" };
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
          className={`h-2 w-2 rounded-full transition-colors duration-200 ${
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
      <div className="h-20 w-36 flex-shrink-0 rounded-md bg-line/70" />
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
    <div className="mt-3 rounded-lg border border-line bg-line/10 p-4 text-sm leading-relaxed text-ink/75">
      <p className="mb-3 text-ink/80">
        Die Analyse basiert auf zwei bewährten Frameworks: „How To Make
        Effective Thumbnails" (Jay Alto) und „The Thumbnail System"
        (thumbnailsystem.com).
      </p>
      <p className="mb-3 text-ink/80">Bewertet wird nach diesen Kriterien:</p>
      <dl className="space-y-3">
        <div>
          <dt className="font-medium text-ink">Klick-Format</dt>
          <dd className="text-ink/70">
            Nutzt das Thumbnail ein bewährtes psychologisches Format
            (Kontrovers, Extrem, Unlogisch, Emotional, Trending, Informativ)?
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">3-Element-Regel</dt>
          <dd className="text-ink/70">
            Maximal 3 Hauptinformationen. Mehr bedeutet Überladung — der Blick
            des Zuschauers verliert sich.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Text-Regel</dt>
          <dd className="text-ink/70">
            Text erst wenn er den Klick-Anreiz direkt verstärkt. Unter 3
            Wörter. Den Videotitel nie 1:1 wiederholen.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Kontrast</dt>
          <dd className="text-ink/70">
            Luminosity (hell/dunkel), Farbe (Komplementär) oder Sättigung —
            mindestens einer muss sitzen.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Titel-Thumbnail-Fit</dt>
          <dd className="text-ink/70">
            Verstärken Bild und Titel sich gegenseitig — oder arbeiten sie
            aneinander vorbei?
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-ink/55">
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

  const overloadedCount = results.filter((r) => r.elementCount > 3).length;
  const textIssueCount = results.filter((r) => r.textIssue !== "").length;
  const noContrastCount = results.filter((r) => r.contrast === "Keiner").length;
  const brandingCount = results.filter((r) => r.branding).length;

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

      {(overloadedCount > 0 ||
        textIssueCount > 0 ||
        noContrastCount > 0 ||
        brandingCount > 0) && (
        <div className="mt-3 space-y-1">
          {overloadedCount > 0 && (
            <p className="text-sm text-ink/70">
              ⚠ {overloadedCount} von {total} Videos wirken visuell überladen.
            </p>
          )}
          {textIssueCount > 0 && (
            <p className="text-sm text-ink/70">
              ⚠ Bei {textIssueCount} Videos gibt es ein Text-Problem im
              Thumbnail.
            </p>
          )}
          {noContrastCount > 0 && (
            <p className="text-sm text-ink/70">
              ⚠ {noContrastCount} Videos haben keinen klaren visuellen Kontrast.
            </p>
          )}
          {brandingCount > 0 && (
            <p className="text-sm text-ink/70">
              ✓ {brandingCount} von {total} Videos zeigen einen wiederkehrenden
              Kanal-Stil.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-ink/45">
        KI-basierte Analyse. Kein Zugriff auf interne YouTube-Daten.
      </p>
    </div>
  );
}

export default function TitleAnalysis({ results, loading, onSelect }: Props) {
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [analyzedCount, setAnalyzedCount] = useState(0);

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

  if (!loading && results.length === 0) return null;

  const progressPct =
    Math.min(analyzedCount + 1, TOTAL_VIDEOS) * (100 / TOTAL_VIDEOS);

  return (
    <div>
      <h3 className="text-base font-semibold">Titel-Thumbnail-Fit</h3>
      <p className="mt-1 text-sm text-ink/55 leading-relaxed">
        Deine Thumbnails werden nach Klickpsychologie und
        Thumbnail-Systematik analysiert.
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
        <div className="mt-4">
          <p className="text-sm text-ink/60">
            {timedOut
              ? "Die KI-Analyse dauert gerade länger als üblich. Das kann an der Serverlast liegen."
              : `Analysiere Video ${Math.min(analyzedCount + 1, TOTAL_VIDEOS)} von ${TOTAL_VIDEOS} …`}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
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
            {results.map((r) => {
              const tone = scoreTone(r.score);
              const cardClass = onSelect
                ? "card flex gap-3 p-3 text-left transition hover:border-ink/40 cursor-pointer w-full"
                : "card flex gap-3 p-3";
              const inner = (
                <>
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <AnimatedDots score={r.score} />
                      <span className={`text-xs font-medium ${tone.text}`}>
                        {r.label}
                      </span>
                      {r.format && r.format !== "Keines davon" && (
                        <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/65">
                          {r.format}
                        </span>
                      )}
                    </div>
                    {r.reason && (
                      <p className="mt-1.5 text-xs italic text-ink/65 leading-relaxed">
                        „{r.reason}"
                      </p>
                    )}
                    <div className="mt-1.5 space-y-0.5">
                      {r.elementCount > 3 && (
                        <p className="text-xs text-orange-600">
                          ⚠ {r.elementCount} Elemente — wirkt überladen (max. 3
                          empfohlen)
                        </p>
                      )}
                      {r.textIssue && (
                        <p className="text-xs text-orange-600">
                          ⚠ Text: {textIssueCopy(r.textIssue)}
                        </p>
                      )}
                      {r.contrast && r.contrast !== "Keiner" && (
                        <p className="text-xs text-green-700">
                          ✓ Kontrast: {r.contrast}
                        </p>
                      )}
                      {r.contrast === "Keiner" && (
                        <p className="text-xs text-orange-600">
                          ⚠ Kein klarer Kontrast erkennbar
                        </p>
                      )}
                    </div>
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
