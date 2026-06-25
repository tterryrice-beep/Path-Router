import type {
  ModalComponent,
  ModalData,
  PageComponent,
  PageData,
} from "../types";
export * from "./createRoute";

/**
 * Перевіряє, чи `value` — це саме React-компонент:
 *  - функція / клас  → `typeof === "function"`
 *  - `React.lazy` / `memo` / `forwardRef` → екзотик-обʼєкт із символом `$$typeof`
 *
 * Звичайний options-обʼєкт (`{ component, redirect, title, ... }`) сюди не
 * потрапляє, бо у нього немає `$$typeof`.
 */
const isReactComponent = (value: unknown): boolean => {
  if (typeof value === "function") return true;
  if (typeof value === "object" && value !== null && "$$typeof" in value) {
    return true;
  }
  return false;
};

/**
 * Wrap a page descriptor so the route tree can detect leaves via `data`.
 *
 * Підтримує дві форми виклику:
 * - `setPage(Component)`              — скорочення для `{ component: Component }`
 * - `setPage({ component, redirect, ...customKeys })` — повний options-обʼєкт
 */
export function setPage<const T extends PageComponent>(
  component: T,
): { data: { component: T } };
export function setPage<const T extends PageData>(data: T): { data: T };
export function setPage(
  input: PageComponent | PageData,
): { data: PageData } {
  if (isReactComponent(input)) {
    return { data: { component: input as PageComponent } };
  }
  return { data: input as PageData };
}

/**
 * Опис модалки. Дві форми, аналогічно до `setPage`:
 * - `setModal(Component)`               — скорочення для `{ component: Component }`
 * - `setModal({ component, ...custom })` — повний options-обʼєкт (підтримує
 *   будь-які кастомні ключі, як-от `title` для карти сайту тощо)
 *
 * На відміну від `setPage`, модалки у конфігу `RouterConfig.modals` зберігаються
 * "плоскими" — без обгортки `{ data }`, тому повертаємо саме `ModalData`.
 */
export function setModal<const T extends ModalComponent>(
  component: T,
): { component: T };
export function setModal<const T extends ModalData>(data: T): T;
export function setModal(input: ModalComponent | ModalData): ModalData {
  if (isReactComponent(input)) {
    return { component: input as ModalComponent };
  }
  return input as ModalData;
}
