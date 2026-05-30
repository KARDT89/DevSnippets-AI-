// app/(tabs)/index.tsx
import { View, Text } from "react-native";

export default function Files() {
  return (
    <View style={{ flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "#fff" }}>Files</Text>
    </View>
  );
}