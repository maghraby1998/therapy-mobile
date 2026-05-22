import { useMutation, useQuery } from "@apollo/client";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
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
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);
  const [showSubmittedOnly, setShowSubmittedOnly] = useState(false);

  const { data, loading, error, refetch } =
    useQuery<DoctorCertificatesQueryData>(DOCTOR_CERTIFICATES_QUERY);
  const [submitDocument, { loading: submitting }] = useMutation<
    SubmitDoctorVerificationDocumentMutationData,
    SubmitDoctorVerificationDocumentMutationVariables
  >(SUBMIT_DOCTOR_VERIFICATION_DOCUMENT_MUTATION, {
    refetchQueries: [{ query: DOCTOR_CERTIFICATES_QUERY }],
    awaitRefetchQueries: true,
  });

  const submittedCertificates = useMemo(
    () => data?.mySubmittedCertificates ?? [],
    [data?.mySubmittedCertificates],
  );

  const submittedByDocumentTypeId = useMemo(() => {
    return new Set(
      submittedCertificates
        .map((certificate) => certificate.documentType?.id)
        .filter(Boolean),
    );
  }, [submittedCertificates]);

  const activeDocumentTypes = useMemo(
    () => {
      let types = (data?.verificationDocumentTypes ?? []).filter(
        (documentType) => documentType.isActive,
      );
      if (showRequiredOnly) {
        types = types.filter((documentType) => documentType.isRequired);
      }
      if (showSubmittedOnly) {
        types = types.filter((documentType) => submittedByDocumentTypeId.has(documentType.id));
      }
      return types;
    },
    [data?.verificationDocumentTypes, showRequiredOnly, showSubmittedOnly, submittedByDocumentTypeId],
  );

  const router = useRouter();

  const selectDocumentType = (documentType: DoctorVerificationDocumentType) => {
    router.push({
      pathname: "/(main)/(doctor)/certificate/[id]",
      params: {
        id: documentType.id,
      },
    });
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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Required documents</Text>
                  <View style={styles.filtersContainer}>
                    <View style={styles.filterRow}>
                      <Text style={styles.filterText}>Show required only</Text>
                      <Switch
                        onValueChange={setShowRequiredOnly}
                        value={showRequiredOnly}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : showRequiredOnly ? '#FFFFFF' : '#f4f3f4'}
                      />
                    </View>
                    <View style={styles.filterRow}>
                      <Text style={styles.filterText}>Show submitted only</Text>
                      <Switch
                        onValueChange={setShowSubmittedOnly}
                        value={showSubmittedOnly}
                        trackColor={{ false: Colors.border, true: Colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : showSubmittedOnly ? '#FFFFFF' : '#f4f3f4'}
                      />
                    </View>
                  </View>
                </View>
                {activeDocumentTypes.length === 0 ? (
                  <View style={styles.stateCard}>
                    <Text style={styles.stateText}>
                      No verification documents are configured yet.
                    </Text>
                  </View>
                ) : null}

                {activeDocumentTypes.map((documentType) => {
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
                        <View
                          style={[
                            styles.statusBadge,
                            isSubmitted
                              ? styles.statusBadgeSubmitted
                              : styles.statusBadgeNotSubmitted,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isSubmitted
                                ? styles.statusBadgeTextSubmitted
                                : styles.statusBadgeTextNotSubmitted,
                            ]}
                          >
                            {isSubmitted ? "Submitted" : "Not Submitted"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  filtersContainer: {
    gap: 8,
    alignItems: "flex-end",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeSubmitted: {
    backgroundColor: Colors.success + "20",
  },
  statusBadgeNotSubmitted: {
    backgroundColor: Colors.surfaceMuted,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeTextSubmitted: {
    color: Colors.success,
  },
  statusBadgeTextNotSubmitted: {
    color: Colors.textMuted,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
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
