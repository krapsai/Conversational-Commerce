# Hướng Dẫn Setup Database

## Tổng Quan

Project này sử dụng PostgreSQL với Prisma ORM để quản lý dữ liệu sản phẩm và categories.

## Các Bước Setup

### 1. Chọn Database Provider

Bạn có thể chọn một trong các options sau:

#### Option A: Local PostgreSQL
```bash
# Cài đặt PostgreSQL trên máy local
# Windows: Download từ https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql
```

#### Option B: Supabase (Recommended - Free)
1. Truy cập https://supabase.com
2. Tạo account và project mới
3. Vào Settings > Database
4. Copy Connection String (URI mode)

#### Option C: Railway (Free tier)
1. Truy cập https://railway.app
2. Tạo project mới
3. Add PostgreSQL service
4. Copy DATABASE_URL từ Variables

#### Option D: Neon (Serverless PostgreSQL)
1. Truy cập https://neon.tech
2. Tạo project mới
3. Copy connection string

### 2. Cấu Hình Environment Variables

Tạo/cập nhật file `.env` trong root project:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Ví dụ với Supabase:
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Ví dụ với Railway:
# DATABASE_URL="postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway"

# Ví dụ với Local:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce"
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Push Schema to Database

```bash
npm run db:push
```

Lệnh này sẽ tạo các tables trong database theo schema đã định nghĩa.

### 5. Seed Data vào Database

```bash
npm run db:seed
```

Script này sẽ:
- Xóa dữ liệu cũ (nếu có)
- Import 21 categories
- Import 215 products từ file processed JSON

### 6. Kiểm Tra Database (Optional)

```bash
npm run db:studio
```

Mở Prisma Studio để xem và quản lý data trong database.

## Cấu Trúc Database

### Table: Category
- `id` - String (CUID)
- `name` - String
- `slug` - String (unique)
- `description` - String
- `icon` - String
- `productCount` - Int
- `createdAt` - DateTime
- `updatedAt` - DateTime

### Table: Product
- `id` - String (CUID)
- `name` - String
- `slug` - String (unique)
- `description` - Text
- `price` - Float
- `originalPrice` - Float (nullable)
- `image` - String
- `brand` - String
- `specs` - JSON
- `rating` - Float
- `reviewCount` - Int
- `inStock` - Boolean
- `isFeatured` - Boolean
- `isNewArrival` - Boolean
- `categoryId` - String (Foreign Key)
- `createdAt` - DateTime
- `updatedAt` - DateTime

## Chuyển Website Sang Dùng Database

Sau khi seed xong, cập nhật các file sau:

### 1. Update `src/lib/queries.ts`

Thay thế nội dung bằng:
```typescript
export * from './queries-db';
```

Hoặc đổi tên file:
```bash
# Backup file cũ
mv src/lib/queries.ts src/lib/queries-json.ts

# Đổi tên file mới
mv src/lib/queries-db.ts src/lib/queries.ts
```

### 2. Restart Dev Server

```bash
# Stop server hiện tại (Ctrl+C)
npm run dev
```

## Troubleshooting

### Lỗi: "Can't reach database server"
- Kiểm tra DATABASE_URL trong .env
- Đảm bảo database service đang chạy
- Kiểm tra firewall/network settings

### Lỗi: "Table does not exist"
- Chạy lại: `npm run db:push`

### Lỗi khi seed: "Foreign key constraint"
- Xóa data cũ: Vào Prisma Studio và xóa tất cả records
- Hoặc reset database: `npx prisma migrate reset`

### Performance Issues
- Thêm indexes (đã có sẵn trong schema)
- Enable connection pooling
- Sử dụng caching (Redis)

## Commands Tổng Hợp

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed data
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Reset database (xóa tất cả data)
npx prisma migrate reset

# View database schema
npx prisma db pull
```

## Production Deployment

Khi deploy lên production (Vercel, Railway, etc.):

1. Set DATABASE_URL trong environment variables
2. Build sẽ tự động chạy `prisma generate`
3. Chạy seed một lần: `npm run db:seed`

## Backup & Restore

### Backup
```bash
# PostgreSQL
pg_dump $DATABASE_URL > backup.sql
```

### Restore
```bash
# PostgreSQL
psql $DATABASE_URL < backup.sql
```
