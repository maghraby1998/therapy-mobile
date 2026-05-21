import { useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenShell } from "@/components/screen-shell";
import { Colors } from "@/constants/theme";
import {
  BOOK_SESSION_MUTATION,
  BookSessionMutationData,
  BookSessionMutationVariables,
  Doctor,
  DOCTORS_QUERY,
  DoctorsQueryData,
} from "@/graphql/doctors";

function toDateTimeInputValue(date: Date) {
  return date.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  const normalized = value.trim();
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function getDefaultSessionTime() {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 1);
  startsAt.setMinutes(0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setMinutes(endsAt.getMinutes() + 50);

  return {
    startsAt: toDateTimeInputValue(startsAt),
    endsAt: toDateTimeInputValue(endsAt),
  };
}

export default function PatientDoctorsScreen() {
  const { data, loading, error, refetch } =
    useQuery<DoctorsQueryData>(DOCTORS_QUERY);
  const [bookSession, { loading: booking }] = useMutation<
    BookSessionMutationData,
    BookSessionMutationVariables
  >(BOOK_SESSION_MUTATION);
  const defaults = useMemo(() => getDefaultSessionTime(), []);

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [startsAt, setStartsAt] = useState(defaults.startsAt);
  const [endsAt, setEndsAt] = useState(defaults.endsAt);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const doctors = data?.doctors ?? [];

  const selectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormError(null);
    setSuccessMessage(null);
  };

  const submitBooking = async () => {
    if (!selectedDoctor) {
      return;
    }

    const startsAtIso = toIsoDateTime(startsAt);
    const endsAtIso = toIsoDateTime(endsAt);

    if (!startsAtIso || !endsAtIso) {
      setFormError("Enter valid start and end date-times.");
      return;
    }

    if (new Date(endsAtIso).getTime() <= new Date(startsAtIso).getTime()) {
      setFormError("End time must be after the start time.");
      return;
    }

    try {
      setFormError(null);
      await bookSession({
        variables: {
          input: {
            doctorId: selectedDoctor.id,
            startsAt: moment().format("YYYY-MM-DD hh:mm:ss"),
            endsAt: moment().add(1, "hour").format("YYYY-MM-DD hh:mm:ss"),
            notes: notes.trim() || null,
          },
        },
      });
      setSuccessMessage(
        `Session booked with ${selectedDoctor.fullName ?? "this doctor"}.`,
      );
      setNotes("");
    } catch (bookingError) {
      const message =
        bookingError instanceof Error
          ? bookingError.message
          : "Could not book this session.";
      setFormError(message);
    }
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Care team</Text>
            <Text style={styles.title}>Find a doctor</Text>
            <Text style={styles.subtitle}>
              Browse available doctors and request a session time that works for
              you.
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.stateText}>Loading doctors...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error.message}</Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => refetch()}
              >
                <Text style={styles.secondaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !error && doctors.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateText}>
                No doctors are available yet.
              </Text>
            </View>
          ) : null}

          {doctors.map((doctor) => {
            const selected = selectedDoctor?.id === doctor.id;

            return (
              <View
                key={doctor.id}
                style={[styles.card, selected && styles.selectedCard]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.name}>
                      {doctor.fullName ?? "Unnamed doctor"}
                    </Text>
                    <Text style={styles.specialty}>
                      {doctor.specialty ?? "General therapy"}
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.bookButton,
                      selected && styles.bookButtonSelected,
                    ]}
                    onPress={() => selectDoctor(doctor)}
                  >
                    <Text style={styles.bookButtonText}>
                      {selected ? "Selected" : "Book"}
                    </Text>
                  </Pressable>
                </View>

                {doctor.bio ? (
                  <Text style={styles.bio}>{doctor.bio}</Text>
                ) : null}
              </View>
            );
          })}

          {selectedDoctor ? (
            <View style={styles.bookingPanel}>
              <Text style={styles.formTitle}>
                Book with {selectedDoctor.fullName ?? "doctor"}
              </Text>

              <Text style={styles.label}>Starts at</Text>
              <TextInput
                autoCapitalize="none"
                placeholder="2026-05-17T10:00"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={startsAt}
                onChangeText={setStartsAt}
              />

              <Text style={styles.label}>Ends at</Text>
              <TextInput
                autoCapitalize="none"
                placeholder="2026-05-17T10:50"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                value={endsAt}
                onChangeText={setEndsAt}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                multiline
                placeholder="Anything you want the doctor to know"
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
              />

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}
              {successMessage ? (
                <Text style={styles.successText}>{successMessage}</Text>
              ) : null}

              <Pressable
                disabled={booking}
                style={[styles.submitButton, booking && styles.disabledButton]}
                onPress={submitBooking}
              >
                {booking ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.submitButtonText}>Book session</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 36,
    gap: 16,
  },
  header: {
    gap: 8,
    paddingTop: 12,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  selectedCard: {
    borderColor: Colors.accent,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  doctorInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  specialty: {
    color: Colors.primarySoft,
    fontSize: 14,
    fontWeight: "600",
  },
  bio: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  bookButton: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    minWidth: 88,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bookButtonSelected: {
    backgroundColor: Colors.primary,
  },
  bookButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  bookingPanel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  formTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  input: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    minHeight: 50,
    justifyContent: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
