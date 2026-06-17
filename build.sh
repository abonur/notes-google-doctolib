#!/bin/bash
# Construit le zip prêt pour le Chrome Web Store dans dist/
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="dist/notes-google-doctolib-${VERSION}.zip"

# Garde-fous avant publication
if grep -rE 'AIza[0-9A-Za-z_-]{30,}' manifest.json background.js content.js popup.js popup.html 2>/dev/null; then
  echo "❌ ABANDON : une clé API (AIza...) est présente dans le code." >&2
  exit 1
fi
if grep -q 'PROXY_URL = "https://REMPLACEZ-MOI' background.js; then
  echo "❌ ABANDON : PROXY_URL n'est pas renseignée dans background.js" >&2
  echo "   (déployez le worker puis collez son URL — voir worker/DEPLOIEMENT.md)" >&2
  exit 1
fi
if grep -q 'VOTRE_PSEUDO' popup.html; then
  echo "❌ ABANDON : le lien Buy Me a Coffee contient encore VOTRE_PSEUDO dans popup.html" >&2
  exit 1
fi

mkdir -p dist
rm -f "$OUT"
zip -r "$OUT" \
  manifest.json background.js content.js content.css \
  popup.html popup.js icons \
  -x '.*'

echo "✅ $OUT"
unzip -l "$OUT"
