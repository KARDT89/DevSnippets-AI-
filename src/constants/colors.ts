// src/constants/colors.ts

export const DarkColors = {
  // === BRUTALIST DARK ===
  background: "#000000",
  surface: "#0d0d0d",
  surfaceAlt: "#141414",
  surfaceHover: "#1a1a1a",
  border: "#2a2a2a",
  borderStrong: "#3d3d3d",

  primary: "#ffffff",
  primaryGlow: "#ffffff20",
  primaryDark: "#cccccc",
  accent: "#00ff88",          // neon green — brutalist signature
  accentGlow: "#00ff8830",
  danger: "#ff2244",
  dangerGlow: "#ff224420",
  success: "#00ff88",
  successGlow: "#00ff8820",
  warning: "#ffcc00",
  warningGlow: "#ffcc0020",

  text: "#ffffff",
  textMuted: "#888888",
  textFaint: "#444444",

  // tab bar specific
  tabBg: "#0d0d0ddd",
  tabBorder: "#2a2a2a",
  tabShadow: "#000000",

  gradient: {
    primary: ["#ffffff", "#888888"],
    surface: ["#0d0d0d", "#000000"],
    card: ["#141414", "#0d0d0d"],
  },

  languages: {
    javascript: "#ffcc00",
    typescript: "#4488ff",
    python: "#44aaff",
    java: "#ff8844",
    cpp: "#ff4488",
    html: "#ff6644",
    css: "#cc88ff",
    json: "#888888",
    bash: "#00ff88",
    other: "#888888",
  } as Record<string, string>,
};

export const LightColors = {
  // === ULTRA-CLEAN WHITE ===
  background: "#fafafa",
  surface: "#ffffff",
  surfaceAlt: "#f5f5f5",
  surfaceHover: "#efefef",
  border: "#e8e8e8",
  borderStrong: "#d0d0d0",

  primary: "#111111",
  primaryGlow: "#11111115",
  primaryDark: "#333333",
  accent: "#0057ff",          // electric blue — clean & modern
  accentGlow: "#0057ff18",
  danger: "#ff2244",
  dangerGlow: "#ff224412",
  success: "#00aa55",
  successGlow: "#00aa5512",
  warning: "#dd8800",
  warningGlow: "#dd880012",

  text: "#111111",
  textMuted: "#666666",
  textFaint: "#aaaaaa",

  // tab bar specific
  tabBg: "#ffffffee",
  tabBorder: "#e8e8e8",
  tabShadow: "#00000015",

  gradient: {
    primary: ["#111111", "#555555"],
    surface: ["#ffffff", "#fafafa"],
    card: ["#ffffff", "#f8f8f8"],
  },

  languages: {
    javascript: "#b8860b",
    typescript: "#1a56cc",
    python: "#1a6aaa",
    java: "#cc5500",
    cpp: "#cc1155",
    html: "#cc3300",
    css: "#7722cc",
    json: "#666666",
    bash: "#007744",
    other: "#666666",
  } as Record<string, string>,
};

export type ColorScheme = typeof DarkColors;
// Default export — DarkColors is the primary theme
export const Colors = DarkColors;