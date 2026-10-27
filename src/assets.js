export function asset(path) {
  if (!path) return path;
  if (/^(https?:|tel:|mailto:|data:)/.test(path)) return path;
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${base.endsWith("/") ? base : `${base}/`}${clean}`;
}

export function normalizePath(pathname) {
  if (!pathname) return "/";
  let path = pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path || "/";
}

export function routePath(route) {
  if (!route) return "/";
  const [path, hash] = String(route).split("#");
  const base = !path || path === "/" ? "/" : path.endsWith("/") ? path.slice(0, -1) : path;
  return hash ? `${base}#${hash}` : base;
}
