import { notFound, redirect } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ProductGrid from "@/components/products/ProductGrid";
import { getProductByLookup, getRelatedProducts } from "@/lib/queries-db";
import ProductInfo from "./ProductInfo";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { matchedBy, product } = await getProductByLookup(slug);

  if (!product) {
    notFound();
  }

  if (matchedBy === "id") {
    redirect(`/products/${product.slug}`);
  }

  const relatedProducts = product.categorySlug
    ? await getRelatedProducts(product.id, product.categorySlug, 4)
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb
        items={[
          { label: "Sản phẩm", href: "/products" },
          ...(product.categoryName && product.categorySlug
            ? [
                {
                  label: product.categoryName,
                  href: `/categories/${product.categorySlug}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <ProductInfo product={product} />

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">
                Gợi ý thêm
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                Sản phẩm liên quan cùng danh mục
              </h2>
            </div>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
