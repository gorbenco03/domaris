/**
 * ValuationEngine tests (pure logic, no real DB or ML service)
 *
 * Architecture note (after AI refactor):
 * - ValuationEngine(mlAvmClient: MlAvmClient) — requires injected ML client
 * - Branch A: ML confidence >= 0.4 → use ML price
 * - Branch B (CMA): ML null OR confidence < 0.4 → use comparables
 * - < 3 comparables in CMA branch → insufficientDataResult (price = 0, NOT 0 if ML branch is taken)
 *
 * Tests mock both MlAvmClient.predict AND Listing.findAll so no real I/O needed.
 */

import { ValuationEngine } from './valuation-engine';
import { MlAvmClient } from './ml-client';
import { AVMInput } from '../types/index';

// ─── Mock Listing.findAll ────────────────────────────────────────────────────

jest.mock('../../../db/entities/listing.entity.js', () => ({
  Listing: {
    findAll: jest.fn(),
  },
}));
import { Listing } from '../../../db/entities/listing.entity.js';
const MockListing = Listing as jest.Mocked<typeof Listing>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_INPUT: AVMInput = {
  city: 'Chisinau',
  propertyType: 'APARTMENT',
  transactionType: 'SALE',
  rooms: 2,
  surfaceSqm: 60,
};

/** Build a raw listing row as returned by Listing.findAll({ raw: true }) */
function mkListing(overrides: Partial<any> = {}): any {
  return {
    id: Math.floor(Math.random() * 100000),
    priceEur: 60000,
    surfaceSqm: 60,
    rooms: 2,
    floor: 5,
    totalFloors: 9,
    yearBuilt: 2000,
    isFurnished: false,
    neighborhood: null,
    postedAt: new Date(),
    ...overrides,
  };
}

function buildListings(count: number, pricePerSqm = 1000, overrides: Partial<any> = {}): any[] {
  return Array.from({ length: count }, (_, i) =>
    mkListing({ id: i + 1, surfaceSqm: 60, priceEur: pricePerSqm * 60, ...overrides }),
  );
}

/** Build a mock ML prediction response */
function mlPrediction(price: number, confidence: number) {
  return {
    predicted_price: price,
    price_min: price * 0.9,
    price_max: price * 1.1,
    confidence_score: confidence,
    model_version: 'v1.0',
    prediction_timestamp: new Date().toISOString(),
  };
}

