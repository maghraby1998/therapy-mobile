import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as
  | { livekitUrl?: unknown }
  | undefined;

export const LIVEKIT_SERVER_URL =
  process.env.EXPO_PUBLIC_LIVEKIT_URL ??
  (typeof extra?.livekitUrl === "string" ? extra.livekitUrl : undefined);
