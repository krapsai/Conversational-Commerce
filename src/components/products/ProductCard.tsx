"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { calculateDiscount, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import Badge from "@/components/ui/Badge";
import RatingStars from "@/components/ui/RatingStars";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const hasDiscount =
    typeof product.originalPrice === "number" && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? calculateDiscount(product.price, product.originalPrice!)
    : 0;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gray-50 isolate [contain:paint]"
      >
        <Image
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          src={product.image}
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {hasDiscount && <Badge variant="sale">-{discountPercent}%</Badge>}
          {product.isNewArrival && <Badge variant="new">Mới</Badge>}
          {!product.inStock && <Badge variant="outOfStock">Hết hàng</Badge>}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700">
          {product.categoryName ?? "Linh kiện"}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-2 min-h-[3rem] line-clamp-2 text-sm font-semibold text-gray-900 hover:text-primary-700">
            {product.name}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-gray-500">{product.brand}</p>
        <div className="mt-2">
          <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary-900">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice!)}
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
          {product.description}
        </p>

        <button
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!product.inStock}
          onClick={() => addItem(product)}
          type="button"
        >
          <ShoppingCart size={16} />
          {product.inStock ? "Thêm vào giỏ" : "Tạm hết hàng"}
        </button>
      </div>
    </article>
  );
}