/** Create an engine with a mocked MlAvmClient */
function makeEngine(mlPredict: jest.Mock): ValuationEngine {
  const mockMlClient = { predict: mlPredict } as unknown as MlAvmClient;
  const engine = new ValuationEngine(mockMlClient);
  (engine as any).cache.clear();
  return engine;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('ValuationEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = ''; // ensure LLM is disabled
  });

  // ─── Branch A: ML path ─────────────────────────────────────────────────────

  describe('ML branch (confidence >= 0.4)', () => {
    it('returns ML price when confidence is exactly 0.4', async () => {
      const predict = jest.fn().mockResolvedValue(mlPrediction(55000, 0.4));
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.recommendedPrice).toBe(55000);
      expect(result.source).toBe('ml');
    });

    it('returns ML price when confidence is high (0.9)', async () => {
      const predict = jest.fn().mockResolvedValue(mlPrediction(70000, 0.9));
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.recommendedPrice).toBe(70000);
      expect(result.confidence).toBe(0.9);
    });

    it('uses ML priceRange from ML service', async () => {
      const predict = jest.fn().mockResolvedValue(mlPrediction(60000, 0.8));
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.priceRange.min).toBe(Math.round(60000 * 0.9));
      expect(result.priceRange.max).toBe(Math.round(60000 * 1.1));
    });

    it('includes mlModelVersion in result', async () => {
      const predict = jest.fn().mockResolvedValue({
        predicted_price: 65000,
        price_min: 58500,
        price_max: 71500,
        confidence_score: 0.75,
        model_version: 'v2.1',
        prediction_timestamp: new Date().toISOString(),
      });
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.mlModelVersion).toBe('v2.1');
    });

    it('rounds ML predicted_price to integer', async () => {
      const predict = jest.fn().mockResolvedValue(mlPrediction(60123.67, 0.6));
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.recommendedPrice).toBe(60124);
    });
  });

  // ─── Branch B: CMA path (ML null or low confidence) ───────────────────────

  describe('CMA branch (ML null or confidence < 0.4)', () => {
    it('falls back to CMA when ML returns null (service unavailable)', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.source).toBe('cma');
      expect(result.recommendedPrice).toBeGreaterThan(0);
    });

    it('falls back to CMA when ML confidence < 0.4', async () => {
      const predict = jest.fn().mockResolvedValue(mlPrediction(50000, 0.3));
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.source).toBe('cma');
    });

    // ── Insufficient data in CMA branch ───────────────────────────────────────

    it('returns insufficientData=true with recommendedPrice=-1 when 0 comparables in CMA branch', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      // Production code returns -1 (sentinel for "unknown") instead of 0
      expect(result.recommendedPrice).toBe(-1);
      expect(result.insufficientData).toBe(true);
      expect(result.confidence).toBe(0);
    });

    it('returns insufficientData=true when exactly 2 comparables in CMA branch', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue([mkListing(), mkListing({ id: 2 })]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.recommendedPrice).toBe(-1);
      expect(result.insufficientData).toBe(true);
      expect(result.confidenceBreakdown.compCount).toBe(2);
    });

    it('sets areaVolatility=1 for insufficient data result', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue([]);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.confidenceBreakdown.areaVolatility).toBe(1);
    });

    it('computes positive price with >= 3 comparables in CMA branch', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.recommendedPrice).toBeGreaterThan(0);
      expect(result.comparables.count).toBe(5);
    });

    it('CMA price is close to pricePerSqm * surface for homogeneous comparables', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      const result = await engine.valuate({ ...BASE_INPUT, surfaceSqm: 60 });

      // ~60,000 EUR for 5 identical comparables at 1000 EUR/sqm * 60sqm
      expect(result.recommendedPrice).toBeGreaterThanOrEqual(50000);
      expect(result.recommendedPrice).toBeLessThanOrEqual(70000);
    });

    it('priceRange min <= recommendedPrice <= priceRange max in CMA branch', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      // Use heterogeneous listings (varying price) so stdDev > 0 and range is not zero-width
      const listings = [
        mkListing({ id: 1, priceEur: 50000 }),
        mkListing({ id: 2, priceEur: 60000 }),
        mkListing({ id: 3, priceEur: 70000 }),
        mkListing({ id: 4, priceEur: 65000 }),
        mkListing({ id: 5, priceEur: 55000 }),
      ];
      MockListing.findAll.mockResolvedValue(listings);

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.priceRange.min).toBeLessThanOrEqual(result.recommendedPrice);
      expect(result.priceRange.max).toBeGreaterThanOrEqual(result.recommendedPrice);
    });
  });

  // ─── Adjustment factors (CMA branch) ─────────────────────────────────────

  describe('CMA adjustment factors', () => {
    function cmaEngine() {
      const predict = jest.fn().mockResolvedValue(null);
      return makeEngine(predict);
    }

    async function valuateWith(inputOverride: Partial<AVMInput>) {
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));
      const engine = cmaEngine();
      return engine.valuate({ ...BASE_INPUT, city: `city_${Math.random()}`, ...inputOverride });
    }

    it('floor 0 applies -5% factor', async () => {
      const result = await valuateWith({ floor: 0 });
      const factor = result.factors.find((f) => f.impact === -5);
      expect(factor).toBeDefined();
    });

    it('floor 1 applies -5% factor', async () => {
      const result = await valuateWith({ floor: 1 });
      const factor = result.factors.find((f) => f.impact === -5);
      expect(factor).toBeDefined();
    });

    it('top floor applies +3% factor', async () => {
      const result = await valuateWith({ floor: 9, totalFloors: 10 });
      const factor = result.factors.find((f) => f.impact === 3);
      expect(factor).toBeDefined();
    });

    it('condition=needs_work applies -15% factor', async () => {
      const result = await valuateWith({ condition: 'needs_work' });
      const factor = result.factors.find((f) => f.impact === -15);
      expect(factor).toBeDefined();
    });

    it('condition=new applies +10% factor', async () => {
      const result = await valuateWith({ condition: 'new' });
      const factor = result.factors.find((f) => f.impact === 10);
      expect(factor).toBeDefined();
    });

    it('condition=renovated applies +7% factor', async () => {
      const result = await valuateWith({ condition: 'renovated' });
      const factor = result.factors.find((f) => f.impact === 7);
      expect(factor).toBeDefined();
    });

    it('isFurnished=true on RENT adds +8% factor', async () => {
      const result = await valuateWith({ transactionType: 'RENT', isFurnished: true });
      const factor = result.factors.find((f) => f.impact === 8);
      expect(factor).toBeDefined();
    });

    it('isFurnished does NOT add rental bonus on SALE', async () => {
      const result = await valuateWith({ transactionType: 'SALE', isFurnished: true });
      const factor = result.factors.find((f) => f.name === 'Mobilat');
      expect(factor).toBeUndefined();
    });

    it('premium amenities add positive factor', async () => {
      const result = await valuateWith({ amenities: ['parcare subterană', 'terasă'] });
      const factor = result.factors.find((f) => f.name === 'Facilități premium');
      expect(factor).toBeDefined();
      expect(factor!.impact).toBeGreaterThan(0);
    });

    it('premium amenity bonus is capped at 8%', async () => {
      const result = await valuateWith({
        amenities: ['parcare', 'garaj', 'terasă', 'grădină', 'piscină'],
      });
      const factor = result.factors.find((f) => f.name === 'Facilități premium');
      expect(factor!.impact).toBeLessThanOrEqual(8);
    });
  });

  // ─── Confidence (CMA branch) ──────────────────────────────────────────────

  describe('confidence (CMA)', () => {
    it('is between 0.3 and 0.95', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(10, 1000));

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  // ─── Caching ──────────────────────────────────────────────────────────────

  describe('caching', () => {
    it('serves cached result on second call with identical input', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      const first = await engine.valuate(BASE_INPUT);

      // Clear counts
      MockListing.findAll.mockClear();
      predict.mockClear();

      const second = await engine.valuate(BASE_INPUT);

      // No new DB/ML calls
      expect(MockListing.findAll).not.toHaveBeenCalled();
      expect(predict).not.toHaveBeenCalled();
      expect(second.cacheKey).toBe(first.cacheKey);
    });

    it('invalidateCache() removes all cached entries', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      await engine.valuate(BASE_INPUT);

      engine.invalidateCache();
      expect((engine as any).cache.size).toBe(0);
    });
  });

  // ─── liquidityScore ───────────────────────────────────────────────────────

  describe('liquidityScore', () => {
    it('is between 0 and 100', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 1000));

      const engine = makeEngine(predict);
      const result = await engine.valuate(BASE_INPUT);

      expect(result.liquidityScore).toBeGreaterThanOrEqual(0);
      expect(result.liquidityScore).toBeLessThanOrEqual(100);
    });

    it('furnished RENT has higher liquidity than unfurnished RENT', async () => {
      const predict = jest.fn().mockResolvedValue(null);
      MockListing.findAll.mockResolvedValue(buildListings(5, 500));

      const engineA = makeEngine(predict);
      const unfurnished = await engineA.valuate({
        ...BASE_INPUT,
        transactionType: 'RENT',
        isFurnished: false,
        city: 'CityUnfurnished',
      });

      MockListing.findAll.mockResolvedValue(buildListings(5, 500));
      const engineB = makeEngine(predict);
      const furnished = await engineB.valuate({
        ...BASE_INPUT,
        transactionType: 'RENT',
        isFurnished: true,
        city: 'CityFurnished',
      });

      expect(furnished.liquidityScore).toBeGreaterThan(unfurnished.liquidityScore);
    });
  });

  // ─── Private math helpers ─────────────────────────────────────────────────

  describe('math helpers', () => {
    let engine: ValuationEngine;

    beforeEach(() => {
      const predict = jest.fn().mockResolvedValue(null);
      engine = makeEngine(predict);
    });

    it('median of odd-length array', () => {
      expect((engine as any).median([3, 1, 4, 1, 5])).toBe(3);
    });

    it('median of even-length array', () => {
      expect((engine as any).median([1, 2, 3, 4])).toBe(2.5);
    });

    it('median of single element', () => {
      expect((engine as any).median([42])).toBe(42);
    });

    it('median of empty array is 0', () => {
      expect((engine as any).median([])).toBe(0);
    });

    it('average of empty array is 0', () => {
      expect((engine as any).average([])).toBe(0);
    });

    it('variance of identical values is 0', () => {
      expect((engine as any).variance([5, 5, 5])).toBe(0);
    });

    it('variance of [1, 3] is 1', () => {
      expect((engine as any).variance([1, 3])).toBeCloseTo(1, 5);
    });
  });
});
