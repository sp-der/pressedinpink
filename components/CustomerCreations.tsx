import { customerCreations } from "@/data/customerCreations";
export default function CustomerCreations() {
  const approved = customerCreations.filter((item) =>
    item.permissionReference.trim(),
  );
  if (!approved.length) return null;
  return (
    <section className="pnp-section">
      <div className="pnp-section-heading">
        <div>
          <p className="pnp-eyebrow">Made with PNP</p>
          <h2>Your creativity, on display.</h2>
        </div>
      </div>
      <div className="pnp-creations-grid">
        {approved.map((item) => (
          <figure key={item.image}>
            <img
              src={item.image}
              alt={item.alt}
              width={600}
              height={600}
              loading="lazy"
            />
            <figcaption>{item.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
