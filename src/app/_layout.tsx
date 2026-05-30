import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "@/db/database";
import { initFileSystem } from "@/services/fileService";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function RootStack() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="snippet/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="snippet/create" options={{ animation: "slide_from_bottom" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    initFileSystem();
  }, []);

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}