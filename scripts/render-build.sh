#!/usr/bin/env bash
set -euo pipefail

echo "[render-build] node: $(node -v)"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[render-build] pnpm not found; installing..."
  npm install -g pnpm
fi

echo "[render-build] pnpm: $(pnpm -v)"
echo "[render-build] installing workspace deps"
pnpm install --no-frozen-lockfile

echo "[render-build] applying drizzle schema push"
pnpm --filter @workspace/db push

echo "[render-build] building frontend"
NODE_ENV=production pnpm --filter @workspace/clinic-search build

echo "[render-build] building api server"
pnpm --filter @workspace/api-server build

echo "[render-build] complete"
