import type { ReactNode } from "react";
import StorefrontHeader from "@/components/StorefrontHeader";

export const smokyTextShadow = { textShadow: "0 2px 8px rgba(0,0,0,.35)" };

type NavigationLink = { href: string; label: string };
export default function StorefrontFrame({
  children,
  backLink,
  footerLink,
}: {
  children: ReactNode;
  backLink?: NavigationLink;
  footerLink?: NavigationLink;
}) {
  return (
    <div className="pnp-storefront">
      <a className="pnp-skip" href="#storefront-content">
        Skip to shopping
      </a>
      <StorefrontHeader backLink={backLink} />
      <main id="storefront-content">{children}</main>
      <footer className="pnp-footer">
        <div>
          <a href="/" aria-label="Pressed In Pink home">
            <img
              src="/header-logo.png"
              alt="Pressed In Pink"
              width={210}
              height={62}
            />
          </a>
          <p>
            Handmade with love.
            <br />
            Rialto, California.
          </p>
        </div>
        <nav aria-label="Footer shopping links">
          <a href="/premade">Custom & Premade</a>
          <a href="/for-creators">For Creators</a>
          <a href="/custom-cup">Build Your Cup</a>
          <a href="/account">Your Orders</a>
          {footerLink && <a href={footerLink.href}>{footerLink.label}</a>}
        </nav>
        <div>
          <p className="pnp-eyebrow">A little more PNP</p>
          <a
            href="https://www.instagram.com/pressed_in_pink/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram ↗
          </a>
          <a
            href="https://www.tiktok.com/@pressedinpink23?lang=en"
            target="_blank"
            rel="noreferrer"
          >
            TikTok ↗
          </a>
        </div>
        <p className="pnp-footer-note">
          Made for creators. Made for you. <span aria-hidden="true">♥</span>
        </p>
      </footer>
    </div>
  );
}
