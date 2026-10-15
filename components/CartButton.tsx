"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";

export default function CartButton() {
  const { isReady, totalQuantity } = useCart();
  const [feedback, setFeedback] = useState<{
    label: string;
    sequence: number;
  } | null>(null);
  useEffect(() => {
    const onAdd = (event: Event) => {
      const detail = (event as CustomEvent<{ label: string }>).detail;
      setFeedback((previous) => ({
        label: detail.label,
        sequence: (previous?.sequence ?? 0) + 1,
      }));
    };
    window.addEventListener("pnp:cart-add", onAdd);
    return () => window.removeEventListener("pnp:cart-add", onAdd);
  }, []);
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  const quantity = isReady ? totalQuantity : 0;
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true">
        {feedback && (
          <div className="pnp-cart-toast" key={feedback.sequence}>
            ✓ {feedback.label}
            <a href="/cart">View cart →</a>
          </div>
        )}
      </div>
      <a
        href="/cart"
        aria-label={`Open cart with ${quantity} requested items`}
        className="pnp-cart-shortcut"
      >
        <svg
          key={feedback?.sequence ?? "idle"}
          className={feedback ? "pnp-cart-pop" : ""}
          width="21"
          height="23"
          viewBox="0 0 24 26"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 8h16l1 16H3L4 8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M8 9V6a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span>Your cart</span>
        <span className="pnp-cart-count">{quantity}</span>
      </a>
    </>
  );
}
