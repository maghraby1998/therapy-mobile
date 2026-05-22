import { useMutation } from "@apollo/client";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { LiveKitCallRoom } from "@/components/livekit-call-room";
import { useSession } from "@/components/providers/session-provider";
import { LIVEKIT_SERVER_URL } from "@/constants/livekit";
import { Colors } from "@/constants/theme";
import {
  JOIN_VIDEO_CALL_MUTATION,
  JoinVideoCallData,
  START_VIDEO_CALL_MUTATION,
  StartVideoCallData,
  VideoCallRoom,
  VideoCallVariables,
} from "@/graphql/video-calls";

type CallMode = "start" | "join";

export default function VideoCallScreen() {
  const params = useLocalSearchParams<{ mode?: string; sessionId?: string }>();
  const { role } = useSession();
  const [room, setRoom] = useState<VideoCallRoom | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const mode: CallMode =
    role === "PATIENT" ? "join" : params.mode === "join" ? "join" : "start";
  const sessionId = Array.isArray(params.sessionId)
    ? params.sessionId[0]
    : params.sessionId;

  const [startVideoCall, startState] = useMutation<
    StartVideoCallData,
    VideoCallVariables
  >(START_VIDEO_CALL_MUTATION);
  const [joinVideoCall, joinState] = useMutation<
    JoinVideoCallData,
    VideoCallVariables
  >(JOIN_VIDEO_CALL_MUTATION);

  const isLoading = startState.loading || joinState.loading;

  const connect = useMemo(
    () => async (nextMode: CallMode) => {
      if (!sessionId) {
        setCallError("Missing session id.");
        return;
      }

      if (!LIVEKIT_SERVER_URL) {
        setCallError("Missing LiveKit server URL.");
        return;
      }

      setCallError(null);
      setRoom(null);

      const nextRoom =
        nextMode === "start"
          ? (
              await startVideoCall({
                fetchPolicy: "no-cache",
                variables: { sessionId },
              })
            ).data?.startVideoCall
          : (
              await joinVideoCall({
                fetchPolicy: "no-cache",
                variables: { sessionId },
              })
            ).data?.joinVideoCall;

      if (!nextRoom) {
        setCallError("Could not open the video call.");
        return;
      }

      setRoom(nextRoom);
    },
    [joinVideoCall, sessionId, startVideoCall],
  );

  useEffect(() => {
    connect(mode).catch((error: unknown) => {
      setCallError(error instanceof Error ? error.message : "Could not open the video call.");
    });
  }, [connect, mode]);

  if (room && LIVEKIT_SERVER_URL) {
    return (
      <LiveKitCallRoom
        roomName={room.roomName}
        serverUrl={LIVEKIT_SERVER_URL}
        token={room.token}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.title}>Opening video session</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Video session unavailable</Text>
          <Text style={styles.message}>
            {callError ?? "The video call could not be opened."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => connect(mode)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.background,
    flex: 1,
    gap: 14,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});
