#!/bin/bash
# Construit les paquets Chrome et Firefox dans dist/ depuis une base commune.
# (Safari : voir safari/ et le script safari/build-safari.sh)
set -euo pipefail
cd "$(dirname "$0")"

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")

# Garde-fous avant publication
if grep -rE 'AIza[0-9A-Za-z_-]{30,}' manifest.json background.js content.js popup.js popup.html 2>/dev/null; then
  echo "❌ ABANDON : une clé API (AIza...) est présente dans le code." >&2
  exit 1
fi
if grep -q 'PROXY_URL = "https://REMPLACEZ-MOI' background.js; then
  echo "❌ ABANDON : PROXY_URL n'est pas renseignée dans background.js" >&2
  exit 1
fi
if grep -q 'VOTRE_PSEUDO' popup.html; then
  echo "❌ ABANDON : lien Buy Me a Coffee non renseigné (VOTRE_PSEUDO)." >&2
  exit 1
fi

mkdir -p dist
SHARED=(background.js content.js content.css popup.html popup.js icons)

# ---- Chrome (Manifest V3, service_worker) ----
CHROME="dist/notes-google-doctolib-${VERSION}-chrome.zip"
rm -f "$CHROME"
zip -rq "$CHROME" manifest.json "${SHARED[@]}" -x '.*'
echo "✅ $CHROME"

# ---- Firefox (gecko id + background.scripts) ----
FFDIR=$(mktemp -d)
cp -R manifest.json "${SHARED[@]}" "$FFDIR/"
python3 - "$FFDIR/manifest.json" <<'PY'
import json, sys
p = sys.argv[1]
m = json.load(open(p))
m["browser_specific_settings"] = {
    "gecko": {
        "id": "notes-google-doctolib@ruwad.io",
        "strict_min_version": "115.0",
        # Aucune donnée utilisateur collectée (seules des infos publiques de
        # praticiens transitent vers le proxy) → "none".
        "data_collection_permissions": {"required": ["none"]},
    }
}
# Firefox MV3 : background en event page (scripts), pas service_worker
m["background"] = {"scripts": ["background.js"]}
json.dump(m, open(p, "w"), indent=2, ensure_ascii=False)
PY
FIREFOX="dist/notes-google-doctolib-${VERSION}-firefox.zip"
rm -f "$FIREFOX"
(cd "$FFDIR" && zip -rq "$OLDPWD/$FIREFOX" . -x '.*')
rm -rf "$FFDIR"
echo "✅ $FIREFOX"

echo "Chrome  : $CHROME"
echo "Firefox : $FIREFOX"