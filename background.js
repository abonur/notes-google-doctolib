// Service worker : interroge Google Places API (New) et met les résultats en cache.

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.rating,places.userRatingCount,places.googleMapsUri,places.displayName,places.googleMapsLinks";

// Version du format de cache : à incrémenter quand on ajoute des champs,
// pour forcer le rafraîchissement des entrées anciennes.
const CACHE_VERSION = 2;

// URL du proxy Cloudflare Worker (voir worker/DEPLOIEMENT.md).
// Le proxy détient la clé Google et partage son cache entre tous les
// utilisateurs. Si l'utilisateur renseigne sa propre clé dans le popup,
// elle est utilisée en direct à la place du proxy.
const PROXY_URL = "https://doctolib-notes-google.abonur.workers.dev";

// Déduplication des requêtes en cours (plusieurs cartes peuvent demander la même chose)
const inFlight = new Map();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "getRating") {
    handleGetRating(msg.query).then(sendResponse);
    return true; // réponse asynchrone
  }
  if (msg.type === "openOptions") {
    chrome.runtime.openOptionsPage();
  }
  if (msg.type === "openUrl" && typeof msg.url === "string" && /^https:\/\/(www\.google\.(com|fr)|maps\.google\.com)\//.test(msg.url)) {
    chrome.tabs.create({
      url: msg.url,
      index: sender.tab ? sender.tab.index + 1 : undefined,
    });
  }
});

async function handleGetRating(query) {
  const cacheKey = "cache:" + query.toLowerCase().trim();

  const cached = (await chrome.storage.local.get(cacheKey))[cacheKey];
  if (cached && cached.v === CACHE_VERSION && Date.now() - cached.t < CACHE_TTL_MS) {
    return cached.data;
  }

  const { apiKey } = await chrome.storage.local.get("apiKey");
  const proxyConfigured = !PROXY_URL.includes("REMPLACEZ-MOI");
  if (!apiKey && !proxyConfigured) return { error: "no_key" };

  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const fetcher = apiKey
    ? fetchRating(query, apiKey)
    : fetchViaProxy(query);
  const promise = fetcher
    .then(async (data) => {
      // On ne met en cache que les réponses exploitables (trouvé ou non trouvé),
      // pas les erreurs réseau/API.
      if (!data.error) {
        await chrome.storage.local.set({
          [cacheKey]: { t: Date.now(), v: CACHE_VERSION, data },
        });
      }
      return data;
    })
    .finally(() => inFlight.delete(cacheKey));

  inFlight.set(cacheKey, promise);
  return promise;
}

// Via le proxy partagé : même format de réponse que fetchRating.
async function fetchViaProxy(query) {
  try {
    const res = await fetch(
      PROXY_URL.replace(/\/+$/, "") + "/rating?q=" + encodeURIComponent(query)
    );
    if (!res.ok) return { error: "api", status: res.status };
    return await res.json();
  } catch (e) {
    return { error: "network" };
  }
}

async function fetchRating(query, apiKey) {
  try {
    const res = await fetch(PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "fr",
        regionCode: "FR",
        pageSize: 1,
      }),
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 400) {
        return { error: "bad_key", status: res.status };
      }
      return { error: "api", status: res.status };
    }

    const json = await res.json();
    const place = json.places && json.places[0];
    if (!place) return { found: false };

    return {
      found: true,
      rating: place.rating ?? null,
      count: place.userRatingCount ?? 0,
      mapsUri: place.googleMapsUri || null,
      reviewsUri:
        (place.googleMapsLinks && place.googleMapsLinks.reviewsUri) || null,
      placeName: place.displayName ? place.displayName.text : null,
    };
  } catch (e) {
    return { error: "network" };
  }
}
