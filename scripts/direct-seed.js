const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/ecommerce';

async function main() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Create tables
    console.log('📋 Creating tables...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "description" TEXT NOT NULL,
        "icon" TEXT NOT NULL,
        "productCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Product" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "description" TEXT NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "originalPrice" DOUBLE PRECISION,
        "image" TEXT NOT NULL,
        "brand" TEXT NOT NULL,
        "specs" JSONB NOT NULL,
        "rating" DOUBLE PRECISION DEFAULT 0,
        "reviewCount" INTEGER DEFAULT 0,
        "inStock" BOOLEAN DEFAULT true,
        "isFeatured" BOOLEAN DEFAULT false,
        "isNewArrival" BOOLEAN DEFAULT false,
        "categoryId" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Tables created!\n');

    // Load data
    const categoriesPath = path.join(__dirname, '..', 'src', 'data', 'processed-categories.json');
    const productsPath = path.join(__dirname, '..', 'src', 'data', 'processed-products.json');

    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await client.query('DELETE FROM "Product"');
    await client.query('DELETE FROM "Category"');
    
    // Insert categories
    console.log('📁 Inserting categories...');
    const categoryMap = new Map();
    
    for (const cat of categoriesData.categories) {
      const newId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await client.query(
        `INSERT INTO "Category" (id, name, slug, description, icon, "productCount") 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newId, cat.name, cat.slug, cat.description, cat.icon, cat.productCount]
      );
      categoryMap.set(cat.id, newId);
    }
    console.log(`✅ Inserted ${categoriesData.categories.length} categories\n`);

    // Insert products
    console.log('📦 Inserting products...');
    let count = 0;
    
    for (const prod of productsData.products) {
      const newCategoryId = categoryMap.get(prod.categoryId);
      if (!newCategoryId) continue;
      
      const newId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await client.query(
        `INSERT INTO "Product" (id, name, slug, description, price, "originalPrice", image, brand, specs, rating, "reviewCount", "inStock", "isFeatured", "isNewArrival", "categoryId") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          newId,
          prod.name,
          prod.slug,
          prod.description,
          prod.price,
          prod.originalPrice || null,
          prod.image,
          prod.brand,
          JSON.stringify(prod.specs),
          prod.rating,
          prod.reviewCount,
          prod.inStock,
          prod.isFeatured,
          prod.isNewArrival,
          newCategoryId
        ]
      );
      
      count++;
      if (count % 20 === 0) {
        console.log(`   ✓ Inserted ${count} products...`);
      }
    }
    
    console.log(`\n✅ Successfully seeded database!`);
    console.log(`📊 Total: ${categoriesData.categories.length} categories, ${count} products`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
