"use client";

import { useCart } from "@/components/CartProvider";

export default function CartButton() {
  const {
    isReady,
    totalQuantity,
  } = useCart();

  const visibleQuantity =
    isReady ? totalQuantity : 0;

  return (
    <a
      href="/cart"
      aria-label={`Open cart with ${visibleQuantity} requested items`}
      className="
        fixed bottom-5 right-5 z-40
        flex items-center gap-3 rounded-full
        border-2 border-red-600 bg-black/95
        px-5 py-3 font-black text-white
        shadow-2xl backdrop-blur-md
        transition duration-200
        hover:-translate-y-1 hover:bg-red-600
        focus:outline-none focus:ring-2
        focus:ring-red-500 focus:ring-offset-2
        focus:ring-offset-black
      "
    >
      <span aria-hidden="true" className="text-xl">
        🛒
      </span>

      <span>Cart</span>

      <span
        className="
          flex h-7 min-w-7 items-center
          justify-center rounded-full
          bg-red-600 px-2 text-sm text-white
        "
      >
        {visibleQuantity}
      </span>
    </a>
  );
}
