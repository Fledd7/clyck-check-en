import { useState } from "react";

export default function ConfirmationScreen() {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""
  )}`;

  return (
    <section className="container-narrow fade-in py-16 sm:py-24">
      <h1 className="text-3xl font-semibold sm:text-4xl">Danke.</h1>
      <p className="mt-5 text-lg leading-relaxed text-ink/75">
        Ich sehe mir deine Angaben persönlich an und melde mich mit einer konkreten Einschätzung.
      </p>

      <div className="mt-12 border-t border-line pt-8">
        <p className="text-sm text-ink/70">
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
