import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

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
  format: string;
  elementCount: number;
  textIssue: string;
  contrast: string;
  branding: boolean;
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
  return `Du bist ein YouTube-Stratege mit Expertise in Klickpsychologie und
Thumbnail-Systematik. Deine Analyse basiert auf zwei bewährten Frameworks:
"How To Make Effective Thumbnails" (Jay Alto) und "The Thumbnail System"
(thumbnailsystem.com).

Analysiere dieses YouTube-Thumbnail gemeinsam mit dem Videotitel.

Videotitel: "${title}"

---

## Schritt 1: Klick-Format erkennen

Ordne das Thumbnail einem dieser bewährten Klick-Formate zu:

- Kontrovers: Provokante Aussage oder Bild das Widerspruch erzeugt
- Extrem: Überwältigender oder schockierender Moment
- Unlogisch: Etwas das keinen Sinn ergibt und Neugier weckt
- Emotional: Starke Gefühlsreaktion durch Mimik oder Situation
- Trending: Bezug zu aktuellem Ereignis oder Thema
- Informativ: Klares Versprechen eines konkreten Nutzens
- Keines davon: Kein erkennbares Klick-Format

---

## Schritt 2: Simplicity prüfen (3-Element-Regel)

Zähle die visuellen Hauptelemente im Thumbnail.
Maximal 3 Hauptinformationen sind ideal.
Mehr als 3 bedeutet Überladung — der Blick des Zuschauers verliert sich.

---

## Schritt 3: Text-Regel prüfen

Bewerte den Text im Thumbnail nach diesen Kriterien:
- Kein Text ist oft besser als schlechter Text
- Text sollte maximal 3 Wörter haben
- Text darf den Videotitel nie 1:1 wiederholen — das ist verschenkte Fläche
- Text ist nur sinnvoll, wenn er Aufmerksamkeit, Kontext oder den
  Klick-Anreiz direkt verstärkt

---

## Schritt 4: Kontrast prüfen (Thumbnail System)

Prüfe ob das Thumbnail einen der drei Kontrasttypen nutzt:
- Luminosity: dunkles Subjekt vor hellem Hintergrund oder umgekehrt
- Farbe: Komplementärfarben (z. B. Orange vor Blau)
- Sättigung: gesättigtes Subjekt vor entsättigter Umgebung

Ein Thumbnail ohne klaren Kontrast fällt im Feed nicht auf.

---

## Schritt 5: Titel-Thumbnail-Fit bewerten

Bewertet wird ausschließlich das Zusammenspiel aus Bild und Titel
im Hinblick auf Klickanreiz. Nicht der Inhalt oder die Qualität des Videos.

Bewertungsskala 1–5:
1 = Kein Fit: Bild und Titel haben keine erkennbare Verbindung
2 = Schwacher Fit: Lose Verbindung, keine gemeinsame Botschaft
3 = Mittlerer Fit: Verbindung erkennbar, Potenzial nicht ausgeschöpft
4 = Guter Fit: Bild und Titel verstärken sich gegenseitig
5 = Perfekter Fit: Starke Einheit, maximaler Klickanreiz durch Zusammenspiel

Abzüge (senken den Score um 1):
- Mehr als 3 Hauptelemente im Thumbnail
- Text wiederholt den Titel 1:1
- Text hat mehr als 3 Wörter ohne echten Mehrwert
- Kein erkennbarer Kontrast (Luminosity, Farbe oder Sättigung)

---

## Schritt 6: Wiedererkennung prüfen

Zeigt das Thumbnail Elemente eines konsistenten Kanal-Stils?
Gemeint sind: wiederkehrendes Gesicht, Farbpalette, Schriftbild
oder ein wiederholbarer visueller Aufbau.

---

Antworte NUR als JSON. Kein Text davor oder danach. Kein Markdown.
{
  "score": <Zahl 1-5>,
  "format": "<eines der 7 Formate von oben>",
  "elementCount": <Zahl — geschätzte Anzahl visueller Hauptelemente>,
  "textIssue": "<leer wenn kein Textproblem, sonst: 'zu lang' | 'wiederholt Titel' | 'kein Mehrwert'>",
  "contrast": "<'Luminosity' | 'Farbe' | 'Sättigung' | 'Keiner'>",
  "branding": true | false,
  "reason": "<1 Satz auf Deutsch, max. 15 Wörter, was den Score begründet>",
  "strong": "<Was gut funktioniert nach dem Framework, 1 Satz — oder leerer String wenn score <= 2>",
  "weak": "<Was das Zusammenspiel schwächt laut Framework, 1 Satz — oder leerer String wenn score = 5>"
}`;
}

function clampScore(n: unknown): AnalysisScore {
  const num = typeof n === "number" ? Math.round(n) : parseInt(String(n), 10);
  if (num >= 1 && num <= 5) return num as AnalysisScore;
  return 3;
}

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-preview-05-20",
];

async function getWorkingModel(ai: GoogleGenAI): Promise<string> {
  for (const modelName of MODELS) {
    try {
      await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: "test" }] }],
      });
      console.log(`title-analysis: using model ${modelName}`);
      return modelName;
    } catch {
      console.log(`title-analysis: model ${modelName} not available`);
    }
  }
  throw new Error("No working model found");
}

async function analyzeVideo(
  ai: GoogleGenAI,
  model: string,
  video: VideoInput
): Promise<ResultItem | null> {
  try {
    const image = await fetchImageAsBase64(video.thumbnail);
    if (!image) {
      console.error(`title-analysis: no image for video ${video.id}`);
      return null;
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.mimeType, data: image.data } },
            { text: buildPrompt(video.title) },
          ],
        },
      ],
    });

    const text = (response.text ?? "").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      score?: number;
      format?: string;
      elementCount?: number;
      textIssue?: string;
      contrast?: string;
      branding?: boolean;
      reason?: string;
      strong?: string;
      weak?: string;
    };

    const score = clampScore(parsed.score);
    const elementCountRaw = Number(parsed.elementCount);
    return {
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      score,
      label: scoreLabels[score],
      format: typeof parsed.format === "string" ? parsed.format : "Keines davon",
      elementCount: Number.isFinite(elementCountRaw) ? elementCountRaw : 0,
      textIssue: typeof parsed.textIssue === "string" ? parsed.textIssue : "",
      contrast: typeof parsed.contrast === "string" ? parsed.contrast : "Keiner",
      branding: parsed.branding === true,
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

  const ai = new GoogleGenAI({ apiKey: key });

  let model: string;
  try {
    model = await getWorkingModel(ai);
  } catch (err) {
    console.error("title-analysis: no working model", err);
    res.status(200).json({ ok: false, reason: "no_model" });
    return;
  }

  const videoSubset = videos.slice(0, 5);
  const settled = await Promise.allSettled(
    videoSubset.map((video) => analyzeVideo(ai, model, video))
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
