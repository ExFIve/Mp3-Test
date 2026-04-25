import { parseMp3File } from "../../metadata/services/id3Parser";
import type { TrackWithFile } from "../../../shared/types/music";

export function isMp3File(file: File): boolean {
  return file.type.includes("mpeg") || file.name.toLowerCase().endsWith(".mp3");
}

export async function parseMp3Files(files: File[]): Promise<TrackWithFile[]> {
  const mp3s = files.filter(isMp3File);
  if (mp3s.length === 0) return [];
  return Promise.all(mp3s.map((file) => parseMp3File(file)));
}
