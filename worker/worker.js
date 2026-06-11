// Proxy Cloudflare Worker — Notes Google pour Doctolib
//
// Garde la clé Google Places côté serveur (secret GOOGLE_KEY) et partage le
// cache entre tous les utilisateurs : un praticien donné n'est facturé qu'une
// fois par semaine, quel que soit le nombre d'utilisateurs.
//
// Endpoint : GET /rating?q=<nom + adresse du praticien>
// Réponse  : {found, rating, count, mapsUri, reviewsUri, placeName} ou {error}

const CACHE_TTL_SECONDS = 7 * 24 * 3600; // 7 jours (ToS Google : 30 jours max)
const MAX_QUERY_LENGTH = 200;

// Garde-fou best-effort par isolate (la vraie limite est le plafond de quota
// configuré côté Google Cloud, qui borne la facture quoi qu'il arrive).
const ipHits = new Map();
const IP_LIMIT_PER_MINUTE = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CORS });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/rating") {
      return json({ error: "not_found" }, 404);
    }

    const q = (url.searchParams.get("q") || "").trim().slice(0, MAX_QUERY_LENGTH);
    if (q.length < 3) return json({ error: "bad_query" }, 400);

    // Rate limit best-effort par IP
    const ip = request.headers.get("CF-Connecting-IP") || "?";
    const minute = Math.floor(Date.now() / 60000);
    const hitKey = ip + ":" + minute;
    const hits = (ipHits.get(hitKey) || 0) + 1;
    ipHits.set(hitKey, hits);
    if (ipHits.size > 10000) ipHits.clear();
    if (hits > IP_LIMIT_PER_MINUTE) return json({ error: "rate_limited" }, 429);

    // Cache partagé (KV)
    const cacheKey = "r:" + q.toLowerCase();
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, { headers: CORS });
    }

    // Appel Google Places API (New)
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_KEY,
        "X-Goog-FieldMask":
          "places.rating,places.userRatingCount,places.googleMapsUri,places.displayName,places.googleMapsLinks",
      },
      body: JSON.stringify({
        textQuery: q,
        languageCode: "fr",
        regionCode: "FR",
        pageSize: 1,
      }),
    });

    if (!res.ok) {
      // 429 = plafond de quota Google atteint : on le signale sans le cacher
      return json({ error: "api", status: res.status }, 502);
    }

    const data = await res.json();
    const place = data.places && data.places[0];
    const out = place
      ? {
          found: true,
          rating: place.rating ?? null,
          count: place.userRatingCount ?? 0,
          mapsUri: place.googleMapsUri || null,
          reviewsUri:
            (place.googleMapsLinks && place.googleMapsLinks.reviewsUri) || null,
          placeName: place.displayName ? place.displayName.text : null,
        }
      : { found: false };

    const body = JSON.stringify(out);
    await env.CACHE.put(cacheKey, body, { expirationTtl: CACHE_TTL_SECONDS });
    return new Response(body, { headers: CORS });
  },
};
