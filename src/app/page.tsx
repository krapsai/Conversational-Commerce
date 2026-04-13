import Link from "next/link";
import {
  ArrowRight,
  Box as BoxIcon,
  Camera,
  CircuitBoard,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Home,
  Keyboard,
  Laptop,
  MemoryStick,
  Monitor,
  MonitorPlay,
  Package,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Truck,
  Watch,
  Zap,
} from "lucide-react";
import {
  getAllCategories,
  getDealProducts,
  getFeaturedProducts,
  getNewProducts,
} from "@/lib/queries-db";
import ProductGrid from "@/components/products/ProductGrid";
import type { Category } from "@/types";

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  Laptop,
  Cpu,
  MonitorPlay,
  MemoryStick,
  HardDrive,
  CircuitBoard,
  Zap,
  Box: BoxIcon,
  Monitor,
  Keyboard,
  Smartphone,
  Camera,
  Gamepad2,
  Watch,
  Home,
  Headphones,
  Package,
};

const categoryIconBySlug: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  "all-in-ones": MonitorPlay,
  "case-fans": Zap,
  "computer-cases": BoxIcon,
  "computer-screws": Package,
  "computers-tablets": Laptop,
  "cpu-processors": Cpu,
  "external-solid-state-drives": HardDrive,
  "graphics-cards": CircuitBoard,
  "internal-components": CircuitBoard,
  "internal-power-supplies": Zap,
  "internal-solid-state-drives": HardDrive,
  memory: MemoryStick,
  minis: BoxIcon,
  monitors: Monitor,
  motherboards: CircuitBoard,
  "racks-cabinets": Package,
  "screwdrivers": Package,
  "silicon-grease": CircuitBoard,
  "towers": BoxIcon,
  "traditional-laptops": Laptop,
  vocal: Headphones,
};

function getCategoryIcon(category: Category) {
  return iconMap[category.icon] ?? categoryIconBySlug[category.slug] ?? Package;
}

