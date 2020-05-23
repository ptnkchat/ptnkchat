/**
 * Some helper functions
 * @packageDocumentation
 */

/**
 * Sleep for `ms` milliseconds
 * @param ms - How many milliseconds to sleep
 */
export const sleep = (ms: number): Promise<unknown> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
