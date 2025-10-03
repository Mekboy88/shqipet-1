/**
 * Browser-safe type alias for NodeJS.Timeout
 * Works in browser without Node types
 */
export {};

declare global {
  namespace NodeJS {
    type Timeout = ReturnType<typeof setTimeout>;
  }
}
