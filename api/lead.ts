import type { VercelRequest, VercelResponse } from "@vercel/node";

type LeadClass = "top" | "good" | "mid" | "weak";
type DiagnosisLevel = "niedrig" | "mittel" | "hoch";
type TitleAnalysisScore = 1 | 2 | 3 | 4 | 5;

type ChannelData = {
  title?: string;
  handle?: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  uploadCadenceDays?: number | null;
  medianViews?: number | null;
  thumbnails?: string[];
  longformCount?: number;
  channelUrl?: string;
};

type TitleAnalysisItem = {
  id: string;
  title: string;
  score: TitleAnalysisScore;
  label: string;
  reason: string;
  strong: string;
  weak: string;
};
type InsightOrLever = { headline: string; text?: string };
type AnswerValue = string | string[] | undefined;
type Answers = Record<string, AnswerValue>;

type Body = {
  name?: string;
  email?: string;
  message?: string;
  consent?: boolean;
  answers?: Answers;
  channelUrl?: string;
  channelData?: ChannelData | null;
  titleAnalysis?: TitleAnalysisItem[] | null;
  result?: {
    categoryId?: string;
    categoryHeadline?: string;
    categoryText?: string;
    score?: number;
    leadClass?: LeadClass;
    scoreBreakdown?: {
      channelStrength?: number;
      uploadConsistency?: number;
      analysisQuality?: number;
      penalties?: number;
    };
    insights?: InsightOrLever[];
    levers?: InsightOrLever[];
    diagnosis?: {
      direction?: DiagnosisLevel;
      system?: DiagnosisLevel;
      cadence?: DiagnosisLevel;
    };
  };
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const questionLabels: Record<string, string> = {
  status: "Status",
  goal: "Ziel",
  problem: "Problem",
  thumbnails: "Thumbnails",
  support: "Gewünschte Unterstützung",
};

const optionLabels: Record<string, string> = {
  regelmaessig: "Ich veröffentliche regelmäßig",
  unregelmaessig: "Ich veröffentliche, aber unregelmäßig",
  kaum_aktiv: "Kanal ist da, aber kaum aktiv",
  plant_start: "Ich plane gerade den Start",
  kundenanfragen: "Mehr Kundenanfragen",
  expertenstatus: "Expertenstatus aufbauen",
  reichweite: "Reichweite / Bekanntheit",
  community: "Community aufbauen",
  monetarisieren: "Inhalte monetarisieren",
  unklar: "Noch nicht ganz klar",
  wenig_klicks: "Zu wenig Klicks",
  unprofessionell: "Ich bin mit meinen Thumbnails nicht zufrieden",
  uneinheitlich: "Mir fehlt ein roter Faden im Look meines Kanals",
  kein_thumbnail_konzept: "Ich weiß oft nicht, was aufs Thumbnail soll",
  titel_thumbnail_mismatch: "Titel und Thumbnail passen nicht richtig zusammen",
  ideen_visualisieren: "Meine Themen sind schwer in ein Bild zu übersetzen",
  keine_richtung: "Ich bin noch dabei, meine Kanalrichtung zu finden",
  einheitlich: "Ich habe einen klaren, konsistenten Stil",
  teilweise_gut: "Teilweise gut, aber ohne klares System dahinter",
  sehr_unterschiedlich: "Jedes Thumbnail sieht anders aus",
  schnell_gebaut: "Ich erstelle sie schnell, ohne festes Konzept",
  keine_eigenen: "Ich habe noch keine eigenen Thumbnails",
  unsicher: "Ich weiß nicht, wie ich sie einordnen soll",
  system: "Ein klares Thumbnail-System für meinen Kanal",
  strategie: "Strategie für Ideen, Titel & Thumbnails",
  audit: "Ein Audit meines aktuellen Kanals",
  retainer: "Laufende Betreuung pro Monat",
};

const leadClassLabel: Record<LeadClass, string> = {
  top: "Top-Lead",
  good: "Guter Lead",
  mid: "Mittlerer Lead",
  weak: "Schwacher Lead",
};

const diagLabel: Record<DiagnosisLevel, string> = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
};

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lineBlock(label: string, value: string): string {
  return `<p style="margin:2px 0"><strong>${escape(label)}:</strong> ${escape(value)}</p>`;
}

function renderAnswerValue(v: AnswerValue): string {
  if (Array.isArray(v)) return v.map((x) => optionLabels[x] ?? x).join(", ");
  return optionLabels[v ?? ""] ?? v ?? "—";
}

