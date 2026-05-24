import { useMutation } from "@apollo/client";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from "react-native";

import { ScreenShell } from "@/components/screen-shell";
import { Colors } from "@/constants/theme";
import {
  CREATE_SCHEDULE_MUTATION,
  CreateScheduleMutationData,
  CreateScheduleMutationVariables,
  DayOfWeek,
  DoctorSchedule,
  MY_SCHEDULES_QUERY,
  ScheduleSlotInput,
  ScheduleStatus,
  UPDATE_SCHEDULE_MUTATION,
  UpdateScheduleMutationData,
  UpdateScheduleMutationVariables,
} from "@/graphql/schedules";
import { getLocalSchedules, saveLocalSchedule } from "@/lib/schedule-store";

// Generate standard 24-hour time presets in 30-minute steps
const PRESET_TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = h.toString().padStart(2, "0");
  PRESET_TIMES.push(`${hh}:00`);
  PRESET_TIMES.push(`${hh}:30`);
}

const WEEKDAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Sun", value: "SUNDAY" },
  { label: "Mon", value: "MONDAY" },
  { label: "Tue", value: "TUESDAY" },
  { label: "Wed", value: "WEDNESDAY" },
  { label: "Thu", value: "THURSDAY" },
  { label: "Fri", value: "FRIDAY" },
  { label: "Sat", value: "SATURDAY" },
];

