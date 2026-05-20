export type QuestionId = "status" | "goal" | "problem" | "thumbnails" | "support";

export type Option = {
  value: string;
  label: string;
  /** internal classification tags for scoring / result selection */
  tags?: string[];
};

export type Question = {
  id: QuestionId;
  question: string;
  options: Option[];
};

export type Answers = Partial<Record<QuestionId, string>>;

export type ChannelData = {
  title?: string;
  handle?: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  uploadCadenceDays?: number | null;
  medianViews?: number | null;
  thumbnails?: string[];
  channelUrl?: string;
};

export type ChannelLookupResult =
  | { ok: true; data: ChannelData }
  | { ok: false; reason: "missing_key" | "not_found" | "error" | "skipped" };

export type ResultCategoryId = "A" | "B" | "C" | "D";

export type ResultCategory = {
  id: ResultCategoryId;
  headline: string;
  text: string;
  cta: string;
};

export type LeadClass = "top" | "good" | "mid" | "weak";

export type LeadPayload = {
  name: string;
  email: string;
  message?: string;
  consent: boolean;
  answers: Answers;
  channelUrl?: string;
  channelData?: ChannelData | null;
  result: {
    categoryId: ResultCategoryId;
    score: number;
    leadClass: LeadClass;
  };
};
