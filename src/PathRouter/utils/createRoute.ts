import {
 type ExtendedPage,
 type ModalRoutes,
 type PageData,
 type PagesRoute,
 type RouterConfig,
} from "../types";

const objectIsEmpty = (obj: Record<string, any>) =>
  Object.keys(obj).length === 0;

/**
 * Flatten a nested page config into a list of `{ pathName, data }`,
 * and produce a flat list for modals as well.
 */
export const createRoute = (config: RouterConfig<any, any>) => {
  const pagesRoutes: { pathName: string; data: PageData }[] = [];

  const walk = (route: PagesRoute | ExtendedPage, currentPath: string) => {
    Object.entries(route).forEach(([pathName, content]: [string, any]) => {
      if (content?.data) {
        pagesRoutes.push({
          pathName: currentPath + pathName,
          data: { ...content.data } as PageData,
        });
      }

      if (
        content &&
        !objectIsEmpty(content) &&
        !content.component &&
        !content.redirect
      ) {
        const newPath = currentPath + pathName;
        walk(
          content,
          newPath + (newPath[newPath.length - 1] !== "/" ? "/" : ""),
        );
      }
    });
  };

  walk(config.pages, "");

  const modalsList = Object.entries(
    (config.modals || {}) as ModalRoutes,
  ).map(([pathName, data]) => ({ pathName, data }));

  return {
    pages: pagesRoutes,
    modals: modalsList,
  };
};
