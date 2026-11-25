#!/bin/bash
# Deploys one backend service: builds its Docker image on this PC, sends it to the server, loads it and restarts only that service.
#
# Run it from Git Bash, from anywhere:   bash scripts/deploy-backend.sh property-service
# Services: api-gateway, access-service, communication-service, payment-service, property-service, ai-service.
# It needs:
#   - Docker Desktop running on this PC (images are never built on the server);
#   - the SSH shortcut "huza-estate" to work from this PC;
#   - the backend (huza-estate-b) committed and pushed first, because the build uses the files in that folder.
# Afterwards UAT (uat.huzaestate.com) is brought up to date with live in the background.
set -u
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

HOST="${DEPLOY_HOST:-huza-estate}"
SVC="${1:-}"
case "$SVC" in
  api-gateway) DIR=huza-estate-b/api-gateway ;;
  access-service|communication-service|payment-service|property-service|ai-service) DIR="huza-estate-b/services/$SVC" ;;
  *) echo "Which service? api-gateway, access-service, communication-service, payment-service, property-service or ai-service"; exit 1 ;;
esac
IMAGE="huza-estate-b_$SVC"
OUT="${TMPDIR:-/tmp}/be-$SVC.tar.gz"

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

if ! docker info >/dev/null 2>&1; then echo "Docker is not running. Start Docker Desktop and run this again."; exit 1; fi

echo "Building $IMAGE..."
docker build -q -t "$IMAGE" "$DIR" | tail -2
if [ "${PIPESTATUS[0]}" -ne 0 ]; then echo "The build failed."; exit 1; fi
docker save "$IMAGE" | gzip > "$OUT" || { echo "Saving the image failed."; exit 1; }
echo "$SVC: image saved, $(stat -c %s "$OUT") bytes"

if ! upload "$OUT" "be-$SVC.tar.gz"; then echo "FAILED: the upload did not finish."; exit 1; fi

for j in 1 2 3 4 5 6; do
  ssh -o ConnectTimeout=20 "$HOST" "cd ~/huzaestate/huza-estate-b && gunzip -c ~/be-$SVC.tar.gz | docker load && docker-compose up -d --no-deps --no-build $SVC 2>&1 | tail -1 && rm ~/be-$SVC.tar.gz && echo LOADED-OK" && break
  echo "load retry"; sleep 8
done
for k in $(seq 1 18); do
  s=$(ssh -o ConnectTimeout=20 "$HOST" "docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' huza-estate-b_${SVC}_1" 2>/dev/null)
  echo "$SVC health: ${s:-no answer}"
  [ "$s" = healthy ] || [ "$s" = running ] && break
  sleep 10
done
rm -f "$OUT"
ssh -o ConnectTimeout=20 "$HOST" 'nohup /root/huzaestate/uat-sync.sh >/dev/null 2>&1 &' 2>/dev/null && echo "UAT update started"
echo DONE
