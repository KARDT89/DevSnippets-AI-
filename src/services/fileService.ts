import * as FileSystem from "expo-file-system/legacy";
import { FileItem } from "../types";

// Root folder for all app files
export const ROOT_DIR = FileSystem.documentDirectory + "DevSnippets/";

// Subfolders
export const DIRS = {
  snippets: ROOT_DIR + "snippets/",
  templates: ROOT_DIR + "templates/",
  attachments: ROOT_DIR + "attachments/",
};

// Create folder structure on first run
export const initFileSystem = async (): Promise<void> => {
  for (const dir of Object.values(DIRS)) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
};

// List files in a directory
export const listFiles = async (dirUri: string): Promise<FileItem[]> => {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) return [];

  const names = await FileSystem.readDirectoryAsync(dirUri);
  const items: FileItem[] = [];

  for (const name of names) {
    const uri = dirUri + name;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    items.push({
      name,
      uri,
      size: fileInfo.exists && !fileInfo.isDirectory ? (fileInfo as any).size ?? null : null,
      isDirectory: fileInfo.exists ? fileInfo.isDirectory ?? false : false,
      modificationTime: fileInfo.exists ? (fileInfo as any).modificationTime ?? null : null,
    });
  }

  return items.sort((a, b) => {
    // Folders first, then files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
};

// Delete a file or folder
export const deleteFile = async (uri: string): Promise<void> => {
  await FileSystem.deleteAsync(uri, { idempotent: true });
};

// Copy a file
export const copyFile = async (fromUri: string, toDir: string, name: string): Promise<void> => {
  await FileSystem.copyAsync({ from: fromUri, to: toDir + name });
};

// Move a file
export const moveFile = async (fromUri: string, toDir: string, name: string): Promise<void> => {
  await FileSystem.moveAsync({ from: fromUri, to: toDir + name });
};

// Format bytes to readable string
export const formatSize = (bytes: number | null): string => {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};