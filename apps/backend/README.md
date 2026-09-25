# OMILINKS Backend

The backend is a deployable application in the Turborepo workspace.

## Why `apps/backend`

This is intentionally an application package, not a shared library. Turborepo treats deployable applications as the end of the package graph, while reusable code belongs in `packages/*`.

## Current scope

The first iteration is intentionally small:

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
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend start
pnpm --filter backend typecheck
pnpm --filter backend lint
pnpm --filter backend test
```

The default port is `4000`. Set `PORT` to override it.
