import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { LISTING_IMAGE_FEATURES_PROMPT } from '../core/prompts.js';

export type RoomType =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'living_room'
  | 'hallway'
  | 'balcony'
  | 'mixed'
  | 'unknown';

export interface ApartmentImageFeatures {
  roomType: RoomType;

  hasKitchenArea: boolean;
  hasBed: boolean;
  hasSofa: boolean;
  hasDiningTable: boolean;
  hasDesk: boolean;
  hasWardrobe: boolean;
  hasTV: boolean;
  hasAC: boolean;
  hasRadiator: boolean;

  hasBathtub: boolean;
  hasShower: boolean;
  hasToilet: boolean;
  hasSink: boolean;
  hasWashingMachine: boolean;
  hasDishwasher: boolean;
  hasBalconyAccess: boolean;

  notes: string;
  reasoning: string;
}

@Injectable()
export class ApartmentVisionService {
  private readonly logger = new Logger(ApartmentVisionService.name);
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeApartmentImage(
    imageUrl: string,
  ): Promise<ApartmentImageFeatures> {
    try {
      const res = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: LISTING_IMAGE_FEATURES_PROMPT,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analizează această fotografie dintr-un apartament de închiriat și întoarce STRICT un singur JSON conform schemei din instrucțiunile de sistem.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low', // poți pune 'high' dacă ai nevoie de mai multă precizie
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const content = res.choices[0]?.message?.content?.trim();
      if (!content) {
        this.logger.error('Empty JSON response from OpenAI vision');
        throw new Error('Empty JSON response from OpenAI');
      }

      this.logger.debug(`Apartment vision raw JSON:\n${content}`);

      const parsed = this.safeParseAndNormalize(content);
      return parsed;
    } catch (error: any) {
      this.logger.error(
        `Error analyzing apartment image: ${error?.message || error}`,
        error?.stack,
      );

      // fallback cu valori default
      return {
        roomType: 'unknown',
        hasKitchenArea: false,
        hasBed: false,
        hasSofa: false,
        hasDiningTable: false,
        hasDesk: false,
        hasWardrobe: false,
        hasTV: false,
        hasAC: false,
        hasRadiator: false,
        hasBathtub: false,
        hasShower: false,
        hasToilet: false,
        hasSink: false,
        hasWashingMachine: false,
        hasDishwasher: false,
        hasBalconyAccess: false,
        notes: '',
        reasoning: `Eroare la analiză: ${error?.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Parsează JSON-ul din răspuns și normalizează tipurile.
   */
  private safeParseAndNormalize(jsonText: string): ApartmentImageFeatures {
    let raw: any;
    try {
      raw = JSON.parse(jsonText);
    } catch (e) {
      this.logger.error(
        `JSON parse error for OpenAI vision response: ${(e as Error).message}`,
      );
      throw e;
    }

    const normalizeBool = (v: any): boolean => {
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') {
        const s = v.toLowerCase().trim();
        if (s === 'true' || s === 'yes' || s === 'da') return true;
        if (s === 'false' || s === 'no' || s === 'nu') return false;
      }
      return false;
    };

    const roomRaw = String(raw.roomType || 'unknown').toLowerCase();
    const allowedRoomTypes: RoomType[] = [
      'kitchen',
      'bathroom',
      'bedroom',
      'living_room',
      'hallway',
      'balcony',
      'mixed',
      'unknown',
    ];
    const roomType: RoomType = allowedRoomTypes.includes(roomRaw as RoomType)
      ? (roomRaw as RoomType)
      : 'unknown';

    const safeString = (v: any): string =>
      typeof v === 'string' ? v : v == null ? '' : String(v);

    const result: ApartmentImageFeatures = {
      roomType,
      hasKitchenArea: normalizeBool(raw.hasKitchenArea),
      hasBed: normalizeBool(raw.hasBed),
      hasSofa: normalizeBool(raw.hasSofa),
      hasDiningTable: normalizeBool(raw.hasDiningTable),
      hasDesk: normalizeBool(raw.hasDesk),
      hasWardrobe: normalizeBool(raw.hasWardrobe),
      hasTV: normalizeBool(raw.hasTV),
      hasAC: normalizeBool(raw.hasAC),
      hasRadiator: normalizeBool(raw.hasRadiator),
      hasBathtub: normalizeBool(raw.hasBathtub),
      hasShower: normalizeBool(raw.hasShower),
      hasToilet: normalizeBool(raw.hasToilet),
      hasSink: normalizeBool(raw.hasSink),
      hasWashingMachine: normalizeBool(raw.hasWashingMachine),
      hasDishwasher: normalizeBool(raw.hasDishwasher),
      hasBalconyAccess: normalizeBool(raw.hasBalconyAccess),
      notes: safeString(raw.notes),
      reasoning: safeString(raw.reasoning),
    };

    return result;
  }
}
