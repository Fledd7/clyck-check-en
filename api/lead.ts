import type { VercelRequest, VercelResponse } from "@vercel/node";

type LeadClass = "top" | "good" | "mid" | "weak";

type ChannelData = {
  title?: string;
  handle?: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  uploadCadenceDays?: number | null;
  medianViews?: number | null;
  thumbnails?: string[];
  channelUrl?: string;
};

type Answers = Record<string, string | undefined>;

type Body = {
  name?: string;
  email?: string;
  message?: string;
  consent?: boolean;
  answers?: Answers;
  channelUrl?: string;
  channelData?: ChannelData | null;
  result?: {
    categoryId?: string;
    score?: number;
    leadClass?: LeadClass;
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
  unprofessionell: "Thumbnails wirken unprofessionell",
  uneinheitlich: "Kanal wirkt uneinheitlich",
  kein_thumbnail_konzept: "Ich weiß nicht, was aufs Thumbnail soll",
  titel_thumbnail_mismatch: "Titel und Thumbnail passen nicht zusammen",
  ideen_visualisieren: "Meine Ideen sind schwer visuell darzustellen",
  keine_richtung: "Keine klare Richtung",
  einheitlich: "Einheitlich und professionell",
  teilweise_gut: "Teilweise gut, aber ohne klares System",
  sehr_unterschiedlich: "Sehr unterschiedlich",
  schnell_gebaut: "Eher schnell zusammengebaut",
  keine_eigenen: "Noch keine eigenen",
  unsicher: "Bin unsicher",
  system: "Ein klares Thumbnail-System für meinen Kanal",
  strategie: "Strategie für Ideen, Titel & Thumbnails",
  audit: "Ein Audit meines aktuellen Kanals",
  retainer: "Laufende Betreuung pro Monat",
  einzelne: "Bessere einzelne Thumbnails",
};

const leadClassLabel: Record<LeadClass, string> = {
  top: "Top-Lead",
  good: "Guter Lead",
  mid: "Mittlerer Lead",
  weak: "Schwacher Lead",
};

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(body: Required<Pick<Body, "name" | "email">> & Body): string {
  const lc: LeadClass = body.result?.leadClass ?? "mid";
  const score = body.result?.score ?? 0;
  const cat = body.result?.categoryId ?? "?";
  const a = body.answers ?? {};
  const ch = body.channelData ?? null;

  const answerRows = Object.entries(questionLabels)
    .map(
      ([k, label]) =>
        `<tr><td style="padding:4px 8px;color:#666">${label}</td><td style="padding:4px 8px">${escape(
          optionLabels[a[k] ?? ""] ?? a[k] ?? "—"
        )}</td></tr>`
    )
    .join("");

  const channelBlock = ch
    ? `
    <h3 style="margin-top:24px">Kanal</h3>
    <ul>
      ${ch.title ? `<li>Titel: ${escape(ch.title)}</li>` : ""}
      ${ch.handle ? `<li>Handle: @${escape(ch.handle)}</li>` : ""}
      ${typeof ch.subscriberCount === "number" ? `<li>Abos: ${ch.subscriberCount}</li>` : ""}
      ${typeof ch.videoCount === "number" ? `<li>Videos: ${ch.videoCount}</li>` : ""}
      ${typeof ch.uploadCadenceDays === "number" ? `<li>Upload-Cadenz: ~${ch.uploadCadenceDays} Tage</li>` : ""}
      ${typeof ch.medianViews === "number" ? `<li>Median-Views: ${ch.medianViews}</li>` : ""}
      ${body.channelUrl ? `<li>URL: <a href="${escape(body.channelUrl)}">${escape(body.channelUrl)}</a></li>` : ""}
    </ul>
    ${
      ch.thumbnails && ch.thumbnails.length > 0
        ? `<p>Thumbnails:</p><div>${ch.thumbnails
            .slice(0, 12)
            .map((u) => `<img src="${escape(u)}" style="width:160px;height:auto;margin:2px;border-radius:4px" />`)
            .join("")}</div>`
        : ""
    }
  `
    : body.channelUrl
    ? `<p>Kanal-URL: <a href="${escape(body.channelUrl)}">${escape(body.channelUrl)}</a></p>`
    : "";

  return `
  <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#111;max-width:640px">
    <h2 style="margin:0 0 8px">Neuer Klarheitscheck-Lead</h2>
    <p style="margin:0 0 16px;color:#555">
      ${leadClassLabel[lc]} · Score ${score} · Kategorie ${escape(String(cat))}
    </p>
    <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
      <tr><td style="padding:4px 8px;color:#666">Name</td><td style="padding:4px 8px"><strong>${escape(body.name ?? "")}</strong></td></tr>
      <tr><td style="padding:4px 8px;color:#666">E-Mail</td><td style="padding:4px 8px"><a href="mailto:${escape(body.email ?? "")}">${escape(body.email ?? "")}</a></td></tr>
    </table>
    ${
      body.message
        ? `<h3>Nachricht</h3><p style="white-space:pre-wrap">${escape(body.message)}</p>`
        : ""
    }
    <h3>Antworten</h3>
    <table style="border-collapse:collapse">${answerRows}</table>
    ${channelBlock}
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
  const subject = `Klarheitscheck · ${leadClassLabel[lc as LeadClass] ?? "Lead"} · ${name}`;
  const html = buildHtml({ ...body, name, email });

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        html,
      }),
    });
    if (!r.ok) {
      res.status(200).json({ ok: false, reason: "send_failed" });
      return;
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: false, reason: "send_failed" });
  }
}
