import type { Question, QuestionId } from "./types";

export const questions: Question[] = [
  {
    id: "status",
    multiSelect: false,
    question: "Wo stehst du gerade mit deinem YouTube-Kanal?",
    options: [
      { value: "regelmaessig", label: "Ich veröffentliche regelmäßig" },
      { value: "unregelmaessig", label: "Ich veröffentliche, aber unregelmäßig" },
      { value: "kaum_aktiv", label: "Kanal ist da, aber kaum aktiv" },
      { value: "plant_start", label: "Ich plane gerade den Start" },
    ],
  },
  {
    id: "goal",
    multiSelect: true,
    maxSelect: 3,
    question: "Was soll dein Kanal vor allem erreichen?",
    options: [
      { value: "kundenanfragen", label: "Mehr Kundenanfragen" },
      { value: "expertenstatus", label: "Expertenstatus aufbauen" },
      { value: "reichweite", label: "Reichweite / Bekanntheit" },
      { value: "community", label: "Community aufbauen" },
      { value: "monetarisieren", label: "Inhalte monetarisieren" },
      { value: "unklar", label: "Noch nicht ganz klar" },
    ],
  },
  {
    id: "problem",
    multiSelect: true,
    maxSelect: 3,
    question: "Was ist gerade dein größtes Problem mit deinem YouTube-Auftritt?",
    options: [
      { value: "wenig_klicks", label: "Zu wenig Klicks", tags: ["packaging"] },
      {
        value: "unprofessionell",
        label: "Ich bin mit meinen Thumbnails nicht zufrieden",
        tags: ["design"],
      },
      {
        value: "uneinheitlich",
        label: "Mir fehlt ein roter Faden im Look meines Kanals",
        tags: ["system"],
      },
      {
        value: "kein_thumbnail_konzept",
        label: "Ich weiß oft nicht, was aufs Thumbnail soll",
        tags: ["system", "strategy"],
      },
      {
        value: "titel_thumbnail_mismatch",
        label: "Ich bin unsicher, wie ich meine Videoideen visuell verpacken soll",
        tags: ["system"],
      },
      {
        value: "ideen_visualisieren",
        label: "Meine Themen sind schwer in ein Bild zu übersetzen",
        tags: ["strategy"],
      },
      {
        value: "keine_richtung",
        label: "Ich bin noch dabei, meine Kanalrichtung zu finden",
        tags: ["strategy"],
      },
    ],
  },
  {
    id: "thumbnails",
    multiSelect: false,
    question: "Wie würdest du deine aktuellen Thumbnails beschreiben?",
    options: [
      { value: "einheitlich", label: "Ich habe einen klaren, konsistenten Stil" },
      { value: "teilweise_gut", label: "Teilweise gut, aber ohne klares System dahinter" },
      { value: "sehr_unterschiedlich", label: "Jedes Thumbnail sieht anders aus" },
      { value: "schnell_gebaut", label: "Ich erstelle sie schnell, ohne festes Konzept" },
      { value: "keine_eigenen", label: "Ich habe noch nie bewusst an meinen Thumbnails gearbeitet" },
      { value: "unsicher", label: "Ich weiß nicht, wie ich sie einordnen soll" },
    ],
  },
  {
    id: "support",
    multiSelect: true,
    maxSelect: 3,
    question: "Welche Unterstützung wäre für dich am wertvollsten?",
    options: [
      { value: "system", label: "Ein klares Thumbnail-System für meinen Kanal" },
      { value: "strategie", label: "Strategie für Ideen, Titel & Thumbnails" },
      { value: "audit", label: "Ein Audit meines aktuellen Kanals" },
      { value: "retainer", label: "Laufende Betreuung pro Monat" },
      { value: "unklar", label: "Weiß noch nicht" },
    ],
  },
];

export function getQuestionById(id: QuestionId): Question | undefined {
  return questions.find((q) => q.id === id);
}
