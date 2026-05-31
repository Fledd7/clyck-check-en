import type {
  Answers,
  ChannelData,
  ChannelMaturity,

  Insight,
  Lever,
  Option,
  TitleAnalysisResult,
  ResultCategoryId,
} from "./types";

export function getThumbnailRecommendation(result: TitleAnalysisResult): string {
  const issues: string[] = [];

  if (result.textIssue === "wiederholt Titel") {
    issues.push(
      "Replace the text with a strong keyword or remove it — the title next to it makes it redundant."
    );
  } else if (result.textIssue === "zu lang") {
    issues.push("Shorten the text to a maximum of 5 words. Less text, stronger impact.");
  } else if (result.textIssue === "kein Mehrwert") {
    issues.push(
      "The text doesn't strengthen the click incentive. Build the thumbnail without text first — then check if it's really needed."
    );
  }

  if (result.elementCount > 3) {
    issues.push(
      `${result.elementCount} main elements is too many. Reduce to 3 — decide what's most important.`
    );
  }

  if (result.contrast === "None") {
    issues.push(
      "No clear contrast recognizable. Try a dark subject against a bright background or complementary colors."
    );
  }

  if (result.format === "Keines davon") {
    issues.push(
      "The thumbnail doesn't use a proven click format. Ask yourself: what's remarkable about this idea?"
    );
  }

  if (result.score <= 2) {
    issues.push(
      "Title and image don't create a shared message. Plan both together from the start — not independently."
    );
  }

  if (issues.length === 0) {
    if (result.score >= 4) {
      return "Strong combination. Keep this style as a template for future thumbnails.";
    }
    return "Solid foundation. Sharpen the click incentive with a clearer format.";
  }

  return issues.slice(0, 2).join(" ");
}

export type CheckHistory = {
  date: string;
  avgFitScore: number;
  category: ResultCategoryId;
  categoryHeadline: string;
  clarityLevel: string;
};

const HISTORY_KEY = "clyck_last_check";

export function saveCheckHistory(entry: CheckHistory): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entry));
  } catch {
    // Private mode / quota — silent
  }
}

export function loadCheckHistory(): CheckHistory | null {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckHistory;
  } catch {
    return null;
  }
}

export type CategoryContent = {
  headline: string;
  explanation: string;
  ctaText: string;
};

export function getCategoryContent(
  category: ResultCategoryId,
  maturity: ChannelMaturity | null
): CategoryContent {
  if (maturity === "authority") {
    return {
      headline: "Established channel — the system decides now",
      explanation:
        "Your channel has proven reach and substance. " +
        "At this level, the question is no longer whether the channel works — " +
        "but whether the visual system is as strong as the content behind it.",
      ctaText:
        "Let's check whether your packaging is truly maxed out at this level.",
    };
  }

  if (maturity === "strong") {
    return {
      headline: "Strong channel — take packaging to the next level",
      explanation:
        "You've built a real audience. " +
        "Now it's about whether your visual system consistently " +
        "communicates this strength.",
      ctaText: "Let's sharpen your packaging at this level.",
    };
  }

  if (maturity === "established") {
    switch (category) {
      case "A":
        return {
          headline: "Clear direction — packaging can get stronger",
          explanation:
            "Your channel has built substance. " +
            "The direction is right — but your visual system " +
            "doesn't fully communicate this strength yet.",
          ctaText:
            "Let's develop a thumbnail system that matches your level.",
        };
      case "B":
        return {
          headline: "Good foundation — but still no clear system",
          explanation:
            "You publish regularly and are building reach. " +
            "What's missing is a repeatable visual direction " +
            "that makes your channel recognizable.",
          ctaText:
            "Let's develop a visual direction you can repeat every week.",
        };
      case "C":
        return {
          headline: "Strategy first — then design",
          explanation:
            "Your channel already has a foundation. " +
            "Before the packaging gets stronger, it should be clear " +
            "what message it needs to communicate.",
          ctaText: "Let's sharpen your channel direction first.",
        };
      default:
        return {
          headline: "Good foundation — packaging can get stronger",
          explanation: "Your channel has substance. Now a clear system pays off.",
          ctaText: "Let's build your packaging systematically.",
        };
    }
  }

  switch (category) {
    case "A":
      return {
        headline: "Clear direction — packaging can get stronger",
        explanation:
          "Your direction is set — but your packaging doesn't communicate it fully yet. " +
          "A clear thumbnail system pays off here.",
        ctaText: "Let's turn your clear channel into a clear thumbnail system.",
      };
    case "B":
      return {
        headline: "Potential is there — but no repeatable system",
        explanation:
          "You're publishing enough, but your channel doesn't have a repeatable " +
          "visual identity yet. Recognition comes from a consistent style.",
        ctaText:
          "Let's develop a visual direction you can repeat every week.",
      };
    case "C":
      return {
        headline: "Strategy before design",
        explanation:
          "Your bottleneck isn't the image — it's what comes before: " +
          "direction, idea and title. Before designing, " +
          "it must be clear what is actually being packaged.",
        ctaText: "Let's sharpen your channel direction and packaging first.",
      };
    case "D":
    default:
      return {
        headline: "Good timing — still early enough to set it up right",
        explanation:
          "You're early enough to package your channel cleanly from the start, " +
          "before an unclear style sets in.",
        ctaText: "Let's set up your launch with visual clarity.",
      };
  }
}


