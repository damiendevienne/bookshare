#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/srv/bookmybook"
BRANCH="dev"

cd "$APP_DIR"
echo "==> Updating source code"
BEFORE_COMMIT="$(git rev-parse HEAD)"
git pull --ff-only origin "$BRANCH"
AFTER_COMMIT="$(git rev-parse HEAD)"
CHANGED_FILES="$(git diff --name-only "$BEFORE_COMMIT" "$AFTER_COMMIT")"

BACKEND_CHANGED=false
FRONTEND_CHANGED=false
if printf '%s\n' "$CHANGED_FILES" | grep -q '^backend/'; then BACKEND_CHANGED=true; fi
if printf '%s\n' "$CHANGED_FILES" | grep -q '^frontend/'; then FRONTEND_CHANGED=true; fi

if [ "$BACKEND_CHANGED" = true ]; then
  echo "==> Updating backend"
  cd "$APP_DIR/backend"
  if printf '%s\n' "$CHANGED_FILES" | grep -Eq '^backend/package(-lock)?\.json$'; then npm ci; fi
  npm run build
fi

if [ "$FRONTEND_CHANGED" = true ]; then
  echo "==> Updating frontend"
  cd "$APP_DIR/frontend"
  if printf '%s\n' "$CHANGED_FILES" | grep -Eq '^frontend/package(-lock)?\.json$'; then npm ci; fi
  npm run build
fi

echo "==> Checking and reloading Nginx"
sudo nginx -t
sudo systemctl reload nginx

if [ "$BACKEND_CHANGED" = true ]; then
  echo "==> Restarting Strapi"
  sudo systemctl restart bookmybook-backend
  sudo systemctl is-active --quiet bookmybook-backend
fi

echo "Deployment complete."
