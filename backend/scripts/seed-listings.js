#!/usr/bin/env node
/**
 * Populeaza baza de date cu anunturi random.
 *
 * Exemple:
 *   node backend/scripts/seed-listings.js
 *   node backend/scripts/seed-listings.js 25
 *   node backend/scripts/seed-listings.js --count=25 --owner-id=1
 *   node backend/scripts/seed-listings.js --count=30 --status=early_access --images=3-6
 *   node backend/scripts/seed-listings.js --count=15 --status=mixed --no-images
 */

const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Încarcă .env din backend
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
}

const DEFAULT_OPTIONS = {
  count: 10,
  ownerId: null,
  city: 'Chisinau',
  status: 'public',
  withImages: true,
  minImages: 3,
  maxImages: 6,
};

const VALID_STATUSES = new Set([
  'new',
  'early_access',
  'public',
  'rented',
  'hidden',
  'expired',
  'mixed',
  'random',
]);

const NEIGHBORHOODS = [
  {
    name: 'Centru',
    lat: 47.0228,
    lng: 28.8362,
    streets: ['Str. Ismail', 'Bd. Stefan cel Mare', 'Str. Armeneasca', 'Str. Tighina'],
  },
  {
    name: 'Botanica',
    lat: 46.9908,
    lng: 28.8576,
    streets: ['Bd. Decebal', 'Bd. Dacia', 'Str. Trandafirilor', 'Str. Independentei'],
  },
  {
    name: 'Buiucani',
    lat: 47.0314,
    lng: 28.7852,
    streets: ['Str. Alba Iulia', 'Str. Ion Creanga', 'Str. Vasile Lupu', 'Str. Paris'],
  },
  {
    name: 'Riscani',
    lat: 47.0502,
    lng: 28.8545,
    streets: ['Str. Alecu Russo', 'Str. Bogdan Voievod', 'Bd. Moscova', 'Str. Kiev'],
  },
  {
    name: 'Ciocana',
    lat: 47.0446,
    lng: 28.8947,
    streets: ['Str. Mircea cel Batran', 'Str. Ginta Latina', 'Str. Petru Zadnipru', 'Bd. M. Sadoveanu'],
  },
];

const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'COMMERCIAL'];
const TRANSACTION_TYPES = ['SALE', 'RENT'];

const AMENITIES = [
  'AIR_CONDITIONING',
  'CENTRAL_HEATING',
  'UNDERFLOOR_HEATING',
  'FIREPLACE',
  'ELEVATOR',
  'FURNISHED',
  'SEMI_FURNISHED',
  'KITCHEN_APPLIANCES',
  'WASHER',
  'DRYER',
  'DISHWASHER',
  'BALCONY',
  'TERRACE',
  'GARDEN',
  'POOL',
  'GYM',
  'SAUNA',
  'STORAGE',
  'SECURITY_SYSTEM',
  'VIDEO_INTERCOM',
  'SMART_HOME',
  'FIBER_INTERNET',
  'CABLE_TV',
  'PET_FRIENDLY',
];

const IMAGE_URLS = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
];

function printUsage() {
  console.log(`
Utilizare:
  node backend/scripts/seed-listings.js [count] [ownerId]
  node backend/scripts/seed-listings.js --count=20 --owner-id=1 --status=public --city=Chisinau
  node backend/scripts/seed-listings.js --count=30 --status=mixed --images=2-5
  node backend/scripts/seed-listings.js --count=15 --no-images

Optiuni:
  --count=NUMAR         Cate listari sa fie create (default: 10)
  --owner-id=ID         Creeaza listari pentru user-ul dat (default: primul user din DB)
  --status=VAL          public | early_access | new | rented | hidden | expired | mixed
  --city=NUME           Orasul salvat in DB (default: Chisinau)
  --images=N            N imagini/listare (ex: --images=4)
  --images=A-B          interval imagini/listare (ex: --images=2-6)
  --no-images           Nu adauga imagini
  --help, -h            Afiseaza acest mesaj
`);
}

