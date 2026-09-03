const DEFAULT_REDIRECT = "/dashboard";

/**
 * Only internal app paths beginning with a single "/" are accepted.
 * Protocol-relative ("//host") and absolute external URLs are rejected
 * so a `redirect` query param can never send a user off-site.
 */
export function sanitizeRedirect(path: string | null | undefined, fallback: string = DEFAULT_REDIRECT): string {
  if (!path) return fallback;
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  return path;
}
