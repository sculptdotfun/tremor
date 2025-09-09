/**
 * Simple logger utility for development
 * In production, these are no-ops to avoid console pollution
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors
    console.error('[ERROR]', ...args);
  },
};

export default logger;