export default async function HomePage() {
  const [featuredProducts, dealProducts, newProducts, categories] =
    await Promise.all([
      getFeaturedProducts(8),
      getDealProducts(4),
      getNewProducts(4),
      getAllCategories(),
    ]);
  const topCategories = [
    "cpu-processors",
    "graphics-cards",
    "motherboards",
    "memory",
    "internal-solid-state-drives",
    "monitors",
  ]
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is Category => Boolean(category));
  const totalProducts = categories.reduce(
    (sum, category) => sum + category.productCount,
    0
  );

  return (
    <div className="pb-16">
      <section className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.28),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,146,60,0.16),_transparent_30%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_55%,_#ffffff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                TechStore storefront demo
              </p>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-tight text-gray-950 md:text-6xl">
                Mua đúng linh kiện, chốt nhanh cấu hình, không cần đoán mò.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
                Từ CPU, VGA, RAM đến màn hình và SSD, TechStore giúp bạn lọc
                nhanh theo ngân sách, xem rõ chính sách bảo hành và hoàn tất
                đơn hàng trên một luồng mua sắm mạch lạc.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
                >
                  Khám phá sản phẩm
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/categories/graphics-cards"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-6 py-3 text-sm font-semibold text-primary-800 hover:border-primary-300 hover:bg-primary-50"
                >
                  Xem danh mục bán chạy
                </Link>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="surface-panel rounded-3xl border border-white/80 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-700">
                    Danh mục
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-950">
                    {categories.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Nhóm sản phẩm rõ ràng để người mua tìm đúng linh kiện nhanh
                    hơn.
                  </p>
                </div>
                <div className="surface-panel rounded-3xl border border-white/80 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-700">
                    Sản phẩm
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-950">
                    {totalProducts}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Dữ liệu đã được seed để demo kịch bản mua sắm và lọc catalog.
                  </p>
                </div>
                <div className="surface-panel rounded-3xl border border-white/80 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-700">
                    Hỗ trợ
                  </p>
                  <p className="mt-3 text-3xl font-bold text-gray-950">7/7</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Hotline và trợ lý AI cùng hỗ trợ trong hành trình build PC.
                  </p>
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-[2rem] border border-white/80 p-6 shadow-[0_32px_100px_-60px_rgba(30,64,175,0.7)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">
                Luồng mua hàng được tối ưu cho demo
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                  <p className="text-sm font-semibold text-primary-900">
                    1. Tìm đúng linh kiện
                  </p>
                  <p className="mt-2 text-sm leading-6 text-primary-800">
                    Lọc nhanh theo danh mục, thương hiệu, giá và trạng thái còn
                    hàng ngay trên listing.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    2. Xem rõ thông tin quyết định
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    Mỗi trang sản phẩm đều có giá, tồn kho, vận chuyển và cấu
                    hình liên quan.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">
                    3. Chốt đơn ngay trên demo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Giỏ hàng được đồng bộ sang backend demo để nối liền cart,
                    checkout và xác nhận đơn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
              <Truck size={20} className="text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Giao nhanh toàn quốc
              </p>
              <p className="text-xs text-gray-500">
                Miễn phí vận chuyển từ 2 triệu đồng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
              <ShieldCheck size={20} className="text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Bảo hành minh bạch
              </p>
              <p className="text-xs text-gray-500">
                Chính sách đổi trả và hỗ trợ sau bán rõ ràng
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
              <RefreshCw size={20} className="text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Chốt cấu hình dễ hơn
              </p>
              <p className="text-xs text-gray-500">
                So sánh nhanh các nhóm linh kiện theo nhu cầu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50">
              <Headphones size={20} className="text-primary-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Tư vấn trước khi mua
              </p>
              <p className="text-xs text-gray-500">
                Hotline 1900 6868 và trợ lý AI build PC
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
              Lối vào nhanh
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">
              Danh mục giúp khách chốt nhu cầu nhanh nhất
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-primary-700 hover:text-primary-800"
          >
            Xem toàn bộ catalog
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {topCategories.map((category) => {
            const IconComponent = getCategoryIcon(category);
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50">
                  <IconComponent size={24} className="text-primary-700" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-gray-900">
                  {category.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {category.productCount} sản phẩm để so sánh và thêm vào giỏ.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-700">
                  Xem danh mục <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-2">
        <div className="rounded-[2rem] border border-primary-100 bg-primary-50 px-6 py-6 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
                Hỗ trợ build PC
              </p>
              <h2 className="mt-2 text-2xl font-bold text-primary-950">
                Khi khách chưa chắc cấu hình, trợ lý AI sẽ là đường dẫn thứ hai.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-900/80">
                Site ưu tiên luồng mua hàng truyền thống, nhưng vẫn giữ sẵn công
                cụ tư vấn cấu hình theo ngân sách để mô phỏng trải nghiệm
                conversational commerce.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">
                Cách dùng trong demo
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
                <li>Nhập ngân sách và nhu cầu sử dụng.</li>
                <li>Nhận gợi ý build và chi phí tổng.</li>
                <li>Đẩy bundle sang giỏ hàng rồi tiếp tục checkout.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
              Gợi ý chốt đơn
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">
              Sản phẩm nổi bật cho nhu cầu build và nâng cấp
            </h2>
          </div>
          <Link
            href="/products?featured=true"
            className="flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            Xem thêm <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      {dealProducts.length > 0 && (
        <section className="bg-accent-50/70 py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-700">
                  Giá tốt dễ chốt
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">
                  Các deal dễ tạo hành động mua ngay
                </h2>
              </div>
              <Link
                href="/products?sort=price-asc"
                className="flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Xem thêm deal <ArrowRight size={14} />
              </Link>
            </div>
            <ProductGrid products={dealProducts} />
          </div>
        </section>
      )}

      {newProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
                Mới cập nhật
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">
                Hàng mới giúp storefront luôn có cảm giác sống
              </h2>
            </div>
            <Link
              href="/products?sort=newest"
              className="flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              Xem thêm <ArrowRight size={14} />
            </Link>
          </div>
          <ProductGrid products={newProducts} />
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="rounded-[2rem] bg-gray-950 px-6 py-10 text-white sm:px-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">
                Niềm tin trước khi chốt đơn
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold">
                Chính sách mua hàng được viết rõ để người dùng không bị hụt nhịp
                ở bước cuối.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">
                Demo đã có sẵn trang bảo hành, đổi trả, vận chuyển và thanh toán
                để thay thế cho các placeholder không hoạt động trước đây.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/support/shipping"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Xem chính sách giao hàng
              </Link>
              <Link
                href="/support/warranty"
                className="inline-flex items-center justify-center rounded-full bg-accent-600 px-5 py-3 text-sm font-semibold text-white hover:bg-accent-700"
              >
                Xem bảo hành
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
