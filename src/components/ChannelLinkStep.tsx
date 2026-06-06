import { useState } from "react";

type Props = {
  initialUrl?: string;
  onSubmitWithUrl: (url: string) => void;
  onSkip: () => void;
  onBack: () => void;
};

export default function ChannelLinkStep({
  initialUrl,
  onSubmitWithUrl,
  onSkip,
  onBack,
}: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const trimmed = url.trim();

  return (
    <section className="container-narrow fade-in py-8">
      <h1 className="text-[22px] font-bold leading-snug sm:text-[28px]">
        Would you like to link your YouTube channel?
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-gray1">
        With a link, the assessment can be extended with public channel data and your latest thumbnails.
      </p>

      <div className="mt-5">
        <label htmlFor="channel-url" className="label">
          Enter channel URL or @handle
        </label>
        <input
          id="channel-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="https://youtube.com/@yourchannel"
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
          Continue with channel
        </button>
        <button type="button" onClick={onSkip} className="btn-secondary">
          Skip
        </button>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={onBack}
          className="text-[13px] text-gray1 underline-offset-4 hover:underline"
        >
          ← Back
        </button>
      </div>
    </section>
  );
}
