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
  overloaded: boolean;
  textIssue: string;
  contrast: string;
  styleAge: "zeitgemäß" | "veraltet" | "neutral";
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

## Schritt 2: Visuelle Überladung prüfen

STRIKTE Definition — ein Element ist immer:
- Alle Texte zusammen = MAXIMAL 1 Element
  (egal ob 1 Wort oder 5 Wörter an verschiedenen Stellen —
  der gesamte Text im Bild zählt als 1 Element)
- Eine Person / ein Gesicht = 1 Element
- Ein Logo = 1 Element
- Ein dominantes Objekt (Auto, Produkt, Tier) = 1 Element
- Ein grafisches Element (Pfeil, Rahmen, Icon) = 1 Element
- Der Hintergrund zählt NIE als Element
- Eine Komposition aus mehreren Personen = 1 Element

WICHTIG: Addiere diese Kategorien.
Maximal 3 = optimal.
4 = leicht überladen.
5+ = überladen.

Beispiel korrekte Zählung:
Vorher-Nachher-Foto (2 Personen) + Text + Pfeil = 3 Elemente.
Person + Text + Logo + Gebäude = 4 Elemente.

Setze overloaded: true NUR wenn elementCount >= 5
ODER wenn die Komposition bei elementCount 4 tatsächlich
visuell unruhig und kaum erfassbar wirkt.
Bei elementCount <= 3: overloaded immer false.

---

## Schritt 3: Text im Thumbnail bewerten

Text auf Thumbnails ist 2026 oft ein Zeichen von
schwachem Bild-Konzept — wenn das Bild allein nicht
stark genug ist, wird Text als Krücke eingesetzt.

Bewerte Text nach diesen Kriterien:

PROBLEM: Text wiederholt den Videotitel sinngemäß
→ textIssue: 'wiederholt Titel'
→ Das ist verschenkte Fläche. Der Titel steht bereits
  direkt unter dem Thumbnail. Wer ihn nochmal ins Bild
  schreibt, hat kein stärkeres Bild-Konzept gefunden.

PROBLEM: Mehr als 5 bedeutungstragende Wörter im Bild
→ textIssue: 'zu lang'
→ Langer Text funktioniert nicht im Feed.
  Thumbnails werden in 1–2 Sekunden gescannt.
  Was nicht sofort erfassbar ist, wird nicht geklickt.

PROBLEM: Text ist dekorativ ohne Klick-Funktion
→ textIssue: 'kein Mehrwert'
→ Text der nichts zur Neugier oder zum Kontext
  beiträgt, schadet mehr als er nützt.

KEIN PROBLEM: Kurze Power-Wörter (1–3 Wörter) die
einen Wow-Faktor oder eine Neugier-Lücke öffnen.
Beispiele: 'GEHEIM', 'DAY 28', '$0', 'NEVER AGAIN'
→ textIssue: '' (leer)

---

## Schritt 4: Kontrast prüfen (Thumbnail System)

Prüfe ob das Thumbnail einen der drei Kontrasttypen nutzt:
- Hell/Dunkel: dunkles Subjekt vor hellem Hintergrund oder umgekehrt
- Komplementärfarben: z. B. Orange vor Blau, Rot vor Grün
- Sättigung: gesättigtes Subjekt vor entsättigter Umgebung

Benenne den Kontrast mit diesen Begriffen:
- "Hell/Dunkel" (nicht "Luminosity")
- "Komplementärfarben" (nicht "Farbe" oder "Colors")
- "Sättigung" (bleibt gleich)
- "Keiner" (wenn kein klarer Kontrast)

Ein Thumbnail ohne klaren Kontrast fällt im Feed nicht auf.

---

## Schritt 5: Ehrliche Stil-Einordnung

Bewerte ob der Thumbnail-Stil zeitgemäß ist.
Sei hier direkt und ehrlich — nicht diplomatisch.

VERALTET — setze styleAge: 'veraltet' wenn:
- Farbbalken (rot/gelb/grün) mit weißem Text
  als Hauptgestaltungselement sichtbar ist
- Eine Zahl mit €/$ als dominantes visuelles Element
  ohne starkes Bild dahinter
- Mehr als 5 Wörter Text im Bild
- Das Thumbnail wie ein Folienlayout wirkt
  (Text + Foto nebeneinander ohne visuelle Spannung)
