import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
  DOCTOR_CERTIFICATES_QUERY,
  DoctorCertificatesQueryData,
  DoctorVerificationDocumentType,
  SUBMIT_DOCTOR_VERIFICATION_DOCUMENT_MUTATION,
  SubmitDoctorVerificationDocumentMutationData,
  SubmitDoctorVerificationDocumentMutationVariables,
} from "@/graphql/certificates";

const CAN_SUBMIT_DOCUMENTS = true;

export default function DoctorCertificatesScreen() {
  const { data, loading, error, refetch } =
    useQuery<DoctorCertificatesQueryData>(DOCTOR_CERTIFICATES_QUERY);
  const [submitDocument, { loading: submitting }] = useMutation<
    SubmitDoctorVerificationDocumentMutationData,
    SubmitDoctorVerificationDocumentMutationVariables
  >(SUBMIT_DOCTOR_VERIFICATION_DOCUMENT_MUTATION, {
    refetchQueries: [{ query: DOCTOR_CERTIFICATES_QUERY }],
    awaitRefetchQueries: true,
  });

  const activeDocumentTypes = useMemo(
    () =>
      (data?.verificationDocumentTypes ?? []).filter(
        (documentType) => documentType.isActive,
      ),
    [data?.verificationDocumentTypes],
  );
  const submittedCertificates = useMemo(
    () => data?.mySubmittedCertificates ?? [],
    [data?.mySubmittedCertificates],
  );

  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState("");
  const [issuer, setIssuer] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedDocumentType =
    activeDocumentTypes.find(
      (documentType) => documentType.id === selectedDocumentTypeId,
    ) ?? null;

  const submittedByDocumentTypeId = useMemo(() => {
    return new Set(
      submittedCertificates
        .map((certificate) => certificate.documentType?.id)
        .filter(Boolean),
    );
  }, [submittedCertificates]);

  const selectDocumentType = (documentType: DoctorVerificationDocumentType) => {
    if (!CAN_SUBMIT_DOCUMENTS) {
      return;
    }

    setSelectedDocumentTypeId(documentType.id);
    setFormError(null);
    setSuccessMessage(null);
  };

  const submitCertificate = async () => {
    if (!CAN_SUBMIT_DOCUMENTS) {
      setFormError("Document uploads are closed after admin acceptance.");
      return;
    }

    if (!selectedDocumentTypeId) {
      setFormError("Choose the document type you want to submit.");
      return;
    }

    if (!fileUrl.trim()) {
      setFormError("Add the document file URL.");
      return;
    }

    if (!issuer.trim()) {
      setFormError("Add the issuing organization.");
      return;
    }

    try {
      setFormError(null);
      await submitDocument({
        variables: {
          input: {
            documentTypeId: selectedDocumentTypeId,
            fileUrl: fileUrl.trim(),
            issuer: issuer.trim(),
            notes: notes.trim() || null,
          },
        },
      });
      setSuccessMessage("Certificate submitted for admin review.");
      setIssuer("");
      setFileUrl("");
      setNotes("");
      setSelectedDocumentTypeId("");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not submit this certificate.";
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
            <Text style={styles.eyebrow}>Verification</Text>
            <Text style={styles.title}>Certificates</Text>
            <Text style={styles.subtitle}>
              Review the documents required for certification and submit your
              files for admin confirmation.
            </Text>
          </View>

          {!CAN_SUBMIT_DOCUMENTS ? (
            <View style={styles.lockedBanner}>
              <MaterialIcons
                color={Colors.success}
                name="verified"
                size={22}
              />
              <Text style={styles.lockedText}>
                Your profile has been accepted. New document uploads are closed.
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.stateText}>Loading certificates...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error.message}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => refetch()}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !error ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Required documents</Text>
                {activeDocumentTypes.length === 0 ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateText}>
                      No verification documents are configured yet.
                    </Text>
                  </View>
                ) : null}

                {activeDocumentTypes.map((documentType) => {
                  const isSelected =
                    selectedDocumentTypeId === documentType.id;
                  const isSubmitted = submittedByDocumentTypeId.has(
                    documentType.id,
                  );

                  return (
                    <Pressable
                      accessibilityRole="button"
                      disabled={!CAN_SUBMIT_DOCUMENTS}
                      key={documentType.id}
                      onPress={() => selectDocumentType(documentType)}
                      style={[
                        styles.documentCard,
                        isSelected && styles.selectedDocumentCard,
                        !CAN_SUBMIT_DOCUMENTS && styles.disabledCard,
                      ]}
                    >
                      <View style={styles.cardIcon}>
                        <MaterialIcons
                          color={
                            isSubmitted ? Colors.success : Colors.primarySoft
                          }
                          name={isSubmitted ? "check-circle" : "description"}
                          size={24}
                        />
                      </View>
                      <View style={styles.documentInfo}>
                        <View style={styles.documentTitleRow}>
                          <Text style={styles.documentName}>
                            {documentType.name}
                          </Text>
                          {documentType.isRequired ? (
                            <Text style={styles.requiredPill}>Required</Text>
                          ) : null}
                        </View>
                        {documentType.description ? (
                          <Text style={styles.documentDescription}>
                            {documentType.description}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.documentStatus,
                            isSubmitted && styles.submittedStatus,
                          ]}
                        >
                          {isSubmitted
                            ? "Submitted"
                            : "Waiting for submission"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {CAN_SUBMIT_DOCUMENTS ? (
                <View style={styles.formPanel}>
                  <Text style={styles.formTitle}>Submit document</Text>
                  <Text style={styles.formHint}>
                    {selectedDocumentType
                      ? selectedDocumentType.name
                      : "Choose a required document above to begin."}
                  </Text>

                  <Text style={styles.label}>Issuer</Text>
                  <TextInput
                    placeholder="Issuing organization"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    value={issuer}
                    onChangeText={setIssuer}
                  />

                  <Text style={styles.label}>Document URL</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    placeholder="https://..."
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    value={fileUrl}
                    onChangeText={setFileUrl}
                  />

                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    multiline
                    placeholder="Optional notes for admin review"
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
                    accessibilityRole="button"
                    disabled={submitting}
                    onPress={submitCertificate}
                    style={[
                      styles.submitButton,
                      submitting && styles.disabledButton,
                    ]}
                  >
                    {submitting ? (
                      <ActivityIndicator color={Colors.text} />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        Submit certificate
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Submitted certificates</Text>
                {submittedCertificates.length === 0 ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateText}>
                      You have not submitted any certificates yet.
                    </Text>
                  </View>
                ) : null}

                {submittedCertificates.map((certificate) => (
                  <View key={certificate.id} style={styles.certificateCard}>
                    <View style={styles.certificateHeader}>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>
                          {certificate.title}
                        </Text>
                        <Text style={styles.documentDescription}>
                          {certificate.documentType?.name ??
                            "Verification document"}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="link"
                        onPress={() => Linking.openURL(certificate.fileUrl)}
                        style={styles.openButton}
                      >
                        <MaterialIcons
                          color={Colors.text}
                          name="open-in-new"
                          size={18}
                        />
                        <Text style={styles.openButtonText}>Open</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.metaText}>
                      Issuer: {certificate.issuer}
                    </Text>
                    {certificate.notes ? (
                      <Text style={styles.metaText}>{certificate.notes}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
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
    gap: 18,
    padding: 24,
    paddingBottom: 40,
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
  lockedBanner: {
    alignItems: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  lockedText: {
    color: Colors.text,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: "center",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  documentCard: {
    alignItems: "flex-start",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  selectedDocumentCard: {
    borderColor: Colors.accent,
  },
  disabledCard: {
    opacity: 0.7,
  },
  cardIcon: {
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  documentInfo: {
    flex: 1,
    gap: 5,
  },
  documentTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  documentName: {
    color: Colors.text,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  requiredPill: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    color: Colors.primarySoft,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  documentDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  documentStatus: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  submittedStatus: {
    color: Colors.success,
  },
  formPanel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  formTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  formHint: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
    minHeight: 92,
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
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 50,
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
  certificateCard: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  certificateHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  openButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  openButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
