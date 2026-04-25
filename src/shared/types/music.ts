export type RepeatMode = "off" | "one" | "all";

export interface Track {
  id: string;
  fileName: string;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: string;
  trackNumber?: string;
  durationSec: number;
  fileSize: number;
  fileType: string;
  addedAt: string;
  coverArtDataUrl?: string;
}

export interface TrackWithFile extends Track {
  file: File;
}

export interface ArtistSummary {
  name: string;
  trackCount: number;
  albums: string[];
}

export interface AlbumSummary {
  artist: string;
  album: string;
  trackCount: number;
}

export interface MetadataSearchResult {
  title: string;
  description: string;
  url?: string;
  source: string;
}

export interface EnrichedMetadata {
  query: string;
  generatedAt: string;
  artist: MetadataSearchResult[];
  album: MetadataSearchResult[];
  song: MetadataSearchResult[];
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: string;
  /** Track IDs in playback order */
  trackIds: string[];
}
