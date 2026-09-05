#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION="bookshare"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Maki Books services are already running in tmux session '$SESSION'."
else
  tmux new-session -d -s "$SESSION" -c "$ROOT_DIR/backend" "npm run develop"
  tmux split-window -h -t "$SESSION" -c "$ROOT_DIR/frontend" "npm run dev"
  tmux select-layout -t "$SESSION" even-horizontal >/dev/null
  echo "Started Strapi and Vite in tmux session '$SESSION'."
  echo "Use 'tmux attach -t $SESSION' to view their logs."
  sleep 3
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo
  echo "cloudflared n'est pas installé : les services locaux sont tout de même démarrés."
  echo "Pour des amis connectés au même réseau Wi-Fi :"
  echo "  http://${LAN_IP:-localhost}:5174"
  echo
  echo "Pour obtenir une URL publique, installe cloudflared puis relance ce script :"
  echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  exit 0
fi

echo "Starting a temporary public tunnel for the app. Keep this terminal open."
echo "The /api requests are proxied by Vite to Strapi on port 1337."
cloudflared tunnel --url http://localhost:5174
