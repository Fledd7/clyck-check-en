import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

type AnalysisScore = 1 | 2 | 3 | 4 | 5;
type AnalysisLabel =
  | "No Fit"
  | "Weak Fit"
  | "Average Fit"
  | "Good Fit"
  | "Perfect Fit";

const scoreLabels: Record<AnalysisScore, AnalysisLabel> = {
  1: "No Fit",
  2: "Weak Fit",
  3: "Average Fit",
  4: "Good Fit",
  5: "Perfect Fit",
};

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
      console.log(`analyze-upload: using model ${modelName}`);
      return modelName;
    } catch {
      console.log(`analyze-upload: model ${modelName} not available`);
    }
  }
  throw new Error("No working model found");
}

function clampScore(n: unknown): AnalysisScore {
  const num = typeof n === "number" ? Math.round(n) : parseInt(String(n), 10);
  if (num >= 1 && num <= 5) return num as AnalysisScore;
  return 3;
}

function buildPrompt(title: string): string {
  return `You are a YouTube thumbnail strategist.
Analyze this thumbnail and the video title.
Be direct, precise and consistent.

Video title: "${title}"

---

## HARD RULES — always apply, no exceptions

These styles are ALWAYS styleAge "veraltet"
and ALWAYS receive a maximum score of 3:

1. LOGO-DOMINANT STYLE
   A large company or brand logo takes up more than
   1/4 of the image area and is used as the primary
   design element
   (not as a small branding element at the edge)

2. APP/PRODUCT SCREENSHOT STYLE
   An app screenshot or product interface
   is placed as the main element next to a person
   (typical for finance, crypto, software reviews
   from 2019-2022)

3. COLORED TEXT BANNER (only this specific type)
   Rectangular, solid-color bar/badge
   (yellow, red, green) with neatly placed text INSIDE —
   looks like a label, sticker or price tag.
   Recognizable by: clear rectangular shape,
   flat color, text sits neatly inside.
   Examples: yellow box with "PAIN!", red bar
   with "NEW!", green badge with "FREE!"

   NOT meant (not a text banner, not outdated):
   Dynamic image text — text built as an integrated
   design element into the image:
   - Angled or perspective lettering
   - Text with shadows, depth or motion effects
   - Large, design-oriented typography
     that is part of the visual composition
   - Text that adapts in size and style to
     the mood of the image
   Examples of dynamic image text (NOT outdated):
   "PADEL TOURNAMENT" in diagonal large format with shadow,
   "10 YEARS" in stylized font over people,
   "HIDE AND SEEK" on a chalkboard in the image
   → These are never counted as text banners

4. SLIDE LAYOUT
   Photo and text side by side without real
   image composition — looks like PowerPoint

5. STOCK PHOTO + TEXT OVERLAY
   Generic stock photo with text on top —
   no real compositing effort recognizable

These rules override ALL other assessments.
Even if the rest of the thumbnail looks modern,
even if the composition is clean,
even if contrast is present.

A thumbnail with logo-dominant style + clean
composition gets a maximum of 3 — not 5.
A clean thumbnail is not automatically zeitgemäß.

---

## STEP 1: STYLE CLASSIFICATION

Classify the thumbnail into exactly one category:

### "veraltet"
At least ONE of these features is enough:
- Colored text banner/badge (yellow, red, green)
  with text inside as a design element
  (e.g. yellow box with "PAIN!", red banner with
  "NEW!", colorful badge with highlights)

DISTINCTION text banner vs. image text:
Before classifying as "veraltet" check:
Is the text a flat rectangular bar/badge
with a solid-color background?
→ YES: text banner → veraltet
→ NO, but dynamic typography without
  rectangular background: → not a text banner,
  determine styleAge by other criteria

- Slide layout: photo + text side by side without
  real image composition, looks like PowerPoint
- More than 6 meaningful words in the image
- No recognizable compositing effort,
  looks like stacked separate elements

### "überladen"
ONLY if BOTH points apply:
- Recognizable modern compositing effort
  (high-quality image editing, complex scene)
- Yet too many elements without clear hierarchy,
  the eye doesn't know where to look

Thumbnails with dynamic image text + modern
composite + many elements:
→ styleAge: "überladen" (not "veraltet")
→ score: 3/5
Example: Athletic composition with multiple
people, dynamic lettering and many
elements — modern style, but too packed

### "zeitgemäß"
- Clear visual hierarchy
- Strong main subject that is immediately recognized
- Little or no text
- High-quality composite or strong photo
- The eye is immediately drawn to what matters

### "neutral"
When there is no clear signal.

IMPORTANT: "veraltet" takes precedence over all others.
A thumbnail with a colored text banner is ALWAYS
"veraltet" — no matter how modern the rest looks.

### EXCEPTION: Versus/Debate Format (ALWAYS zeitgemäß)

If the thumbnail matches this pattern:
- White or light bar/banner at the top or bottom
- It says "X vs Y", "X vs Z people",
  title or topic of the debate
- Below/next to it are the participants
  side by side or in confrontation

→ styleAge: "zeitgemäß" — ALWAYS, no exception
→ textIssue: "" — text is part of the format,
  no title repeat even if words match
→ overloaded: false — multiple people are
  intentional and correct for this format
→ Score at least 3, with good fit 4-5

This style is widespread in 2024-2025 and
contemporary. The white banner on top is not
an outdated element but a format feature.

Example:
Banner on top: "ANIMAL RIGHTS ACTIVIST VS 10 PRO ZOO"
Below: people in confrontation
→ zeitgemäß, no text issue, score 4-5

---

## STEP 2: COUNT ELEMENTS

Count visual MAIN GROUPS:

Counting rules:
- All people together = 1 element
- All text in the image = 1 element
  (regardless of whether 1 word or multiple text blocks)
- All logos together = 1 element
- One dominant object in the foreground = 1 element
- Background scene = 1 element
  (everything happening in the background —
  regardless of how much is in it)
- Background scene with flags, group, buildings,
  landscape etc. = always 1 element

When in doubt, count fewer.

overloaded: true ONLY if BOTH apply:
- elementCount >= 5 AND
- The image looks chaotic and hard to grasp
  at first glance —
  there is no clear main person or
  no clear main subject that immediately stands out

overloaded: false if:
- Clear visual hierarchy is recognizable
  (even with 4+ elements)
- A person or motif clearly dominates
- Cartoon/illustration elements are used as
  a deliberately designed style
  (e.g. cartoon characters next to a real person
  as an artistic concept)
- The background is decorative but
  doesn't disturb the composition

Creative styles with multiple elements
are not automatically overloaded —
only when the eye finds no anchor point.

---

## STEP 3: EVALUATE TEXT

Count meaningful words:
- Numbers, special characters, emojis do NOT count
- Words under 2 letters do NOT count
- Proper names as context labels do NOT count
  (e.g. "XAVIER NAIDOO" next to a circled
  person = context, no problem)

Set textIssue:

"wiederholt Titel" ONLY if the text in the image
makes the same statement as the title —
not if it provides essential context.

"zu lang" if more than 5 meaningful
words in the image.

"kein Mehrwert" if text is present but neither
strengthens context nor click incentive.

"" (empty) if text is absent or correctly used.

IMPORTANT DISTINCTION — text types:

IN-SCENE TEXT (never count as textIssue):
Text naturally integrated into the scene —
on a board, a sign, a wall,
a whiteboard, a screen, a
packaging, a jersey or similar.
This text is part of the visual story,
not a separate text layer.

Examples of in-scene text:
- "HIDE AND SEEK" on a chalkboard
- "BACK TO SCHOOL 2.0" on a blackboard
- Writing on a poster in the background
→ textIssue: "" — always empty, never penalize

OVERLAY TEXT (can be a problem):
Text placed as a separate layer over the image —
recognizable by its own
font, its own background or
lack of natural connection to the scene.
→ Normal rules apply here

---

## STEP 4: CHECK CONTRAST

Check whether the main subject stands out clearly:

"Light/Dark": Dark subject against bright background
or vice versa. IMPORTANT: Person in dark clothing
against snowy landscape, bright sky or bright wall
= clear light/dark contrast. Don't overlook.

"Complementary Colors": Opposite colors.

"Saturation": Saturated subject, desaturated
background.

"None": ONLY if the subject truly blends into the
background and is barely recognizable.

---

## STEP 5: CHECK COLOR

colorDominant: true if a color immediately
stands out and highlights the thumbnail in the feed.

colorHarmony:
"harmonisch" = colors complement each other
"neutral" = neither harmonious nor disturbing
"chaotisch" = too many unrelated colors

colorImpact:
"stark" = stands out in the feed
"mittel" = average
"schwach" = gets lost in the feed

---

## STEP 6: CALCULATE SCORE

Scale 1–5 for the interplay of image and title:
1 = No Fit: no recognizable connection
2 = Weak Fit: loose connection
3 = Average Fit: connection recognizable, potential untapped
4 = Good Fit: image and title complement each other
5 = Perfect Fit: strong unity, maximum click incentive

MANDATORY CAPS (always apply):
- styleAge "veraltet" → score maximum 3
- styleAge "überladen" + overloaded true → score maximum 3
- textIssue "wiederholt Titel" → score maximum 3
- colorHarmony "chaotisch" → score maximum 3
- 2+ of these problems simultaneously → score maximum 2
- Score 5 ONLY if: zeitgemäß style + no text issue
  + no overloading + strong fit

---

## STEP 7: IMAGE CONCEPT SUGGESTION

concept: Only fill in if score <= 3.
1-2 sentences: What would be the ideal image for this title?
Describe a concrete motif, no design theory.
For score >= 4: "" (empty)

---

## OUTPUT

Reply ONLY as JSON. No text. No markdown.

{
  "score": <1-5>,
  "styleAge": <"zeitgemäß"|"veraltet"|"überladen"|"neutral">,
  "elementCount": <number>,
  "overloaded": <true|false>,
  "textIssue": <"wiederholt Titel"|"zu lang"|"kein Mehrwert"|"">,
  "contrast": <"Light/Dark"|"Complementary Colors"|"Saturation"|"None">,
  "colorDominant": <true|false>,
  "colorHarmony": <"harmonisch"|"neutral"|"chaotisch">,
  "colorImpact": <"stark"|"mittel"|"schwach">,
  "branding": <true|false>,
  "reason": "<1 sentence, max 15 words, what justifies the score>",
  "strong": "<What works well, 1 sentence — empty if score <= 2>",
  "weak": "<What's missing, 1 sentence — empty if score = 5>",
  "concept": "<Image concept suggestion if score <= 3, otherwise empty>"
}

Respond in English.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("analyze-upload called, key present:", !!process.env.GOOGLE_AI_KEY);

  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  let imageBase64: string | undefined;
  let mimeType: string | undefined;
  let title: string | undefined;

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    imageBase64 = body?.imageBase64;
    mimeType = body?.mimeType ?? "image/jpeg";
    title = body?.title;
  } catch {
    res.status(400).json({ ok: false });
    return;
  }

  if (!imageBase64 || !title) {
    res.status(400).json({ ok: false, reason: "missing_fields" });
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
    console.error("analyze-upload: no working model", err);
    res.status(200).json({ ok: false, reason: "no_model" });
    return;
  }

  try {
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
            { inlineData: { mimeType: mimeType ?? "image/jpeg", data: imageBase64 } },
            { text: buildPrompt(title) },
          ],
        },
      ],
    });

    const text = (response.text ?? "").trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as {
      score?: number;
      elementCount?: number;
      overloaded?: boolean;
      textIssue?: string;
      contrast?: string;
      styleAge?: string;
      colorDominant?: boolean;
      colorHarmony?: string;
      colorImpact?: string;
      branding?: boolean;
      reason?: string;
      strong?: string;
      weak?: string;
      concept?: string;
    };

    const rawScore = Number(parsed.score);
    let cappedScore = rawScore;

    const isVeraltet = parsed.styleAge === "veraltet";
    const isUeberladen = parsed.styleAge === "überladen";
    const hasTextIssue = typeof parsed.textIssue === "string" && parsed.textIssue !== "";
    const isOverloaded = parsed.overloaded === true;
    const isChaotic = parsed.colorHarmony === "chaotisch";

    if (isVeraltet) cappedScore = Math.min(cappedScore, 3);
    if (isUeberladen && isOverloaded) cappedScore = Math.min(cappedScore, 3);
    if (isChaotic) cappedScore = Math.min(cappedScore, 3);

    const problemCount = [isVeraltet, hasTextIssue, isOverloaded].filter(Boolean).length;
    if (problemCount >= 2) cappedScore = Math.min(cappedScore, 2);

    if (parsed.colorImpact === "schwach" && isVeraltet) {
      cappedScore = Math.min(cappedScore, 2);
    }

    if (parsed.styleAge !== "zeitgemäß" && parsed.styleAge !== "überladen") {
      cappedScore = Math.min(cappedScore, 4);
    }

    const score = clampScore(cappedScore);

    const result = {
      id: "upload",
      title,
      score,
      label: scoreLabels[score],
      format: "Keines davon",
      elementCount: Number.isFinite(Number(parsed.elementCount)) ? Number(parsed.elementCount) : 0,
      overloaded: parsed.overloaded ?? false,
      textIssue: typeof parsed.textIssue === "string" ? parsed.textIssue : "",
      contrast: typeof parsed.contrast === "string" ? parsed.contrast : "None",
      styleAge:
        parsed.styleAge === "zeitgemäß" ||
        parsed.styleAge === "veraltet" ||
        parsed.styleAge === "überladen"
          ? parsed.styleAge
          : "neutral",
      colorDominant: parsed.colorDominant ?? false,
      colorHarmony:
        parsed.colorHarmony === "harmonisch" || parsed.colorHarmony === "chaotisch"
          ? parsed.colorHarmony
          : "neutral",
      colorImpact:
        parsed.colorImpact === "stark" || parsed.colorImpact === "schwach"
          ? parsed.colorImpact
          : "mittel",
      branding: parsed.branding === true,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      strong: typeof parsed.strong === "string" ? parsed.strong : "",
      weak: typeof parsed.weak === "string" ? parsed.weak : "",
      concept: typeof parsed.concept === "string" ? parsed.concept : "",
    };

    res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error("analyze-upload: error", err);
    res.status(200).json({ ok: false, reason: "error" });
  }
}
