import { useEffect, useState } from "react";
import type { TitleAnalysisResult, TitleAnalysisScore } from "../lib/types";
import { getThumbnailRecommendation } from "../lib/results";

type Props = {
  result: TitleAnalysisResult;
};

function scoreTone(score: TitleAnalysisScore): { dot: string; text: string; label: string } {
  if (score >= 5) return { dot: "bg-green-500", text: "text-green-700", label: "Perfect Fit" };
  if (score >= 4) return { dot: "bg-green-500", text: "text-green-700", label: "Good Fit" };
  if (score >= 3) return { dot: "bg-amber-400", text: "text-amber-600", label: "Average Fit" };
  if (score >= 2) return { dot: "bg-accent", text: "text-accent", label: "Weak Fit" };
  return { dot: "bg-accent", text: "text-accent", label: "No Fit" };
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

export default function SingleAnalysisCard({ result: r }: Props) {
  const tone = scoreTone(r.score);
  const recommendation = getThumbnailRecommendation(r);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="px-4 py-4">
        <p className="text-sm font-semibold leading-snug">{r.title}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AnimatedDots score={r.score} />
          <span className={`text-sm font-bold ${tone.text}`}>
            {r.score}/5 — {tone.label}
          </span>
        </div>

        {r.reason && (
          <p className="mt-2 text-xs italic text-gray1 leading-relaxed">
            „{r.reason}"
          </p>
        )}

        <div className="mt-2 space-y-0.5">
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
          <p className="mt-2 text-xs text-gray1 leading-relaxed">
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

        {r.concept && r.score <= 3 && (
          <div className="mt-3 rounded-lg border border-line bg-bg p-3">
            <p className="text-xs font-semibold text-ink mb-1">Image concept suggestion</p>
            <p className="text-xs text-gray1 leading-relaxed">{r.concept}</p>
          </div>
        )}

        {recommendation && (
          <div className="mt-3 rounded-lg bg-ink/5 px-3 py-2.5">
            <p className="text-xs font-semibold text-ink mb-0.5">Recommendation</p>
            <p className="text-xs text-gray1 leading-relaxed">{recommendation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
