// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Splash is the entry point — it handles auto-login check */}
      <Stack.Screen name="modal" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
    </Stack>
  );
}