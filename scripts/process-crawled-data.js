const fs = require('fs');
const path = require('path');

// Hàm tạo slug từ string
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Hàm tạo ID ngẫu nhiên
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Hàm chuyển đổi VND sang USD (tỷ giá ước tính)
function convertUSDToVND(usd) {
  if (!usd) return 0;
  return Math.round(usd * 26700);
}

// Hàm xử lý một sản phẩm
function processProduct(rawProduct, categoryMap) {
  const categoryPath = rawProduct.category_path || [];
  const mainCategory = categoryPath[categoryPath.length - 1] || 'Uncategorized';
  
  // Lấy hoặc tạo category
  let category = categoryMap.get(mainCategory);
  if (!category) {
    category = {
      id: generateId(),
      name: mainCategory,
      slug: createSlug(mainCategory),
      description: `Browse ${mainCategory} products`,
      icon: '📦',
      productCount: 0
    };
    categoryMap.set(mainCategory, category);
  }
  category.productCount++;

  // Tạo specs từ feature_bullets
  const specs = {};
  if (rawProduct.feature_bullets && Array.isArray(rawProduct.feature_bullets)) {
    rawProduct.feature_bullets.forEach((bullet, index) => {
      specs[`Feature ${index + 1}`] = bullet;
    });
  }
  
  // Thêm brand vào specs
  if (rawProduct.brand) {
    specs['Brand'] = rawProduct.brand;
  }

  const price = convertUSDToVND(rawProduct.sale_price_value || rawProduct.original_price_value);
  const originalPrice = rawProduct.original_price_value && rawProduct.sale_price_value !== rawProduct.original_price_value
    ? convertUSDToVND(rawProduct.original_price_value)
    : undefined;

  return {
    id: generateId(),
    name: rawProduct.title || 'Unknown Product',
    slug: createSlug(rawProduct.title || 'unknown-product'),
    description: rawProduct.description_long && rawProduct.description_long !== 'Not Found' 
      ? rawProduct.description_long 
      : (rawProduct.feature_bullets?.[0] || 'No description available'),
    price: price,
    originalPrice: originalPrice,
    image: rawProduct.image_url || '/placeholder.jpg',
    categoryId: category.id,
    categoryName: category.name,
    brand: rawProduct.brand || 'Unknown',
    specs: specs,
    rating: rawProduct.rating || 0,
    reviewCount: Math.floor(Math.random() * 500) + 10, // Random vì không có data
    inStock: true,
    isFeatured: rawProduct.rating >= 4.7,
    isNewArrival: false,
    createdAt: new Date().toISOString()
  };
}

// Hàm chính
function processAllData() {
  console.log('🚀 Bắt đầu xử lý dữ liệu...\n');

  const categoryMap = new Map();
  const allProducts = [];

  // Danh sách các file cần xử lý
  const dataFiles = [
    'extracted_amazon_products_computer_components.json',
    'extracted_amazon_products_computer_graphics_cards.json',
    'extracted_amazon_products_computer_monitors.json',
    'extracted_amazon_products_computer_processor_amd.json',
    'extracted_amazon_products_computer_processor_intel.json',
    'extracted_amazon_products_computers_motherboards.json',
    'extracted_amazon_products_computers_psu.json',
    'extracted_amazon_products_computers_ram.json',
    'extracted_amazon_products_computers_ssd.json'
  ];

  // Xử lý từng file
  dataFiles.forEach(filename => {
    const filePath = path.join(__dirname, '..', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File không tồn tại: ${filename}`);
      return;
    }

    try {
      const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const products = rawData.products || [];
      
      console.log(`📄 Đang xử lý: ${filename} (${products.length} sản phẩm)`);
      
      products.forEach(rawProduct => {
        try {
          const product = processProduct(rawProduct, categoryMap);
          allProducts.push(product);
        } catch (error) {
          console.error(`   ❌ Lỗi xử lý sản phẩm: ${rawProduct.title}`, error.message);
        }
      });
    } catch (error) {
      console.error(`❌ Lỗi đọc file ${filename}:`, error.message);
    }
  });

  // Chuyển đổi categoryMap thành array
  const categories = Array.from(categoryMap.values());

  // Ghi kết quả
  const outputDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Ghi file products
  const productsOutput = {
    products: allProducts,
    totalCount: allProducts.length,
    processedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(outputDir, 'processed-products.json'),
    JSON.stringify(productsOutput, null, 2)
  );

  // Ghi file categories
  const categoriesOutput = {
    categories: categories,
    totalCount: categories.length,
    processedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(outputDir, 'processed-categories.json'),
    JSON.stringify(categoriesOutput, null, 2)
  );

  // Thống kê
  console.log('\n✅ Hoàn thành xử lý dữ liệu!');
  console.log(`📊 Tổng số sản phẩm: ${allProducts.length}`);
  console.log(`📁 Tổng số categories: ${categories.length}`);
  console.log(`\n📂 File đầu ra:`);
  console.log(`   - src/data/processed-products.json`);
  console.log(`   - src/data/processed-categories.json`);
  
  // Hiển thị categories
  console.log(`\n📋 Danh sách categories:`);
  categories.forEach(cat => {
    console.log(`   - ${cat.name}: ${cat.productCount} sản phẩm`);
  });
}

// Chạy script
processAllData();
