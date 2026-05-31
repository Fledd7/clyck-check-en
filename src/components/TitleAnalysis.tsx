import { useEffect, useState } from "react";
import type { TitleAnalysisResult, TitleAnalysisScore } from "../lib/types";

type Props = {
  results: TitleAnalysisResult[];
  loading: boolean;
  onSelect?: (id: string) => void;
};

const TOTAL_VIDEOS = 5;

function scoreTone(score: TitleAnalysisScore): { dot: string; text: string; label: string } {
  if (score >= 5) return { dot: "bg-green-500", text: "text-green-700", label: "Perfect Fit" };
  if (score >= 4) return { dot: "bg-green-500", text: "text-green-700", label: "Good Fit" };
  if (score >= 3) return { dot: "bg-amber-400", text: "text-amber-600", label: "Average Fit" };
  if (score >= 2) return { dot: "bg-accent", text: "text-accent", label: "Weak Fit" };
  return { dot: "bg-accent", text: "text-accent", label: "No Fit" };
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (views >= 1_000) return Math.round(views / 1_000) + "K";
  return views.toString();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function isHighPerformer(views: number | undefined, publishedAt: string | undefined, score: number): boolean {
  if (!views || !publishedAt || score > 2) return false;
  const ageInDays = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 86400000);
  return views / ageInDays > 10_000;
}

