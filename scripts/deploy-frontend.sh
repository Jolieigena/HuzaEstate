#!/bin/bash
# Deploys the website: builds the Docker image on this PC, sends it to the server, loads it and restarts the site.
#
# Run it from Git Bash, from anywhere:   bash scripts/deploy-frontend.sh
# It needs:
#   - Docker Desktop running on this PC (the image is built here, not on the server);
#   - the SSH shortcut "huza-estate" to work from this PC;
#   - your changes committed and pushed first, because the build uses the files in this folder.
#
# The upload carries on from the last byte the server already has after a dropped connection (scp starts again from zero), and the
# finished file is checked against its checksum before it is loaded. A resume check without a deploy:
#   bash scripts/deploy-frontend.sh --test-upload
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

HOST="${DEPLOY_HOST:-huza-estate}"
API="${DEPLOY_API_URL:-https://api.dev.huzaestate.com/api}"
# The public client id of "Sign in with Google" (not a secret); it is built into the site.
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-370870704550-qanb1s793dkd0t5aa4nbmvvdn6i0lkul.apps.googleusercontent.com}"
OUT="${TMPDIR:-/tmp}/huzaestate-frontend.tar.gz"

# upload LOCAL_FILE REMOTE_NAME: succeeds when the server holds an identical copy in its home folder.
upload() {
  local file="$1" remote_name="$2" size have attempt sum_local sum_remote
  size=$(stat -c %s "$file")
  sum_local=$(sha256sum "$file" | cut -d' ' -f1)
  for attempt in $(seq 1 60); do
    have=$(ssh -o ConnectTimeout=20 "$HOST" "stat -c %s ~/$remote_name 2>/dev/null || echo 0" 2>/dev/null)
    if [ -z "$have" ]; then echo "no answer from the server, waiting"; sleep 6; continue; fi
    if [ "$have" -gt "$size" ]; then ssh -o ConnectTimeout=20 "$HOST" "rm -f ~/$remote_name" 2>/dev/null; have=0; fi
    if [ "$have" = "$size" ]; then
      sum_remote=$(ssh -o ConnectTimeout=20 "$HOST" "sha256sum ~/$remote_name | cut -d' ' -f1" 2>/dev/null)
      if [ "$sum_remote" = "$sum_local" ]; then return 0; fi
      if [ -n "$sum_remote" ]; then echo "checksum differs, sending again from the start"; ssh -o ConnectTimeout=20 "$HOST" "rm -f ~/$remote_name" 2>/dev/null; continue; fi
      sleep 6; continue
    fi
    echo "sending from byte $have of $size"
    tail -c +$((have + 1)) "$file" | ssh -o ConnectTimeout=20 -o ServerAliveInterval=5 -o ServerAliveCountMax=3 "$HOST" "cat >> ~/$remote_name" 2>/dev/null
    sleep 3
  done
  return 1
}

if [ "${1:-}" = "--test-upload" ]; then
  T="${TMPDIR:-/tmp}/resume-test.bin"
  head -c 12000000 /dev/urandom > "$T"
  for k in 1 2 3 4 5; do ssh -o ConnectTimeout=20 "$HOST" "rm -f ~/resume-test.bin" 2>/dev/null && break; sleep 5; done
  for k in 1 2 3 4 5; do head -c 5000000 "$T" | ssh -o ConnectTimeout=20 "$HOST" "cat >> ~/resume-test.bin" 2>/dev/null && break; sleep 5; done
  echo "server has: $(ssh -o ConnectTimeout=20 "$HOST" 'stat -c %s ~/resume-test.bin' 2>/dev/null)"
  upload "$T" resume-test.bin && echo "UPLOAD OK" || echo "UPLOAD FAILED"
  ssh -o ConnectTimeout=20 "$HOST" "rm -f ~/resume-test.bin" 2>/dev/null
  rm -f "$T"
  exit 0
fi

if ! docker info >/dev/null 2>&1; then echo "Docker is not running. Start Docker Desktop and run this again."; exit 1; fi

echo "Building the image..."
docker build -q -t huzaestate-frontend \
  --build-arg NEXT_PUBLIC_API_URL="$API/access-service" \
  --build-arg NEXT_PUBLIC_PROPERTY_API_URL="$API/property-service" \
  --build-arg NEXT_PUBLIC_PAYMENT_API_URL="$API/payment-service" \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" . | tail -2
if [ "${PIPESTATUS[0]}" -ne 0 ]; then echo "The build failed."; exit 1; fi
docker save huzaestate-frontend | gzip > "$OUT" || { echo "Saving the image failed."; exit 1; }
echo "local size $(stat -c %s "$OUT")"

if ! upload "$OUT" fe.tar.gz; then echo "FAILED: the upload did not finish."; exit 1; fi

for j in 1 2 3 4 5 6; do
  ssh -o ConnectTimeout=20 "$HOST" 'cd ~/huzaestate/huzaestate-fe && gunzip -c ~/fe.tar.gz | docker load >/dev/null && docker-compose up -d --no-deps --no-build frontend 2>&1 | tail -1 && rm ~/fe.tar.gz; sleep 8; docker images huzaestate-frontend --format "{{.ID}} {{.CreatedAt}}"; curl -s -o /dev/null -w "shop %{http_code}\n" localhost:8085/shop' && break
  echo "load retry"; sleep 8
done
rm -f "$OUT"
echo DONE
