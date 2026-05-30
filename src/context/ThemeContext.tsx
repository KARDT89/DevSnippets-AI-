// src/context/ThemeContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { getTheme, saveTheme } from "../storage/preferences";
import { DarkColors, LightColors, ColorScheme } from "../constants/colors";
import { AppPreferences } from "../types";

interface ThemeContextValue {
  theme: AppPreferences["theme"];
  colors: ColorScheme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: DarkColors,
  toggleTheme: () => {},
  isDark: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<AppPreferences["theme"]>("dark"); // dark first

  useEffect(() => {
    // On mount, load saved preference from AsyncStorage
    getTheme().then((saved) => {
      if (saved) setTheme(saved);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    await saveTheme(next); // persist so it survives app restarts
  };

  const colors = theme === "dark" ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);