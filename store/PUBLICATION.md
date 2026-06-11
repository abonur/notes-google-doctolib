# Publier sur le Chrome Web Store — checklist complète

Ordre des opérations. Comptez ~1 h de travail + quelques jours de review Google.

## Étape 1 — Déployer le proxy (prérequis)

Suivez [worker/DEPLOIEMENT.md](../worker/DEPLOIEMENT.md), puis reportez l'URL
du Worker dans `background.js` (constante `PROXY_URL`). **Sans cette étape,
l'extension publiée ne fonctionnera pas** (elle affichera « ★ configurer »).

Vérification rapide : rechargez l'extension en local, videz le cache depuis le
popup, supprimez votre clé personnelle du popup, rechargez Doctolib → les
notes doivent s'afficher (elles passent alors par le proxy).

## Étape 2 — Héberger la politique de confidentialité

Le plus simple : un dépôt GitHub public avec GitHub Pages.

```bash
cd /Users/abonur/GoogleExtension
git init && git add . && git commit -m "Notes Google pour Doctolib"
# créez un dépôt sur github.com puis :
git remote add origin https://github.com/VOTRE-COMPTE/notes-google-doctolib.git
git push -u origin main
```

Puis sur GitHub : Settings → Pages → branche main, dossier `/store`.
L'URL sera : `https://VOTRE-COMPTE.github.io/notes-google-doctolib/privacy-policy.html`

(Alternative sans GitHub : n'importe quel hébergement statique.)

## Étape 3 — Captures d'écran

Voir la liste dans [FICHE-STORE.md](FICHE-STORE.md) (4 captures en 1280×800).

## Étape 4 — Construire le zip

```bash
./build.sh        # produit dist/notes-google-doctolib-X.Y.Z.zip
```

Le script vérifie automatiquement qu'aucune clé `AIza...` ne traîne dans le
code et que `PROXY_URL` est bien renseignée.

## Étape 5 — Compte développeur et soumission

1. [Console développeur Chrome Web Store](https://chrome.google.com/webstore/devconsole)
   — frais d'inscription : 5 $ (une seule fois)
2. « Nouvel élément » → uploadez le zip
3. Remplissez la fiche avec les textes de [FICHE-STORE.md](FICHE-STORE.md)
4. Onglet « Confidentialité » : usage unique + justifications des permissions
   (textes fournis dans FICHE-STORE.md) + URL de la politique de
   confidentialité (étape 2) + déclarer « ne collecte pas de données
   utilisateur »
5. Visibilité : commencez par **« Non répertorié »** pour tester l'installation
   réelle, passez en « Public » ensuite (changement sans nouvelle review)
6. Soumettre → review Google : généralement 1 à 3 jours

## Étape 6 — Après publication

- Surveillez la console Google Cloud les premières semaines (quota/budget)
- Pour publier une mise à jour : incrémentez `version` dans manifest.json,
  rebuild, re-upload — la review des mises à jour est rapide
- Gardez un œil sur les avis du store : c'est là que les casses de sélecteurs
  Doctolib se signaleront

## Risques à connaître

- **Marque** : « pour Doctolib » dans le nom est l'usage toléré (préposition),
  mais Doctolib peut demander un retrait — risque assumé, fréquent pour les
  extensions tierces, généralement précédé d'un simple e-mail.
- **Sélecteurs** : si Doctolib refond son site, les pastilles disparaissent
  jusqu'à mise à jour de `content.js`.
- **Coûts** : bornés par le plafond de quota Google (voir DEPLOIEMENT.md) —
  si l'extension devient populaire, augmentez le plafond ou ajoutez un
  message « quota atteint, mettez votre clé ».
