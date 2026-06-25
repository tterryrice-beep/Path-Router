export const sleep = (timeInSeconds: number): Promise<null> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(null), timeInSeconds * 1000),
  );
