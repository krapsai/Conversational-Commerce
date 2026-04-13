"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { CartItem as CartItemType } from "@/types";
import { formatPrice } from "@/lib/utils";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const subtotal = item.product.price * item.quantity;

  return (
    <div className="flex gap-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/75 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/60">
      <Link
        href={`/products/${item.product.slug}`}
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-white isolate [contain:paint] sm:h-28 sm:w-28"
      >
        <Image
          alt={item.product.name}
          className="h-full w-full object-cover object-center"
          fill
          sizes="112px"
          src={item.product.image}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-700">
          {item.product.categoryName ?? "Linh kiện"}
        </p>
        <Link
          href={`/products/${item.product.slug}`}
          className="mt-1 block line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary-700"
        >
          {item.product.name}
        </Link>
        <p className="mt-1 text-sm text-gray-500">{item.product.brand}</p>
        <p className="mt-2 text-sm font-semibold text-primary-800">
          {formatPrice(item.product.price)}
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center self-start rounded-xl border border-gray-300 bg-white">
            <button
              aria-label="Giảm số lượng"
              className="p-2 text-gray-600 hover:text-primary-700"
              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
              type="button"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-10 px-3 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              aria-label="Tăng số lượng"
              className="p-2 text-gray-600 hover:text-primary-700"
              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              type="button"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(subtotal)}
            </span>
            <button
              aria-label="Xóa sản phẩm khỏi giỏ"
              className="inline-flex items-center justify-center rounded-lg border border-transparent p-2 text-gray-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500"
              onClick={() => removeItem(item.product.id)}
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
