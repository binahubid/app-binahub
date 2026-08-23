export function safeInternalPath(value: string | null | undefined, fallback = "/home") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const base = new URL("https://app.binahub.invalid");
    const destination = new URL(value, base);

    if (destination.origin !== base.origin) {
      return fallback;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
