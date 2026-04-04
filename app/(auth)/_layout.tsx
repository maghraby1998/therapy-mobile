import { Redirect, Stack } from 'expo-router';

import { isAuth, userRole } from '@/constants/session';

export default function AuthLayout() {
  if (isAuth) {
    return <Redirect href={userRole === 'doctor' ? '/(main)/(doctor)' : '/(main)/(patient)'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