function buildInternalHtml(body: Required<Pick<Body, "name" | "email">> & Body): string {
  const lc: LeadClass = body.result?.leadClass ?? "mid";
  const score = body.result?.score ?? 0;
  const cat = body.result?.categoryId ?? "?";
  const a = body.answers ?? {};
  const ch = body.channelData ?? null;
  const insights = body.result?.insights ?? [];
  const levers = body.result?.levers ?? [];
  const diag = body.result?.diagnosis;
  const ta = body.titleAnalysis ?? null;

  const answerLines = Object.entries(questionLabels)
    .map(([k, label]) => lineBlock(label, renderAnswerValue(a[k])))
    .join("");

  const channelLines: string[] = [];
  if (body.channelUrl) channelLines.push(lineBlock("Kanal-URL", body.channelUrl));
  if (ch?.title) channelLines.push(lineBlock("Kanal", ch.title));
  if (ch?.handle) channelLines.push(lineBlock("Handle", "@" + ch.handle));
  if (typeof ch?.subscriberCount === "number")
    channelLines.push(lineBlock("Abonnenten", String(ch.subscriberCount)));
  if (typeof ch?.videoCount === "number")
    channelLines.push(lineBlock("Videos gesamt", String(ch.videoCount)));
  if (typeof ch?.longformCount === "number")
    channelLines.push(lineBlock("Longform Videos analysiert", String(ch.longformCount)));
  if (typeof ch?.medianViews === "number")
    channelLines.push(lineBlock("Median Views (Longform)", String(ch.medianViews)));
  if (typeof ch?.uploadCadenceDays === "number" && ch.uploadCadenceDays > 0)
    channelLines.push(lineBlock("Upload-Kadenz (Longform)", `${ch.uploadCadenceDays} Tage`));

  const titleAnalysisLines = ta && ta.length > 0
    ? (() => {
        const avg = ta.reduce((s, r) => s + r.score, 0) / ta.length;
        const header = `<p style="margin:12px 0 4px"><strong>Titel-Thumbnail-Fit (Gemini Vision)</strong></p>` +
          `<p style="margin:2px 0 8px;font-style:italic;color:#555">Ø ${avg.toFixed(1)} / 5</p>`;
        const rows = ta
          .map(
            (item) =>
              `<p style="margin:2px 0">[${item.score}/5 · ${escape(item.label)}] ${escape(item.title)}` +
              (item.reason ? ` — <span style="color:#666">${escape(item.reason)}</span>` : "") +
              `</p>` +
              (item.strong ? `<p style="margin:0 0 0 16px;color:#15803d;font-size:12px">✓ ${escape(item.strong)}</p>` : "") +
              (item.weak ? `<p style="margin:0 0 0 16px;color:#b91c1c;font-size:12px">✗ ${escape(item.weak)}</p>` : "")
          )
          .join("");
        return header + rows;
      })()
    : "";

  const insightLines = insights.length
    ? `<p style="margin:12px 0 4px"><strong>Generierte Insights</strong></p>` +
      insights.map((i) => `<p style="margin:2px 0">· ${escape(i.headline)}</p>`).join("")
    : "";

  const leverLines = levers.length
    ? `<p style="margin:12px 0 4px"><strong>Nächste 3 Hebel</strong></p>` +
      levers
        .map((l, idx) => `<p style="margin:2px 0">${idx + 1}. ${escape(l.headline)}</p>`)
        .join("")
    : "";

  const diagLines = diag
    ? `<p style="margin:12px 0 4px"><strong>Packaging-Diagnose</strong></p>` +
      lineBlock("Kanalrichtung", diagLabel[diag.direction ?? "mittel"]) +
      lineBlock("Thumbnail-System", diagLabel[diag.system ?? "mittel"]) +
      lineBlock("Upload-Rhythmus", diagLabel[diag.cadence ?? "mittel"])
    : "";

  const thumbsLine =
    ch?.thumbnails && ch.thumbnails.length > 0
      ? `<p style="margin:12px 0 4px"><strong>Thumbnail-URLs (Longform)</strong></p><p style="word-break:break-all;font-size:12px;color:#555">${ch.thumbnails
          .map((u) => escape(u))
          .join(", ")}</p>`
      : "";

  return `
  <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#111;max-width:680px">
    <h2 style="margin:0 0 8px">Neuer Clyck Check-Lead</h2>
    ${lineBlock("Name", body.name ?? "")}
    ${lineBlock("E-Mail", body.email ?? "")}
    ${lineBlock("Clyck-Score", `${score} / 100`)}
    ${lineBlock("Lead-Klasse", leadClassLabel[lc])}
    ${body.result?.scoreBreakdown ? `
    ${lineBlock("Kanal-Stärke", `${body.result.scoreBreakdown.channelStrength} / 40`)}
    ${lineBlock("Upload-Konsistenz", `${body.result.scoreBreakdown.uploadConsistency} / 20`)}
    ${lineBlock("Analyse-Qualität", `${body.result.scoreBreakdown.analysisQuality} / 40`)}
    ${lineBlock("Abzüge", String(body.result.scoreBreakdown.penalties))}
    ` : ""}
    ${lineBlock("Ergebnis-Kategorie", `Kategorie ${String(cat)}`)}
    ${
      body.message
        ? `<p style="margin:12px 0 4px"><strong>Nachricht</strong></p><p style="white-space:pre-wrap;margin:0">${escape(body.message)}</p>`
        : ""
    }
    <p style="margin:16px 0 4px"><strong>Antworten</strong></p>
    ${answerLines}
    ${channelLines.length ? `<p style="margin:16px 0 4px"><strong>Kanaldaten</strong></p>${channelLines.join("")}` : ""}
    ${titleAnalysisLines}
    ${diagLines}
    ${insightLines}
    ${leverLines}
    ${thumbsLine}
  </div>
  `;
}

