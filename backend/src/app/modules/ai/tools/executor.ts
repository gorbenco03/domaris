/**
 * Tool Executor - Executes AI tool calls securely
 * Handles validation, rate limiting, and permission checks
 */

import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { SearchService, SearchFilters } from '../../search/search.service.js';
import { ToolCall, ToolResult, UserPreferences } from '../types/index.js';
import { TOOL_MAP } from './definitions.js';
import { Listing } from '../../../db/entities/listing.entity.js';
import { ListingImage } from '../../../db/entities/listingImage.entity.js';

interface ExecutionContext {
  userId?: number;
  conversationId: string;
  preferences: UserPreferences;
  shownListingIds: number[];
}

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(private readonly searchService: SearchService) {}

  async execute(
    toolCall: ToolCall,
    context: ExecutionContext,
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const toolDef = TOOL_MAP.get(toolCall.name);

    if (!toolDef) {
      return this.errorResult(toolCall, `Unknown tool: ${toolCall.name}`, startTime);
    }

    // Check authentication requirement
    if (toolDef.requiresAuth && !context.userId) {
      return this.errorResult(
        toolCall,
        'Această acțiune necesită autentificare. Te rugăm să te loghezi.',
        startTime,
      );
    }

    try {
      let result: any;

      switch (toolCall.name) {
        case 'search_properties':
          result = await this.executeSearch(toolCall.arguments, context);
          break;

        case 'get_property_details':
          result = await this.executeGetDetails(toolCall.arguments);
          break;

        case 'calculate_mortgage':
          result = this.executeCalculateMortgage(toolCall.arguments);
          break;

        case 'estimate_budget':
          result = this.executeEstimateBudget(toolCall.arguments);
          break;

        case 'recommend_areas':
          result = await this.executeRecommendAreas(toolCall.arguments);
          break;

        case 'get_price_estimate':
          result = await this.executeGetPriceEstimate(toolCall.arguments);
          break;

        case 'schedule_viewing':
          result = await this.executeScheduleViewing(toolCall.arguments, context);
          break;

        case 'save_search':
          result = await this.executeSaveSearch(toolCall.arguments, context);
          break;

        case 'compare_properties':
          result = await this.executeCompareProperties(toolCall.arguments);
          break;

        default:
          return this.errorResult(toolCall, `Tool not implemented: ${toolCall.name}`, startTime);
      }

      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        result,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      this.logger.error(`Tool execution error [${toolCall.name}]: ${error.message}`);
      return this.errorResult(toolCall, error.message, startTime);
    }
  }

  // ========================================================================
  // TOOL IMPLEMENTATIONS
  // ========================================================================

  private async executeSearch(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<any> {
    // Merge with user preferences (preferences as defaults)
    const filters: SearchFilters = {
      transactionType: args.transactionType || context.preferences.transactionType,
      city: args.city || context.preferences.cities?.[0],
      neighborhood: args.neighborhood || context.preferences.neighborhoods?.[0],
      priceMin: args.priceMin ?? context.preferences.priceMin,
      priceMax: args.priceMax ?? context.preferences.priceMax,
      rooms: args.rooms,
      roomsMin: args.roomsMin ?? context.preferences.roomsMin,
      roomsMax: args.roomsMax ?? context.preferences.roomsMax,
      surfaceMin: args.surfaceMin ?? context.preferences.surfaceMin,
      surfaceMax: args.surfaceMax ?? context.preferences.surfaceMax,
      propertyType: args.propertyType,
      isFurnished: args.isFurnished ?? context.preferences.isFurnished,
      petFriendly: args.petFriendly ?? context.preferences.petFriendly,
      amenities: args.amenities,
      sortBy: args.sortBy || 'relevance',
      limit: Math.min(args.limit || 5, 20),
      page: 1,
    };

    // Clean undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof SearchFilters] === undefined) {
        delete filters[key as keyof SearchFilters];
      }
    });

    this.logger.debug(`Executing search with filters: ${JSON.stringify(filters)}`);

    const searchResult = await this.searchService.search(filters);

    // Filter out already shown listings if we have alternatives
    let properties = searchResult.data;
    if (context.shownListingIds.length > 0 && properties.length > 3) {
      const newProperties = properties.filter(
        p => !context.shownListingIds.includes(p.id),
      );
      if (newProperties.length >= 3) {
        properties = newProperties;
      }
    }

    // Format for LLM consumption
    const formattedProperties = properties.slice(0, args.limit || 5).map(p => ({
      id: p.id,
      title: p.title,
      city: p.city,
      neighborhood: p.neighborhood,
      priceEur: p.priceEur,
      transactionType: p.transactionType,
      rooms: p.rooms,
      surfaceSqm: p.surfaceSqm,
      floor: p.floor,
      totalFloors: p.totalFloors,
      yearBuilt: p.yearBuilt,
      isFurnished: p.isFurnished,
      amenities: p.amenities || [],
      imageUrl: p.images?.[0]?.url,
      isPromoted: (p as any).isPromoted || false,
    }));

    return {
      properties: formattedProperties,
      total: searchResult.meta.total,
      page: searchResult.meta.page,
      hasMore: searchResult.meta.hasNextPage,
      filtersApplied: filters,
    };
  }

  private async executeGetDetails(args: Record<string, any>): Promise<any> {
    const { listingId } = args;
    
    const listing = await Listing.findByPk(listingId, {
      include: [
        {
          model: ListingImage,
          as: 'images',
          limit: 10,
          order: [['order', 'ASC']],
        },
      ],
    });

    if (!listing) {
      throw new Error('Proprietatea nu a fost găsită');
    }

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      city: listing.city,
      neighborhood: listing.neighborhood,
      addressText: listing.addressText,
      priceEur: listing.priceEur,
      transactionType: listing.transactionType,
      propertyType: listing.propertyType,
      rooms: listing.rooms,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      surfaceSqm: listing.surfaceSqm,
      floor: listing.floor,
      totalFloors: listing.totalFloors,
      yearBuilt: listing.yearBuilt,
      isFurnished: listing.isFurnished,
      hasCentralHeating: listing.hasCentralHeating,
      petFriendly: listing.petFriendly,
      amenities: listing.amenities || [],
      images: listing.images?.map(img => ({ url: img.url, order: img.order })) || [],
      postedAt: listing.postedAt,
      status: listing.status,
    };
  }

  private executeCalculateMortgage(args: Record<string, any>): any {
    const {
      propertyPrice,
      downPayment,
      downPaymentPercent,
      interestRateApr = 8,
      termYears = 20,
    } = args;

    // Calculate down payment
    let actualDownPayment = downPayment || 0;
    if (!downPayment && downPaymentPercent) {
      actualDownPayment = propertyPrice * (downPaymentPercent / 100);
    }

    const principal = propertyPrice - actualDownPayment;
    const monthlyRate = interestRateApr / 100 / 12;
    const numPayments = termYears * 12;

    // Monthly payment formula: P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = monthlyRate === 0
      ? principal / numPayments
      : principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - principal;

    return {
      propertyPrice,
      downPayment: Math.round(actualDownPayment),
      downPaymentPercent: Math.round((actualDownPayment / propertyPrice) * 100),
      loanAmount: Math.round(principal),
      interestRateApr,
      termYears,
      monthlyPayment: Math.round(monthlyPayment),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      currency: 'EUR',
    };
  }

  private executeEstimateBudget(args: Record<string, any>): any {
    const {
      monthlyIncome,
      desiredMonthlyPayment,
      downPaymentAvailable = 0,
      interestRateApr = 8,
      termYears = 20,
    } = args;

    // Max monthly payment is typically 30-40% of income
    let maxMonthlyPayment = desiredMonthlyPayment;
    if (!maxMonthlyPayment && monthlyIncome) {
      maxMonthlyPayment = monthlyIncome * 0.35;
    }

    if (!maxMonthlyPayment) {
      return { error: 'Trebuie să specifici venitul lunar sau plata dorită' };
    }

    const monthlyRate = interestRateApr / 100 / 12;
    const numPayments = termYears * 12;

    // Reverse mortgage formula to get principal
    const maxLoan = monthlyRate === 0
      ? maxMonthlyPayment * numPayments
      : maxMonthlyPayment * (Math.pow(1 + monthlyRate, numPayments) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments));

    const maxPropertyPrice = maxLoan + downPaymentAvailable;

    return {
      maxMonthlyPayment: Math.round(maxMonthlyPayment),
      maxLoanAmount: Math.round(maxLoan),
      downPaymentAvailable: Math.round(downPaymentAvailable),
      maxPropertyPrice: Math.round(maxPropertyPrice),
      assumptions: {
        interestRateApr,
        termYears,
        debtToIncomeRatio: monthlyIncome ? 0.35 : null,
      },
      currency: 'EUR',
    };
  }

  private async executeRecommendAreas(args: Record<string, any>): Promise<any> {
    const { city, budgetMax, transactionType, lifestyle } = args;

    // Static recommendations for Moldova - would be data-driven in production
    const chisinauAreas = [
      {
        name: 'Centru',
        characteristics: ['central', 'business', 'nightlife'],
        avgPriceRent: 500,
        avgPriceSale: 1200,
        pros: ['Locație centrală', 'Infrastructură dezvoltată', 'Transport accesibil'],
        cons: ['Zgomot', 'Prețuri ridicate', 'Parcare dificilă'],
      },
      {
        name: 'Botanica',
        characteristics: ['family', 'green', 'quiet'],
        avgPriceRent: 350,
        avgPriceSale: 900,
        pros: ['Zonă verde', 'Liniștită', 'Prețuri moderate', 'Grădinițe și școli'],
        cons: ['Mai departe de centru', 'Transport mai rar'],
      },
      {
        name: 'Buiucani',
        characteristics: ['family', 'quiet', 'green'],
        avgPriceRent: 380,
        avgPriceSale: 950,
        pros: ['Zonă rezidențială', 'Parcuri', 'Școli bune'],
        cons: ['Trafic în orele de vârf'],
      },
      {
        name: 'Ciocana',
        characteristics: ['family', 'students'],
        avgPriceRent: 300,
        avgPriceSale: 750,
        pros: ['Prețuri accesibile', 'Piața agroalimentară'],
        cons: ['Zonă mai veche', 'Necesită renovare'],
      },
      {
        name: 'Rîșcani',
        characteristics: ['central', 'business'],
        avgPriceRent: 400,
        avgPriceSale: 1000,
        pros: ['Aproape de centru', 'Infrastructură bună'],
        cons: ['Aglomerat', 'Trafic'],
      },
      {
        name: 'Telecentru',
        characteristics: ['quiet', 'family'],
        avgPriceRent: 320,
        avgPriceSale: 800,
        pros: ['Liniștit', 'Accesibil ca preț'],
        cons: ['Mai puține magazine'],
      },
    ];

    let areas = city?.toLowerCase().includes('chișinău') || city?.toLowerCase().includes('chisinau')
      ? chisinauAreas
      : [];

    // Filter by budget
    if (budgetMax) {
      areas = areas.filter(a => 
        transactionType === 'SALE' 
          ? a.avgPriceSale <= budgetMax 
          : a.avgPriceRent <= budgetMax,
      );
    }

    // Filter by lifestyle preferences
    if (lifestyle && lifestyle.length > 0) {
      areas = areas.sort((a, b) => {
        const aMatch = lifestyle.filter((l: string) => a.characteristics.includes(l)).length;
        const bMatch = lifestyle.filter((l: string) => b.characteristics.includes(l)).length;
        return bMatch - aMatch;
      });
    }

    return {
      city,
      areas: areas.slice(0, 5).map(a => ({
        name: a.name,
        avgPrice: transactionType === 'SALE' ? a.avgPriceSale : a.avgPriceRent,
        priceUnit: transactionType === 'SALE' ? '€/mp' : '€/lună',
        matchedLifestyle: lifestyle?.filter((l: string) => a.characteristics.includes(l)) || [],
        pros: a.pros,
        cons: a.cons,
      })),
      disclaimer: 'Prețurile sunt estimative și pot varia în funcție de caracteristicile proprietății.',
    };
  }

  private async executeGetPriceEstimate(args: Record<string, any>): Promise<any> {
    // This will be replaced by the full AVM engine
    // For now, use comparable-based estimation
    
    let property = args;
    
    // If listingId provided, fetch the property
    if (args.listingId) {
      const listing = await Listing.findByPk(args.listingId);
      if (listing) {
        property = {
          city: listing.city,
          neighborhood: listing.neighborhood,
          propertyType: listing.propertyType,
          transactionType: listing.transactionType,
          rooms: listing.rooms,
          surfaceSqm: listing.surfaceSqm,
          floor: listing.floor,
          yearBuilt: listing.yearBuilt,
          isFurnished: listing.isFurnished,
          amenities: listing.amenities,
          currentPrice: listing.priceEur,
        };
      }
    }

    if (!property.city || !property.surfaceSqm) {
      return { error: 'Date insuficiente pentru estimare' };
    }

    // Get comparables
    const comparables = await this.searchService.search({
      city: property.city,
      neighborhood: property.neighborhood,
      rooms: property.rooms,
      transactionType: property.transactionType,
      surfaceMin: property.surfaceSqm * 0.8,
      surfaceMax: property.surfaceSqm * 1.2,
      limit: 20,
    });

    if (comparables.data.length < 3) {
      return {
        error: 'Nu sunt suficiente proprietăți similare pentru o estimare precisă',
        comparablesFound: comparables.data.length,
      };
    }

    const prices = comparables.data.map(p => p.priceEur);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgPricePerSqm = comparables.data.reduce(
      (sum, p) => sum + (p.priceEur / (p.surfaceSqm || 1)),
      0,
    ) / comparables.data.length;

    const estimatedPrice = Math.round(avgPricePerSqm * property.surfaceSqm);
    
    // Calculate standard deviation for range
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    // Confidence based on sample size and variance
    const confidence = Math.min(
      0.95,
      Math.max(0.3, 0.6 + 0.02 * comparables.data.length - (stdDev / avgPrice) * 0.3),
    );

    const result = {
      recommendedPrice: estimatedPrice,
      priceRange: {
        min: Math.round(estimatedPrice - stdDev * 0.5),
        max: Math.round(estimatedPrice + stdDev * 0.5),
      },
      currency: 'EUR',
      confidence: Math.round(confidence * 100) / 100,
      comparables: {
        count: comparables.data.length,
        avgPrice: Math.round(avgPrice),
        avgPricePerSqm: Math.round(avgPricePerSqm),
      },
      priceUnit: property.transactionType === 'RENT' ? '/lună' : '',
    };

    // If current price provided, add comparison
    if (property.currentPrice) {
      const diff = ((property.currentPrice - estimatedPrice) / estimatedPrice) * 100;
      (result as any).currentPriceAnalysis = {
        currentPrice: property.currentPrice,
        vsEstimate: Math.round(diff),
        assessment: diff > 10 ? 'peste_piață' : diff < -10 ? 'sub_piață' : 'corect',
      };
    }

    return result;
  }

  private async executeScheduleViewing(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<any> {
    if (!context.userId) {
      throw new ForbiddenException('Trebuie să fii autentificat pentru a programa o vizionare');
    }

    const { listingId, preferredDates, preferredTimeSlot, message } = args;

    // Verify listing exists
    const listing = await Listing.findByPk(listingId);
    if (!listing) {
      throw new Error('Proprietatea nu a fost găsită');
    }

    // In production, this would create a viewing request
    // For now, return a success response
    return {
      success: true,
      message: 'Cererea de vizionare a fost trimisă proprietarului',
      listingId,
      listingTitle: listing.title,
      preferredDates,
      preferredTimeSlot,
      status: 'pending',
      note: 'Vei primi o notificare când proprietarul confirmă.',
    };
  }

  private async executeSaveSearch(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<any> {
    if (!context.userId) {
      throw new ForbiddenException('Trebuie să fii autentificat pentru a salva căutarea');
    }

    // In production, this would save to SavedSearch entity
    return {
      success: true,
      message: 'Căutarea a fost salvată',
      name: args.name || 'Căutarea mea',
      notifyFrequency: args.notifyFrequency || 'daily',
      filters: context.preferences,
    };
  }

  private async executeCompareProperties(args: Record<string, any>): Promise<any> {
    const { listingIds } = args;

    const listings = await Listing.findAll({
      where: { id: listingIds },
      include: [
        {
          model: ListingImage,
          as: 'images',
          limit: 1,
          order: [['order', 'ASC']],
        },
      ],
    });

    if (listings.length < 2) {
      return { error: 'Trebuie cel puțin 2 proprietăți pentru comparație' };
    }

    const comparison = listings.map(l => ({
      id: l.id,
      title: l.title,
      city: l.city,
      neighborhood: l.neighborhood,
      priceEur: l.priceEur,
      pricePerSqm: l.surfaceSqm ? Math.round(l.priceEur / l.surfaceSqm) : null,
      rooms: l.rooms,
      surfaceSqm: l.surfaceSqm,
      floor: l.floor,
      yearBuilt: l.yearBuilt,
      isFurnished: l.isFurnished,
      amenities: l.amenities || [],
      imageUrl: l.images?.[0]?.url,
    }));

    // Find best value
    const avgPricePerSqm = comparison.reduce((sum, c) => sum + (c.pricePerSqm || 0), 0) / comparison.length;
    const bestValue = comparison.reduce((best, current) => {
      if (!current.pricePerSqm) return best;
      if (!best.pricePerSqm) return current;
      return current.pricePerSqm < best.pricePerSqm ? current : best;
    });

    return {
      properties: comparison,
      analysis: {
        avgPricePerSqm: Math.round(avgPricePerSqm),
        bestValueId: bestValue.id,
        bestValueReason: `Cel mai bun preț/mp: ${bestValue.pricePerSqm}€`,
      },
    };
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  private errorResult(toolCall: ToolCall, error: string, startTime: number): ToolResult {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result: null,
      error,
      durationMs: Date.now() - startTime,
    };
  }
}
