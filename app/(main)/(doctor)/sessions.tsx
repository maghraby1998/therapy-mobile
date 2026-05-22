import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "@/components/screen-shell";
import { Colors } from "@/constants/theme";
import { gql, useQuery } from "@apollo/client";
import moment from "moment";

const GET_MY_SESSIONS = gql`
  query MySessions {
    mySessions {
      id
      patient {
        patientProfile {
          fullName
        }
      }
      startsAt
      endsAt
      status
      roomName
    }
  }
`;

export default function DoctorSessionsScreen() {
  const { data } = useQuery<{
    mySessions: {
      id: number;
      startsAt: string;
      endsAt: string;
      patient: { patientProfile: { fullName: string } };
      roomName: string | null;
      status: string;
    }[];
  }>(GET_MY_SESSIONS, {
    pollInterval: 5000,
  });

  return (
    <ScreenShell>
      <View style={styles.container}>
        <Text style={styles.title}>Upcoming sessions</Text>
        <Text style={styles.subtitle}>
          Start a video call when it is time for the session.
        </Text>

        {data?.mySessions.map((session) => (
          <View key={session.id} style={styles.card}>
            <Text style={styles.day}>
              {moment(session.startsAt).format("ddd")}
            </Text>
            <View style={styles.details}>
              <Text style={styles.time}>
                {moment(session.startsAt).format("hh:mm A")}
              </Text>
              <Text style={styles.therapist}>
                {session.patient.patientProfile.fullName ?? "patient name"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/video-call",
                  params: { mode: "start", sessionId: String(session.id) },
                } as unknown as Href)
              }
              style={[
                styles.callButton,
                session.roomName ? styles.joinButton : styles.startButton,
              ]}
            >
              <Text style={styles.callButtonText}>
                {session.roomName ? "Open call" : "Start call"}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: "center",
  },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  day: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: "800",
    width: 44,
  },
  details: {
    flex: 1,
    gap: 2,
  },
  time: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  therapist: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  callButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  joinButton: {
    backgroundColor: Colors.success,
  },
  callButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
});
