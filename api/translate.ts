import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;

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
      return modelName;
    } catch {
      // try next
    }
  }
  throw new Error("No working model found");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  const key = process.env.GOOGLE_AI_KEY;
  if (!key) {
    res.status(200).json({ ok: false, reason: "no_key" });
    return;
  }

  let texts: string[] = [];
  let targetLang: "en" | "de" = "en";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    texts = Array.isArray(body?.texts) ? body.texts : [];
    targetLang = body?.targetLang === "de" ? "de" : "en";
  } catch {
    res.status(400).json({ ok: false });
    return;
  }

  if (texts.length === 0) {
    res.status(200).json({ ok: true, translations: [] });
    return;
  }

  const ai = new GoogleGenAI({ apiKey: key });

  let model: string;
  try {
    model = await getWorkingModel(ai);
  } catch {
    res.status(200).json({ ok: false, reason: "no_model" });
    return;
  }

  const langName = targetLang === "en" ? "Englische" : "Deutsche";
  const prompt = `Übersetze die folgenden Texte ins ${langName}.
Behalte den Ton und die Direktheit bei.
Antworte NUR als JSON-Array mit den übersetzten Strings.
Gleiche Reihenfolge wie die Eingabe. Kein Markdown.

Texte:
${JSON.stringify(texts)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      config: { temperature: 0 },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = (response.text ?? "").trim().replace(/```json|```/g, "").trim();
    const translations = JSON.parse(raw) as string[];
    res.status(200).json({ ok: true, translations });
  } catch {
    res.status(200).json({ ok: false, reason: "translate_error" });
  }
}
