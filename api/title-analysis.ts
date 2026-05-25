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

Zähle visuelle HAUPTGRUPPEN — nicht einzelne Objekte.
Alles was zusammengehört oder eine Einheit bildet
zählt als EIN Element.

ZÄHLREGELN (strikt einhalten):
- Alle Personen zusammen = 1 Element
  (1 Person, 2 Personen, Gruppe = immer 1 Element)
- Der gesamte Text im Bild = 1 Element
  (egal ob 1 Wort, 3 Textblöcke oder ein Banner)
- Alle Logos zusammen = 1 Element
- Ein dominantes Objekt = 1 Element
  (Auto, Produkt, Tier, Fahrzeug)
- Ein grafisches Element = 1 Element
  (Pfeil, Rahmen, Icon, Badge, Ortsangabe)
- Hintergrundszene oder Hintergrundlandschaft
  = kein eigenes Element, gehört zur Komposition

WICHTIG — Grenzfälle:
- Eine Ortsangabe oder Location-Badge ist Teil
  des grafischen Elements oder des Hintergrunds —
  kein separates Element
- Ein Skispringer im Hintergrund ist Teil der
  Hintergrundszene — kein separates Element
- Mehrere Objekte die thematisch zusammengehören
  (z.B. Ski + Skifahrer) = 1 Element

HINTERGRUNDSZENE-REGEL (wichtigste Regel):
Alles was im Hintergrund passiert zählt als
EIN Element "Hintergrundszene" — egal wie viel
darin vorkommt.

Beispiele:
- Person vorne + Wald mit Gruppe und Flaggen hinten
  = 2 Elemente (Person + Hintergrundszene)
- Person vorne + Stadtkulisse mit Menschen hinten
  = 2 Elemente
- Zwei Personen vorne + Bühne mit Publikum hinten
  = 2 Elemente (Personengruppe + Hintergrundszene)
- Person vorne + Hintergrundszene + Text
  = 3 Elemente

NUR wenn ein Objekt im Vordergrund prominent
platziert und klar vom Hintergrund getrennt ist,
zählt es als eigenes Element.

Im Zweifel: Hintergrunddetails gehören zur
Hintergrundszene und werden nicht separat gezählt.

BEISPIELE (korrekte Zählung):
Person + Hintergrundszene + Ortsangabe-Badge = 3 Elemente
Person + Text-Banner + Logo = 3 Elemente
Person + dynamische Hintergrundszene = 2 Elemente
Zwei Personen + Text + Pfeil = 3 Elemente
Person + Objekt + Text + Logo = 4 Elemente

Im Zweifel WENIGER zählen.
Setze overloaded: true NUR wenn elementCount >= 5
ODER die Komposition bei elementCount 4 wirklich
schwer auf einen Blick erfassbar ist.
Bei elementCount <= 3: overloaded immer false.

---

## Schritt 3: Text im Thumbnail bewerten

Zähle NUR bedeutungstragende Wörter.
NICHT zählen:
- Zahlen (10.000€, 100K etc.) = 1 Token, kein Wort
- Sonderzeichen, Emojis, Symbole
- Wörter unter 2 Buchstaben (€, &, /, %)
- Eigennamen von Orten/Marken als Logo-Teil

Beispiele korrekte Zählung:
"PADEL TURNIER" = 2 Wörter
"10.000€ PADEL TURNIER" = 2 Wörter (Zahl zählt nicht)
"Lohnt sich Leasing für privat?" = 5 Wörter
"SPEAKER BEI PORSCHE?" = 3 Wörter

PROBLEM: mehr als 5 bedeutungstragende Wörter
→ textIssue: "zu lang"

PROBLEM: Text wiederholt Videotitel sinngemäß
→ textIssue: "wiederholt Titel"

PROBLEM: Text ohne erkennbaren Klick-Mehrwert
→ textIssue: "kein Mehrwert"

KEIN PROBLEM: 5 oder weniger bedeutungstragende Wörter
die den Klick-Anreiz verstärken
→ textIssue: "" (leer)

WICHTIGE UNTERSCHEIDUNG bei textIssue:

"wiederholt Titel" NUR wenn der Text im Thumbnail
denselben Satz oder dieselbe Aussage wie der Titel
transportiert — nicht wenn er essenziellen Kontext
liefert den der Titel allein nicht hat.

