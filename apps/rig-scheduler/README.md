# Rig Scheduler Prototype

Standalone Vite app for testing undeveloped rig scheduling before integrating the feature into Slopcast.

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

The prototype is intentionally isolated from the main Slopcast app. Its scheduler engine lives in `src/engine/` behind local contracts so the later integration step only needs an adapter.
