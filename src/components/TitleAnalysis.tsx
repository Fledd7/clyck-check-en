import { useEffect, useState } from "react";
import type { TitleAnalysisResult, TitleAnalysisScore } from "../lib/types";

type Props = {
  results: TitleAnalysisResult[];
  loading: boolean;
  onSelect?: (id: string) => void;
};

const TOTAL_VIDEOS = 5;

function scoreTone(score: TitleAnalysisScore): { dot: string; text: string; label: string } {
  if (score >= 5) return { dot: "bg-green-500", text: "text-green-700", label: "Perfekter Fit" };
  if (score >= 4) return { dot: "bg-green-500", text: "text-green-700", label: "Guter Fit" };
  if (score >= 3) return { dot: "bg-amber-400", text: "text-amber-600", label: "Mittlerer Fit" };
  if (score >= 2) return { dot: "bg-accent", text: "text-accent", label: "Schwacher Fit" };
  return { dot: "bg-accent", text: "text-accent", label: "Kein Fit" };
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

function isHighPerformer(views: number | undefined, publishedAt: string | undefined, score: number): boolean {
  if (!views || !publishedAt || score > 2) return false;
  const ageInDays = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 86400000);
  return views / ageInDays > 10_000;
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
      <p className="mb-3">Bewertet wird nach diesen Kriterien:</p>
      <dl className="space-y-3">
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

function Highlights({ results }: { results: TitleAnalysisResult[] }) {
  if (results.length < 3) return null;
  const sorted = [...results].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (best.id === worst.id) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
      <div className="rounded-xl border border-green-200 bg-green-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-green-600 mb-2">
          Stärkstes Thumbnail
        </p>
        {best.thumbnail && (
          <img
            src={best.thumbnail}
            alt=""
            className="w-full rounded-lg object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        )}
        <div className="mt-2 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ background: i <= best.score ? "#16A34A" : "#E5E5E5" }}
            />
          ))}
          <span className="ml-1 text-xs font-semibold text-green-600">{best.score}/5</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-gray1">
          {best.title.length > 50 ? best.title.slice(0, 50) + "..." : best.title}
        </p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent mb-2">
          Größtes Potenzial
        </p>
        {worst.thumbnail && (
          <img
            src={worst.thumbnail}
            alt=""
            className="w-full rounded-lg object-cover"
            style={{ aspectRatio: "16/9" }}
          />
        )}
        <div className="mt-2 flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full"
              style={{ background: i <= worst.score ? "#CC001B" : "#E5E5E5" }}
            />
          ))}
          <span className="ml-1 text-xs font-semibold text-accent">{worst.score}/5</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-gray1">
          {worst.title.length > 50 ? worst.title.slice(0, 50) + "..." : worst.title}
        </p>
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
        Automatische Analyse. Kein Zugriff auf interne YouTube-Daten wie Klickrate oder Impressionen.
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
      <h3 className="text-base font-bold">Titel-Thumbnail-Fit</h3>
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
              ? "Die Analyse dauert gerade länger als üblich. Das kann an der Serverlast liegen."
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
            {results.map((r) => {
              const tone = scoreTone(r.score);
              const cardClass = onSelect
                ? "overflow-hidden rounded-2xl border border-line bg-white shadow-card text-left transition hover:border-ink/40 cursor-pointer w-full"
                : "overflow-hidden rounded-2xl border border-line bg-white shadow-card";
              const inner = (
                <>
                  {r.thumbnail && (
                    <div className="px-3 pt-3">
                      <img
                        src={r.thumbnail}
                        alt=""
                        loading="lazy"
                        className="block w-full rounded-[10px] object-cover"
                        style={{ aspectRatio: "16/9" }}
                      />
                    </div>
                  )}
                  {(r.views !== undefined || r.publishedAt) && (
                    <p className="text-center text-[11px] text-gray1 pt-1.5 pb-0.5">
                      {r.views !== undefined && (
                        <span>{formatViews(r.views)} Aufrufe</span>
                      )}
                      {r.views !== undefined && r.publishedAt && " · "}
                      {r.publishedAt && (
                        <span>{timeAgo(r.publishedAt)}</span>
                      )}
                    </p>
                  )}
                  {isHighPerformer(r.views, r.publishedAt, r.score) && (
                    <div className="mx-3 mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-700">
                      ℹ Hohe Aufrufe trotz schwachem Thumbnail-Design deuten darauf hin, dass hier das Thema die Klicks antreibt — nicht die Verpackung.
                    </div>
                  )}
                  <div className="px-4 pb-4 pt-2">
                    <p className="text-sm font-semibold leading-snug">
                      {r.title}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <AnimatedDots score={r.score} />
                      <span className={`text-xs font-semibold ${tone.text}`}>
                        {tone.label}
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
                          ⚠ Visuell überladen — zu viele Elemente auf einmal
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
          <Highlights results={results} />
          <Summary results={results} />
        </>
      )}
    </div>
  );
}
