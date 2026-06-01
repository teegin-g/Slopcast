<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12YB-fbdVhBUTK7AIo6AYspbot-rowbB7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend and Databricks Validation

The backend is a local FastAPI spatial service that uses `databricks-sql-connector`
when Databricks SQL Warehouse credentials are configured, and deterministic mock
spatial data otherwise.

- Local backend gate, excluding live services:
  `bash scripts/validate-backend.sh`
- Equivalent direct pytest command:
  `python -m pytest backend/tests -m "not integration"`
- Live Databricks integration gate, only after selecting/approving a
  non-production token/profile:
  `ALLOW_LIVE_DATABRICKS_TESTS=1 bash scripts/validate-backend.sh --live-databricks`

Live Databricks tests require `DATABRICKS_SERVER_HOSTNAME`/`DATABRICKS_HOST`,
`DATABRICKS_HTTP_PATH`/`DATABRICKS_WAREHOUSE_ID`, and `DATABRICKS_TOKEN` or
`DATABRICKS_ACCESS_TOKEN`. If those are not configured, the live gate is skipped
by design.

## Launch and deploy (no cloud-specific tooling)

Use the provided shell script to build and run the app locally without any
Google Cloud deployment tooling:

- Production build and run:
  `bash deploy.sh`
- Development server:
  `bash deploy.sh --dev`
- Build only:
  `bash deploy.sh --build-only`
