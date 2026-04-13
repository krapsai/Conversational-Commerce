import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CATALOG_LIMIT,
  type CatalogQueryState,
} from "@/lib/catalog";
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
  page?: number;
}

export interface ProductCatalogResult {
  brands: string[];
  products: Product[];
  total: number;
}

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

function mapProduct(product: ProductWithCategory): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: normalizeDisplayPrice(product.price),
    originalPrice:
      product.originalPrice !== null
        ? normalizeDisplayPrice(product.originalPrice)
        : undefined,
    image: product.image,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    brand: product.brand,
    specs: product.specs as Record<string, string>,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    createdAt: product.createdAt.toISOString(),
  };
}

function buildProductWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (filters.search?.trim()) {
    const searchTerm = filters.search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
      { brand: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = { slug: filters.category };
  }

  if (filters.brands && filters.brands.length > 0) {
    where.brand = { in: filters.brands };
  }

  if (filters.inStockOnly) {
    where.inStock = true;
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {};

    if (filters.priceMin !== undefined) {
      where.price.gte = filters.priceMin;
    }

    if (filters.priceMax !== undefined) {
      where.price.lte = filters.priceMax;
    }
  }

  return where;
}

function buildProductOrderBy(filters: ProductFilters): Prisma.ProductOrderByWithRelationInput {
  switch (filters.sortBy) {
    case "price-asc":
      return { price: "asc" };
    case "price-desc":
      return { price: "desc" };
    case "name":
      return { name: "asc" };
    case "rating":
      return { rating: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export async function getAllProducts(
  filters: ProductFilters = {}
): Promise<Product[]> {
  const where = buildProductWhere(filters);
  const orderBy = buildProductOrderBy(filters);
  const page = filters.page ?? 1;
  const limit =
    filters.limit !== undefined ? Math.min(filters.limit, 200) : undefined;

  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: limit ? (page - 1) * limit : undefined,
    take: limit,
    include: {
      category: true,
    },
  });

  return products.map(mapProduct);
}

export async function getProductCatalog(
  filters: ProductFilters = {}
): Promise<ProductCatalogResult> {
  const where = buildProductWhere(filters);
  const orderBy = buildProductOrderBy(filters);
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? DEFAULT_CATALOG_LIMIT, 200);

  const [products, total, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: true,
      },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: filters.category
        ? {
            category: { slug: filters.category },
          }
        : undefined,
      distinct: ["brand"],
      orderBy: { brand: "asc" },
      select: { brand: true },
    }),
  ]);

  return {
    brands: brands.map((entry) => entry.brand),
    products: products.map(mapProduct),
    total,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });

  if (!product) return null;

  return mapProduct(product);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  if (!product) return null;

  return mapProduct(product);
}

export async function getProductByLookup(
  lookup: string
): Promise<{ product: Product | null; matchedBy: "id" | "slug" | null }> {
  const bySlug = await prisma.product.findUnique({
    where: { slug: lookup },
    include: {
      category: true,
    },
  });

  if (bySlug) {
    return { product: mapProduct(bySlug), matchedBy: "slug" };
  }

  const byId = await prisma.product.findUnique({
    where: { id: lookup },
    include: {
      category: true,
    },
  });

  if (byId) {
    return { product: mapProduct(byId), matchedBy: "id" };
  }

  return { product: null, matchedBy: null };
}

export async function getProductsByCategory(
  categorySlug: string
): Promise<Product[]> {
  return getAllProducts({
    category: categorySlug,
    sortBy: "newest",
  });
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { rating: 'desc' },
    take: limit,
    include: {
      category: true,
    },
  });

  return products.map(mapProduct);
}

export async function getDealProducts(limit = 4): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      originalPrice: { not: null },
    },
    orderBy: { rating: 'desc' },
    take: limit,
    include: {
      category: true,
    },
  });

  // Sort by discount amount
  const sorted = products.sort((a, b) => {
    const discountA = (a.originalPrice ?? 0) - a.price;
    const discountB = (b.originalPrice ?? 0) - b.price;
    return discountB - discountA;
  });

  return sorted.map(mapProduct);
}

export async function getNewProducts(limit = 4): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: { isNewArrival: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      category: true,
    },
  });

  return products.map(mapProduct);
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  limit = 4
): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      id: { not: productId },
      category: { slug: categorySlug },
    },
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    take: limit,
    include: {
      category: true,
    },
  });

  return products.map(mapProduct);
}

/* ------------------------------------------------------------------ */
/*  Category queries                                                  */
/* ------------------------------------------------------------------ */

export async function getAllCategories(): Promise<Category[]> {
  return await prisma.category.findMany({
    orderBy: [{ productCount: "desc" }, { name: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return await prisma.category.findUnique({
    where: { slug },
  });
}
