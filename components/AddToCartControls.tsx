"use client";

import {
  useEffect,
  useState,
} from "react";

import { useCart } from "@/components/CartProvider";
import type { WrapProduct } from "@/types/cart";

type AddToCartControlsProps = {
  product: WrapProduct;
  variant?: "card" | "viewer";
};

export default function AddToCartControls({
  product,
  variant = "card",
}: AddToCartControlsProps) {
  const {
    addItem,
    getItemQuantity,
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [showAddedMessage, setShowAddedMessage] =
    useState(false);

  const currentCartQuantity =
    getItemQuantity(product.id);
  const isOneOfOne = product.isOneOfOne === true;
  const isAlreadyInCart =
    isOneOfOne && currentCartQuantity > 0;

  useEffect(() => {
    if (!showAddedMessage) {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setShowAddedMessage(false),
      1400,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showAddedMessage]);

  const updateQuantity = (
    nextQuantity: number,
  ) => {
    setQuantity(
      Math.min(
        Math.max(
          Number.isFinite(nextQuantity)
            ? Math.round(nextQuantity)
            : 1,
          1,
        ),
        99,
      ),
    );
  };

  const handleAdd = () => {
    if (isAlreadyInCart) {
      return;
    }

    addItem(product, isOneOfOne ? 1 : quantity);
    setShowAddedMessage(true);
  };

  return (
    <div
      className={
        variant === "viewer"
          ? "mt-4 rounded-2xl border border-red-900 bg-black/90 p-4"
          : "border-t border-red-950 bg-black/95 p-4"
      }
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div
        className={
          variant === "viewer"
            ? "flex flex-col items-center justify-between gap-4 sm:flex-row"
            : "space-y-3"
        }
      >
        {!isOneOfOne && (
          <div>
            <p className="text-xs font-bold text-white/70">
              {currentCartQuantity > 0
                ? `Already in cart: ${currentCartQuantity}`
                : "Choose the quantity you want to request."}
            </p>
          </div>
        )}

        <div
          className={
            variant === "viewer"
              ? "flex flex-wrap items-center justify-center gap-3"
              : "flex items-center justify-between gap-3"
          }
        >
          {!isOneOfOne && (
            <div
              className="
                flex items-center overflow-hidden
                rounded-full border border-red-700
                bg-black
              "
            >
              <button
                type="button"
                onClick={() =>
                  updateQuantity(quantity - 1)
                }
                aria-label="Decrease wrap quantity"
                className="
                  flex h-10 w-10 items-center
                  justify-center text-xl font-black
                  text-white transition hover:bg-red-700
                "
              >
                −
              </button>

              <input
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                value={quantity}
                onChange={(event) =>
                  updateQuantity(
                    Number(event.target.value),
                  )
                }
                aria-label="Wrap quantity"
                className="
                  h-10 w-14 border-x
                  border-red-900 bg-black
                  text-center font-black text-white
                  outline-none
                "
              />

              <button
                type="button"
                onClick={() =>
                  updateQuantity(quantity + 1)
                }
                aria-label="Increase wrap quantity"
                className="
                  flex h-10 w-10 items-center
                  justify-center text-xl font-black
                  text-white transition hover:bg-red-700
                "
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={isAlreadyInCart}
            className="
              min-h-10 flex-1 rounded-full
              bg-red-600 px-5 py-2
              text-sm font-black text-white
              transition hover:bg-red-500
              focus:outline-none focus:ring-2
              focus:ring-red-400
              disabled:cursor-default disabled:bg-green-700
              sm:flex-none
            "
          >
            {isAlreadyInCart
              ? "In Cart ✓"
              : showAddedMessage
                ? "Added ✓"
                : "Add to Cart"}
          </button>
        </div>
      </div>

      <p
        aria-live="polite"
        className="sr-only"
      >
        {showAddedMessage
          ? isOneOfOne
            ? `${product.displayName} added to the cart.`
            : `${quantity} wrap${quantity === 1 ? "" : "s"} added to the cart.`
          : ""}
      </p>
    </div>
  );
}
