/**
 * Vite Plugin: Debug Logger
 *
 * Receives debug log messages from the browser via Vite's HMR WebSocket
 * and prints them to the terminal. This lets the DebugOverlay system
 * emit structured logs that developers see in their terminal alongside
 * normal Vite output.
 *
 * Browser side sends:  import.meta.hot.send('debug:log', { level, tag, message, data? })
 * Server side prints:  [DEBUG][tag] message  (with optional JSON data)
 */

import type { Plugin } from 'vite';

interface DebugLogPayload {
  level: 'info' | 'warn' | 'error';
  tag: string;
  message: string;
  data?: unknown;
}

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
};

function colorForLevel(level: string): string {
  switch (level) {
    case 'warn': return COLORS.yellow;
    case 'error': return COLORS.red;
    default: return COLORS.cyan;
  }
}

export default function debugLoggerPlugin(): Plugin {
  return {
    name: 'debug-logger',
    apply: 'serve', // dev only

    configureServer(server) {
      server.ws.on('debug:log', (payload: DebugLogPayload, _client) => {
        const color = colorForLevel(payload.level);
        const tag = `${COLORS.magenta}[${payload.tag}]${COLORS.reset}`;
        const level = `${color}[${payload.level.toUpperCase()}]${COLORS.reset}`;
        const msg = `${COLORS.green}[DEBUG]${COLORS.reset}${level}${tag} ${payload.message}`;

        if (payload.data !== undefined) {
          const json = typeof payload.data === 'string'
            ? payload.data
            : JSON.stringify(payload.data, null, 2);
          console.log(`${msg}\n${COLORS.dim}${json}${COLORS.reset}`);
        } else {
          console.log(msg);
        }
      });
    },
  };
}
