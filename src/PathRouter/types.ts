import type {
  ComponentType,
  LazyExoticComponent,
  ReactNode,
  RefAttributes,
} from "react";
import type { Location, NavigateOptions } from "react-router-dom";

/* ───────────────────────── Generic helpers ───────────────────────── */

export type NestedKeyOf<ObjectType extends object, StopKey extends string> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? Key extends StopKey
      ? never
      : `${Key}` | `${Key}/${NestedKeyOf<ObjectType[Key], StopKey>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

/* ───────────────────────── Page / Modal data ───────────────────────── */

export type PageData = {
  component?: ComponentType<any> | LazyExoticComponent<ComponentType<any>>;
  redirect?: string;
} & Record<string, any>;

export interface ModalProps {
  onClose: () => void;
}

export interface ModalData {
  component?:
    | ComponentType<ModalProps>
    | LazyExoticComponent<ComponentType<ModalProps>>;
}

export interface PageContent {
  data?: PageData;
}

export interface BreadCrumbsPage {
  [path: string]: ExtendedPage;
}

export type ExtendedPage = BreadCrumbsPage | PageContent;

export interface PagesRoute {
  [path: string]: ExtendedPage;
}

export type ModalRoutes = Record<string, ModalData>;

/* ───────────────────────── Router config ───────────────────────── */

export interface RouterConfig<
  P extends PagesRoute = PagesRoute,
  M extends ModalRoutes = ModalRoutes,
> {
  pages: P;
  modals?: M;
}

/** Extract typed page paths from a user config. */
export type PathNamesOf<C extends RouterConfig<any, any>> =
  C extends RouterConfig<infer P, any> ? NestedKeyOf<P, "data"> : string;

/** Extract typed modal names from a user config. */
export type ModalNamesOf<C extends RouterConfig<any, any>> =
  C extends RouterConfig<any, infer M> ? Extract<keyof M, string> : string;

/* ───────────────────────── Path context ───────────────────────── */

export type SearchParams = Record<string, string[]>;

export interface SearchParamsState {
  [key: string]: string | string[];
}

export interface ModalState {
  path: string;
  name?: string;
  breadCrumbs: string[];
  isOpen: boolean;
}

export interface PathContextType<
  C extends RouterConfig<any, any> = RouterConfig<any, any>,
> {
  page: {
    path: string;
    navigate: (path: PathNamesOf<C>, options?: NavigateOptions) => void;
    isHavePrevHistory: boolean;
  };
  modal: {
    open: (name: ModalNamesOf<C>, breadCrumbs?: string[]) => void;
    close: () => void;
    /** Full modal path including modal name, e.g. "test/sub" */
    path: string;
    name?: string;
    /** Sub-crumbs without modal name */
    breadCrumbs: string[];
    isOpen: boolean;
  };
  searchParams: {
    params: SearchParams;
    /** Merge: string -> set; array -> append */
    change: (searchParams: SearchParamsState) => void;
    /** Replace fully: each key is set to provided value(s) */
    set: (searchParams: SearchParamsState) => void;
    delete: (key: string) => void;
    clear: () => void;
  };
  defaultLocation: Location;
}

/* ───────────────────────── Modal wrapper plugin ───────────────────────── */

export interface ModalWrapperRef {
  handleCloseWithAnimation: () => void;
}

export interface ModalWrapperProps {
  modalName?: string;
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

/**
 * Wrapper plugin component.
 *
 * Accepts both a `forwardRef`-wrapped component (the container will call
 * `ref.current.handleCloseWithAnimation()` when available) and a plain
 * function component that simply ignores the ref. `RefAttributes` keeps
 * `ref` as an optional prop, so any `ComponentType<ModalWrapperProps>`
 * structurally satisfies this signature in React 19.
 */
export type ModalWrapperComponent = ComponentType<
  ModalWrapperProps & RefAttributes<ModalWrapperRef>
>;
