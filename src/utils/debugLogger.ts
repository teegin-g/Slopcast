/**
 * Debug Logger — sends structured log messages to the Vite dev server
 * via HMR WebSocket so they appear in the terminal.
 *
 * Usage:
 *   import { debugLog } from '@/utils/debugLogger';
 *   debugLog.info('overlaps', 'Found 3 overlap violations', violations);
 *   debugLog.warn('perf', 'Slow render detected', { component, ms });
 */

type LogLevel = 'info' | 'warn' | 'error';

function send(level: LogLevel, tag: string, message: string, data?: unknown) {
  if (!import.meta.hot) return;
  import.meta.hot.send('debug:log', { level, tag, message, data });
}

export const debugLog = {
  info: (tag: string, message: string, data?: unknown) => send('info', tag, message, data),
  warn: (tag: string, message: string, data?: unknown) => send('warn', tag, message, data),
  error: (tag: string, message: string, data?: unknown) => send('error', tag, message, data),
};
