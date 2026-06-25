import React, { type ReactNode, Suspense, useMemo } from "react";
import { Routes as Switch, Route, Navigate } from "react-router-dom";

import { usePath } from "../Provider/usePath";
import { createRoute } from "../utils/createRoute";

import { ModalsContainer } from "./ModalsContainer";
import type { ModalWrapperComponent, RouterConfig } from "../types";

export interface PathRouterProps<C extends RouterConfig<any, any>> {
  /** Pages + modals tree built with `setPage` / `setModal`. */
  config: C;
  /**
   * Optional component used to wrap modal content (animated popup, etc.).
   * The package will pass it `{ modalName, isOpen, onClose, children }`
   * and read `handleCloseWithAnimation()` from its forwarded ref.
   */
  ModalWrapper?: ModalWrapperComponent;
  /** Suspense fallback shown while pages / modals are loading. */
  fallback?: ReactNode;
}

export const PathRouterContainer = <C extends RouterConfig<any, any>>({
  config,
  ModalWrapper,
  fallback = null,
}: PathRouterProps<C>) => {
  const { modal } = usePath();

  const { pages, modals } = useMemo(() => createRoute(config), [config]);

  return (
    <>
      <Suspense fallback={fallback}>
        <Switch>
          {pages.map(({ pathName, data }, i) => {
            const { component: Component, redirect } = data;
            const isRedirect = Boolean(!Component || redirect);

            return (
              <Route
                key={`routes/${pathName}_${i}`}
                path={pathName}
                element={
                  !isRedirect && Component ? (
                    <Component />
                  ) : (
                    <Navigate to={redirect || "/"} replace />
                  )
                }
              />
            );
          })}
        </Switch>
      </Suspense>

      {modal.isOpen && (
        <ModalsContainer
          paths={modals}
          ModalWrapper={ModalWrapper}
          fallback={fallback}
        />
      )}
    </>
  );
};
