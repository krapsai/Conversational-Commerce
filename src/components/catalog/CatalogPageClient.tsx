"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { buildCatalogUrl, type CatalogQueryState, SORT_OPTIONS } from "@/lib/catalog";
import type { Category, Product } from "@/types";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/products/ProductGrid";

interface CatalogPageClientProps {
  basePath: string;
  brandOptions: string[];
  categories: Category[];
  currentCategory: Category | null;
  description: string;
  heading: string;
  initialQuery: CatalogQueryState;
  products: Product[];
  total: number;
}

function formatPriceLabel(value: number | null) {
  if (value === null) {
    return "Bất kỳ";
  }

  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function CatalogPageClient({
  basePath,
  brandOptions,
  categories,
  currentCategory,
  description,
  heading,
  initialQuery,
  products,
  total,
}: CatalogPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialQuery.search);
  const [priceMinInput, setPriceMinInput] = useState(
    initialQuery.priceMin ? String(initialQuery.priceMin) : ""
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    initialQuery.priceMax ? String(initialQuery.priceMax) : ""
  );

  useEffect(() => {
    setSearchInput(initialQuery.search);
    setPriceMinInput(initialQuery.priceMin ? String(initialQuery.priceMin) : "");
    setPriceMaxInput(initialQuery.priceMax ? String(initialQuery.priceMax) : "");
  }, [initialQuery.priceMax, initialQuery.priceMin, initialQuery.search]);

  const totalPages = Math.max(1, Math.ceil(total / initialQuery.limit));
  const activeCategory = currentCategory
    ? currentCategory
    : categories.find((category) => category.slug === initialQuery.category) ?? null;
  const breadcrumbItems = currentCategory
    ? [
        { label: "Sản phẩm", href: "/products" },
        { label: currentCategory.name },
      ]
    : [{ label: "Sản phẩm" }];
  const activeChips = [
    initialQuery.search
      ? {
          label: `Từ khóa: ${initialQuery.search}`,
          onRemove: () => updateQuery({ search: "" }),
        }
      : null,
    !currentCategory && activeCategory
      ? {
          label: activeCategory.name,
          onRemove: () => updateQuery({ category: null }),
        }
      : null,
    ...initialQuery.brands.map((brand) => ({
      label: brand,
      onRemove: () =>
        updateQuery({
          brands: initialQuery.brands.filter((entry) => entry !== brand),
        }),
    })),
    initialQuery.inStockOnly
      ? {
          label: "Chỉ còn hàng",
          onRemove: () => updateQuery({ inStockOnly: false }),
        }
      : null,
    initialQuery.priceMin !== null || initialQuery.priceMax !== null
      ? {
          label: `Giá: ${formatPriceLabel(initialQuery.priceMin)} - ${formatPriceLabel(initialQuery.priceMax)}₫`,
          onRemove: () => updateQuery({ priceMin: null, priceMax: null }),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; onRemove: () => void }>;

  function updateQuery(nextValues: Partial<CatalogQueryState>) {
    const nextQuery: CatalogQueryState = {
      ...initialQuery,
      ...nextValues,
      category: currentCategory ? currentCategory.slug : nextValues.category ?? initialQuery.category,
      page: nextValues.page ?? 1,
    };

    if (currentCategory) {
      nextQuery.category = currentCategory.slug;
    }

    const url = buildCatalogUrl(
      basePath,
      currentCategory
        ? { ...nextQuery, category: null }
        : nextQuery
    );

    startTransition(() => {
      router.push(url);
    });
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() });
  }

  function handlePriceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({
      priceMin: priceMinInput.trim() ? Number.parseInt(priceMinInput, 10) : null,
      priceMax: priceMaxInput.trim() ? Number.parseInt(priceMaxInput, 10) : null,
    });
  }

  function handleBrandToggle(brand: string) {
    const nextBrands = initialQuery.brands.includes(brand)
      ? initialQuery.brands.filter((entry) => entry !== brand)
      : [...initialQuery.brands, brand].sort();

    updateQuery({ brands: nextBrands });
  }

  const filterPanel = (
    <div className="space-y-6">
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div>
          <label htmlFor="catalog-search" className="mb-2 block text-sm font-medium text-gray-800">
            Tìm theo tên, mô tả hoặc thương hiệu
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              id="catalog-search"
              autoComplete="off"
              className="w-full rounded-2xl border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              name="search"
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Ví dụ: RTX 4060, DDR5, màn hình 27 inch…"
              spellCheck={false}
              type="search"
              value={searchInput}
            />
          </div>
        </div>
        <button
          className="w-full rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
          type="submit"
        >
          Áp dụng tìm kiếm
        </button>
      </form>

      {!currentCategory && (
        <div>
          <p className="mb-3 text-sm font-semibold text-gray-800">Danh mục</p>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-3 py-2 text-sm ${
                initialQuery.category === null
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700"
              }`}
              onClick={() => updateQuery({ category: null })}
              type="button"
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`rounded-full border px-3 py-2 text-sm ${
                  initialQuery.category === category.slug
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700"
                }`}
                onClick={() => updateQuery({ category: category.slug })}
                type="button"
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-gray-800">Thương hiệu</p>
        <div className="space-y-2">
          {brandOptions.map((brand) => (
            <label
              key={brand}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 hover:border-primary-100 hover:bg-primary-50/60"
            >
              <input
                checked={initialQuery.brands.includes(brand)}
                className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
                onChange={() => handleBrandToggle(brand)}
                type="checkbox"
              />
              <span className="text-sm text-gray-700">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <form onSubmit={handlePriceSubmit} className="space-y-3">
        <p className="text-sm font-semibold text-gray-800">Khoảng giá</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
              Từ
            </span>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              inputMode="numeric"
              min={0}
              name="priceMin"
              onChange={(event) => setPriceMinInput(event.target.value)}
              placeholder="0"
              type="number"
              value={priceMinInput}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
              Đến
            </span>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              inputMode="numeric"
              min={0}
              name="priceMax"
              onChange={(event) => setPriceMaxInput(event.target.value)}
              placeholder="50000000"
              type="number"
              value={priceMaxInput}
            />
          </label>
        </div>
        <button
          className="w-full rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-100"
          type="submit"
        >
          Áp dụng khoảng giá
        </button>
      </form>

      <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
        <input
          checked={initialQuery.inStockOnly}
          className="rounded border-gray-300 text-primary-700 focus:ring-primary-500"
          onChange={(event) => updateQuery({ inStockOnly: event.target.checked })}
          type="checkbox"
        />
        <span className="text-sm font-medium text-gray-700">Chỉ còn hàng</span>
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb items={breadcrumbItems} />

      <section className="mt-4 rounded-[2rem] border border-gray-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">
              Catalog
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">
              {heading}
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-primary-700">
                Kết quả
              </p>
              <p className="mt-2 text-2xl font-bold text-primary-950">{total}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Trạng thái
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {isPending ? "Đang cập nhật bộ lọc…" : "Sẵn sàng mua sắm"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-6">
        <aside className="hidden w-80 flex-shrink-0 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm lg:block">
          {filterPanel}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
              type="button"
            >
              <SlidersHorizontal size={16} />
              Bộ lọc
            </button>
            <div className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
              Hiển thị <span className="font-semibold text-gray-900">{products.length}</span> /{" "}
              <span className="font-semibold text-gray-900">{total}</span> sản phẩm
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
              <span className="font-medium text-gray-700">Sắp xếp</span>
              <select
                className="bg-transparent text-sm font-medium text-gray-900 outline-none"
                onChange={(event) =>
                  updateQuery({
                    sortBy: event.target.value as CatalogQueryState["sortBy"],
                  })
                }
                value={initialQuery.sortBy}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm text-primary-800 hover:border-primary-300"
                  onClick={chip.onRemove}
                  type="button"
                >
                  {chip.label}
                  <X size={14} />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <ProductGrid
              products={products}
              emptyMessage="Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại. Hãy nới rộng khoảng giá hoặc bỏ bớt điều kiện."
            />
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-3 rounded-[2rem] border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Trang <span className="font-semibold text-gray-900">{initialQuery.page}</span> /{" "}
                <span className="font-semibold text-gray-900">{totalPages}</span>
              </p>
              <div className="flex gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={initialQuery.page <= 1}
                  onClick={() => updateQuery({ page: initialQuery.page - 1 })}
                  type="button"
                >
                  <ArrowLeft size={16} />
                  Trang trước
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={initialQuery.page >= totalPages}
                  onClick={() => updateQuery({ page: initialQuery.page + 1 })}
                  type="button"
                >
                  Trang sau
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="drawer-surface fixed inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bộ lọc catalog</h2>
              <button
                aria-label="Đóng bộ lọc"
                className="rounded-full p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                onClick={() => setMobileFiltersOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
