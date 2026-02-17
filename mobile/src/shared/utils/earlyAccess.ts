/**
 * RIVA - Early Access Utilities
 */

export const isEarlyAccessStatus = (status?: string | null): boolean => {
  return (status || '').toLowerCase() === 'early_access';
};

export const formatEarlyAccessRemaining = (
  publicFrom?: string | Date | null,
  nowMs: number = Date.now(),
): string | null => {
  if (!publicFrom) return null;

  const publishAt = publicFrom instanceof Date ? publicFrom : new Date(publicFrom);
  if (Number.isNaN(publishAt.getTime())) return null;

  const diffMs = publishAt.getTime() - nowMs;
  if (diffMs <= 0) return 'acum';

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
  nowMs: number = Date.now(),
): string | null => {
  if (!isEarlyAccessStatus(status)) return null;

  const remaining = formatEarlyAccessRemaining(publicFrom, nowMs);
  return remaining ? `Early · ${remaining}` : 'Early Access';
};
