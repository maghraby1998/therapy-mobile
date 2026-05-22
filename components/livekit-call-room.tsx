import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  AndroidAudioTypePresets,
  AudioSession,
  isTrackReference,
  LiveKitRoom,
  useConnectionState,
  useIOSAudioManagement,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  VideoTrack,
} from "@livekit/react-native";
import { router } from "expo-router";
import { ConnectionState, Track } from "livekit-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Colors } from "@/constants/theme";

type LiveKitCallRoomProps = {
  roomName: string;
  serverUrl: string;
  token: string;
};

export function LiveKitCallRoom({
  roomName,
  serverUrl,
  token,
}: LiveKitCallRoomProps) {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function startNativeAudio() {
      try {
        await AudioSession.configureAudio({
          android: {
            audioTypeOptions: AndroidAudioTypePresets.communication,
            preferredOutputList: ["speaker", "bluetooth", "headset", "earpiece"],
          },
          ios: {
            defaultOutput: "speaker",
          },
        });
        await AudioSession.setDefaultRemoteAudioTrackVolume(1);
        await AudioSession.startAudioSession();

        if (isMounted) {
          setIsAudioReady(true);
        }
      } catch (error) {
        if (isMounted) {
          setAudioError(
            error instanceof Error
              ? error.message
              : "Could not start call audio.",
          );
        }
      }
    }

    startNativeAudio();

    return () => {
      isMounted = false;
      AudioSession.stopAudioSession().catch(() => {
        // Ignore cleanup errors during route transitions.
      });
    };
  }, []);

  if (audioError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.title}>Audio unavailable</Text>
        <Text style={styles.message}>{audioError}</Text>
      </View>
    );
  }

  if (!isAudioReady) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
        <Text style={styles.message}>Starting call audio</Text>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect
      audio
      video
      options={{
        adaptiveStream: { pixelDensity: "screen" },
        dynacast: true,
      }}
      onDisconnected={() => {
        if (router.canGoBack()) {
          router.back();
        }
      }}
    >
      <RoomContent roomName={roomName} />
    </LiveKitRoom>
  );
}

type TrackItem = ReturnType<typeof useTracks>[number];
type VideoTrackItem = Extract<TrackItem, { publication: unknown }>;

const PIP_TILE_WIDTH = 126;
const PIP_TILE_HEIGHT = 168;
const PIP_MARGIN = 18;

