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
    const lines = ["Ich habe gerade meinen YouTube-Kanal mit dem Clyck Check analysiert."];
    if (lastCheck && lastCheck.avgFitScore > 0) {
      lines.push(`Mein Titel-Thumbnail-Fit-Score: Ø ${lastCheck.avgFitScore.toFixed(1)} / 5`);
    }
    if (lastCheck?.categoryHeadline) {
      lines.push(`Ergebnis: ${lastCheck.categoryHeadline}`);
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
      <h1 className="text-[32px] font-bold sm:text-[38px]">Danke.</h1>
      <p className="mt-5 text-lg leading-relaxed text-gray1">
        Ich sehe mir deine Angaben persönlich an und melde mich mit einer
        konkreten Einschätzung.
      </p>

      <div className="mt-12 border-t border-line pt-8">
        <p className="text-sm text-gray1">
          Kennst du jemanden, dem dieser Check helfen könnte?
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            LinkedIn teilen
          </a>
          <button type="button" onClick={copyLink} className="btn-secondary text-sm">
            {copied ? "Kopiert!" : "Link kopieren"}
          </button>
        </div>
      </div>
    </section>
  );
}
