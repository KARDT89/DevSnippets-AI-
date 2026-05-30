import * as SQLite from "expo-sqlite";
import { Snippet } from "@/types/index";

const db = SQLite.openDatabaseSync("devsnippets.db");

// Runs once on app start — creates the table if it doesn't exist yet
export const initDatabase = (): void => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      tags TEXT DEFAULT '',
      isFavorite INTEGER DEFAULT 0,
      attachmentPath TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
};

// CREATE
export const insertSnippet = (
  snippet: Omit<Snippet, "id">
): void => {
  db.runSync(
    `INSERT INTO snippets 
      (title, code, language, tags, isFavorite, attachmentPath, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      snippet.title,
      snippet.code,
      snippet.language,
      snippet.tags,
      snippet.isFavorite,
      snippet.attachmentPath,
      snippet.createdAt,
      snippet.updatedAt,
    ]
  );
};

// READ ALL
export const getAllSnippets = (): Snippet[] => {
  return db.getAllSync<Snippet>(
    `SELECT * FROM snippets ORDER BY createdAt DESC`
  );
};

// READ ONE
export const getSnippetById = (id: number): Snippet | null => {
  return db.getFirstSync<Snippet>(
    `SELECT * FROM snippets WHERE id = ?`, [id]
  );
};

// SEARCH
export const searchSnippets = (query: string): Snippet[] => {
  const like = `%${query}%`;
  return db.getAllSync<Snippet>(
    `SELECT * FROM snippets 
     WHERE title LIKE ? OR code LIKE ? OR tags LIKE ?
     ORDER BY createdAt DESC`,
    [like, like, like]
  );
};

// FAVORITES
export const getFavoriteSnippets = (): Snippet[] => {
  return db.getAllSync<Snippet>(
    `SELECT * FROM snippets WHERE isFavorite = 1 ORDER BY createdAt DESC`
  );
};

// UPDATE
export const updateSnippet = (snippet: Snippet): void => {
  db.runSync(
    `UPDATE snippets SET
      title = ?, code = ?, language = ?, tags = ?,
      isFavorite = ?, attachmentPath = ?, updatedAt = ?
     WHERE id = ?`,
    [
      snippet.title,
      snippet.code,
      snippet.language,
      snippet.tags,
      snippet.isFavorite,
      snippet.attachmentPath,
      snippet.updatedAt,
      snippet.id,
    ]
  );
};

// TOGGLE FAVORITE
export const toggleFavorite = (id: number, current: number): void => {
  db.runSync(
    `UPDATE snippets SET isFavorite = ? WHERE id = ?`,
    [current === 1 ? 0 : 1, id]
  );
};

// DELETE
export const deleteSnippet = (id: number): void => {
  db.runSync(`DELETE FROM snippets WHERE id = ?`, [id]);
};