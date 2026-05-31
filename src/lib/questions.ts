import type { Question, QuestionId } from "./types";

export const questions: Question[] = [
  {
    id: "status",
    multiSelect: false,
    question: "Where are you right now with your YouTube channel?",
    options: [
      { value: "regelmaessig", label: "I publish regularly" },
      { value: "unregelmaessig", label: "I publish, but inconsistently" },
      { value: "kaum_aktiv", label: "Channel exists, but barely active" },
      { value: "plant_start", label: "I'm planning to launch" },
    ],
  },
  {
    id: "goal",
    multiSelect: true,
    maxSelect: 3,
    question: "What should your channel mainly achieve?",
    options: [
      { value: "kundenanfragen", label: "More client inquiries" },
      { value: "expertenstatus", label: "Build expert status" },
      { value: "reichweite", label: "Reach / Visibility" },
      { value: "community", label: "Build a community" },
      { value: "monetarisieren", label: "Monetize content" },
      { value: "unklar", label: "Not entirely clear yet" },
    ],
  },
  {
    id: "problem",
    multiSelect: true,
    maxSelect: 3,
    question: "What's currently your biggest problem with your YouTube presence?",
    options: [
      { value: "wenig_klicks", label: "Too few clicks", tags: ["packaging"] },
      {
        value: "unprofessionell",
        label: "I'm not happy with my thumbnails",
        tags: ["design"],
      },
      {
        value: "uneinheitlich",
        label: "My channel lacks a consistent visual identity",
        tags: ["system"],
      },
      {
        value: "kein_thumbnail_konzept",
        label: "I often don't know what to put on the thumbnail",
        tags: ["system", "strategy"],
      },
      {
        value: "titel_thumbnail_mismatch",
        label: "I'm unsure how to visually package my video ideas",
        tags: ["system"],
      },
      {
        value: "ideen_visualisieren",
        label: "My topics are hard to translate into an image",
        tags: ["strategy"],
      },
      {
        value: "keine_richtung",
        label: "I'm still figuring out my channel direction",
        tags: ["strategy"],
      },
    ],
  },
  {
    id: "thumbnails",
    multiSelect: false,
    question: "How would you describe your current thumbnails?",
    options: [
      { value: "einheitlich", label: "I have a clear, consistent style" },
      { value: "teilweise_gut", label: "Sometimes good, but no clear system behind it" },
      { value: "sehr_unterschiedlich", label: "Every thumbnail looks different" },
      { value: "schnell_gebaut", label: "I create them quickly, without a fixed concept" },
      { value: "keine_eigenen", label: "I've never consciously worked on my thumbnails" },
      { value: "unsicher", label: "I don't know how to categorize them" },
    ],
  },
  {
    id: "support",
    multiSelect: true,
    maxSelect: 3,
    question: "What kind of support would be most valuable to you?",
    options: [
      { value: "system", label: "A clear thumbnail system for my channel" },
      { value: "strategie", label: "Strategy for ideas, titles & thumbnails" },
      { value: "audit", label: "An audit of my current channel" },
      { value: "retainer", label: "Ongoing monthly support" },
      { value: "unklar", label: "Not sure yet" },
    ],
  },
];

export function getQuestionById(id: QuestionId): Question | undefined {
  return questions.find((q) => q.id === id);
}
