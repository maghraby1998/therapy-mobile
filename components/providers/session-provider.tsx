import * as SecureStore from "expo-secure-store";
import { ReactNode, createContext, use, useEffect, useState } from "react";

import {
  type PersistedSession,
  type SessionStatus,
  type SessionUser,
  type UserRole,
} from "@/constants/session";
import { apolloClient, setApolloAccessToken } from "@/lib/apollo";

const SESSION_STORAGE_KEY = "therapy-mobile.session";

type SignInPayload = {
  accessToken: string;
  user: SessionUser;
  role: UserRole;
};

type SessionContextValue = {
  status: SessionStatus;
  isAuthenticated: boolean;
  accessToken: string | null;
  user: SessionUser | null;
  role: UserRole | null;
  signIn: (payload: SignInPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function isPersistedSession(value: unknown): value is PersistedSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<PersistedSession>;

  return (
    typeof session.accessToken === "string" &&
    !!session.user &&
    typeof session.user.id === "string" &&
    typeof session.user.email === "string" &&
    (session.role === "CLIENT" || session.role === "THERAPIST")
  );
}

async function persistSession(session: PersistedSession) {
  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
}

async function clearPersistedSession() {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedValue = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

        if (!storedValue) {
          setApolloAccessToken(null);

          if (isMounted) {
            setStatus("unauthenticated");
          }
          return;
        }

        const parsedValue: unknown = JSON.parse(storedValue);

        if (!isPersistedSession(parsedValue)) {
          await clearPersistedSession();
          setApolloAccessToken(null);

          if (isMounted) {
            setStatus("unauthenticated");
          }
          return;
        }

        setApolloAccessToken(parsedValue.accessToken);

        if (isMounted) {
          setAccessToken(parsedValue.accessToken);
          setUser(parsedValue.user);
          setRole(parsedValue.role);
          setStatus("authenticated");
        }
      } catch {
        await clearPersistedSession();
        setApolloAccessToken(null);

        if (isMounted) {
          setStatus("unauthenticated");
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: SessionContextValue = {
    status,
    isAuthenticated: status === "authenticated",
    accessToken,
    user,
    role,
    async signIn(payload) {
      const session: PersistedSession = {
        accessToken: payload.accessToken,
        user: payload.user,
        role: payload.role,
      };

      await persistSession(session);
      setApolloAccessToken(payload.accessToken);
      setAccessToken(payload.accessToken);
      setUser(payload.user);
      setRole(payload.role);
      setStatus("authenticated");
    },
    async signOut() {
      await clearPersistedSession();
      setApolloAccessToken(null);
      setAccessToken(null);
      setUser(null);
      setRole(null);
      setStatus("unauthenticated");
      await apolloClient.clearStore();
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const context = use(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within AppSessionProvider.");
  }

  return context;
}
