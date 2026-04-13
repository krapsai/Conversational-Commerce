import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">TechStore</h3>
            <p className="text-sm leading-7 text-gray-400">
              TechStore tập trung vào linh kiện PC, màn hình và laptop chính
              hãng cho nhu cầu gaming, làm việc và nâng cấp cấu hình. Chính
              sách bán hàng, vận chuyển và bảo hành được trình bày rõ ràng để
              khách dễ quyết định hơn ngay từ lần đầu ghé thăm.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Danh mục nổi bật
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white">
                  Toàn bộ sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/categories/cpu-processors" className="hover:text-white">
                  CPU & vi xử lý
                </Link>
              </li>
              <li>
                <Link href="/categories/graphics-cards" className="hover:text-white">
                  Card đồ họa
                </Link>
              </li>
              <li>
                <Link href="/categories/monitors" className="hover:text-white">
                  Màn hình
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Hỗ trợ mua hàng
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support/warranty" className="hover:text-white">
                  Chính sách bảo hành
                </Link>
              </li>
              <li>
                <Link href="/support/returns" className="hover:text-white">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link href="/support/shipping" className="hover:text-white">
                  Giao hàng toàn quốc
                </Link>
              </li>
              <li>
                <Link href="/support/payment" className="hover:text-white">
                  Phương thức thanh toán
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Thông tin liên hệ
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Hotline: 1900 6868</li>
              <li>Email: hello@techstore.vn</li>
              <li>Địa chỉ demo: 123 Nguyễn Văn Linh, Quận 7, TP.HCM</li>
              <li>Giờ hỗ trợ: 8:00 - 21:00, Thứ 2 - Chủ nhật</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          © 2026 TechStore. Giao diện demo nội bộ cho website thương mại điện tử
          linh kiện máy tính.
        </div>
      </div>
    </footer>
  );
}
