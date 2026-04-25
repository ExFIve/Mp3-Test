import { create } from "zustand";
import type { AlbumSummary, ArtistSummary, Track, TrackWithFile } from "../../../shared/types/music";
import { listTracks, upsertTracks } from "./libraryDb";

export interface LibraryState {
  tracks: Track[];
  fileByTrackId: Record<string, File>;
  searchText: string;
  isLoading: boolean;
  error?: string;
  loadTracks: () => Promise<void>;
  addImportedTracks: (tracks: TrackWithFile[]) => Promise<void>;
  setSearchText: (value: string) => void;
}

function sortTracks(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => a.title.localeCompare(b.title));
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  fileByTrackId: {},
  searchText: "",
  isLoading: false,
  async loadTracks() {
    set({ isLoading: true, error: undefined });
    try {
      const tracks = await listTracks();
      set({ tracks: sortTracks(tracks), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: `Failed to load tracks: ${String(error)}` });
    }
  },
  async addImportedTracks(importedTracks) {
    const { fileByTrackId, tracks } = get();
    const persistentTracks = importedTracks.map(({ file, ...track }) => track);
    await upsertTracks(persistentTracks);

    const mergedFiles = { ...fileByTrackId };
    importedTracks.forEach((track) => {
      mergedFiles[track.id] = track.file;
    });

    const mergedTracks = new Map<string, Track>();
    tracks.forEach((track) => mergedTracks.set(track.id, track));
    persistentTracks.forEach((track) => mergedTracks.set(track.id, track));

    set({
      tracks: sortTracks(Array.from(mergedTracks.values())),
      fileByTrackId: mergedFiles,
    });
  },
  setSearchText(value) {
    set({ searchText: value });
  },
}));

export function selectFilteredTracks(state: LibraryState): Track[] {
  const query = state.searchText.trim().toLowerCase();
  if (!query) return state.tracks;
  return state.tracks.filter((track) =>
    `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(query),
  );
}

export function buildArtistSummaries(tracks: Track[]): ArtistSummary[] {
  const map = new Map<string, ArtistSummary>();
  tracks.forEach((track) => {
    if (!map.has(track.artist)) {
      map.set(track.artist, { name: track.artist, trackCount: 0, albums: [] });
    }
    const value = map.get(track.artist)!;
    value.trackCount += 1;
    if (!value.albums.includes(track.album)) value.albums.push(track.album);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAlbumSummaries(tracks: Track[]): AlbumSummary[] {
  const map = new Map<string, AlbumSummary>();
  tracks.forEach((track) => {
    const key = `${track.artist}::${track.album}`;
    if (!map.has(key)) {
      map.set(key, { artist: track.artist, album: track.album, trackCount: 0 });
    }
    map.get(key)!.trackCount += 1;
  });
  return Array.from(map.values()).sort((a, b) => a.album.localeCompare(b.album));
}
