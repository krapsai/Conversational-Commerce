"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, ShoppingCart } from "lucide-react";
import { buildCatalogUrl } from "@/lib/catalog";
import { useCart } from "@/context/CartContext";
import type { Category } from "@/types";
import MobileMenu from "./MobileMenu";

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const router = useRouter();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) {
      router.push("/products");
      return;
    }

    router.push(buildCatalogUrl("/products", { page: 1, search: query }));
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="bg-primary-800 py-1.5 text-sm text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
            <span>Miễn phí vận chuyển cho đơn từ 2.000.000₫</span>
            <div className="hidden gap-4 sm:flex">
              <span>Hotline: 1900 6868</span>
              <span>Tư vấn 8:00 - 21:00 mỗi ngày</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              aria-label="Mở menu"
              className="lg:hidden -ml-2 rounded-full p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-700"
              onClick={() => setMobileMenuOpen(true)}
              type="button"
            >
              <Menu size={24} />
            </button>

            <Link href="/" className="flex-shrink-0">
              <span className="text-xl font-bold tracking-tight text-primary-800">
                TechStore
              </span>
            </Link>

            <form
              className="mx-4 hidden max-w-xl flex-1 md:flex"
              onSubmit={handleSearch}
              role="search"
            >
              <div className="relative w-full">
                <label htmlFor="site-search" className="sr-only">
                  Tìm sản phẩm
                </label>
                <input
                  id="site-search"
                  autoComplete="off"
                  className="w-full rounded-full border border-gray-300 py-2.5 pl-4 pr-11 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="search"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm CPU, VGA, RAM, màn hình…"
                  spellCheck={false}
                  type="search"
                  value={searchQuery}
                />
                <button
                  aria-label="Tìm kiếm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-700"
                  type="submit"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <Link
                aria-label="Đi tới danh sách sản phẩm"
                className="rounded-full p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-700 md:hidden"
                href="/products"
              >
                <Search size={22} />
              </Link>

              <Link
                aria-label="Giỏ hàng"
                className="relative rounded-full p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-700"
                href="/cart"
              >
                <ShoppingCart size={22} />
                {totalItems > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <nav className="hidden border-t border-gray-100 lg:block">
          <div className="mx-auto max-w-7xl px-4">
            <ul className="flex items-center gap-1">
              <li
                className="relative"
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                <button
                  className="flex items-center gap-1 px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-700"
                  onClick={() => setCategoryDropdownOpen((open) => !open)}
                  type="button"
                >
                  Danh mục sản phẩm
                  <ChevronDown size={16} />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 w-64 rounded-2xl border border-gray-200 bg-white py-2 shadow-lg">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
              <li>
                <Link
                  href="/products"
                  className="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-700"
                >
                  Toàn bộ sản phẩm
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/cpu-processors"
                  className="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-700"
                >
                  CPU & nền tảng
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/graphics-cards"
                  className="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-700"
                >
                  Card đồ họa
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/monitors"
                  className="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-700"
                >
                  Màn hình
                </Link>
              </li>
              <li>
                <Link
                  href="/support/warranty"
                  className="block px-3 py-3 text-sm font-medium text-accent-600 hover:text-accent-700"
                >
                  Chính sách bảo hành
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <MobileMenu
        categories={categories}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
