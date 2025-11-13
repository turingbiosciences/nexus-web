/**
 * Unified logging utility using Pino with Sentry integration.
 *
 * - Development: Pretty-printed logs to console
 * - Production: Structured JSON logs
 * - Errors automatically sent to Sentry for tracking
 *
 * Usage:
 *   logger.info({ userId, projectId }, 'User created project');
 *   logger.error({ error, context }, 'Failed to upload file');
 *   logger.debug({ data }, 'Processing dataset');
 */

import pino from "pino";
import * as Sentry from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV === "development";
const isServer = typeof window === "undefined";

// Pino configuration
const pinoConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  
  // Browser configuration
  browser: {
    asObject: true,
    serialize: true,
  },

  // Pretty print in development
  ...(isDevelopment && isServer
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),

  // Add timestamp in production
  ...(!isDevelopment && { timestamp: pino.stdTimeFunctions.isoTime }),
};

// Create base Pino logger
const baseLogger = pino(pinoConfig);

// Custom logger wrapper that sends errors to Sentry
const createLogger = () => {
  return {
    /**
     * Log informational messages
     */
    info: (obj: object | string, msg?: string) => {
      if (typeof obj === "string") {
        baseLogger.info(obj);
      } else {
        baseLogger.info(obj, msg);
      }
    },

    /**
     * Log warning messages
     */
    warn: (obj: object | string, msg?: string) => {
      if (typeof obj === "string") {
        baseLogger.warn(obj);
      } else {
        baseLogger.warn(obj, msg);
      }
    },

    /**
     * Log error messages and send to Sentry
     */
    error: (obj: object | string, msg?: string) => {
      // Log with Pino
      if (typeof obj === "string") {
        baseLogger.error(obj);
        // Send to Sentry
        Sentry.captureMessage(obj, "error");
      } else {
        baseLogger.error(obj, msg);
        // Send to Sentry with context
        const error = (obj as Record<string, unknown>).error || (obj as Record<string, unknown>).err;
        if (error instanceof Error) {
          Sentry.captureException(error, {
            contexts: { extra: obj },
          });
        } else {
          Sentry.captureMessage(msg || "Error occurred", {
            level: "error",
            contexts: { extra: obj },
          });
        }
      }
    },

    /**
     * Log debug messages (only in development)
     */
    debug: (obj: object | string, msg?: string) => {
      if (!isDevelopment) return;
      
      if (typeof obj === "string") {
        baseLogger.debug(obj);
      } else {
        baseLogger.debug(obj, msg);
      }
    },

    /**
     * Log trace messages (only in development, very verbose)
     */
    trace: (obj: object | string, msg?: string) => {
      if (!isDevelopment) return;
      
      if (typeof obj === "string") {
        baseLogger.trace(obj);
      } else {
        baseLogger.trace(obj, msg);
      }
    },

    /**
     * Create a child logger with additional context
     */
    child: (bindings: object) => {
      baseLogger.child(bindings);
      return createLogger();
    },
  };
};

export const logger = createLogger();

/**
 * Helper to log API requests
 */
export const logApiRequest = (
  method: string,
  url: string,
  options?: { status?: number; duration?: number; error?: Error }
) => {
  const logData = {
    method,
    url,
    status: options?.status,
    duration: options?.duration ? `${options.duration}ms` : undefined,
  };

  if (options?.error) {
    logger.error({ ...logData, error: options.error }, "API request failed");
  } else if (options?.status && options.status >= 400) {
    logger.warn(logData, "API request returned error status");
  } else {
    logger.info(logData, "API request completed");
  }
};

/**
 * Helper to log component errors (React error boundaries)
 */
export const logComponentError = (
  componentName: string,
  error: Error,
  errorInfo?: { componentStack?: string }
) => {
  logger.error(
    {
      component: componentName,
      error,
      componentStack: errorInfo?.componentStack,
    },
    `Error in ${componentName}`
  );
};
