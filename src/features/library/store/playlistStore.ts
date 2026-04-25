import { create } from "zustand";
import type { Playlist } from "../../../shared/types/music";
import { deletePlaylistById, listPlaylists, putPlaylist } from "./libraryDb";

interface PlaylistState {
  playlists: Playlist[];
  selectedPlaylistId?: string;
  isLoading: boolean;
  error?: string;
  loadPlaylists: () => Promise<void>;
  selectPlaylist: (id?: string) => void;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  moveTrackInPlaylist: (playlistId: string, fromIndex: number, toIndex: number) => Promise<void>;
  pruneMissingTracks: (playlistId: string, validTrackIds: Set<string>) => Promise<void>;
}

function sortPlaylists(playlists: Playlist[]): Playlist[] {
  return [...playlists].sort((a, b) => a.name.localeCompare(b.name));
}

export function appendTrackIdUnique(trackIds: string[], trackId: string): string[] {
  if (trackIds.includes(trackId)) return trackIds;
  return [...trackIds, trackId];
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  selectedPlaylistId: undefined,
  isLoading: false,
  async loadPlaylists() {
    set({ isLoading: true, error: undefined });
    try {
      const playlists = await listPlaylists();
      set({ playlists: sortPlaylists(playlists), isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: `Failed to load playlists: ${String(error)}` });
    }
  },
  selectPlaylist(id) {
    set({ selectedPlaylistId: id });
  },
  async createPlaylist(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
      trackIds: [],
    };
    await putPlaylist(playlist);
    set((state) => ({
      playlists: sortPlaylists([...state.playlists, playlist]),
      selectedPlaylistId: playlist.id,
    }));
  },
  async renamePlaylist(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const playlist = get().playlists.find((p) => p.id === id);
    if (!playlist) return;
    const next: Playlist = { ...playlist, name: trimmed };
    await putPlaylist(next);
    set((state) => ({
      playlists: sortPlaylists(state.playlists.map((p) => (p.id === id ? next : p))),
    }));
  },
  async deletePlaylist(id) {
    await deletePlaylistById(id);
    set((state) => ({
      playlists: state.playlists.filter((p) => p.id !== id),
      selectedPlaylistId: state.selectedPlaylistId === id ? undefined : state.selectedPlaylistId,
    }));
  },
  async addTrackToPlaylist(playlistId, trackId) {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const next: Playlist = { ...playlist, trackIds: appendTrackIdUnique(playlist.trackIds, trackId) };
    await putPlaylist(next);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? next : p)),
    }));
  },
  async removeTrackFromPlaylist(playlistId, trackId) {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const next: Playlist = { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) };
    await putPlaylist(next);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? next : p)),
    }));
  },
  async moveTrackInPlaylist(playlistId, fromIndex, toIndex) {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const ids = [...playlist.trackIds];
    if (fromIndex < 0 || fromIndex >= ids.length || toIndex < 0 || toIndex >= ids.length) return;
    const [removed] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, removed);
    const next: Playlist = { ...playlist, trackIds: ids };
    await putPlaylist(next);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? next : p)),
    }));
  },
  async pruneMissingTracks(playlistId, validTrackIds) {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const nextIds = playlist.trackIds.filter((id) => validTrackIds.has(id));
    if (nextIds.length === playlist.trackIds.length) return;
    const next: Playlist = { ...playlist, trackIds: nextIds };
    await putPlaylist(next);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? next : p)),
    }));
  },
}));
