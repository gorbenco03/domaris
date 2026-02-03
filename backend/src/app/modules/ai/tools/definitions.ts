/**
 * AI Tool Definitions - Function schemas for the conversational agent
 * These tools are what the AI can invoke to interact with the system
 */

import { ToolDefinition } from '../types/index.js';

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'search_properties',
    description: 'Search for properties based on user criteria. Use this when the user wants to find apartments, houses, or other real estate.',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        transactionType: {
          type: 'string',
          enum: ['RENT', 'SALE'],
          description: 'Whether looking to rent or buy',
        },
        city: {
          type: 'string',
          description: 'City name (e.g., Chișinău, Bălți)',
        },
        neighborhood: {
          type: 'string',
          description: 'Neighborhood/district name',
        },
        priceMin: {
          type: 'number',
          description: 'Minimum price in EUR',
        },
        priceMax: {
          type: 'number',
          description: 'Maximum price in EUR',
        },
        rooms: {
          type: 'integer',
          description: 'Exact number of rooms',
        },
        roomsMin: {
          type: 'integer',
          description: 'Minimum number of rooms',
        },
        roomsMax: {
          type: 'integer',
          description: 'Maximum number of rooms',
        },
        surfaceMin: {
          type: 'number',
          description: 'Minimum surface area in sqm',
        },
        surfaceMax: {
          type: 'number',
          description: 'Maximum surface area in sqm',
        },
        propertyType: {
          type: 'string',
          enum: ['APARTMENT', 'HOUSE', 'STUDIO', 'COMMERCIAL', 'LAND'],
        },
        isFurnished: {
          type: 'boolean',
          description: 'Whether property should be furnished',
        },
        petFriendly: {
          type: 'boolean',
          description: 'Whether pets are allowed',
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Required amenities (e.g., parking, balcony, central heating)',
        },
        sortBy: {
          type: 'string',
          enum: ['price_asc', 'price_desc', 'date_desc', 'relevance'],
          description: 'How to sort results',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 20,
          default: 5,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_property_details',
    description: 'Get detailed information about a specific property by ID',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        listingId: {
          type: 'integer',
          description: 'The property listing ID',
        },
      },
      required: ['listingId'],
    },
  },
  {
    name: 'calculate_mortgage',
    description: 'Calculate monthly mortgage payment. Use when user asks about financing, affordability, or monthly payments.',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        propertyPrice: {
          type: 'number',
          description: 'Total property price in EUR',
        },
        downPayment: {
          type: 'number',
          description: 'Down payment amount in EUR',
        },
        downPaymentPercent: {
          type: 'number',
          description: 'Down payment as percentage (0-100)',
        },
        interestRateApr: {
          type: 'number',
          description: 'Annual interest rate in percent',
        },
        termYears: {
          type: 'integer',
          description: 'Loan term in years',
          default: 20,
        },
      },
      required: ['propertyPrice'],
    },
  },
  {
    name: 'estimate_budget',
    description: 'Estimate affordable property price based on income or desired monthly payment',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        monthlyIncome: {
          type: 'number',
          description: 'Monthly income in EUR',
        },
        desiredMonthlyPayment: {
          type: 'number',
          description: 'Desired monthly payment in EUR',
        },
        downPaymentAvailable: {
          type: 'number',
          description: 'Available down payment in EUR',
        },
        interestRateApr: {
          type: 'number',
          description: 'Expected annual interest rate',
          default: 8,
        },
        termYears: {
          type: 'integer',
          default: 20,
        },
      },
      required: [],
    },
  },
  {
    name: 'schedule_viewing',
    description: 'Request to schedule a property viewing. Requires authentication.',
    requiresAuth: true,
    rateLimit: 10,
    parameters: {
      type: 'object',
      properties: {
        listingId: {
          type: 'integer',
          description: 'The property listing ID',
        },
        preferredDates: {
          type: 'array',
          items: { type: 'string', format: 'date' },
          description: 'Preferred dates for viewing (ISO format)',
          maxItems: 3,
        },
        preferredTimeSlot: {
          type: 'string',
          enum: ['morning', 'afternoon', 'evening'],
        },
        message: {
          type: 'string',
          description: 'Optional message to the owner',
          maxLength: 500,
        },
      },
      required: ['listingId'],
    },
  },
  {
    name: 'recommend_areas',
    description: 'Get neighborhood/area recommendations based on criteria like budget, lifestyle, commute',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City to get recommendations for',
        },
        budgetMax: {
          type: 'number',
          description: 'Maximum budget in EUR',
        },
        transactionType: {
          type: 'string',
          enum: ['RENT', 'SALE'],
        },
        lifestyle: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['quiet', 'central', 'nightlife', 'family', 'students', 'green', 'business'],
          },
        },
        commuteTo: {
          type: 'string',
          description: 'Location user needs to commute to',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_price_estimate',
    description: 'Get AI-powered price estimate for a property (AVM). Use when user asks if a price is fair or wants valuation.',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        listingId: {
          type: 'integer',
          description: 'Existing listing ID to evaluate',
        },
        city: {
          type: 'string',
        },
        neighborhood: {
          type: 'string',
        },
        propertyType: {
          type: 'string',
        },
        transactionType: {
          type: 'string',
          enum: ['RENT', 'SALE'],
        },
        rooms: {
          type: 'integer',
        },
        surfaceSqm: {
          type: 'number',
        },
        floor: {
          type: 'integer',
        },
        yearBuilt: {
          type: 'integer',
        },
        isFurnished: {
          type: 'boolean',
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: [],
    },
  },
  {
    name: 'save_search',
    description: 'Save current search criteria for alerts. Requires authentication.',
    requiresAuth: true,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the saved search',
        },
        notifyFrequency: {
          type: 'string',
          enum: ['instant', 'daily', 'weekly'],
          default: 'daily',
        },
      },
      required: [],
    },
  },
  {
    name: 'compare_properties',
    description: 'Compare multiple properties side by side',
    requiresAuth: false,
    parameters: {
      type: 'object',
      properties: {
        listingIds: {
          type: 'array',
          items: { type: 'integer' },
          minItems: 2,
          maxItems: 5,
          description: 'IDs of properties to compare',
        },
      },
      required: ['listingIds'],
    },
  },
];

export const TOOL_MAP = new Map(TOOL_DEFINITIONS.map(t => [t.name, t]));

export function getToolSchema(name: string): ToolDefinition | undefined {
  return TOOL_MAP.get(name);
}

export function getToolsForOpenAI(): Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}> {
  return TOOL_DEFINITIONS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
