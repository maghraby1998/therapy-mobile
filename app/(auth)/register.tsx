import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { type UserRole } from '@/constants/session';
import { Colors } from '@/constants/theme';

export default function RegisterScreen() {
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = () => {
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPhone || !trimmedPassword) {
      setErrorMessage('Please complete all fields before creating your account.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (trimmedPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage('');
  };

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Join The Platform</Text>
          <Text style={styles.title}>Create a secure account for patients or doctors.</Text>
          <Text style={styles.subtitle}>
            Choose how you’ll use the app and we’ll tailor the experience around your role.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>

          <View style={styles.roleRow}>
            {(['patient', 'doctor'] as UserRole[]).map((option) => {
              const selected = role === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.roleChip, selected && styles.roleChipSelected]}
                  onPress={() => setRole(option)}>
                  <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>
                    {option === 'patient' ? 'Patient' : 'Doctor'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            autoCapitalize="none"
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            keyboardType="phone-pad"
            placeholder="Phone"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryButtonText}>Create Account</Text>
          </Pressable>

          <Link href="/(auth)/login" style={styles.link}>
            Back to login
          </Link>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 24,
  },
  hero: {
    gap: 10,
  },
  kicker: {
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
    lineHeight: 38,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: 14,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 28,
    padding: 20,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  roleChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primarySoft,
  },
  roleChipText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  roleChipTextSelected: {
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
