import { useMemo, useState } from "react";
import { loadCheckHistory } from "../lib/results";

export default function ConfirmationScreen() {
  const [copied, setCopied] = useState(false);

  const shareTarget = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin + window.location.pathname;
  }, []);

  const lastCheck = useMemo(() => loadCheckHistory(), []);

  const linkedInText = useMemo(() => {
    const lines = ["I just analyzed my YouTube channel with Clyck Check."];
    if (lastCheck && lastCheck.avgFitScore > 0) {
      lines.push(`My Title-Thumbnail Fit Score: Ø ${lastCheck.avgFitScore.toFixed(1)} / 5`);
    }
    if (lastCheck?.categoryHeadline) {
      lines.push(`Result: ${lastCheck.categoryHeadline}`);
    }
    lines.push(`Tool: ${shareTarget}`);
    return lines.join("\n\n");
  }, [lastCheck, shareTarget]);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareTarget
  )}&summary=${encodeURIComponent(linkedInText)}`;

  function copyLink() {
    navigator.clipboard.writeText(shareTarget).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="container-narrow fade-in py-16 sm:py-24">
      <h1 className="text-[32px] font-bold sm:text-[38px]">Thank you.</h1>
      <p className="mt-5 text-lg leading-relaxed text-gray1">
        I'll personally review your answers and get back to you with a
        concrete assessment.
      </p>

      <div className="mt-12 border-t border-line pt-8">
        <p className="text-sm text-gray1">
          Know someone this could help?
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            Share on LinkedIn
          </a>
          <button type="button" onClick={copyLink} className="btn-secondary text-sm">
            {copied ? "Copied!" : "🔗 Copy link"}
          </button>
        </div>
      </div>
    </section>
  );
}
