/**
 * Logger utility for debugging
 */

// Configure logs to be displayed in development only
const isProduction = import.meta.env.PROD;
const isDebugMode = localStorage.getItem('debug_mode') === 'true';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  component?: string;
  data?: any;
}

/**
 * Logs messages to the console with consistent formatting
 */
export const logger = {
  /**
   * Log informational messages
   */
  info: (message: string, options?: LogOptions) => {
    if (isProduction && !isDebugMode) return;
    logToConsole('info', message, options);
  },
  
  /**
   * Log warning messages
   */
  warn: (message: string, options?: LogOptions) => {
    if (isProduction && !isDebugMode) return;
    logToConsole('warn', message, options);
  },
  
  /**
   * Log error messages
   */
  error: (message: string, options?: LogOptions) => {
    // Always log errors, even in production
    logToConsole('error', message, options);
  },
  
  /**
   * Log debug messages (only shown in debug mode)
   */
  debug: (message: string, options?: LogOptions) => {
    if (!isDebugMode) return;
    logToConsole('debug', message, options);
  }
};

/**
 * Format and print logs to the console
 */
function logToConsole(level: LogLevel, message: string, options?: LogOptions) {
  const timestamp = new Date().toISOString();
  const component = options?.component ? `[${options.component}]` : '';
  const formattedMessage = `${timestamp} ${level.toUpperCase()} ${component} ${message}`;
  
  switch (level) {
    case 'info':
      console.log('%c' + formattedMessage, 'color: #29b6f6');
      break;
    case 'warn':
      console.warn('%c' + formattedMessage, 'color: #ffa726');
      break;
    case 'error':
      console.error('%c' + formattedMessage, 'color: #f44336');
      break;
    case 'debug':
      console.debug('%c' + formattedMessage, 'color: #7e57c2');
      break;
  }
  
  // Log additional data if provided
  if (options?.data) {
    console.group('Additional data:');
    console.dir(options.data);
    console.groupEnd();
  }
}

/**
 * Enable or disable debug mode
 */
export function setDebugMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('debug_mode', 'true');
    console.log('%c[DEBUG MODE ENABLED]', 'color: #7e57c2; font-weight: bold; font-size: 14px;');
  } else {
    localStorage.removeItem('debug_mode');
    console.log('%c[DEBUG MODE DISABLED]', 'color: #7e57c2; font-size: 14px;');
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugModeEnabled(): boolean {
  return localStorage.getItem('debug_mode') === 'true';
} 