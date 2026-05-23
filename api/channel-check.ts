import type { VercelRequest, VercelResponse } from "@vercel/node";

type VideoItem = {
  id: string;
  title: string;
  thumbnail: string;
  duration?: string;
  views: number;
  publishedAt: string;
};

type ChannelData = {
  title?: string;
  handle?: string;
  subscriberCount?: number | null;
  videoCount?: number | null;
  uploadCadenceDays?: number | null;
  medianViews?: number | null;
  thumbnails?: string[];
  longformCount?: number;
  videos?: VideoItem[];
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

type YtVideoDetails = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
  contentDetails?: { duration?: string };
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
  const url = `${YT}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploadsPlaylistId}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = (await r.json()) as { items?: YtPlaylistItem[] };
  return j.items ?? [];
}

async function fetchVideoDetails(apiKey: string, ids: string[]): Promise<YtVideoDetails[]> {
  if (ids.length === 0) return [];
  // YouTube allows up to 50 ids per request
  const url = `${YT}/videos?part=snippet,contentDetails,statistics&id=${ids.slice(0, 50).join(",")}&key=${apiKey}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = (await r.json()) as { items?: YtVideoDetails[] };
  return j.items ?? [];
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
}

function pickThumbFromVideo(v: YtVideoDetails): string | null {
  const th = v.snippet?.thumbnails ?? {};
  return th.maxres?.url ?? th.standard?.url ?? th.high?.url ?? th.medium?.url ?? th.default?.url ?? null;
}

function parseDurationSeconds(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return null;
  const days = Number(m[1] ?? 0);
  const hours = Number(m[2] ?? 0);
  const minutes = Number(m[3] ?? 0);
  const seconds = Number(m[4] ?? 0);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

const SHORT_TAGS_TITLE = ["#shorts", "#short", "#reels", "#reel"];
const SHORT_TAGS_DESC = ["#shorts", "#short"];

function isLongform(v: YtVideoDetails): boolean {
  const dur = parseDurationSeconds(v.contentDetails?.duration);
  if (dur === null || dur <= 180) return false;
  const title = (v.snippet?.title ?? "").toLowerCase();
  if (SHORT_TAGS_TITLE.some((t) => title.includes(t))) return false;
  const desc = (v.snippet?.description ?? "").slice(0, 200).toLowerCase();
  if (SHORT_TAGS_DESC.some((t) => desc.includes(t))) return false;
  return true;
}

function medianCadenceDays(items: YtVideoDetails[]): number | null {
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
  const m = median(diffs);
  return m === null ? null : Math.round(m);
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

    const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
    const recents = uploadsId ? await fetchRecentUploads(apiKey, uploadsId) : [];
    const videoIds = recents
      .map((i) => i.contentDetails?.videoId ?? i.snippet?.resourceId?.videoId)
      .filter((v): v is string => !!v);

    const details = await fetchVideoDetails(apiKey, videoIds);

    const detailById = new Map(details.map((d) => [d.id, d]));
    const orderedDetails: YtVideoDetails[] = videoIds
      .map((id) => detailById.get(id))
      .filter((d): d is YtVideoDetails => !!d);

    const longforms = orderedDetails.filter(isLongform).slice(0, 12);

    const videos: VideoItem[] = longforms
      .map((v): VideoItem | null => {
        const thumb = pickThumbFromVideo(v);
        if (!thumb) return null;
        return {
          id: v.id,
          title: v.snippet?.title ?? "",
          thumbnail: thumb,
          duration: v.contentDetails?.duration,
          views: Number(v.statistics?.viewCount ?? 0),
          publishedAt: v.snippet?.publishedAt ?? "",
        };
      })
      .filter((v): v is VideoItem => !!v);

    const thumbnails = videos.map((v) => v.thumbnail);
    const views = videos.map((v) => v.views).filter((n) => Number.isFinite(n) && n > 0);

    const data: ChannelData = {
      title: channel.snippet?.title,
      handle,
      subscriberCount: subs,
      videoCount,
      uploadCadenceDays: medianCadenceDays(longforms),
      medianViews: median(views),
      thumbnails,
      longformCount: longforms.length,
      videos,
    };

    res.status(200).json({ ok: true, data } as Ok);
  } catch {
    res.status(200).json({ ok: false, reason: "error" } as Fail);
  }
}
