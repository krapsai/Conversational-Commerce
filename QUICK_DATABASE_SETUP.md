# Setup Database Nhanh với Supabase (2 phút)

## Bước 1: Tạo Supabase Project

1. Truy cập: https://supabase.com
2. Click "Start your project" hoặc "Sign in"
3. Đăng nhập bằng GitHub (hoặc email)
4. Click "New project"
5. Điền thông tin:
   - Name: `ecommerce-db` (hoặc tên bất kỳ)
   - Database Password: Tạo password mạnh (lưu lại!)
   - Region: Chọn gần nhất (Singapore cho VN)
   - Pricing Plan: Free
6. Click "Create new project" (đợi ~2 phút)

## Bước 2: Lấy Connection String

1. Sau khi project được tạo, vào **Settings** (icon bánh răng bên trái)
2. Click **Database** trong menu
3. Scroll xuống phần **Connection string**
4. Chọn tab **URI**
5. Copy connection string (dạng: `postgresql://postgres.[ref]:[password]@...`)
6. Thay `[YOUR-PASSWORD]` bằng password bạn đã tạo ở bước 1

## Bước 3: Cập Nhật .env

Mở file `.env` và thay thế DATABASE_URL:

```env
# Thay thế dòng này:
# DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ecommerce?schema=public"

# Bằng connection string từ Supabase:
DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

## Bước 4: Chạy Migration và Seed

```bash
# 1. Generate Prisma Client (đã chạy rồi)
npm run db:generate

# 2. Push schema lên database
npm run db:push

# 3. Seed data (215 products + 21 categories)
npm run db:seed
```

## Bước 5: Chuyển Website Sang Dùng Database

```bash
# Backup file queries cũ
mv src/lib/queries.ts src/lib/queries-json.ts

# Đổi tên file queries-db thành queries
mv src/lib/queries-db.ts src/lib/queries.ts
```

## Bước 6: Restart Dev Server

Stop server hiện tại (Ctrl+C trong terminal) và chạy lại:

```bash
npm run dev
```

## Xong! 🎉

Website giờ đọc data từ Supabase PostgreSQL database thay vì JSON files.

---

## Alternative: Docker PostgreSQL (Nếu muốn chạy local)

### Cài Docker Desktop
- Windows/Mac: https://www.docker.com/products/docker-desktop

### Chạy PostgreSQL Container

```bash
docker run --name ecommerce-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=ecommerce -p 5432:5432 -d postgres:16
```

### Kiểm tra container đang chạy

```bash
docker ps
```

### DATABASE_URL cho Docker

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ecommerce?schema=public"
```

Sau đó chạy các lệnh migration và seed như bình thường.

---

## Troubleshooting

### "Authentication failed"
- Kiểm tra password trong DATABASE_URL
- Đảm bảo không có ký tự đặc biệt chưa encode

### "Can't reach database server"
- Kiểm tra internet connection
- Thử lại sau vài phút (Supabase đang khởi động)

### "Table already exists"
- Chạy: `npx prisma db push --force-reset`
- Hoặc xóa tables trong Supabase Dashboard

### Xem data trong database
```bash
npm run db:studio
```
Mở browser tại http://localhost:5555
