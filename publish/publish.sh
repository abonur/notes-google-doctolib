#!/bin/bash
# Upload + publie le dernier zip sur le Chrome Web Store via l'API officielle.
# Prérequis : publish/.env contenant CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN
# (obtenus une seule fois via get-refresh-token.mjs).
set -euo pipefail
cd "$(dirname "$0")/.."

EXTENSION_ID="jlkaeaclbjgpgiggddiikhdinhaaojcl"
ENV_FILE="publish/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE manquant. Lancez d'abord get-refresh-token.mjs." >&2
  exit 1
fi
set -a; . "$ENV_FILE"; set +a

VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
ZIP="dist/notes-google-doctolib-${VERSION}-chrome.zip"
[ -f "$ZIP" ] || ./build.sh

echo "→ Upload + publication de $ZIP (v$VERSION) sur l'extension $EXTENSION_ID"
npx --yes chrome-webstore-upload-cli@3 upload \
  --source "$ZIP" \
  --extension-id "$EXTENSION_ID" \
  --client-id "$CLIENT_ID" \
  --client-secret "$CLIENT_SECRET" \
  --refresh-token "$REFRESH_TOKEN"

npx --yes chrome-webstore-upload-cli@3 publish \
  --extension-id "$EXTENSION_ID" \
  --client-id "$CLIENT_ID" \
  --client-secret "$CLIENT_SECRET" \
  --refresh-token "$REFRESH_TOKEN"

echo "✅ Soumis pour examen."
