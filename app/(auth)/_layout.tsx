import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/components/providers/session-provider';

export default function AuthLayout() {
  const { isAuthenticated, role } = useSession();

  if (isAuthenticated && role) {
    return <Redirect href={role === 'doctor' ? '/(main)/(doctor)' : '/(main)/(patient)'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
