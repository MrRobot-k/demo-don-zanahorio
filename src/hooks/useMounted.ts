import { useEffect, useState } from "react";

/**
 * True once the component has completed its first client-side commit.
 *
 * Astro server-renders islands without access to localStorage, so any UI
 * derived from a persistent store (cart contents, loyalty session, ...)
 * must render its SSR-safe default on the very first client render too —
 * otherwise React's hydration pass sees a mismatch between server and
 * client markup and discards/regenerates the whole subtree.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
