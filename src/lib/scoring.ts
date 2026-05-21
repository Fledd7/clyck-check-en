import type { Answers, ChannelData, ChannelMaturity, LeadClass } from "./types";

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

const statusScore: Record<string, number> = {
  regelmaessig: 15,
  unregelmaessig: 10,
  kaum_aktiv: 5,
  plant_start: 3,
};

const goalScore: Record<string, number> = {
  kundenanfragen: 15,
  expertenstatus: 15,
  reichweite: 8,
  community: 8,
  monetarisieren: 6,
  unklar: 0,
};

const problemScore: Record<string, number> = {
  wenig_klicks: 10,
  unprofessionell: 10,
  uneinheitlich: 10,
  kein_thumbnail_konzept: 8,
  titel_thumbnail_mismatch: 10,
  ideen_visualisieren: 6,
  keine_richtung: 4,
};

const thumbnailsScore: Record<string, number> = {
  einheitlich: 4,
  teilweise_gut: 15,
  sehr_unterschiedlich: 12,
  schnell_gebaut: 10,
  keine_eigenen: 5,
  unsicher: 3,
};

const supportScore: Record<string, number> = {
  system: 20,
  strategie: 20,
  audit: 18,
  retainer: 20,
  einzelne: 5,
  unklar: 2,
};

function scoreMultiSelect(values: string[] | undefined, scores: Record<string, number>): number {
  if (!values || values.length === 0) return 0;
  const nums = values.map((v) => scores[v] ?? 0).sort((a, b) => b - a);
  const highest = nums[0];
  if (nums.length === 1) return highest;
  const bonus = nums.slice(1).reduce((sum, s) => sum + s * 0.4, 0);
  return Math.min(highest + bonus, highest * 1.4);
}

export function computeScore(
  answers: Answers,
  channel: ChannelData | null,
  message: string | undefined
): number {
  let score = 0;
  score += statusScore[answers.status ?? ""] ?? 0;
  score += scoreMultiSelect(answers.goal, goalScore);
  score += scoreMultiSelect(answers.problem, problemScore);
  score += thumbnailsScore[answers.thumbnails ?? ""] ?? 0;
  score += scoreMultiSelect(answers.support, supportScore);

  if (channel) {
    score += 5;
    if (
      typeof channel.uploadCadenceDays === "number" &&
      channel.uploadCadenceDays > 0 &&
      channel.uploadCadenceDays <= 21
    ) {
      score += 5;
    }

    const subs = channel.subscriberCount;
    if (typeof subs === "number") {
      if (subs > 1_000_000) score += 20;
      else if (subs > 100_000) score += 12;
      else if (subs > 10_000) score += 5;
    }

    const medianViews = channel.medianViews;
    if (typeof medianViews === "number") {
      if (medianViews > 1_000_000) score += 25;
      else if (medianViews > 100_000) score += 15;
      else if (medianViews > 10_000) score += 8;
    }

    const videos = channel.videoCount;
    if (typeof videos === "number") {
      if (videos > 200) score += 10;
      else if (videos > 50) score += 5;
    }
  }

  if (message && message.trim().length > 20) score += 2;

  return Math.min(100, score);
}

export function leadClassFromScore(score: number): LeadClass {
  if (score >= 75) return "top";
  if (score >= 50) return "good";
  if (score >= 30) return "mid";
  return "weak";
}
