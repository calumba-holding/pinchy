// Preload: set globalThis.AsyncLocalStorage before Next.js modules initialize.
// Next.js 16 expects this global but tsx's module loader can cause
// async-local-storage.js to run before Next.js's own require-hook sets it.
const { AsyncLocalStorage } = require("node:async_hooks");
globalThis.AsyncLocalStorage = AsyncLocalStorage;