function buildUserHtml(
  name: string,
  categoryHeadline: string,
  categoryText: string,
  levers: InsightOrLever[]
): string {
  const leverItems = levers
    .map(
      (l, i) =>
        `<p style="margin:4px 0"><strong>${i + 1}. ${escape(l.headline)}</strong>${
          l.text ? ` — ${escape(l.text)}` : ""
        }</p>`
    )
    .join("");

  return `
  <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#111;max-width:600px">
    <p>Hallo ${escape(name)},</p>
    <p>danke für deinen Clyck Check. Hier ist deine erste Einschätzung:</p>
    <h2 style="margin:24px 0 8px">DEIN ERGEBNIS</h2>
    <p><strong>${escape(categoryHeadline)}</strong></p>
    <p>${escape(categoryText)}</p>
    ${
      leverItems
        ? `<h2 style="margin:24px 0 8px">DEINE NÄCHSTEN 3 HEBEL</h2>${leverItems}`
        : ""
    }
    <p style="margin-top:24px">
      Ich schaue mir deine Angaben persönlich an und melde mich mit einer konkreteren Einschätzung.
    </p>
    <hr style="margin:32px 0;border:none;border-top:1px solid #e6e2da" />
    <p style="font-size:12px;color:#888">
      Diese E-Mail wurde automatisch nach deinem Clyck Check versendet.
    </p>
  </div>
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "bad_request" });
    return;
  }

  let body: Body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body as Body);
  } catch {
    res.status(400).json({ ok: false, reason: "bad_request" });
    return;
  }

  const name = (body.name ?? "").toString().trim();
  const email = (body.email ?? "").toString().trim();
  if (name.length < 2 || !emailRegex.test(email) || body.consent !== true) {
    res.status(400).json({ ok: false, reason: "invalid_input" });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!resendKey || !to || !from) {
    res.status(200).json({ ok: false, reason: "missing_config" });
    return;
  }

  const lc = body.result?.leadClass ?? "mid";
  const categoryId = body.result?.categoryId ?? "?";
  const subject = `Clyck Check · ${leadClassLabel[lc as LeadClass] ?? "Lead"} · Kategorie ${categoryId} · ${name}`;
  const internalHtml = buildInternalHtml({ ...body, name, email });

  // Send internal lead email
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, html: internalHtml }),
    });
    if (!r.ok) {
      res.status(200).json({ ok: false, reason: "send_failed" });
      return;
    }
  } catch {
    res.status(200).json({ ok: false, reason: "send_failed" });
    return;
  }

  // Send user confirmation email (best-effort — failures don't block the lead)
  try {
    const userHtml = buildUserHtml(
      name,
      body.result?.categoryHeadline ?? "",
      body.result?.categoryText ?? "",
      body.result?.levers ?? []
    );
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Dein Clyck Check — Erste Einschätzung",
        html: userHtml,
      }),
    });
  } catch {
    // Non-blocking: log but don't fail
    console.error("Failed to send user confirmation email");
  }

  res.status(200).json({ ok: true });
}
