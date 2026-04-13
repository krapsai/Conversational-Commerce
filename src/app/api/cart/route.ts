import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeDisplayPrice } from "@/lib/price";
import type { CartItem, Product } from "@/types";

const CART_COOKIE_NAME = "techstore-cart-id";

interface SyncCartRequest {
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

type ProductRecord = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

function mapProductFromRecord(product: ProductRecord): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: normalizeDisplayPrice(product.price),
    originalPrice:
      product.originalPrice !== null
        ? normalizeDisplayPrice(product.originalPrice)
        : undefined,
    image: product.image,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    brand: product.brand,
    specs: product.specs as Record<string, string>,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    createdAt: product.createdAt.toISOString(),
  };
}

function mapCartItems(
  items: Array<{
    product: ProductRecord;
    quantity: number;
  }>
): CartItem[] {
  return items.map((item) => ({
    product: mapProductFromRecord(item.product),
    quantity: item.quantity,
  }));
}

async function getExistingCart() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!cartId) {
    return null;
  }

  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
}

async function getOrCreateActiveCart() {
  const existingCart = await getExistingCart();

  if (existingCart && existingCart.status === "active") {
    return existingCart;
  }

  return prisma.cart.create({
    data: {},
    include: {
      items: {
        orderBy: { addedAt: "asc" },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
}

function withCartCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_COOKIE_NAME, cartId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function GET() {
  try {
    const cart = await getExistingCart();

    if (!cart || cart.status !== "active") {
      return NextResponse.json({ items: [] satisfies CartItem[] });
    }

    return NextResponse.json({ items: mapCartItems(cart.items) });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json({ error: "Không thể tải giỏ hàng." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as SyncCartRequest;
    const requestedItems = (body.items ?? []).filter(
      (item) =>
        typeof item.productId === "string" &&
        item.productId.length > 0 &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );

    const cart = await getOrCreateActiveCart();

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    if (requestedItems.length > 0) {
      const productIds = requestedItems.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          category: true,
        },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));
      const validItems = requestedItems.flatMap((item) => {
        const product = productsById.get(item.productId);

        if (!product) {
          return [];
        }

        return [
          {
            cartId: cart.id,
            categoryName: product.category.name,
            productBrand: product.brand,
            productId: product.id,
            productImage: product.image,
            productName: product.name,
            quantity: Math.max(1, item.quantity),
            unitPrice: product.price,
          },
        ];
      });

      if (validItems.length > 0) {
        await prisma.cartItem.createMany({ data: validItems });
      }
    }

    const refreshedCart = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          orderBy: { addedAt: "asc" },
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return withCartCookie(
      NextResponse.json({ items: mapCartItems(refreshedCart.items) }),
      refreshedCart.id
    );
  } catch (error) {
    console.error("PUT /api/cart error:", error);
    return NextResponse.json(
      { error: "Không thể đồng bộ giỏ hàng." },
      { status: 500 }
    );
  }
}
