"use client";
import { useRef } from "react";
import type { ReactNode } from "react";
export default function ProductRail({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const move = (direction: number) =>
    rail.current?.scrollBy({
      left: direction * rail.current.clientWidth * 0.8,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  return (
    <section className="pnp-section" aria-label={title}>
      <div className="pnp-section-heading">
        <div>
          <p className="pnp-eyebrow">The inspiration shelf</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="pnp-rail-controls">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous featured products"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next featured products"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={rail}
        className="pnp-product-rail"
        tabIndex={0}
        aria-label="Featured products, scroll for more"
      >
        {children}
      </div>
    </section>
  );
}
