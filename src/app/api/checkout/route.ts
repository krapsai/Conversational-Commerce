import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CART_COOKIE_NAME = "techstore-cart-id";

interface CheckoutRequestBody {
  city?: string;
  district?: string;
  email?: string;
  fullName?: string;
  notes?: string;
  paymentMethod?: "cod" | "bank-transfer";
  phone?: string;
  streetAddress?: string;
}

function createOrderNumber(checkoutSessionId: string) {
  return `TS-${new Date().getFullYear()}-${checkoutSessionId.slice(-6).toUpperCase()}`;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

    if (!cartId) {
      return NextResponse.json(
        { error: "Giỏ hàng chưa sẵn sàng để thanh toán." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const requiredFields: Array<keyof CheckoutRequestBody> = [
      "fullName",
      "phone",
      "email",
      "streetAddress",
      "district",
      "city",
    ];

    const missingField = requiredFields.find(
      (field) => !body[field] || body[field]?.trim().length === 0
    );

    if (missingField) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin nhận hàng." },
        { status: 400 }
      );
    }

    const activeCart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          orderBy: { addedAt: "asc" },
          include: {
            product: true,
          },
        },
      },
    });

    if (!activeCart || activeCart.items.length === 0) {
      return NextResponse.json(
        { error: "Giỏ hàng đang trống." },
        { status: 400 }
      );
    }

    const totalPrice = activeCart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const bundle = await prisma.bundle.create({
      data: {
        currency: "VND",
        name: `Don hang ${body.fullName!.trim()}`,
        sourceBuildId: null,
        status: "completed",
        summary: [
          body.streetAddress?.trim(),
          body.district?.trim(),
          body.city?.trim(),
          body.notes?.trim() || undefined,
        ]
          .filter(Boolean)
          .join(" | "),
        totalPrice,
        items: {
          create: activeCart.items.map((item) => ({
            categoryName: item.categoryName,
            productBrand: item.productBrand,
            productId: item.productId,
            productImage: item.productImage,
            productName: item.productName,
            quantity: item.quantity,
            reason: `Thanh toán bởi ${body.fullName!.trim()} (${body.paymentMethod === "bank-transfer" ? "chuyển khoản" : "COD"})`,
            slot: item.categoryName ?? "San pham",
            unitPrice: item.unitPrice,
          })),
        },
      },
    });

    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        bundleId: bundle.id,
        cartId: activeCart.id,
        checkoutUrl: "/checkout",
        completedAt: new Date(),
        status: "completed",
      },
    });

    await prisma.cart.update({
      where: { id: activeCart.id },
      data: {
        status: "converted",
      },
    });

    const freshCart = await prisma.cart.create({
      data: {},
    });

    const response = NextResponse.json({
      customerName: body.fullName!.trim(),
      orderNumber: createOrderNumber(checkoutSession.id),
      paymentMethod: body.paymentMethod ?? "cod",
      total: totalPrice,
    });

    response.cookies.set(CART_COOKIE_NAME, freshCart.id, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("POST /api/checkout error:", error);
    return NextResponse.json(
      { error: "Không thể tạo đơn hàng lúc này." },
      { status: 500 }
    );
  }
}
