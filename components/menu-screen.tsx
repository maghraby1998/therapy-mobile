import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/components/providers/session-provider';
import { ScreenShell } from '@/components/screen-shell';
import { Colors } from '@/constants/theme';

export function MenuScreen() {
  const { signOut, user, role } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isDoctor = role === 'DOCTOR' || role === 'THERAPIST';

  async function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <ScreenShell>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{role ? `${role} menu` : 'Menu'}</Text>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.subtitle}>{user?.email ?? 'Signed in'}</Text>
        </View>

        <View style={styles.optionList}>
          {isDoctor ? (
            <>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(main)/(doctor)/certificates')}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}>
                <View style={styles.optionIcon}>
                  <MaterialIcons color={Colors.primarySoft} name="verified-user" size={24} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Certificates</Text>
                  <Text style={styles.optionDescription}>
                    View required certification documents and submit files.
                  </Text>
                </View>
                <MaterialIcons color={Colors.textMuted} name="chevron-right" size={26} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(main)/(doctor)/availability-configs')}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.optionPressed,
                ]}>
                <View style={styles.optionIcon}>
                  <MaterialIcons color={Colors.accent} name="date-range" size={24} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Availability</Text>
                  <Text style={styles.optionDescription}>
                    Manage schedules, active working days, and time intervals.
                  </Text>
                </View>
                <MaterialIcons color={Colors.textMuted} name="chevron-right" size={26} />
              </Pressable>
            </>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.option,
              pressed && styles.optionPressed,
              isSigningOut && styles.optionDisabled,
            ]}>
            <View style={styles.optionIcon}>
              <MaterialIcons color={Colors.danger} name="logout" size={24} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>
                {isSigningOut ? 'Logging out...' : 'Logout'}
              </Text>
              <Text style={styles.optionDescription}>End this session on this device.</Text>
            </View>
            <MaterialIcons color={Colors.textMuted} name="chevron-right" size={26} />
          </Pressable>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 22,
    padding: 24,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  optionList: {
    gap: 12,
  },
  option: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 82,
    padding: 16,
  },
  optionPressed: {
    backgroundColor: Colors.surface,
  },
  optionDisabled: {
    opacity: 0.7,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  optionText: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  optionDescription: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
