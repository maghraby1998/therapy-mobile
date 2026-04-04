import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppApolloProvider } from '@/components/providers/apollo-provider';
import { AppNavigationTheme } from '@/constants/theme';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <AppApolloProvider>
      <ThemeProvider value={AppNavigationTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AppApolloProvider>
  );
}
