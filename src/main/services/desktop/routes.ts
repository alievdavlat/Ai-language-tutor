/**
 * Shared helpers for deep-linking the renderer from OS launch points
 * (jump-list tasks, second-instance launches). A relaunch carries the target
 * route as `--route=/some/path`; we parse it back out of argv here.
 */
export const ROUTE_ARG_PREFIX = '--route='

/** Pull a `--route=…` value out of a process argv array, if present. */
export function parseRouteArg(argv: readonly string[]): string | null {
  const hit = argv.find((a) => a.startsWith(ROUTE_ARG_PREFIX))
  if (!hit) return null
  const route = hit.slice(ROUTE_ARG_PREFIX.length).trim()
  // Only accept in-app absolute paths — never an external URL.
  return route.startsWith('/') ? route : null
}
