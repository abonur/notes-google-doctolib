# Notes Google pour Doctolib

Extension Chrome qui affiche la **note Google** (étoiles + nombre d'avis) de
chaque praticien directement dans les résultats de recherche **Doctolib**.
Un clic sur la pastille ouvre la page des **avis Google** du praticien.

- 🟢 **★ 4.8 (213)** — vert ≥ 4,5 · vert clair ≥ 4,0 · orange ≥ 3,5 · rouge < 3,5
- ⚪ **★ aucune note** — praticien introuvable sur Google Maps ou sans avis

## Architecture

```
content.js ──► background.js ──┬─► proxy Cloudflare (clé partagée, cache commun)
(badges)       (cache 7 j)     └─► Google Places API (si clé personnelle saisie)
```

Les notes proviennent de l'API officielle **Places API (New)**. Deux modes :

- **Service partagé** (par défaut) : l'extension appelle un proxy Cloudflare
  Worker qui détient la clé et mutualise le cache entre utilisateurs —
  voir [worker/](worker/).
- **Clé personnelle** : saisie dans le popup, appels directs à Google.

## Installation développeur

1. `chrome://extensions` → **Mode développeur** → **Charger l'extension non
   empaquetée** → ce dossier.
2. Pour le mode clé personnelle : créez une clé dans
   [Google Cloud Console](https://console.cloud.google.com/) (API « Places
   API (New) »), collez-la dans le popup de l'extension.

## Publication

Tout est prêt dans [store/PUBLICATION.md](store/PUBLICATION.md) :
déploiement du proxy ([worker/DEPLOIEMENT.md](worker/DEPLOIEMENT.md)),
politique de confidentialité à héberger, fiche du store, puis `./build.sh`
pour produire le zip à soumettre.

## Fichiers

| Fichier | Rôle |
|---|---|
| `manifest.json` | Déclaration de l'extension (Manifest V3) |
| `content.js` / `content.css` | Détection des cartes praticiens + injection des badges |
| `background.js` | Récupération des notes (proxy ou clé perso) + cache 7 jours |
| `popup.html` / `popup.js` | Réglages : clé API optionnelle, vidage du cache |
| `worker/` | Proxy Cloudflare Worker (clé serveur, cache partagé, rate limit) |
| `store/` | Politique de confidentialité, fiche store, guide de publication |
| `build.sh` | Construit le zip pour le Chrome Web Store (avec garde-fous) |

## Notes techniques durement acquises 🩹

- Les cartes Doctolib sont recouvertes d'un lien « étiré » (`::after`,
  z-index 10) qui gobe les clics → les badges sont à `z-index: 11`
  (au-dessus de l'overlay, sous la barre de filtres sticky qui est à 20).
- Doctolib route dès `mousedown` via des gestionnaires précoces → les
  événements des badges sont interceptés en **phase de capture au niveau
  document**.
- Chrome appelle Google en **IPv6** en priorité : une clé restreinte par IP
  doit inclure le préfixe IPv6 `/64` (le suffixe macOS tourne).
- `window.open` depuis un content script se fait bloquer → ouverture via
  `chrome.tabs.create` dans le service worker.
