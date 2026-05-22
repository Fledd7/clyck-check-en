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
  views: number;
  publishedAt: string;
};

export type FitResult = {
  videoId: string;
  title: string;
  fit: "yes" | "no";
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
export type DiagnosisLevel = "niedrig" | "mittel" | "hoch";
export type Diagnosis = {
  direction: DiagnosisLevel;
  system: DiagnosisLevel;
  cadence: DiagnosisLevel;
};

export type ChannelMaturity = "early" | "growing" | "established" | "strong" | "authority";
export type ClarityLevel = "Niedrig" | "Mittel" | "Hoch" | "Sehr hoch";

export type ResultCategoryId = "A" | "B" | "C" | "D";

export type ResultCategory = {
  id: ResultCategoryId;
  headline: string;
  text: string;
  cta: string;
};

export type LeadClass = "top" | "good" | "mid" | "weak";

export type TitleAnalysisScore = 1 | 2 | 3 | 4 | 5;
export type TitleAnalysisLabel =
  | "Kein Fit"
  | "Schwacher Fit"
  | "Mittlerer Fit"
  | "Guter Fit"
  | "Perfekter Fit";

export type TitleAnalysisResult = {
  id: string;
  title: string;
  thumbnail?: string;
  score: TitleAnalysisScore;
  label: TitleAnalysisLabel;
  format: string;
  elementCount: number;
  textIssue: string;
  contrast: string;
  branding: boolean;
  reason: string;
  strong: string;
  weak: string;
};
