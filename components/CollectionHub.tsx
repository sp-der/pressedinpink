import CollectionHeader from "@/components/CollectionHeader";
export type CollectionHubItem = {
  title: string;
  description: string;
  action: string;
  href?: string;
  image?: string;
  imageFit?: "cover" | "contain";
  label?: string;
  monogram?: string;
};
export default function CollectionHub({
  eyebrow,
  title,
  description,
  heroAction,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  heroAction?: { label: string; href: string };
  items: CollectionHubItem[];
  layout?: "cards" | "circles";
}) {
  return (
    <>
      <CollectionHeader eyebrow={eyebrow} title={title}>
        <p>{description}</p>
        {heroAction && (
          <a className="pnp-button" href={heroAction.href}>
            {heroAction.label} ↗︎
          </a>
        )}
      </CollectionHeader>
      <section className="pnp-hub-grid" aria-label={`${title} collections`}>
        {items.map((item) => {
          const contents = (
            <>
              <div className="pnp-hub-copy">
                {item.label && <span className="pnp-hub-status">{item.label}</span>}
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <span className="pnp-text-link">{item.action}</span>
              </div>
            </>
          );
          return item.href ? (
            <a key={item.title} href={item.href} className="pnp-hub-card">
              {contents}
            </a>
          ) : (
            <article key={item.title} className="pnp-hub-card">
              {contents}
            </article>
          );
        })}
      </section>
    </>
  );
}
