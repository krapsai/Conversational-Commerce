import type { CartItem } from "@/types";

export const FREE_SHIPPING_THRESHOLD = 2000000;
export const SHIPPING_FEE = 50000;

export function getCartPricing(items: CartItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = hasFreeShipping ? 0 : SHIPPING_FEE;

  return {
    grandTotal: subtotal + shippingCost,
    hasFreeShipping,
    shippingCost,
    subtotal,
    totalItems,
  };
}
