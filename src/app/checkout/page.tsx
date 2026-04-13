"use client";

import {
  useId,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useCart } from "@/context/CartContext";
import {
  FREE_SHIPPING_THRESHOLD,
  getCartPricing,
} from "@/lib/cart-pricing";
import { formatPrice } from "@/lib/utils";

type PaymentMethod = "cod" | "bank-transfer";

interface CheckoutFormState {
  city: string;
  district: string;
  email: string;
  fullName: string;
  notes: string;
  paymentMethod: PaymentMethod;
  phone: string;
  streetAddress: string;
}

interface SubmittedOrder {
  customerName: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  total: number;
}

const initialFormState: CheckoutFormState = {
  city: "",
  district: "",
  email: "",
  fullName: "",
  notes: "",
  paymentMethod: "cod",
  phone: "",
  streetAddress: "",
};

export default function CheckoutPage() {
  const { clearCart, isHydrated, items } = useCart();
  const [formState, setFormState] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedOrder | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const checkoutFormId = useId();
  const { grandTotal, hasFreeShipping, shippingCost, subtotal, totalItems } =
    getCartPricing(items);

  const updateField =
    (field: keyof CheckoutFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setFormState((previousState) => ({
        ...previousState,
        [field]: nextValue,
      }));
    };

  function handlePaymentMethodChange(paymentMethod: PaymentMethod) {
    setFormState((previousState) => ({
      ...previousState,
      paymentMethod,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setErrorMessage("Giỏ hàng đang trống.");
      return;
    }

    const requiredFields: Array<keyof CheckoutFormState> = [
      "fullName",
      "phone",
      "email",
      "streetAddress",
      "district",
      "city",
    ];

    const hasMissingField = requiredFields.some(
      (field) => formState[field].trim().length === 0
    );

    if (hasMissingField) {
      setErrorMessage("Vui lòng điền đủ thông tin nhận hàng.");
      return;
    }

    setErrorMessage("");

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formState),
          });

          const data = (await response.json()) as
            | SubmittedOrder
            | { error?: string };

          if (!response.ok) {
            throw new Error(
              "error" in data && data.error
                ? data.error
                : "Không thể tạo đơn hàng."
            );
          }

          setSubmittedOrder(data as SubmittedOrder);
          clearCart();
          setFormState(initialFormState);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tạo đơn hàng lúc này."
          );
        }
      })();
    });
  }

  if (!isHydrated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Loader2 size={32} className="mx-auto animate-spin text-primary-700" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Đang chuẩn bị checkout
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Hệ thống đang lấy lại giỏ hàng từ backend demo trước khi hiển thị
            biểu mẫu thanh toán.
          </p>
        </div>
      </div>
    );
  }

  if (submittedOrder) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 size={28} />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Đơn hàng đã được tạo
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Checkout hoàn tất
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Cảm ơn {submittedOrder.customerName}. Hệ thống đã tạo mã đơn{" "}
            <span className="font-semibold text-gray-900">
              {submittedOrder.orderNumber}
            </span>{" "}
            và chuyển cart sang trạng thái hoàn tất trong backend demo.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Thanh toán
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {submittedOrder.paymentMethod === "cod"
                  ? "Thanh toán khi nhận hàng"
                  : "Chuyển khoản"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Giá trị đơn
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {formatPrice(submittedOrder.total)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
                Trạng thái
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                Sẵn sàng xử lý
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Tiếp tục mua sắm
            </Link>
            <Link
              href="/support/shipping"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:border-primary-500 hover:text-primary-700"
            >
              Xem giao hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <PackageCheck size={36} className="mx-auto text-primary-700" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Chưa có sản phẩm để thanh toán
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Thêm sản phẩm vào giỏ trước, sau đó quay lại đây để hoàn tất biểu
            mẫu nhận hàng.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-800"
            >
              <ArrowLeft size={16} />
              Xem sản phẩm
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:border-primary-500 hover:text-primary-700"
            >
              Quay về giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumb
        items={[
          { label: "Giỏ hàng", href: "/cart" },
          { label: "Thanh toán" },
        ]}
      />

      <div className="mb-8 mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-primary-700">
            Checkout
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Điền thông tin giao hàng và xác nhận đơn
          </h1>
        </div>
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          <ArrowLeft size={16} />
          Quay lại giỏ hàng
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_380px]">
        <form id={checkoutFormId} className="space-y-6" onSubmit={handleSubmit}>
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Thông tin nhận hàng
                </h2>
                <p className="text-sm text-gray-500">
                  Dữ liệu này sẽ được lưu lại cùng checkout session trong backend
                  demo.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Họ và tên
                </span>
                <input
                  autoComplete="name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="fullName"
                  onChange={updateField("fullName")}
                  placeholder="Nguyễn Văn A"
                  type="text"
                  value={formState.fullName}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Số điện thoại
                </span>
                <input
                  autoComplete="tel"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="phone"
                  onChange={updateField("phone")}
                  placeholder="09xxxxxxxx"
                  type="tel"
                  value={formState.phone}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Email
                </span>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="email"
                  onChange={updateField("email")}
                  placeholder="you@example.com"
                  spellCheck={false}
                  type="email"
                  value={formState.email}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Địa chỉ nhận hàng
                </span>
                <input
                  autoComplete="street-address"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="streetAddress"
                  onChange={updateField("streetAddress")}
                  placeholder="123 Nguyễn Văn Linh"
                  type="text"
                  value={formState.streetAddress}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Quận / Huyện
                </span>
                <input
                  autoComplete="address-level2"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="district"
                  onChange={updateField("district")}
                  placeholder="Quận 7"
                  type="text"
                  value={formState.district}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Tỉnh / Thành phố
                </span>
                <input
                  autoComplete="address-level1"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="city"
                  onChange={updateField("city")}
                  placeholder="TP.HCM"
                  type="text"
                  value={formState.city}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  Ghi chú giao hàng
                </span>
                <textarea
                  className="min-h-28 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  name="notes"
                  onChange={updateField("notes")}
                  placeholder="Ví dụ: gọi trước khi giao, giao giờ hành chính…"
                  value={formState.notes}
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Phương thức thanh toán
                </h2>
                <p className="text-sm text-gray-500">
                  Chọn phương thức phù hợp cho kịch bản demo hiện tại.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => handlePaymentMethodChange("cod")}
                className={`rounded-2xl border px-4 py-4 text-left ${
                  formState.paymentMethod === "cod"
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">
                  Thanh toán khi nhận hàng
                </p>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Phù hợp khi cần chốt đơn nhanh trong bản demo storefront.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentMethodChange("bank-transfer")}
                className={`rounded-2xl border px-4 py-4 text-left ${
                  formState.paymentMethod === "bank-transfer"
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">Chuyển khoản</p>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Khách thanh toán trước, sau đó đơn được chuyển sang xử lý.
                </p>
              </button>
            </div>
          </section>
        </form>

        <aside className="h-fit space-y-5 lg:sticky lg:top-28">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Đơn hàng của bạn
            </h2>
            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-start gap-4 rounded-2xl border border-gray-100 p-3"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 isolate [contain:paint]">
                    <Image
                      alt={item.product.name}
                      className="h-full w-full object-cover object-center"
                      fill
                      sizes="64px"
                      src={item.product.image}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-800">
                      {item.product.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      SL {item.quantity} • {item.product.brand}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-primary-800">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({totalItems} sản phẩm)</span>
                <span className="font-medium text-gray-800">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <Truck size={16} />
                  Giao hàng
                </span>
                <span className="font-medium text-gray-800">
                  {hasFreeShipping ? "Miễn phí" : formatPrice(shippingCost)}
                </span>
              </div>
              {!hasFreeShipping && (
                <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                  Mua thêm {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} để
                  được miễn phí vận chuyển.
                </p>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="text-base font-semibold text-gray-900">
                  Tổng thanh toán
                </span>
                <span className="text-xl font-bold text-primary-800">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {errorMessage && (
              <p
                aria-live="polite"
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {errorMessage}
              </p>
            )}

            <button
              form={checkoutFormId}
              disabled={isPending}
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang tạo đơn hàng…
                </>
              ) : (
                "Xác nhận đặt hàng"
              )}
            </button>

            <p className="mt-4 text-xs leading-5 text-gray-500">
              Checkout này tạo dữ liệu demo trong Prisma để luồng mua hàng không
              còn dừng ở mức giao diện thuần frontend.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
