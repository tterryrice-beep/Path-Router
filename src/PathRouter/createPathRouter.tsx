import React, { type ReactNode, type Ref, useContext } from "react";

import { PathContext } from "./Provider/context";
import { PathProvider as BasePathProvider } from "./Provider/PathProvider";
import { PathRouterContainer as BasePathRouterContainer } from "./Container/RouterContainer";
import { NavLink as BaseNavLink, type NavLinkProps } from "./NavLink";
import type {
  ModalNamesOf,
  ModalWrapperComponent,
  PathContextType,
  PathNamesOf,
  RouterConfig,
} from "./types";

/**
 * Bound `PathRouterContainer` props — `config` is captured by the factory,
 * so the consumer only needs to pass presentation-related options.
 */
export interface BoundPathRouterContainerProps {
  ModalWrapper?: ModalWrapperComponent;
  fallback?: ReactNode;
}

export interface BoundNavLinkProps<
  C extends RouterConfig<any, any>,
> extends NavLinkProps<C> {}

/**
 * Build a router instance bound to a concrete config.
 *
 * All returned helpers are pre-typed against the supplied config — no need
 * to thread `typeof config` through every call site.
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
export const createPathRouter = <const C extends RouterConfig<any, any>>(
  config: C,
) => {
  /** Typed `usePath` — `page.navigate` / `modal.open` know your routes. */
  const usePath = (): PathContextType<C> =>
    useContext(PathContext) as unknown as PathContextType<C>;

  /** Container with `config` already injected. */
  const PathRouterContainer: React.FC<BoundPathRouterContainerProps> = (
    props,
  ) => <BasePathRouterContainer config={config} {...props} />;

  /** Typed `NavLink` — `to` / `modal` are autocompleted from your config. */
  const NavLink = BaseNavLink as unknown as (
    props: BoundNavLinkProps<C> & { ref?: Ref<HTMLAnchorElement> },
  ) => React.ReactElement | null;

  /**
   * Identity helper that constrains its argument to a valid page path
   * for this config. Use it where you need a typed path literal:
   *
   * ```ts
   * page.navigate(getPath("home"));
   * ```
   */
  const getPath = <P extends PathNamesOf<C>>(path: P): P => path;

  /**
   * Identity helper that constrains its argument to a valid modal name
   * for this config.
   *
   * ```ts
   * modal.open(getModal("test"));
   * ```
   */
  const getModal = <M extends ModalNamesOf<C>>(name: M): M => name;

  return {
    /** `BrowserRouter` + context provider — does not depend on the config. */
    PathProvider: BasePathProvider,
    PathRouterContainer,
    usePath,
    NavLink,
    getPath,
    getModal,
    /** The original config, re-exported for convenience. */
    config,
  };
};

export type PathRouter<C extends RouterConfig<any, any>> = ReturnType<
  typeof createPathRouter<C>
>;
