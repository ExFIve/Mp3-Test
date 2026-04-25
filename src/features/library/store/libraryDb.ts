import Dexie, { type Table } from "dexie";
import type { Playlist, Track } from "../../../shared/types/music";

class LibraryDb extends Dexie {
  tracks!: Table<Track, string>;
  playlists!: Table<Playlist, string>;

  constructor() {
    super("local-mp3-library");
    this.version(1).stores({
      tracks: "id, title, artist, album, addedAt",
    });
    this.version(2).stores({
      tracks: "id, title, artist, album, addedAt",
      playlists: "id, name, createdAt",
    });
  }
}

export const libraryDb = new LibraryDb();

export async function upsertTracks(tracks: Track[]): Promise<number> {
  if (tracks.length === 0) return 0;
  await libraryDb.tracks.bulkPut(tracks);
  return tracks.length;
}

export async function listTracks(): Promise<Track[]> {
  return libraryDb.tracks.orderBy("title").toArray();
}

export async function listPlaylists(): Promise<Playlist[]> {
  return libraryDb.playlists.orderBy("name").toArray();
}

export async function putPlaylist(playlist: Playlist): Promise<void> {
  await libraryDb.playlists.put(playlist);
}

export async function deletePlaylistById(id: string): Promise<void> {
  await libraryDb.playlists.delete(id);
}
