import type {
  Answers,
  ChannelData,
  ChannelMaturity,
  ClarityLevel,
  Diagnosis,
  DiagnosisLevel,
  Insight,
  Lever,
  Option,
  TitleAnalysisResult,
  ResultCategory,
  ResultCategoryId,
} from "./types";

export function getThumbnailRecommendation(result: TitleAnalysisResult): string {
  const issues: string[] = [];

  if (result.textIssue === "wiederholt Titel") {
    issues.push(
      "Ersetze den Text durch ein starkes Schlüsselwort oder entferne ihn — der Titel daneben macht ihn überflüssig."
    );
  } else if (result.textIssue === "zu lang") {
    issues.push("Kürze den Text auf maximal 3 Wörter. Weniger Text, stärkere Wirkung.");
  } else if (result.textIssue === "kein Mehrwert") {
    issues.push(
      "Der Text verstärkt den Klick-Anreiz nicht. Bau das Thumbnail erst ohne Text — und prüfe ob er wirklich nötig ist."
    );
  }

  if (result.elementCount > 3) {
    issues.push(
      `${result.elementCount} Hauptelemente sind zu viel. Reduziere auf 3 — entscheide was das Wichtigste ist.`
    );
  }

  if (result.contrast === "Keiner") {
    issues.push(
      "Kein klarer Kontrast erkennbar. Probier ein dunkles Subjekt vor hellem Hintergrund oder Komplementärfarben."
    );
  }

  if (result.format === "Keines davon") {
    issues.push(
      "Das Thumbnail nutzt kein bewährtes Klick-Format. Frag dich: Was ist an dieser Idee remarkable?"
    );
  }

  if (result.score <= 2) {
    issues.push(
      "Titel und Bild erzeugen keine gemeinsame Botschaft. Plant beide von Anfang an zusammen — nicht getrennt voneinander."
    );
  }

  if (issues.length === 0) {
    if (result.score >= 4) {
      return "Starke Kombination. Halte diesen Stil als Vorlage für künftige Thumbnails.";
    }
    return "Solide Basis. Schärfe den Klick-Anreiz durch ein klareres Format.";
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
      headline: "Etablierter Kanal — System entscheidet jetzt",
      explanation:
        "Dein Kanal hat Reichweite und Substanz bewiesen. " +
        "Auf diesem Level ist die Frage nicht mehr, ob der Kanal funktioniert — " +
        "sondern ob das visuelle System so stark ist wie der Content dahinter.",
      ctaText:
        "Lass uns prüfen, ob dein Packaging auf diesem Level wirklich ausgereizt ist.",
    };
  }

  if (maturity === "strong") {
    return {
      headline: "Starker Kanal — Packaging auf das nächste Level",
      explanation:
        "Du hast eine echte Zuschauerschaft aufgebaut. " +
        "Jetzt geht es darum, ob dein visuelles System diese Stärke " +
        "konsequent nach außen trägt.",
      ctaText: "Lass uns dein Packaging auf diesem Level schärfen.",
    };
  }

  if (maturity === "established") {
    switch (category) {
      case "A":
        return {
          headline: "Klare Richtung — Packaging kann stärker werden",
          explanation:
            "Dein Kanal hat Substanz aufgebaut. " +
            "Die Richtung stimmt — aber dein visuelles System " +
            "transportiert diese Stärke noch nicht vollständig.",
          ctaText:
            "Lass uns ein Thumbnail-System entwickeln, das zu deinem Level passt.",
        };
      case "B":
        return {
          headline: "Gute Basis — aber noch kein klares System",
          explanation:
            "Du veröffentlichst regelmäßig und baust Reichweite auf. " +
            "Was fehlt, ist eine wiederholbare visuelle Linie, " +
            "die deinen Kanal erkennbar macht.",
          ctaText:
            "Lass uns eine visuelle Linie entwickeln, die du jede Woche wiederholen kannst.",
        };
      case "C":
        return {
          headline: "Strategie zuerst — dann Design",
          explanation:
            "Dein Kanal hat bereits eine Basis. " +
            "Bevor das Packaging stärker wird, sollte klar sein, " +
            "welche Botschaft es transportieren soll.",
          ctaText: "Lass uns zuerst deine Kanalrichtung schärfen.",
        };
      default:
        return {
          headline: "Gute Basis — Packaging kann stärker werden",
          explanation: "Dein Kanal hat Substanz. Jetzt lohnt sich ein klares System.",
          ctaText: "Lass uns dein Packaging systematisch aufbauen.",
        };
    }
  }

  switch (category) {
    case "A":
      return {
        headline: "Klar, aber schwach verpackt",
        explanation:
          "Deine Richtung steht — aber deine Verpackung transportiert sie noch nicht. " +
          "Hier lohnt sich ein klares Thumbnail-System.",
        ctaText: "Lass uns aus deinem klaren Kanal ein klares Thumbnail-System machen.",
      };
    case "B":
      return {
        headline: "Potenzial da — aber kein wiederholbares System",
        explanation:
          "Du veröffentlichst genug, aber dein Kanal hat noch keine wiederholbare " +
          "visuelle Linie. Wiedererkennung entsteht durch einen konsequenten Stil.",
        ctaText:
          "Lass uns eine visuelle Linie entwickeln, die du jede Woche wiederholen kannst.",
      };
    case "C":
      return {
        headline: "Strategie vor Design",
        explanation:
          "Dein Engpass liegt nicht beim Bild, sondern davor — " +
          "bei Richtung, Idee und Titel. Bevor wir gestalten, " +
          "muss klar sein, was eigentlich verpackt werden soll.",
        ctaText: "Lass uns zuerst deine Kanalrichtung und dein Packaging schärfen.",
      };
    case "D":
    default:
      return {
        headline: "Guter Moment — noch früh genug, es richtig aufzusetzen",
        explanation:
          "Du bist noch früh genug, um deinen Kanal von Anfang an sauber zu " +
          "verpacken, bevor sich ein uneinheitlicher Stil einschleift.",
        ctaText: "Lass uns deinen Start visuell klar aufsetzen.",
      };
  }
}

