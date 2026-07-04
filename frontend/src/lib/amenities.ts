/**
 * Facilități (Amenities) — listă pentru frontend.
 *
 * Copie locală a listei partajate din `@domaris/types` (packages/types/src/lib/amenities.ts).
 * Ținută local pentru că build-ul de producție al frontend-ului folosește `next build`
 * (Turbopack), care nu rezolvă pachetul de workspace `@domaris/types` la fel ca Nx.
 * Trebuie păstrată sincronizată cu sursa partajată (aceleași ID-uri ca mobile + backend).
 */

// ============================================================================
// TYPES
// ============================================================================

export type AmenityCategory =
  | 'comfort'
  | 'appliances'
  | 'outdoor'
  | 'security'
  | 'tech'
  | 'utilities';

export interface AmenityDefinition {
  id: string;
  label: string;
  category: AmenityCategory;
}

export type AmenityId =
  // Comfort
  | 'AIR_CONDITIONING'
  | 'CENTRAL_HEATING'
  | 'UNDERFLOOR_HEATING'
  | 'FIREPLACE'
  | 'ELEVATOR'
  | 'FURNISHED'
  | 'SEMI_FURNISHED'
  | 'DOUBLE_GLAZING'
  | 'THERMAL_INSULATION'
  // Appliances
  | 'KITCHEN_APPLIANCES'
  | 'WASHER'
  | 'DRYER'
  | 'DISHWASHER'
  // Outdoor
  | 'BALCONY'
  | 'TERRACE'
  | 'GARDEN'
  | 'POOL'
  | 'SAUNA'
  | 'GYM'
  | 'STORAGE_ROOM'
  | 'UNDERGROUND_PARKING'
  // Security
  | 'SECURITY_SYSTEM'
  | 'VIDEO_INTERCOM'
  | 'INTERCOM'
  | 'CONCIERGE'
  // Tech
  | 'SMART_HOME'
  | 'FIBER_INTERNET'
  | 'CABLE_TV'
  | 'PET_FRIENDLY'
  // Utilities
  | 'CENTRAL_GAS'
  | 'SOLAR_PANELS'
  | 'GENERATOR';

// ============================================================================
// CONSTANTS
// ============================================================================

export const AMENITIES: Array<{ id: AmenityId; label: string; category: AmenityCategory }> = [
  // ── Comfort ────────────────────────────────────────────────────────────────
  { id: 'AIR_CONDITIONING',   label: 'Aer condiționat',          category: 'comfort' },
  { id: 'CENTRAL_HEATING',    label: 'Încălzire centrală',        category: 'comfort' },
  { id: 'UNDERFLOOR_HEATING', label: 'Încălzire în pardoseală',   category: 'comfort' },
  { id: 'FIREPLACE',          label: 'Șemineu',                   category: 'comfort' },
  { id: 'ELEVATOR',           label: 'Lift',                      category: 'comfort' },
  { id: 'FURNISHED',          label: 'Mobilat',                   category: 'comfort' },
  { id: 'SEMI_FURNISHED',     label: 'Semimobilat',               category: 'comfort' },
  { id: 'DOUBLE_GLAZING',     label: 'Geam termopan',             category: 'comfort' },
  { id: 'THERMAL_INSULATION', label: 'Termoizolație',             category: 'comfort' },

  // ── Appliances ─────────────────────────────────────────────────────────────
  { id: 'KITCHEN_APPLIANCES', label: 'Bucătărie utilată',         category: 'appliances' },
  { id: 'WASHER',             label: 'Mașină de spălat',          category: 'appliances' },
  { id: 'DRYER',              label: 'Uscător',                   category: 'appliances' },
  { id: 'DISHWASHER',         label: 'Mașină de vase',            category: 'appliances' },

  // ── Outdoor ────────────────────────────────────────────────────────────────
  { id: 'BALCONY',             label: 'Balcon',                   category: 'outdoor' },
  { id: 'TERRACE',             label: 'Terasă',                   category: 'outdoor' },
  { id: 'GARDEN',              label: 'Grădină',                  category: 'outdoor' },
  { id: 'POOL',                label: 'Piscină',                  category: 'outdoor' },
  { id: 'SAUNA',               label: 'Saună',                    category: 'outdoor' },
  { id: 'GYM',                 label: 'Sală de fitness',          category: 'outdoor' },
  { id: 'STORAGE_ROOM',        label: 'Boxă',                     category: 'outdoor' },
  { id: 'UNDERGROUND_PARKING', label: 'Parcare subterană',        category: 'outdoor' },

  // ── Security ───────────────────────────────────────────────────────────────
  { id: 'SECURITY_SYSTEM', label: 'Sistem de securitate',         category: 'security' },
  { id: 'VIDEO_INTERCOM',  label: 'Interfon video',               category: 'security' },
  { id: 'INTERCOM',        label: 'Interfon',                     category: 'security' },
  { id: 'CONCIERGE',       label: 'Portar',                       category: 'security' },

  // ── Tech ───────────────────────────────────────────────────────────────────
  { id: 'SMART_HOME',    label: 'Smart Home',                     category: 'tech' },
  { id: 'FIBER_INTERNET', label: 'Internet fibră',                category: 'tech' },
  { id: 'CABLE_TV',      label: 'Cablu TV',                       category: 'tech' },
  { id: 'PET_FRIENDLY',  label: 'Animale permise',                category: 'tech' },

  // ── Utilities ──────────────────────────────────────────────────────────────
  { id: 'CENTRAL_GAS',   label: 'Centrală pe gaz',                category: 'utilities' },
  { id: 'SOLAR_PANELS',  label: 'Panouri solare',                 category: 'utilities' },
  { id: 'GENERATOR',     label: 'Generator',                      category: 'utilities' },
];

/** Map id -> AmenityDefinition pentru lookup O(1) */
export const AMENITY_MAP: Readonly<Record<AmenityId, { id: AmenityId; label: string; category: AmenityCategory }>> =
  Object.fromEntries(AMENITIES.map((a) => [a.id, a])) as Readonly<
    Record<AmenityId, { id: AmenityId; label: string; category: AmenityCategory }>
  >;

/** Toate id-urile de facilități */
export const AMENITY_IDS: AmenityId[] = AMENITIES.map((a) => a.id);

/** Label-uri pentru categorii (RO) */
export const AMENITY_CATEGORY_LABELS: Record<AmenityCategory, string> = {
  comfort:    'Confort',
  appliances: 'Electrocasnice',
  outdoor:    'Exterior',
  security:   'Securitate',
  tech:       'Tehnologie',
  utilities:  'Utilități',
};
