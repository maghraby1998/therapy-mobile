import { useMutation } from "@apollo/client";
import { Link } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSession } from "@/components/providers/session-provider";
import { ScreenShell } from "@/components/screen-shell";
import { type UserRole } from "@/constants/session";
import { Colors } from "@/constants/theme";
import {
  REGISTER_MUTATION,
  type RegisterMutationData,
  type RegisterMutationVariables,
} from "@/graphql/auth";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

type Inputs = {
  type: UserRole;
  email: string;
  phone: string;
  password: string;
};

export default function RegisterScreen() {
  const { control, handleSubmit, setValue, watch } = useForm<Inputs>({
    defaultValues: {
      type: "patient",
    },
  });

  const { signIn } = useSession();
  const [register, { loading }] = useMutation<
    RegisterMutationData,
    RegisterMutationVariables
  >(REGISTER_MUTATION);

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    register({
      variables: {
        input: {
          email: data?.email,
          phone: data?.phone,
          password: data?.password,
          role: data?.type,
        },
      },
      onCompleted: async (data: any) => {
        await signIn({
          accessToken: data?.accessToken,
          user: {
            id: data?.user.id,
            email: data?.user.email,
          },
          role: data?.user.role,
        });
      },
    });
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Join The Platform</Text>
          <Text style={styles.title}>
            Create a secure account for patients or doctors.
          </Text>
          <Text style={styles.subtitle}>
            Choose how you’ll use the app and we’ll tailor the experience around
            your role.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register</Text>

          <View style={styles.roleRow}>
            {(["patient", "doctor"] as UserRole[]).map((option) => {
              const selected = watch("type") === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.roleChip, selected && styles.roleChipSelected]}
                  onPress={() => setValue("type", option)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      selected && styles.roleChipTextSelected,
                    ]}
                  >
                    {option === "patient" ? "Patient" : "Doctor"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
              />
            )}
          />

          <Pressable
            style={[
              styles.primaryButton,
              loading && styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Creating account..." : "Create Account"}
            </Text>
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
    fontSize: 32,
    fontWeight: "800",
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
    fontWeight: "700",
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
  },
  roleChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  roleChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primarySoft,
  },
  roleChipText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
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
