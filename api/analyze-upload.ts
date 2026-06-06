import type { VercelRequest, VercelResponse } from "@vercel/node";

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("analyze-upload: start");

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    console.log("analyze-upload: body parsed, title:", body?.title);
    console.log("analyze-upload: imageBase64 length:", body?.imageBase64?.length ?? 0);
    console.log("analyze-upload: key present:", !!process.env.GOOGLE_AI_KEY);

    if (!process.env.GOOGLE_AI_KEY) {
      return res.status(200).json({ ok: false, reason: "no_key" });
    }

    if (!body?.imageBase64 || !body?.title) {
      return res.status(200).json({ ok: false, reason: "missing_data" });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY });
    console.log("analyze-upload: ai initialized");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { temperature: 0 },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: body.mimeType || "image/jpeg",
                data: body.imageBase64,
              },
            },
            {
              text: `Analyze this thumbnail. Video title: "${body.title}". Reply only as JSON: {"score": 3, "reason": "short reason", "strong": "", "weak": "", "styleAge": "neutral", "contrast": "None", "textIssue": "", "overloaded": false, "elementCount": 2, "colorDominant": true, "colorHarmony": "neutral", "colorImpact": "mittel", "branding": false, "concept": ""}`,
            },
          ],
        },
      ],
    });

    console.log("analyze-upload: gemini responded");
    const text = (response.text ?? "").trim().replace(/```json|```/g, "");
    const parsed = JSON.parse(text);

    return res.status(200).json({
      ok: true,
      result: { id: "upload", title: body.title, label: "Average Fit", ...parsed },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("analyze-upload fatal:", msg);
    return res.status(200).json({ ok: false, reason: msg });
  }
}
