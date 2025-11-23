import { LISTING_OWNER_ANALYSIS_PROMPT } from '../core/prompts.js';
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

interface OwnerAnalysisResult {
  isAgency: boolean;
  confidence: number;
  indicators: {
    agencySignals: string[];
    ownerSignals: string[];
  };
  reasoning: string;
}

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY nu este setat în environment variables');
      throw new Error('OPENAI_API_KEY is required');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analizează textul unui anunț pentru a determina dacă este de la proprietar sau agenție
   * @param listingText - Textul anunțului (titlu + descriere)
   * @returns Rezultatul analizei cu isAgency, confidence, etc.
   */
  async analyzeListingOwnerType(listingText: string): Promise<OwnerAnalysisResult> {
    if (!listingText || listingText.trim().length === 0) {
      this.logger.warn('Empty listing text provided for analysis');
      return {
        isAgency: false,
        confidence: 0.0,
        indicators: {
          agencySignals: [],
          ownerSignals: [],
        },
        reasoning: 'Text gol - nu se poate analiza',
      };
    }

    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: LISTING_OWNER_ANALYSIS_PROMPT },
          { role: 'user', content: `Analizează acest anunț:\n\n${listingText.substring(0, 2000)}` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent results
      });

      const content = res.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const analysis = JSON.parse(content) as OwnerAnalysisResult;
      this.logger.debug(`Listing analysis: isAgency=${analysis.isAgency}, confidence=${analysis.confidence}`);
      
      return analysis;
    } catch (error: any) {
      this.logger.error(`Error analyzing listing owner type: ${error.message}`, error.stack);
      
      // Return default result on error
      return {
        isAgency: false,
        confidence: 0.0,
        indicators: {
          agencySignals: [],
          ownerSignals: [],
        },
        reasoning: `Eroare la analiză: ${error.message}`,
      };
    }
  }
}
