import test from "node:test";
import assert from "node:assert/strict";
import { getCartPricing, SHIPPING_FEE } from "./cart-pricing";

test("getCartPricing adds shipping when subtotal is below threshold", () => {
  const pricing = getCartPricing([
    {
      product: {
        brand: "MSI",
        categoryId: "gpu",
        createdAt: new Date().toISOString(),
        description: "GPU",
        id: "1",
        image: "https://placehold.co/400",
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        name: "RTX 4060",
        price: 1500000,
        rating: 4.5,
        reviewCount: 12,
        slug: "rtx-4060",
        specs: {},
      },
      quantity: 1,
    },
  ]);

  assert.equal(pricing.shippingCost, SHIPPING_FEE);
  assert.equal(pricing.hasFreeShipping, false);
});

test("getCartPricing unlocks free shipping above threshold", () => {
  const pricing = getCartPricing([
    {
      product: {
        brand: "AMD",
        categoryId: "cpu",
        createdAt: new Date().toISOString(),
        description: "CPU",
        id: "2",
        image: "https://placehold.co/400",
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        name: "Ryzen 7",
        price: 2500000,
        rating: 4.8,
        reviewCount: 20,
        slug: "ryzen-7",
        specs: {},
      },
      quantity: 1,
    },
  ]);

  assert.equal(pricing.shippingCost, 0);
  assert.equal(pricing.hasFreeShipping, true);
});
