"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import type { Category } from "@/types";

interface ProductFiltersProps {
  categories: Category[];
  brands: string[];
  selectedCategory: string | null;
  selectedBrands: string[];
  inStockOnly: boolean;
  priceRange: [number, number];
  onCategoryChange: (categoryId: string | null) => void;
  onBrandToggle: (brand: string) => void;
  onInStockChange: (inStock: boolean) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

const PRICE_MAX = 50000000;

export default function ProductFilters({
  categories,
  brands,
  selectedCategory,
  selectedBrands,
  inStockOnly,
  priceRange,
  onCategoryChange,
  onBrandToggle,
  onInStockChange,
  onPriceRangeChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveFilters =
    selectedCategory !== null ||
    selectedBrands.length > 0 ||
    inStockOnly ||
    priceRange[0] > 0 ||
    priceRange[1] < PRICE_MAX;

  const filterContent = (
    <div className="space-y-6">
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          Xóa bộ lọc
        </button>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Danh mục</h3>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => onCategoryChange(null)}
              className={`text-sm w-full text-left py-1 px-2 rounded ${
                selectedCategory === null
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-600 hover:text-primary-700"
              }`}
            >
              Tất cả
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onClick={() => onCategoryChange(category.id)}
                className={`text-sm w-full text-left py-1 px-2 rounded ${
                  selectedCategory === category.id
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-600 hover:text-primary-700"
                }`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Khoảng giá
        </h3>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={PRICE_MAX}
            step={1000000}
            value={priceRange[1]}
            onChange={(event) =>
              onPriceRangeChange([priceRange[0], Number(event.target.value)])
            }
            className="w-full accent-primary-700"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0₫</span>
            <span>{(priceRange[1] / 1000000).toFixed(0)} triệu</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Thương hiệu
        </h3>
        <ul className="space-y-2">
          {brands.map((brand) => (
            <li key={brand}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => onBrandToggle(brand)}
                  className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">{brand}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => onInStockChange(event.target.checked)}
            className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600 font-medium">
            Chỉ còn hàng
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-primary-500"
      >
        <SlidersHorizontal size={16} />
        Bộ lọc
        {hasActiveFilters && (
          <span className="bg-primary-700 text-white text-xs rounded-full px-1.5 py-0.5">
            !
          </span>
        )}
      </button>

      <aside className="hidden lg:block w-56 flex-shrink-0">
        {filterContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-white shadow-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Bộ lọc</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
                aria-label="Đóng bộ lọc"
              >
                <X size={22} />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
