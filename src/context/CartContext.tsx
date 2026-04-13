"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product; quantity: number }
  | { type: "REPLACE_BUNDLE"; items: CartItem[] }
  | { type: "HYDRATE_CART"; items: CartItem[] }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" };

interface CartContextValue extends CartState {
  isHydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  addBundle: (items: CartItem[]) => void;
  clearCart: () => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "techstore-cart";
const CART_STORAGE_VERSION = 3;

function calculateTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    ),
  };
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("product" in entry) ||
      !("quantity" in entry)
    ) {
      return [];
    }

    const product = (entry as { product?: unknown }).product;
    const quantity = (entry as { quantity?: unknown }).quantity;

    if (
      !product ||
      typeof product !== "object" ||
      typeof quantity !== "number" ||
      quantity <= 0
    ) {
      return [];
    }

    return [{ product: product as Product, quantity: Math.max(1, quantity) }];
  });
}

function mergeCartItems(existingItems: CartItem[], incomingItems: CartItem[]) {
  const mergedItems = [...existingItems];

  incomingItems.forEach((incomingItem) => {
    const normalizedQuantity = Math.max(1, incomingItem.quantity);
    const existingIndex = mergedItems.findIndex(
      (item) => item.product.id === incomingItem.product.id
    );

    if (existingIndex >= 0) {
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        quantity: mergedItems[existingIndex].quantity + normalizedQuantity,
      };
      return;
    }

    mergedItems.push({
      product: incomingItem.product,
      quantity: normalizedQuantity,
    });
  });

  return mergedItems;
}

function rehydrateCartItems(serverItems: CartItem[], localItems: CartItem[]) {
  const merged = [...serverItems];

  localItems.forEach((localItem) => {
    const existingIndex = merged.findIndex(
      (item) => item.product.id === localItem.product.id
    );

    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: Math.max(merged[existingIndex].quantity, localItem.quantity),
      };
      return;
    }

    merged.push(localItem);
  });

  return merged;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE_CART": {
      return {
        items: action.items,
        ...calculateTotals(action.items),
      };
    }
    case "ADD_ITEM": {
      const updatedItems = mergeCartItems(state.items, [
        { product: action.product, quantity: action.quantity },
      ]);
      return { items: updatedItems, ...calculateTotals(updatedItems) };
    }
    case "REPLACE_BUNDLE": {
      const updatedItems = sanitizeCartItems(action.items);
      return { items: updatedItems, ...calculateTotals(updatedItems) };
    }
    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter(
        (item) => item.product.id !== action.productId
      );
      return { items: updatedItems, ...calculateTotals(updatedItems) };
    }
    case "UPDATE_QUANTITY": {
      if (action.quantity <= 0) {
        const updatedItems = state.items.filter(
          (item) => item.product.id !== action.productId
        );
        return { items: updatedItems, ...calculateTotals(updatedItems) };
      }

      const updatedItems = state.items.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
      return { items: updatedItems, ...calculateTotals(updatedItems) };
    }
    case "CLEAR_CART":
      return { items: [], totalItems: 0, totalPrice: 0 };
    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
};

function readLocalCart() {
  try {
    const rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!rawCart) {
      return [];
    }

    const parsedCart = JSON.parse(rawCart) as {
      items?: unknown;
      version?: number;
    };

    if (parsedCart.version !== CART_STORAGE_VERSION) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    return sanitizeCartItems(parsedCart.items);
  } catch (error) {
    console.error("Failed to restore cart from localStorage:", error);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  const syncCartToServer = useCallback(async (items: CartItem[]) => {
    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
    } catch (error) {
      console.error("Failed to sync cart to server:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapCart() {
      const localItems = readLocalCart();
      let serverItems: CartItem[] = [];

      try {
        const response = await fetch("/api/cart", { method: "GET" });
        if (response.ok) {
          const data = (await response.json()) as { items?: unknown };
          serverItems = sanitizeCartItems(data.items);
        }
      } catch (error) {
        console.error("Failed to load server cart:", error);
      }

      if (!isMounted) {
        return;
      }

      const mergedItems =
        serverItems.length > 0
          ? rehydrateCartItems(serverItems, localItems)
          : localItems;
      dispatch({ type: "HYDRATE_CART", items: mergedItems });
      setIsHydrated(true);

      if (mergedItems.length > 0) {
        void syncCartToServer(mergedItems);
      }
    }

    void bootstrapCart();

    return () => {
      isMounted = false;
    };
  }, [syncCartToServer]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify({
          version: CART_STORAGE_VERSION,
          items: state.items,
        })
      );
    } catch (error) {
      console.error("Failed to persist cart to localStorage:", error);
    }

    void syncCartToServer(state.items);
  }, [isHydrated, state.items, syncCartToServer]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", product, quantity });
  }, []);

  const addBundle = useCallback((items: CartItem[]) => {
    dispatch({ type: "REPLACE_BUNDLE", items });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  return (
    <CartContext.Provider
      value={{
        ...state,
        isHydrated,
        addItem,
        addBundle,
        clearCart,
        removeItem,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
