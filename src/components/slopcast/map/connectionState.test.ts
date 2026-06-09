import { describe, it, expect } from 'vitest';
import { deriveConnectionState } from './connectionState';

const base = { mapReady: true, dataError: null, dataSource: 'live', fallbackActive: false };

describe('deriveConnectionState', () => {
  it('reports ok when map is ready, live source, no error or fallback', () => {
    expect(deriveConnectionState(base).level).toBe('ok');
  });

  it('reports map down (persistent) when Mapbox is not ready', () => {
    const s = deriveConnectionState({ ...base, mapReady: false });
    expect(s.level).toBe('down');
    expect(s.title).toMatch(/map/i);
    expect(s.dismissible).toBe(false);
  });

  it('reports data down with the error detail and a retry when the live fetch fails', () => {
    const s = deriveConnectionState({ ...base, dataError: 'HTTP 503 from spatial API' });
    expect(s.level).toBe('down');
    expect(s.detail).toBe('HTTP 503 from spatial API');
    expect(s.showRetry).toBe(true);
    expect(s.showUseMock).toBe(true);
  });

  it('does not offer "use mock" when already on mock', () => {
    const s = deriveConnectionState({ ...base, dataSource: 'mock', dataError: 'boom' });
    expect(s.showUseMock).toBe(false);
  });

  it('reports a dismissible degraded state when silently on fallback data', () => {
    const s = deriveConnectionState({ ...base, fallbackActive: true });
    expect(s.level).toBe('degraded');
    expect(s.dismissible).toBe(true);
  });

  it('prioritizes a map outage over a data error', () => {
    const s = deriveConnectionState({ ...base, mapReady: false, dataError: 'boom' });
    expect(s.title).toMatch(/map/i);
  });
});
