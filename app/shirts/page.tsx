export default function ShirtsPage() {
  const products = [
    { name: "Birthday Tee", price: "$28.00", available: true },
    { name: "Mom Life Shirt", price: "$30.00", available: true },
    { name: "Custom Name Shirt", price: "$32.00", available: true },
    { name: "Family Matching Set", price: "$55.00", available: false },
    { name: "Bride Tribe Tee", price: "$28.00", available: true },
    { name: "Sports Mom Shirt", price: "$30.00", available: true },
  ];

  return (
    <main className="min-h-screen bg-[#fff8fb] text-[#24151b]">
      <nav className="flex items-center justify-between px-6 py-5">
        <a href="/" className="text-2xl font-bold tracking-tight">Pressed In Pink</a>
        <a
          href="https://www.instagram.com/pressed_in_pink/"
          target="_blank"
          className="rounded-full bg-[#ff4f8d] px-5 py-2 text-sm font-semibold text-white shadow-md"
        >
          Instagram
        </a>
      </nav>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <a href="/" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#ff4f8d] shadow-sm border border-pink-100 hover:bg-[#ffe1ec] transition">
          ← Back
        </a>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#ff4f8d]">
          Lookbook
        </p>
        <h1 className="text-5xl font-black md:text-6xl">Shirts</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[#6f4b58]">
          Browse our lookbook. DM us on Instagram to place an order.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.name}
              className="group overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-[#ffe1ec]" />
              <div className="p-5">
                <h3 className="text-lg font-black">{product.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold">{product.price}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      product.available
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {product.available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-3xl bg-white p-8 text-center shadow-sm border border-pink-100">
          <h2 className="text-2xl font-black">Interested in something?</h2>
          <p className="mt-2 text-[#6f4b58]">
            Send us a message on Instagram and we will help you place your order.
          </p>
          <a
            href="https://www.instagram.com/pressed_in_pink/"
            target="_blank"
            className="mt-5 inline-block rounded-full bg-[#ff4f8d] px-6 py-3 text-sm font-bold text-white shadow-md"
          >
            Message to Order
          </a>
        </div>
      </section>

      <footer className="mt-16 bg-white px-6 py-10 text-center">
        <h3 className="text-2xl font-black">Pressed In Pink</h3>
        <p className="mt-2 text-[#6f4b58]">
          Handmade with love in Rialto, California.
        </p>
      </footer>
    </main>
  );
}
