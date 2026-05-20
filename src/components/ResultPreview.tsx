import type {
  ChannelData,
  ClarityLevel,
  Diagnosis,
  Insight,
  Lever,
  ResultCategory,
} from "../lib/types";
import ThumbnailGrid from "./ThumbnailGrid";

type Props = {
  category: ResultCategory;
  channelData: ChannelData | null;
  channelNote: string | null;
  clarityLabel: string;
  clarityLevel: ClarityLevel;
  insights: Insight[];
  levers: Lever[];
  diagnosis: Diagnosis;
  onContinue: () => void;
};

const levelLabel: Record<Diagnosis["direction"], string> = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
};

function Badge({ level }: { level: Diagnosis["direction"] }) {
  const tone =
    level === "hoch"
      ? "bg-ink text-white border-ink"
      : level === "mittel"
      ? "bg-white text-ink border-ink/40"
      : "bg-white text-ink/60 border-line";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
      {levelLabel[level]}
    </span>
  );
}

export default function ResultPreview({
  category,
  channelData,
  channelNote,
  clarityLabel,
  clarityLevel,
  insights,
  levers,
  diagnosis,
  onContinue,
}: Props) {
  const longformCount = channelData?.longformCount ?? 0;
  const hasLongform = longformCount > 0 && (channelData?.thumbnails?.length ?? 0) > 0;

  return (
    <section className="container-narrow fade-in py-8">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/60">
        Erste Einschätzung
      </p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
        {category.headline}
      </h1>
      <p className="mt-2">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
            clarityLevel === "Sehr hoch"
              ? "bg-ink text-white border-ink"
              : clarityLevel === "Hoch"
              ? "border-ink/70 text-ink bg-white"
              : clarityLevel === "Mittel"
              ? "border-ink/40 text-ink bg-white"
              : "border-line text-ink/60 bg-white"
          }`}
        >
          {clarityLabel}
        </span>
      </p>
      <p className="mt-1 text-xs text-ink/55">
        Basierend auf deinen Antworten und öffentlichen Kanaldaten.
      </p>
      <p className="mt-4 text-base leading-relaxed text-ink/80">{category.text}</p>

      {channelData && (
        <div className="mt-6 card">
          <h2 className="text-base font-semibold">
            {channelData.title ?? "Dein Kanal"}
            {channelData.handle ? (
              <span className="ml-2 text-ink/55">@{channelData.handle}</span>
            ) : null}
          </h2>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-ink/70 sm:grid-cols-3">
            {typeof channelData.subscriberCount === "number" && (
              <li>Abonnenten: {channelData.subscriberCount.toLocaleString("de-DE")}</li>
            )}
            {typeof channelData.videoCount === "number" && (
              <li>Videos: {channelData.videoCount.toLocaleString("de-DE")}</li>
            )}
            {typeof channelData.uploadCadenceDays === "number" && channelData.uploadCadenceDays > 0 && (
              <li>Ø Upload-Abstand: ca. {channelData.uploadCadenceDays} Tage</li>
            )}
            {typeof channelData.medianViews === "number" && (
              <li>Median-Views: {channelData.medianViews.toLocaleString("de-DE")}</li>
            )}
            {typeof channelData.longformCount === "number" && (
              <li>Longform-Videos: {channelData.longformCount}</li>
            )}
          </ul>
          {hasLongform && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-ink/70">Deine letzten Longform-Thumbnails</p>
              <ThumbnailGrid thumbnails={channelData.thumbnails ?? []} />
              <p className="mt-2 text-xs text-ink/55">
                Analysiert werden nur erkennbare Longform-Videos. Shorts werden für diese Einschätzung bewusst ausgelassen.
              </p>
            </div>
          )}
        </div>
      )}

      {channelNote && (
        <p className="mt-5 text-sm italic text-ink/70">{channelNote}</p>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Was bei dir auffällt</h2>
        <div className="mt-4 grid gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="card">
              <h3 className="text-base font-semibold">{ins.headline}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/75">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Packaging-Diagnose</h2>
        <div className="mt-4 card">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink/80">Kanalrichtung</span>
              <Badge level={diagnosis.direction} />
            </div>
            <div className="h-px bg-line" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink/80">Thumbnail-System</span>
              <Badge level={diagnosis.system} />
            </div>
            <div className="h-px bg-line" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink/80">Upload-Rhythmus</span>
              <Badge level={diagnosis.cadence} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Deine nächsten 3 Hebel</h2>
        <ol className="mt-4 grid gap-3">
          {levers.map((lv, i) => (
            <li key={i} className="card">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold">{lv.headline}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{lv.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 card">
        <h2 className="text-lg font-semibold">Willst du wissen, was ich konkret ändern würde?</h2>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Die automatische Einschätzung zeigt dir die Richtung. Für eine echte Bewertung muss ich
          mir Kanal, Titel und Thumbnails manuell ansehen.
        </p>
        <ul className="mt-4 grid gap-1 text-sm text-ink/70">
          <li>· Kanalwirkung auf den ersten Blick</li>
          <li>· Zusammenspiel aus Titel, Idee und Thumbnail</li>
          <li>· ob Audit, System oder laufende Unterstützung sinnvoller ist</li>
        </ul>
        <button type="button" onClick={onContinue} className="btn-primary mt-6">
          Persönliche Einschätzung anfragen
        </button>
      </div>
    </section>
  );
}
