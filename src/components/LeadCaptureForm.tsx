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
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container-narrow fade-in py-8">
      <h1 className="text-[22px] font-bold leading-snug sm:text-[28px]">
        Request personal assessment
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-gray1">
        That was the quick assessment. If you'd like, I'll personally review your answers
        and get back to you with more specific feedback. Free and non-binding.
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
          <label htmlFor="email" className="label">Email</label>
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
          <label htmlFor="message" className="label">What do you want to achieve with your channel?</label>
          <textarea
            id="message"
            rows={4}
            placeholder="e.g. more client inquiries, clearer positioning, more professional appearance..."
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
            I agree that my information will be used to process my request. No sharing with third parties.
          </span>
        </label>

        {error && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm text-accent">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={!canSubmit} className="btn-primary w-full">
            {submitting ? "Sending …" : "Request assessment"}
          </button>
          <button type="button" onClick={onBack} className="btn-secondary">
            ← Back
          </button>
        </div>
      </form>
    </section>
  );
}
