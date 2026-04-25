import { useEffect, useState } from "react";
import { enrichTrackMetadata } from "../../metadata/services/enrichmentClient";
import type { EnrichedMetadata, Track } from "../../../shared/types/music";

interface MetadataPanelProps {
  track?: Track;
}

function ResultGroup({ title, items }: { title: string; items: EnrichedMetadata["artist"] }): JSX.Element {
  return (
    <div className="metadata-group">
      <h4>{title}</h4>
      {items.length === 0 ? (
        <p>No results.</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={`${item.source}-${item.title}-${index}`}>
              <strong>{item.title}</strong>
              <div>{item.description}</div>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noreferrer">
                  Open source
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MetadataPanel({ track }: MetadataPanelProps): JSX.Element {
  const [data, setData] = useState<EnrichedMetadata>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!track) {
      setData(undefined);
      return;
    }
    setIsLoading(true);
    setError(undefined);
    enrichTrackMetadata(track)
      .then((value) => setData(value))
      .catch((err) => setError(String(err)))
      .finally(() => setIsLoading(false));
  }, [track]);

  return (
    <section className="card">
      <h3>Internet metadata</h3>
      {!track ? <p>Select a track to search online details.</p> : null}
      {track ? <p>Query: {track.artist} - {track.title}</p> : null}
      {isLoading ? <p>Loading metadata...</p> : null}
      {error ? <p>{error}</p> : null}
      {data ? (
        <div className="metadata-columns">
          <ResultGroup title="Artist" items={data.artist} />
          <ResultGroup title="Album" items={data.album} />
          <ResultGroup title="Song" items={data.song} />
        </div>
      ) : null}
    </section>
  );
}
