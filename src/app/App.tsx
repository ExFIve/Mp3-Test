import { useEffect, useMemo, useState } from "react";
import { FileImporter } from "../features/library/components/FileImporter";
import { PlaylistsPanel } from "../features/library/components/PlaylistsPanel";
import { buildAlbumSummaries, buildArtistSummaries, selectFilteredTracks, useLibraryStore } from "../features/library/store/libraryStore";
import { usePlaylistStore } from "../features/library/store/playlistStore";
import { PlayerBar } from "../features/player/components/PlayerBar";
import { usePlayerStore } from "../features/player/store/playerStore";
import { MetadataPanel } from "../features/search/components/MetadataPanel";
import { formatDuration } from "../shared/utils/time";
import "./App.css";

type ViewMode = "songs" | "artists" | "albums" | "playlists";

type QueueMode = "library" | "playlist";

export default function App(): JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>("songs");
  const [queueMode, setQueueMode] = useState<QueueMode>("library");
  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [addTargetPlaylistId, setAddTargetPlaylistId] = useState<string>("");
  const tracks = useLibraryStore(selectFilteredTracks);
  const allTracks = useLibraryStore((state) => state.tracks);
  const loadTracks = useLibraryStore((state) => state.loadTracks);
  const searchText = useLibraryStore((state) => state.searchText);
  const setSearchText = useLibraryStore((state) => state.setSearchText);
  const error = useLibraryStore((state) => state.error);
  const playlists = usePlaylistStore((state) => state.playlists);
  const loadPlaylists = usePlaylistStore((state) => state.loadPlaylists);
  const addTrackToPlaylist = usePlaylistStore((state) => state.addTrackToPlaylist);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setPlaying = usePlayerStore((state) => state.setPlaying);

  useEffect(() => {
    void loadTracks();
    void loadPlaylists();
  }, [loadTracks, loadPlaylists]);

  useEffect(() => {
    if (queueMode !== "library") return;
    setQueue(allTracks);
  }, [allTracks, setQueue, queueMode]);

  useEffect(() => {
    if (playlists.length === 0) {
      setAddTargetPlaylistId("");
      return;
    }
    setAddTargetPlaylistId((current) =>
      current && playlists.some((p) => p.id === current) ? current : playlists[0].id,
    );
  }, [playlists]);

  const selectedTrack = useMemo(() => allTracks.find((track) => track.id === selectedTrackId), [allTracks, selectedTrackId]);
  const artists = useMemo(() => buildArtistSummaries(tracks), [tracks]);
  const albums = useMemo(() => buildAlbumSummaries(tracks), [tracks]);

  return (
    <main className="app-shell">
      <header>
        <h1>Local MP3 Web App</h1>
        <p>Import local MP3 files, play them, and enrich metadata from the internet.</p>
      </header>

      <FileImporter />

      <section className="card controls">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search song, artist, or album..."
        />
        <div className="view-buttons">
          <button onClick={() => setViewMode("songs")} data-active={viewMode === "songs"}>
            Songs
          </button>
          <button onClick={() => setViewMode("artists")} data-active={viewMode === "artists"}>
            Artists
          </button>
          <button onClick={() => setViewMode("albums")} data-active={viewMode === "albums"}>
            Albums
          </button>
          <button onClick={() => setViewMode("playlists")} data-active={viewMode === "playlists"}>
            Playlists
          </button>
        </div>
        {queueMode === "playlist" ? (
          <p className="queue-hint">
            Queue follows a playlist.{" "}
            <button
              type="button"
              onClick={() => {
                setQueueMode("library");
                setQueue(allTracks);
              }}
            >
              Use full library as queue
            </button>
          </p>
        ) : null}
      </section>

      {error ? <section className="card"><p>{error}</p></section> : null}

      <section className="card">
        {tracks.length === 0 && viewMode !== "playlists" ? (
          <p>No tracks in library yet. Import MP3 files to start.</p>
        ) : null}
        {viewMode === "songs" ? (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Album</th>
                <th>Duration</th>
                <th>Playlist</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td>{track.title}</td>
                  <td>{track.artist}</td>
                  <td>{track.album}</td>
                  <td>{formatDuration(track.durationSec)}</td>
                  <td className="playlist-add-cell">
                    <select
                      value={addTargetPlaylistId}
                      onChange={(e) => setAddTargetPlaylistId(e.target.value)}
                      disabled={playlists.length === 0}
                      aria-label="Target playlist"
                    >
                      {playlists.length === 0 ? <option value="">No playlists</option> : null}
                      {playlists.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={playlists.length === 0 || !addTargetPlaylistId}
                      onClick={() => void addTrackToPlaylist(addTargetPlaylistId, track.id)}
                    >
                      Add
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setQueueMode("library");
                        setQueue(allTracks);
                        setSelectedTrackId(track.id);
                        setCurrentTrack(track.id);
                        setPlaying(true);
                      }}
                    >
                      Play
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {viewMode === "artists" ? (
          <ul className="summary-list">
            {artists.map((artist) => (
              <li key={artist.name}>
                <strong>{artist.name}</strong> - {artist.trackCount} song(s), {artist.albums.length} album(s)
              </li>
            ))}
          </ul>
        ) : null}

        {viewMode === "albums" ? (
          <ul className="summary-list">
            {albums.map((album) => (
              <li key={`${album.artist}-${album.album}`}>
                <strong>{album.album}</strong> by {album.artist} - {album.trackCount} song(s)
              </li>
            ))}
          </ul>
        ) : null}

        {viewMode === "playlists" ? (
          <PlaylistsPanel
            allTracks={allTracks}
            onPlayPlaylistTracks={(playlistTracks) => {
              setQueueMode("playlist");
              setQueue(playlistTracks);
              setCurrentTrack(playlistTracks[0]?.id);
              setPlaying(playlistTracks.length > 0);
            }}
          />
        ) : null}
      </section>

      <MetadataPanel track={selectedTrack} />
      <PlayerBar />
    </main>
  );
}
