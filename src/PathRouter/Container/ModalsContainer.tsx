import React, { Fragment, Suspense, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { usePath } from "../Provider/usePath";
import { clearSlash } from "../utils/clearSlash";
import type {
  ModalData,
  ModalWrapperComponent,
  ModalWrapperRef,
} from "../types";

export interface ModalContainerProps {
  paths: { pathName: string; data: ModalData }[];
  /**
   * Optional wrapper around the modal contents (e.g. an animated popup).
   * If omitted, the modal component is rendered directly.
   */
  ModalWrapper?: ModalWrapperComponent;
  /** Fallback shown by `Suspense` while a lazy modal is loading. */
  fallback?: React.ReactNode;
}

export const ModalsContainer: React.FC<ModalContainerProps> = ({
  paths,
  ModalWrapper,
  fallback = null,
}) => {
  const { page, modal } = usePath();
  const { name: modalName, isOpen, close } = modal;
  const modalRef = useRef<ModalWrapperRef | null>(null);

  const hasMatchingComponent =
    !!modalName &&
    paths.some(
      ({ pathName, data }) => pathName === modalName && !!data.component,
    );

  useEffect(() => {
    if (isOpen && !hasMatchingComponent) {
      close();
    }
  }, [isOpen, hasMatchingComponent, close]);

  if (!modalName) return null;

  const routesLocation = clearSlash(`${page.path}/${modalName}`);

  const handleClose = () =>
    modalRef.current?.handleCloseWithAnimation
      ? modalRef.current.handleCloseWithAnimation()
      : close();

  const content = (
    <Suspense fallback={fallback}>
      <Routes location={routesLocation}>
        {paths.map(({ pathName, data }, i) => {
          const { component: Component } = data;
          if (!Component) {
            return (
              <Route
                key={`modals/${pathName}_${i}`}
                path={clearSlash(`${page.path}/${pathName}`)}
                element={<Navigate to="/" replace />}
              />
            );
          }
          return (
            <Route
              key={`modals/${pathName}_${i}`}
              path={clearSlash(`${page.path}/${pathName}`)}
              element={<Component onClose={handleClose} />}
            />
          );
        })}
      </Routes>
    </Suspense>
  );

  if (!ModalWrapper) {
    return isOpen ? <Fragment>{content}</Fragment> : null;
  }

  return (
    <ModalWrapper
      ref={modalRef}
      modalName={modalName}
      isOpen={isOpen}
      onClose={close}>
      {content}
    </ModalWrapper>
  );
};
