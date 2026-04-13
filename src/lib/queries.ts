import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { normalizeDisplayPrice } from "@/lib/price";
import type { Product, Category } from "@/types";

/* ------------------------------------------------------------------ */
/*  Product queries                                                   */
/* ------------------------------------------------------------------ */

export interface ProductFilters {
  search?: string;
  category?: string;
  brands?: string[];
  inStockOnly?: boolean;
  priceMin?: number;
  priceMax?: number;
  sortBy?: "price-asc" | "price-desc" | "name" | "newest" | "rating";
  limit?: number;
}

export async function getAllProducts(
  filters: ProductFilters = {}
): Promise<Product[]> {
  const normalizedProducts = products.map((product) => ({
    ...product,
    price: normalizeDisplayPrice(product.price),
    originalPrice:
      typeof product.originalPrice === "number"
        ? normalizeDisplayPrice(product.originalPrice)
        : undefined,
  }));
  const normalizedSearch = filters.search?.trim().toLowerCase();
  const selectedBrands = filters.brands ?? [];

  let filteredProducts = normalizedProducts.filter((product) => {
    if (normalizedSearch) {
      const searchableText = `${product.name} ${product.description} ${product.brand}`.toLowerCase();
      if (!searchableText.includes(normalizedSearch)) {
        return false;
      }
    }

    if (filters.category && product.categoryId !== filters.category) {
      return false;
    }

    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
      return false;
    }

    if (filters.inStockOnly && !product.inStock) {
      return false;
    }

    if (filters.priceMin !== undefined && product.price < filters.priceMin) {
      return false;
    }

    if (filters.priceMax !== undefined && product.price > filters.priceMax) {
      return false;
    }

    return true;
  });

  switch (filters.sortBy) {
    case "price-asc":
      filteredProducts = [...filteredProducts].sort(
        (firstProduct, secondProduct) => firstProduct.price - secondProduct.price
      );
      break;
    case "price-desc":
      filteredProducts = [...filteredProducts].sort(
        (firstProduct, secondProduct) => secondProduct.price - firstProduct.price
      );
      break;
    case "name":
      filteredProducts = [...filteredProducts].sort((firstProduct, secondProduct) =>
        firstProduct.name.localeCompare(secondProduct.name)
      );
      break;
    case "rating":
      filteredProducts = [...filteredProducts].sort(
        (firstProduct, secondProduct) => secondProduct.rating - firstProduct.rating
      );
      break;
    case "newest":
    default:
      filteredProducts = [...filteredProducts].sort(
        (firstProduct, secondProduct) =>
          new Date(secondProduct.createdAt).getTime() -
          new Date(firstProduct.createdAt).getTime()
      );
      break;
  }

  if (filters.limit) {
    return filteredProducts.slice(0, Math.min(filters.limit, 200));
  }

  return filteredProducts;
}

export async function getProductById(id: number): Promise<Product | null> {
  const matchingProduct =
    (await getAllProducts()).find((product) => Number(product.id) === id) ?? null;
  return matchingProduct;
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  return getAllProducts({
    category: categorySlug,
    sortBy: "newest",
  });
}

export async function getFeaturedProducts(
  limit = 8
): Promise<Product[]> {
  return products
    .map((product) => ({
      ...product,
      price: normalizeDisplayPrice(product.price),
      originalPrice:
        typeof product.originalPrice === "number"
          ? normalizeDisplayPrice(product.originalPrice)
          : undefined,
    }))
    .filter((product) => product.isFeatured)
    .sort((firstProduct, secondProduct) => secondProduct.rating - firstProduct.rating)
    .slice(0, limit);
}

export async function getDealProducts(limit = 4): Promise<Product[]> {
  return products
    .map((product) => ({
      ...product,
      price: normalizeDisplayPrice(product.price),
      originalPrice:
        typeof product.originalPrice === "number"
          ? normalizeDisplayPrice(product.originalPrice)
          : undefined,
    }))
    .filter(
      (product) =>
        typeof product.originalPrice === "number" &&
        product.originalPrice > product.price
    )
    .sort((firstProduct, secondProduct) => {
      const firstDiscountValue = (firstProduct.originalPrice ?? 0) - firstProduct.price;
      const secondDiscountValue =
        (secondProduct.originalPrice ?? 0) - secondProduct.price;
      return secondDiscountValue - firstDiscountValue;
    })
    .slice(0, limit);
}

export async function getNewProducts(limit = 4): Promise<Product[]> {
  return products
    .map((product) => ({
      ...product,
      price: normalizeDisplayPrice(product.price),
      originalPrice:
        typeof product.originalPrice === "number"
          ? normalizeDisplayPrice(product.originalPrice)
          : undefined,
    }))
    .filter((product) => product.isNewArrival)
    .sort(
      (firstProduct, secondProduct) =>
        new Date(secondProduct.createdAt).getTime() -
        new Date(firstProduct.createdAt).getTime()
    )
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/*  Category queries                                                  */
/* ------------------------------------------------------------------ */

export async function getAllCategories(): Promise<Category[]> {
  return categories;
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const matchingCategory =
    categories.find((category) => category.slug === slug) ?? null;
  return matchingCategory;
}
