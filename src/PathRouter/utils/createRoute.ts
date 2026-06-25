import {
  type ExtendedPage,
  type PageEntries,
  type ModalEntries,
  type ParsedRoute,
  type PagesRoute,
  type RouterConfig,
} from "../types";

const objectIsEmpty = (obj: Record<string, any>) =>
  Object.keys(obj).length === 0;

/**
 * Парсить користувацький конфіг роутера у плоскі списки сторінок та модалок.
 *
 * **Тип повернення повністю залежить від конфігу `C`**: для кожної сторінки
 * та модалки зберігаються її власні, унікальні кастомні ключі (`title`,
 * `icon`, тощо). У результаті `pages` та `modals` — це discriminated union'и
 * по `pathName`, які можна звужувати:
 *
 * ```ts
 * pages.forEach(({ pathName, data }) => {
 *   if (pathName === "modules") data.title; // string "Modules"
 * });
 * ```
 *
 * Якщо ж усі сторінки декларують спільне поле (наприклад, всі мають `title`),
 * до нього можна звертатись без звуження — TS знає, що воно є на кожній.
 */
export const parseRouteConfig = <C extends RouterConfig<any, any>>(
  config: C,
): ParsedRoute<C> => {
  const pagesRoutes: PageEntries<C["pages"]>[] = [];

  const walk = (route: PagesRoute | ExtendedPage, currentPath: string) => {
    Object.entries(route).forEach(([pathName, content]: [string, any]) => {
      if (content?.data) {
        pagesRoutes.push({
          pathName: currentPath + pathName,
          data: { ...content.data },
        } as PageEntries<C["pages"]>);
      }

      if (
        content &&
        !objectIsEmpty(content) &&
        !content.component &&
        !content.redirect
      ) {
        const newPath = currentPath + pathName;
        walk(
          content as PagesRoute,
          newPath + (newPath[newPath.length - 1] !== "/" ? "/" : ""),
        );
      }
    });
  };

  walk(config.pages, "");

  const modalsList = Object.entries(config.modals || {}).map(
    ([pathName, data]) =>
      ({ pathName, data }) as ModalEntries<C["modals"]>,
  );

  return {
    pages: pagesRoutes,
    modals: modalsList,
  };
};
