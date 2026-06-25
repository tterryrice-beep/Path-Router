import { useContext } from "react";
import { PathContext } from "./context";
import type { PathContextType, RouterConfig } from "../types";

/**
 * Access the router context.
 *
 * Pass `typeof yourConfig` as the generic to get fully typed
 * `page.navigate(...)` and `modal.open(...)` arguments:
 *
 * ```ts
 * const { page, modal } = usePath<typeof config>();
 * page.navigate("add");      // typed
 * modal.open("test");        // typed
 * ```
 */
export const usePath = <
  C extends RouterConfig<any, any> = RouterConfig<any, any>,
>(): PathContextType<C> => {
  return useContext(PathContext) as unknown as PathContextType<C>;
};
