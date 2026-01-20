import env from "@/env";

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  method: {
    GET: '\x1b[94m',
    POST: '\x1b[92m',
    PUT: '\x1b[93m',
    PATCH: '\x1b[96m',
    DELETE: '\x1b[91m',
    default: '\x1b[90m'
  },
  status: {
    '2xx': '\x1b[32m',
    '3xx': '\x1b[33m',
    '4xx': '\x1b[93m',
    '5xx': '\x1b[91m'
  }
} as const;

const getStatusColor = (status: number): string => {
  if (status >= 500) return COLORS.status['5xx'];
  if (status >= 400) return COLORS.status['4xx'];
  if (status >= 300) return COLORS.status['3xx'];
  return COLORS.status['2xx'];
};

const formatDuration = (ms: number): string => {
  if (ms < 10) return `${Math.round(ms * 1000)}μs`;
  return `${ms.toFixed(0)}ms`;
};

export const createCustomLogger = (serviceName: string = 'Hono') => {
  const log = (message: string, ...rest: any[]) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp.slice(11, 23)}] ${serviceName}`;
    console.log(`${prefix} ${message}`, ...rest);
  };

  const print = (message: string, ...rest: any[]) => {
    // Handle undefined/null serviceName case that Hono might pass
    if (!message || typeof message !== 'string') {
      console.log(message, ...rest);
      return;
    }

    const parts = message.trim().split(' ');
    if (parts.length < 4) {
      console.log(message, ...rest);
      return;
    }

    const [method, path, statusStr, durationStr] = parts;
    
    // Safe parsing with fallbacks
    const status = parseInt(statusStr);
    const durationMs = parseFloat(durationStr.replace(/ms|μs/g, '')) || 0;
    
    if (isNaN(status) || isNaN(durationMs)) {
      console.log(message, ...rest);
      return;
    }

    const methodColor = (COLORS.method as any)[method] || COLORS.method.default;
    const statusColor = getStatusColor(status);
    
    const formatted = `${methodColor}${method}${COLORS.reset} ` +
                     `${COLORS.bright}${path}${COLORS.reset} ` +
                     `${statusColor}${status}${COLORS.reset} ` +
                     `${COLORS.dim}${formatDuration(durationMs)}${COLORS.reset}`;

    console.log(formatted, ...rest);
  };

  return { log, print };
};

// Fixed export with safe env fallback
export const { print: loggerPrint } = createCustomLogger(
  env.APP_NAME || process.env.APP_NAME || 'Hono App',
);
