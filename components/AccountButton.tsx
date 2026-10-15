"use client";

import { useAuth } from "@/components/AuthProvider";

export default function AccountButton({
  inline = false,
}: {
  inline?: boolean;
}) {
  const { user, loading, isAnonymous, isAdmin } = useAuth();

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
      className={inline ? "pnp-account-link" : "pnp-account-float"}
    >
      {loading ? "Account" : label}
    </a>
  );
}
