# Setup PostgreSQL với Docker

## Yêu Cầu

- Docker Desktop đã cài đặt: https://www.docker.com/products/docker-desktop/
- Docker Desktop đang chạy

## Quick Start (3 bước)

### 1. Khởi động PostgreSQL

**Windows (PowerShell):**
```powershell
docker-compose up -d postgres
```

**Linux/Mac:**
```bash
docker-compose up -d postgres
```

Hoặc dùng script helper:
```powershell
# Windows
.\scripts\db-docker.ps1 start

# Linux/Mac
bash scripts/db-docker.sh start
```

### 2. Setup Database Schema

```bash
npm run db:generate    # Generate Prisma Client
npm run db:push        # Tạo tables trong database
```

### 3. Import Data

```bash
npm run db:seed        # Import 215 products + 21 categories
```

✅ Xong! Database đã sẵn sàng.

## Thông Tin Kết Nối

```
Host: localhost
Port: 5432
Database: ecommerce
User: postgres
Password: postgres123

Connection String:
postgresql://postgres:postgres123@localhost:5432/ecommerce
```

## Các Lệnh Quản Lý

### Khởi động PostgreSQL
```bash
docker-compose up -d postgres
```

### Dừng PostgreSQL
```bash
docker-compose down
```

### Xem logs
```bash
docker-compose logs -f postgres
```

### Restart PostgreSQL
```bash
docker-compose restart postgres
```

### Kiểm tra status
```bash
docker-compose ps
```

### Xóa container và data
```bash
docker-compose down -v
```

## pgAdmin (Database UI - Optional)

Nếu muốn quản lý database qua giao diện web:

```bash
docker-compose --profile tools up -d
```

Truy cập: http://localhost:5050
- Email: admin@admin.com
- Password: admin123

**Kết nối đến PostgreSQL trong pgAdmin:**
1. Click "Add New Server"
2. General tab:
   - Name: Ecommerce DB
3. Connection tab:
   - Host: postgres (hoặc host.docker.internal trên Windows/Mac)
   - Port: 5432
   - Database: ecommerce
   - Username: postgres
   - Password: postgres123

## Prisma Studio (Recommended)

Cách dễ nhất để xem và quản lý data:

```bash
npm run db:studio
```

Mở browser tại: http://localhost:5555

## Chuyển Website Sang Dùng Database

### Cách 1: Đổi tên file (Recommended)
```bash
# Backup queries cũ
mv src/lib/queries.ts src/lib/queries-json.ts

# Sử dụng queries mới từ database
mv src/lib/queries-db.ts src/lib/queries.ts
```

### Cách 2: Sửa file queries.ts
Thay toàn bộ nội dung bằng:
```typescript
export * from './queries-db';
```

### Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Workflow Hoàn Chỉnh

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Generate Prisma Client
npm run db:generate

# 3. Create tables
npm run db:push

# 4. Import data
npm run db:seed

# 5. (Optional) Open Prisma Studio
npm run db:studio

# 6. Start dev server
npm run dev
```

## Troubleshooting

### Lỗi: "Port 5432 already in use"
PostgreSQL khác đang chạy. Dừng nó hoặc đổi port trong docker-compose.yml:
```yaml
ports:
  - "5433:5432"  # Đổi port bên ngoài
```
Và cập nhật DATABASE_URL:
```
postgresql://postgres:postgres123@localhost:5433/ecommerce
```

### Lỗi: "Docker daemon is not running"
Mở Docker Desktop và đợi nó khởi động xong.

### Lỗi: "Cannot connect to database"
Kiểm tra container đang chạy:
```bash
docker-compose ps
```

Xem logs:
```bash
docker-compose logs postgres
```

### Reset Database
```bash
# Xóa tất cả data và bắt đầu lại
docker-compose down -v
docker-compose up -d postgres
npm run db:push
npm run db:seed
```

### Backup Database
```bash
# Export data
docker exec ecommerce-postgres pg_dump -U postgres ecommerce > backup.sql

# Import data
docker exec -i ecommerce-postgres psql -U postgres ecommerce < backup.sql
```

## Production Deployment

Khi deploy lên production, thay thế Docker bằng managed database:
- Supabase (Free tier)
- Railway (Free tier)
- Neon (Serverless)
- AWS RDS
- Google Cloud SQL

Chỉ cần thay DATABASE_URL trong environment variables.

## Scripts Helper

### Windows PowerShell
```powershell
.\scripts\db-docker.ps1 start     # Khởi động
.\scripts\db-docker.ps1 stop      # Dừng
.\scripts\db-docker.ps1 restart   # Restart
.\scripts\db-docker.ps1 logs      # Xem logs
.\scripts\db-docker.ps1 pgadmin   # Khởi động với pgAdmin
.\scripts\db-docker.ps1 clean     # Xóa tất cả
.\scripts\db-docker.ps1 status    # Kiểm tra status
```

### Linux/Mac
```bash
bash scripts/db-docker.sh start     # Khởi động
bash scripts/db-docker.sh stop      # Dừng
bash scripts/db-docker.sh restart   # Restart
bash scripts/db-docker.sh logs      # Xem logs
bash scripts/db-docker.sh pgadmin   # Khởi động với pgAdmin
bash scripts/db-docker.sh clean     # Xóa tất cả
bash scripts/db-docker.sh status    # Kiểm tra status
```

## Data Persistence

Data được lưu trong Docker volume `postgres_data`. Khi bạn:
- `docker-compose down` - Data vẫn còn
- `docker-compose down -v` - Data bị xóa
- `docker-compose restart` - Data vẫn còn

## Next Steps

Sau khi setup xong:
1. ✅ PostgreSQL chạy trong Docker
2. ✅ Database có 215 products + 21 categories
3. ✅ Website đọc data từ database
4. 🚀 Deploy lên production với managed database