export default function AvailabilityFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id as string | undefined;

  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Form states
  const [startsAt, setStartsAt] = useState("");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [status, setStatus] = useState<ScheduleStatus>("WORKING");
  const [activeDays, setActiveDays] = useState<DayOfWeek[]>([]);
  const [slots, setSlots] = useState<{
    [key in DayOfWeek]?: { startTime: string; endTime: string }[];
  }>({});

  // Active time-selector modal state
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    day: DayOfWeek | null;
    index: number | null;
    type: "start" | "end" | null;
  }>({
    visible: false,
    day: null,
    index: null,
    type: null,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Apollo mutations
  const [createSchedule] = useMutation<
    CreateScheduleMutationData,
    CreateScheduleMutationVariables
  >(CREATE_SCHEDULE_MUTATION, {
    refetchQueries: [{ query: MY_SCHEDULES_QUERY }],
  });

  const [updateSchedule] = useMutation<
    UpdateScheduleMutationData,
    UpdateScheduleMutationVariables
  >(UPDATE_SCHEDULE_MUTATION, {
    refetchQueries: [{ query: MY_SCHEDULES_QUERY }],
  });

  // Load initial data if editing
  useEffect(() => {
    async function loadData() {
      if (!editId) {
        // Set default values for new config
        const todayStr = new Date().toISOString().split("T")[0];
        setStartsAt(todayStr);
        return;
      }

      setLoading(true);
      try {
        const local = await getLocalSchedules();
        const existing = local.find((c) => c.id === editId);
        if (existing) {
          setStartsAt(existing.startsAt);
          if (existing.endsAt) {
            setHasEndDate(true);
            setEndsAt(existing.endsAt);
          } else {
            setHasEndDate(false);
            setEndsAt("");
          }
          setStatus(existing.status);

          // Build days and slots map
          const active: DayOfWeek[] = [];
          const slotsMap: { [key in DayOfWeek]?: { startTime: string; endTime: string }[] } = {};

          existing.slots.forEach((slot) => {
            if (!active.includes(slot.dayOfWeek)) {
              active.push(slot.dayOfWeek);
            }
            if (!slotsMap[slot.dayOfWeek]) {
              slotsMap[slot.dayOfWeek] = [];
            }
            slotsMap[slot.dayOfWeek]?.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          });

          setActiveDays(active);
          setSlots(slotsMap);
        }
      } catch (err) {
        console.error("Failed to load edit config", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [editId]);

  const handleToggleDay = (day: DayOfWeek) => {
    setFormError(null);
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
      const updatedSlots = { ...slots };
      delete updatedSlots[day];
      setSlots(updatedSlots);
    } else {
      setActiveDays([...activeDays, day]);
      setSlots({
        ...slots,
        [day]: [{ startTime: "09:00", endTime: "17:00" }],
      });
    }
  };

  const handleAddSlot = (day: DayOfWeek) => {
    setFormError(null);
    const daySlots = slots[day] || [];
    // Auto-create next slot 30 mins after previous, or default 09:00 - 17:00
    let nextStart = "09:00";
    let nextEnd = "17:00";

    if (daySlots.length > 0) {
      const last = daySlots[daySlots.length - 1];
      nextStart = last.endTime;
      // End is 2 hours after start, cap at 23:30
      const hour = parseInt(nextStart.split(":")[0]);
      const min = nextStart.split(":")[1];
      const endHour = Math.min(hour + 2, 23);
      nextEnd = `${endHour.toString().padStart(2, "0")}:${min}`;
    }

    setSlots({
      ...slots,
      [day]: [...daySlots, { startTime: nextStart, endTime: nextEnd }],
    });
  };

  const handleRemoveSlot = (day: DayOfWeek, index: number) => {
    setFormError(null);
    const daySlots = slots[day] || [];
    const updated = daySlots.filter((_, i) => i !== index);

    if (updated.length === 0) {
      // Deactivate day if it has no slots left
      setActiveDays(activeDays.filter((d) => d !== day));
      const updatedSlots = { ...slots };
      delete updatedSlots[day];
      setSlots(updatedSlots);
    } else {
      setSlots({
        ...slots,
        [day]: updated,
      });
    }
  };

  const openTimePicker = (day: DayOfWeek, index: number, type: "start" | "end") => {
    setPickerModal({
      visible: true,
      day,
      index,
      type,
    });
  };

  const handleSelectTime = (time: string) => {
    const { day, index, type } = pickerModal;
    if (day && index !== null && type) {
      const daySlots = [...(slots[day] || [])];
      if (type === "start") {
        daySlots[index] = { ...daySlots[index], startTime: time };
      } else {
        daySlots[index] = { ...daySlots[index], endTime: time };
      }
      setSlots({
        ...slots,
        [day]: daySlots,
      });
    }
    setPickerModal({ visible: false, day: null, index: null, type: null });
  };

  const validateForm = () => {
    // 1. Validate start date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startsAt)) {
      setFormError("Start date must be in YYYY-MM-DD format.");
      return false;
    }

    // 2. Validate optional end date
    if (hasEndDate) {
      if (!dateRegex.test(endsAt)) {
        setFormError("End date must be in YYYY-MM-DD format.");
        return false;
      }
      if (endsAt <= startsAt) {
        setFormError("End date must be strictly after the start date.");
        return false;
      }
    }

    // 3. If WORKING, validate slots
    if (status === "WORKING") {
      if (activeDays.length === 0) {
        setFormError("Please select at least one active working day.");
        return false;
      }

      for (const day of activeDays) {
        const daySlots = slots[day] || [];
        if (daySlots.length === 0) {
          setFormError(`Please define at least one time interval for ${day}.`);
          return false;
        }

        // Validate individual slot interval
        for (let i = 0; i < daySlots.length; i++) {
          const slot = daySlots[i];
          if (slot.startTime >= slot.endTime) {
            setFormError(
              `Interval ${i + 1} on ${day.toLowerCase()} has invalid timing: start time must be before end time.`
            );
            return false;
          }

          // Check overlap with other slots on the same day
          for (let j = i + 1; j < daySlots.length; j++) {
            const other = daySlots[j];
            const overlap =
              slot.startTime < other.endTime && other.startTime < slot.endTime;
            if (overlap) {
              setFormError(
                `Overlapping time intervals detected on ${day.toLowerCase()}.`
              );
              return false;
            }
          }
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    setFormError(null);
    if (!validateForm()) return;

    setLoading(true);

    // Transform slots map back into input array
    const slotsInput: ScheduleSlotInput[] = [];
    if (status === "WORKING") {
      activeDays.forEach((day) => {
        const daySlots = slots[day] || [];
        daySlots.forEach((slot) => {
          slotsInput.push({
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        });
      });
    }

    const inputData = {
      startsAt,
      endsAt: hasEndDate && endsAt ? endsAt : null,
      status,
      slots: slotsInput,
    };

    try {
      if (isOffline || editId?.startsWith("local-") || editId?.startsWith("mock-")) {
        // Save locally
        await saveLocalSchedule(inputData, editId);
      } else {
        // Save to GraphQL API
        if (editId) {
          await updateSchedule({
            variables: {
              id: editId,
              input: inputData,
            },
          });
        } else {
          await createSchedule({
            variables: {
              input: inputData,
            },
          });
        }
      }
      router.back();
    } catch (err) {
      console.warn("GraphQL Mutation failed, transparently saving locally:", err);
      // Fallback local save if network errors
      await saveLocalSchedule(inputData, editId);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              {editId ? "Edit Config" : "New Config"}
            </Text>
            <Text style={styles.title}>
              {editId ? "Availability Settings" : "Define Availability"}
            </Text>
            <Text style={styles.subtitle}>
              Configure date scopes, work shifts, and time windows. Avoid overlapping slots.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Scope & Schedule Type</Text>

            {/* Date Inputs */}
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <Text style={styles.label}>Start Date *</Text>
                <TextInput
                  autoCapitalize="none"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.input}
                  value={startsAt}
                  onChangeText={setStartsAt}
                />
              </View>

              <View style={styles.dateCol}>
                <View style={styles.toggleRow}>
                  <Text style={styles.label}>Set End Date</Text>
                  <Switch
                    onValueChange={setHasEndDate}
                    value={hasEndDate}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : hasEndDate ? '#FFFFFF' : '#f4f3f4'}
                  />
                </View>
                {hasEndDate ? (
                  <TextInput
                    autoCapitalize="none"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.input}
                    value={endsAt}
                    onChangeText={setEndsAt}
                  />
                ) : (
                  <View style={[styles.input, styles.inputDisabled]}>
                    <Text style={styles.inputDisabledText}>Indefinite</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Picker (Working vs Vacation) */}
            <View style={styles.statusField}>
              <Text style={styles.label}>Schedule Status</Text>
              <View style={styles.statusSelector}>
                {(["WORKING", "VACATION"] as ScheduleStatus[]).map((opt) => {
                  const selected = status === opt;
                  return (
                    <Pressable
                      key={opt}
                      style={[
                        styles.statusOption,
                        selected && styles.statusOptionSelected,
                      ]}
                      onPress={() => setStatus(opt)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          selected && styles.statusOptionTextSelected,
                        ]}
                      >
                        {opt === "WORKING" ? "Working Availability" : "Vacation / Time Off"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Working Slots Config (Only if status is WORKING) */}
          {status === "WORKING" && (
            <View style={styles.slotsCard}>
              <Text style={styles.formSectionTitle}>Active Days & Shifts</Text>
              <Text style={styles.subtitleSmall}>
                Select the weekdays you work, then define availability blocks inside each day.
              </Text>

              {/* Weekday Chips */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => {
                  const isActive = activeDays.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      style={[
                        styles.dayChip,
                        isActive && styles.dayChipActive,
                      ]}
                      onPress={() => handleToggleDay(day.value)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          isActive && styles.dayChipTextActive,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Day Config Blocks */}
              <View style={styles.daysList}>
                {WEEKDAYS.filter((d) => activeDays.includes(d.value)).map((dayObj) => {
                  const daySlots = slots[dayObj.value] || [];
                  const label =
                    dayObj.value.charAt(0) + dayObj.value.slice(1).toLowerCase();

                  return (
                    <View key={dayObj.value} style={styles.dayBlock}>
                      <View style={styles.dayBlockHeader}>
                        <Text style={styles.dayBlockTitle}>{label}</Text>
                        <Pressable
                          style={styles.addSlotButton}
                          onPress={() => handleAddSlot(dayObj.value)}
                        >
                          <MaterialIcons color={Colors.primarySoft} name="add" size={16} />
                          <Text style={styles.addSlotButtonText}>Add Slot</Text>
                        </Pressable>
                      </View>

                      <View style={styles.intervalsBlock}>
                        {daySlots.map((slot, index) => (
                          <View key={index} style={styles.intervalRow}>
                            {/* Start Time button */}
                            <Pressable
                              style={styles.timeSelector}
                              onPress={() =>
                                openTimePicker(dayObj.value, index, "start")
                              }
                            >
                              <Text style={styles.timeSelectorText}>
                                {slot.startTime}
                              </Text>
                              <MaterialIcons
                                color={Colors.textMuted}
                                name="arrow-drop-down"
                                size={18}
                              />
                            </Pressable>

                            <Text style={styles.rangeDivider}>to</Text>

                            {/* End Time button */}
                            <Pressable
                              style={styles.timeSelector}
                              onPress={() =>
                                openTimePicker(dayObj.value, index, "end")
                              }
                            >
                              <Text style={styles.timeSelectorText}>
                                {slot.endTime}
                              </Text>
                              <MaterialIcons
                                color={Colors.textMuted}
                                name="arrow-drop-down"
                                size={18}
                              />
                            </Pressable>

                            {/* Delete button */}
                            <Pressable
                              onPress={() => handleRemoveSlot(dayObj.value, index)}
                              style={styles.removeSlotButton}
                            >
                              <MaterialIcons
                                color={Colors.danger}
                                name="close"
                                size={18}
                              />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionPanel}>
            {formError && <Text style={styles.errorText}>{formError}</Text>}

            <Pressable
              disabled={loading}
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
            >
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Custom Presets Time Picker Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={pickerModal.visible}
          onRequestClose={() =>
            setPickerModal({ visible: false, day: null, index: null, type: null })
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                Select {pickerModal.type === "start" ? "Start" : "End"} Time
              </Text>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                {PRESET_TIMES.map((time) => (
                  <Pressable
                    key={time}
                    style={styles.modalOption}
                    onPress={() => handleSelectTime(time)}
                  >
                    <Text style={styles.modalOptionText}>{time}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() =>
                  setPickerModal({
                    visible: false,
                    day: null,
                    index: null,
                    type: null,
                  })
                }
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
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
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  slotsCard: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  formSectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitleSmall: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateCol: {
    flex: 1,
    gap: 6,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 22,
  },
  label: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
  },
  inputDisabled: {
    backgroundColor: Colors.surfaceMuted,
    justifyContent: "center",
  },
  inputDisabledText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  statusField: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  statusSelector: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  statusOption: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusOptionSelected: {
    backgroundColor: Colors.primary,
  },
  statusOptionText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  statusOptionTextSelected: {
    color: Colors.text,
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 4,
  },
  dayChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  dayChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primarySoft,
  },
  dayChipText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  dayChipTextActive: {
    color: Colors.text,
  },
  daysList: {
    marginTop: 12,
    gap: 14,
  },
  dayBlock: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  dayBlockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayBlockTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  addSlotButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  addSlotButtonText: {
    color: Colors.primarySoft,
    fontSize: 12,
    fontWeight: "700",
  },
  intervalsBlock: {
    gap: 10,
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeSelectorText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  rangeDivider: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  removeSlotButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.danger + "18",
    borderRadius: 8,
    width: 36,
    height: 36,
  },
  actionPanel: {
    gap: 12,
    marginTop: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  saveButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 52,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 24,
    width: "100%",
    maxHeight: "75%",
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalScroll: {
    gap: 6,
  },
  modalOption: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalOptionText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  modalCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 14,
    height: 48,
    marginTop: 8,
  },
  modalCloseText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
