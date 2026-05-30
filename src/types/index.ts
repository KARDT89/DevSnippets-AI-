export interface Snippet {
  id: number;
  title: string;
  code: string;
  language: string;
  tags: string;        // stored as "react,hooks,api" — joined string
  isFavorite: number;  // SQLite has no boolean. 0 = false, 1 = true
  attachmentPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  name: string;
  uri: string;
  size: number | null;
  isDirectory: boolean;
  modificationTime: number | null;
}

export type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "html"
  | "css"
  | "json"
  | "bash"
  | "other";

export interface AppPreferences {
  theme: "light" | "dark";
  sortBy: "createdAt" | "title" | "language";
}