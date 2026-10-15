import BrandIntro from "@/components/BrandIntro";
import StorefrontFrame from "@/components/StorefrontFrame";
import ProductRail from "@/components/ProductRail";
import CustomerCreations from "@/components/CustomerCreations";

const featured = [
  {
    title: "Snowglobe Cups",
    note: "Finished by PNP",
    image: "/storefront/snowglobe-portrait.webp",
    width: 608, height: 1080,
    href: "/cups/snowglobe",
  },
  {
    title: "Libby Cups",
    note: "Find your next favorite",
    image: "/storefront/libby-portrait.webp",
    width: 608, height: 1080,
    href: "/cups/libby",
  },
  {
    title: "Pink Glass Cup",
    note: "A blank for your next idea",
    image: "/blank-cups/glass/5.webp",
    width: 300, height: 400,
    borderless: true,
    href: "/for-creators/blank-cups/glass/5",
  },
  {
    title: "Premade Shirts",
    note: "Wear a little personality",
    image: "/premade-shirts-category.png",
    width: 1254, height: 1254,
    href: "/shirts/premade",
  },
  {
    title: "Blank Snowglobe Cups",
    note: "Make it your own",
    image: "/blank-cups/snowglobe/1.webp",
    width: 300, height: 400,
    borderless: true,
    href: "/for-creators/blank-cups/snowglobe",
  },
];
export default function Home() {
  return (
    <>
      <BrandIntro />
      <StorefrontFrame>
        <section className="pnp-hero">
          <div className="pnp-hero-copy">
            <p className="pnp-eyebrow">
              <span className="pnp-tiny-star" aria-hidden="true">
                ✦
              </span>{" "}
              Handmade in Rialto, California
            </p>
            <h1>
              A little pink.
              <br />A lot of <em>personality.</em>
            </h1>
            <p>
              Custom cups, finished favorites, and the supplies to make
              something that&apos;s all you.
            </p>
            <div className="pnp-hero-actions">
              <a className="pnp-button pnp-sparkle-button" href="#shop">
                Find your thing <span aria-hidden="true">↗︎</span>
              </a>
              <a className="pnp-text-link" href="/custom-cup">
                Build your own cup →
              </a>
            </div>
            <div className="pnp-hero-footnote">
              <span aria-hidden="true">♥</span> Made for creators. Made for
              you.
            </div>
          </div>
          <div className="pnp-hero-stage" aria-label="A look at PNP cups">
            <span className="pnp-stage-orbit" aria-hidden="true" />
            <figure className="pnp-hero-photo pnp-photo-back">
              <img
                src="/blank-cups/glass/5.webp"
                alt="Pink glass cup photographed in the PNP studio"
                width={300}
                height={400}
                fetchPriority="high"
              />
              <figcaption>A blank canvas for your ideas</figcaption>
            </figure>
            <figure className="pnp-hero-photo pnp-photo-front">
              <img
                src="/storefront/libby-portrait.webp"
                alt="A finished PNP Libby cup"
                width={608}
                height={1080}
                fetchPriority="high"
              />
              <figcaption>
                A little everyday extra <span aria-hidden="true">♥</span>
              </figcaption>
            </figure>
          </div>
        </section>
        <section
          id="shop"
          className="pnp-section pnp-path-section"
          aria-label="Choose how to shop"
        >
          <div className="pnp-section-heading">
            <div>
              <p className="pnp-eyebrow">Two ways to make it yours</p>
              <h2>Pick your kind of creative.</h2>
            </div>
            <p>
              Let us make it.
              <br />
              Or make it your own.
            </p>
          </div>
          <div className="pnp-shopping-paths">
            <a className="pnp-path-card" href="/premade">
              <div className="pnp-path-copy">
                <span className="pnp-eyebrow">Made by us. Picked by you.</span>
                <h3>
                  For Custom
                  <br />& Premade
                </h3>
                <p>
                  Cups, shirts, and custom pieces with your personality written
                  all over them.
                </p>
                <span className="pnp-button pnp-button-light">
                  Shop finished favorites <span aria-hidden="true">↗︎</span>
                </span>
              </div>
              <img
                src="/storefront/snowglobe-portrait.webp"
                alt="Finished PNP snowglobe cup"
                width={608}
                height={1080}
                loading="lazy"
              />
            </a>
            <a className="pnp-path-card pnp-path-creators" href="/for-creators">
              <div className="pnp-path-copy">
                <span className="pnp-eyebrow">Your ideas start here.</span>
                <h3>
                  For
                  <br />
                  Creators
                </h3>
                <p>
                  UV-DTF wraps, blank cups, and the little details that bring
                  your ideas to life.
                </p>
                <span className="pnp-button pnp-button-light">
                  Explore the supplies <span aria-hidden="true">↗︎</span>
                </span>
              </div>
              <img
                src="/blank-cups/glass/5.webp"
                alt="Pink blank glass cup ready to customize"
                width={300}
                height={400}
                loading="lazy"
              />
            </a>
          </div>
        </section>
        <ProductRail
          title="A few things to spark an idea."
          description="Explore a curated mix from the PNP catalog. Final availability is confirmed with your order request."
        >
          {featured.map((item) => (
            <a key={item.title} href={item.href} className="pnp-feature-card">
              <div className={`pnp-feature-image ${"borderless" in item && item.borderless ? "pnp-feature-image-borderless" : ""}`}>
                <img
                  src={item.image}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  decoding="async"
                />
                <span aria-hidden="true">↗︎</span>
              </div>
              <p>{item.note}</p>
              <h3>{item.title}</h3>
              <span className="pnp-feature-action">Explore collection →</span>
            </a>
          ))}
        </ProductRail>
        <section className="pnp-custom-banner pnp-section">
          <div>
            <p className="pnp-eyebrow">One cup. Your kind of everything.</p>
            <h2>
              You dream it.
              <br />
              Let&apos;s build it.
            </h2>
            <p>
              Choose your cup, find your wrap, and add the finishing touches.
              We&apos;ll take it from there.
            </p>
            <a href="/custom-cup" className="pnp-button">
              Make it yours <span aria-hidden="true">↗︎</span>
            </a>
          </div>
          <ol className="pnp-build-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Pick a cup</h3>
                <p>Find the shape that fits your style.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Choose a wrap</h3>
                <p>A little color. A whole lot of you.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Finish your way</h3>
                <p>Explore the options for your chosen cup.</p>
              </div>
            </li>
          </ol>
        </section>
        <CustomerCreations />
        <section className="pnp-section pnp-studio">
          <div>
            <p className="pnp-eyebrow">From the PNP studio</p>
            <h2>
              Small details.
              <br />
              Big personality.
            </h2>
            <p>
              From the first blank to the finished piece, there&apos;s a little
              love in everything we make.
            </p>
            <a
              className="pnp-text-link"
              href="https://www.instagram.com/pressed_in_pink/"
              target="_blank"
              rel="noreferrer"
            >
              See more on Instagram ↗︎
            </a>
          </div>
          <div className="pnp-studio-images">
            <img
              src="/storefront/libby-portrait.webp"
              alt="Finished Libby cup in the PNP studio"
              width={608}
              height={1080}
              loading="lazy"
            />
            <img
              src="/storefront/snowglobe-portrait.webp"
              alt="Finished snowglobe cup in the PNP studio"
              width={608}
              height={1080}
              loading="lazy"
            />
          </div>
        </section>
      </StorefrontFrame>
    </>
  );
}
