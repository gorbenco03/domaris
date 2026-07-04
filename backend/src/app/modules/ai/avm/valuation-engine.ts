/**
 * AVM (Automated Valuation Model) Engine
 * 
 * Architecture:
 * 1. Deterministic/Statistical Core - computes actual numbers
 * 2. LLM Explanation Layer - generates human-readable explanations
 * 
 * The LLM NEVER computes prices - it only explains pre-computed results.
 */

import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Op } from 'sequelize';
import { Listing } from '../../../db/entities/listing.entity.js';
import { AVMInput, AVMResult, AVMFactor, AVMExplanation } from '../types/index.js';
import * as crypto from 'crypto';
import { MlAvmClient } from './ml-client.js';

interface ComparableProperty {
  id: number;
  priceEur: number;
  surfaceSqm: number;
  pricePerSqm: number;
  rooms: number;
  floor?: number;
  yearBuilt?: number;
  isFurnished?: boolean;
  neighborhood?: string;
  similarityScore: number;
}

/** Minimum ML confidence_score (0-1) required to use the ML prediction. */
const ML_MIN_CONFIDENCE = 0.4;

@Injectable()
export class ValuationEngine {
  private readonly logger = new Logger(ValuationEngine.name);
  private openai: OpenAI | null = null;
  private readonly cache = new Map<string, { result: AVMResult; expiresAt: Date }>();
  private readonly mlClient: MlAvmClient;

  constructor(mlAvmClient: MlAvmClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.mlClient = mlAvmClient;
  }

  // ========================================================================
  // MAIN VALUATION METHOD
  // ========================================================================

  async valuate(input: AVMInput): Promise<AVMResult> {
    const cacheKey = this.generateCacheKey(input);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug(`AVM cache hit: ${cacheKey}`);
      return cached.result;
    }

    this.logger.log(`Computing AVM for: ${input.city}, ${input.rooms} rooms, ${input.surfaceSqm}sqm`);

    // Step 1: Fan-out — run ML call and DB comparable search in parallel
    const [mlPrediction, comparables] = await Promise.all([
      this.mlClient.predict(input),
      this.findComparables(input),
    ]);

