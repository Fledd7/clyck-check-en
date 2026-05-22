import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

export const maxDuration = 60;

type VideoInput = { id: string; title: string; thumbnail: string };

type AnalysisScore = 1 | 2 | 3 | 4 | 5;
type AnalysisLabel =
  | "Kein Fit"
  | "Schwacher Fit"
  | "Mittlerer Fit"
  | "Guter Fit"
  | "Perfekter Fit";

type ResultItem = {
  id: string;
  title: string;
  thumbnail: string;
  score: AnalysisScore;
  label: AnalysisLabel;
  reason: string;
  strong: string;
  weak: string;
};

const scoreLabels: Record<AnalysisScore, AnalysisLabel> = {
  1: "Kein Fit",
  2: "Schwacher Fit",
  3: "Mittlerer Fit",
  4: "Guter Fit",
  5: "Perfekter Fit",
};

async function fetchImageAsBase64(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return { data: base64, mimeType: contentType };
  } catch {
    return null;
  }
}

function buildPrompt(title: string): string {
  return `Du bist ein YouTube-Stratege mit Expertise in Thumbnail-Design und Klickpsychologie.

Analysiere das Zusammenspiel aus diesem YouTube-Thumbnail und dem zugehörigen Videotitel.

Videotitel: "${title}"

Bewertungskriterien:
1. Erzeugen Bild und Titel gemeinsam eine klare Botschaft?
2. Verstärken sie sich gegenseitig oder arbeiten sie gegeneinander?
3. Entsteht Neugier durch die Kombination — oder reicht eines allein nicht aus?
4. Ist das Bild konkret genug, um den Titel zu visualisieren?

Bewerte den Titel-Thumbnail-Fit auf einer Skala von 1 bis 5:
1 = Kein Fit (Bild und Titel haben keine erkennbare Verbindung)
2 = Schwacher Fit (lose Verbindung, aber keine gemeinsame Botschaft)
3 = Mittlerer Fit (Verbindung erkennbar, aber Potenzial nicht ausgeschöpft)
4 = Guter Fit (Bild und Titel ergänzen sich gut)
5 = Perfekter Fit (starke Einheit, klare Botschaft, hoher Klickanreiz)

Antworte NUR als JSON-Objekt. Kein weiterer Text. Kein Markdown.
{
  "score": <Zahl 1-5>,
  "reason": "<1 Satz auf Deutsch, max. 20 Wörter, was den Score begründet>",
  "strong": "<1 kurzer Satz was gut funktioniert, oder leer wenn score <= 2>",
  "weak": "<1 kurzer Satz was fehlt oder stört, oder leer wenn score = 5>"
}`;
}

function clampScore(n: unknown): AnalysisScore {
  const num = typeof n === "number" ? Math.round(n) : parseInt(String(n), 10);
  if (num >= 1 && num <= 5) return num as AnalysisScore;
  return 3;
}

async function analyzeVideo(
  model: GenerativeModel,
  video: VideoInput
): Promise<ResultItem | null> {
  try {
    const image = await fetchImageAsBase64(video.thumbnail);
    if (!image) {
      console.error(`title-analysis: no image for video ${video.id}`);
      return null;
    }

    const result = await model.generateContent([
      { inlineData: { mimeType: image.mimeType, data: image.data } },
      { text: buildPrompt(video.title) },
    ]);

    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      score?: number;
      reason?: string;
      strong?: string;
      weak?: string;
    };

    const score = clampScore(parsed.score);
    return {
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      score,
      label: scoreLabels[score],
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      strong: typeof parsed.strong === "string" ? parsed.strong : "",
      weak: typeof parsed.weak === "string" ? parsed.weak : "",
    };
  } catch (err) {
    console.error(`title-analysis: error on video ${video.id}`, err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("title-analysis called, key present:", !!process.env.GOOGLE_AI_KEY);

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
    res.status(200).json({ ok: false, reason: "no_key" });
    return;
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const videoSubset = videos.slice(0, 5);
  const settled = await Promise.allSettled(
    videoSubset.map((video) => analyzeVideo(model, video))
  );
  const results: ResultItem[] = settled
    .filter(
      (r): r is PromiseFulfilledResult<ResultItem | null> => r.status === "fulfilled"
    )
    .map((r) => r.value)
    .filter((v): v is ResultItem => v !== null);

  console.log(`title-analysis: ${results.length}/${videoSubset.length} succeeded`);

  if (results.length === 0) {
    res.status(200).json({ ok: false, reason: "no_results" });
    return;
  }

  res.status(200).json({ ok: true, results });
}
