const REMEMBER_LOGIN_KEY =
  "pnp-remember-login";

function browserAvailable(): boolean {
  return typeof window !== "undefined";
}

export function getRememberLogin(): boolean {
  if (!browserAvailable()) {
    return true;
  }

  return (
    window.localStorage.getItem(
      REMEMBER_LOGIN_KEY,
    ) !== "false"
  );
}

export function setRememberLogin(
  remember: boolean,
): void {
  if (!browserAvailable()) {
    return;
  }

  window.localStorage.setItem(
    REMEMBER_LOGIN_KEY,
    String(remember),
  );
}

export const pnpAuthStorage = {
  getItem(key: string): string | null {
    if (!browserAvailable()) {
      return null;
    }

    return (
      window.sessionStorage.getItem(key) ??
      window.localStorage.getItem(key)
    );
  },

  setItem(
    key: string,
    value: string,
  ): void {
    if (!browserAvailable()) {
      return;
    }

    if (getRememberLogin()) {
      window.localStorage.setItem(
        key,
        value,
      );
      window.sessionStorage.removeItem(
        key,
      );
      return;
    }

    window.sessionStorage.setItem(
      key,
      value,
    );
    window.localStorage.removeItem(key);
  },

  removeItem(key: string): void {
    if (!browserAvailable()) {
      return;
    }

    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};
