
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CartItem,
  WrapProduct,
} from "@/types/cart";

const CART_STORAGE_KEY = "pressedinpink-wrap-cart-v1";
const MAX_ITEM_QUANTITY = 999;

type CartContextValue = {
  items: CartItem[];
  isReady: boolean;
  totalDesigns: number;
  totalQuantity: number;
  addItem: (
    product: WrapProduct,
    quantity?: number,
  ) => void;
  setItemQuantity: (
    productId: string,
    quantity: number,
  ) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
};

const CartContext =
  createContext<CartContextValue | null>(null);

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.min(
    Math.max(Math.round(quantity), 1),
    MAX_ITEM_QUANTITY,
  );
}

function isCartItem(value: unknown): value is CartItem {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const item = value as Partial<CartItem>;

  return (
    typeof item.id === "string" &&
    typeof item.displayName === "string" &&
    typeof item.categorySlug === "string" &&
    typeof item.categoryName === "string" &&
    typeof item.imageNumber === "number" &&
    typeof item.sourceFilename === "string" &&
    typeof item.thumbnailUrl === "string" &&
    typeof item.fullImageUrl === "string" &&
    typeof item.quantity === "number"
  );
}

function normalizeStoredItems(
  value: unknown,
): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isCartItem)
    .map((item) => ({
      ...item,
      quantity: clampQuantity(item.quantity),
    }));
}

export function CartProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedCart =
        window.localStorage.getItem(
          CART_STORAGE_KEY,
        );

      if (storedCart) {
        const parsedCart: unknown =
          JSON.parse(storedCart);

        setItems(normalizeStoredItems(parsedCart));
      }
    } catch (error) {
      console.error(
        "Pressed In Pink cart could not be loaded.",
        error,
      );
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch (error) {
      console.error(
        "Pressed In Pink cart could not be saved.",
        error,
      );
    }
  }, [items, isReady]);

  useEffect(() => {
    const handleStorage = (
      event: StorageEvent,
    ) => {
      if (
        event.key !== CART_STORAGE_KEY ||
        event.newValue === null
      ) {
        return;
      }

      try {
        const parsedCart: unknown =
          JSON.parse(event.newValue);

        setItems(normalizeStoredItems(parsedCart));
      } catch (error) {
        console.error(
          "Pressed In Pink cart could not sync.",
          error,
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  const addItem = useCallback(
    (
      product: WrapProduct,
      quantity = 1,
    ) => {
      const safeQuantity =
        clampQuantity(quantity);

      setItems((currentItems) => {
        const existingItem =
          currentItems.find(
            (item) => item.id === product.id,
          );

        if (!existingItem) {
          return [
            ...currentItems,
            {
              ...product,
              quantity: safeQuantity,
            },
          ];
        }

        return currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: clampQuantity(
                  item.quantity + safeQuantity,
                ),
              }
            : item,
        );
      });
    },
    [],
  );

  const setItemQuantity = useCallback(
    (
      productId: string,
      quantity: number,
    ) => {
      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setItems((currentItems) =>
          currentItems.filter(
            (item) => item.id !== productId,
          ),
        );

        return;
      }

      const safeQuantity =
        clampQuantity(quantity);

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: safeQuantity,
              }
            : item,
        ),
      );
    },
    [],
  );

  const incrementItem = useCallback(
    (productId: string) => {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: clampQuantity(
                  item.quantity + 1,
                ),
              }
            : item,
        ),
      );
    },
    [],
  );

  const decrementItem = useCallback(
    (productId: string) => {
      setItems((currentItems) =>
        currentItems.flatMap((item) => {
          if (item.id !== productId) {
            return [item];
          }

          if (item.quantity <= 1) {
            return [];
          }

          return [
            {
              ...item,
              quantity: item.quantity - 1,
            },
          ];
        }),
      );
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((currentItems) =>
        currentItems.filter(
          (item) => item.id !== productId,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) =>
      items.find(
        (item) => item.id === productId,
      )?.quantity ?? 0,
    [items],
  );

  const totalQuantity = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isReady,
      totalDesigns: items.length,
      totalQuantity,
      addItem,
      setItemQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      getItemQuantity,
    }),
    [
      items,
      isReady,
      totalQuantity,
      addItem,
      setItemQuantity,
      incrementItem,
      decrementItem,
      removeItem,
      clearCart,
      getItemQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider.",
    );
  }

  return context;
}
