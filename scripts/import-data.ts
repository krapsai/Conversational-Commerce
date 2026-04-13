import fs from 'fs';
import path from 'path';
import type { Product, Category } from '../src/types';

interface ProcessedData {
  products: Product[];
  totalCount: number;
  processedAt: string;
}

interface ProcessedCategories {
  categories: Category[];
  totalCount: number;
  processedAt: string;
}

// Đọc dữ liệu đã xử lý
const productsPath = path.join(__dirname, '..', 'src', 'data', 'processed-products.json');
const categoriesPath = path.join(__dirname, '..', 'src', 'data', 'processed-categories.json');

const productsData: ProcessedData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const categoriesData: ProcessedCategories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

// Export để sử dụng trong ứng dụng
export const products = productsData.products;
export const categories = categoriesData.categories;

console.log(`✅ Đã import ${products.length} sản phẩm và ${categories.length} categories`);
