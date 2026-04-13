"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Category } from "@/types";

interface MobileMenuProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({
  categories,
  isOpen,
  onClose,
}: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="drawer-surface fixed inset-y-0 left-0 w-72 overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <span className="text-lg font-bold text-primary-800">TechStore</span>
          <button
            aria-label="Đóng menu"
            className="rounded-full p-1 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="p-4">
          <div className="mb-6">
            <Link
              href="/products"
              onClick={onClose}
              className="block py-2 text-sm font-medium text-gray-800 hover:text-primary-700"
            >
              Toàn bộ sản phẩm
            </Link>
            <Link
              href="/categories/graphics-cards"
              onClick={onClose}
              className="block py-2 text-sm font-medium text-gray-800 hover:text-primary-700"
            >
              Card đồ họa
            </Link>
            <Link
              href="/categories/monitors"
              onClick={onClose}
              className="block py-2 text-sm font-medium text-gray-800 hover:text-primary-700"
            >
              Màn hình
            </Link>
            <Link
              href="/support/warranty"
              onClick={onClose}
              className="block py-2 text-sm font-medium text-accent-600 hover:text-accent-700"
            >
              Chính sách bảo hành
            </Link>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Danh mục
            </h3>
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={onClose}
                    className="block rounded px-2 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 rounded-2xl bg-primary-50 p-4 text-sm text-primary-900">
            <p className="font-semibold">Cần tư vấn cấu hình?</p>
            <p className="mt-2 leading-6 text-primary-800">
              Dùng trợ lý AI để gợi ý build PC theo ngân sách, hoặc gọi hotline
              1900 6868 nếu muốn chốt nhanh cấu hình.
            </p>
          </div>
        </nav>
      </div>
    </div>
  );
}