export const categories: Record<ResultCategoryId, ResultCategory> = {
  A: {
    id: "A",
    headline: "Klar im Kanal — schwach in der Verpackung",
    text:
      "Deine Richtung steht, aber deine Verpackung transportiert sie noch nicht stark genug. Hier lohnt sich ein klares Thumbnail-System, damit Titel, Videoideen und visuelle Linie besser zusammenspielen.",
    cta: "Lass uns aus deinem klaren Kanal ein klares Thumbnail-System machen.",
  },
  B: {
    id: "B",
    headline: "Potenzial da — aber kein wiederholbares System",
    text:
      "Du veröffentlichst oder planst genug, aber dein Kanal hat noch keine wiederholbare visuelle Linie. Wiedererkennung entsteht durch ein System, nicht durch einzelne Zufalls-Thumbnails.",
    cta: "Lass uns eine visuelle Linie entwickeln, die du langfristig wiederholen kannst.",
  },
  C: {
    id: "C",
    headline: "Strategie vor Design",
    text:
      "Dein Engpass liegt wahrscheinlich nicht nur beim Bild, sondern davor: bei Richtung, Idee, Titel oder Positionierung. Bevor gestaltet wird, muss klar sein, was eigentlich verpackt werden soll.",
    cta: "Lass uns zuerst deine Kanalrichtung und dein Packaging schärfen.",
  },
  D: {
    id: "D",
    headline: "Guter Moment — noch früh genug, es richtig aufzusetzen",
    text:
      "Du bist noch früh genug, um deinen Kanal von Anfang an sauber zu verpacken, bevor sich ein uneinheitlicher Stil einschleift.",
    cta: "Lass uns deinen Start visuell klar aufsetzen.",
  },
};

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
    return "Für diesen Kanal wurden in den letzten Uploads keine klaren Longform-Videos gefunden. Die Einschätzung basiert daher auf deinen Antworten.";
  }
  const thumbs = channel.thumbnails ?? [];
  if (thumbs.length >= 6) {
    return "Deine letzten Thumbnails zeigen Potenzial, aber noch kein durchgängiges System.";
  }
  if (thumbs.length > 0) {
    return "Bei deinen letzten Videos ist noch keine klare visuelle Linie erkennbar.";
  }
  if (channel.title) {
    return `Öffentliche Kanaldaten zu ${channel.title} wurden in die Einschätzung einbezogen.`;
  }
  return null;
}

