import { useMutation, useQuery } from "@apollo/client";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenShell } from "@/components/screen-shell";
import { Colors } from "@/constants/theme";
import {
  DELETE_SCHEDULE_MUTATION,
  DeleteScheduleMutationData,
  DeleteScheduleMutationVariables,
  DoctorSchedule,
  MY_SCHEDULES_QUERY,
  MySchedulesQueryData,
} from "@/graphql/schedules";
import { getLocalSchedules, deleteLocalSchedule } from "@/lib/schedule-store";

export default function AvailabilityConfigsScreen() {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [localConfigs, setLocalConfigs] = useState<DoctorSchedule[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // GraphQL query
  const { data, loading, error, refetch } =
    useQuery<MySchedulesQueryData>(MY_SCHEDULES_QUERY, {
      fetchPolicy: "network-only",
      onError: () => {
        setIsOffline(true);
      },
      onCompleted: () => {
        setIsOffline(false);
      },
    });

  // GraphQL delete mutation
  const [deleteSchedule] = useMutation<
    DeleteScheduleMutationData,
    DeleteScheduleMutationVariables
  >(DELETE_SCHEDULE_MUTATION, {
    refetchQueries: [{ query: MY_SCHEDULES_QUERY }],
  });

  // Load local schedules on focus or when network fails
  const loadLocalSchedules = useCallback(async () => {
    try {
      const local = await getLocalSchedules();
      setLocalConfigs(local);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocalSchedules();
      if (!isOffline) {
        refetch().catch(() => setIsOffline(true));
      }
    }, [loadLocalSchedules, isOffline, refetch])
  );

  // Compute final configurations list (GraphQL or Local fallback)
  const configurations = useMemo(() => {
    if (isOffline || error) {
      return [...localConfigs].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    }
    return [...(data?.mySchedules ?? [])].sort((a, b) =>
      b.startsAt.localeCompare(a.startsAt)
    );
  }, [isOffline, error, localConfigs, data]);

  // Find the currently active configuration
  const activeConfigId = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const workingConfigs = configurations.filter((c) => c.status === "WORKING");
    // Sort by startsAt descending (latest first) to pick the most recent valid one
    const sorted = [...workingConfigs].sort((a, b) =>
      b.startsAt.localeCompare(a.startsAt)
    );

    const active = sorted.find((s) => {
      const isStarted = s.startsAt <= todayStr;
      const isNotEnded = !s.endsAt || s.endsAt >= todayStr;
      return isStarted && isNotEnded;
    });

    return active?.id ?? null;
  }, [configurations]);

  const handleCreateNew = () => {
    router.push("/(main)/(doctor)/availability-form");
  };

  const handleEdit = (id: string) => {
    router.push({
      pathname: "/(main)/(doctor)/availability-form",
      params: { id },
    });
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Configuration",
      "Are you sure you want to delete this availability configuration?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(id);
            try {
              if (isOffline || id.startsWith("local-") || id.startsWith("mock-")) {
                await deleteLocalSchedule(id);
                await loadLocalSchedules();
              } else {
                await deleteSchedule({ variables: { scheduleId: id } });
              }
              Alert.alert("Success", "Configuration deleted successfully.");
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Error deleting schedule";
              // Fallback to local delete if API fails mid-way
              await deleteLocalSchedule(id);
              await loadLocalSchedules();
              setIsOffline(true);
            } finally {
              setIsDeleting(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Group slots by day of week for nicer UI presentation
  const getGroupedSlots = (slots: any[]) => {
    const order = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const grouped: { [key: string]: string[] } = {};

    slots.forEach((slot) => {
      if (!grouped[slot.dayOfWeek]) {
        grouped[slot.dayOfWeek] = [];
      }
      grouped[slot.dayOfWeek].push(`${slot.startTime} - ${slot.endTime}`);
    });

    return order
      .filter((day) => grouped[day])
      .map((day) => ({
        day: day.charAt(0) + day.slice(1).toLowerCase(),
        intervals: grouped[day],
      }));
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Schedules</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Availability</Text>
              <Pressable style={styles.addButton} onPress={handleCreateNew}>
                <MaterialIcons color={Colors.text} name="add" size={20} />
                <Text style={styles.addButtonText}>Add New</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              Configure your working days and active time slots. Highlighted blocks
              denote your current active availability.
            </Text>
          </View>

          {isOffline && (
            <View style={styles.offlineBanner}>
              <MaterialIcons color={Colors.accent} name="cloud-off" size={20} />
              <Text style={styles.offlineText}>
                Offline Mode: Managing local storage availability.
              </Text>
            </View>
          )}

          {loading && !isOffline ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.stateText}>Fetching availability configs...</Text>
            </View>
          ) : configurations.length === 0 ? (
            <View style={styles.stateCard}>
              <MaterialIcons
                color={Colors.textMuted}
                name="event-busy"
                size={48}
              />
              <Text style={styles.stateText}>
                No configurations found. Tap "Add New" to build your availability!
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {configurations.map((config) => {
                const isActive = config.id === activeConfigId;
                const isVacation = config.status === "VACATION";
                const isDayOff = config.status === "DAY_OFF";
                const grouped = getGroupedSlots(config.slots);

                return (
                  <View
                    key={config.id}
                    style={[
                      styles.configCard,
                      isActive && styles.configCardActive,
                      isVacation && styles.configCardVacation,
                    ]}
                  >
                    {/* Header Info */}
                    <View style={styles.cardHeader}>
                      <View style={styles.datesContainer}>
                        <Text style={styles.dateLabel}>
                          {formatDate(config.startsAt)}
                          {config.endsAt ? ` to ${formatDate(config.endsAt)}` : " onwards"}
                        </Text>
                        <View style={styles.badgeRow}>
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Text style={styles.activeBadgeText}>
                                Current Active
                              </Text>
                            </View>
                          )}
                          {isVacation && (
                            <View style={styles.vacationBadge}>
                              <Text style={styles.vacationBadgeText}>
                                Vacation / Off
                              </Text>
                            </View>
                          )}
                          {isDayOff && (
                            <View style={styles.dayOffBadge}>
                              <Text style={styles.dayOffBadgeText}>Day Off</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={isDeleting !== null}
                          onPress={() => handleEdit(config.id)}
                          style={styles.actionIconButton}
                        >
                          <MaterialIcons
                            color={Colors.primarySoft}
                            name="edit"
                            size={20}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={isDeleting !== null}
                          onPress={() => handleDelete(config.id)}
                          style={styles.actionIconButton}
                        >
                          {isDeleting === config.id ? (
                            <ActivityIndicator color={Colors.danger} size="small" />
                          ) : (
                            <MaterialIcons
                              color={Colors.danger}
                              name="delete-outline"
                              size={20}
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>

                    {/* Working Hours Summary */}
                    {!isVacation && !isDayOff && grouped.length > 0 ? (
                      <View style={styles.slotsGrid}>
                        {grouped.map((dayGroup) => (
                          <View key={dayGroup.day} style={styles.slotRow}>
                            <Text style={styles.slotDay}>{dayGroup.day}</Text>
                            <View style={styles.intervalsList}>
                              {dayGroup.intervals.map((interval, i) => (
                                <View key={i} style={styles.intervalChip}>
                                  <Text style={styles.intervalChipText}>
                                    {interval}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : !isVacation && !isDayOff ? (
                      <Text style={styles.noSlotsText}>No working hours defined.</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
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
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    gap: 6,
    paddingTop: 12,
  },
  eyebrow: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  offlineText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  stateCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 32,
    minHeight: 200,
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    gap: 16,
  },
  configCard: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  configCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.backgroundElevated,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  configCardVacation: {
    borderColor: Colors.border,
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  datesContainer: {
    gap: 6,
    flex: 1,
  },
  dateLabel: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  activeBadge: {
    backgroundColor: Colors.accent + "18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  activeBadgeText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  vacationBadge: {
    backgroundColor: Colors.danger + "18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  vacationBadgeText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dayOffBadge: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  dayOffBadgeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actionRow: {
    flexDirection: "row",
    gap: 4,
  },
  actionIconButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 10,
    width: 36,
    height: 36,
  },
  slotsGrid: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    gap: 12,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  slotDay: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    width: 88,
    paddingTop: 4,
  },
  intervalsList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  intervalChip: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  intervalChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  noSlotsText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
    paddingTop: 8,
  },
});
