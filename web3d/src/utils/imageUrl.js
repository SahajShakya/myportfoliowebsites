const API_BASE = import.meta.env.VITE_API_URL || "/api";
const BACKEND_URL = API_BASE.replace(/\/api\/?$/, "");

export function imageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return BACKEND_URL + (path.startsWith("/") ? path : "/" + path);
}
