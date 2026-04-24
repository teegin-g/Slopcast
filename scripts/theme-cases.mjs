import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export async function loadUiThemeCases() {
  const metadata = await loadThemeSnapshotMetadata();
  return metadata.themes;
}

export async function loadThemeSnapshotMetadata() {
  const { createServer } = await import('vite');
  const server = await createServer({
    root,
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });

  try {
    const registry = await server.ssrLoadModule('/src/theme/registry.ts');
    return {
      themes: registry.getUiThemeCases(),
      fxThemeIds: registry.getFxThemeIds(),
    };
  } finally {
    await server.close();
  }
}
