import { useEffect, useMemo, useState } from "react";
import type { Track } from "../../../shared/types/music";
import { formatDuration } from "../../../shared/utils/time";
import { usePlaylistStore } from "../store/playlistStore";

interface PlaylistsPanelProps {
  allTracks: Track[];
  onPlayPlaylistTracks: (tracks: Track[]) => void;
}

function resolvePlaylistTracks(playlistTrackIds: string[], allTracks: Track[]): Track[] {
  const map = new Map(allTracks.map((t) => [t.id, t]));
  return playlistTrackIds.map((id) => map.get(id)).filter((t): t is Track => t !== undefined);
}

export function PlaylistsPanel({ allTracks, onPlayPlaylistTracks }: PlaylistsPanelProps): JSX.Element {
  const playlists = usePlaylistStore((s) => s.playlists);
  const selectedPlaylistId = usePlaylistStore((s) => s.selectedPlaylistId);
  const selectPlaylist = usePlaylistStore((s) => s.selectPlaylist);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const removeTrackFromPlaylist = usePlaylistStore((s) => s.removeTrackFromPlaylist);
  const moveTrackInPlaylist = usePlaylistStore((s) => s.moveTrackInPlaylist);
  const pruneMissingTracks = usePlaylistStore((s) => s.pruneMissingTracks);
  const error = usePlaylistStore((s) => s.error);

  const [newName, setNewName] = useState("");
  const selected = useMemo(
    () => playlists.find((p) => p.id === selectedPlaylistId),
    [playlists, selectedPlaylistId],
  );
  const selectedTracks = useMemo(
    () => (selected ? resolvePlaylistTracks(selected.trackIds, allTracks) : []),
    [selected, allTracks],
  );

  useEffect(() => {
    if (!selectedPlaylistId) return;
    const allow = new Set(allTracks.map((t) => t.id));
    void pruneMissingTracks(selectedPlaylistId, allow);
  }, [selectedPlaylistId, allTracks, pruneMissingTracks]);

  return (
    <div className="playlists-panel">
      {error ? <p className="text-error">{error}</p> : null}

      <div className="playlist-create">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void createPlaylist(newName).then(() => setNewName(""));
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            void createPlaylist(newName).then(() => setNewName(""));
          }}
        >
          Create playlist
        </button>
      </div>

      <div className="playlist-layout">
        <aside className="playlist-list card nested">
          <h3>Your playlists</h3>
          {playlists.length === 0 ? <p>No playlists yet.</p> : null}
          <ul className="playlist-names">
            {playlists.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={p.id === selectedPlaylistId ? "playlist-pill active" : "playlist-pill"}
                  onClick={() => selectPlaylist(p.id)}
                >
                  {p.name}
                  <span className="count">({p.trackIds.length})</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="playlist-detail card nested">
          {!selected ? <p>Select a playlist or create one.</p> : null}
          {selected ? (
            <>
              <div className="playlist-detail-header">
                <label className="rename-field">
                  Name
                  <input
                    defaultValue={selected.name}
                    key={selected.id}
                    onBlur={(e) => void renamePlaylist(selected.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
                </label>
                <div className="playlist-detail-actions">
                  <button
                    type="button"
                    onClick={() => {
                      const tracks = resolvePlaylistTracks(selected.trackIds, allTracks);
                      if (tracks.length) onPlayPlaylistTracks(tracks);
                    }}
                    disabled={selected.trackIds.length === 0}
                  >
                    Play playlist
                  </button>
                  <button type="button" onClick={() => void deletePlaylist(selected.id)}>
                    Delete playlist
                  </button>
                </div>
              </div>
              <h4>Tracks ({selectedTracks.length})</h4>
              {selectedTracks.length === 0 ? (
                <p>Add songs from the Songs tab using &quot;Add to playlist&quot;.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Artist</th>
                      <th>Duration</th>
                      <th>Order</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTracks.map((track, index) => {
                      const storeIndex = selected.trackIds.indexOf(track.id);
                      return (
                      <tr key={track.id}>
                        <td>{index + 1}</td>
                        <td>{track.title}</td>
                        <td>{track.artist}</td>
                        <td>{formatDuration(track.durationSec)}</td>
                        <td className="order-buttons">
                          <button
                            type="button"
                            disabled={storeIndex <= 0}
                            onClick={() => void moveTrackInPlaylist(selected.id, storeIndex, storeIndex - 1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            disabled={storeIndex < 0 || storeIndex >= selected.trackIds.length - 1}
                            onClick={() => void moveTrackInPlaylist(selected.id, storeIndex, storeIndex + 1)}
                          >
                            Down
                          </button>
                        </td>
                        <td>
                          <button type="button" onClick={() => void removeTrackFromPlaylist(selected.id, track.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              )}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
