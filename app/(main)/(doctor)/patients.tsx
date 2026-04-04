import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Colors } from '@/constants/theme';

const patientHighlights = [
  { name: 'Salma H.', focus: 'Anxiety follow-up', status: 'Check-in tonight' },
  { name: 'Kareem A.', focus: 'Sleep routine plan', status: 'Notes pending' },
];

export default function DoctorPatientsScreen() {
  return (
    <ScreenShell>
      <View style={styles.container}>
        <Text style={styles.title}>Patient queue</Text>
        <Text style={styles.subtitle}>
          A starter doctor tab for roster, notes, and patient status cards.
        </Text>

        {patientHighlights.map((patient) => (
          <View key={patient.name} style={styles.card}>
            <Text style={styles.name}>{patient.name}</Text>
            <Text style={styles.focus}>{patient.focus}</Text>
            <Text style={styles.status}>{patient.status}</Text>
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
    gap: 4,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  name: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  focus: {
    color: Colors.primarySoft,
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
