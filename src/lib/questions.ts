import type { Question } from "./types";

export const questions: Question[] = [
  {
    id: "status",
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
    question: "Was ist gerade dein größtes Problem mit deinem YouTube-Auftritt?",
    options: [
      { value: "wenig_klicks", label: "Zu wenig Klicks", tags: ["packaging"] },
      { value: "unprofessionell", label: "Thumbnails wirken unprofessionell", tags: ["design"] },
      { value: "uneinheitlich", label: "Kanal wirkt uneinheitlich", tags: ["system"] },
      {
        value: "kein_thumbnail_konzept",
        label: "Ich weiß nicht, was aufs Thumbnail soll",
        tags: ["system", "strategy"],
      },
      {
        value: "titel_thumbnail_mismatch",
        label: "Titel und Thumbnail passen nicht zusammen",
        tags: ["packaging"],
      },
      {
        value: "ideen_visualisieren",
        label: "Meine Ideen sind schwer visuell darzustellen",
        tags: ["strategy"],
      },
      { value: "keine_richtung", label: "Keine klare Richtung", tags: ["strategy"] },
    ],
  },
  {
    id: "thumbnails",
    question: "Wie würdest du deine aktuellen Thumbnails beschreiben?",
    options: [
      { value: "einheitlich", label: "Einheitlich und professionell" },
      { value: "teilweise_gut", label: "Teilweise gut, aber ohne klares System" },
      { value: "sehr_unterschiedlich", label: "Sehr unterschiedlich" },
      { value: "schnell_gebaut", label: "Eher schnell zusammengebaut" },
      { value: "keine_eigenen", label: "Noch keine eigenen" },
      { value: "unsicher", label: "Bin unsicher" },
    ],
  },
  {
    id: "support",
    question: "Welche Unterstützung wäre für dich am wertvollsten?",
    options: [
      { value: "system", label: "Ein klares Thumbnail-System für meinen Kanal" },
      { value: "strategie", label: "Strategie für Ideen, Titel & Thumbnails" },
      { value: "audit", label: "Ein Audit meines aktuellen Kanals" },
      { value: "retainer", label: "Laufende Betreuung pro Monat" },
      { value: "einzelne", label: "Bessere einzelne Thumbnails" },
      { value: "unklar", label: "Weiß noch nicht" },
    ],
  },
];

export function getOptionLabel(qid: Question["id"], value: string | undefined): string {
  if (!value) return "";
  const q = questions.find((x) => x.id === qid);
  return q?.options.find((o) => o.value === value)?.label ?? "";
}
