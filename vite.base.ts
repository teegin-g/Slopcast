import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

// Shared plugins used by both vite.config.ts and vitest.config.ts.
// Each config may add its own plugins on top of these.
export const sharedPlugins: Plugin[] = [tailwindcss() as Plugin, react()];

// The @/ alias was removed (R5-15): only ~5 imports used it, all in one file.
// All source imports now use relative paths. This object is kept as a named
// export so both configs can spread it — add entries here if the alias is
// ever re-introduced.
export const sharedResolve = {
  alias: {} as Record<string, string>,
};