function normalizeArgs(argv) {
  const cleaned = argv.filter((arg) => arg !== '--');

  if (cleaned[0] && /^--\d+$/.test(cleaned[0])) {
    cleaned[0] = cleaned[0].slice(2);
  }

  return cleaned;
}

function parseImageRange(rawValue) {
  const value = String(rawValue || '').trim();

  if (!value) {
    throw new Error('Valoarea pentru --images este goala.');
  }

  if (value.includes('-')) {
    const [minRaw, maxRaw] = value.split('-');
    const min = Number(minRaw);
    const max = Number(maxRaw);

    if (!Number.isInteger(min) || !Number.isInteger(max) || min <= 0 || max <= 0 || max < min) {
      throw new Error('Format invalid pentru --images. Exemplu valid: --images=2-6');
    }

    return { min, max };
  }

  const fixed = Number(value);
  if (!Number.isInteger(fixed) || fixed <= 0) {
    throw new Error('Format invalid pentru --images. Exemplu valid: --images=4');
  }

  return { min: fixed, max: fixed };
}

function parseArgs(argv) {
  const args = normalizeArgs(argv);
  const options = { ...DEFAULT_OPTIONS };
  const positional = [];

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--no-images') {
      options.withImages = false;
      continue;
    }

    if (arg.startsWith('--count=')) {
      options.count = Number(arg.split('=')[1]);
      continue;
    }

    if (arg.startsWith('--owner-id=')) {
      options.ownerId = Number(arg.split('=')[1]);
      continue;
    }

    if (arg.startsWith('--owner=')) {
      options.ownerId = Number(arg.split('=')[1]);
      continue;
    }

    if (arg.startsWith('--status=')) {
      options.status = String(arg.split('=')[1] || '').toLowerCase();
      continue;
    }

    if (arg.startsWith('--city=')) {
      options.city = String(arg.split('=')[1] || '').trim() || options.city;
      continue;
    }

    if (arg.startsWith('--images=')) {
      const { min, max } = parseImageRange(arg.split('=')[1]);
      options.minImages = min;
      options.maxImages = max;
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(`Argument necunoscut: ${arg}`);
    }

    positional.push(arg);
  }

  if (positional[0]) {
    options.count = Number(positional[0]);
  }

  if (positional[1]) {
    options.ownerId = Number(positional[1]);
  }

  if (!Number.isInteger(options.count) || options.count <= 0 || options.count > 1000) {
    throw new Error('count trebuie sa fie un numar intreg intre 1 si 1000.');
  }

  if (options.ownerId !== null && (!Number.isInteger(options.ownerId) || options.ownerId <= 0)) {
    throw new Error('owner-id trebuie sa fie un numar intreg pozitiv.');
  }

  if (!VALID_STATUSES.has(options.status)) {
    throw new Error(
      'status invalid. Valori permise: public, early_access, new, rented, hidden, expired, mixed'
    );
  }

  if (!options.withImages) {
    options.minImages = 0;
    options.maxImages = 0;
  }

  return options;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(list) {
  return list[getRandomInt(0, list.length - 1)];
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickAmenities() {
  const max = Math.min(AMENITIES.length, 10);
  const count = getRandomInt(4, max);
  return shuffle(AMENITIES).slice(0, count);
}

function getPriceRange(transactionType, propertyType) {
  if (transactionType === 'RENT') {
    if (propertyType === 'HOUSE') return [550, 2400];
    if (propertyType === 'COMMERCIAL') return [650, 4200];
    return [280, 1700];
  }

  if (propertyType === 'HOUSE') return [85000, 380000];
  if (propertyType === 'COMMERCIAL') return [90000, 620000];
  return [45000, 240000];
}

function resolveStatus(statusOption) {
  if (statusOption === 'mixed' || statusOption === 'random') {
    return Math.random() < 0.35 ? 'early_access' : 'public';
  }
  return statusOption;
}

function buildListingPayload(ownerId, options) {
  const propertyType = pickRandom(PROPERTY_TYPES);
  const transactionType = pickRandom(TRANSACTION_TYPES);
  const area = pickRandom(NEIGHBORHOODS);
  const status = resolveStatus(options.status);

  const [minPrice, maxPrice] = getPriceRange(transactionType, propertyType);
  const rooms = propertyType === 'COMMERCIAL' ? getRandomInt(1, 8) : getRandomInt(1, 6);
  const bedrooms = propertyType === 'COMMERCIAL' ? null : Math.max(1, rooms - getRandomInt(0, 1));
  const bathrooms = propertyType === 'COMMERCIAL' ? getRandomInt(1, 2) : getRandomInt(1, 3);
  const totalFloors = propertyType === 'HOUSE' ? getRandomInt(1, 3) : getRandomInt(4, 16);
  const floor = propertyType === 'HOUSE' ? getRandomInt(0, totalFloors - 1) : getRandomInt(0, totalFloors);
  const surfaceSqm = propertyType === 'COMMERCIAL' ? getRandomInt(35, 260) : getRandomInt(28, 220);

  const titleTypeLabel = {
    APARTMENT: 'Apartament',
    HOUSE: 'Casa',
    COMMERCIAL: 'Spatiu comercial',
  }[propertyType];

  const transactionLabel = transactionType === 'RENT' ? 'de inchiriat' : 'de vanzare';
  const title = `${titleTypeLabel} ${rooms} camere ${transactionLabel} - ${area.name}`;

  const addressText = `${pickRandom(area.streets)} nr. ${getRandomInt(1, 180)}`;
  const lat = Number((area.lat + (Math.random() - 0.5) * 0.03).toFixed(8));
  const lng = Number((area.lng + (Math.random() - 0.5) * 0.03).toFixed(8));

  const now = new Date();
  const publicFrom =
    status === 'early_access' ? new Date(now.getTime() + 12 * 60 * 60 * 1000) : now;

  const description = [
    `${titleTypeLabel} modern, bine compartimentat, in zona ${area.name}.`,
    `Suprafata: ${surfaceSqm} mp, ${rooms} camere, ${bathrooms} bai.`,
    `Acces rapid la transport public, magazine si puncte de interes.`,
    transactionType === 'RENT'
      ? 'Disponibil imediat pentru inchiriere pe termen lung.'
      : 'Ideal pentru locuit sau investitie pe termen mediu/lung.',
  ].join(' ');

  return {
    title,
    description,
    transactionType,
    propertyType,
    city: options.city,
    neighborhood: area.name,
    rooms,
    bedrooms,
    bathrooms,
    floor,
    totalFloors,
    yearBuilt: getRandomInt(1970, 2025),
    amenities: pickAmenities(),
    priceEur: getRandomInt(minPrice, maxPrice),
    surfaceSqm,
    isFurnished: Math.random() < 0.7,
    hasCentralHeating: Math.random() < 0.8,
    petFriendly: Math.random() < 0.45,
    ownerTypeConfidence: Number((0.4 + Math.random() * 0.59).toFixed(2)),
    aiMetadata: {
      generated: true,
      source: 'seed-listings-script',
      tags: ['synthetic', propertyType.toLowerCase(), transactionType.toLowerCase()],
    },
    addressText,
    lat,
    lng,
    postedAt: now,
    status,
    publicFrom,
    ownerId,
  };
}

async function resolveOwnerId(client, requestedOwnerId) {
  if (requestedOwnerId) {
    const found = await client.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [requestedOwnerId]);
    if (found.rows.length === 0) {
      throw new Error(`User cu id=${requestedOwnerId} nu exista.`);
    }
    return requestedOwnerId;
  }

  const userRes = await client.query('SELECT id FROM users ORDER BY id ASC LIMIT 1');
  if (userRes.rows.length === 0) {
    throw new Error('Nu exista useri in tabela users. Creeaza mai intai un user.');
  }
  return Number(userRes.rows[0].id);
}

