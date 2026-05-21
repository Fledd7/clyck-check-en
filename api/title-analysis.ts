import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

type VideoInput = { id: string; title: string };

type RatedItem = {
  videoId: string;
  title: string;
  rating: "hoch" | "mittel" | "niedrig";
  reason: string;
};

function buildPrompt(videos: VideoInput[]): string {
  const list = videos.map((v, i) => `${i + 1}. "${v.title}"`).join("\n");
  return `Du bist ein YouTube-Packaging-Experte. Bewerte jeden Videotitel nach seinem Klick-Potenzial und Thumbnail-Eignung auf einer Skala: hoch, mittel oder niedrig.

Kriterien für "hoch": klarer Nutzenversprechen oder starke Neugier, leicht visuell umsetzbar, spricht eine spezifische Zielgruppe an.
Kriterien für "mittel": Ansätze vorhanden, aber unklar oder zu generisch.
Kriterien für "niedrig": kein Klickreiz, schwer visuell umzusetzen, zu intern oder zu abstrakt.

Videotitel:
${list}

Antworte ausschließlich als JSON-Array (kein Markdown, kein Text davor oder danach):
[
  { "index": 1, "rating": "hoch"|"mittel"|"niedrig", "reason": "Kurze Begründung auf Deutsch (max. 1 Satz)" },
  ...
]`;
}

function buildSummary(items: RatedItem[]): string {
  const total = items.length;
  const hoch = items.filter((i) => i.rating === "hoch").length;
  const mittel = items.filter((i) => i.rating === "mittel").length;
  const niedrig = items.filter((i) => i.rating === "niedrig").length;

  if (hoch >= total * 0.6) {
    return `${hoch} von ${total} Titeln zeigen starkes Klick-Potenzial. Deine Titel-Arbeit ist solide – der nächste Schritt ist, dieses Potenzial konsequent in starke Thumbnails zu übersetzen.`;
  }
  if (niedrig >= total * 0.5) {
    return `${niedrig} von ${total} Titeln bieten wenig Klick-Potenzial. Hier liegt oft ungenutztes Potenzial – stärkere Titel-Formulierungen können helfen, den Klickreiz klarer zu machen.`;
  }
  return `${mittel + hoch} von ${total} Titeln haben ausbaufähiges Potenzial. Mit klareren Nutzenversprechen und mehr Neugier-Elementen lässt sich hier noch mehr herausholen.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  let videos: VideoInput[] = [];
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    videos = Array.isArray(body?.videos) ? (body.videos as VideoInput[]) : [];
  } catch {
    res.status(400).json({ ok: false });
    return;
  }

  if (videos.length < 1) {
    res.status(400).json({ ok: false, reason: "no_videos" });
    return;
  }

  const key = process.env.GOOGLE_AI_KEY;
  if (!key) {
    res.status(200).json({ ok: false, reason: "missing_config" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(buildPrompt(videos));
    const text = result.response.text().trim();

    // Strip markdown fences if present
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(json) as Array<{
      index: number;
      rating: "hoch" | "mittel" | "niedrig";
      reason: string;
    }>;

    const items: RatedItem[] = parsed.map((p) => {
      const video = videos[p.index - 1];
      return {
        videoId: video?.id ?? String(p.index),
        title: video?.title ?? "",
        rating: p.rating,
        reason: p.reason,
      };
    });

    res.status(200).json({ ok: true, data: { items, summary: buildSummary(items) } });
  } catch (err) {
    console.error("title-analysis error", err);
    res.status(200).json({ ok: false, reason: "ai_error" });
  }
}
