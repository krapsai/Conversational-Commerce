# Conversational Commerce

TechStore là một storefront e-commerce demo xây bằng Next.js, Prisma, PostgreSQL và một Python agent service để hỗ trợ tư vấn cấu hình PC. Repo này tập trung vào một luồng mua sắm rõ ràng: duyệt catalog, xem chi tiết sản phẩm, thêm vào giỏ, checkout demo, và tùy chọn nhận hỗ trợ từ AI assistant.

## Mục tiêu

- Trình diễn một website bán linh kiện công nghệ có trải nghiệm mua hàng hoàn chỉnh hơn mức prototype UI.
- Kết hợp storefront truyền thống với conversational assistant, nhưng không phụ thuộc hoàn toàn vào agent service để vận hành.
- Cung cấp nền tảng để demo catalog filtering, cart persistence, checkout flow và agent-assisted bundle buying.

## Stack

- `Next.js 15` App Router
- `React 19`
- `Tailwind CSS 4`
- `Prisma` + `PostgreSQL`
- `FastAPI` + `LangGraph` cho agent backend
- `Kafka` + `Debezium` cho CDC sync trong môi trường demo đầy đủ

## Tính năng chính

- Homepage tối ưu cho conversion với category entry points, featured deals và trust messaging.
- Product listing dùng query params cho search, sort, filter, deep-link và back-button safe browsing.
- Product detail route theo slug: `/products/[slug]`.
- Cart đồng bộ giữa client state và backend demo.
- Checkout flow có validation, summary rõ ràng và order confirmation.
- AI build assistant được lazy-init, không làm hỏng storefront nếu service chưa chạy.
- API catalog hỗ trợ server-driven filtering thay vì chỉ filter ở client.

## Kiến trúc tổng quan

```text
src/app                 Next.js App Router pages + API routes
src/components          UI components cho catalog, cart, chat, layout
src/context             Cart context và đồng bộ cart state
src/lib                 Query helpers, pricing utils, Prisma client
src/data                Dữ liệu catalog đã xử lý để seed/demo
prisma                  Prisma schema + seed script
agent_service           FastAPI/LangGraph service cho conversational assistant
infra/debezium          Debezium connector config
scripts                 Script hỗ trợ database và data processing
```

## Yêu cầu môi trường

- `Node.js 20+`
- `npm`
- `Python 3.11+`
- `Docker Desktop` nếu muốn chạy local Postgres/Kafka/Debezium bằng `docker compose`

## Biến môi trường

Tạo file `.env` từ `.env.example`:

```powershell
Copy-Item .env.example .env
```

Các biến chính:

- `DATABASE_URL`: database cho storefront
- `REAL_DATABASE_URL`: database cho luồng CDC / real DB integration
- `AGENT_DATABASE_URL`: database riêng cho agent runtime, có thể để trống để fallback
- `AGENT_SERVICE_URL`: URL Python agent service
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`: cấu hình model cho agent service
- `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_TOPIC_PREFIX`: cấu hình CDC consumer

## Chạy local nhanh

### 1. Cài dependencies

```powershell
npm install
```

### 2. Khởi động database

Nếu dùng Docker:

```powershell
docker compose up -d postgres
```

### 3. Generate Prisma client và sync schema

```powershell
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Chạy storefront

```powershell
npm run dev
```

Storefront sẽ chạy tại [http://localhost:3000](http://localhost:3000).

## Chạy full demo với agent service

### 1. Khởi động hạ tầng mở rộng

```powershell
docker compose up -d postgres agent-postgres kafka kafka-connect
```

### 2. Đăng ký Debezium connector

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8083/connectors `
  -ContentType "application/json" `
  -InFile "infra\\debezium\\real-db-source.json"
```

### 3. Chạy agent API

```powershell
npm run agent:dev
```

### 4. Chạy CDC consumer ở terminal khác

```powershell
npm run agent:cdc
```

Chi tiết hơn có trong [agent_service/README.md](agent_service/README.md) và [scripts/README.md](scripts/README.md).

## Scripts hữu ích

- `npm run dev`: chạy Next.js dev server
- `npm run build`: build production
- `npm run start`: chạy build production
- `npm run test`: chạy test cho catalog utilities và cart pricing
- `npm run db:generate`: generate Prisma client
- `npm run db:push`: push schema vào database
- `npm run db:seed`: seed catalog demo
- `npm run db:studio`: mở Prisma Studio
- `npm run agent:dev`: chạy Python agent service
- `npm run agent:cdc`: chạy CDC consumer

## API và flow chính

### Storefront routes

- `/`: homepage
- `/products`: product listing
- `/categories/[slug]`: category listing
- `/products/[slug]`: product detail
- `/cart`: cart
- `/checkout`: checkout
- `/support/[slug]`: support/trust content pages

### API routes

- `GET /api/products`: catalog query với `search`, `category`, `brands`, `inStockOnly`, `priceMin`, `priceMax`, `sortBy`, `page`, `limit`
- `GET/POST/PATCH /api/cart`: đọc và cập nhật giỏ hàng demo
- `POST /api/checkout`: tạo checkout session demo
- `/api/agent/...`: endpoints cho conversational assistant flow

## Trạng thái dự án

Repo này phù hợp cho internal demo và iteration nhanh. Một số phần vẫn là demo-grade:

- checkout chưa tích hợp payment gateway thật
- inventory reservation và OMS chưa có
- agent service là optional dependency, storefront vẫn nên usable khi service tắt

## Ghi chú

- Dữ liệu catalog hiện được seed từ dữ liệu đã xử lý trong `src/data`.
- Thư mục scraper nội bộ không còn được track trong repo hiện tại.
- Nếu database chưa có schema mới nhất, cart và checkout API sẽ không hoạt động cho đến khi chạy `npm run db:push`.
