/* global URL */
import { SITE } from "@astro-theme-site/config";

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");

/** Prefix a root-relative path with Astro's configured deployment base. */
export function withBase(path: string): string {
  if (!path || !path.startsWith("/")) return path;
  if (!BASE || path === BASE || path.startsWith(`${BASE}/`)) return path;
  return `${BASE}${path}`;
}

export function sitePath(path: string): string {
  return withBase(path.startsWith("/") ? path : `/${path}`);
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "";
  if (SITE.isoDates) return value.toISOString().slice(0, 10);
  return new Intl.DateTimeFormat("en-US", options).format(value);
}

export function isoDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(value.getTime()) ? "" : value.toISOString();
}

export function canonicalUrl(pathname: string): string {
  return new URL(pathname, SITE.url).toString();
}
