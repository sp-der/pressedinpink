import type { ReactNode } from "react";

export default function CollectionHeader({
  eyebrow,
  title,
  children,
  artwork,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  artwork?: string;
}) {
  return (
    <section className="pnp-collection-header">
      <div>
        <p className="pnp-eyebrow">{eyebrow}</p>
        <h1>
          {title}
          <span aria-hidden="true">.</span>
        </h1>
        <div className="pnp-collection-description">{children}</div>
      </div>
      {artwork ? (
        <img
          src={artwork}
          alt=""
          width={160}
          height={160}
          className="pnp-collection-art"
        />
      ) : (
        <span className="pnp-header-star" aria-hidden="true">
          ✳
        </span>
      )}
    </section>
  );
}
