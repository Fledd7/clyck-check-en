import type { Answers, ChannelData, ResultCategory, ResultCategoryId } from "./types";

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
