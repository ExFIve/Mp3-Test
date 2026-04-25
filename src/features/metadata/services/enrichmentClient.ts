import type { EnrichedMetadata, MetadataSearchResult, Track } from "../../../shared/types/music";

const CACHE_PREFIX = "metadata-enrichment:";
const TTL_MS = 1000 * 60 * 60 * 24;

interface ItunesResult {
  artistName?: string;
  collectionName?: string;
  trackName?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackViewUrl?: string;
}

interface ItunesResponse {
  results: ItunesResult[];
}

function cacheKey(query: string): string {
  return `${CACHE_PREFIX}${query.toLowerCase()}`;
}

function readCached(query: string): EnrichedMetadata | null {
  const raw = localStorage.getItem(cacheKey(query));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EnrichedMetadata & { _cachedAt?: number };
    if (!parsed._cachedAt || Date.now() - parsed._cachedAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCached(value: EnrichedMetadata): void {
  localStorage.setItem(cacheKey(value.query), JSON.stringify({ ...value, _cachedAt: Date.now() }));
}

function mapItunesToResults(items: ItunesResult[], source: string): MetadataSearchResult[] {
  return items.slice(0, 5).map((item) => {
    const title = item.trackName || item.collectionName || item.artistName || "Unknown";
    const desc = [
      item.artistName ? `Artist: ${item.artistName}` : "",
      item.collectionName ? `Album: ${item.collectionName}` : "",
      item.primaryGenreName ? `Genre: ${item.primaryGenreName}` : "",
      item.releaseDate ? `Release: ${item.releaseDate.slice(0, 10)}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      title,
      description: desc || "No extra details available.",
      url: item.trackViewUrl,
      source,
    };
  });
}

async function searchItunes(term: string, entity: "song" | "album" | "musicArtist"): Promise<MetadataSearchResult[]> {
  const params = new URLSearchParams({
    term,
    entity,
    limit: "8",
  });
  const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
  if (!response.ok) throw new Error(`iTunes search failed: ${response.status}`);
  const data = (await response.json()) as ItunesResponse;
  return mapItunesToResults(data.results, "iTunes");
}

export async function enrichTrackMetadata(track: Track): Promise<EnrichedMetadata> {
  const query = `${track.title} ${track.artist} ${track.album}`.trim();
  const cached = readCached(query);
  if (cached) return cached;

  const [artist, album, song] = await Promise.all([
    searchItunes(track.artist, "musicArtist").catch(() => []),
    searchItunes(`${track.artist} ${track.album}`, "album").catch(() => []),
    searchItunes(`${track.artist} ${track.title}`, "song").catch(() => []),
  ]);

  const value: EnrichedMetadata = {
    query,
    generatedAt: new Date().toISOString(),
    artist,
    album,
    song,
  };

  saveCached(value);
  return value;
}
