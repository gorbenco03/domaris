/**
 * IMOBI - Formatters
 * Utility functions for formatting data
 */

// ============================================
// PRICE FORMATTERS
// ============================================

/**
 * Format price with currency
 */
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

/**
 * Format price per square meter
 */
export const formatPricePerSqm = (price: number, area: number, currency: 'EUR' | 'RON' = 'EUR'): string => {
  const pricePerSqm = Math.round(price / area);
  return `${formatPrice(pricePerSqm, currency)}/m²`;
};

// ============================================
// AREA FORMATTERS
// ============================================

/**
 * Format area in square meters
 */
export const formatArea = (area: number): string => {
  return `${new Intl.NumberFormat('ro-RO').format(area)} m²`;
};

// ============================================
// DATE FORMATTERS
// ============================================

/**
 * Format date to Romanian locale
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  
  return new Intl.DateTimeFormat('ro-RO', options || defaultOptions)
    .format(new Date(date));
};

/**
 * Format date as short (DD/MM/YYYY)
 */
export const formatDateShort = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Format time (HH:MM)
 */
export const formatTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Format relative time (e.g., "2 ore în urmă")
 */
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

// ============================================
// TEXT FORMATTERS
// ============================================

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('40')) {
    // Romanian format: +40 XXX XXX XXX
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  
  if (cleaned.startsWith('0')) {
    // Local format: 0XXX XXX XXX
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

/**
 * Get user initials from name
 */
export const getInitials = (firstName: string, lastName?: string): string => {
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
};

/**
 * Format full name
 */
export const formatFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

// ============================================
// PROPERTY FORMATTERS
// ============================================

/**
 * Format room count text
 */
export const formatRooms = (rooms: number): string => {
  if (rooms === 1) return '1 cameră';
  return `${rooms} camere`;
};

/**
 * Format floor text
 */
export const formatFloor = (floor: number, totalFloors?: number): string => {
  if (floor === 0) return 'Parter';
  if (totalFloors) return `Etaj ${floor}/${totalFloors}`;
  return `Etaj ${floor}`;
};

/**
 * Format property address (short version)
 */
export const formatAddressShort = (city: string, sector?: string): string => {
  if (sector) return `${sector}, ${city}`;
  return city;
};

// ============================================
// NUMBER FORMATTERS
// ============================================

/**
 * Format large numbers with K/M suffix
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ro-RO').format(num);
};
