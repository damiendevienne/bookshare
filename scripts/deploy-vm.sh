#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/srv/bookmybook"
BRANCH="feature/book-catalog-api"

cd "$APP_DIR"
echo "==> Updating source code"
git pull --ff-only origin "$BRANCH"

echo "==> Building backend"
cd "$APP_DIR/backend"
npm ci
npm run build

echo "==> Building frontend"
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "==> Checking and reloading Nginx"
sudo nginx -t
sudo systemctl reload nginx

echo "==> Restarting Strapi"
sudo systemctl restart bookmybook-backend
sudo systemctl is-active --quiet bookmybook-backend

echo "Deployment complete."
