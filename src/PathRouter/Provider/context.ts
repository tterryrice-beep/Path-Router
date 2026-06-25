import { createContext } from "react";
import { type PathContextType } from "../types";

const defaultValues: PathContextType = {
  page: {
    path: "",
    navigate: () => {},
    isHavePrevHistory: false,
  },
  modal: {
    open: () => {},
    close: () => {},
    path: "",
    breadCrumbs: [],
    isOpen: false,
  },
  searchParams: {
    params: {},
    change: () => {},
    set: () => {},
    clear: () => {},
    delete: () => {},
  },
};

export const PathContext = createContext<PathContextType>(defaultValues);
