import AccountButton from "@/components/AccountButton";

export default function StorefrontHeader({
  backLink,
}: {
  backLink?: { href: string; label: string };
}) {
  return (
    <>
      <header className="pnp-header">
        <a href="/" aria-label="Pressed In Pink home" className="pnp-wordmark">
          <img
            src="/header-logo.png"
            alt="Pressed In Pink"
            width={240}
            height={70}
          />
        </a>
        <nav aria-label="Main shopping navigation" className="pnp-desktop-nav">
          <a href="/premade">Custom & Premade</a>
          <a href="/for-creators">For Creators</a>
          <a href="/custom-cup">
            Build a Cup <span aria-hidden="true">↗</span>
          </a>
        </nav>
        <div className="pnp-header-actions">
          <AccountButton inline />
          <details className="pnp-mobile-menu">
            <summary aria-label="Open shopping menu">
              Menu <span aria-hidden="true">☰</span>
            </summary>
            <nav aria-label="Mobile shopping navigation">
              <a href="/premade">Custom & Premade →</a>
              <a href="/for-creators">For Creators →</a>
              <a href="/wraps">UV-DTF Wraps →</a>
              <a href="/custom-cup">Build a Cup →</a>
              <a href="/cart">Your Cart →</a>
            </nav>
          </details>
        </div>
      </header>
      {backLink && (
        <nav className="pnp-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <a href={backLink.href}>
            {backLink.label.replace(/^Back (to )?/, "")}
          </a>
        </nav>
      )}
    </>
  );
}