async function createListing(client, payload) {
  const query = `
    INSERT INTO listings (
      owner_id,
      source_type,
      title,
      description,
      transaction_type,
      property_type,
      city,
      neighborhood,
      rooms,
      bedrooms,
      bathrooms,
      floor,
      total_floors,
      year_built,
      amenities,
      price_eur,
      currency,
      surface_sqm,
      is_furnished,
      has_central_heating,
      pet_friendly,
      is_agency,
      owner_type_confidence,
      ai_metadata,
      address_text,
      lat,
      lng,
      created_at,
      updated_at,
      posted_at,
      status,
      public_from
    ) VALUES (
      $1,
      'manual',
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      'EUR',
      $16,
      $17,
      $18,
      $19,
      false,
      $20,
      $21,
      $22,
      $23,
      $24,
      NOW(),
      NOW(),
      $25,
      $26,
      $27
    )
    RETURNING id
  `;

  const values = [
    payload.ownerId,
    payload.title,
    payload.description,
    payload.transactionType,
    payload.propertyType,
    payload.city,
    payload.neighborhood,
    payload.rooms,
    payload.bedrooms,
    payload.bathrooms,
    payload.floor,
    payload.totalFloors,
    payload.yearBuilt,
    JSON.stringify(payload.amenities),
    payload.priceEur,
    payload.surfaceSqm,
    payload.isFurnished,
    payload.hasCentralHeating,
    payload.petFriendly,
    payload.ownerTypeConfidence,
    JSON.stringify(payload.aiMetadata),
    payload.addressText,
    payload.lat,
    payload.lng,
    payload.postedAt,
    payload.status,
    payload.publicFrom,
  ];

  const inserted = await client.query(query, values);
  return Number(inserted.rows[0].id);
}

