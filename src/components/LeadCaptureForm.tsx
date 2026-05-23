import { useState } from "react";

export type LeadFormValues = {
  name: string;
  email: string;
  message: string;
  consent: boolean;
};

type Props = {
  onSubmit: (values: LeadFormValues) => Promise<void> | void;
  onBack: () => void;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadCaptureForm({ onSubmit, onBack }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameOk = name.trim().length >= 2;
  const emailOk = emailRegex.test(email.trim());
  const canSubmit = nameOk && emailOk && consent && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        consent,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Etwas ist schiefgelaufen. Bitte noch einmal versuchen."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container-narrow fade-in py-8">
      <h1 className="text-[22px] font-bold leading-snug sm:text-[28px]">
        Persönliche Einschätzung anfragen
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-gray1">
        Das war die kurze Einschätzung. Wenn du möchtest, schaue ich mir deine Angaben persönlich an
        und melde mich mit einer konkreteren Rückmeldung. Kostenlos und unverbindlich.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="email" className="label">E-Mail</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="message" className="label">Was möchtest du mit deinem Kanal erreichen?</label>
          <textarea
            id="message"
            rows={4}
            placeholder="z. B. mehr Kundenanfragen, klarere Positionierung, professionellerer Auftritt..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input resize-y"
          />
        </div>
        <label className="flex items-start gap-3 text-sm text-gray1">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-line accent-ink"
            required
          />
          <span>
            Deine Angaben nutze ich ausschließlich, um deine Anfrage einzuschätzen und dir zu antworten.
            Keine Weitergabe an Dritte, keine Veröffentlichung.
          </span>
        </label>

        {error && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm text-accent">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={!canSubmit} className="btn-primary w-full">
            {submitting ? "Wird gesendet …" : "Einschätzung anfragen"}
          </button>
          <button type="button" onClick={onBack} className="btn-secondary">
            Zurück
          </button>
        </div>
      </form>
    </section>
  );
}
