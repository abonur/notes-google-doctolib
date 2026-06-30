#!/bin/bash
# Régénère le projet Xcode Safari depuis la base commune (manifeste Chrome).
# Sortie : safari/ (projet Xcode) — généré, ignoré par git.
# Prérequis : Xcode installé (xcrun safari-web-extension-converter).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf safari safari-src
mkdir -p safari-src
cp -R manifest.json background.js content.js content.css popup.html popup.js icons safari-src/
mkdir -p safari

xcrun safari-web-extension-converter "$PWD/safari-src" \
  --project-location safari \
  --app-name "Notes Google pour Doctolib" \
  --bundle-identifier io.ruwad.NotesGoogleDoctolib \
  --no-open --no-prompt --force

# L'App Store exige LSApplicationCategoryType sur l'app macOS (le convertisseur
# ne le met pas). On l'injecte uniquement sur la cible app (bundle id exact,
# sans .Extension) en Debug et Release.
PBX="safari/Notes Google pour Doctolib/Notes Google pour Doctolib.xcodeproj/project.pbxproj"
if [ -f "$PBX" ]; then
  sed -i '' 's#\(PRODUCT_BUNDLE_IDENTIFIER = io\.ruwad\.NotesGoogleDoctolib;\)#\1\
				INFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.utilities";\
				INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO;#g' "$PBX"
  echo "✅ LSApplicationCategoryType=utilities + ITSAppUsesNonExemptEncryption=NO ajoutés (cible app macOS)"
fi

echo
echo "✅ Projet Xcode : safari/Notes Google pour Doctolib/Notes Google pour Doctolib.xcodeproj"
echo "   Ouvrir dans Xcode, choisir l'équipe de signature (RUWAD), puis Archive → App Store Connect."
