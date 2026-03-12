/**
 * RIVA Frontend - Formatters
 * Utility functions for formatting data (aligned with mobile/src/shared/utils/formatters.ts)
 */

// ============================================
// PRICE FORMATTERS
// ============================================

export const formatPrice = (
  price: number,
  currency: 'EUR' | 'RON' = 'EUR',
  options?: { compact?: boolean }
): string => {
  const { compact = false } = options || {};

  if (compact && price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M ${currency}`;
  }

  if (compact && price >= 1000) {
    return `${(price / 1000).toFixed(0)}K ${currency}`;
  }

  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const formatPricePerSqm = (price: number, area: number, currency: 'EUR' | 'RON' = 'EUR'): string => {
  if (area <= 0) return '—';
  const pricePerSqm = Math.round(price / area);
  return `${formatPrice(pricePerSqm, currency)}/m²`;
};

// ============================================
// AREA FORMATTERS
// ============================================

export const formatArea = (area: number): string => {
  return `${new Intl.NumberFormat('ro-RO').format(area)} m²`;
};

// ============================================
// DATE FORMATTERS
// ============================================

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  return new Intl.DateTimeFormat('ro-RO', options || defaultOptions)
    .format(new Date(date));
};

export const formatDateShort = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'Acum';
  if (diffMin < 60) return `${diffMin} min în urmă`;
  if (diffHour < 24) return `${diffHour} ore în urmă`;
  if (diffDay < 7) return `${diffDay} zile în urmă`;
  if (diffWeek < 4) return `${diffWeek} săpt. în urmă`;
  if (diffMonth < 12) return `${diffMonth} luni în urmă`;

  return formatDate(date);
};

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

export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getMessageDateLabel = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDate.getTime() === today.getTime()) return 'Astăzi';
  if (messageDate.getTime() === yesterday.getTime()) return 'Ieri';

  return date.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

// ============================================
// TEXT FORMATTERS
// ============================================

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('40')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

export const getInitials = (firstName: string, lastName?: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
};

export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// ============================================
// PROPERTY FORMATTERS
// ============================================

export const formatRooms = (rooms: number): string => {
  if (rooms === 1) return '1 cameră';
  return `${rooms} camere`;
};

export const formatFloor = (floor: number, totalFloors?: number): string => {
  if (floor === 0) return 'Parter';
  if (totalFloors) return `Etaj ${floor}/${totalFloors}`;
  return `Etaj ${floor}`;
};

export const formatAddressShort = (city: string, sector?: string): string => {
  if (sector) return `${sector}, ${city}`;
  return city;
};

// ============================================
// NUMBER FORMATTERS
// ============================================

export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ro-RO').format(num);
};