export function clarityLevel(score: number): { label: string; level: ClarityLevel } {
  if (score >= 85) return { label: "Clyck-Score: Sehr hoch", level: "Sehr hoch" };
  if (score >= 65) return { label: "Clyck-Score: Hoch", level: "Hoch" };
  if (score >= 35) return { label: "Clyck-Score: Mittel", level: "Mittel" };
  return { label: "Clyck-Score: Niedrig", level: "Niedrig" };
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
    return "Dein Kanal hat eine signifikante Reichweite aufgebaut. Auf diesem Level entscheidet das System hinter den Thumbnails.";
  if (subs > 100_000)
    return "Dein Kanal hat bewiesen, dass das Thema funktioniert. Die nächste Stufe erfordert ein klares visuelles System.";
  if (subs > 10_000)
    return "Du hast erste echte Aufmerksamkeit aufgebaut. Jetzt wird Konsistenz zum entscheidenden Faktor.";
  if (subs > 1_000)
    return "Du bist in der Aufbauphase — genau hier entscheidet sich, ob der Kanal später skaliert oder nicht.";
  return "Du stehst am Anfang. Jetzt ist der beste Moment, visuelle Klarheit von Anfang an aufzubauen.";
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
        headline: "Reichweite ist bewiesen — jetzt geht es ums System",
        text: "Deine Videos erreichen Menschen. Die Frage ist, ob das Thumbnail-System diese Reichweite auch strategisch nutzt — oder ob sie trotz des Systems entsteht.",
      };
    }
    if (typeof cadence === "number" && cadence > 14) {
      return {
        headline: "Rhythmus mit Luft nach oben",
        text: "Auf diesem Kanal-Level ist Upload-Kadenz weniger entscheidend als visuelle Konsistenz. Aber ein engerer Rhythmus würde das System stabiler machen.",
      };
    }
    return {
      headline: "Stabiler Rhythmus auf hohem Niveau",
      text: "Regelmäßige Uploads auf diesem Level sind keine Selbstverständlichkeit. Der Fokus liegt jetzt auf dem System hinter den Thumbnails.",
    };
  }

  if (channel && typeof cadence === "number" && cadence > 0) {
    if (cadence <= 7) {
      return {
        headline: "Konstanter Rhythmus",
        text: "Du lädst regelmäßig hoch — das ist eine der wichtigsten Grundlagen für Wiedererkennung.",
      };
    }
    if (cadence <= 14) {
      return {
        headline: "Solider Rhythmus",
        text: "Der Upload-Takt wirkt stabil. Für ein Thumbnail-System ist das ein guter Ausgangspunkt.",
      };
    }
    return {
      headline: "Unregelmäßiger Takt",
      text: "Längere Abstände zwischen Uploads erschweren Wiedererkennung. Noch wichtiger wird dann, dass jedes Video stark verpackt ist.",
    };
  }

  switch (answers.status) {
    case "regelmaessig":
      return {
        headline: "Regelmäßiger Upload-Rhythmus",
        text: "Ein stabiler Takt ist Voraussetzung dafür, dass ein Thumbnail-System überhaupt greifen kann.",
      };
    case "unregelmaessig":
      return {
        headline: "Noch kein fester Rhythmus",
        text: "Ohne stabilen Takt kämpft jedes Video neu um Aufmerksamkeit — ein klares System hilft dabei doppelt.",
      };
    case "kaum_aktiv":
    case "plant_start":
      return {
        headline: "Früher Startpunkt",
        text: "Jetzt ist der richtige Moment, visuelle Richtung festzulegen — bevor sich ein unklarer Stil einschleift.",
      };
    default:
      return {
        headline: "Rhythmus unklar",
        text: "Ein stabiler Upload-Takt ist die Basis für jede Wiedererkennung.",
      };
  }
}

