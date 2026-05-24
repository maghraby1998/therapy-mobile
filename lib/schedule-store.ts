import * as SecureStore from "expo-secure-store";
import { DoctorSchedule, CreateScheduleInput } from "@/graphql/schedules";

const SCHEDULES_STORE_KEY = "therapy-mobile.doctor-schedules";

// Generates initial mock schedules relative to current date
function generateSeedSchedules(): DoctorSchedule[] {
  const today = new Date();

  // 1. Current Active Schedule (started 5 days ago, runs indefinitely)
  const currentStart = new Date(today);
  currentStart.setDate(today.getDate() - 5);
  const currentStartStr = currentStart.toISOString().split("T")[0];

  // 2. Future Schedule (starts in 10 days, runs for a week)
  const futureStart = new Date(today);
  futureStart.setDate(today.getDate() + 10);
  const futureStartStr = futureStart.toISOString().split("T")[0];

  const futureEnd = new Date(today);
  futureEnd.setDate(today.getDate() + 17);
  const futureEndStr = futureEnd.toISOString().split("T")[0];

  return [
    {
      id: "mock-schedule-active",
      startsAt: currentStartStr,
      endsAt: null,
      status: "WORKING",
      slots: [
        {
          id: "slot-mon-1",
          dayOfWeek: "MONDAY",
          startTime: "09:00",
          endTime: "13:00",
        },
        {
          id: "slot-mon-2",
          dayOfWeek: "MONDAY",
          startTime: "14:30",
          endTime: "18:00",
        },
        {
          id: "slot-wed-1",
          dayOfWeek: "WEDNESDAY",
          startTime: "09:00",
          endTime: "13:00",
        },
        {
          id: "slot-wed-2",
          dayOfWeek: "WEDNESDAY",
          startTime: "14:30",
          endTime: "18:00",
        },
        {
          id: "slot-fri-1",
          dayOfWeek: "FRIDAY",
          startTime: "10:00",
          endTime: "15:00",
        },
      ],
    },
    {
      id: "mock-schedule-vacation",
      startsAt: futureStartStr,
      endsAt: futureEndStr,
      status: "VACATION",
      slots: [],
    },
  ];
}

export async function getLocalSchedules(): Promise<DoctorSchedule[]> {
  try {
    const data = await SecureStore.getItemAsync(SCHEDULES_STORE_KEY);
    if (!data) {
      const seed = generateSeedSchedules();
      await SecureStore.setItemAsync(SCHEDULES_STORE_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read local schedules", error);
    return generateSeedSchedules();
  }
}

export async function saveLocalSchedule(
  input: CreateScheduleInput,
  id?: string
): Promise<DoctorSchedule> {
  const list = await getLocalSchedules();
  const today = new Date();

  // Create slots with IDs
  const slotsWithIds = (input.slots ?? []).map((slot, index) => ({
    id: slot.id || `local-slot-${Date.now()}-${index}`,
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
  } as any));

  if (id) {
    // Modify existing
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      const updated: DoctorSchedule = {
        id,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        status: input.status,
        slots: slotsWithIds,
      };
      list[index] = updated;
      await SecureStore.setItemAsync(SCHEDULES_STORE_KEY, JSON.stringify(list));
      return updated;
    }
  }

  // Create new
  const newSchedule: DoctorSchedule = {
    id: `local-schedule-${Date.now()}`,
    startsAt: input.startsAt,
    endsAt: input.endsAt ?? null,
    status: input.status,
    slots: slotsWithIds,
  };

  list.push(newSchedule);
  await SecureStore.setItemAsync(SCHEDULES_STORE_KEY, JSON.stringify(list));
  return newSchedule;
}

export async function deleteLocalSchedule(id: string): Promise<boolean> {
  const list = await getLocalSchedules();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length !== list.length) {
    await SecureStore.setItemAsync(SCHEDULES_STORE_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}