function RoomContent({ roomName }: { roomName: string }) {
  const { height, width } = useWindowDimensions();
  const connectionState = useConnectionState();
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    localParticipant,
  } = useLocalParticipant();
  const room = useRoomContext();
  useIOSAudioManagement(room, true);
  const [mainTrackKey, setMainTrackKey] = useState<string | null>(null);
  const pipPosition = useRef(new Animated.ValueXY()).current;
  const dragStartPosition = useRef({ x: 0, y: 0 });

  const maxPipX = Math.max(PIP_MARGIN, width - PIP_TILE_WIDTH - PIP_MARGIN);
  const maxPipY = Math.max(
    PIP_MARGIN,
    height - PIP_TILE_HEIGHT - PIP_MARGIN - 96,
  );

  const getClampedPipPosition = useCallback(
    (x: number, y: number) => ({
      x: Math.min(Math.max(PIP_MARGIN, x), maxPipX),
      y: Math.min(Math.max(PIP_MARGIN + 42, y), maxPipY),
    }),
    [maxPipX, maxPipY],
  );

  useEffect(() => {
    const nextPosition = getClampedPipPosition(maxPipX, maxPipY);
    pipPosition.setValue(nextPosition);
    dragStartPosition.current = nextPosition;
  }, [getClampedPipPosition, maxPipX, maxPipY, pipPosition]);

  const videoTracks = useMemo(
    () => tracks.filter(isTrackReference),
    [tracks],
  );

  const localTrack = useMemo(
    () =>
      videoTracks.find(
        (track) => track.participant.identity === localParticipant.identity,
      ),
    [localParticipant.identity, videoTracks],
  );

  const remoteTrack = useMemo(
    () =>
      videoTracks.find(
        (track) => track.participant.identity !== localParticipant.identity,
      ),
    [localParticipant.identity, videoTracks],
  );

  const getTrackKey = (track: VideoTrackItem) =>
    `${track.participant.identity}-${track.publication.source}`;

  const defaultMainTrack = remoteTrack ?? localTrack;
  const defaultPipTrack = remoteTrack ? localTrack : undefined;
  const mainTrack =
    videoTracks.find((track) => getTrackKey(track) === mainTrackKey) ??
    defaultMainTrack;
  const pipTrack =
    mainTrack && localTrack && getTrackKey(mainTrack) !== getTrackKey(localTrack)
      ? localTrack
      : remoteTrack &&
          mainTrack &&
          getTrackKey(mainTrack) !== getTrackKey(remoteTrack)
        ? remoteTrack
        : defaultPipTrack;

  useEffect(() => {
    if (!mainTrackKey && defaultMainTrack) {
      setMainTrackKey(getTrackKey(defaultMainTrack));
    }
  }, [defaultMainTrack, mainTrackKey]);

  const switchToPipTrack = useCallback(() => {
    if (pipTrack) {
      setMainTrackKey(getTrackKey(pipTrack));
    }
  }, [pipTrack]);

  const pipPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartPosition.current = getClampedPipPosition(
            dragStartPosition.current.x,
            dragStartPosition.current.y,
          );
        },
        onPanResponderMove: (_, gestureState) => {
          pipPosition.setValue(
            getClampedPipPosition(
              dragStartPosition.current.x + gestureState.dx,
              dragStartPosition.current.y + gestureState.dy,
            ),
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          const nextPosition = getClampedPipPosition(
            dragStartPosition.current.x + gestureState.dx,
            dragStartPosition.current.y + gestureState.dy,
          );

          pipPosition.setValue(nextPosition);
          dragStartPosition.current = nextPosition;

          if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
            switchToPipTrack();
          }
        },
      }),
    [getClampedPipPosition, pipPosition, switchToPipTrack],
  );

  const renderVideoTile = (
    track: VideoTrackItem | undefined,
    style: StyleProp<ViewStyle>,
    videoStyle: ViewStyle = styles.video,
  ) => {
    if (!track) {
      return (
        <View style={[styles.videoTile, style]}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      );
    }

    const isLocal = track.participant.identity === localParticipant.identity;

    return (
      <View style={[styles.videoTile, style]}>
        <VideoTrack
          trackRef={track}
          mirror={isLocal}
          objectFit="cover"
          style={videoStyle}
        />
        <View style={styles.nameBadge}>
          <Text style={styles.nameText}>
            {isLocal
              ? "You"
              : track.participant.name || track.participant.identity}
          </Text>
        </View>
      </View>
    );
  };

  const isConnecting = connectionState !== ConnectionState.Connected;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Video session</Text>
          <Text style={styles.subtitle}>{roomName}</Text>
        </View>
        {isConnecting ? (
          <View style={styles.statusPill}>
            <ActivityIndicator color={Colors.accent} size="small" />
            <Text style={styles.statusText}>Connecting</Text>
          </View>
        ) : (
          <View style={styles.statusPill}>
            <MaterialIcons color={Colors.success} name="radio-button-checked" size={14} />
            <Text style={styles.statusText}>Live</Text>
          </View>
        )}
      </View>

      <View style={styles.stage}>
        {renderVideoTile(mainTrack, styles.mainVideoTile)}
      </View>

      {pipTrack ? (
        <Animated.View
          {...pipPanResponder.panHandlers}
          style={[
            styles.pipTileContainer,
            {
              transform: pipPosition.getTranslateTransform(),
            },
          ]}
        >
          {renderVideoTile(pipTrack, styles.pipVideoTile, styles.pipVideo)}
        </Animated.View>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)
          }
          style={[
            styles.controlButton,
            !isMicrophoneEnabled && styles.controlButtonMuted,
          ]}
        >
          <MaterialIcons
            color={Colors.text}
            name={isMicrophoneEnabled ? "mic" : "mic-off"}
            size={24}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          style={[
            styles.controlButton,
            !isCameraEnabled && styles.controlButtonMuted,
          ]}
        >
          <MaterialIcons
            color={Colors.text}
            name={isCameraEnabled ? "videocam" : "videocam-off"}
            size={24}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => room.disconnect()}
          style={[styles.controlButton, styles.endButton]}
        >
          <MaterialIcons color={Colors.text} name="call-end" size={26} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 18,
    paddingTop: 54,
  },
  centeredContainer: {
    alignItems: "center",
    backgroundColor: Colors.background,
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  message: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  statusPill: {
    alignItems: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  stage: {
    flex: 1,
    paddingBottom: 110,
  },
  videoTile: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  mainVideoTile: {
    height: "100%",
    width: "100%",
  },
  pipTileContainer: {
    elevation: 8,
    height: PIP_TILE_HEIGHT,
    left: 0,
    position: "absolute",
    top: 0,
    width: PIP_TILE_WIDTH,
    zIndex: 5,
  },
  pipVideoTile: {
    height: PIP_TILE_HEIGHT,
    width: PIP_TILE_WIDTH,
  },
  pipVideo: {
    height: PIP_TILE_HEIGHT,
    width: PIP_TILE_WIDTH,
  },
  video: {
    height: "100%",
    width: "100%",
  },
  nameBadge: {
    backgroundColor: "rgba(18, 15, 47, 0.78)",
    borderRadius: 999,
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
  },
  nameText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  controls: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    bottom: 26,
    flexDirection: "row",
    gap: 12,
    padding: 10,
    position: "absolute",
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  controlButtonMuted: {
    backgroundColor: Colors.border,
  },
  endButton: {
    backgroundColor: Colors.danger,
  },
});
