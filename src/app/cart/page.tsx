"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import CartItemComponent from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useCart } from "@/context/CartContext";
import {
  FREE_SHIPPING_THRESHOLD,
  getCartPricing,
} from "@/lib/cart-pricing";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { clearCart, isHydrated, items } = useCart();
  const { hasFreeShipping, subtotal, totalItems } = getCartPricing(items);

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
            Cart sync
          </p>
          <h1 className="mt-3 text-3xl font-bold text-gray-950">
            Đang đồng bộ giỏ hàng
          </h1>
          <p className="mt-3 text-sm leading-7 text-gray-500">
            Hệ thống đang ghép trạng thái giỏ hàng từ thiết bị hiện tại với
            backend demo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.55),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(253,186,116,0.35),_transparent_28%)]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Breadcrumb items={[{ label: "Giỏ hàng" }]} />

        <section className="mt-4 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-48px_rgba(30,64,175,0.55)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary-700">
                Shopping cart
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Rà lại cấu hình trước khi sang checkout
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                Giỏ hàng là nơi khách kiểm tra từng món, đổi số lượng và theo dõi
                ngưỡng miễn phí vận chuyển trước khi chốt đơn.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl border border-primary-100 bg-primary-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-primary-700">
                  Số lượng
                </p>
                <p className="mt-2 text-2xl font-bold text-primary-900">
                  {totalItems}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-700">
                  Tạm tính
                </p>
                <p className="mt-2 text-lg font-bold text-amber-900">
                  {formatPrice(subtotal)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                  Vận chuyển
                </p>
                <p className="mt-2 text-sm font-bold text-emerald-900">
                  {hasFreeShipping
                    ? "Đã miễn phí"
                    : `Còn ${formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-600">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
              <Truck size={16} className="text-primary-700" />
              Giao nhanh toàn quốc
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
              <ShieldCheck size={16} className="text-primary-700" />
              Bảo hành chính hãng rõ ràng
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
              <Package size={16} className="text-primary-700" />
              Giữ nguyên lựa chọn khi sang checkout
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <ShoppingCart size={34} />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Giỏ hàng đang trống
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
              Hãy bắt đầu với CPU, card đồ họa, màn hình hoặc linh kiện lưu trữ.
              Sau khi thêm sản phẩm, trang này sẽ trở thành nơi rà soát cấu hình
              trước khi chốt đơn.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-800"
              >
                <ArrowLeft size={16} />
                Khám phá sản phẩm
              </Link>
              <Link
                href="/categories/graphics-cards"
                className="inline-flex items-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-primary-500 hover:text-primary-700"
              >
                Xem danh mục bán chạy
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_380px]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Các sản phẩm đã chọn
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Điều chỉnh số lượng hoặc xóa khỏi giỏ nếu cấu hình không
                      còn phù hợp.
                    </p>
                  </div>
                  <button
                    onClick={clearCart}
                    className="inline-flex items-center gap-2 self-start rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:border-red-300 hover:bg-red-100"
                    type="button"
                  >
                    <Trash2 size={14} />
                    Xóa toàn bộ
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <CartItemComponent key={item.product.id} item={item} />
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">
                  Muốn tiếp tục so sánh?
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Bạn có thể quay lại catalog bất cứ lúc nào. Trạng thái giỏ hàng
                  vẫn được giữ để không làm gián đoạn hành trình mua sắm.
                </p>
                <Link
                  href="/products"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-5 py-3 text-sm font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-100"
                >
                  <ArrowLeft size={16} />
                  Tiếp tục mua sắm
                </Link>
              </section>
            </div>

            <div className="h-fit lg:sticky lg:top-28">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
