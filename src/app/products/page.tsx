import { getAllCategories, getProductCatalog } from "@/lib/queries-db";
import { parseCatalogSearchParams } from "@/lib/catalog";
import CatalogPageClient from "@/components/catalog/CatalogPageClient";

interface ProductsPageProps {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = parseCatalogSearchParams(resolvedSearchParams);
  const [categories, catalog] = await Promise.all([
    getAllCategories(),
    getProductCatalog({
      search: query.search || undefined,
      category: query.category || undefined,
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
      basePath="/products"
      brandOptions={catalog.brands}
      categories={categories}
      currentCategory={null}
      description="Lọc theo danh mục, thương hiệu, giá và tồn kho để đưa người mua tới đúng cấu hình nhanh hơn."
      heading="Toàn bộ sản phẩm"
      initialQuery={query}
      products={catalog.products}
      total={catalog.total}
    />
  );
}
