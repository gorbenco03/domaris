/**
 * RIVA Frontend - Validators
 * Validation utilities using Zod schemas (aligned with mobile/src/shared/utils/validators.ts)
 */

import { z } from 'zod';
import { VALIDATION } from './constants';

// ============================================
// COMMON SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'Email-ul este obligatoriu')
  .email('Email invalid');

export const passwordSchema = z
  .string()
  .min(VALIDATION.PASSWORD_MIN_LENGTH, `Parola trebuie să aibă minim ${VALIDATION.PASSWORD_MIN_LENGTH} caractere`)
  .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
  .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
  .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră');

export const phoneSchema = z
  .string()
  .regex(VALIDATION.PHONE_REGEX, 'Număr de telefon invalid (ex: 0721234567 sau +40721234567)')
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string()
  .min(2, 'Minim 2 caractere')
  .max(50, 'Maxim 50 caractere')
  .regex(/^[a-zA-ZăâîșțĂÂÎȘȚ\s-]+$/, 'Numele poate conține doar litere');

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Parola este obligatorie'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: nameSchema,
  lastName: nameSchema,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Trebuie să accepți termenii și condițiile',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, 'Codul trebuie să aibă 6 cifre'),
});

export type OTPFormData = z.infer<typeof otpSchema>;

// ============================================
// PROFILE SCHEMAS
// ============================================

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  bio: z.string().max(500, 'Maxim 500 caractere').optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Parola curentă este obligatorie'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Parolele nu coincid',
  path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ============================================
// PROPERTY SCHEMAS
// ============================================

export const propertySchema = z.object({
  title: z.string()
    .min(10, 'Titlul trebuie să aibă minim 10 caractere')
    .max(100, 'Titlul trebuie să aibă maxim 100 caractere'),
  description: z.string()
    .min(50, 'Descrierea trebuie să aibă minim 50 caractere')
    .max(VALIDATION.MAX_DESCRIPTION_LENGTH, `Descrierea trebuie să aibă maxim ${VALIDATION.MAX_DESCRIPTION_LENGTH} caractere`),
  propertyType: z.enum(['apartment', 'house', 'villa', 'studio', 'penthouse', 'duplex', 'land', 'commercial', 'office']),
  transactionType: z.enum(['sale', 'rent']),
  price: z.number()
    .min(1, 'Prețul este obligatoriu')
    .max(100000000, 'Preț prea mare'),
  currency: z.enum(['EUR', 'RON']),
  area: z.number().min(1, 'Suprafața este obligatorie'),
  usableArea: z.number().optional(),
  rooms: z.number().min(1, 'Numărul de camere este obligatoriu'),
  bedrooms: z.number().optional(),
  bathrooms: z.number().min(1, 'Numărul de băi este obligatoriu'),
  balconies: z.number().optional(),
  floor: z.number().optional(),
  totalFloors: z.number().optional(),
  yearBuilt: z.number()
    .min(1800, 'An invalid')
    .max(new Date().getFullYear() + 5, 'An invalid')
    .optional(),
  parkingSpaces: z.number().optional(),
  hasGarage: z.boolean().optional(),
  hasBasement: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasFurnished: z.boolean().optional(),
  address: z.string().min(5, 'Adresa este obligatorie'),
  city: z.string().min(2, 'Orașul este obligatoriu'),
  sector: z.string().optional(),
  county: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  amenities: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

// ============================================
// VIEWING SCHEMAS
// ============================================

export const viewingRequestSchema = z.object({
  propertyId: z.string(),
  date: z.string(),
  time: z.string(),
  notes: z.string().max(500).optional(),
});

export type ViewingRequestFormData = z.infer<typeof viewingRequestSchema>;

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchFiltersSchema = z.object({
  transactionType: z.enum(['sale', 'rent']).optional(),
  propertyTypes: z.array(z.string()).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  areaMin: z.number().optional(),
  areaMax: z.number().optional(),
  roomsMin: z.number().optional(),
  roomsMax: z.number().optional(),
  city: z.string().optional(),
  sector: z.string().optional(),
});

export type SearchFiltersFormData = z.infer<typeof searchFiltersSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const isValidPhone = (phone: string): boolean => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

export const isValidPassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const getPasswordStrength = (password: string): number => {
  let strength = 0;

  if (password.length >= VALIDATION.PASSWORD_MIN_LENGTH) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return Math.min(strength, 4);
};
