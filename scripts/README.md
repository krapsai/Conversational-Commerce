# Scripts Xử Lý Dữ Liệu

## Tổng Quan

Thư mục này chứa các script để xử lý dữ liệu đã được crawl từ Amazon và chuyển đổi sang format phù hợp với ứng dụng.

## Các Script

### 1. `process-crawled-data.js`

Script chính để xử lý dữ liệu crawled.

**Chức năng:**
- Đọc tất cả các file JSON đã crawl từ Amazon
- Chuyển đổi format dữ liệu sang cấu trúc Product và Category
- Tự động tạo categories từ category_path
- Chuyển đổi giá từ VND sang USD
- Tạo slug, ID cho các sản phẩm
- Xuất ra 2 file JSON đã xử lý

**Cách sử dụng:**
```bash
node scripts/process-crawled-data.js
```

**Output:**
- `src/data/processed-products.json` - Danh sách sản phẩm đã xử lý
- `src/data/processed-categories.json` - Danh sách categories

### 2. `import-data.ts`

Script TypeScript để import dữ liệu vào ứng dụng.

**Cách sử dụng:**
```typescript
import { products, categories } from './scripts/import-data';
```

## Cấu Trúc Dữ Liệu

### Input (Crawled Data)
```json
{
  "products": [
    {
      "title": "Product Name",
      "brand": "Brand Name",
      "sale_price_value": 12146145.0,
      "original_price_value": null,
      "price_currency": "VND",
      "rating": 4.8,
      "category_path": ["Electronics", "Computers"],
      "image_url": "https://...",
      "description_long": "...",
      "feature_bullets": ["Feature 1", "Feature 2"]
    }
  ]
}
```

### Output (Processed Data)
```json
{
  "products": [
    {
      "id": "abc123",
      "name": "Product Name",
      "slug": "product-name",
      "description": "...",
      "price": 485.85,
      "originalPrice": 500.00,
      "image": "https://...",
      "categoryId": "cat123",
      "categoryName": "Computers",
      "brand": "Brand Name",
      "specs": {
        "Feature 1": "...",
        "Brand": "Brand Name"
      },
      "rating": 4.8,
      "reviewCount": 234,
      "inStock": true,
      "isFeatured": true,
      "isNewArrival": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Quy Tắc Xử Lý

1. **Giá cả:** Chuyển đổi từ VND sang USD với tỷ giá 1 USD = 25,000 VND
2. **Categories:** Lấy category cuối cùng trong category_path làm main category
3. **Featured Products:** Sản phẩm có rating >= 4.7 được đánh dấu là featured
4. **Slug:** Tự động tạo từ tên sản phẩm (lowercase, remove special chars)
5. **Specs:** Chuyển đổi từ feature_bullets thành object specs

## Thống Kê

Sau khi chạy script, bạn sẽ thấy:
- Tổng số sản phẩm đã xử lý
- Tổng số categories
- Số lượng sản phẩm trong mỗi category
- Đường dẫn đến các file output

## Lưu Ý

- Script sẽ tự động tạo thư mục `src/data` nếu chưa tồn tại
- Nếu file crawled không tồn tại, script sẽ bỏ qua và tiếp tục xử lý các file khác
- Review count được tạo ngẫu nhiên vì dữ liệu crawled không có thông tin này
