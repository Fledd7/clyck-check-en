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
  styleAge: "zeitgemäß" | "veraltet" | "überladen" | "neutral";
  colorDominant: boolean;
  colorHarmony: "harmonisch" | "neutral" | "chaotisch";
  colorImpact: "stark" | "mittel" | "schwach";
  branding: boolean;
  reason: string;
  strong: string;
  weak: string;
  concept: string;
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
  return `Du bist ein YouTube-Thumbnail-Stratege.
Analysiere dieses Thumbnail und den Videotitel.
Sei direkt, präzise und konsistent.

Videotitel: "${title}"

---

## HARTE REGELN — immer anwenden, keine Ausnahmen

Diese Stile sind IMMER styleAge "veraltet"
und bekommen IMMER score maximal 3:

1. LOGO-DOMINANT-STIL
   Großes Firmen- oder Markenlogo nimmt mehr als
   1/4 der Bildfläche ein und ist als primäres
   Gestaltungselement eingesetzt
   (nicht als kleines Branding-Element am Rand)

2. APP/PRODUKT-SCREENSHOT-STIL
   Ein App-Screenshot oder Produkt-Interface
   ist als Hauptelement neben einer Person platziert
   (typisch für Finanz-, Crypto-, Software-Reviews
   aus 2019-2022)

3. FARBIGER TEXT-BANNER (nur dieser spezifische Typ)
   Rechteckiger, einfarbiger Balken/Badge
   (gelb, rot, grün) mit sauber gesetztem Text DARIN —
   wirkt wie ein Label, Sticker oder Preisschild.
   Erkennbar durch: klare rechteckige Form,
   flache Farbe, Text sitzt ordentlich darin.
   Beispiele: gelbe Box mit "PAIN!", roter Balken
   mit "NEU!", grüner Badge mit "GRATIS!"

   NICHT gemeint (kein Textbanner, nicht veraltet):
   Dynamischer Bildtext — Text der als integriertes
   Gestaltungselement ins Bild eingebaut ist:
   - Schräggestellte oder perspektivische Schrift
   - Text mit Schatten, Tiefe oder Bewegungseffekt
   - Große, gestalterisch eingesetzte Typografie
     die Teil der visuellen Komposition ist
   - Text der sich in Größe und Stil der
     Bildstimmung anpasst
   Beispiele für dynamischen Bildtext (NICHT veraltet):
   "PADEL TURNIER" in schrägem Großformat mit Schatten,
   "10 JAHRE" in stilisierter Schrift über Personen,
   "HIDE AND SEEK" auf Schultafel im Bild
   → Diese werden nie als Textbanner gewertet

4. FOLIENLAYOUT
   Foto und Text nebeneinander ohne echte
   Bildkomposition — wirkt wie PowerPoint

5. STOCK-FOTO + TEXT OVERLAY
   Generisches Stock-Foto mit Text darüber —
   kein echter Compositing-Aufwand erkennbar

Diese Regeln überschreiben ALLE anderen Bewertungen.
Auch wenn der Rest des Thumbnails modern wirkt,
auch wenn die Komposition sauber ist,
auch wenn Kontrast vorhanden ist.

Ein Thumbnail mit Logo-dominant-Stil + sauberer
Komposition bekommt maximal 3 — nicht 5.
Ein sauberes Thumbnail ist nicht automatisch zeitgemäß.

---

## SCHRITT 1: STIL-EINORDNUNG

Ordne das Thumbnail in genau eine Kategorie:

### "veraltet"
Mindestens EINES dieser Merkmale reicht:
- Farbiger Text-Banner/Badge (gelb, rot, grün)
  mit Text darin als Gestaltungselement
  (z.B. gelbe Box mit "PAIN!", roter Banner mit
  "NEU!", bunter Badge mit Highlights)

UNTERSCHEIDUNG Textbanner vs. Bildtext:
Vor der Einordnung als "veraltet" prüfen:
Ist der Text ein flacher rechteckiger Balken/Badge
mit einfarbigem Hintergrund?
→ JA: Textbanner → veraltet
→ NEIN, sondern dynamische Typografie ohne
  rechteckigen Hintergrund: → kein Textbanner,
  styleAge nach anderen Kriterien bestimmen

- Folienlayout: Foto + Text nebeneinander ohne
  echte Bildkomposition, wirkt wie PowerPoint
- Mehr als 6 bedeutungstragende Wörter im Bild
- Kein erkennbarer Compositing-Aufwand,
  wirkt wie übereinandergelegte Einzelteile

### "überladen"
NUR wenn BEIDE Punkte zutreffen:
- Erkennbarer moderner Compositing-Aufwand
  (hochwertige Bildbearbeitung, komplexe Szene)
- Trotzdem zu viele Elemente ohne klare Hierarchie,
  das Auge weiß nicht wo es hinschauen soll

Thumbnails mit dynamischem Bildtext + modernem
Composite + vielen Elementen:
→ styleAge: "überladen" (nicht "veraltet")
→ score: 3/5
Beispiel: Sportliche Komposition mit mehreren
Personen, dynamischer Schrift und vielen
Elementen — moderner Stil, aber zu vollgepackt

### "zeitgemäß"
- Klare visuelle Hierarchie
- Starkes Hauptmotiv das sofort erkannt wird
- Wenig oder kein Text
- Hochwertiges Composite oder starkes Foto
- Der Blick wird sofort auf das Wesentliche gelenkt

### "neutral"
Wenn kein eindeutiges Signal.

WICHTIG: "veraltet" hat Vorrang vor allen anderen.
Ein Thumbnail mit farbigem Text-Banner ist IMMER
"veraltet" — egal wie modern der Rest wirkt.

### AUSNAHME: Versus/Debate-Format (IMMER zeitgemäß)

Wenn das Thumbnail diesem Muster entspricht:
- Weißer oder heller Balken/Banner oben oder unten
- Darin steht "X vs Y", "X vs Z Personen",
  Titel oder Thema der Debatte
- Darunter/daneben stehen die beteiligten
  Personen nebeneinander oder in Konfrontation

→ styleAge: "zeitgemäß" — IMMER, keine Ausnahme
→ textIssue: "" — Text ist Teil des Formats,
  kein Titel-Repeat auch wenn Wörter übereinstimmen
→ overloaded: false — mehrere Personen sind
  bei diesem Format bewusst und korrekt
→ Score mindestens 3, bei gutem Fit 4-5

Dieser Stil ist 2024-2025 weit verbreitet und
zeitgemäß. Der weiße Banner oben ist kein
veraltetes Element sondern ein Format-Merkmal.

Beispiel:
Banner oben: "TIERSCHÜTZER VS 10 PRO ZOO"
Darunter: Personen in Konfrontation
→ zeitgemäß, kein Textproblem, Score 4-5

---

## SCHRITT 2: ELEMENTE ZÄHLEN

Zähle visuelle HAUPTGRUPPEN:

Zählregeln:
- Alle Personen zusammen = 1 Element
- Gesamter Text im Bild = 1 Element
  (egal ob 1 Wort oder mehrere Textblöcke)
- Alle Logos zusammen = 1 Element
- Ein dominantes Objekt im Vordergrund = 1 Element
- Hintergrundszene = 1 Element
  (alles was im Hintergrund passiert —
  egal wie viel darin vorkommt)
- Hintergrundszene mit Flaggen, Gruppe, Gebäuden,
  Landschaft etc. = immer 1 Element

Im Zweifel weniger zählen.

overloaded: true NUR wenn BEIDE zutreffen:
- elementCount >= 5 UND
- Das Bild wirkt auf den ersten Blick
  chaotisch und schwer erfassbar —
  es gibt keine klare Hauptperson oder
  kein klares Hauptmotiv das sofort auffällt

overloaded: false wenn:
- Klare visuelle Hierarchie erkennbar ist
  (auch bei 4+ Elementen)
- Eine Person oder ein Motiv klar dominiert
- Cartoon/Illustration-Elemente als
  bewusst gestalteter Stil eingesetzt werden
  (z.B. Cartoon-Figuren neben echter Person
  als künstlerisches Konzept)
- Der Hintergrund dekorativ ist aber
  die Komposition nicht stört

Kreative Stile mit mehreren Elementen
sind nicht automatisch überladen —
nur wenn das Auge keinen Ankerpunkt findet.

---

## SCHRITT 3: TEXT BEWERTEN

Bedeutungstragende Wörter zählen:
- Zahlen, Sonderzeichen, Emojis zählen NICHT
- Wörter unter 2 Buchstaben zählen NICHT
- Eigennamen als Kontext-Label zählen NICHT
  (z.B. "XAVIER NAIDOO" neben eingekreister
  Person = Kontext, kein Problem)

textIssue setzen:

"wiederholt Titel" NUR wenn der Text im Bild
dieselbe Aussage wie der Titel macht —
nicht wenn er essenziellen Kontext liefert.

"zu lang" wenn mehr als 5 bedeutungstragende
Wörter im Bild.

"kein Mehrwert" wenn Text vorhanden aber weder
Kontext noch Klick-Anreiz verstärkt.

"" (leer) wenn Text fehlt oder korrekt eingesetzt.

WICHTIGE UNTERSCHEIDUNG — Text-Typen:

IN-SCENE-TEXT (nie als textIssue werten):
Text der natürlich in die Szene integriert ist —
auf einer Tafel, einem Schild, einer Wand,
einem Whiteboard, einem Bildschirm, einer
Verpackung, einem Trikot oder ähnlichem.
Dieser Text ist Teil der visuellen Geschichte,
kein separater Textlayer.

Beispiele für In-Scene-Text:
- "HIDE AND SEEK" auf einer Schultafel
- "BACK TO SCHOOL 2.0" auf einer Kreidetafel
- Schriftzug auf einem Plakat im Hintergrund
→ textIssue: "" — immer leer, nie bestrafen

OVERLAY-TEXT (kann ein Problem sein):
Text der als separater Layer über das Bild
gelegt wurde — erkennbar durch eigene
Schriftart, eigenen Hintergrund oder
fehlenden natürlichen Bezug zur Szene.
→ Hier gelten die normalen Regeln

---

## SCHRITT 4: KONTRAST PRÜFEN

Prüfe ob das Hauptmotiv sich klar abhebt:

"Hell/Dunkel": Dunkles Motiv vor hellem Hintergrund
oder umgekehrt. WICHTIG: Person in dunkler Kleidung
vor Schneelandschaft, hellem Himmel oder heller Wand
= klarer Hell/Dunkel-Kontrast. Nicht übersehen.

"Komplementärfarben": Gegensätzliche Farben.

"Sättigung": Gesättigtes Motiv, entsättigter
Hintergrund.

"Keiner": NUR wenn das Motiv wirklich im
Hintergrund untergeht und kaum erkennbar ist.

---

## SCHRITT 5: FARBE PRÜFEN

colorDominant: true wenn eine Farbe sofort
auffällt und das Thumbnail im Feed hervorhebt.

colorHarmony:
"harmonisch" = Farben ergänzen sich
"neutral" = weder harmonisch noch störend
"chaotisch" = zu viele unverbundene Farben

colorImpact:
"stark" = sticht im Feed heraus
"mittel" = durchschnittlich
"schwach" = geht im Feed unter

---

## SCHRITT 6: SCORE BERECHNEN

Skala 1–5 für das Zusammenspiel aus Bild und Titel:
1 = Kein Fit: keine erkennbare Verbindung
2 = Schwacher Fit: lose Verbindung
3 = Mittlerer Fit: Verbindung erkennbar, Potenzial unausgeschöpft
4 = Guter Fit: Bild und Titel ergänzen sich
5 = Perfekter Fit: starke Einheit, maximaler Klickanreiz

PFLICHT-CAPS (immer anwenden):
- styleAge "veraltet" → score maximal 3
- styleAge "überladen" + overloaded true → score maximal 3
- textIssue "wiederholt Titel" → score maximal 3
- colorHarmony "chaotisch" → score maximal 3
- 2+ dieser Probleme gleichzeitig → score maximal 2
- Score 5 NUR wenn: zeitgemäßer Stil + kein Textproblem
  + kein Overloading + starker Fit

---

## SCHRITT 7: BILDKONZEPT-VORSCHLAG

concept: Nur ausfüllen wenn score <= 3.
1-2 Sätze: Was wäre das ideale Bild für diesen Titel?
Konkretes Motiv beschreiben, keine Design-Theorie.
Bei score >= 4: "" (leer)

---

## AUSGABE

Antworte NUR als JSON. Kein Text. Kein Markdown.

{
  "score": <1-5>,
  "styleAge": <"zeitgemäß"|"veraltet"|"überladen"|"neutral">,
  "elementCount": <Zahl>,
  "overloaded": <true|false>,
  "textIssue": <"wiederholt Titel"|"zu lang"|"kein Mehrwert"|"">,
  "contrast": <"Hell/Dunkel"|"Komplementärfarben"|"Sättigung"|"Keiner">,
  "colorDominant": <true|false>,
  "colorHarmony": <"harmonisch"|"neutral"|"chaotisch">,
  "colorImpact": <"stark"|"mittel"|"schwach">,
  "branding": <true|false>,
  "reason": "<1 Satz Deutsch, max 15 Wörter, was den Score begründet>",
  "strong": "<Was gut funktioniert, 1 Satz — leer wenn score <= 2>",
  "weak": "<Was fehlt, 1 Satz — leer wenn score = 5>",
  "concept": "<Bildkonzept-Vorschlag wenn score <= 3, sonst leer>"
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
      styleAge: (parsed.styleAge === "zeitgemäß" || parsed.styleAge === "veraltet" || parsed.styleAge === "überladen") ? parsed.styleAge : "neutral",
      colorDominant: parsed.colorDominant ?? false,
      colorHarmony: (parsed.colorHarmony === "harmonisch" || parsed.colorHarmony === "chaotisch") ? parsed.colorHarmony : "neutral",
      colorImpact: (parsed.colorImpact === "stark" || parsed.colorImpact === "schwach") ? parsed.colorImpact : "mittel",
      branding: parsed.branding === true,
      reason: baseReason,
      strong: typeof parsed.strong === "string" ? parsed.strong : "",
      weak: typeof parsed.weak === "string" ? parsed.weak : "",
      concept: typeof parsed.concept === "string" ? parsed.concept : "",
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

  console.log(`title-analysis: received ${videos.length} videos`);
  const videoSubset = videos.slice(0, 5);
  console.log(`title-analysis: analyzing ${videoSubset.length} videos`);
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
