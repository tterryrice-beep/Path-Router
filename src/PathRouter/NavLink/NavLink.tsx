import React, {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import type { NavigateOptions } from "react-router-dom";

import { usePath } from "../Provider/usePath";
import { clearSlash } from "../utils/clearSlash";
import type {
  ModalNamesOf,
  PathNamesOf,
  RouterConfig,
} from "../types";

/** Internal — must match the splitter used by `PathProvider`. */
const modalSplitter = "/modal/";

export interface NavLinkProps<
  C extends RouterConfig<any, any> = RouterConfig<any, any>,
> extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /**
   * Target page path. If omitted, the current page is preserved
   * (useful when you only want to open a modal).
   */
  to?: PathNamesOf<C>;
  /** Modal to open on click. */
  modal?: ModalNamesOf<C>;
  /** Extra path segments appended after the modal name. */
  modalBreadCrumbs?: string[];
  /** Replace history entry instead of pushing a new one. */
  replace?: boolean;
  /** Extra options forwarded to the underlying `navigate`. */
  navigateOptions?: NavigateOptions;
  /** Class applied when this link matches the current location. */
  activeClassName?: string;
  children?: ReactNode;
}

const isModifiedEvent = (e: MouseEvent<HTMLAnchorElement>) =>
  e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

const NavLinkInner = forwardRef<HTMLAnchorElement, NavLinkProps>(
  (
    {
      to,
      modal,
      modalBreadCrumbs,
      replace,
      navigateOptions,
      className,
      activeClassName,
      onClick,
      target,
      children,
      ...rest
    },
    ref,
  ) => {
    const { page, modal: modalCtx } = usePath();

    /* ── Resolve the canonical href (always a real, shareable URL) ── */
    const targetPagePath = to ? clearSlash(to as string) : page.path;
    const tail = (modalBreadCrumbs || []).filter(Boolean).join("/");
    const href = clearSlash(
      modal
        ? `${targetPagePath}${modalSplitter}${modal}${tail ? `/${tail}` : ""}`
        : targetPagePath,
    );

    /* ── Active state ── */
    const isPageActive = !to || page.path === targetPagePath;
    const isModalActive = modal
      ? modalCtx.isOpen && modalCtx.name === modal
      : !modalCtx.isOpen || !to;
    const isActive =
      (!!to || !!modal) && isPageActive && (modal ? isModalActive : true);

    /* ── Click handler: keep native behaviour for "open in new tab" ── */
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(e);
      if (e.defaultPrevented) return;

      // Let the browser do its thing for non-primary buttons, modifier keys,
      // or links explicitly targeted to another window/frame.
      if (
        e.button !== 0 ||
        isModifiedEvent(e) ||
        (target && target !== "_self")
      ) {
        return;
      }

      // Nothing to navigate to — behave as a regular anchor.
      if (!to && !modal) return;

      e.preventDefault();

      const opts: NavigateOptions = { replace, ...navigateOptions };
      // Single `navigate` call covers both "go to page" and
      // "go to page + open modal" cases — the provider derives
      // the modal state from the resulting pathname.
      page.navigate(href as PathNamesOf<any>, opts);
    };

    return (
      <a
        {...rest}
        ref={ref}
        href={href}
        target={target}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive || undefined}
        className={`${className || ''} ${(isActive && activeClassName) || ''}`}
        >
        {children}
      </a>
    );
  },
);

NavLinkInner.displayName = "NavLink";

/**
 * Router-aware anchor.
 *
 * Renders a real `<a href>` (so right-click / "open in new tab" / SSR work)
 * and intercepts the primary-button click to call `page.navigate` /
 * open a modal through the `PathRouter` context.
 *
 * ```tsx
 * <NavLink<typeof config> to="add">Add item</NavLink>
 * <NavLink<typeof config> modal="confirm">Open confirm</NavLink>
 * <NavLink<typeof config> to="users" modal="confirm" modalBreadCrumbs={["step-2"]}>
 *   Go to users + open confirm at step 2
 * </NavLink>
 * ```
 */
export const NavLink = NavLinkInner as <
  C extends RouterConfig<any, any> = RouterConfig<any, any>,
>(
  props: NavLinkProps<C> & { ref?: Ref<HTMLAnchorElement> },
) => React.ReactElement | null;
