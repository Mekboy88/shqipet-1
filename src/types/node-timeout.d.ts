/**
 * Browser-safe type alias for NodeJS.Timeout
 * This allows us to use NodeJS.Timeout in browser code without importing Node.js types
 */
declare namespace NodeJS {
  type Timeout = ReturnType<typeof setTimeout>;
}

export {};
