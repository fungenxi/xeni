# Xeni architecture

## Current shape

Xeni is a local-first PWA. The existing React application is shipped as the compiled legacy bundle at `assets/index-cent-precision.js`. User finance data is **not stored in that file**. It lives in the browser's IndexedDB database (`finance-tracker-uat` for normal use).

The app shell is `index.html`, with `service-worker.js` handling offline caching and app updates.

## Rule for new work

Do **not** create another copied `assets/index-*.js` bundle for each feature.

New isolated improvements should live under `src/` and be loaded as small ES modules:

- `src/data/` — safe access to the existing local database
- `src/features/` — one feature per file
- `src/app-enhancements.js` — lightweight feature bootstrap
- `assets/xeni-enhancements.css` — styles for these modules

This lets us improve Xeni without repeatedly cloning the entire compiled application.

## Data safety contract

Changes must preserve these assumptions unless a deliberate migration is designed and tested:

1. Keep the normal database name `finance-tracker-uat` stable.
2. Never clear or delete IndexedDB during an app update.
3. Treat schema/data migrations as additive and backward-safe.
4. Keep JSON export/import working before risky migrations.
5. App cache versions and user data versions are separate concepts. Updating the service worker cache must not touch user finance data.

## Current modular improvements

- In-app PWA update checks
- Backup age/status in Settings
- Learned merchant/category rules visibility and removal
- Transaction search and filters inside transaction sheets
- Advisor insight-to-action shortcut

## Next refactor

The long-term cleanup is to recover the original React source into a normal `src/` component structure and generate one production bundle from it. Until that source is recovered, prefer small modules over editing or copying the minified legacy bundle.
