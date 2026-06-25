import type { ModalData, PageData } from "../types";
export * from "./createRoute";

/** Wrap a page descriptor so the route tree can detect leaves via `data`. */
export const setPage = <const T extends PageData>(data: T) => ({ data });

/** Identity helper that gives nice inference for modal descriptors. */
export const setModal = <const T extends ModalData>(data: T): T => data;