    // ── Branch A: ML service responded with sufficient confidence ────────────
    if (mlPrediction && mlPrediction.confidence_score >= ML_MIN_CONFIDENCE) {
      this.logger.log(
        `Using ML prediction: ${mlPrediction.predicted_price} EUR ` +
        `(confidence=${mlPrediction.confidence_score}, model=${mlPrediction.model_version})`,
      );

      // Liquidity / deal scores still use comparables when available
      const liquidityScore = this.computeLiquidityScore(input, comparables);
      const dealScore = comparables.length > 0
        ? this.computeDealAttractivenessScore(mlPrediction.predicted_price, comparables)
        : 50;

      const result: AVMResult = {
        recommendedPrice: Math.round(mlPrediction.predicted_price),
        priceRange: this.clampDisplayRange(
          mlPrediction.predicted_price,
          mlPrediction.price_min,
          mlPrediction.price_max,
        ),
        currency: 'EUR',
        liquidityScore,
        dealAttractivenessScore: dealScore,
        confidence: mlPrediction.confidence_score,
        confidenceBreakdown: {
          compCount: comparables.length,
          featureCoverage: this.computeFeatureCoverage(input),
          areaVolatility: comparables.length > 1 ? this.computeAreaVolatility(comparables) : 0,
        },
        comparables: {
          count: comparables.length,
          avgPrice: comparables.length > 0
            ? Math.round(comparables.reduce((s, c) => s + c.priceEur, 0) / comparables.length)
            : 0,
          avgPricePerSqm: comparables.length > 0
            ? Math.round(comparables.reduce((s, c) => s + c.pricePerSqm, 0) / comparables.length)
            : 0,
          medianPrice: comparables.length > 0 ? this.median(comparables.map(c => c.priceEur)) : 0,
        },
        factors: [],
        computedAt: new Date(),
        cacheKey,
        source: 'ml',
        mlModelVersion: mlPrediction.model_version,
      };

      this.cache.set(cacheKey, {
        result,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      return result;
    }

    // ── Branch B: CMA (comparables) path ────────────────────────────────────
    if (mlPrediction && mlPrediction.confidence_score < ML_MIN_CONFIDENCE) {
      this.logger.warn(
        `ML confidence too low (${mlPrediction.confidence_score} < ${ML_MIN_CONFIDENCE}), falling back to CMA`,
      );
    }

    // Not enough comparables — return low-confidence result instead of price=0
    if (comparables.length < 3) {
      return this.insufficientDataResult(input, comparables.length, cacheKey);
    }

    // Step 2: Compute base valuation from comparables
    const baseValuation = this.computeBaseValuation(comparables, input);

    // Step 3: Apply adjustment factors
    const { adjustedPrice, factors } = this.applyAdjustments(baseValuation, input, comparables);

    // Step 4: Compute confidence and scores
    const confidence = this.computeConfidence(comparables, input);
    const liquidityScore = this.computeLiquidityScore(input, comparables);
    const dealScore = this.computeDealAttractivenessScore(adjustedPrice, comparables);

    // Step 5: Compute price range
    const priceRange = this.computePriceRange(comparables, adjustedPrice, confidence);

    const result: AVMResult = {
      recommendedPrice: Math.round(adjustedPrice),
      priceRange: this.clampDisplayRange(adjustedPrice, priceRange.min, priceRange.max),
      currency: 'EUR',
      liquidityScore,
      dealAttractivenessScore: dealScore,
      confidence,
      confidenceBreakdown: {
        compCount: comparables.length,
        featureCoverage: this.computeFeatureCoverage(input),
        areaVolatility: this.computeAreaVolatility(comparables),
      },
      comparables: {
        count: comparables.length,
        avgPrice: Math.round(comparables.reduce((s, c) => s + c.priceEur, 0) / comparables.length),
        avgPricePerSqm: Math.round(comparables.reduce((s, c) => s + c.pricePerSqm, 0) / comparables.length),
        medianPrice: this.median(comparables.map(c => c.priceEur)),
      },
      factors,
      computedAt: new Date(),
      cacheKey,
      source: 'cma',
    };

    // Cache for 24 hours
    this.cache.set(cacheKey, {
      result,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return result;
  }

  /**
   * Plafonează banda afișată la ±15% din prețul recomandat. Intervalul brut
   * (q10-q90 al modelului sau derivat din comparabile) poate fi foarte lat sau
   * asimetric în zone eterogene ori la proprietăți rare în date, rezultând o
   * sugestie inutilizabilă în interfață. Se aplică pe toate căile de valuare.
   */
  private clampDisplayRange(
    recommended: number,
    min: number,
    max: number,
  ): { min: number; max: number } {
    return {
      min: Math.round(Math.max(min, recommended * 0.85)),
      max: Math.round(Math.min(max, recommended * 1.15)),
    };
  }

  // ========================================================================
  // EXPLANATION LAYER (LLM)
  // ========================================================================

  async generateExplanation(
    avmResult: AVMResult,
    input: AVMInput,
    forSeller: boolean = true,
  ): Promise<AVMExplanation> {
    if (!this.openai) {
      return this.fallbackExplanation(avmResult, input, forSeller);
    }

    // The LLM receives pre-computed numbers and ONLY generates text
    const prompt = `You are a real estate valuation expert in Moldova. Generate a clear, professional explanation for a property valuation.

IMPORTANT: You must ONLY use the exact numbers provided below. Do NOT invent or modify any prices or statistics.

VALUATION DATA (use these exact numbers):
- Recommended Price: ${avmResult.recommendedPrice} EUR${input.transactionType === 'RENT' ? '/month' : ''}
- Price Range: ${avmResult.priceRange.min} - ${avmResult.priceRange.max} EUR
- Confidence: ${Math.round(avmResult.confidence * 100)}%
- Liquidity Score: ${avmResult.liquidityScore}/100 (how fast it may ${input.transactionType === 'RENT' ? 'rent' : 'sell'})
- Deal Attractiveness: ${avmResult.dealAttractivenessScore}/100

COMPARABLE PROPERTIES ANALYSIS:
- Number of comparables: ${avmResult.comparables.count}
- Average price: ${avmResult.comparables.avgPrice} EUR
- Average price per sqm: ${avmResult.comparables.avgPricePerSqm} EUR/sqm
- Median price: ${avmResult.comparables.medianPrice} EUR

PRICE ADJUSTMENT FACTORS:
${avmResult.factors.map(f => `- ${f.name}: ${f.impact > 0 ? '+' : ''}${f.impact}% (${f.description})`).join('\n')}

PROPERTY DETAILS:
- Location: ${input.city}${input.neighborhood ? `, ${input.neighborhood}` : ''}
- Type: ${input.propertyType}
- Rooms: ${input.rooms}
- Surface: ${input.surfaceSqm} sqm
- Floor: ${input.floor ?? 'N/A'}
- Year Built: ${input.yearBuilt ?? 'N/A'}
- Condition: ${input.condition ?? 'N/A'}
- Furnished: ${input.isFurnished ? 'Yes' : 'No'}

Generate a JSON response with:
{
  "summary": "2-3 sentence summary of the valuation",
  "priceJustification": "Why this price is recommended (2-3 sentences)",
  "marketContext": "Current market context for this area/type (2-3 sentences)",
  "recommendations": ["3-4 actionable recommendations for the ${forSeller ? 'seller' : 'buyer'}"],
  ${forSeller ? '"sellerTips": ["2-3 tips to maximize value or speed of sale"]' : ''}
}

Respond in Romanian. Be professional but accessible.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 600,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return result as AVMExplanation;
    } catch (error: any) {
      this.logger.error(`AVM explanation error: ${error.message}`);
      return this.fallbackExplanation(avmResult, input, forSeller);
    }
  }

  // ========================================================================
  // COMPARABLE PROPERTY SEARCH
  // ========================================================================

  private async findComparables(input: AVMInput): Promise<ComparableProperty[]> {
    // Search for similar properties
    const whereConditions: any = {
      city: { [Op.iLike]: `%${input.city}%` },
      transactionType: input.transactionType,
      status: { [Op.in]: ['public', 'early_access'] },
      priceEur: { [Op.gt]: 0 },
      surfaceSqm: { [Op.gt]: 0 },
    };

    // Same neighborhood if specified
    if (input.neighborhood) {
      whereConditions.neighborhood = { [Op.iLike]: `%${input.neighborhood}%` };
    }

    // Similar rooms (±1)
    if (input.rooms) {
      whereConditions.rooms = { [Op.between]: [input.rooms - 1, input.rooms + 1] };
    }

    // Similar surface (±30%)
    whereConditions.surfaceSqm = {
      [Op.between]: [input.surfaceSqm * 0.7, input.surfaceSqm * 1.3],
    };

    const listings = await Listing.findAll({
      where: whereConditions,
      limit: 50,
      order: [['postedAt', 'DESC']],
      raw: true,
    });

    // Calculate similarity scores and sort
    const comparables: ComparableProperty[] = listings.map(l => ({
      id: l.id,
      priceEur: l.priceEur,
      surfaceSqm: l.surfaceSqm,
      pricePerSqm: l.priceEur / l.surfaceSqm,
      rooms: l.rooms,
      floor: l.floor ?? undefined,
      yearBuilt: l.yearBuilt ?? undefined,
      isFurnished: l.isFurnished,
      neighborhood: l.neighborhood,
      similarityScore: this.computeSimilarity(l, input),
    }));

    // Sort by similarity and take top 20
    return comparables
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 20);
  }

  private computeSimilarity(listing: Listing, input: AVMInput): number {
    let score = 100;

    // Surface difference penalty
    const surfaceDiff = Math.abs(listing.surfaceSqm - input.surfaceSqm) / input.surfaceSqm;
    score -= surfaceDiff * 30;

    // Room difference penalty
    if (input.rooms && listing.rooms !== input.rooms) {
      score -= Math.abs(listing.rooms - input.rooms) * 10;
    }

    // Floor difference penalty
    if (input.floor !== undefined && listing.floor !== undefined) {
      score -= Math.abs(listing.floor - input.floor) * 3;
    }

    // Year built difference penalty
    if (input.yearBuilt && listing.yearBuilt) {
      const yearDiff = Math.abs(listing.yearBuilt - input.yearBuilt);
      score -= Math.min(yearDiff / 2, 15);
    }

    // Neighborhood match bonus
    if (input.neighborhood && listing.neighborhood?.toLowerCase() === input.neighborhood.toLowerCase()) {
      score += 10;
    }

    // Furnished match
    if (input.isFurnished !== undefined && listing.isFurnished === input.isFurnished) {
      score += 5;
    }

    return Math.max(0, score);
  }

  // ========================================================================
  // VALUATION COMPUTATION
  // ========================================================================

  private computeBaseValuation(
    comparables: ComparableProperty[],
    input: AVMInput,
  ): number {
    // Weighted average by similarity score
    const totalWeight = comparables.reduce((s, c) => s + c.similarityScore, 0);
    const weightedPricePerSqm = comparables.reduce(
      (s, c) => s + c.pricePerSqm * c.similarityScore,
      0,
    ) / totalWeight;

    return weightedPricePerSqm * input.surfaceSqm;
  }

  private applyAdjustments(
    basePrice: number,
    input: AVMInput,
    comparables: ComparableProperty[],
  ): { adjustedPrice: number; factors: AVMFactor[] } {
    const factors: AVMFactor[] = [];
    let multiplier = 1;

    // Floor adjustment (ground floor = -5%, top floor = +3%, middle = neutral)
    if (input.floor !== undefined) {
      const avgFloor = this.average(comparables.map(c => c.floor).filter(f => f !== undefined) as number[]);
      if (input.floor === 0 || input.floor === 1) {
        multiplier *= 0.95;
        factors.push({
          name: 'Etaj parter/1',
          impact: -5,
          description: 'Etajele joase sunt mai puțin căutate',
        });
      } else if (input.totalFloors && input.floor >= input.totalFloors - 1) {
        multiplier *= 1.03;
        factors.push({
          name: 'Ultimul etaj',
          impact: 3,
          description: 'Vedere panoramică, mai multă lumină',
        });
      }
    }

    // Year built adjustment
    if (input.yearBuilt) {
      const avgYear = this.average(comparables.map(c => c.yearBuilt).filter(y => y !== undefined) as number[]);
      if (avgYear && input.yearBuilt > avgYear + 10) {
        multiplier *= 1.05;
        factors.push({
          name: 'Construcție nouă',
          impact: 5,
          description: 'Clădire mai nouă decât media zonei',
        });
      } else if (avgYear && input.yearBuilt < avgYear - 15) {
        multiplier *= 0.95;
        factors.push({
          name: 'Construcție veche',
          impact: -5,
          description: 'Clădire mai veche decât media zonei',
        });
      }
    }

    // Condition adjustment
    if (input.condition) {
      switch (input.condition) {
        case 'new':
          multiplier *= 1.1;
          factors.push({ name: 'Stare nouă', impact: 10, description: 'Proprietate nouă/nerenovată anterior' });
          break;
        case 'renovated':
          multiplier *= 1.07;
          factors.push({ name: 'Renovat recent', impact: 7, description: 'Renovare recentă adaugă valoare' });
          break;
        case 'needs_work':
          multiplier *= 0.85;
          factors.push({ name: 'Necesită renovare', impact: -15, description: 'Costurile de renovare reduc valoarea' });
          break;
      }
    }

    // Furnished adjustment (for rent)
    if (input.transactionType === 'RENT' && input.isFurnished) {
      multiplier *= 1.08;
      factors.push({
        name: 'Mobilat',
        impact: 8,
        description: 'Mobilarea adaugă valoare pentru chirie',
      });
    }

    // Amenities adjustment
    if (input.amenities && input.amenities.length > 0) {
      const premiumAmenities = ['parcare', 'garaj', 'terasă', 'grădină', 'piscină'];
      const premiumCount = input.amenities.filter(a => 
        premiumAmenities.some(p => a.toLowerCase().includes(p)),
      ).length;

      if (premiumCount > 0) {
        const bonus = Math.min(premiumCount * 2, 8);
        multiplier *= 1 + bonus / 100;
        factors.push({
          name: 'Facilități premium',
          impact: bonus,
          description: `${premiumCount} facilități premium (parcare, terasă, etc.)`,
        });
      }
    }

    return {
      adjustedPrice: basePrice * multiplier,
      factors,
    };
  }

  // ========================================================================
  // SCORING METHODS
  // ========================================================================

  private computeConfidence(
    comparables: ComparableProperty[],
    input: AVMInput,
  ): number {
    let confidence = 0.5;

    // More comparables = higher confidence
    confidence += Math.min(comparables.length * 0.02, 0.2);

    // Lower variance = higher confidence
    const prices = comparables.map(c => c.pricePerSqm);
    const variance = this.variance(prices);
    const avgPrice = this.average(prices);
    const cv = avgPrice > 0 ? Math.sqrt(variance) / avgPrice : 1;
    confidence -= cv * 0.3;

    // Feature coverage bonus
    const coverage = this.computeFeatureCoverage(input);
    confidence += coverage * 0.1;

    // Neighborhood match bonus
    if (input.neighborhood) {
      const matchingNeighborhood = comparables.filter(
        c => c.neighborhood?.toLowerCase() === input.neighborhood?.toLowerCase(),
      ).length;
      confidence += Math.min(matchingNeighborhood * 0.02, 0.1);
    }

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private computeLiquidityScore(
    input: AVMInput,
    comparables: ComparableProperty[],
  ): number {
    let score = 50;

    // Popular areas get higher liquidity
    if (comparables.length > 10) score += 15;
    if (comparables.length > 20) score += 10;

    // Standard room counts (2-3) are more liquid
    if (input.rooms >= 2 && input.rooms <= 3) score += 10;

    // Standard surfaces are more liquid
    if (input.surfaceSqm >= 40 && input.surfaceSqm <= 80) score += 10;

    // Furnished rentals are more liquid
    if (input.transactionType === 'RENT' && input.isFurnished) score += 10;

    // Good condition is more liquid
    if (input.condition === 'renovated' || input.condition === 'new') score += 10;

    return Math.min(100, Math.max(0, score));
  }

  private computeDealAttractivenessScore(
    estimatedPrice: number,
    comparables: ComparableProperty[],
  ): number {
    const avgPrice = this.average(comparables.map(c => c.priceEur));
    const diff = (avgPrice - estimatedPrice) / avgPrice;

    // Score based on how much below average
    let score = 50 + diff * 100;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private computePriceRange(
    comparables: ComparableProperty[],
    estimatedPrice: number,
    confidence: number,
  ): { min: number; max: number } {
    const pricesPerSqm = comparables.map(c => c.pricePerSqm);
    const stdDev = Math.sqrt(this.variance(pricesPerSqm));
    const avgPerSqm = this.average(pricesPerSqm);

    // Range width inversely proportional to confidence
    const rangeMultiplier = 1 + (1 - confidence);
    const deviation = (stdDev / avgPerSqm) * estimatedPrice * rangeMultiplier * 0.5;

    return {
      min: Math.round(estimatedPrice - deviation),
      max: Math.round(estimatedPrice + deviation),
    };
  }

  private computeFeatureCoverage(input: AVMInput): number {
    const features = [
      input.rooms,
      input.surfaceSqm,
      input.floor,
      input.yearBuilt,
      input.condition,
      input.isFurnished,
      input.amenities?.length,
    ];

    const provided = features.filter(f => f !== undefined && f !== null).length;
    return provided / features.length;
  }

  private computeAreaVolatility(comparables: ComparableProperty[]): number {
    const prices = comparables.map(c => c.pricePerSqm);
    const cv = Math.sqrt(this.variance(prices)) / this.average(prices);
    return Math.min(1, cv);
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private generateCacheKey(input: AVMInput): string {
    const keyData = {
      city: input.city.toLowerCase(),
      neighborhood: input.neighborhood?.toLowerCase(),
      type: input.propertyType,
      transaction: input.transactionType,
      rooms: input.rooms,
      surface: Math.round(input.surfaceSqm / 5) * 5, // Round to 5sqm buckets
      floor: input.floor,
      year: input.yearBuilt ? Math.round(input.yearBuilt / 5) * 5 : null,
      condition: input.condition,
      furnished: input.isFurnished,
    };

    const hash = crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex').slice(0, 12);
    return `avm:${hash}`;
  }

  private insufficientDataResult(
    input: AVMInput,
    compCount: number,
    cacheKey: string,
  ): AVMResult {
    this.logger.warn(
      `Insufficient comparables (${compCount}) and ML unavailable for: ${input.city}, ${input.rooms}rm, ${input.surfaceSqm}sqm`,
    );
    return {
      // recommendedPrice of -1 clearly signals "unknown" without being a
      // silently-wrong 0.  Consumers MUST check insufficientData before use.
      recommendedPrice: -1,
      priceRange: { min: -1, max: -1 },
      currency: 'EUR',
      liquidityScore: 0,
      dealAttractivenessScore: 0,
      confidence: 0,
      confidenceBreakdown: {
        compCount,
        featureCoverage: this.computeFeatureCoverage(input),
        areaVolatility: 1,
      },
      comparables: {
        count: compCount,
        avgPrice: 0,
        avgPricePerSqm: 0,
        medianPrice: 0,
      },
      factors: [],
      computedAt: new Date(),
      cacheKey,
      source: 'cma',
      insufficientData: true,
    };
  }

  private fallbackExplanation(
    avmResult: AVMResult,
    input: AVMInput,
    forSeller: boolean,
  ): AVMExplanation {
    const priceUnit = input.transactionType === 'RENT' ? '/lună' : '';

    // Date insuficiente: nu afișa preț numeric (ar fi „-1 EUR"), ci un mesaj onest.
    if (avmResult.insufficientData || avmResult.recommendedPrice < 0) {
      const loc = `${input.city}${input.neighborhood ? `, ${input.neighborhood}` : ''}`;
      return {
        summary: `Momentan nu există suficiente date comparabile pentru a estima un preț de încredere pentru această proprietate din ${loc}.`,
        priceJustification: `Pentru o evaluare automată fiabilă este nevoie de mai multe proprietăți similare în zonă. Pe măsură ce apar anunțuri și tranzacții comparabile, estimarea va deveni disponibilă.`,
        marketContext: `Sunt prea puține proprietăți comparabile în ${loc} pentru o evaluare automată în acest moment.`,
        recommendations: forSeller
          ? [
              'Stabilește prețul comparând manual cu anunțuri similare recente',
              'Adaugă cât mai multe detalii și fotografii de calitate',
              'Reia estimarea după ce apar mai multe anunțuri în zonă',
            ]
          : [
              'Compară manual cu alte anunțuri din zonă',
              'Solicită o evaluare profesională dacă este necesar',
            ],
        sellerTips: forSeller
          ? ['Estimarea automată va fi disponibilă când vor exista mai multe date comparabile în zonă']
          : undefined,
      };
    }

    return {
      summary: `Prețul recomandat pentru această proprietate este ${avmResult.recommendedPrice} EUR${priceUnit}, bazat pe analiza a ${avmResult.comparables.count} proprietăți similare din zonă.`,
      priceJustification: `Prețul a fost calculat folosind media ponderată a proprietăților comparabile, ajustată pentru caracteristicile specifice ale acestei proprietăți. Intervalul de preț estimat este ${avmResult.priceRange.min} - ${avmResult.priceRange.max} EUR.`,
      marketContext: `În zona ${input.city}${input.neighborhood ? `, ${input.neighborhood}` : ''}, prețul mediu pe metru pătrat este ${avmResult.comparables.avgPricePerSqm} EUR/mp pentru proprietăți similare.`,
      recommendations: forSeller
        ? [
            'Fotografii profesionale pot crește interesul cu până la 40%',
            'Descriere detaliată cu toate facilitățile',
            'Prețul recomandat oferă echilibru între viteză și valoare',
          ]
        : [
            'Verifică starea reală a proprietății la vizionare',
            'Compară cu alte opțiuni din zonă',
            'Negociază în funcție de starea actuală',
          ],
      sellerTips: forSeller
        ? [
            'Pregătește proprietatea pentru vizionări (curățenie, ordine)',
            'Fii flexibil cu programul de vizionări',
          ]
        : undefined,
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private variance(arr: number[]): number {
    if (arr.length === 0) return 0;
    const avg = this.average(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      this.logger.log('AVM cache cleared');
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
