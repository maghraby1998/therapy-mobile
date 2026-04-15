import { ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { AppApolloProvider } from "@/components/providers/apollo-provider";
import {
  AppSessionProvider,
  useSession,
} from "@/components/providers/session-provider";
import { AppNavigationTheme } from "@/constants/theme";

export const unstable_settings = {
  anchor: "index",
};

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore duplicate calls during fast refresh.
});

function RootNavigator() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "loading") {
      SplashScreen.hideAsync().catch(() => {
        // Splash hiding can race during development reloads.
      });
    }
  }, [status]);

  if (status === "loading") {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppApolloProvider>
      <AppSessionProvider>
        <ThemeProvider value={AppNavigationTheme}>
          <RootNavigator />
        </ThemeProvider>
      </AppSessionProvider>
    </AppApolloProvider>
  );
}
