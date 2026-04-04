import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Colors } from '@/constants/theme';

const upcomingSessions = [
  { day: 'Mon', time: '7:30 PM', therapist: 'Dr. Noor' },
  { day: 'Thu', time: '6:00 PM', therapist: 'Dr. Youssef' },
];

export default function PatientSessionsScreen() {
  return (
    <ScreenShell>
      <View style={styles.container}>
        <Text style={styles.title}>Upcoming sessions</Text>
        <Text style={styles.subtitle}>
          This tab is ready for your patient booking and session-history data.
        </Text>

        {upcomingSessions.map((session) => (
          <View key={`${session.day}-${session.time}`} style={styles.card}>
            <Text style={styles.day}>{session.day}</Text>
            <View style={styles.details}>
              <Text style={styles.time}>{session.time}</Text>
              <Text style={styles.therapist}>{session.therapist}</Text>
            </View>
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
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
    width: 44,
  },
  details: {
    gap: 2,
  },
  time: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  therapist: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
