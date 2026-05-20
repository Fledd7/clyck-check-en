import type {
  Answers,
  ChannelData,
  Diagnosis,
  DiagnosisLevel,
  Insight,
  Lever,
  ResultCategory,
  ResultCategoryId,
} from "./types";

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

export function selectCategory(answers: Answers): ResultCategoryId {
  const strategyConfusion =
    answers.goal === "unklar" ||
    answers.problem === "keine_richtung" ||
    answers.support === "strategie";

  const earlyStage =
    answers.status === "plant_start" ||
    answers.status === "kaum_aktiv" ||
    answers.thumbnails === "keine_eigenen";

  const systemNeed =
    answers.thumbnails === "teilweise_gut" ||
    answers.thumbnails === "sehr_unterschiedlich" ||
    answers.support === "system" ||
    answers.support === "retainer";

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

export function clarityLevel(score: number): { label: string; level: "Niedrig" | "Mittel" | "Hoch" } {
  if (score < 35) return { label: "Klarheits-Level: Niedrig", level: "Niedrig" };
  if (score < 65) return { label: "Klarheits-Level: Mittel", level: "Mittel" };
  return { label: "Klarheits-Level: Hoch", level: "Hoch" };
}

function rhythmInsight(answers: Answers, channel: ChannelData | null): Insight {
  const cadence = channel?.uploadCadenceDays ?? null;
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

function thumbnailInsight(answers: Answers): Insight {
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

function strategyInsight(answers: Answers, category: ResultCategoryId): Insight {
  if (
    answers.problem === "ideen_visualisieren" ||
    answers.problem === "keine_richtung" ||
    category === "C"
  ) {
    return {
      headline: "Hebel liegt vor dem Design",
      text: "Bevor gestaltet wird, muss klar sein, was eigentlich verpackt werden soll — Richtung, Idee und Titel kommen vor dem Bild.",
    };
  }
  if (answers.problem === "titel_thumbnail_mismatch") {
    return {
      headline: "Titel-Thumbnail-Fit ausbaufähig",
      text: "Titel und Bild sollten gemeinsam Neugier erzeugen, nicht getrennt voneinander. Das ist oft der unterschätzte Hebel.",
    };
  }
  if (answers.problem === "wenig_klicks") {
    return {
      headline: "Klickproblem, nicht Qualitätsproblem",
      text: "Oft sind Videos gut, aber die Verpackung schafft keinen Anreiz zu klicken. Das lässt sich mit dem richtigen System beheben.",
    };
  }
  if (answers.support === "retainer" || answers.support === "audit") {
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

export function buildInsights(
  category: ResultCategoryId,
  answers: Answers,
  channel: ChannelData | null
): Insight[] {
  return [
    rhythmInsight(answers, channel),
    thumbnailInsight(answers),
    strategyInsight(answers, category),
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

export function buildDiagnosis(answers: Answers, channel: ChannelData | null): Diagnosis {
  const direction: DiagnosisLevel = (() => {
    if (answers.goal === "unklar" || answers.problem === "keine_richtung") return "niedrig";
    if (
      (answers.goal === "kundenanfragen" || answers.goal === "expertenstatus") &&
      answers.problem &&
      answers.problem !== "keine_richtung" &&
      answers.problem !== "ideen_visualisieren"
    ) {
      return "hoch";
    }
    return "mittel";
  })();

  const system: DiagnosisLevel = (() => {
    switch (answers.thumbnails) {
      case "einheitlich":
        return "hoch";
      case "teilweise_gut":
      case "sehr_unterschiedlich":
        return "mittel";
      case "schnell_gebaut":
      case "keine_eigenen":
        return "niedrig";
      default:
        return "mittel";
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
      case "kaum_aktiv":
      case "plant_start":
        return "niedrig";
      default:
        return "mittel";
    }
  })();

  return { direction, system, cadence };
}
