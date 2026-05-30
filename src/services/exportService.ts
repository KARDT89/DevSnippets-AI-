import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Snippet } from "../types";
import { DIRS, initFileSystem } from "./fileService"; // ← add this import

type ExportFormat = "txt" | "js" | "ts" | "py" | "json";

const getExtension = (format: ExportFormat, snippet: Snippet): string => {
  if (format === "json") return "json";
  const langMap: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    html: "html",
    css: "css",
    bash: "sh",
  };
  return langMap[snippet.language] ?? format;
};

const buildContent = (snippet: Snippet, format: ExportFormat): string => {
  if (format === "json") {
    return JSON.stringify(
      {
        title: snippet.title,
        language: snippet.language,
        tags: snippet.tags ? snippet.tags.split(",") : [],
        code: snippet.code,
        createdAt: snippet.createdAt,
      },
      null,
      2
    );
  }
  return `// ${snippet.title}\n// Language: ${snippet.language}\n// Tags: ${snippet.tags}\n\n${snippet.code}`;
};

export const exportSnippet = async (
  snippet: Snippet,
  format: ExportFormat
): Promise<void> => {
  // Make sure the folders exist before writing
  await initFileSystem();

  const ext = getExtension(format, snippet);
  const fileName = `${snippet.title.replace(/\s+/g, "_")}.${ext}`;

  // ← Save inside DevSnippets/snippets/ so File Manager picks it up
  const fileUri = DIRS.snippets + fileName;
  const content = buildContent(snippet, format);

  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share AFTER saving — file is now persisted regardless of share outcome
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/plain",
      dialogTitle: `Share ${snippet.title}`,
    });
  }
};