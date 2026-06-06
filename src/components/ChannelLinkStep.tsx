import { useState } from "react";
import type { UploadAnalysisResult } from "../lib/types";
import ThumbnailUploadStep from "./ThumbnailUploadStep";

type Props = {
  initialUrl?: string;
  onSubmitWithUrl: (url: string) => void;
  onUploadComplete: (result: UploadAnalysisResult) => void;
  onSkip: () => void;
  onBack: () => void;
};

export default function ChannelLinkStep({
  initialUrl,
  onSubmitWithUrl,
  onUploadComplete,
  onSkip,
  onBack,
}: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [linkMode, setLinkMode] = useState<"channel" | "upload" | null>("channel");
  const trimmed = url.trim();

  return (
    <section className="container-narrow fade-in py-8">
      <h1 className="text-[22px] font-bold leading-snug sm:text-[28px]">
        Would you like to link your YouTube channel?
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-gray1">
        With a link, the assessment can be extended with public channel data and your latest thumbnails.
        Or upload a single thumbnail directly for a quick analysis.
      </p>

      {/* Mode selector */}
      <div
        className="mt-6"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => setLinkMode("channel")}
          style={{
            padding: "16px",
            borderRadius: "12px",
            border: `1.5px solid ${linkMode === "channel" ? "#161616" : "#E5E5E5"}`,
            background: linkMode === "channel" ? "#161616" : "#ffffff",
            color: linkMode === "channel" ? "#ffffff" : "#161616",
            cursor: "pointer",
            textAlign: "center",
            fontFamily: "var(--font-sora)",
          }}
        >
          <div style={{ fontSize: "22px", marginBottom: "6px" }}>🔗</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>Link channel</div>
          <div
            style={{
              fontSize: "11px",
              color: linkMode === "channel" ? "rgba(255,255,255,0.6)" : "#6B6B6B",
              marginTop: "4px",
            }}
          >
            Channel URL or @handle
          </div>
        </button>

        <button
          type="button"
          onClick={() => setLinkMode("upload")}
          style={{
            padding: "16px",
            borderRadius: "12px",
            border: `1.5px solid ${linkMode === "upload" ? "#161616" : "#E5E5E5"}`,
            background: linkMode === "upload" ? "#161616" : "#ffffff",
            color: linkMode === "upload" ? "#ffffff" : "#161616",
            cursor: "pointer",
            textAlign: "center",
            fontFamily: "var(--font-sora)",
          }}
        >
          <div style={{ fontSize: "22px", marginBottom: "6px" }}>🖼</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>Upload thumbnail</div>
          <div
            style={{
              fontSize: "11px",
              color: linkMode === "upload" ? "rgba(255,255,255,0.6)" : "#6B6B6B",
              marginTop: "4px",
            }}
          >
            Analyze a single image
          </div>
        </button>
      </div>

      {/* Channel URL input */}
      {linkMode === "channel" && (
        <>
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
        </>
      )}

      {/* Upload mode */}
      {linkMode === "upload" && (
        <ThumbnailUploadStep onComplete={onUploadComplete} />
      )}

      {/* No mode selected — show skip */}
      {linkMode === null && (
        <div className="mt-6">
          <button type="button" onClick={onSkip} className="btn-secondary">
            Skip
          </button>
        </div>
      )}

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
