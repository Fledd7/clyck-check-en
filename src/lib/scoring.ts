import type { ChannelData, ChannelMaturity, LeadClass, TitleAnalysisResult } from "./types";

export function getChannelMaturity(channel: ChannelData | null): ChannelMaturity | null {
  if (!channel) return null;
  const subs = channel.subscriberCount;
  const videos = channel.videoCount ?? 0;
  if (typeof subs !== "number") return null;
  if (subs > 1_000_000) return "authority";
  if (subs > 100_000) return "strong";
  if (subs > 10_000) return "established";
  if (subs > 1_000 || videos > 10) return "growing";
  return "early";
}

export type ClyckScoreBreakdown = {
  channelStrength: number;
  uploadConsistency: number;
  analysisQuality: number;
  penalties: number;
};

export type ClyckScoreResult = {
  score: number;
  clarityLevel: "Low" | "Medium" | "High" | "Very High" | null;
  hasEnoughData: boolean;
  breakdown: ClyckScoreBreakdown;
};

export function calculateClyckScore(
  channelData: ChannelData | null,
  titleAnalysis: TitleAnalysisResult[]
): ClyckScoreResult {
  if (!channelData) {
    return {
      score: 0,
      clarityLevel: null,
      hasEnoughData: false,
      breakdown: { channelStrength: 0, uploadConsistency: 0, analysisQuality: 0, penalties: 0 },
    };
  }

  const hasAnalysis = titleAnalysis.length >= 2;

  let channelStrength = 0;
  const subs = channelData.subscriberCount;
  if (typeof subs === "number") {
    if (subs >= 1_000_000) channelStrength = 40;
    else if (subs >= 100_000) channelStrength = 30;
    else if (subs >= 10_000) channelStrength = 20;
    else if (subs >= 1_000) channelStrength = 10;
    else channelStrength = 5;
  }

  let uploadConsistency = 0;
  const cadence = channelData.uploadCadenceDays;
  if (typeof cadence === "number" && cadence > 0) {
    if (cadence <= 7) uploadConsistency = 20;
    else if (cadence <= 14) uploadConsistency = 12;
    else if (cadence <= 30) uploadConsistency = 5;
  }

  let analysisQuality = 0;
  if (hasAnalysis) {
    const avgFitScore =
      titleAnalysis.reduce((sum, r) => sum + r.score, 0) / titleAnalysis.length;
    analysisQuality = Math.round(avgFitScore * 8);
  }

  let penalties = 0;
  if (hasAnalysis) {
    const total = titleAnalysis.length;
    const outdatedCount = titleAnalysis.filter((r) => r.styleAge === "veraltet").length;
    const textIssueCount = titleAnalysis.filter((r) => r.textIssue !== "").length;
    const overloadedCount = titleAnalysis.filter((r) => r.overloaded === true).length;

    if (outdatedCount / total > 0.5) penalties -= 10;
    if (textIssueCount / total > 0.5) penalties -= 8;
    if (overloadedCount / total > 0.5) penalties -= 8;
  }

  const rawScore = channelStrength + uploadConsistency + analysisQuality + penalties;
  const score = Math.max(0, Math.min(100, rawScore));

  let clarityLevel: ClyckScoreResult["clarityLevel"];
  if (!hasAnalysis) {
    if (score >= 55) clarityLevel = "High";
    else if (score >= 35) clarityLevel = "Medium";
    else clarityLevel = "Low";
  } else {
    if (score >= 80) clarityLevel = "Very High";
    else if (score >= 60) clarityLevel = "High";
    else if (score >= 35) clarityLevel = "Medium";
    else clarityLevel = "Low";
  }

  return {
    score,
    clarityLevel,
    hasEnoughData: true,
    breakdown: { channelStrength, uploadConsistency, analysisQuality, penalties },
  };
}

export function leadClassFromScore(score: number): LeadClass {
  if (score >= 75) return "top";
  if (score >= 50) return "good";
  if (score >= 30) return "mid";
  return "weak";
}
