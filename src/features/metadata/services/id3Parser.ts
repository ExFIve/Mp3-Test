import jsmediatags from "jsmediatags";
import type { TrackWithFile } from "../../../shared/types/music";

type Tags = Record<string, unknown>;

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  const hex = Array.from(bytes)
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex;
}

function toDataUrl(picture: unknown): string | undefined {
  const pic = picture as { data?: number[]; format?: string } | undefined;
  if (!pic?.data?.length || !pic.format) return undefined;
  const byteArray = new Uint8Array(pic.data);
  let binary = "";
  byteArray.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return `data:${pic.format};base64,${btoa(binary)}`;
}

function parseTags(file: File): Promise<Tags> {
  return new Promise((resolve, reject) => {
    jsmediatags.read(file, {
      onSuccess: (tag) => resolve((tag.tags as Tags) ?? {}),
      onError: (error) => reject(error),
    });
  });
}

async function getDuration(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const audio = document.createElement("audio");
    audio.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener("loadedmetadata", () => resolve(), { once: true });
      audio.addEventListener("error", () => reject(new Error("Could not load audio metadata")), {
        once: true,
      });
    });
    return Number.isFinite(audio.duration) ? audio.duration : 0;
  } catch {
    return 0;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function parseMp3File(file: File): Promise<TrackWithFile> {
  const tags = await parseTags(file).catch(() => ({} as Tags));
  const contentHash = await hashFile(file);
  const durationSec = await getDuration(file);

  const artist = String(tags.artist ?? "Unknown Artist");
  const album = String(tags.album ?? "Unknown Album");
  const title = String(tags.title ?? file.name.replace(/\.mp3$/i, ""));
  const trackNumber = tags.track ? String(tags.track) : undefined;
  const year = tags.year ? String(tags.year) : undefined;
  const genre = tags.genre ? String(tags.genre) : undefined;
  const coverArtDataUrl = toDataUrl(tags.picture);

  return {
    id: `${contentHash}-${file.size}`,
    fileName: file.name,
    title,
    artist,
    album,
    trackNumber,
    year,
    genre,
    durationSec,
    fileSize: file.size,
    fileType: file.type || "audio/mpeg",
    addedAt: new Date().toISOString(),
    coverArtDataUrl,
    file,
  };
}
