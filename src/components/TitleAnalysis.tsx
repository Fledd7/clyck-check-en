import type { TitleAnalysisResult, TitleRating } from "../lib/types";

type Props = {
  loading: boolean;
  result: TitleAnalysisResult | null;
  error?: boolean;
};

const ratingConfig: Record<TitleRating, { label: string; className: string }> = {
  hoch: {
    label: "Hoch",
    className: "bg-green-50 border-green-200 text-green-800",
  },
  mittel: {
    label: "Mittel",
    className: "bg-yellow-50 border-yellow-200 text-yellow-800",
  },
  niedrig: {
    label: "Niedrig",
    className: "bg-red-50 border-red-200 text-red-800",
  },
};

function Skeleton() {
  return (
    <div className="mt-4 grid gap-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card flex items-start gap-3">
          <div className="h-6 w-16 rounded-full bg-line" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-line" />
            <div className="h-3 w-1/2 rounded bg-line/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TitleAnalysis({ loading, result, error }: Props) {
  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="text-base font-semibold">Titel-Analyse</h3>
        <p className="mt-1 text-sm text-ink/60">Gemini bewertet deine Videotitel …</p>
        <Skeleton />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mt-6">
        <h3 className="text-base font-semibold">Titel-Analyse</h3>
        <p className="mt-2 text-sm text-ink/55">
          Die Titel-Analyse ist gerade nicht verfügbar. Die übrige Einschätzung bleibt davon unberührt.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold">Titel-Analyse</h3>
      <p className="mt-1 text-sm text-ink/60 leading-relaxed">{result.summary}</p>
      <div className="mt-3 grid gap-3">
        {result.items.map((item) => {
          const cfg = ratingConfig[item.rating];
          return (
            <div key={item.videoId} className="card flex items-start gap-3 p-3">
              <span
                className={`mt-0.5 inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
              >
                {cfg.label}
              </span>
              <div>
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                <p className="mt-0.5 text-xs text-ink/60 leading-relaxed">{item.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-ink/45">
        Diese Bewertung wurde automatisch von Gemini generiert und dient als erster Anhaltspunkt.
      </p>
    </div>
  );
}
