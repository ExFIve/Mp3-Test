function isMp3File(file: File): boolean {
  return file.type.includes("mpeg") || file.name.toLowerCase().endsWith(".mp3");
}

function readFileEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function readDirEntries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = dir.createReader();
    const acc: FileSystemEntry[] = [];
    const readBatch = (): void => {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(acc);
            return;
          }
          acc.push(...entries);
          readBatch();
        },
        reject,
      );
    };
    readBatch();
  });
}

async function collectFromDirectory(dir: FileSystemDirectoryEntry, out: File[]): Promise<void> {
  const entries = await readDirEntries(dir);
  for (const entry of entries) {
    if (entry.isFile) {
      const file = await readFileEntry(entry as FileSystemFileEntry);
      if (isMp3File(file)) out.push(file);
    } else if (entry.isDirectory) {
      await collectFromDirectory(entry as FileSystemDirectoryEntry, out);
    }
  }
}

/**
 * Collect MP3 files from a drag-and-drop `DataTransfer`.
 * Uses directory traversal when `webkitGetAsEntry` is available (Chromium, Safari).
 */
export async function collectMp3FilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const out: File[] = [];
  const items = dataTransfer.items ? Array.from(dataTransfer.items) : [];

  if (items.length > 0 && typeof items[0].webkitGetAsEntry === "function") {
    const dirTasks: Promise<void>[] = [];
    for (const item of items) {
      if (item.kind !== "file") continue;
      const entry = item.webkitGetAsEntry?.();
      if (!entry) {
        const file = item.getAsFile();
        if (file && isMp3File(file)) out.push(file);
        continue;
      }
      if (entry.isDirectory) {
        dirTasks.push(collectFromDirectory(entry as FileSystemDirectoryEntry, out));
      } else if (entry.isFile) {
        const file = await readFileEntry(entry as FileSystemFileEntry);
        if (isMp3File(file)) out.push(file);
      }
    }
    await Promise.all(dirTasks);
    return out;
  }

  if (dataTransfer.files?.length) {
    for (const file of Array.from(dataTransfer.files)) {
      if (isMp3File(file)) out.push(file);
    }
  }

  return out;
}