function getDominantTag(problemValues: string[], allOptions: Option[]): string | null {
  const counts: Record<string, number> = {};
  for (const v of problemValues) {
    const opt = allOptions.find((o) => o.value === v);
    for (const tag of opt?.tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  let dominant: string | null = null;
  let max = 0;
  for (const [tag, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      dominant = tag;
    }
  }
  return dominant;
}

import { questions } from "./questions";

export function selectCategory(answers: Answers): ResultCategoryId {
  const goal = answers.goal ?? [];
  const problem = answers.problem ?? [];
  const support = answers.support ?? [];

  const problemOptions = questions.find((q) => q.id === "problem")?.options ?? [];
  const dominantProblemTag = getDominantTag(problem, problemOptions);

  const strategyConfusion =
    goal.includes("unklar") ||
    problem.includes("keine_richtung") ||
    dominantProblemTag === "strategy" ||
    support.includes("strategie");

  const earlyStage =
    answers.status === "plant_start" ||
    answers.status === "kaum_aktiv" ||
    answers.thumbnails === "keine_eigenen";

  const systemNeed =
    answers.thumbnails === "teilweise_gut" ||
    answers.thumbnails === "sehr_unterschiedlich" ||
    support.includes("system") ||
    support.includes("retainer") ||
    dominantProblemTag === "system";

  if (strategyConfusion) return "C";
  if (earlyStage) return "D";
  if (systemNeed) return "B";
  return "A";
}

export function channelDataNote(channel: ChannelData | null): string | null {
  if (!channel) return null;
  if (typeof channel.longformCount === "number" && channel.longformCount === 0) {
    return "No clear longform videos were found in the recent uploads for this channel. The assessment is therefore based on your answers.";
  }
  const thumbs = channel.thumbnails ?? [];
  if (thumbs.length >= 6) {
    return "Your recent thumbnails show potential, but no consistent system yet.";
  }
  if (thumbs.length > 0) {
    return "No clear visual direction is recognizable in your recent videos yet.";
  }
  if (channel.title) {
    return `Public channel data for ${channel.title} was included in the assessment.`;
  }
  return null;
}


export function applyMaturityOverride(
  quizCategory: ResultCategoryId,
  maturity: ChannelMaturity | null,
  answers: Answers
): ResultCategoryId {
  if (!maturity) return quizCategory;
  const problem = answers.problem ?? [];
  const goal = answers.goal ?? [];

  if (maturity === "authority" || maturity === "strong") {
    if (quizCategory === "D") return "B";
    if (quizCategory === "C") {
      const isStrategyProblem =
        problem.includes("ideen_visualisieren") || problem.includes("keine_richtung");
      const isGoalUnclear = goal.includes("unklar");
      if (!isStrategyProblem && !isGoalUnclear) return "B";
    }
    return quizCategory;
  }

  if (maturity === "established") {
    if (quizCategory === "D") return "B";
    if (quizCategory === "C" && !goal.includes("unklar")) return "B";
    return quizCategory;
  }

  return quizCategory;
}

export function getBenchmarkText(subs: number): string {
  if (subs > 1_000_000)
    return "Your channel has built significant reach. At this level, the system behind your thumbnails is what matters.";
  if (subs > 100_000)
    return "Your channel has proven the topic works. The next level requires a clear visual system.";
  if (subs > 10_000)
    return "You've built initial real attention. Now consistency becomes the decisive factor.";
  if (subs > 1_000)
    return "You're in the build phase — this is where it's decided whether the channel scales later or not.";
  return "You're at the beginning. Now is the best time to build visual clarity from the start.";
}

function rhythmInsight(
  answers: Answers,
  channel: ChannelData | null,
  maturity: ChannelMaturity | null
): Insight {
  const cadence = channel?.uploadCadenceDays ?? null;
  const medianViews = channel?.medianViews ?? null;

  if (maturity === "authority" || maturity === "strong") {
    if (typeof medianViews === "number" && medianViews > 1_000_000) {
      return {
        headline: "Reach is proven — now it's about the system",
        text: "Your videos reach people. The question is whether the thumbnail system also strategically leverages this reach — or whether it happens despite the system.",
      };
    }
    if (typeof cadence === "number" && cadence > 14) {
      return {
        headline: "Stable rhythm at a high level",
        text: "At this channel level, upload cadence matters less than visual consistency. But a tighter rhythm would make the system more stable.",
      };
    }
    return {
      headline: "Stable rhythm at a high level",
      text: "Regular uploads at this level aren't a given. The focus is now on the system behind the thumbnails.",
    };
  }

  if (channel && typeof cadence === "number" && cadence > 0) {
    if (cadence <= 7) {
      return {
        headline: "Consistent rhythm",
        text: "You upload regularly — that's one of the most important foundations for recognition.",
      };
    }
    if (cadence <= 14) {
      return {
        headline: "Solid rhythm",
        text: "The upload cadence seems stable. For a thumbnail system, that's a good starting point.",
      };
    }
    return {
      headline: "Irregular cadence",
      text: "Longer gaps between uploads make recognition harder. It becomes even more important that every video is packaged strongly.",
    };
  }

  switch (answers.status) {
    case "regelmaessig":
      return {
        headline: "Regular upload rhythm",
        text: "A stable cadence is the prerequisite for a thumbnail system to work at all.",
      };
    case "unregelmaessig":
      return {
        headline: "No fixed rhythm yet",
        text: "Without a stable cadence, every video fights for attention from scratch — a clear system helps twice as much.",
      };
    case "kaum_aktiv":
    case "plant_start":
      return {
        headline: "Early starting point",
        text: "Now is the right time to establish a visual direction — before an unclear style sets in.",
      };
    default:
      return {
        headline: "Rhythm unclear",
        text: "A stable upload cadence is the foundation for any recognition.",
      };
  }
}

function thumbnailInsight(answers: Answers, maturity: ChannelMaturity | null): Insight {
  if (maturity === "authority" || maturity === "strong") {
    if (answers.thumbnails === "einheitlich") {
      return {
        headline: "Visual consistency recognizable",
        text: "Your channel feels visually solid. The interesting question is whether the system was developed consciously — or emerged randomly over time.",
      };
    }
    return {
      headline: "System is decisive at this level",
      text: "With a channel of this size, a repeatable thumbnail system is no longer a nice-to-have — it's the foundation for consistent performance.",
    };
  }

  switch (answers.thumbnails) {
    case "einheitlich":
      return {
        headline: "Already visually stable",
        text: "Your thumbnails feel consistent — the question is whether the style also communicates the right message.",
      };
    case "teilweise_gut":
      return {
        headline: "No repeatable system",
        text: "Individual good thumbnails aren't enough. A system makes the difference between lucky shots and reliable click strength.",
      };
    case "sehr_unterschiedlich":
      return {
        headline: "Visual direction still missing",
        text: "Different styles make recognition harder. Anyone visiting your channel should immediately feel: this is the same format.",
      };
    case "schnell_gebaut":
      return {
        headline: "Design still has room to improve",
        text: "Quickly produced thumbnails sometimes work — but without a system, that's risky.",
      };
    case "keine_eigenen":
      return {
        headline: "Thumbnail strategy still open",
        text: "Before the first thumbnail is created, a clear direction pays off — it saves many course corrections.",
      };
    default:
      return {
        headline: "Visual consistency worth checking",
        text: "Whether your channel feels visually consistent is one of the first questions a new viewer asks.",
      };
  }
}

function strategyInsight(
  answers: Answers,
  category: ResultCategoryId,
  maturity: ChannelMaturity | null
): Insight {
  if (maturity === "authority" || maturity === "strong") {
    return {
      headline: "Optimization at a high level",
      text: "For an established channel, it's no longer about the basic setup — but about what more can be extracted at this level.",
    };
  }

  const problem = answers.problem ?? [];
  if (problem.includes("ideen_visualisieren") || problem.includes("keine_richtung") || category === "C") {
    return {
      headline: "The lever lies before the design",
      text: "Before designing, it must be clear what is actually being packaged — direction, idea and title come before the image.",
    };
  }
  if (problem.includes("titel_thumbnail_mismatch")) {
    return {
      headline: "Title-thumbnail fit has room to improve",
      text: "Image and title should create curiosity together — not separately. This is often the underestimated lever.",
    };
  }
  if (problem.includes("wenig_klicks")) {
    return {
      headline: "Click problem, not a quality problem",
      text: "Often videos are good, but the packaging creates little incentive to click. This can weaken click strength — and can be fixed with the right system.",
    };
  }
  const support = answers.support ?? [];
  if (support.includes("retainer") || support.includes("audit")) {
    return {
      headline: "Systems thinking is already present",
      text: "Anyone thinking about ongoing support or an audit has understood that thumbnails aren't a one-time project.",
    };
  }
  return {
    headline: "Packaging is more than design",
    text: "Click-worthy thumbnails don't come from beautiful images alone, but from the interplay of idea, title and image.",
  };
}

function fitInsight(titleAnalysis: TitleAnalysisResult[]): Insight | null {
  if (titleAnalysis.length === 0) return null;
  const avg =
    titleAnalysis.reduce((sum, r) => sum + r.score, 0) / titleAnalysis.length;
  if (avg < 2.5) {
    return {
      headline: "Title-thumbnail fit is your biggest lever",
      text: "The analysis shows: in most videos, title and image don't work together. This is exactly where most lost clicks happen.",
    };
  }
  if (avg < 3.5) {
    return {
      headline: "Title-thumbnail fit has room to improve",
      text: "Image and title should create curiosity together — not separately. This is often the underestimated lever.",
    };
  }
  return {
    headline: "Good interplay recognizable",
    text: "Your videos already use the interplay of image and title well. The focus is on consistent execution.",
  };
}

export function buildInsights(
  category: ResultCategoryId,
  answers: Answers,
  channel: ChannelData | null,
  maturity: ChannelMaturity | null,
  titleAnalysis: TitleAnalysisResult[] = []
): Insight[] {
  const fit = fitInsight(titleAnalysis);
  return [
    rhythmInsight(answers, channel, maturity),
    thumbnailInsight(answers, maturity),
    fit ?? strategyInsight(answers, category, maturity),
  ];
}

const leversByCategory: Record<ResultCategoryId, Lever[]> = {
  A: [
    {
      headline: "Develop a thumbnail system",
      text: "Define 2–3 rules that apply to each of your longform thumbnails — color, composition, typography.",
    },
    {
      headline: "Plan title and thumbnail together",
      text: "Both should create curiosity together, not independently.",
    },
    {
      headline: "Establish recognizable patterns",
      text: "What should viewers think immediately when they see your thumbnail? This must repeat in every video.",
    },
  ],
  B: [
    {
      headline: "Define a visual direction",
      text: "Commit to a clear visual language and stick to it consistently.",
    },
    {
      headline: "Develop repeatable thumbnail patterns",
      text: "A template isn't boring uniformity — it's the framework that creates recognition.",
    },
    {
      headline: "Analyze existing thumbnails",
      text: "Look at your last 10 thumbnails side by side. What works, what breaks the line?",
    },
  ],
  C: [
    {
      headline: "Sharpen your channel promise",
      text: "What does someone get when they subscribe to your channel? This must be clear in one sentence.",
    },
    {
      headline: "Frame video ideas more clearly",
      text: "Every idea needs an angle that can be expressed visually and in the title.",
    },
    {
      headline: "Packaging strategy first, then design",
      text: "Thumbnails without clear positioning behind them are lucky shots, not systems.",
    },
  ],
  D: [
    {
      headline: "Position your channel launch clearly",
      text: "Define from the start: Who is the channel for, and what should it trigger?",
    },
    {
      headline: "Define your first thumbnail rules",
      text: "Two or three visual rules are enough to start — consistency beats perfection.",
    },
    {
      headline: "Build recognition from day one",
      text: "It's much easier to establish a clear style than to correct an unclear one later.",
    },
  ],
};

export function buildLevers(category: ResultCategoryId): Lever[] {
  return leversByCategory[category];
}

