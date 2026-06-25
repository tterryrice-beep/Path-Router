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
 * Public types.
 *
 * Note on config-dependent generics: `PathNamesOf<C>` and `ModalNamesOf<C>`
 * REQUIRE the config generic — there is no default. Use them as
 * `PathNamesOf<typeof config>` etc.
 *
 * `PathContextType` is intentionally not re-exported — get a typed context
 * shape via the `usePath` returned by `createPathRouter(config)`.
 */
export type {
  /* Config shape */
  RouterConfig,
  PageData,
  ModalData,
  /* Props passed to a modal component */
  ModalProps,
  /* Config-dependent helpers (require <typeof config>) */
  PathNamesOf,
  ModalNamesOf,
  /* Context sub-shapes */
  ModalState,
  SearchParams,
  SearchParamsState,
  /* `ModalWrapper` plugin contract */
  ModalWrapperComponent,
  ModalWrapperProps,
  ModalWrapperRef,
} from "./types";
