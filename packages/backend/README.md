# `@workspace/backend`

The OMILINKS backend is a workspace package under `packages/backend`.

## Why `packages/backend`

OMILINKS uses `apps/*` for user-facing applications such as the web dashboard and widget. Backend infrastructure and reusable application code belong under `packages/*`, so the backend lives here as a workspace package.

This package can still be built and run independently; its location in the monorepo is about workspace organization, not whether it is executable.

## Current scope

The first backend slice is intentionally small:

- Node.js HTTP server
- TypeScript
- `GET /health`
- `GET /api/v1`
- JSON error envelope
- Node's built-in test runner

There is no Convex dependency and no database dependency yet.

## Commands

From the repository root:

```bash
pnpm --filter @workspace/backend dev
pnpm --filter @workspace/backend build
pnpm --filter @workspace/backend start
pnpm --filter @workspace/backend typecheck
pnpm --filter @workspace/backend lint
pnpm --filter @workspace/backend test
```

The default port is `4000`. Set `PORT` to override it.
