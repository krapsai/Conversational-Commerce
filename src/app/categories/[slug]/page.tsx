import { notFound } from "next/navigation";
import CatalogPageClient from "@/components/catalog/CatalogPageClient";
import { parseCatalogSearchParams } from "@/lib/catalog";
import {
  getAllCategories,
  getCategoryBySlug,
  getProductCatalog,
} from "@/lib/queries-db";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const query = parseCatalogSearchParams(resolvedSearchParams ?? {});
  query.category = slug;

  const [categories, catalog] = await Promise.all([
    getAllCategories(),
    getProductCatalog({
      search: query.search || undefined,
      category: slug,
      brands: query.brands,
      inStockOnly: query.inStockOnly,
      priceMin: query.priceMin ?? undefined,
      priceMax: query.priceMax ?? undefined,
      sortBy: query.sortBy,
      page: query.page,
      limit: query.limit,
    }),
  ]);

  return (
    <CatalogPageClient
      basePath={`/categories/${slug}`}
      brandOptions={catalog.brands}
      categories={categories}
      currentCategory={category}
      description={category.description}
      heading={category.name}
      initialQuery={query}
      products={catalog.products}
      total={catalog.total}
    />
  );
}
