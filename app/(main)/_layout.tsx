import { Redirect, Stack } from 'expo-router';

import { isAuth, userRole } from '@/constants/session';

export default function MainLayout() {
  if (!isAuth) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {userRole === 'doctor' ? (
        <Stack.Screen name="(doctor)" />
      ) : (
        <Stack.Screen name="(patient)" />
      )}
    </Stack>
  );
}
