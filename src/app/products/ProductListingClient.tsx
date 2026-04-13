"use client";

import { useState, useMemo } from "react";
import { Category, Product } from "@/types";
import ProductGrid from "@/components/products/ProductGrid";
import ProductFilters from "@/components/products/ProductFilters";
import { Search } from "lucide-react";

interface ProductListingClientProps {
  categories: Category[];
  initialSearchQuery: string;
  initialSortBy: "price-asc" | "price-desc" | "name" | "newest" | "rating";
  products: Product[];
}

const PRICE_MAX = 50000000;

export default function ProductListingClient({
  categories,
  initialSearchQuery,
  initialSortBy,
  products,
}: ProductListingClientProps) {
  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort(),
    [products]
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<
    "price-asc" | "price-desc" | "name" | "newest" | "rating"
  >(initialSortBy);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedBrands([]);
    setInStockOnly(false);
    setPriceRange([0, PRICE_MAX]);
    setSearchQuery("");
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by brands
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) => selectedBrands.includes(p.brand));
    }

    // Filter by stock
    if (inStockOnly) {
      filtered = filtered.filter((p) => p.inStock);
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Sort products
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return filtered;
  }, [
    products,
    selectedCategory,
    selectedBrands,
    inStockOnly,
    priceRange,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tất cả sản phẩm
        </h1>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Sort and count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {filteredProducts.length} / {products.length} sản phẩm
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
            <option value="name">Tên: A-Z</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <ProductFilters
          brands={brands}
          categories={categories}
          selectedCategory={selectedCategory}
          selectedBrands={selectedBrands}
          inStockOnly={inStockOnly}
          priceRange={priceRange}
          onCategoryChange={setSelectedCategory}
          onBrandToggle={handleBrandToggle}
          onInStockChange={setInStockOnly}
          onPriceRangeChange={setPriceRange}
          onClearFilters={handleClearFilters}
        />

        <div className="flex-1">
          <ProductGrid
            products={filteredProducts}
            emptyMessage="Không tìm thấy sản phẩm nào phù hợp với bộ lọc."
          />
        </div>
      </div>
    </div>
  );
}