KEIN Titel-Repeat (textIssue leer lassen):
- Ein Name (Person, Ort, Marke) der im Thumbnail
  eingekreist oder markiert wird: "XAVIER NAIDOO",
  "REGENSBURG", "PORSCHE" — das ist Kontext-Label,
  kein Titel-Repeat
- Schlüsselbegriffe die das Thumbnail ohne Titel
  nicht verständlich machen würden
- 1-2 Wörter die einen visuellen Anker setzen

TITEL-REPEAT (textIssue: "wiederholt Titel"):
- Wenn der komplette Satz des Titels im Bild steht
- Wenn der Text dieselbe Aussage wie der Titel macht
  ohne neuen visuellen Mehrwert zu liefern
- Wenn der Text ohne das Bild denselben Inhalt
  hätte wie der Titel allein

Beispiel KEIN Repeat:
Titel: "Xavier Naidoo zu konfrontieren war ein Fehler"
Text im Bild: "XAVIER NAIDOO" (als Label bei eingekreister Person)
→ textIssue: "" (essenzieller Kontext-Label)

Beispiel REPEAT:
Titel: "Ich war beim geheimen AfD Wandertag"
Text im Bild: "GEHEIMER AFD WANDERTAG"
→ textIssue: "wiederholt Titel"

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

## Schritt 5: Farbwirkung bewerten

Bewerte die Farbgestaltung des Thumbnails nach
drei Kriterien:

A) Dominante Farbe
Gibt es eine klar erkennbare Hauptfarbe die sofort
auffällt und das Thumbnail im Feed hervorhebt?
Ja / Nein

B) Farbharmonie
Wirken die verwendeten Farben zusammen harmonisch
oder chaotisch und unruhig?
- harmonisch: Farben ergänzen sich, klare Palette
- neutral: weder besonders harmonisch noch störend
- chaotisch: zu viele unverbundene Farben, unruhig

C) Feed-Auffälligkeit durch Farbe
Würde dieses Thumbnail durch seine Farbgebung
in einem grauen oder bunten YouTube-Feed
sofort auffallen?
- stark: klarer Farbakzent der heraussticht
- mittel: durchschnittlich auffällig
- schwach: geht im Feed unter

---

## Schritt 6: Ehrliche Stil-Einordnung

Ordne das Thumbnail einer von vier Kategorien zu.
Sei direkt — nicht diplomatisch.

"veraltet" — wenn MINDESTENS ZWEI dieser Signale zutreffen:
- Roter, gelber oder grüner Farbbalken mit weißer Schrift
  als dominantes Gestaltungselement
- Folienlayout: Text links oder rechts, Foto daneben,
  ohne echte Bildkomposition
- Mehr als 6 bedeutungstragende Wörter im Bild
- Das Thumbnail wirkt wie ein PowerPoint-Slide
- Clipart-artige Elemente oder Stockfoto-Stil
- Kein erkennbarer Compositing-Aufwand

"überladen" — wenn ALLE dieser Punkte zutreffen:
- Der Stil ist zeitgemäß: hochwertige Bildbearbeitung,
  modernes Composite, erkennbarer Designaufwand
- Aber: zu viele Elemente gleichzeitig —
  das Auge weiß nicht wo es zuerst hinschauen soll
- Oder: zu viel Text der die Komposition erdrückt
- Das Thumbnail hat Energie aber keine klare Hierarchie

"zeitgemäß" — wenn:
- Klare visuelle Hierarchie mit einem dominanten Motiv
- Wenig oder kein Text — das Bild trägt die Botschaft
- Hochwertige Bildsprache, modernes Composite
- Starke Emotion oder starke Situation im Vordergrund
- Der Blick wird sofort geführt

"neutral" — wenn kein eindeutiges Signal

WICHTIG:
"veraltet" und "überladen" sind verschiedene Probleme:
- veraltet = das Designkonzept ist überholt
- überladen = das Konzept ist modern, aber zu vollgepackt
Nie beides gleichzeitig vergeben.
Im Zweifel: "überladen" vor "veraltet" wählen wenn
erkennbarer moderner Designaufwand vorhanden ist.

---

## Moderne Thumbnail-Stile (nicht bestrafen)

Folgende Stile sind etablierte moderne Formate
die bewusst eingesetzt werden und NICHT als
"veraltet" oder "überladen" gewertet werden:

DEBATE/VERSUS-STIL:
- Titel oder Thema steht als Text oben/unten
- Darunter/daneben stehen die beteiligten Parteien
  als Personen oder Bilder
