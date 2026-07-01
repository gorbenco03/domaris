/**
 * MlAvmClient
 *
 * Thin HTTP wrapper around the Riva-AVM FastAPI microservice.
 * Reads AVM_SERVICE_URL from the environment; when the variable is absent
 * every call resolves to null immediately (safe no-op fallback).
 *
 * POST /predict → MlPrediction | null
 * GET  /health  → MlHealth    | null
 */

import { Injectable, Logger } from '@nestjs/common';
import { AVMInput } from '../types/index.js';

// ─── Shapes mirrored from ml/service/main.py ────────────────────────────────

export interface MlPrediction {
  predicted_price: number;
  price_min: number;
  price_max: number;
  confidence_score: number;
  model_version: string;
  prediction_timestamp: string;
}

export interface MlHealth {
  status: string;
  model_version: string;
  model_loaded: boolean;
}

// ─── Mapping from AVMInput to the PropertyInput body FastAPI expects ─────────

function toRequestBody(input: AVMInput): Record<string, unknown> {
  return {
    city: input.city,
    neighborhood: input.neighborhood ?? '',
    property_type: input.propertyType,   // 'APARTMENT' | 'HOUSE' | 'STUDIO'
    rooms: input.rooms,
    surface_sqm: input.surfaceSqm,
    floor: input.floor ?? null,
    total_floors: input.totalFloors ?? null,
    year_built: input.yearBuilt ?? null,
    is_furnished: input.isFurnished ?? false,
    amenities: input.amenities ?? [],
  };
}

// ─── Client ──────────────────────────────────────────────────────────────────

@Injectable()
export class MlAvmClient {
  private readonly logger = new Logger(MlAvmClient.name);
  private readonly baseUrl: string | null;
  /** Timeout in milliseconds for every outgoing request */
  private readonly TIMEOUT_MS = 3_000;

  constructor() {
    const raw = process.env.AVM_SERVICE_URL;
    // Normalise: strip trailing slash
    this.baseUrl = raw ? raw.replace(/\/$/, '') : null;

    if (this.baseUrl) {
      this.logger.log(`ML AVM client ready → ${this.baseUrl}`);
    } else {
      this.logger.warn('AVM_SERVICE_URL not set — ML predictions disabled, CMA-only mode');
    }
  }

  /** Returns null when the service URL is not configured or the call fails. */
  async predict(input: AVMInput): Promise<MlPrediction | null> {
    if (!this.baseUrl) return null;

    const url = `${this.baseUrl}/predict`;
    const body = toRequestBody(input);

    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        this.logger.warn(`ML /predict returned HTTP ${response.status}`);
        return null;
      }

      return (await response.json()) as MlPrediction;
    } catch (err: any) {
      this.logger.warn(`ML /predict failed: ${err.message}`);
      return null;
    }
  }

  /** Quick liveness check. Returns null on any error. */
  async health(): Promise<MlHealth | null> {
    if (!this.baseUrl) return null;

    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, { method: 'GET' });
      if (!response.ok) return null;
      return (await response.json()) as MlHealth;
    } catch {
      return null;
    }
  }

  // ── private helpers ────────────────────────────────────────────────────────

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
