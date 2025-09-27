export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
};
