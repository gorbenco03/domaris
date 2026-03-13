"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useState } from "react";
import { AppStatusGate } from "@/components/AppStatusGate";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 min — data stays fresh, no refetch
            gcTime: 10 * 60 * 1000, // 10 min — keep in cache after unmount
            refetchOnWindowFocus: false, // don't refetch when tab gets focus
            retry: 1, // only 1 retry on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppStatusGate>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </AppStatusGate>
      </AuthProvider>
    </QueryClientProvider>
  );
}
