import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export default function ProductGrid({
  products,
  emptyMessage = "Không tìm thấy sản phẩm nào.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-gray-300 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-900">Chưa có kết quả phù hợp</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