function thumbnailInsight(answers: Answers, maturity: ChannelMaturity | null): Insight {
  if (maturity === "authority" || maturity === "strong") {
    if (answers.thumbnails === "einheitlich") {
      return {
        headline: "Visuelle Konsistenz erkennbar",
        text: "Dein Kanal wirkt visuell gefestigt. Die spannende Frage ist, ob das System bewusst entwickelt wurde — oder sich über die Zeit zufällig ergeben hat.",
      };
    }
    return {
      headline: "System auf diesem Level entscheidend",
      text: "Mit einem Kanal dieser Größe ist ein wiederholbares Thumbnail-System kein Nice-to-have mehr, sondern die Grundlage für konsistente Performance.",
    };
  }

  switch (answers.thumbnails) {
    case "einheitlich":
      return {
        headline: "Visuell bereits stabil",
        text: "Deine Thumbnails wirken einheitlich — die Frage ist, ob der Stil auch die richtige Botschaft transportiert.",
      };
    case "teilweise_gut":
      return {
        headline: "Kein wiederholbares System",
        text: "Einzelne gute Thumbnails reichen nicht. Ein System macht den Unterschied zwischen Glückstreffern und verlässlicher Klickstärke.",
      };
    case "sehr_unterschiedlich":
      return {
        headline: "Visuelle Linie fehlt noch",
        text: "Unterschiedliche Stile erschweren Wiedererkennung. Wer deinen Kanal besucht, soll sofort spüren: Das ist das gleiche Format.",
      };
    case "schnell_gebaut":
      return {
        headline: "Design hat noch Luft nach oben",
        text: "Schnell produzierte Thumbnails funktionieren manchmal — aber ohne System ist das riskant.",
      };
    case "keine_eigenen":
      return {
        headline: "Thumbnail-Strategie noch offen",
        text: "Bevor das erste Thumbnail entsteht, lohnt sich eine klare Richtung — das spart viele Kurskorrekturen.",
      };
    default:
      return {
        headline: "Visuelle Konsistenz prüfenswert",
        text: "Ob dein Kanal visuell einheitlich wirkt, ist eine der ersten Fragen, die sich ein neuer Zuschauer stellt.",
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
      headline: "Optimierung auf hohem Niveau",
      text: "Bei einem etablierten Kanal geht es nicht mehr ums Grundsetup — sondern darum, was auf diesem Level noch mehr herauszuholen ist.",
    };
  }

  const problem = answers.problem ?? [];
  if (problem.includes("ideen_visualisieren") || problem.includes("keine_richtung") || category === "C") {
    return {
      headline: "Hebel liegt vor dem Design",
      text: "Bevor gestaltet wird, muss klar sein, was eigentlich verpackt werden soll — Richtung, Idee und Titel kommen vor dem Bild.",
    };
  }
  if (problem.includes("titel_thumbnail_mismatch")) {
    return {
      headline: "Titel-Thumbnail-Fit ausbaufähig",
      text: "Titel und Bild sollten gemeinsam Neugier erzeugen, nicht getrennt voneinander. Das ist oft der unterschätzte Hebel.",
    };
  }
  if (problem.includes("wenig_klicks")) {
    return {
      headline: "Klickreiz, nicht Qualität",
      text: "Oft sind Videos gut, aber die Verpackung schafft wenig Anreiz, draufzuklicken. Das kann den Klickreiz schwächen — und lässt sich mit dem richtigen System verbessern.",
    };
  }
  const support = answers.support ?? [];
  if (support.includes("retainer") || support.includes("audit")) {
    return {
      headline: "Systemdenken ist bereits vorhanden",
      text: "Wer an laufende Unterstützung oder ein Audit denkt, hat verstanden, dass Thumbnails kein Einmalprojekt sind.",
    };
  }
  return {
    headline: "Packaging ist mehr als Design",
    text: "Klickstarke Thumbnails entstehen nicht durch schöne Bilder allein, sondern durch das Zusammenspiel aus Idee, Titel und Bild.",
  };
}

