"use client";

import { useAuthContext } from "./provider";

export function useUser() {
  const { user, loading } = useAuthContext();
  return { user, loading };
}

export function useSession() {
  const { session, loading } = useAuthContext();
  return { session, loading };
}

export function useAuth() {
  return useAuthContext();
}
