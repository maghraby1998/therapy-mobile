import { useMutation } from "@apollo/client";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenShell } from "@/components/screen-shell";
import { useSession } from "@/components/providers/session-provider";
import { Colors } from "@/constants/theme";
import {
  LOGIN_MUTATION,
  type LoginMutationData,
  type LoginMutationVariables,
} from "@/graphql/auth";

export default function LoginScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { signIn } = useSession();
  const [login, { loading }] = useMutation<
    LoginMutationData,
    LoginMutationVariables
  >(LOGIN_MUTATION);

  const handleSubmit = async () => {
    const trimmedIdentifier = emailOrPhone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setErrorMessage(
        "Please enter your email or phone number and your password.",
      );
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data } = await login({
        variables: {
          input: {
            emailOrPhone: trimmedIdentifier,
            password: trimmedPassword,
          },
        },
      });

      const payload = data?.login;

      if (!payload) {
        setErrorMessage(
          "We could not complete the login request. Please try again.",
        );
        return;
      }

      if (!payload.user.role) {
        setErrorMessage(
          "Your account role was not included in the login response.",
        );
        return;
      }

      await signIn({
        accessToken: payload.accessToken,
        user: {
          id: payload.user.id,
          email: payload.user.email,
        },
        role: payload.user.role,
      });
      setSuccessMessage(`Welcome back, ${payload.user.email}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while signing in.";
      setErrorMessage(message);
    }
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>MindBridge</Text>
          <Text style={styles.title}>
            Therapy that feels calm before the first session.
          </Text>
          <Text style={styles.subtitle}>
            Sign in to continue your care journey in one calm place.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>

          <TextInput
            autoCapitalize="none"
            placeholder="Email or phone"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              loading && styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Signing in..." : "Continue"}
            </Text>
          </Pressable>

          <Link href="/(auth)/register" style={styles.link}>
            Create an account
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
    justifyContent: "center",
    gap: 24,
  },
  hero: {
    gap: 10,
  },
  kicker: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
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
    fontWeight: "700",
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
  successText: {
    color: Colors.success,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
