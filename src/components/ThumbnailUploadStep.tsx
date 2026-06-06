import { useState } from "react";
import type { UploadAnalysisResult } from "../lib/types";

type Props = {
  onComplete: (result: UploadAnalysisResult) => void;
};

export default function ThumbnailUploadStep({ onComplete }: Props) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [title, setTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Please upload an image under 5 MB.");
      return;
    }
    setError(null);
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreview(result);
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!imageBase64 || !title.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType, title: title.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.result) {
        onComplete({
          imageBase64,
          mimeType,
          title: title.trim(),
          analysis: data.result,
        });
      } else if (data.reason === "no_key") {
        setError("Analysis is currently unavailable. Please try again later.");
      } else {
        setError("The analysis failed. Please try again.");
      }
    } catch {
      setError("The analysis failed. Please check your connection.");
    } finally {
      setAnalyzing(false);
    }
  }

  const canAnalyze = !!imageBase64 && !!title.trim() && !analyzing;

  return (
    <div className="mt-4">
      <label
        style={{
          display: "block",
          border: `2px dashed ${preview ? "#161616" : "#E5E5E5"}`,
          borderRadius: "12px",
          padding: "16px",
          textAlign: "center",
          cursor: "pointer",
          background: "#F5F5F5",
          transition: "border-color 0.15s",
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {preview ? (
          <img
            src={preview}
            alt="Thumbnail preview"
            style={{
              width: "100%",
              aspectRatio: "16/9",
              objectFit: "cover",
              borderRadius: "8px",
              display: "block",
            }}
          />
        ) : (
          <div>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>🖼</div>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>
              Upload thumbnail here
            </div>
            <div style={{ fontSize: "11px", color: "#6B6B6B", marginTop: "4px" }}>
              JPG, PNG or WebP · max. 5 MB
            </div>
          </div>
        )}
      </label>

      {preview && (
        <p className="mt-1.5 text-xs text-gray1 text-center">
          Click the image to choose a different file.
        </p>
      )}

      <div style={{ marginTop: "14px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: 500,
            marginBottom: "6px",
          }}
        >
          Video title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
          placeholder="What is the video title for this thumbnail?"
          className="input"
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-accent">{error}</p>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        className={canAnalyze ? "btn-primary mt-4 w-full" : "btn-secondary mt-4 w-full"}
        style={{ cursor: canAnalyze ? "pointer" : "not-allowed" }}
      >
        {analyzing ? "Analyzing…" : "Analyze now"}
      </button>
    </div>
  );
}
