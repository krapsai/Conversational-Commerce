import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";

const supportPages = {
  payment: {
    title: "Phương thức thanh toán",
    summary:
      "Storefront demo hiện hỗ trợ hai kịch bản thanh toán để giữ hành trình mua hàng liền mạch và dễ thuyết trình.",
    sections: [
      "Thanh toán khi nhận hàng (COD): phù hợp cho kịch bản chốt đơn nhanh trong demo.",
      "Chuyển khoản: phù hợp khi cần mô phỏng quy trình xác nhận thanh toán trước khi giao hàng.",
      "Trên bản demo hiện tại, chưa tích hợp cổng thanh toán thực; bước checkout dùng dữ liệu Prisma để mô phỏng trạng thái đơn hàng.",
    ],
  },
  returns: {
    title: "Chính sách đổi trả",
    summary:
      "Khách có thể xem trước các nguyên tắc đổi trả ngay trên site để giảm do dự ở bước cuối cùng.",
    sections: [
      "Hỗ trợ đổi trả trong vòng 15 ngày cho sản phẩm lỗi kỹ thuật theo chính sách của hãng hoặc của cửa hàng demo.",
      "Sản phẩm cần còn đầy đủ phụ kiện, tem niêm phong và không có dấu hiệu can thiệp ngoài quy trình lắp đặt thông thường.",
      "Trường hợp cần xử lý nhanh, khách có thể liên hệ hotline 1900 6868 để được hướng dẫn từng bước.",
    ],
  },
  shipping: {
    title: "Chính sách giao hàng",
    summary:
      "Thông tin vận chuyển được đưa lên storefront để khách biết ngay chi phí và thời gian dự kiến trước khi thanh toán.",
    sections: [
      "Miễn phí vận chuyển cho đơn từ 2.000.000₫.",
      "Đơn nội thành được ưu tiên xử lý nhanh; đơn toàn quốc được đóng gói kỹ để bảo vệ linh kiện nhạy cảm.",
      "TechStore demo hiển thị rõ ngưỡng miễn phí vận chuyển ở cả giỏ hàng và checkout để tăng độ minh bạch.",
    ],
  },
  warranty: {
    title: "Chính sách bảo hành",
    summary:
      "Bảo hành là tín hiệu niềm tin quan trọng với website linh kiện, vì vậy trang này được giữ tối giản nhưng đủ rõ để chốt đơn.",
    sections: [
      "Sản phẩm chính hãng, đối chiếu bảo hành theo serial hoặc hóa đơn mua hàng trong hệ thống demo.",
      "Thời hạn bảo hành phụ thuộc vào từng nhóm linh kiện và thương hiệu; đội ngũ tư vấn sẽ xác nhận trước khi chốt đơn.",
      "Các trường hợp hỗ trợ kỹ thuật sau mua được tiếp nhận qua hotline, email hoặc chatbot nếu agent service khả dụng.",
    ],
  },
} as const;

interface SupportPageProps {
  params: Promise<{ slug: keyof typeof supportPages }>;
}

export function generateStaticParams() {
  return Object.keys(supportPages).map((slug) => ({ slug }));
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { slug } = await params;
  const page = supportPages[slug];

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Hỗ trợ", href: "/support/warranty" },
          { label: page.title },
        ]}
      />

      <section className="mt-4 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">
          Hỗ trợ mua hàng
        </p>
        <h1 className="mt-3 text-4xl font-bold text-gray-950">{page.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-600">
          {page.summary}
        </p>

        <div className="mt-8 grid gap-4">
          {page.sections.map((section) => (
            <div
              key={section}
              className="rounded-[1.5rem] border border-gray-200 bg-gray-50/80 px-5 py-4 text-sm leading-7 text-gray-700"
            >
              {section}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
