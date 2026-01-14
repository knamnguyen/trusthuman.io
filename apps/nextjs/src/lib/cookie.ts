"use client";

import type { SerializeOptions } from "cookie";
import { parse, serialize } from "cookie";

export function getCookies() {
  if (typeof window === "undefined") {
    return {};
  }
  return parse(document.cookie) as Record<string, string>;
}

export function saveCookie(
  name: string,
  value: string,
  opts?: SerializeOptions,
) {
  document.cookie = serialize(name, value, opts);
}
