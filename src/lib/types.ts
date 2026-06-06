export type QuestionId = "status" | "goal" | "problem" | "thumbnails" | "support";

export type Option = {
  value: string;
  label: string;
  tags?: string[];
};

export type Question = {
  id: QuestionId;
  question: string;
  multiSelect?: boolean;
  maxSelect?: number;
  options: Option[];
};

export type Answers = {
  status?: string;
  goal?: string[];
  problem?: string[];
  thumbnails?: string;
  support?: string[];
};

export type VideoItem = {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  views: number;
  publishedAt: string;
};

export type ChannelData = {
  title?: string;
  handle?: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  uploadCadenceDays?: number | null;
  medianViews?: number | null;
  thumbnails?: string[];
  longformCount?: number;
  channelUrl?: string;
  videos?: VideoItem[];
};

export type Insight = { headline: string; text: string };
export type Lever = { headline: string; text: string };

export type ChannelMaturity = "early" | "growing" | "established" | "strong" | "authority";
export type ClarityLevel = "Low" | "Medium" | "High" | "Very High";

export type ResultCategoryId = "A" | "B" | "C" | "D";

export type LeadClass = "top" | "good" | "mid" | "weak";

export type TitleAnalysisScore = 1 | 2 | 3 | 4 | 5;
export type TitleAnalysisLabel =
  | "No Fit"
  | "Weak Fit"
  | "Average Fit"
  | "Good Fit"
  | "Perfect Fit";

export type TitleAnalysisResult = {
  id: string;
  title: string;
  thumbnail?: string;
  views?: number;
  publishedAt?: string;
  score: TitleAnalysisScore;
  label: TitleAnalysisLabel;
  format: string;
  elementCount: number;
  overloaded: boolean;
  textIssue: string;
  contrast: string;
  styleAge: "zeitgemäß" | "veraltet" | "überladen" | "neutral";
  colorDominant: boolean;
  colorHarmony: "harmonisch" | "neutral" | "chaotisch";
  colorImpact: "stark" | "mittel" | "schwach";
  branding: boolean;
  reason: string;
  strong: string;
  weak: string;
  concept?: string;
};

