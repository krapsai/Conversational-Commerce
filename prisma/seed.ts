import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ProcessedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryId: string;
  categoryName?: string;
  brand: string;
  specs: Record<string, string>;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  createdAt: string;
}

interface ProcessedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productCount: number;
}

function getUniqueSlug(
  slug: string,
  slugCounts: Map<string, number>
): string {
  const currentCount = slugCounts.get(slug) ?? 0;
  slugCounts.set(slug, currentCount + 1);

  if (currentCount === 0) {
    return slug;
  }

  return `${slug}-${currentCount + 1}`;
}

async function main() {
  console.log('🌱 Bắt đầu seed database...\n');

  // Đọc dữ liệu đã xử lý
  const categoriesPath = path.join(__dirname, '..', 'src', 'data', 'processed-categories.json');
  const productsPath = path.join(__dirname, '..', 'src', 'data', 'processed-products.json');

  const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

  const categories: ProcessedCategory[] = categoriesData.categories;
  const products: ProcessedProduct[] = productsData.products;

  // Xóa dữ liệu cũ
  console.log('🗑️  Xóa dữ liệu cũ...');
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Seed categories
  console.log('📁 Đang seed categories...');
  const categoryMap = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        productCount: category.productCount,
      },
    });
    categoryMap.set(category.id, created.id);
    console.log(`   ✓ ${category.name}`);
  }

  // Seed products
  console.log('\n📦 Đang seed products...');
  let count = 0;
  const slugCounts = new Map<string, number>();

  for (const product of products) {
    const newCategoryId = categoryMap.get(product.categoryId);
    
    if (!newCategoryId) {
      console.log(`   ⚠️  Bỏ qua sản phẩm: ${product.name} (không tìm thấy category)`);
      continue;
    }

    await prisma.product.create({
      data: {
        name: product.name,
        slug: getUniqueSlug(product.slug, slugCounts),
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        brand: product.brand,
        specs: product.specs,
        rating: product.rating,
        reviewCount: product.reviewCount,
        inStock: product.inStock,
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        categoryId: newCategoryId,
      },
    });

    count++;
    if (count % 20 === 0) {
      console.log(`   ✓ Đã seed ${count} sản phẩm...`);
    }
  }

  console.log(`\n✅ Hoàn thành seed database!`);
  console.log(`📊 Thống kê:`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Products: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
