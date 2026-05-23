export type UserRole = "CLIENT" | "THERAPIST";

export type SessionUser = {
  id: string;
  email: string;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type PersistedSession = {
  accessToken: string;
  user: SessionUser;
  role: UserRole;
};
