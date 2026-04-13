# Lấy Connection String từ Supabase

## Các bước chi tiết:

### 1. Vào Supabase Dashboard
- Truy cập: https://supabase.com/dashboard
- Chọn project: `ruomrlfhkgsxocjpbnjw`

### 2. Vào Database Settings
- Click vào **Settings** (icon bánh răng ở sidebar trái)
- Click **Database** trong menu

### 3. Lấy Connection String

Có 2 loại connection string:

#### A. Session Mode (Dùng cho Prisma Migrate/Push)
1. Scroll xuống phần **Connection string**
2. Chọn tab **URI**
3. Chọn **Session mode** (không phải Transaction mode)
4. Copy connection string

Format sẽ như:
```
postgresql://postgres.ruomrlfhkgsxocjpbnjw:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

#### B. Direct Connection (Alternative)
1. Chọn tab **URI**
2. Chọn **Direct connection**
3. Copy connection string

Format sẽ như:
```
postgresql://postgres:[YOUR-PASSWORD]@db.ruomrlfhkgsxocjpbnjw.supabase.co:5432/postgres
```

### 4. Thay [YOUR-PASSWORD]

Nếu password có ký tự đặc biệt, cần encode:

**Password gốc:** `Khangle2k4!`
**Password encoded:** `Khangle2k4%21` (! = %21)

### 5. Connection String Đầy Đủ

Thử các options sau trong file `.env`:

**Option 1: Session Mode (Recommended)**
```env
DATABASE_URL="postgresql://postgres.ruomrlfhkgsxocjpbnjw:Khangle2k4%21@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**Option 2: Direct Connection**
```env
DATABASE_URL="postgresql://postgres:Khangle2k4%21@db.ruomrlfhkgsxocjpbnjw.supabase.co:5432/postgres"
```

**Option 3: Với pgbouncer parameter**
```env
DATABASE_URL="postgresql://postgres.ruomrlfhkgsxocjpbnjw:Khangle2k4%21@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

### 6. Kiểm tra Connection

Sau khi update `.env`, chạy:

```bash
npm run db:push
```

Nếu vẫn lỗi, thử:
1. Reset password trong Supabase (Settings > Database > Database password)
2. Tạo password đơn giản hơn (không có ký tự đặc biệt)
3. Copy lại connection string

### 7. Troubleshooting

**Lỗi "Can't reach database server":**
- Kiểm tra internet connection
- Đảm bảo Supabase project đang active (không bị pause)
- Thử direct connection thay vì pooler

**Lỗi "Tenant or user not found":**
- Username sai format
- Thử: `postgres` thay vì `postgres.ruomrlfhkgsxocjpbnjw`

**Lỗi "Authentication failed":**
- Password sai hoặc chưa encode đúng
- Reset password trong Supabase Dashboard
