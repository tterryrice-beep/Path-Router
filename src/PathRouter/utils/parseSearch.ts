import { type Location } from "react-router-dom";
import { type SearchParamsState } from "../types";

export const parseSearchParams = (
  searchParams: SearchParamsState,
  location: Location,
) => {
  const params = new URLSearchParams(location.search);
  Object.entries(searchParams).forEach(([key, values]) => {
    if (typeof values === "string") params.set(key, values);
    else values.forEach((value) => params.append(key, value));
  });

  return params;
};
