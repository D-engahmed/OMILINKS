# `@workspace/backend`

The OMILINKS backend is a workspace package under `packages/backend`.

## Repository convention

OMILINKS uses:

- `apps/*` for user-facing applications such as the web dashboard and widget.
- `packages/*` for backend infrastructure, shared libraries, and reusable workspace code.

The backend is executable, but it remains a workspace package so the monorepo keeps one clear application/package boundary.

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
