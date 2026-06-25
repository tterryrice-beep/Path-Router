/**
 * PathRouter — public API.
 *
 * Everything that depends on a concrete config is produced by
 * `createPathRouter(config)`. The package itself only exposes:
 *
 *   - `setPage` / `setModal`   — config builders;
 *   - `createPathRouter`       — the factory;
 *   - `clearSlash`             — path normalizer;
 *   - generic helper types     — must be parametrised with `typeof config`;
 *   - plugin / data types      — for `ModalWrapper` authors and modal
 *                                components (`ModalProps`, etc.).
 *
 * `PathProvider`, `PathRouterContainer`, `usePath`, `NavLink`, `getPath`,
 * `getModal` are intentionally **not** re-exported — obtain them from
 * `createPathRouter(config)`.
 *
 * ```ts
 * import { setPage, setModal, createPathRouter } from "@/modules/PathRouter";
 *
 * const config = {
 *   pages:  { home: setPage({ component: Home }) },
 *   modals: { test: setModal({ component: TestModal }) },
 * } as const;
 *
 * export const {
 *   PathProvider,
 *   PathRouterContainer,
 *   usePath,
 *   NavLink,
 *   getPath,
 *   getModal,
 * } = createPathRouter(config);
 * ```
 */

/* Config builders */
export { setPage, setModal } from "./utils/setters";

/* The factory — the only way to get config-bound router pieces */
export { createPathRouter } from "./createPathRouter";
export type {
  BoundPathRouterContainerProps,
  BoundNavLinkProps,
  PathRouter,
} from "./createPathRouter";

/* Path normalizer */
export { clearSlash } from "./utils/clearSlash";

/*
 * All public types are grouped in the `types` namespace to avoid polluting
 * function autocomplete:
 *
 *   import { createPathRouter } from "@/modules/PathRouter";
 *   import type { types } from "@/modules/PathRouter";
 *
 *   function setup(config: types.RouterConfig) { ... }
 *
 * Alternatively, import directly from the types entrypoint:
 *
 *   import type { RouterConfig } from "@/modules/PathRouter/types";
 */
export * as types from "./types";
