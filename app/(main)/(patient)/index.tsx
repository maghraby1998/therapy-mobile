import { StyleSheet, Text, View } from "react-native";

import { useSession } from "@/components/providers/session-provider";
import { ScreenShell } from "@/components/screen-shell";
import { Colors } from "@/constants/theme";

export default function PatientHomeScreen() {
  const { user } = useSession();

  return (
    <ScreenShell>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>Patient Space</Text>
        <Text style={styles.title}>
          A calm home for appointments, journaling, and progress.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Authenticated user preview</Text>
          <Text style={styles.cardText}>id: {user?.id ?? "Unavailable"}</Text>
          <Text style={styles.cardText}>
            email: {user?.email ?? "Unavailable"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next build steps</Text>
          <Text style={styles.cardText}>
            Access token is now restored from secure storage.
          </Text>
          <Text style={styles.cardText}>
            Fetch therapist matches and session history.
          </Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  card: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
