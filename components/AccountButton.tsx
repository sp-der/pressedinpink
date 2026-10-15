
"use client";

import { useAuth } from "@/components/AuthProvider";

export default function AccountButton() {
  const {
    user,
    loading,
    isAnonymous,
    isAdmin,
  } = useAuth();

  let label = "Sign In";
  let href = "/login";

  if (!loading && user) {
    if (isAdmin) {
      label = "Admin";
      href = "/admin/orders";
    } else if (isAnonymous) {
      label = "Guest Orders";
      href = "/account";
    } else {
      label = "My Orders";
      href = "/account";
    }
  }

  return (
    <a
      href={href}
      className="
        fixed bottom-5 left-5 z-40
        rounded-full border-2
        border-red-600 bg-black/95
        px-5 py-3 font-black text-white
        shadow-2xl backdrop-blur-md
        transition duration-200
        hover:-translate-y-1 hover:bg-red-600
        focus:outline-none focus:ring-2
        focus:ring-red-500 focus:ring-offset-2
        focus:ring-offset-black
      "
    >
      {loading ? "Account" : label}
    </a>
  );
}
