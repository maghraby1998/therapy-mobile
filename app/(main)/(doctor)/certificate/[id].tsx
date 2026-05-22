import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMutation, useQuery } from "@apollo/client";
import { useState, useMemo, useEffect } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { ReactNativeFile } from "apollo-upload-client";

import { ScreenShell } from "@/components/screen-shell";
import { Colors } from "@/constants/theme";
import {
  DOCTOR_CERTIFICATES_QUERY,
  DoctorCertificatesQueryData,
  SUBMIT_DOCTOR_VERIFICATION_DOCUMENT_MUTATION,
  SubmitDoctorVerificationDocumentMutationData,
  SubmitDoctorVerificationDocumentMutationVariables,
} from "@/graphql/certificates";

const CAN_SUBMIT_DOCUMENTS = true;

export default function DoctorCertificateScreen() {
  const { id: documentTypeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, loading, error } =
    useQuery<DoctorCertificatesQueryData>(DOCTOR_CERTIFICATES_QUERY);
  const [submitDocument, { loading: submitting }] = useMutation<
    SubmitDoctorVerificationDocumentMutationData,
    SubmitDoctorVerificationDocumentMutationVariables
  >(SUBMIT_DOCTOR_VERIFICATION_DOCUMENT_MUTATION, {
    refetchQueries: [{ query: DOCTOR_CERTIFICATES_QUERY }],
    awaitRefetchQueries: true,
  });

  const documentType = useMemo(
    () =>
      data?.verificationDocumentTypes?.find(
        (dt) => dt.id === documentTypeId
      ),
    [data?.verificationDocumentTypes, documentTypeId]
  );

  const submittedCertificate = useMemo(
    () =>
      data?.mySubmittedCertificates?.find(
        (cert) => cert.documentType?.id === documentTypeId
      ),
    [data?.mySubmittedCertificates, documentTypeId]
  );

  const [issuer, setIssuer] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (submittedCertificate) {
      setIssuer(submittedCertificate.issuer);
      setFileUrl(submittedCertificate.fileUrl);
      setNotes(submittedCertificate.notes || "");
    }
  }, [submittedCertificate]);

  const submitCertificate = async () => {
    if (!CAN_SUBMIT_DOCUMENTS) {
      setFormError("Document uploads are closed after admin acceptance.");
      return;
    }

    if (!documentTypeId) {
      setFormError("Invalid document type.");
      return;
    }

    if (!selectedFile) {
      setFormError("Select a document file to upload.");
      return;
    }

    if (!issuer.trim()) {
      setFormError("Add the issuing organization.");
      return;
    }

    const file = new ReactNativeFile({
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType ?? "application/octet-stream",
    });

    try {
      setFormError(null);
      await submitDocument({
        variables: {
          input: {
            documentTypeId,
            file,
            issuer: issuer.trim(),
            notes: notes.trim() || null,
          },
        },
      });
      setSuccessMessage("Certificate submitted for admin review.");
      // Navigate back after successful submission
      setTimeout(() => router.back(), 1500);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not submit this certificate.";
      setFormError(message);
    }
  };

  const isAlreadySubmitted = !!submittedCertificate;
  const isFormDisabled = isAlreadySubmitted || !CAN_SUBMIT_DOCUMENTS || submitting;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setFormError(null);
      }
    } catch (err) {
      setFormError("Failed to pick document.");
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
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <MaterialIcons color={Colors.text} name="arrow-back" size={24} />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.eyebrow}>Document Details</Text>
              <Text style={styles.title} numberOfLines={2}>
                {documentType?.name || "Certificate"}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={styles.stateText}>Loading document details...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          ) : null}

          {!loading && !error && documentType ? (
            <>
              {isAlreadySubmitted ? (
                <View style={styles.submittedBanner}>
                  <MaterialIcons color={Colors.success} name="check-circle" size={22} />
                  <Text style={styles.submittedBannerText}>
                    This document has already been submitted.
                  </Text>
                </View>
              ) : null}

              {!CAN_SUBMIT_DOCUMENTS && !isAlreadySubmitted ? (
                <View style={styles.lockedBanner}>
                  <MaterialIcons color={Colors.success} name="verified" size={22} />
                  <Text style={styles.lockedText}>
                    Your profile has been accepted. New document uploads are closed.
                  </Text>
                </View>
              ) : null}

              <View style={styles.formPanel}>
                <Text style={styles.formTitle}>
                  {isAlreadySubmitted ? "Submitted Values" : "Submit document"}
                </Text>
                <Text style={styles.formHint}>
                  {documentType.description || "Please fill in the required details below."}
                </Text>

                <Text style={styles.label}>Issuer</Text>
                <TextInput
                  editable={!isFormDisabled}
                  placeholder="Issuing organization"
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.input, isFormDisabled && styles.disabledInput]}
                  value={issuer}
                  onChangeText={setIssuer}
                />

                <Text style={styles.label}>Document File</Text>
                {isAlreadySubmitted ? (
                  <View style={[styles.input, styles.disabledInput]}>
                    <Text style={styles.disabledInputValue} numberOfLines={1}>
                      {fileUrl}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isFormDisabled}
                    onPress={pickDocument}
                    style={[styles.filePickerButton, isFormDisabled && styles.disabledInput]}
                  >
                    <MaterialIcons color={Colors.primary} name="upload-file" size={24} />
                    <Text style={styles.filePickerText} numberOfLines={1}>
                      {selectedFile ? selectedFile.name : "Tap to select a document..."}
                    </Text>
                  </Pressable>
                )}

                <Text style={styles.label}>Notes</Text>
                <TextInput
                  editable={!isFormDisabled}
                  multiline
                  placeholder={isFormDisabled ? "" : "Optional notes for admin review"}
                  placeholderTextColor={Colors.textMuted}
                  style={[styles.input, styles.notesInput, isFormDisabled && styles.disabledInput]}
                  value={notes}
                  onChangeText={setNotes}
                />

                {formError ? (
                  <Text style={styles.errorText}>{formError}</Text>
                ) : null}
                {successMessage ? (
                  <Text style={styles.successText}>{successMessage}</Text>
                ) : null}

                {!isAlreadySubmitted && CAN_SUBMIT_DOCUMENTS ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isFormDisabled}
                    onPress={submitCertificate}
                    style={[
                      styles.submitButton,
                      isFormDisabled && styles.disabledButton,
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
                ) : null}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingTop: 12,
  },
  backButton: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
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
    fontSize: 24,
    fontWeight: "800",
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
  submittedBanner: {
    alignItems: "center",
    backgroundColor: Colors.success + "15",
    borderColor: Colors.success + "40",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  submittedBannerText: {
    color: Colors.success,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
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
  disabledInput: {
    opacity: 0.6,
    backgroundColor: Colors.surfaceMuted,
  },
  disabledInputValue: {
    color: Colors.text,
    fontSize: 15,
  },
  filePickerButton: {
    alignItems: "center",
    backgroundColor: Colors.primarySoft + "20",
    borderColor: Colors.primarySoft,
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filePickerText: {
    color: Colors.primary,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
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
});
