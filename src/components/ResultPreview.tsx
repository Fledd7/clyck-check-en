import { useMemo, useState } from "react";
import type {
  ChannelData,
  ClarityLevel,
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
  hasEnoughData: boolean;
  insights: Insight[];
  levers: Lever[];
  titleAnalysis: TitleAnalysisResult[];
  titleAnalysisLoading: boolean;
  shareUrl: string;
  onContinue: () => void;
  onAddChannelLink: () => void;
};

export default function ResultPreview({
  category,
  channelData,
  channelNote,
  clarityLabel,
  clarityLevel,
  hasEnoughData,
  insights,
  levers,
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

  const openVideo: { video: { id: string; title: string; thumbnail: string; duration?: string; views?: number; publishedAt?: string }; analysis: TitleAnalysisResult | null } | null =
    (() => {
      if (!openVideoId) return null;
      const v = videos.find((x) => x.id === openVideoId);
      if (!v) return null;
      return {
        video: { id: v.id, title: v.title, thumbnail: v.thumbnail, duration: v.duration, views: v.views, publishedAt: v.publishedAt },
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

  const deltaInfo = (() => {
    if (!lastCheck || avgScore === null || lastCheck.avgFitScore <= 0) return null;
    if (daysSinceLastCheck === null || daysSinceLastCheck < 7) return null;
    const delta = avgScore - lastCheck.avgFitScore;
    let tone = "text-gray1";
    if (delta > 0.2) tone = "text-green-700";
    else if (delta < -0.2) tone = "text-accent";
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
        Erste Einschätzung
      </p>
      <h1 className="mt-3 text-[28px] font-bold leading-snug sm:text-[34px]">
        {category.headline}
      </h1>
      {hasEnoughData && clarityLabel ? (
        <>
          <p className="mt-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                clarityLevel === "Sehr hoch"
                  ? "bg-accent text-white"
                  : "bg-ink text-white"
              }`}
            >
              {titleAnalysisLoading ? "Clyck-Score: wird berechnet..." : clarityLabel}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray1">
            Basierend auf öffentlichen Kanaldaten und Thumbnail-Analyse.
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-gray1">
          Für einen Clyck-Score bitte Kanal verlinken.
        </p>
      )}

      {/* Tab bar */}
      <div className="mt-6 flex gap-8 border-b border-line mb-6">
        <button
          type="button"
          onClick={() => setTab("analysis")}
          className={`pb-3 text-sm font-medium transition-colors ${
            tab === "analysis"
              ? "border-b-2 border-accent text-ink"
              : "text-gray1 hover:text-ink"
          }`}
        >
          Kanal-Analyse
          {titleAnalysisLoading && (
            <span className="ml-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-gray1" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("assessment")}
          className={`pb-3 text-sm font-medium transition-colors ${
            tab === "assessment"
              ? "border-b-2 border-accent text-ink"
              : "text-gray1 hover:text-ink"
          }`}
        >
          Einschätzung
        </button>
      </div>

      {/* Tab 1: Kanal-Analyse */}
      {tab === "analysis" && (
        <>
          {!channelData ? (
            <div className="card">
              <p className="text-sm leading-relaxed text-gray1">
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
              {/* Channel snapshot */}
              <div className="card">
                <h2 className="text-[17px] font-bold">
                  {channelData.title ?? "Dein Kanal"}
                  {channelData.handle ? (
                    <span className="ml-2 text-[13px] font-normal text-gray1">@{channelData.handle}</span>
                  ) : null}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  {typeof channelData.subscriberCount === "number" && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Abonnenten</p>
                      <p className="text-base font-semibold">{channelData.subscriberCount.toLocaleString("de-DE")}</p>
                    </div>
                  )}
                  {typeof channelData.videoCount === "number" && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Videos</p>
                      <p className="text-base font-semibold">{channelData.videoCount.toLocaleString("de-DE")}</p>
                    </div>
                  )}
                  {typeof channelData.uploadCadenceDays === "number" &&
                    channelData.uploadCadenceDays > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Upload-Abstand</p>
                      <p className="text-base font-semibold">ca. {channelData.uploadCadenceDays} Tage</p>
                    </div>
                  )}
                  {typeof channelData.medianViews === "number" && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Median-Aufrufe</p>
                      <p className="text-base font-semibold">{channelData.medianViews.toLocaleString("de-DE")}</p>
                    </div>
                  )}
                </div>
                {typeof channelData.subscriberCount === "number" && (
                  <p className="mt-3 border-t border-line pt-3 text-[13px] text-gray1 leading-relaxed">
                    {getBenchmarkText(channelData.subscriberCount)}
                  </p>
                )}
              </div>

              {hasLongform && (
                <div className="mt-4 card">
                  <p className="text-sm font-medium text-gray1">
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
                  <p className="mt-2 text-xs text-gray1">
                    Nur Longform-Videos werden analysiert. Shorts werden bewusst
                    ausgelassen.
                    {videos.length > 0 && titleAnalysis.length > 0 && (
                      <> Klick ein Thumbnail an für Details.</>
                    )}
                  </p>
                </div>
              )}

              {(titleAnalysisLoading || titleAnalysis.length > 0) && (
                <div className="mt-4 card">
                  <TitleAnalysis
                    loading={titleAnalysisLoading}
                    results={titleAnalysis}
                    onSelect={titleAnalysis.length > 0 ? setOpenVideoId : undefined}
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setTab("assessment")}
              className="text-sm text-gray1 underline-offset-4 hover:underline"
            >
              Zur Einschätzung →
            </button>
          </div>
        </>
      )}

      {/* Tab 2: Einschätzung */}
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
              className="mt-3 text-left text-xs text-gray1 underline-offset-2 hover:text-ink hover:underline"
            >
              {summaryLine}
            </button>
          )}

          <p className="mt-6 text-[15px] leading-relaxed text-gray1">{category.explanation}</p>

          {channelNote && <p className="mt-5 text-sm italic text-gray1">{channelNote}</p>}

          <div className="mt-10">
            <h2 className="text-lg font-bold">Was bei dir auffällt</h2>
            <div className="mt-4 grid gap-3">
              {insights.map((ins, i) => (
                <div key={i} className="card">
                  <h3 className="text-[15px] font-bold">{ins.headline}</h3>
                  <p className="mt-1.5 text-sm text-gray1 leading-relaxed">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-bold">Deine nächsten 3 Hebel</h2>
            <ol className="mt-4 grid gap-3">
              {levers.map((lv, i) => (
                <li key={i} className="card">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold">{lv.headline}</h3>
                      <p className="mt-1 text-[13px] text-gray1 leading-relaxed">{lv.text}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA card */}
          <div className="mt-10 rounded-[20px] bg-ink p-7">
            <h2 className="text-[20px] font-bold text-white">Willst du wissen, was ich konkret ändern würde?</h2>
            <p className="mt-2 text-sm text-white/65">
              Die automatische Einschätzung zeigt dir die Richtung. Für eine
              echte Bewertung muss ich mir Kanal, Titel und Thumbnails manuell
              ansehen.
            </p>
            <ul className="mt-4 grid gap-1 text-[13px] text-white/65">
              <li>✓ Kanalwirkung auf den ersten Blick</li>
              <li>✓ Zusammenspiel aus Titel, Idee und Thumbnail</li>
              <li>✓ ob Audit, System oder laufende Unterstützung sinnvoller ist</li>
            </ul>
            <button
              type="button"
              onClick={onContinue}
              className="mt-6 w-full rounded-[10px] bg-accent px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#AA0015]"
            >
              Persönliche Einschätzung anfragen
            </button>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <button type="button" onClick={copyShareUrl} className="btn-secondary text-sm">
              {linkCopied ? "Kopiert!" : "Ergebnis-Link kopieren"}
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
