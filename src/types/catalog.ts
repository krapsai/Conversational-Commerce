export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  brand: string;
  specs: Record<string, string>;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FilterState {
  categoryId: string | null;
  priceRange: [number, number];
  brands: string[];
  inStockOnly: boolean;
  sortBy: "price-asc" | "price-desc" | "name" | "newest" | "rating";
  searchQuery: string;
}