- Der Stil einem typischen deutschen Coaching-/
  Finanz-YouTube-Thumbnail 2019–2022 ähnelt

ZEITGEMÄSS — setze styleAge: 'zeitgemäß' wenn:
- Das Bild allein die Botschaft trägt
- Klare visuelle Hierarchie mit einem dominanten Motiv
- Wenig oder kein Text
- Cinematische oder hochwertige Bildqualität
- Starke Emotion oder starke Situation im Vordergrund

NEUTRAL — wenn kein eindeutiges Signal

Wichtig: 'Veraltet' bedeutet nicht 'schlecht produziert'.
Es bedeutet: Dieser Stil wird 2025 in den meisten
Nischen von moderneren Thumbnails überholt.

---

## Schritt 6: Titel-Thumbnail-Fit bewerten

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
- Text hat mehr als 5 bedeutungstragende Wörter ohne echten Mehrwert
- Kein erkennbarer Kontrast (Hell/Dunkel, Komplementärfarben oder Sättigung)

---

## Schritt 7: Wiedererkennung prüfen

Zeigt das Thumbnail Elemente eines konsistenten Kanal-Stils?
Gemeint sind: wiederkehrendes Gesicht, Farbpalette, Schriftbild
oder ein wiederholbarer visueller Aufbau.

---

Antworte NUR als JSON. Kein Text davor oder danach. Kein Markdown.
{
  "score": <Zahl 1-5>,
  "format": "<eines der 7 Formate von oben>",
  "elementCount": <Zahl — Anzahl visueller Haupt-Elemente>,
  "overloaded": true | false,
  "textIssue": "<leer wenn kein Textproblem, sonst: 'zu lang' | 'wiederholt Titel' | 'kein Mehrwert'>",
  "contrast": "<'Hell/Dunkel' | 'Komplementärfarben' | 'Sättigung' | 'Keiner'>",
  "styleAge": "<'zeitgemäß' | 'veraltet' | 'neutral'>",
  "branding": true | false,
  "reason": "<1 Satz auf Deutsch, max. 15 Wörter, konkret und direkt — keine Fachbegriffe, keine englischen Wörter, kein 'könnte', 'wirkt etwas', 'hat gewisse Schwächen'>",
  "strong": "<Was gut funktioniert, 1 Satz auf Deutsch ohne Fachbegriffe — oder leerer String wenn score <= 2>",
  "weak": "<Was das Zusammenspiel schwächt, 1 Satz auf Deutsch ohne Fachbegriffe — oder leerer String wenn score = 5>"
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
      config: {
        temperature: 0,
        topP: 1,
        topK: 1,
      },
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
      overloaded?: boolean;
      textIssue?: string;
      contrast?: string;
      styleAge?: string;
      branding?: boolean;
      reason?: string;
      strong?: string;
      weak?: string;
    };

    const rawScore = Number(parsed.score);
    let cappedScore = rawScore;
    let reasonSuffix = "";

    if (parsed.styleAge !== "zeitgemäß") {
      if (cappedScore > 4) {
        cappedScore = 4;
        reasonSuffix = " Der Stil trägt Merkmale älterer Thumbnail-Ästhetik, was das Maximum begrenzt.";
      }
    }

    parsed.score = cappedScore;
    const score = clampScore(parsed.score);
    const elementCountRaw = Number(parsed.elementCount);
    const baseReason = typeof parsed.reason === "string" ? parsed.reason : "";
    return {
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      score,
      label: scoreLabels[score],
      format: typeof parsed.format === "string" ? parsed.format : "Keines davon",
      elementCount: Number.isFinite(elementCountRaw) ? elementCountRaw : 0,
      overloaded: parsed.overloaded ?? (Number.isFinite(elementCountRaw) && elementCountRaw > 3),
      textIssue: typeof parsed.textIssue === "string" ? parsed.textIssue : "",
      contrast: typeof parsed.contrast === "string" ? parsed.contrast : "Keiner",
      styleAge: (parsed.styleAge === "zeitgemäß" || parsed.styleAge === "veraltet") ? parsed.styleAge : "neutral",
      branding: parsed.branding === true,
      reason: baseReason + reasonSuffix,
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
