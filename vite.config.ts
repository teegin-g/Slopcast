import { defineConfig } from 'vite';
import debugLoggerPlugin from './vite-plugin-debug-logger';
import { sharedPlugins, sharedResolve } from './vite.base';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts', 'd3'],
          },
        },
      },
    },
    plugins: [...sharedPlugins, debugLoggerPlugin()],
    resolve: sharedResolve,
  };
});
