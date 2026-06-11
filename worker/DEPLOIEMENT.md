# Déployer le proxy Cloudflare Worker

Une seule fois, ~15 minutes. Prérequis : Node.js installé.

## 1. Compte Cloudflare (gratuit, sans CB)

Créez un compte sur [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).

## 2. Déploiement

```bash
cd worker
npx wrangler login                      # ouvre le navigateur pour autoriser
npx wrangler kv namespace create CACHE  # copie l'id affiché dans wrangler.toml
# → éditez wrangler.toml : remplacez REMPLACEZ_PAR_L_ID_KV par l'id obtenu
npx wrangler secret put GOOGLE_KEY      # collez votre clé Places API
npx wrangler deploy                     # affiche l'URL du worker
```

Notez l'URL obtenue, du type `https://doctolib-notes-google.<compte>.workers.dev`,
et reportez-la dans `background.js` (constante `PROXY_URL`) à la racine du projet.

## 3. Côté Google Cloud — IMPORTANT (votre CB est derrière)

Dans [Google Cloud Console](https://console.cloud.google.com/) :

1. **Restrictions de la clé** (API et services → Identifiants) :
   - **Supprimez la restriction par IP** (le Worker appelle depuis le cloud
     Cloudflare, IPs variables) ;
   - à la place, restreignez la clé à la seule API « Places API (New) ».
     La clé n'étant plus que sur le serveur, elle n'est jamais exposée.
   - Conseil : utilisez une clé DIFFÉRENTE de celle de votre usage perso.
2. **Plafond de quota** (API et services → Places API (New) → Quotas) :
   limitez « Text Search requests per day » à ~300/jour. C'est le vrai
   garde-fou : la facture ne peut physiquement pas s'envoler.
3. **Alerte budget** (Facturation → Budgets et alertes) : 5 €/mois.

## 4. Vérification

```bash
curl "https://VOTRE-WORKER.workers.dev/rating?q=Dr%20Nicolas%20Bourrasset%2075015%20Paris"
# → {"found":true,"rating":4.8,...}
```

Le second appel identique doit répondre instantanément (cache KV).

## Coûts en régime de croisière

- Cloudflare Workers : gratuit jusqu'à 100 000 requêtes/jour.
- Google : ~5 000 recherches de praticiens *uniques*/mois dans le quota
  gratuit ; le cache partagé fait que chaque praticien ne compte qu'une fois
  par semaine, tous utilisateurs confondus. Au-delà : ~0,035 $/recherche,
  borné par le plafond de quota du point 3.
