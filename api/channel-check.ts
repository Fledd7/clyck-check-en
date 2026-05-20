import type { VercelRequest, VercelResponse } from "@vercel/node";

type ChannelData = {
  title?: string;
  handle?: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  uploadCadenceDays?: number | null;
  medianViews?: number | null;
  thumbnails?: string[];
};

type Ok = { ok: true; data: ChannelData };
type Fail = { ok: false; reason: "missing_key" | "not_found" | "error" | "bad_request" };

const YT = "https://www.googleapis.com/youtube/v3";

function parseInput(input: string): { type: "id" | "handle" | "search"; value: string } {
  const raw = (input || "").trim();
  if (!raw) return { type: "search", value: "" };

  if (/^UC[A-Za-z0-9_-]{20,}$/.test(raw)) return { type: "id", value: raw };

  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (url.hostname.includes("youtube") || url.hostname.includes("youtu.be")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const first = parts[0] ?? "";
      if (first.startsWith("@")) return { type: "handle", value: first.slice(1) };
      if (first === "channel" && parts[1]) return { type: "id", value: parts[1] };
      if (first === "c" && parts[1]) return { type: "search", value: parts[1] };
      if (first === "user" && parts[1]) return { type: "search", value: parts[1] };
      if (first) return { type: "search", value: first };
    }
  } catch {
    // fall through
  }

  if (raw.startsWith("@")) return { type: "handle", value: raw.slice(1) };
  return { type: "search", value: raw };
}

async function resolveChannelId(
  apiKey: string,
  parsed: ReturnType<typeof parseInput>
): Promise<string | null> {
  if (parsed.type === "id") return parsed.value;

  if (parsed.type === "handle") {
    const url = `${YT}/channels?part=id&forHandle=@${encodeURIComponent(parsed.value)}&key=${apiKey}`;
    const r = await fetch(url);
    if (r.ok) {
      const j = (await r.json()) as { items?: Array<{ id: string }> };
      if (j.items && j.items.length > 0) return j.items[0].id;
    }
  }

  const url = `${YT}/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(
    parsed.value
  )}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as {
    items?: Array<{ snippet?: { channelId?: string } }>;
  };
  return j.items?.[0]?.snippet?.channelId ?? null;
}

type YtChannel = {
  id: string;
  snippet?: { title?: string; customUrl?: string };
  statistics?: { subscriberCount?: string; videoCount?: string; hiddenSubscriberCount?: boolean };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
};

type YtPlaylistItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: { videoId?: string };
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
  contentDetails?: { videoId?: string };
};

type YtVideo = {
  id: string;
  statistics?: { viewCount?: string };
};

async function fetchChannel(apiKey: string, channelId: string): Promise<YtChannel | null> {
  const url = `${YT}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as { items?: YtChannel[] };
  return j.items?.[0] ?? null;
}

async function fetchRecentUploads(
  apiKey: string,
  uploadsPlaylistId: string
): Promise<YtPlaylistItem[]> {
  const url = `${YT}/playlistItems?part=snippet,contentDetails&maxResults=12&playlistId=${uploadsPlaylistId}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = (await r.json()) as { items?: YtPlaylistItem[] };
  return j.items ?? [];
}

async function fetchVideoStats(apiKey: string, ids: string[]): Promise<YtVideo[]> {
  if (ids.length === 0) return [];
  const url = `${YT}/videos?part=statistics&id=${ids.join(",")}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = (await r.json()) as { items?: YtVideo[] };
  return j.items ?? [];
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function pickThumb(t: YtPlaylistItem): string | null {
  const th = t.snippet?.thumbnails ?? {};
  return th.maxres?.url ?? th.standard?.url ?? th.high?.url ?? th.medium?.url ?? th.default?.url ?? null;
}

function uploadCadenceDays(items: YtPlaylistItem[]): number | null {
  const dates = items
    .map((i) => i.snippet?.publishedAt)
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a);
  if (dates.length < 2) return null;
  const diffs: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    diffs.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
  }
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.round(avg);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, reason: "bad_request" } as Fail);
    return;
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    res.status(200).json({ ok: false, reason: "missing_key" } as Fail);
    return;
  }

  let body: { query?: string } = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body as { query?: string });
  } catch {
    res.status(400).json({ ok: false, reason: "bad_request" } as Fail);
    return;
  }
  const query = (body?.query ?? "").toString().trim();
  if (!query) {
    res.status(400).json({ ok: false, reason: "bad_request" } as Fail);
    return;
  }

  try {
    const parsed = parseInput(query);
    const channelId = await resolveChannelId(apiKey, parsed);
    if (!channelId) {
      res.status(200).json({ ok: false, reason: "not_found" } as Fail);
      return;
    }
    const channel = await fetchChannel(apiKey, channelId);
    if (!channel) {
      res.status(200).json({ ok: false, reason: "not_found" } as Fail);
      return;
    }

    const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
    const recents = uploadsId ? await fetchRecentUploads(apiKey, uploadsId) : [];
    const videoIds = recents
      .map((i) => i.contentDetails?.videoId ?? i.snippet?.resourceId?.videoId)
      .filter((v): v is string => !!v);
    const stats = await fetchVideoStats(apiKey, videoIds.slice(0, 12));
    const views = stats
      .map((s) => Number(s.statistics?.viewCount ?? 0))
      .filter((n) => Number.isFinite(n) && n > 0);
    const thumbnails = recents
      .map((r) => pickThumb(r))
      .filter((u): u is string => !!u);

    const handle = channel.snippet?.customUrl
      ? channel.snippet.customUrl.replace(/^@/, "")
      : undefined;

    const subs =
      channel.statistics?.hiddenSubscriberCount === true
        ? null
        : channel.statistics?.subscriberCount
        ? Number(channel.statistics.subscriberCount)
        : null;

    const videoCount = channel.statistics?.videoCount ? Number(channel.statistics.videoCount) : null;

    const data: ChannelData = {
      title: channel.snippet?.title,
      handle,
      subscriberCount: subs,
      videoCount,
      uploadCadenceDays: uploadCadenceDays(recents),
      medianViews: median(views),
      thumbnails,
    };

    res.status(200).json({ ok: true, data } as Ok);
  } catch {
    res.status(200).json({ ok: false, reason: "error" } as Fail);
  }
}
