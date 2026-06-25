import type {
  ComponentType,
  LazyExoticComponent,
  ReactNode,
  RefAttributes,
} from "react";
import type {  NavigateOptions } from "react-router-dom";

/* ───────────────────────── Generic helpers ───────────────────────── */

export type NestedKeyOf<ObjectType extends object, StopKey extends string> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? Key extends StopKey
      ? never
      : `${Key}` | `${Key}/${NestedKeyOf<ObjectType[Key], StopKey>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

/* ───────────────────────── Page / Modal data ───────────────────────── */

export type PageComponent =
  | ComponentType<any>
  | LazyExoticComponent<ComponentType<any>>;
export type PageData<O = Record<string, unknown>> = {
  component?: PageComponent;
  redirect?: string;
} & O;

export interface ModalProps {
  onClose: () => void;
}

export type ModalComponent =
  | ComponentType<ModalProps>
  | LazyExoticComponent<ComponentType<ModalProps>>;

export type ModalData<O = Record<string, unknown>> = {
  component?: ModalComponent;
} & O;

export interface PageContent<O = Record<string, unknown>> {
  data?: PageData<O>;
}

export interface BreadCrumbsPage {
  [path: string]: ExtendedPage;
}

export type ExtendedPage = BreadCrumbsPage | PageContent;

export interface PagesRoute {
  [path: string]: ExtendedPage;
}

export type ModalRoutes<O = Record<string, unknown>> = Record<
  string,
  ModalData<O>
>;

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

/* ───────────────── Parsed entries (per-page / per-modal types) ─────────────── */

/** Хелпер: склеює префікс шляху з наступним сегментом без подвійного "/". */
type JoinPath<P extends string, K extends string> = P extends ""
  ? K
  : `${P}/${K}`;

/**
 * Лічильник для обмеження глибини рекурсії в `PageEntries`.
 * Покриває реалістичну глибину дерева сторінок (до 8 рівнів вкладеності).
 * Без цього TS падає з "Type instantiation is excessively deep".
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Рекурсивно обходить дерево сторінок з юзерського конфігу та повертає
 * **discriminated union** виду `{ pathName: <literal>; data: <exact data shape> }`
 * для кожної ноди, де є `data`.
 *
 * Завдяки цьому, при подальшому споживанні (мапа сайту, debug-таблиця тощо),
 * TS точно знає, які кастомні ключі є у `data` кожної конкретної сторінки —
 * їх можна звужувати через `if (pathName === "...")`.
 */
export type PageEntries<
  T,
  P extends string = "",
  Depth extends number = 8,
> = Depth extends 0
  ? never
  :
      | (T extends { data: infer D }
          ? { pathName: P; data: Partial<D> & PageData<{}> }
          : never)
      | (T extends object
          ? {
              [K in Exclude<keyof T, "data"> & string]: T[K] extends object
                ? PageEntries<T[K], JoinPath<P, K>, Prev[Depth]>
                : never;
            }[Exclude<keyof T, "data"> & string]
          : never);

/**
 * Discriminated union для модалок. Модалки — плоский dict, тому простіше:
 * `{ pathName: <literal modal key>; data: <exact ModalData shape> }`.
 *
 * Перетинаємо з `ModalData<{}>`, щоб базові поля (`component?`) лишались
 * доступними на будь-якому варіанті union'у.
 */
export type ModalEntries<M> = M extends object
  ? {
      [K in keyof M & string]: { pathName: K; data: M[K] & ModalData<{}> };
    }[keyof M & string]
  : never;

/** Виводить тип повернення `parseRouteConfig` для конфігу `C`. */
export interface ParsedRoute<C extends RouterConfig<any, any>> {
  pages: PageEntries<C["pages"]>[];
  modals: ModalEntries<C["modals"]>[];
}

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
  // defaultLocation: Location;
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

export interface PropsWithChildren {
  children?: ReactNode;
}
