"use client";

import {
  useEffect,
  useState,
} from "react";

import { useCart } from "@/components/CartProvider";
import type { WrapProduct } from "@/types/cart";

type AddToCartControlsProps = {
  product: WrapProduct;
  variant?: "card" | "compact" | "viewer";
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
  const isViewer = variant === "viewer";
  const isCompact = variant === "compact";

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
        isViewer
          ? "mt-4 rounded-2xl border border-red-900 bg-black/90 p-4"
          : isCompact
            ? "border-t border-red-950 bg-black/95 p-3"
            : "border-t border-red-950 bg-black/95 p-4"
      }
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <div
        className={
          isViewer
            ? "flex flex-col items-center justify-between gap-4 sm:flex-row"
            : isCompact
              ? "space-y-2"
              : "space-y-3"
        }
      >
        {!isOneOfOne && (
          <div>
            <p
              className={
                isCompact
                  ? "text-[10px] font-bold leading-4 text-white/70"
                  : "text-xs font-bold text-white/70"
              }
            >
              {currentCartQuantity > 0
                ? isCompact
                  ? `In cart: ${currentCartQuantity}`
                  : `Already in cart: ${currentCartQuantity}`
                : isCompact
                  ? "Choose quantity."
                  : "Choose the quantity you want to request."}
            </p>
          </div>
        )}

        <div
          className={
            isViewer
              ? "flex flex-wrap items-center justify-center gap-3"
              : isCompact
                ? "flex flex-col items-stretch gap-2 xl:flex-row xl:items-center xl:justify-between"
                : "flex items-center justify-between gap-3"
          }
        >
          {!isOneOfOne && (
            <div
              className={`
                flex items-center overflow-hidden
                rounded-full border border-red-700
                bg-black
                ${isCompact ? "mx-auto xl:mx-0" : ""}
              `}
            >
              <button
                type="button"
                onClick={() =>
                  updateQuantity(quantity - 1)
                }
                aria-label="Decrease wrap quantity"
                className={
                  isCompact
                    ? "flex h-8 w-8 items-center justify-center text-lg font-black text-white transition hover:bg-red-700"
                    : "flex h-10 w-10 items-center justify-center text-xl font-black text-white transition hover:bg-red-700"
                }
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
                className={
                  isCompact
                    ? "h-8 w-10 border-x border-red-900 bg-black text-center text-sm font-black text-white outline-none"
                    : "h-10 w-14 border-x border-red-900 bg-black text-center font-black text-white outline-none"
                }
              />

              <button
                type="button"
                onClick={() =>
                  updateQuantity(quantity + 1)
                }
                aria-label="Increase wrap quantity"
                className={
                  isCompact
                    ? "flex h-8 w-8 items-center justify-center text-lg font-black text-white transition hover:bg-red-700"
                    : "flex h-10 w-10 items-center justify-center text-xl font-black text-white transition hover:bg-red-700"
                }
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={isAlreadyInCart}
            className={
              isCompact
                ? "min-h-8 w-full rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-default disabled:bg-green-700 xl:w-auto xl:flex-1"
                : "min-h-10 flex-1 rounded-full bg-red-600 px-5 py-2 text-sm font-black text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-default disabled:bg-green-700 sm:flex-none"
            }
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