- Beispiel: "TIERSCHÜTZER VS 10 PRO ZOO" oben,
  darunter die Personen in Konfrontation
- Dieser Stil ist 2024–2025 weit verbreitet und
  zeitgemäß — styleAge: "zeitgemäß"
- Score-Abzug für Text nur wenn der Text den
  Titel komplett wiederholt, nicht bei klarem
  Versus/Debate-Format

EXPOSÉ/UNDERCOVER-STIL:
- Person im Vordergrund mit überraschtem/
  erschrockenem Ausdruck
- Im Hintergrund erkennbare Szene/Situation
  die der Titel beschreibt
- Zeitgemäß, hohe Klickstärke
- styleAge: "zeitgemäß"

EINKREIS/MARKIERUNGS-STIL:
- Eine bekannte Person wird eingekreist/markiert
  mit Namens-Label
- Hauptperson reagiert darauf im Vordergrund
- Zeitgemäß und effektiv
- styleAge: "zeitgemäß"

---

## Schritt 7: Titel-Thumbnail-Fit bewerten

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

## Schritt 8: Wiedererkennung prüfen

Zeigt das Thumbnail Elemente eines konsistenten Kanal-Stils?
Gemeint sind: wiederkehrendes Gesicht, Farbpalette, Schriftbild
oder ein wiederholbarer visueller Aufbau.

---

SCORE-KALIBRIERUNG:

Wenn das Thumbnail einem der bekannten modernen
Stile (Debate, Exposé, Einkreis) entspricht:
- Kein Abzug für Text der zum Stil gehört
- Kein overloaded: true wenn der Stil bewusst
  mehrere Elemente kombiniert
- Minimum-Score für zeitgemäßen Stil mit
  klarer Botschaft: 3/5
- Wenn Stil + Titel gut zusammenpassen: 4/5
- Perfekter Fit (5/5) nur wenn keinerlei
  Verbesserungspotenzial erkennbar

Für den AfD-Wandertag-Stil (Person flüchtend
vor Gruppe im Hintergrund):
→ 2-3 Elemente, zeitgemäß, starke Neugier
→ Score: mindestens 4/5

SCORE-REGELN (zwingend einhalten):
- Rotes/gelbes Textbanner als Hauptgestaltungselement
  → score maximal 3
- Text wiederholt den Videotitel sinngemäß
  → score maximal 3
- styleAge ist 'veraltet'
  → score maximal 3
- Mehrere dieser Probleme gleichzeitig
  → score maximal 2
- Score 5 ist nur möglich wenn:
  Kein Textproblem + zeitgemäßer Stil + kein Overloading

---

Antworte NUR als JSON. Kein Text davor oder danach. Kein Markdown.
{
  "score": <Zahl 1-5>,
  "format": "<eines der 7 Formate von oben>",
  "elementCount": <Zahl — Anzahl visueller Haupt-Elemente>,
  "overloaded": true | false,
  "textIssue": "<leer wenn kein Textproblem, sonst: 'zu lang' | 'wiederholt Titel' | 'kein Mehrwert'>",
  "contrast": "<'Hell/Dunkel' | 'Komplementärfarben' | 'Sättigung' | 'Keiner'>",
  "styleAge": "<'zeitgemäß' | 'veraltet' | 'überladen' | 'neutral'>",
  "colorDominant": true | false,
  "colorHarmony": "<'harmonisch' | 'neutral' | 'chaotisch'>",
  "colorImpact": "<'stark' | 'mittel' | 'schwach'>",
  "branding": true | false,
  "reason": "<1 Satz auf Deutsch, max. 15 Wörter, konkret und direkt — keine Fachbegriffe, keine englischen Wörter, kein 'könnte', 'wirkt etwas', 'hat gewisse Schwächen'>",
  "strong": "<Was gut funktioniert, 1 Satz auf Deutsch ohne Fachbegriffe — oder leerer String wenn score <= 2>",
  "weak": "<Was das Zusammenspiel schwächt, 1 Satz auf Deutsch ohne Fachbegriffe — oder leerer String wenn score = 5>",
  "concept": "<Konkrete Regieanweisung in 1–2 Sätzen auf Deutsch. Was wäre das ideale Bild für diesen Titel gewesen? Beschreibe Motiv, Emotion, Bildaufbau — kein Design-Jargon. Nur ausfüllen wenn score <= 3. Sonst leerer String.>"
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
