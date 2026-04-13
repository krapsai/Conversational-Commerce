"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, PackageCheck, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import RatingStars from "@/components/ui/RatingStars";

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const hasDiscount =
    typeof product.originalPrice === "number" && product.originalPrice > product.price;

  function adjustQuantity(direction: "decrease" | "increase") {
    setQuantity((current) =>
      direction === "decrease" ? Math.max(1, current - 1) : current + 1
    );
  }

  function handleAddToCart() {
    addItem(product, quantity);
    setFeedback(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`);
  }

  return (
    <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
      <div className="space-y-6">
        <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-gray-200 bg-white isolate [contain:paint]">
          <Image
            alt={product.name}
            className="h-full w-full object-cover object-center"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            src={product.image}
          />
        </div>

        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">Thông số nổi bật</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(product.specs).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {label}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {product.isNewArrival && <Badge variant="new">Mới cập nhật</Badge>}
            {!product.inStock && <Badge variant="outOfStock">Hết hàng</Badge>}
            {hasDiscount && <Badge variant="sale">Đang có giá tốt</Badge>}
          </div>

          <p className="mt-4 text-sm text-gray-500">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-950">{product.name}</h1>
          <div className="mt-3">
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size={16} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-primary-100 bg-primary-50 p-5">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold text-primary-900">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-base text-gray-400 line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-7 text-primary-900/80">
              {product.description}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-primary-700">
                <Truck size={16} />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Giao hàng
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Miễn phí đơn từ 2 triệu đồng, giao nhanh tại nội thành.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-primary-700">
                <ShieldCheck size={16} />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Bảo hành
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Hàng chính hãng, đối soát chính sách bảo hành trước khi chốt đơn.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-primary-700">
                <PackageCheck size={16} />
                <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                  Tồn kho
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {product.inStock
                  ? "Đang có hàng, có thể thêm ngay vào giỏ."
                  : "Tạm hết hàng, vui lòng xem thêm sản phẩm tương tự."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-gray-300 bg-white">
              <button
                aria-label="Giảm số lượng"
                className="p-3 text-gray-600 hover:text-primary-700"
                onClick={() => adjustQuantity("decrease")}
                type="button"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-12 text-center text-sm font-semibold text-gray-900">
                {quantity}
              </span>
              <button
                aria-label="Tăng số lượng"
                className="p-3 text-gray-600 hover:text-primary-700"
                onClick={() => adjustQuantity("increase")}
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={!product.inStock}
              onClick={handleAddToCart}
              type="button"
            >
              <ShoppingCart size={18} />
              {product.inStock ? "Thêm vào giỏ" : "Tạm hết hàng"}
            </button>
          </div>

          <p aria-live="polite" className="mt-3 min-h-6 text-sm text-primary-700">
            {feedback}
          </p>
        </section>

        <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Cần thêm niềm tin trước khi chốt?
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/support/warranty"
              className="inline-flex items-center rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-100"
            >
              Xem bảo hành
            </Link>
            <Link
              href="/support/shipping"
              className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary-300 hover:text-primary-700"
            >
              Xem giao hàng
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
