import React, { type FC,  useCallback, useMemo } from "react";
import {
  BrowserRouter,
  type Location,
  type NavigateOptions,
  type To,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  PropsWithChildren,
  type ModalState,
  type PathContextType,
  type SearchParams,
  type SearchParamsState,
} from "../types";
import { clearSlash } from "../utils/clearSlash";
import { parseSearchParams } from "../utils/parseSearch";
import { PathContext } from "./context";


const modalSplitter = "/modal/";

const InnerProvider: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  /** Derive page path & modal state from location.pathname (no extra render cycle). */
  const { pagePath, modalState } = useMemo<{
    pagePath: string;
    modalState: ModalState;
  }>(() => {
    const [rawPagePath, modalPath] = location.pathname.split(modalSplitter) as [
      string?,
      string?,
    ];

    const segments = (modalPath || "").split("/").filter(Boolean);
    const name = segments[0];
    const breadCrumbs = segments.slice(1);

    return {
      pagePath: clearSlash(rawPagePath || "/"),
      modalState: {
        name,
        breadCrumbs,
        path: segments.join("/"),
        isOpen: !!name,
      },
    };
  }, [location.pathname]);

  /** Derive search params from location.search. */
  const searchParams = useMemo<SearchParams>(() => {
    const usp = new URLSearchParams(location.search);
    const out: SearchParams = {};
    for (const [key, value] of usp.entries()) {
      const arr = out[key];
      if (!arr) out[key] = [value];
      else arr.push(value);
    }
    return out;
  }, [location.search]);

  const setModal = useCallback(
    (name: string, breadCrumbs?: string[]) => {
      const tail = (breadCrumbs || []).filter(Boolean).join("/");
      const next = clearSlash(
        `${pagePath}${modalSplitter}${name}${tail ? `/${tail}` : ""}`,
      );
      navigate(next);
    },
    [navigate, pagePath],
  );

  const closeModal = useCallback(() => {
    navigate(clearSlash(pagePath));
  }, [navigate, pagePath]);

  const setPath = useCallback(
    (to: To, options?: NavigateOptions) => {
      if (typeof to === "string") {
        const next = clearSlash(to);
        if (next === location.pathname) return;
        navigate(next, options);
      } else {
        if (
          to.pathname &&
          to.pathname === location.pathname &&
          (to.search ?? "") === location.search &&
          (to.hash ?? "") === location.hash
        ) {
          return;
        }
        navigate(
          {
            ...to,
            pathname: to.pathname ? clearSlash(to.pathname) : to.pathname,
          },
          options,
        );
      }
    },
    [navigate, location.pathname, location.search, location.hash],
  );

  const pageNavigate = useCallback(
    (path: string, options?: NavigateOptions) => {
      setPath(path as To, options);
    },
    [setPath],
  );

  /** Merge: string -> set, array -> append. Preserves hash. */
  const changeSearchParams = useCallback(
    (next: SearchParamsState) => {
      navigate({
        pathname: location.pathname,
        search: parseSearchParams(next, location as Location).toString(),
        hash: location.hash,
      });
    },
    [navigate, location],
  );

  /** Replace fully: each provided key is overwritten with given value(s). */
  const setSearchParams = useCallback(
    (next: SearchParamsState) => {
      const params = new URLSearchParams(location.search);
      Object.entries(next).forEach(([key, value]) => {
        params.delete(key);
        if (typeof value === "string") {
          params.append(key, value);
        } else {
          value.forEach((v) => params.append(key, v));
        }
      });
      navigate({
        pathname: location.pathname,
        search: params.toString(),
        hash: location.hash,
      });
    },
    [navigate, location],
  );

  const deleteSearchParams = useCallback(
    (key: string) => {
      const params = new URLSearchParams(location.search);
      params.delete(key);
      navigate({
        pathname: location.pathname,
        search: params.toString(),
        hash: location.hash,
      });
    },
    [navigate, location],
  );

  const clearSearchParams = useCallback(() => {
    navigate({
      pathname: location.pathname,
      search: "",
      hash: location.hash,
    });
  }, [navigate, location]);

  const value = useMemo<PathContextType>(
    () => ({
      page: {
        path: pagePath,
        navigate: pageNavigate,
        isHavePrevHistory: location.key !== "default",
      },
      modal: {
        ...modalState,
        open: setModal,
        close: closeModal,
      },
      searchParams: {
        params: searchParams,
        change: changeSearchParams,
        set: setSearchParams,
        delete: deleteSearchParams,
        clear: clearSearchParams,
      },
      defaultLocation: location as Location,
    }),
    [
      pagePath,
      pageNavigate,
      location,
      modalState,
      setModal,
      closeModal,
      searchParams,
      changeSearchParams,
      setSearchParams,
      deleteSearchParams,
      clearSearchParams,
    ],
  );

  return <PathContext.Provider value={value}>{children}</PathContext.Provider>;
};

/**
 * Wraps the application with `BrowserRouter` and the `PathContext`.
 * Place this near the root of your component tree.
 */
export const PathProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <BrowserRouter>
      <InnerProvider>{children}</InnerProvider>
    </BrowserRouter>
  );
};
