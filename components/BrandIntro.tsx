/** CSS-only intro always clears itself, even before JavaScript loads. */
export default function BrandIntro() {
  return (
    <div className="pnp-intro" aria-hidden="true">
      <div className="pnp-intro-mark">
        <img
          src="/logo.png"
          alt=""
          width={1000}
          height={1000}
          loading="eager"
          fetchPriority="high"
          className="pnp-intro-logo"
        />
        <span className="pnp-intro-heart pnp-intro-heart-one">♥</span>
        <span className="pnp-intro-heart pnp-intro-heart-two">♥</span>
      </div>
    </div>
  );
}
