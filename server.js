import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8000;
const PYTHON_API_PORT = process.env.PYTHON_API_PORT || 8001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));

// Proxy all /api/* requests to Python FastAPI backend
app.use('/api', (req, res) => {
  const targetUrl = `http://127.0.0.1:${PYTHON_API_PORT}/api${req.url}`;
  import('http').then(http => {
    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${PYTHON_API_PORT}` },
    }, proxyRes => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      res.status(502).json({ error: 'Python backend unavailable' });
    });
    req.pipe(proxyReq);
  });
});

// SPA fallback for client-side routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});
