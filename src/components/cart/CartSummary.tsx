"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  FREE_SHIPPING_THRESHOLD,
  getCartPricing,
} from "@/lib/cart-pricing";
import { formatPrice } from "@/lib/utils";

export default function CartSummary() {
  const { isHydrated, items } = useCart();
  const { grandTotal, hasFreeShipping, shippingCost, subtotal, totalItems } =
    getCartPricing(items);

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-950">Tóm tắt đơn hàng</h2>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Tạm tính ({totalItems} sản phẩm)</span>
          <span className="font-medium text-gray-800">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Phí giao hàng</span>
          <span className="font-medium text-gray-800">
            {hasFreeShipping ? (
              <span className="text-emerald-600">Miễn phí</span>
            ) : (
              formatPrice(shippingCost)
            )}
          </span>
        </div>

        {!hasFreeShipping && subtotal > 0 && (
          <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            Mua thêm{" "}
            <span className="font-semibold text-amber-900">
              {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)}
            </span>{" "}
            để được miễn phí vận chuyển.
          </p>
        )}

        <div className="flex justify-between border-t border-gray-200 pt-4">
          <span className="font-semibold text-gray-900">Tổng cộng</span>
          <span className="text-xl font-bold text-primary-800">
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>

      <Link
        aria-disabled={!isHydrated || items.length === 0}
        className={`mt-6 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white ${
          !isHydrated || items.length === 0
            ? "pointer-events-none bg-gray-300"
            : "bg-accent-600 hover:bg-accent-700"
        }`}
        href="/checkout"
      >
        Tiếp tục thanh toán
      </Link>

      <p className="mt-3 text-center text-xs leading-5 text-gray-500">
        Cart được đồng bộ với backend demo để giữ trạng thái xuyên suốt giữa
        giỏ hàng và checkout.
      </p>
    </div>
  );
}