async function createListingImages(client, listingId, minImages, maxImages) {
  const imagesCount = getRandomInt(minImages, maxImages);
  const selected = shuffle(IMAGE_URLS).slice(0, imagesCount);

  for (let i = 0; i < selected.length; i++) {
    await client.query(
      `
        INSERT INTO listing_images (listing_id, url, is_primary, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `,
      [listingId, selected[i], i === 0, i],
    );
  }

  return imagesCount;
}

async function seedListings(options) {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'domaris',
  });

  const createdIds = [];
  let totalImages = 0;

  try {
    await client.connect();
    console.log('Connected to database');

    const ownerId = await resolveOwnerId(client, options.ownerId);
    console.log(`Owner ID: ${ownerId}`);
    console.log(
      `Seeding ${options.count} listings (status=${options.status}, city=${options.city}, images=${options.withImages ? `${options.minImages}-${options.maxImages}` : 'off'})`,
    );

    await client.query('BEGIN');

    for (let i = 0; i < options.count; i++) {
      const payload = buildListingPayload(ownerId, options);
      const listingId = await createListing(client, payload);
      createdIds.push(listingId);

      let insertedImages = 0;
      if (options.withImages) {
        insertedImages = await createListingImages(
          client,
          listingId,
          options.minImages,
          options.maxImages,
        );
        totalImages += insertedImages;
      }

      console.log(
        `  [${i + 1}/${options.count}] listing #${listingId} | ${payload.transactionType} ${payload.propertyType} | ${payload.priceEur} EUR | status=${payload.status} | images=${insertedImages}`,
      );
    }

    await client.query('COMMIT');

    console.log('Done.');
    console.log(`Listings create: ${createdIds.length}`);
    console.log(`Images create: ${totalImages}`);
    console.log(`Listing IDs: ${createdIds.join(', ')}`);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }

    console.error('Seeding failed:', error.message || error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Argument error: ${error.message}`);
    printUsage();
    process.exit(1);
  }

  if (options.help) {
    printUsage();
    return;
  }

  await seedListings(options);
}

main();
