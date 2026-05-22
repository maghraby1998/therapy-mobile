import { Redirect, Stack } from "expo-router";

import { useSession } from "@/components/providers/session-provider";

export default function MainLayout() {
  const { isAuthenticated, role } = useSession();

  if (!isAuthenticated || !role) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="video-call" />
      {role === "DOCTOR" ? (
        <Stack.Screen name="(doctor)" />
      ) : (
        <Stack.Screen name="(patient)" />
      )}
    </Stack>
  );
}
