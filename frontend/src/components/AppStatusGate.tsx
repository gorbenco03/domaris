"use client";

/**
 * RIVA Frontend - App Status Gate
 * Checks backend maintenance status and blocks UI if needed.
 * Wraps the entire app — fail-open: if the endpoint is unreachable, children render normally.
 * Aligned with mobile/src/shared/components/AppStatusGate.tsx
 */

import { useEffect, useState, useCallback, ReactNode } from "react";
import { fetchAppStatus, AppStatusResponse } from "@/lib/appStatusApi";
import { Wrench, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type GateMode = "none" | "maintenance";

export function AppStatusGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<GateMode>("none");
  const [status, setStatus] = useState<AppStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAppStatus();
      setStatus(res);
      setMode(res.maintenance?.enabled ? "maintenance" : "none");
    } catch {
      // Fail-open: do not block app if status endpoint is unreachable.
      setStatus(null);
      setMode("none");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Re-check on tab focus (equivalent to mobile AppState listener)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkStatus]);

  // While first check is loading, show nothing (fast — typically <200ms)
  if (loading && !status) {
    return null;
  }

  if (mode === "maintenance") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-accent/10 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <Wrench className="h-9 w-9 text-accent-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Mentenanță sistem</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          {status?.maintenance?.message || "Aplicația este în mentenanță. Revino în curând."}
        </p>

        <Button onClick={checkStatus} variant="outline" className="mt-8 rounded-full px-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Verifică din nou
        </Button>

        <p className="mt-6 text-xs text-muted-foreground/70">Mulțumim pentru răbdare.</p>

        <p className="mt-10 text-sm font-medium tracking-[0.3em] text-muted-foreground/50">RIVA</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default AppStatusGate;
