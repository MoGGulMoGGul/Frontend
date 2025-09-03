"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthReadyFlag() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const authReady = useAuthStore((s) => s.authReady);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (hasHydrated)
        document.documentElement.setAttribute("data-zs-hydrated", "1");
      if (authReady)
        document.documentElement.setAttribute("data-auth-ready", "1");
    }
  }, [hasHydrated, authReady]);

  return null;
}
