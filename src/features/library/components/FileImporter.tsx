import { type ChangeEvent, type DragEvent, useCallback, useRef, useState } from "react";
import { useLibraryStore } from "../store/libraryStore";
import { collectMp3FilesFromDataTransfer } from "../utils/collectDropFiles";
import { parseMp3Files } from "../utils/importMp3Files";

export function FileImporter(): JSX.Element {
  const addImportedTracks = useLibraryStore((state) => state.addImportedTracks);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [dragActive, setDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const runImport = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length === 0) {
        setMessage("No MP3 files found.");
        return;
      }
      setIsImporting(true);
      setMessage(undefined);
      try {
        const tracks = await parseMp3Files(files);
        if (tracks.length === 0) {
          setMessage("No MP3 files found.");
          return;
        }
        await addImportedTracks(tracks);
        setMessage(`Imported ${tracks.length} file(s).`);
      } catch (error) {
        setMessage(`Import failed: ${String(error)}`);
      } finally {
        setIsImporting(false);
      }
    },
    [addImportedTracks],
  );

  async function onFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    await runImport(files);
    event.target.value = "";
  }

  function onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dragDepthRef.current += 1;
    setDragActive(true);
  }

  function onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function onDragLeave(event: DragEvent): void {
    event.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  }

  async function onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    if (isImporting) return;
    const files = await collectMp3FilesFromDataTransfer(event.dataTransfer);
    await runImport(files);
  }

  return (
    <section
      className={`card import-zone ${dragActive ? "import-zone--active" : ""}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <h2>Import MP3 files</h2>
      <p>Pick files from your computer, or drag and drop MP3 files (or folders, where supported). Files stay on your machine.</p>
      <input type="file" accept="audio/mpeg,.mp3" multiple onChange={onFileChange} disabled={isImporting} />
      {isImporting ? <p>Importing files...</p> : null}
      {message ? <p>{message}</p> : null}
    </section>
  );
}
