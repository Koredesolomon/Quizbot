#!/usr/bin/env bash
# Prepares the VPS for local AI marking: swap, Ollama (localhost only, one request at a time) and the model.
# Run on the server:  sudo bash backend/scripts/setup-ollama-vps.sh [model]
set -euo pipefail

MODEL="${1:-qwen3:4b}"
SWAP_FILE=/swapfile

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

echo "==> Swap (4 GB, stops a memory spike killing the app)"
if swapon --show | grep -q "$SWAP_FILE"; then
  echo "Swap already active."
else
  [ -f "$SWAP_FILE" ] || fallocate -l 4G "$SWAP_FILE"
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" >/dev/null
  swapon "$SWAP_FILE"
  grep -q "^$SWAP_FILE " /etc/fstab || echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
fi

echo "==> Ollama"
command -v ollama >/dev/null || curl -fsSL https://ollama.com/install.sh | sh

# Localhost only and one request at a time, so grading cannot starve the website of CPU.
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/tlchub.conf <<'CONF'
[Service]
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
Environment="OLLAMA_KEEP_ALIVE=30m"
CONF
systemctl daemon-reload
systemctl enable --now ollama
systemctl restart ollama

echo "==> Model $MODEL"
for _ in $(seq 1 30); do curl -fs http://127.0.0.1:11434/api/tags >/dev/null && break; sleep 1; done
ollama pull "$MODEL"

echo "==> Smoke test"
ollama run "$MODEL" "What is 12 x 13? Answer with the number only." --think=false || true

echo
echo "Done. Port 11434 must stay closed in the firewall. Next, add to backend/.env:"
echo "  AI_PROVIDER=ollama"
echo "  OLLAMA_MODEL=$MODEL"
echo "then restart the API:  pm2 restart tlchub-api --update-env"
