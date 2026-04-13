import { NextResponse } from "next/server";
import { parseCatalogSearchParams } from "@/lib/catalog";
import { getProductCatalog } from "@/lib/queries-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseCatalogSearchParams(
    Object.fromEntries(searchParams.entries()),
    { defaultLimit: 24, maxLimit: 100 }
  );

  const brandFilters = searchParams.getAll("brand");
  if (brandFilters.length > 0) {
    filters.brands = brandFilters;
  }

  try {
    const catalog = await getProductCatalog({
      search: filters.search || undefined,
      category: filters.category || undefined,
      brands: filters.brands,
      inStockOnly: filters.inStockOnly,
      priceMin: filters.priceMin ?? undefined,
      priceMax: filters.priceMax ?? undefined,
      sortBy: filters.sortBy,
      page: filters.page,
      limit: filters.limit,
    });

    return NextResponse.json({
      brands: catalog.brands,
      filters,
      limit: filters.limit,
      page: filters.page,
      products: catalog.products,
      total: catalog.total,
      totalPages: Math.max(1, Math.ceil(catalog.total / filters.limit)),
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
