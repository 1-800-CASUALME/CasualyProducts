function ts() {
  return new Date().toISOString();
}

export const logger = {
  info:  (msg, ...args) => console.log( `[${ts()}] INFO  ${msg}`, ...args),
  warn:  (msg, ...args) => console.warn(`[${ts()}] WARN  ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[${ts()}] ERROR ${msg}`, ...args),
  debug: (msg, ...args) => {
    if (process.env.DEBUG) console.log(`[${ts()}] DEBUG ${msg}`, ...args);
  },
};
