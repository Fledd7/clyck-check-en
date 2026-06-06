import { useMemo, useState } from "react";
import type {
  ChannelData,
  ClarityLevel,
  Insight,
  Lever,
  TitleAnalysisResult,
  UploadAnalysisResult,
  VideoItem,
} from "../lib/types";
import ThumbnailGrid from "./ThumbnailGrid";
import TitleAnalysis from "./TitleAnalysis";
import ThumbnailModal from "./ThumbnailModal";
import SingleAnalysisCard from "./SingleAnalysisCard";
import {
  getBenchmarkText,
  loadCheckHistory,
  type CategoryContent,
} from "../lib/results";

function RuleOfThirdsGrid() {
  const points = [
    { top: "33.33%", left: "33.33%" },
    { top: "33.33%", left: "66.66%" },
    { top: "66.66%", left: "33.33%" },
    { top: "66.66%", left: "66.66%" },
  ];
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-[33.33%] top-0 h-full w-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      <div className="absolute left-[66.66%] top-0 h-full w-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      <div className="absolute top-[33.33%] left-0 w-full h-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      <div className="absolute top-[66.66%] left-0 w-full h-px" style={{ background: "rgba(255,255,255,0.7)", boxShadow: "0 0 2px rgba(0,0,0,0.5)" }} />
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ top: p.top, left: p.left, background: "rgba(255,255,255,0.9)", boxShadow: "0 0 3px rgba(0,0,0,0.6)" }}
        />
      ))}
    </div>
  );
}

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
  uploadResult?: UploadAnalysisResult | null;
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
  uploadResult,
  shareUrl,
  onContinue,
  onAddChannelLink,
}: Props) {
  const [tab, setTab] = useState<"assessment" | "analysis">(uploadResult ? "assessment" : "analysis");
  const [linkCopied, setLinkCopied] = useState(false);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);

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
  const noContrastCount = titleAnalysis.filter((r) => r.contrast === "None").length;

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
  if (avgScore !== null) summaryParts.push(`Title-Thumbnail Fit: Ø ${avgScore.toFixed(1)} / 5`);
  if (textIssueCount > 0)
    summaryParts.push(`${textIssueCount} video${textIssueCount === 1 ? "" : "s"} with text issue`);
  if (overloadedCount > 0)
    summaryParts.push(`${overloadedCount} video${overloadedCount === 1 ? "" : "s"} overloaded`);
  if (noContrastCount > 0)
    summaryParts.push(`${noContrastCount} video${noContrastCount === 1 ? "" : "s"} without contrast`);
  if (
    avgScore !== null &&
    textIssueCount === 0 &&
    overloadedCount === 0 &&
    noContrastCount === 0
  ) {
    summaryParts.push("No obvious problem detected");
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
      text: `Last check ${daysSinceLastCheck} days ago: Fit Score Ø ${lastCheck.avgFitScore.toFixed(
        1
      )} → today Ø ${avgScore.toFixed(1)} (${sign}${delta.toFixed(1)})`,
    };
  })();

  const uploadHeadline = uploadResult
    ? uploadResult.analysis.score >= 5
      ? "Strong Thumbnail"
      : uploadResult.analysis.score >= 4
      ? "Good Thumbnail"
      : uploadResult.analysis.score >= 3
      ? "Solid Thumbnail with Potential"
      : "Weak Thumbnail"
    : null;

  return (
    <section className="container-narrow fade-in py-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
        {uploadResult ? "Thumbnail Analysis" : "First Assessment"}
      </p>
      <h1 className="mt-3 text-[28px] font-bold leading-snug sm:text-[34px]">
        {uploadResult ? uploadHeadline : category.headline}
      </h1>
      {uploadResult ? (
        <p className="mt-2">
          <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
            {uploadResult.analysis.label} · {uploadResult.analysis.score}/5
          </span>
        </p>
      ) : hasEnoughData && clarityLabel ? (
        <>
          <p className="mt-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                clarityLevel === "Very High"
                  ? "bg-accent text-white"
                  : "bg-ink text-white"
              }`}
            >
              {titleAnalysisLoading ? "Clyck Score: calculating..." : clarityLabel}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray1">
            Based on your answers and public channel data.
          </p>
        </>
      ) : (
        <p className="mt-2 text-xs text-gray1">
          Please link your channel to get a Clyck Score.
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
          {uploadResult ? "Analysis" : "Channel Analysis"}
          {!uploadResult && titleAnalysisLoading && (
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
          Assessment
        </button>
      </div>

      {/* Tab 1: Channel Analysis */}
      {tab === "analysis" && (
        <>
          {uploadResult ? (
            /* Upload path — show uploaded thumbnail + single analysis */
            <div>
              <p className="text-[13px] font-semibold mb-3">Your thumbnail</p>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-line">
                <img
                  src={`data:${uploadResult.mimeType};base64,${uploadResult.imageBase64}`}
                  alt="Uploaded thumbnail"
                  className="h-full w-full object-cover"
                />
                {showGrid && <RuleOfThirdsGrid />}
              </div>
              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                className="mt-1 mb-1 text-xs text-gray1 hover:underline"
              >
                {showGrid ? "✕ Hide grid" : "⊞ Rule of Thirds"}
              </button>
              {showGrid && (
                <p className="mb-3 text-[11px] leading-relaxed text-gray1">
                  The intersection points (●) mark the strongest positions for faces,
                  text and main subjects.
                </p>
              )}
              <div className="mt-3">
                <SingleAnalysisCard result={uploadResult.analysis} />
              </div>
            </div>
          ) : !channelData ? (
            <div className="card">
              <p className="text-sm leading-relaxed text-gray1">
                You haven't entered a channel link. The assessment is based
                on your answers. With a link you'll get a more detailed
                analysis.
              </p>
              <button
                type="button"
                onClick={onAddChannelLink}
                className="btn-secondary mt-4 text-sm"
              >
                Add channel link
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
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Subscribers</p>
                      <p className="text-base font-semibold">{channelData.subscriberCount.toLocaleString("en-US")}</p>
                    </div>
                  )}
                  {typeof channelData.videoCount === "number" && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Videos</p>
                      <p className="text-base font-semibold">{channelData.videoCount.toLocaleString("en-US")}</p>
                    </div>
                  )}
                  {typeof channelData.uploadCadenceDays === "number" &&
                    channelData.uploadCadenceDays > 0 && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Avg. Upload Gap</p>
                      <p className="text-base font-semibold">approx. {channelData.uploadCadenceDays} days</p>
                    </div>
                  )}
                  {typeof channelData.medianViews === "number" && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray1">Median Views</p>
                      <p className="text-base font-semibold">{channelData.medianViews.toLocaleString("en-US")}</p>
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
                    Your latest longform thumbnails
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
                    Only longform videos are analyzed. Shorts are intentionally excluded.
                    {videos.length > 0 && titleAnalysis.length > 0 && (
                      <> Click a thumbnail for details.</>
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
              → Go to Assessment
            </button>
          </div>
        </>
      )}

      {/* Tab 2: Assessment */}
      {tab === "assessment" && (
        <>
          {uploadResult ? (
            /* Upload path — show thumbnail evaluation */
            <>
              {uploadResult.analysis.reason && (
                <p className="mt-6 text-[17px] leading-relaxed italic text-gray1">
                  "{uploadResult.analysis.reason}"
                </p>
              )}

              {uploadResult.analysis.strong && (
                <div className="mt-6 card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-green-700">
                    What works
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{uploadResult.analysis.strong}</p>
                </div>
              )}

              {uploadResult.analysis.weak && (
                <div className="mt-3 card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                    What's missing
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{uploadResult.analysis.weak}</p>
                </div>
              )}

              {uploadResult.analysis.score <= 3 && uploadResult.analysis.concept && (
                <div className="mt-3 card">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray1">
                    Better concept
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{uploadResult.analysis.concept}</p>
                </div>
              )}
            </>
          ) : (
            /* Channel / quiz path — existing assessment content */
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
                <h2 className="text-lg font-bold">What stands out</h2>
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
                <h2 className="text-lg font-bold">Your next 3 levers</h2>
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
            </>
          )}

          {/* CTA card */}
          <div className="mt-10 rounded-[20px] bg-ink p-7">
            <h2 className="text-[20px] font-bold text-white">Want to know what I'd specifically change?</h2>
            <p className="mt-2 text-sm text-white/65">
              The automated assessment shows you the direction. For a real
              evaluation I need to manually review your channel, titles
              and thumbnails.
            </p>
            <ul className="mt-4 grid gap-1 text-[13px] text-white/65">
              <li>✓ Channel impact at first glance</li>
              <li>✓ Interplay of title, idea and thumbnail</li>
              <li>✓ whether an audit, system or ongoing support makes more sense</li>
            </ul>
            <button
              type="button"
              onClick={onContinue}
              className="mt-6 w-full rounded-[10px] bg-accent px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#AA0015]"
            >
              Request personal assessment
            </button>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <button type="button" onClick={copyShareUrl} className="btn-secondary text-sm">
              {linkCopied ? "Copied!" : "Copy result link"}
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
