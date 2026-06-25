/**
 * Normalize path:
 *  - collapse internal "//" sequences to a single "/"
 *  - guarantee a single leading "/"
 *  - strip trailing "/" (root "/" stays as "/")
 */
export const clearSlash = (path: string): string => {
  if (!path) return "/";

  let p = path.replace(/\/{2,}/g, "/");

  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "");

  return p;
};
