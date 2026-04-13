"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/types";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/products/ProductGrid";

type SortOption = "price-asc" | "price-desc" | "name" | "newest" | "rating";

interface CategoryProductsClientProps {
  category: Category;
  products: Product[];
}

export default function CategoryProductsClient({
  category,
  products,
}: CategoryProductsClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [inStockOnly, setInStockOnly] = useState(false);

  const categoryProducts = useMemo(() => {
    const filteredProducts = inStockOnly
      ? products.filter((product) => product.inStock)
      : products;

    return [...filteredProducts].sort((firstProduct, secondProduct) => {
      switch (sortBy) {
        case "price-asc":
          return firstProduct.price - secondProduct.price;
        case "price-desc":
          return secondProduct.price - firstProduct.price;
        case "name":
          return firstProduct.name.localeCompare(secondProduct.name);
        case "rating":
          return secondProduct.rating - firstProduct.rating;
        case "newest":
        default:
          return (
            new Date(secondProduct.createdAt).getTime() -
            new Date(firstProduct.createdAt).getTime()
          );
      }
    });
  }, [inStockOnly, products, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: "Categories", href: "/products" },
          { label: category.name },
        ]}
      />

      <div className="mt-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {category.name}
        </h1>
        <p className="text-gray-500 mt-1">{category.description}</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {categoryProducts.length} products
        </p>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">In stock</span>
          </label>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary-500"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      <ProductGrid
        products={categoryProducts}
        emptyMessage={`No products found in ${category.name}.`}
      />
    </div>
  );
}
