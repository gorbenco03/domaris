/**
 * RIVA - Early Access Utilities (web)
 * Ported from mobile/src/shared/utils/earlyAccess.ts
 */

import { useEffect, useState } from "react";

export const isEarlyAccessStatus = (status?: string | null): boolean => {
  return (status || "").toLowerCase() === "early_access";
};

export const formatEarlyAccessRemaining = (
  publicFrom?: string | Date | null,
  nowMs: number = Date.now()
): string | null => {
  if (!publicFrom) return null;

  const publishAt =
    publicFrom instanceof Date ? publicFrom : new Date(publicFrom);
  if (Number.isNaN(publishAt.getTime())) return null;

  const diffMs = publishAt.getTime() - nowMs;
  if (diffMs <= 0) return "acum";

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

export const getEarlyAccessBadgeLabel = (
  status?: string | null,
  publicFrom?: string | Date | null,
  nowMs: number = Date.now()
): string | null => {
  if (!isEarlyAccessStatus(status)) return null;

  const remaining = formatEarlyAccessRemaining(publicFrom, nowMs);
  return remaining ? `Early · ${remaining}` : "Early Access";
};

/**
 * React hook that refreshes countdown every 30 seconds.
 * Returns the badge label string or null when not applicable.
 */
export const useEarlyAccessCountdown = (
  status?: string | null,
  publicFrom?: string | Date | null
): string | null => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const active = isEarlyAccessStatus(status) && !!publicFrom;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [active]);

  return getEarlyAccessBadgeLabel(status, publicFrom, nowMs);
};
