/**
 * IMOBI - Date Utilities
 * Utility functions for date formatting
 */

/**
 * Format distance to now (e.g., "Acum", "5 min", "2 ore", "Ieri")
 */
export const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Acum';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay === 1) return 'Ieri';
  if (diffDay < 7) {
    const days = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
    return days[date.getDay()];
  }
  
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' });
};

/**
 * Format message time for chat
 */
export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Group messages by date
 */
export const getMessageDateLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) {
    return 'Astăzi';
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Ieri';
  }
  
  return date.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};
