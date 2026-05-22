import { useMemo, useState } from "react";
import type {
  ChannelData,
  ClarityLevel,
  Diagnosis,
  Insight,
  Lever,
  TitleAnalysisResult,
  VideoItem,
} from "../lib/types";
import ThumbnailGrid from "./ThumbnailGrid";
import TitleAnalysis from "./TitleAnalysis";
import ThumbnailModal from "./ThumbnailModal";
import {
  getBenchmarkText,
  loadCheckHistory,
  type CategoryContent,
} from "../lib/results";

type Props = {
  category: CategoryContent;
  channelData: ChannelData | null;
  channelNote: string | null;
  clarityLabel: string;
  clarityLevel: ClarityLevel;
  insights: Insight[];
  levers: Lever[];
  diagnosis: Diagnosis;
  titleAnalysis: TitleAnalysisResult[];
  titleAnalysisLoading: boolean;
  shareUrl: string;
  onContinue: () => void;
  onAddChannelLink: () => void;
};

const levelLabel: Record<Diagnosis["direction"], string> = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
};

function DiagBadge({ level }: { level: Diagnosis["direction"] }) {
  const tone =
    level === "hoch"
      ? "bg-ink text-white border-ink"
      : level === "mittel"
      ? "bg-white text-ink border-ink/40"
      : "bg-white text-ink/60 border-line";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
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
  titleAnalysis,
  titleAnalysisLoading,
  shareUrl,
  onContinue,
  onAddChannelLink,
}: Props) {
  const [tab, setTab] = useState<"assessment" | "analysis">("analysis");
  const [linkCopied, setLinkCopied] = useState(false);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);

  const longformCount = channelData?.longformCount ?? 0;
  const hasLongform = longformCount > 0 && (channelData?.thumbnails?.length ?? 0) > 0;
  const videos: VideoItem[] = channelData?.videos ?? [];

  const analysisById = useMemo(() => {
    const map: Record<string, TitleAnalysisResult> = {};
    for (const r of titleAnalysis) map[r.id] = r;
    return map;
  }, [titleAnalysis]);

  const lastCheck = useMemo(() => loadCheckHistory(), []);
  const daysSinceLastCheck = lastCheck
    ? Math.floor((Date.now() - new Date(lastCheck.date).getTime()) / 86400000)
    : null;

  const avgScore = titleAnalysis.length
    ? titleAnalysis.reduce((s, r) => s + r.score, 0) / titleAnalysis.length
    : null;
  const textIssueCount = titleAnalysis.filter((r) => r.textIssue !== "").length;
  const overloadedCount = titleAnalysis.filter((r) => r.elementCount > 3).length;
  const noContrastCount = titleAnalysis.filter((r) => r.contrast === "Keiner").length;

  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function openVideoFromGridIndex(index: number) {
    const v = videos[index];
    if (v) setOpenVideoId(v.id);
  }

  const openVideo: { video: { id: string; title: string; thumbnail: string }; analysis: TitleAnalysisResult | null } | null =
    (() => {
      if (!openVideoId) return null;
      const v = videos.find((x) => x.id === openVideoId);
      if (!v) return null;
      return {
        video: { id: v.id, title: v.title, thumbnail: v.thumbnail },
        analysis: analysisById[v.id] ?? null,
      };
    })();

  const summaryParts: string[] = [];
  if (avgScore !== null) summaryParts.push(`Titel-Thumbnail-Fit: Ø ${avgScore.toFixed(1)} / 5`);
  if (textIssueCount > 0)
    summaryParts.push(`${textIssueCount} Video${textIssueCount === 1 ? "" : "s"} mit Textproblem`);
  if (overloadedCount > 0)
    summaryParts.push(`${overloadedCount} Video${overloadedCount === 1 ? "" : "s"} überladen`);
  if (noContrastCount > 0)
    summaryParts.push(`${noContrastCount} Video${noContrastCount === 1 ? "" : "s"} ohne Kontrast`);
  if (
    avgScore !== null &&
    textIssueCount === 0 &&
    overloadedCount === 0 &&
    noContrastCount === 0
  ) {
    summaryParts.push("Kein offensichtliches Problem erkannt");
  }
  const summaryLine = summaryParts.join(" · ");

  // Delta (only show if last check is ≥ 7 days old and we have an avg score)
  const deltaInfo = (() => {
    if (!lastCheck || avgScore === null || lastCheck.avgFitScore <= 0) return null;
    if (daysSinceLastCheck === null || daysSinceLastCheck < 7) return null;
    const delta = avgScore - lastCheck.avgFitScore;
    let tone = "text-ink/60";
    if (delta > 0.2) tone = "text-green-700";
    else if (delta < -0.2) tone = "text-red-700";
    const sign = delta > 0 ? "+" : "";
    return {
      tone,
      text: `Letzter Check vor ${daysSinceLastCheck} Tagen: Fit-Score Ø ${lastCheck.avgFitScore.toFixed(
        1
      )} → heute Ø ${avgScore.toFixed(1)} (${sign}${delta.toFixed(1)})`,
    };
  })();

  return (
    <section className="container-narrow fade-in py-8">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/60">Erste Einschätzung</p>
      <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">{category.headline}</h1>
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

      {/* Tab bar — always visible; "Kanal-Analyse" is the default landing tab */}
      <div className="mt-6 flex gap-1 border-b border-line">
        <button
          type="button"
          onClick={() => setTab("analysis")}
          className={`pb-2 px-3 text-sm font-medium transition-colors ${
            tab === "analysis"
              ? "border-b-2 border-ink text-ink"
              : "text-ink/50 hover:text-ink/80"
          }`}
        >
          Kanal-Analyse
          {titleAnalysisLoading && (
            <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-ink/40" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("assessment")}
          className={`pb-2 px-3 text-sm font-medium transition-colors ${
            tab === "assessment"
              ? "border-b-2 border-ink text-ink"
              : "text-ink/50 hover:text-ink/80"
          }`}
        >
          Einschätzung
        </button>
      </div>

      {/* ── Tab 1 (default): Kanal-Analyse ── */}
      {tab === "analysis" && (
        <>
          {!channelData ? (
            <div className="mt-6 card">
              <p className="text-sm leading-relaxed text-ink/75">
                Du hast keinen Kanal-Link eingegeben. Die Einschätzung basiert
                auf deinen Antworten. Mit Link bekommst du eine detailliertere
                Analyse.
              </p>
              <button
                type="button"
                onClick={onAddChannelLink}
                className="btn-secondary mt-4 text-sm"
              >
                Kanal-Link nachträglich eingeben
              </button>
            </div>
          ) : (
            <>
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
                  {typeof channelData.uploadCadenceDays === "number" &&
                    channelData.uploadCadenceDays > 0 && (
                      <li>Ø Upload-Abstand: ca. {channelData.uploadCadenceDays} Tage</li>
                    )}
                  {typeof channelData.medianViews === "number" && (
                    <li>Median-Views: {channelData.medianViews.toLocaleString("de-DE")}</li>
                  )}
                  {typeof channelData.longformCount === "number" && (
                    <li>Longform-Videos: {channelData.longformCount}</li>
                  )}
                </ul>
                {typeof channelData.subscriberCount === "number" && (
                  <p className="mt-3 text-sm text-ink/65 leading-relaxed">
                    {getBenchmarkText(channelData.subscriberCount)}
                  </p>
                )}
              </div>

              {hasLongform && (
                <div className="mt-6 card">
                  <p className="text-sm font-medium text-ink/70">
                    Deine letzten Longform-Thumbnails
                  </p>
                  <div className="mt-3">
                    <ThumbnailGrid
                      thumbnails={channelData.thumbnails ?? []}
                      onSelect={
                        videos.length > 0 && titleAnalysis.length > 0
                          ? openVideoFromGridIndex
                          : undefined
                      }
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink/55">
                    Nur Longform-Videos werden analysiert. Shorts werden bewusst
                    ausgelassen.
                    {videos.length > 0 && titleAnalysis.length > 0 && (
                      <> Klick ein Thumbnail an für Details.</>
                    )}
                  </p>
                </div>
              )}

              {(titleAnalysisLoading || titleAnalysis.length > 0) && (
                <div className="mt-6 card">
                  <TitleAnalysis
                    loading={titleAnalysisLoading}
                    results={titleAnalysis}
                    onSelect={titleAnalysis.length > 0 ? setOpenVideoId : undefined}
                  />
                </div>
              )}

              <div className="mt-6 card">
                <h3 className="text-base font-semibold">Packaging-Diagnose</h3>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink/80">Kanalrichtung</span>
                    <DiagBadge level={diagnosis.direction} />
                  </div>
                  <div className="h-px bg-line" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink/80">Thumbnail-System</span>
                    <DiagBadge level={diagnosis.system} />
                  </div>
                  <div className="h-px bg-line" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink/80">Upload-Rhythmus</span>
                    <DiagBadge level={diagnosis.cadence} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setTab("assessment")}
              className="text-sm text-ink/60 underline-offset-4 hover:underline"
            >
              Zur Einschätzung →
            </button>
          </div>
        </>
      )}

      {/* ── Tab 2: Einschätzung ── */}
      {tab === "assessment" && (
        <>
          {deltaInfo && (
            <p className={`mt-4 text-sm leading-relaxed ${deltaInfo.tone}`}>
              {deltaInfo.text}
            </p>
          )}

          {summaryLine && (
            <button
              type="button"
              onClick={() => setTab("analysis")}
              className="mt-3 text-left text-xs text-ink/55 underline-offset-2 hover:text-ink/80 hover:underline"
            >
              {summaryLine}
            </button>
          )}

          <p className="mt-6 text-base leading-relaxed text-ink/80">{category.explanation}</p>

          {channelNote && <p className="mt-5 text-sm italic text-ink/70">{channelNote}</p>}

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
              Die automatische Einschätzung zeigt dir die Richtung. Für eine
              echte Bewertung muss ich mir Kanal, Titel und Thumbnails manuell
              ansehen.
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

          <div className="mt-8 flex items-center gap-2">
            <button type="button" onClick={copyShareUrl} className="btn-secondary text-sm">
              {linkCopied ? "Kopiert!" : "🔗 Ergebnis-Link kopieren"}
            </button>
          </div>
        </>
      )}

      {openVideo && (
        <ThumbnailModal
          video={openVideo.video}
          analysis={openVideo.analysis}
          onClose={() => setOpenVideoId(null)}
        />
      )}
    </section>
  );
}
