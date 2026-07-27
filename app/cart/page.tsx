
"use client";

import { useCart } from "@/components/CartProvider";

const smokyTextShadow = {
  textShadow:
    "0 2px 5px rgba(0, 0, 0, 1), 0 0 12px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 0, 0, 0.75)",
};

export default function CartPage() {
  const {
    items,
    isReady,
    totalDesigns,
    totalQuantity,
    setItemQuantity,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();

  const handleClearCart = () => {
    const confirmed =
      window.confirm(
        "Remove every wrap from your cart?",
      );

    if (confirmed) {
      clearCart();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        aria-hidden="true"
        className="
          pointer-events-none fixed inset-0
          bg-cover bg-no-repeat
          bg-[position:62%_top]
          sm:bg-[position:58%_top]
          md:bg-center
        "
        style={{
          backgroundImage:
            "url('/homepage-background.jpg')",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-black/45"
      />

      <div className="relative z-10">
        <nav className="border-b border-red-950/70 bg-black/80 px-5 py-5 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="flex justify-center md:justify-start">
              <a
                href="/wraps"
                className="rounded-full border border-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                style={smokyTextShadow}
              >
                ← Keep Browsing
              </a>
            </div>

            <a
              href="/"
              className="flex justify-center"
            >
              <img
                src="/header-logo.png"
                alt="Pressed In Pink"
                className="h-auto max-h-24 w-44 object-contain sm:w-52 md:w-60"
              />
            </a>

            <div className="flex justify-center md:justify-end">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="rounded-full border border-white/30 px-5 py-2 text-sm font-bold text-white transition hover:border-red-600 hover:bg-red-600"
                >
                  Clear Cart
                </button>
              )}
            </div>
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-red-900/80 bg-black/85 p-7 text-center shadow-2xl backdrop-blur-md sm:p-10">
            <p
              className="text-xs font-black uppercase tracking-[0.3em] text-white sm:text-sm"
              style={smokyTextShadow}
            >
              Pressed In Pink
            </p>

            <h1
              className="mt-4 text-4xl font-black text-white sm:text-5xl md:text-6xl"
              style={smokyTextShadow}
            >
              Your Wrap Cart
            </h1>

            <p
              className="mx-auto mt-5 max-w-2xl leading-7 text-white"
              style={smokyTextShadow}
            >
              Review your requested designs
              and quantities. No payment is
              collected at this stage.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          {!isReady ? (
            <div className="rounded-3xl border border-red-900 bg-black/90 p-10 text-center shadow-xl">
              <p
                className="font-bold text-white"
                style={smokyTextShadow}
              >
                Loading your cart…
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-red-900 bg-black/90 p-10 text-center shadow-xl backdrop-blur-md">
              <div className="text-5xl" aria-hidden="true">
                🛒
              </div>

              <h2
                className="mt-5 text-3xl font-black text-white"
                style={smokyTextShadow}
              >
                Your cart is empty
              </h2>

              <p
                className="mx-auto mt-3 max-w-xl text-white/80"
                style={smokyTextShadow}
              >
                Browse the UV-DTF wrap
                categories and add the
                designs you want.
              </p>

              <a
                href="/wraps"
                className="mt-7 inline-block rounded-full bg-red-600 px-7 py-3 font-black text-white transition hover:bg-red-500"
              >
                Browse Wraps
              </a>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl backdrop-blur-md sm:grid sm:grid-cols-[240px_1fr]"
                  >
                    <div className="relative aspect-[2/1] overflow-hidden bg-black sm:aspect-auto sm:min-h-52">
                      <img
                        src={item.thumbnailUrl}
                        alt={`${item.displayName} wrap`}
                        draggable={false}
                        onError={(event) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            item.fullImageUrl;
                        }}
                        className="
                          absolute left-1/2 top-1/2
                          h-[204%] w-[52%]
                          max-w-none -translate-x-1/2
                          -translate-y-1/2 rotate-90
                          object-cover
                        "
                      />
                    </div>

                    <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
                          {item.categoryName}
                        </p>

                        <h2
                          className="mt-2 text-2xl font-black text-white"
                          style={smokyTextShadow}
                        >
                          {item.displayName}
                        </h2>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div
                          className="
                            flex w-fit items-center
                            overflow-hidden rounded-full
                            border border-red-700 bg-black
                          "
                        >
                          <button
                            type="button"
                            onClick={() =>
                              decrementItem(
                                item.id,
                              )
                            }
                            aria-label={`Decrease ${item.displayName} quantity`}
                            className="flex h-11 w-11 items-center justify-center text-xl font-black text-white transition hover:bg-red-700"
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={1}
                            max={999}
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(event) =>
                              setItemQuantity(
                                item.id,
                                Number(
                                  event.target
                                    .value,
                                ),
                              )
                            }
                            aria-label={`${item.displayName} cart quantity`}
                            className="h-11 w-16 border-x border-red-900 bg-black text-center font-black text-white outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              incrementItem(
                                item.id,
                              )
                            }
                            aria-label={`Increase ${item.displayName} quantity`}
                            className="flex h-11 w-11 items-center justify-center text-xl font-black text-white transition hover:bg-red-700"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          className="text-sm font-bold text-white/70 underline decoration-red-600 underline-offset-4 transition hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="h-fit rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl backdrop-blur-md lg:sticky lg:top-6">
                <h2
                  className="text-2xl font-black text-white"
                  style={smokyTextShadow}
                >
                  Request Summary
                </h2>

                <div className="mt-6 space-y-4 border-y border-red-950 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/75">
                      Different designs
                    </span>

                    <strong className="text-xl text-white">
                      {totalDesigns}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/75">
                      Total wraps
                    </span>

                    <strong className="text-xl text-white">
                      {totalQuantity}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="
                    mt-6 w-full cursor-not-allowed
                    rounded-full bg-white/15 px-5
                    py-3 font-black text-white/55
                  "
                >
                  Continue to Order Request
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-white/60">
                  Guest submission, customer
                  accounts, and admin review
                  are coming in the next
                  milestone.
                </p>

                <a
                  href="/wraps"
                  className="mt-5 block text-center text-sm font-bold text-white underline decoration-red-600 underline-offset-4 transition hover:text-red-500"
                >
                  Add More Wraps
                </a>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
