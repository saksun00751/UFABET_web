"use client";
import * as React from "react";
import useSWR, { useSWRConfig } from "swr";
import { auth, type Member } from "@/lib/api/member";
import { ApiError } from "@/lib/api/client";

type AuthCtx = {
  loading: boolean;
  authenticated: boolean;
  member: Member | null;
  refresh: () => Promise<unknown>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthCtx>({
  loading: true,
  authenticated: false,
  member: null,
  refresh: async () => {},
  logout: async () => {},
});

async function fetchMe() {
  try {
    return await auth.me();
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return { authenticated: false as const };
    throw e;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, mutate } = useSWR("auth/me", fetchMe, { revalidateOnFocus: true, shouldRetryOnError: false });
  const { mutate: globalMutate } = useSWRConfig();

  const logout = React.useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      // ล้าง cache ข้อมูลสมาชิกทั้งหมด
      await globalMutate(() => true, undefined, { revalidate: false });
      await mutate({ authenticated: false }, { revalidate: false });
    }
  }, [globalMutate, mutate]);

  const value: AuthCtx = {
    loading: isLoading,
    authenticated: !!data?.authenticated,
    member: (data && "member" in data && data.member) || null,
    refresh: () => mutate(),
    logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => React.useContext(AuthContext);
