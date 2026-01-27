/**
 * IMOBI - Shared AI Service
 * Explicit contract for AI API usage across features.
 */

import { aiApi } from '@/features/ai/api/aiApi';

export const analyzeListingDraft = aiApi.analyzeListingDraft;
export const estimatePrice = aiApi.estimatePrice;
