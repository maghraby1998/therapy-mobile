import { gql } from "@apollo/client";

export const MY_SCHEDULES_QUERY = gql`
  query MySchedules {
    mySchedules {
      id
      startsAt
      endsAt
      status
      slots {
        id
        dayOfWeek
        startTime
        endTime
      }
    }
  }
`;

export const CREATE_SCHEDULE_MUTATION = gql`
  mutation CreateSchedule($input: CreateScheduleInput!) {
    createSchedule(input: $input) {
      id
      startsAt
      endsAt
      status
      slots {
        id
        dayOfWeek
        startTime
        endTime
      }
    }
  }
`;

export const UPDATE_SCHEDULE_MUTATION = gql`
  mutation UpdateSchedule($id: ID!, $input: CreateScheduleInput!) {
    updateSchedule(id: $id, input: $input) {
      id
      startsAt
      endsAt
      status
      slots {
        id
        dayOfWeek
        startTime
        endTime
      }
    }
  }
`;

export const DELETE_SCHEDULE_MUTATION = gql`
  mutation DeleteSchedule($scheduleId: ID!) {
    deleteSchedule(scheduleId: $scheduleId)
  }
`;

export type DayOfWeek =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type ScheduleStatus = "WORKING" | "DAY_OFF" | "VACATION";

export type ScheduleSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type DoctorSchedule = {
  id: string;
  startsAt: string;
  endsAt?: string | null;
  status: ScheduleStatus;
  slots: ScheduleSlot[];
};

export type ScheduleSlotInput = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type CreateScheduleInput = {
  startsAt: string;
  endsAt?: string | null;
  status: ScheduleStatus;
  slots: ScheduleSlotInput[];
};

export type MySchedulesQueryData = {
  mySchedules: DoctorSchedule[];
};

export type CreateScheduleMutationData = {
  createSchedule: DoctorSchedule;
};

export type CreateScheduleMutationVariables = {
  input: CreateScheduleInput;
};

export type UpdateScheduleMutationData = {
  updateSchedule: DoctorSchedule;
};

export type UpdateScheduleMutationVariables = {
  id: string;
  input: CreateScheduleInput;
};

export type DeleteScheduleMutationData = {
  deleteSchedule: boolean;
};

export type DeleteScheduleMutationVariables = {
  scheduleId: string;
};