function fitInsight(titleAnalysis: TitleAnalysisResult[]): Insight | null {
  if (titleAnalysis.length === 0) return null;
  const avg =
    titleAnalysis.reduce((sum, r) => sum + r.score, 0) / titleAnalysis.length;
  if (avg < 2.5) {
    return {
      headline: "Titel-Thumbnail-Fit ist dein größter Hebel",
      text: "Die KI-Analyse zeigt: Bei den meisten Videos arbeiten Titel und Bild nicht zusammen. Genau hier entstehen die meisten verlorenen Klicks.",
    };
  }
  if (avg < 3.5) {
    return {
      headline: "Titel-Thumbnail-Fit ausbaufähig",
      text: "Bild und Titel sollten gemeinsam Neugier erzeugen — nicht getrennt voneinander. Das ist oft der unterschätzte Hebel.",
    };
  }
  return {
    headline: "Gutes Zusammenspiel erkennbar",
    text: "Deine Videos nutzen das Zusammenspiel aus Bild und Titel bereits gut. Der Fokus liegt auf konsequenter Umsetzung.",
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
      headline: "Thumbnail-System entwickeln",
      text: "Definiere 2–3 Regeln, die auf jeden deiner Longform-Thumbnails zutreffen — Farbe, Bildaufbau, Typo.",
    },
    {
      headline: "Titel und Thumbnail gemeinsam planen",
      text: "Beide sollten zusammen Neugier erzeugen, nicht unabhängig voneinander.",
    },
    {
      headline: "Wiedererkennbare Muster festlegen",
      text: "Was sollen Zuschauer sofort denken, wenn sie dein Thumbnail sehen? Das muss sich in jedem Video wiederholen.",
    },
  ],
  B: [
    {
      headline: "Visuelle Linie festlegen",
      text: "Entscheide dich für eine klare Formensprache und halte sie konsequent durch.",
    },
    {
      headline: "Wiederholbare Thumbnail-Muster entwickeln",
      text: "Ein Template ist kein Einheitsbrei — es ist der Rahmen, der Wiedererkennung schafft.",
    },
    {
      headline: "Bestehende Thumbnails analysieren",
      text: "Schau dir die letzten 10 Thumbnails nebeneinander an. Was funktioniert, was bricht die Linie?",
    },
  ],
  C: [
    {
      headline: "Kanalversprechen schärfen",
      text: "Was bekommt jemand, der deinen Kanal abonniert? Das muss in einem Satz klar sein.",
    },
    {
      headline: "Videoideen klarer rahmen",
      text: "Jede Idee braucht einen Winkel, der sich visuell und im Titel ausdrücken lässt.",
    },
    {
      headline: "Erst Packaging-Strategie, dann Design",
      text: "Thumbnails ohne klare Positionierung im Rücken sind Zufallstreffer, keine Systeme.",
    },
  ],
  D: [
    {
      headline: "Kanalstart klar positionieren",
      text: "Definiere von Anfang an: Für wen ist der Kanal, und was soll er auslösen?",
    },
    {
      headline: "Erste Thumbnail-Regeln definieren",
      text: "Zwei oder drei visuelle Regeln reichen für den Start — Konsistenz schlägt Perfektion.",
    },
    {
      headline: "Wiedererkennung von Anfang an aufbauen",
      text: "Es ist viel einfacher, einen klaren Stil zu etablieren, als einen unklaren später zu korrigieren.",
    },
  ],
};

export function buildLevers(category: ResultCategoryId): Lever[] {
  return leversByCategory[category];
}

export function buildDiagnosis(
  answers: Answers,
  channel: ChannelData | null,
  maturity: ChannelMaturity | null
): Diagnosis {
  const goal = answers.goal ?? [];
  const problem = answers.problem ?? [];

  const direction: DiagnosisLevel = (() => {
    if (maturity === "authority" || maturity === "strong") return "hoch";
    if (maturity === "established") {
      return goal.includes("unklar") ? "mittel" : "hoch";
    }
    if (goal.includes("unklar") || problem.includes("keine_richtung")) return "niedrig";
    if (goal.includes("kundenanfragen") || goal.includes("expertenstatus")) return "hoch";
    return "mittel";
  })();

  const system: DiagnosisLevel = (() => {
    if (
      (maturity === "authority" || maturity === "strong") &&
      answers.thumbnails === "einheitlich"
    ) {
      return "hoch";
    }
    switch (answers.thumbnails) {
      case "einheitlich":
        return "hoch";
      case "teilweise_gut":
      case "sehr_unterschiedlich":
        return "mittel";
      default:
        return "niedrig";
    }
  })();

  const cadence: DiagnosisLevel = (() => {
    const c = channel?.uploadCadenceDays;
    if (typeof c === "number" && c > 0) {
      if (c <= 7) return "hoch";
      if (c <= 14) return "mittel";
      return "niedrig";
    }
    switch (answers.status) {
      case "regelmaessig":
        return "hoch";
      case "unregelmaessig":
        return "mittel";
      default:
        return "niedrig";
    }
  })();

  return { direction, system, cadence };
}