function textIssueCopy(issue: string): string {
  if (issue === "zu lang") return "More than 5 words — shorter is stronger";
  if (issue === "wiederholt Titel") return "Text repeats the title — wasted space";
  return "Text doesn't strengthen the click incentive";
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
      <p className="mb-3">Assessed according to these criteria:</p>
      <dl className="space-y-3">
        <div>
          <dt className="font-semibold text-ink">3-Element Rule</dt>
          <dd>
            Maximum 3 main pieces of information. More means overload — the
            viewer's eye gets lost.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Text Rule</dt>
          <dd>
            Text only when it directly strengthens the click incentive. Under 3
            words. Never repeat the title 1:1.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Contrast</dt>
          <dd>
            Luminosity, color or saturation —
            at least one must be present.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Color Impact</dt>
          <dd>
            Is there a dominant color that stands out in the feed?
            Do the colors look harmonious or chaotic?
            Does the thumbnail stand out through its color scheme?
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink">Title-Thumbnail Fit</dt>
          <dd>
            Do image and title reinforce each other — or do they
            work past each other?
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-gray1">
        Automated analysis. No access to internal YouTube data such as click rate or impressions.
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
          Strongest Thumbnail
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
          Biggest Potential
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
  const overloadedModernCount = results.filter((r) => r.styleAge === "überladen").length;
  const modernCount = results.filter((r) => r.styleAge === "zeitgemäß").length;

  let headline = "";
  let body = "";

  if (avg >= 4.0) {
    headline = `Ø ${avgFormatted} / 5  —  Strong Title-Thumbnail Fit`;
    body =
      "Most of your videos use the interplay of image and title well.";
  } else if (avg >= 3.0) {
    headline = `Ø ${avgFormatted} / 5  —  Mixed Title-Thumbnail Fit`;
    body = `${weakCount} of ${total} videos have a weak fit. You're losing clicks here, even if the individual thumbnails look good.`;
  } else {
    headline = `Ø ${avgFormatted} / 5  —  Weak Title-Thumbnail Fit`;
    body =
      "In most videos, title and image don't work as a team. This is one of the most common reasons for poor click rates.";
  }

  return (
    <div className="mt-5 rounded-2xl border border-line bg-white p-4">
      <p className="font-bold">{headline}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray1">{body}</p>

      {(overloadedCount > 0 ||
        textIssueCount > 0 ||
        noContrastCount > 0 ||
        brandingCount > 0 ||
        overloadedModernCount > 0 ||
        (outdatedCount > 0 && outdatedCount >= total / 2) ||
        modernCount >= total * 0.7) && (
        <div className="mt-3 space-y-1">
          {overloadedCount > 0 && (
            <p className="text-sm text-gray1">
              ⚠ {overloadedCount} of {total} videos appear visually overloaded.
            </p>
          )}
          {textIssueCount > 0 && (
            <p className="text-sm text-gray1">
              ⚠ {textIssueCount} videos have a text issue in the
              thumbnail.
            </p>
          )}
          {noContrastCount > 0 && (
            <p className="text-sm text-gray1">
              ⚠ {noContrastCount} videos have no clear visual contrast.
            </p>
          )}
          {brandingCount > 0 && (
            <p className="text-sm text-gray1">
              ✓ {brandingCount} of {total} videos show a recurring
              channel style.
            </p>
          )}
          {overloadedModernCount > 0 && (
            <p className="mt-1 text-sm text-orange-700">
              ⚠ {overloadedModernCount} of {total} thumbnails are modern but visually overloaded.
            </p>
          )}
          {outdatedCount > 0 && outdatedCount >= total / 2 && (
            <p className="mt-1 text-sm text-amber-600">
              ⚠ Several thumbnails show an older visual style. A
              more modern packaging system could significantly improve click strength.
            </p>
          )}
          {modernCount >= total * 0.7 && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Most thumbnails appear visually contemporary.
            </p>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray1">
        Automated analysis. No access to internal YouTube data such as click rate or impressions.
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
      <h3 className="text-base font-bold">Title-Thumbnail Fit</h3>
      <p className="mt-1 text-sm text-gray1 leading-relaxed">
        Your thumbnails are analyzed based on click psychology and
        thumbnail methodology.
      </p>

      <button
        type="button"
        onClick={() => setCriteriaOpen((v) => !v)}
        aria-expanded={criteriaOpen}
        className="mt-2 text-xs font-medium text-gray1 underline-offset-2 hover:text-ink hover:underline"
      >
        ⓘ How is it assessed?
      </button>

      {criteriaOpen && <CriteriaPanel />}

      {loading ? (
        <div className="mt-4">
          <p className="text-sm text-gray1">
            {timedOut
              ? "The analysis is taking longer than usual. This may be due to server load."
              : `Analyzing video ${Math.min(analyzedCount + 1, TOTAL_VIDEOS)} of ${TOTAL_VIDEOS} …`}
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
                        <span>{formatViews(r.views)} views</span>
                      )}
                      {r.views !== undefined && r.publishedAt && " · "}
                      {r.publishedAt && (
                        <span>{timeAgo(r.publishedAt)}</span>
                      )}
                    </p>
                  )}
                  {isHighPerformer(r.views, r.publishedAt, r.score) && (
                    <div className="mx-3 mt-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-700">
                      ℹ High views despite weak thumbnail design suggest the topic is driving clicks here — not the packaging.
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
                          ⚠ Visually overloaded — too many elements at once
                        </p>
                      )}
                      {r.textIssue && (
                        <p className="text-xs text-accent">
                          ⚠ Text: {textIssueCopy(r.textIssue)}
                        </p>
                      )}
                      {r.contrast && r.contrast !== "None" && (
                        <p className="text-xs text-green-600">
                          ✓ Contrast: {r.contrast}
                        </p>
                      )}
                      {r.contrast === "None" && (
                        <p className="text-xs text-accent">
                          ⚠ No clear contrast recognizable
                        </p>
                      )}
                      {r.colorImpact === "stark" && r.colorDominant && (
                        <p className="text-xs text-green-600">
                          ✓ Strong color impact in feed
                        </p>
                      )}
                      {r.colorHarmony === "chaotisch" && (
                        <p className="text-xs text-accent">
                          ⚠ Color palette appears restless
                        </p>
                      )}
                      {r.colorImpact === "schwach" && (
                        <p className="text-xs text-accent">
                          ⚠ Weak color impact — gets lost in feed
                        </p>
                      )}
                    </div>
                    {r.styleAge === "überladen" && (
                      <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 p-2.5">
                        <p className="text-xs font-bold text-orange-700">
                          Visually overloaded — but contemporary
                        </p>
                        <p className="mt-0.5 text-xs text-orange-800 leading-relaxed">
                          The thumbnail has a modern style and recognizable design effort — but too many elements at once.
                          Less would be more here.
                        </p>
                      </div>
                    )}
                    {r.styleAge === "veraltet" && (
                      <div className="mt-2 rounded-lg border border-orange-200 bg-[#FFF8F0] p-2.5">
                        <p className="text-xs font-bold text-orange-700">
                          Style: Older Thumbnail Aesthetic
                        </p>
                        <p className="mt-0.5 text-xs text-orange-800 leading-relaxed">
                          This style was widespread in 2018–2022.
                          Clearer, more image-driven thumbnails tend to perform
                          better in most niches today.
                        </p>
                      </div>
                    )}
                    {r.styleAge === "zeitgemäß" && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Style: Contemporary
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
