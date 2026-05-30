# DevSnippets AI

A cross-platform mobile app for developers to save, organize, search, and manage code snippets — with built-in AI generation and explanation powered by OpenAI and Google Gemini.

Built with **Expo 55**, **React Native**, and **TypeScript**. Everything runs locally — no backend required.

---

## Features

### Snippet Management
- Create, edit, and delete code snippets with title, language, and tags
- Search snippets in real-time across title, code content, and tags
- Filter by programming language (JavaScript, TypeScript, Python, Java, C++, HTML, CSS, JSON, Bash)
- Mark snippets as favorites for quick access
- Copy code to clipboard with one tap
- Share snippets via native share sheet
- Export snippets as code files (`.js`, `.ts`, `.py`, `.json`, `.txt`)

### AI Integration
- **Generate snippets** — describe what you want in plain English and AI writes the code, picks the language, and suggests tags
- **Explain snippets** — AI breaks down what the code does, how it works, key concepts, and improvement suggestions
- Supports **OpenAI GPT-4o-mini** and **Google Gemini 2.0 Flash**
- API keys stored securely using OS-level encryption (Expo SecureStore)

### File Manager
- Three-folder local storage: Snippets, Templates, Attachments
- Import files from device via document picker
- Delete files with confirmation
- Color-coded folder tabs with file counts and sizes

### Settings & Appearance
- Light and dark theme toggle (persisted across sessions)
- Choose AI provider (OpenAI or Gemini)
- Add, update, or remove API keys with masked display
- Storage info panel showing all local storage mechanisms

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Expo 55.0.26 |
| UI | React Native 0.83.6 + React 19.2.0 |
| Language | TypeScript ~5.9.2 |
| Navigation | Expo Router ~55.0.16 (file-based) |
| Local Database | expo-sqlite ~55.0.16 |
| Preferences | @react-native-async-storage/async-storage |
| Secure Storage | expo-secure-store ~55.0.14 |
| File System | expo-file-system ~55.0.22 |
| Animations | react-native-reanimated 4.2.1 |
| Gestures | react-native-gesture-handler ~2.30.0 |
| Icons | @expo/vector-icons (Ionicons) |
| AI APIs | OpenAI Chat Completions, Google Gemini |

---

## Project Structure

```
src/
├── app/                        # Expo Router routes
│   ├── _layout.tsx             # Root layout & app initialization
│   ├── (tabs)/                 # Bottom tab navigation
│   │   ├── _layout.tsx         # Tab bar configuration
│   │   ├── index.tsx           # Snippets home screen
│   │   ├── favourites.tsx      # Saved/favorited snippets
│   │   ├── files.tsx           # Local file manager
│   │   └── settings.tsx        # Settings & preferences
│   └── snippet/                # Stack screens (overlay tabs)
│       ├── [id].tsx            # Snippet detail view
│       └── create.tsx          # Create / edit snippet
│
├── components/
│   ├── SnippetCard.tsx         # Snippet list item with actions
│   ├── LanguagePicker.tsx      # Language selection modal
│   └── TagInput.tsx            # Tag input with pill display
│
├── services/
│   ├── aiService.ts            # OpenAI & Gemini API calls
│   ├── fileService.ts          # File system operations
│   └── exportService.ts        # Snippet export logic
│
├── db/
│   └── database.ts             # SQLite CRUD operations
│
├── storage/
│   ├── secrets.ts              # Encrypted API key storage
│   └── preferences.ts          # User preferences helpers
│
├── context/
│   └── ThemeContext.tsx        # Theme state + persistence
│
├── constants/
│   └── colors.ts               # Light & dark color schemes
│
└── types/
    └── index.ts                # Shared TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) — `npm install -g expo-cli`
- One of:
  - **iOS Simulator** (macOS only, requires Xcode)
  - **Android Emulator** (requires Android Studio)
  - **Expo Go** app on a physical device

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd DevSnippets-AI-

# Install dependencies
npm install

# Start the development server
npx expo start
```

Then in the Expo CLI:

- Press `a` — open Android emulator
- Press `i` — open iOS simulator
- Press `w` — open in browser
- Scan the QR code with Expo Go on your phone

### Other Scripts

```bash
npm run android      # Launch directly on Android
npm run ios          # Launch directly on iOS
npm run web          # Launch in browser
npm run lint         # Run ESLint
```

---

## Configuration

### API Keys

No `.env` file is needed. API keys are entered directly in the app's Settings screen and stored using Expo SecureStore (OS-level encrypted storage). They are never written to disk as plaintext.

To add your API key:

1. Open the app and go to the **Settings** tab
2. Under **AI Provider**, select OpenAI or Gemini
3. Tap **Add API Key** and paste your key
4. Start generating and explaining snippets

**Where to get keys:**
- OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Google Gemini: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Preferences (auto-managed)

Stored in AsyncStorage automatically:

| Key | Values | Description |
|---|---|---|
| `pref_theme` | `"light"` / `"dark"` | UI theme |
| `pref_sort_by` | `"createdAt"` / `"title"` / `"language"` | Snippet sort order |
| `ai_provider` | `"openai"` / `"gemini"` | Active AI provider |

---

## Database Schema

Snippets are stored in a local SQLite database:

```sql
CREATE TABLE snippets (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  code          TEXT    NOT NULL,
  language      TEXT    NOT NULL,
  tags          TEXT    DEFAULT '',       -- comma-separated: "react,hooks,api"
  isFavorite    INTEGER DEFAULT 0,        -- 0 = false, 1 = true
  attachmentPath TEXT,
  createdAt     TEXT    NOT NULL,         -- ISO 8601
  updatedAt     TEXT    NOT NULL
);
```

Available operations: `getAllSnippets`, `getSnippetById`, `searchSnippets`, `getFavoriteSnippets`, `insertSnippet`, `updateSnippet`, `toggleFavorite`, `deleteSnippet`.

---

## Local File Storage

Files are stored under the device's document directory:

```
DocumentDirectory/DevSnippets/
├── snippets/       # Exported code files
├── templates/      # Template files
└── attachments/    # Files attached to snippets
```

---

## Navigation Structure

```
Root (_layout.tsx)
└── (tabs)  [bottom tab navigator]
    ├── /           → Snippets list
    ├── /favourites → Favorited snippets
    ├── /files      → File manager
    └── /settings   → Settings

Stack screens (overlay tabs):
    /snippet/[id]   → Snippet detail
    /snippet/create → Create / edit snippet
```

---

## AI Integration Details

### Generate Snippet

Triggered from the Create screen. User writes a plain-English description and the AI returns a JSON object with `title`, `language`, `code`, and `tags` that auto-populate the form.

### Explain Snippet

Triggered from the Detail screen. Sends the code, language, and title to the AI. Returns a structured explanation with four sections: what it does, how it works, key concepts, and suggested improvements.

Both features use `fetch()` directly against the provider's REST API with a temperature of `0.4` for consistent output.

---

## State Management

No Redux or Zustand. The app uses:

- **React Context** — theme (dark/light) shared app-wide via `ThemeContext`
- **useState / useEffect** — local component state for lists, forms, loading flags, and UI toggles
- **Direct DB calls** — components call `database.ts` functions directly and update local state optimistically

---

## Supported Languages

JavaScript, TypeScript, Python, Java, C++, HTML, CSS, JSON, Bash, Other

Each language has a distinct color used across cards, pills, and filter chips.

---

## License

MIT
