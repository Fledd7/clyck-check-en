import { useState } from "react";

type Props = {
  initialUrl?: string;
  onSubmitWithUrl: (url: string) => void;
  onSkip: () => void;
  onBack: () => void;
};

export default function ChannelLinkStep({ initialUrl, onSubmitWithUrl, onSkip, onBack }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const trimmed = url.trim();
  return (
    <section className="container-narrow fade-in py-8">
      <h1 className="text-[22px] font-bold leading-snug sm:text-[28px]">
        Möchtest du deinen Kanal verlinken?
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-gray1">
        Mit Link kann die Einschätzung um öffentliche Kanaldaten und deine letzten Thumbnails ergänzt werden.
        Ohne Link bekommst du eine reine Selbsteinschätzung.
      </p>
      <p className="mt-3 text-sm text-gray1">
        Ich sehe nur öffentliche Daten — keine internen Analytics, keine Klickrate, keine privaten Zahlen.
      </p>

      <div className="mt-6">
        <label htmlFor="channel-url" className="label">
          Kanal-Link, @handle oder Kanalname
        </label>
        <input
          id="channel-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://youtube.com/@deinkanal"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="input"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={trimmed.length === 0}
          onClick={() => onSubmitWithUrl(trimmed)}
          className="btn-primary"
        >
          Mit Kanal weitermachen
        </button>
        <button type="button" onClick={onSkip} className="btn-secondary">
          Ohne Link weitermachen
        </button>
      </div>

      <div className="mt-6">
        <button type="button" onClick={onBack} className="text-[13px] text-gray1 underline-offset-4 hover:underline">
          Zurück
        </button>
      </div>
    </section>
  );
}
