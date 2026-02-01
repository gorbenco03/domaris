#!/usr/bin/env node
/**
 * Populează baza de date cu anunțuri imobiliare (Listings).
 * Rulează din root: node backend/scripts/seed-listings.js
 * Sau din backend: node scripts/seed-listings.js
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

// Dummy Data Generator
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const NEIGHBORHOODS = ['Tineretului', 'Victoriei', 'Dorobanti', 'Floreasca', 'Aviatiei', 'Titan', 'Militari', 'Drumul Taberei'];
const CITIES = ['Bucuresti'];
const PROPERTY_TYPES = ['APARTMENT', 'HOUSE', 'COMMERCIAL'];
const TRANSACTION_TYPES = ['SALE', 'RENT'];
const AMENITIES = ['AC', 'Parcare', 'Metrou', 'Parc', 'Centrala', 'Balcon', 'Renovat'];

const IMAGE_URLS = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1600596542815-27b88e35eabb?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800'
];

async function seedListings() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'domaris',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Get a random user to assign as owner
    const userRes = await client.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.error('❌ No users found. Please register a user first.');
      process.exit(1);
    }
    const ownerId = userRes.rows[0].id;
    console.log(`👤 Assigning listings to User ID: ${ownerId}`);

    // 2. Generate Listings
    const listingsCount = 10;
    console.log(`🌱 Seeding ${listingsCount} listings with photos...`);

    for (let i = 0; i < listingsCount; i++) {
        const type = PROPERTY_TYPES[getRandomInt(0, PROPERTY_TYPES.length - 1)];
        const transType = TRANSACTION_TYPES[getRandomInt(0, TRANSACTION_TYPES.length - 1)];
        const city = CITIES[0];
        const neighborhood = NEIGHBORHOODS[getRandomInt(0, NEIGHBORHOODS.length - 1)];
        const rooms = getRandomInt(1, 5);
        const price = transType === 'SALE' ? getRandomInt(50000, 300000) : getRandomInt(300, 1500);
        
        const title = `${type === 'APARTMENT' ? 'Apartament' : type === 'HOUSE' ? 'Casa' : 'Spatiu'} ${rooms} camere - ${neighborhood}`;
        const description = `Proprietate deosebita in zona ${neighborhood}. ${rooms} camere, complet utilat. Merita vazut!`;
        
        const query = `
        INSERT INTO listings (
            owner_id, source_type, title, description, transaction_type, property_type,
            city, neighborhood, rooms, bedrooms, bathrooms, floor, total_floors,
            year_built, amenities, price_eur, currency, surface_sqm, is_furnished,
            has_central_heating, pet_friendly, is_agency, owner_type_confidence,
            ai_metadata, address_text, lat, lng, created_at, updated_at, posted_at, status, public_from
        ) VALUES (
            $1, 'manual', $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11, $12,
            $13, $14, $15, 'EUR', $16, $17,
            $18, $19, $20, 0.9,
            $21, $22, $23, $24, NOW(), NOW(), NOW(), 'public', NOW()
        ) RETURNING id
        `;

        const values = [
            ownerId, // owner_id
            title, // title
            description, // description
            transType, // transaction_type
            type, // property_type
            city, // city
            neighborhood, // neighborhood
            rooms, // rooms
            Math.max(1, rooms - 1), // bedrooms
            getRandomInt(1, 3), // bathrooms
            getRandomInt(0, 10), // floor
            getRandomInt(4, 12), // total_floors
            getRandomInt(1980, 2024), // year_built
            JSON.stringify(AMENITIES.slice(0, getRandomInt(1, 5))), // amenities
            price, // price_eur
            getRandomInt(30, 200), // surface_sqm
            Math.random() > 0.5, // is_furnished
            Math.random() > 0.5, // has_central_heating
            Math.random() > 0.5, // pet_friendly
            false, // is_agency
            // ai_metadata
            JSON.stringify({
                generated: true,
                tags: ['premium', 'view'],
                summary: 'Generated by seeder'
            }), 
            `Strada ${neighborhood} nr. ${getRandomInt(1, 100)}`, // address_text
            44.4268 + (Math.random() - 0.5) * 0.1, // lat
            26.1025 + (Math.random() - 0.5) * 0.1 // lng
        ];

        const res = await client.query(query, values);
        const listingId = res.rows[0].id;
        console.log(`  🏠 Created Listing #${listingId}: ${title}`);

        // 3. Add Photos
        const numPhotos = getRandomInt(3, 6);
        // Shuffle images array manually or just pick random indexes
        const shuffledImages = IMAGE_URLS.sort(() => 0.5 - Math.random());
        const selectedImages = shuffledImages.slice(0, numPhotos);

        for (let j = 0; j < selectedImages.length; j++) {
            const isPrimary = j === 0;
            const imgQuery = `
                INSERT INTO listing_images (listing_id, url, is_primary, "order", created_at, updated_at)
                VALUES ($1, $2, $3, $4, NOW(), NOW())
            `;
            await client.query(imgQuery, [listingId, selectedImages[j], isPrimary, j]);
        }
        console.log(`    📸 Added ${numPhotos} photos`);
    }

    console.log('✅ Seeding complete!');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await client.end();
  }
}

seedListings();
