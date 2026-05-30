// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Platform, View, StyleSheet } from "react-native";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_CONFIG: {
  name: string;
  title: string;
  icon: IconName;
  activeIcon: IconName;
}[] = [
  { name: "index",     title: "Code",      icon: "code-slash-outline",   activeIcon: "code-slash"   },
  { name: "favorites", title: "Saved",     icon: "bookmark-outline",     activeIcon: "bookmark"     },
  { name: "files",     title: "Files",     icon: "folder-outline",       activeIcon: "folder"       },
  { name: "settings",  title: "Settings",  icon: "settings-outline",     activeIcon: "settings"     },
];

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        // The floating pill container
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 28 : 20,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.tabBg,
          borderWidth: 1,
          borderColor: colors.tabBorder,
          elevation: 24,
          shadowColor: colors.tabShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.6 : 0.12,
          shadowRadius: 24,
          paddingBottom: 0,
          paddingTop: 0,

          // Extra glow ring for dark mode
          ...(isDark && {
            shadowColor: "#00ff88",
            shadowOpacity: 0.08,
          }),
        },

        tabBarItemStyle: {
          height: 64,
          borderRadius: 32,
        },

        tabBarActiveTintColor: isDark ? colors.accent : colors.accent,
        tabBarInactiveTintColor: colors.textFaint,

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginBottom: 8,
        },

        tabBarIcon: ({ color, focused }) => {
          const tab = TAB_CONFIG.find((t) => t.name === route.name);
          if (!tab) return null;
          return (
            <View style={[
              styles.iconWrap,
              focused && {
                backgroundColor: isDark ? "#00ff8818" : colors.accent + "15",
              },
            ]}>
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={20}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
});