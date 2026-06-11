// Content script Doctolib : repère chaque carte praticien et y injecte la note Google.

(() => {
  const PROCESSED = "gnDone";

  // Interception en phase de CAPTURE au niveau du document : s'exécute avant
  // les gestionnaires de Doctolib (React route dès mousedown sur les cartes).
  // Un seul jeu de listeners pour tous les badges — survit aussi aux
  // re-rendus React qui clonent les nœuds sans leurs listeners.
  for (const evt of ["pointerdown", "mousedown", "mouseup", "touchstart", "click"]) {
    document.addEventListener(
      evt,
      (e) => {
        const badge =
          e.target && e.target.closest ? e.target.closest(".gn-badge") : null;
        if (!badge) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        if (evt !== "click") return;
        if (badge.dataset.gnAction === "options") {
          chrome.runtime.sendMessage({ type: "openOptions" });
        } else if (badge.dataset.gnUrl) {
          chrome.runtime.sendMessage({ type: "openUrl", url: badge.dataset.gnUrl });
        }
      },
      true
    );
  }

  function scan() {
    const container =
      document.querySelector('[data-test-id="hcp-results"]') || document.body;

    for (const h2 of container.querySelectorAll("h2")) {
      if (h2.dataset[PROCESSED]) continue;

      // Une carte praticien = un h2 dans un lien profil du type /dentiste/paris/slug
      const link = h2.closest("a");
      if (!link) continue;
      const segs = (link.pathname || "").split("/").filter(Boolean);
      if (segs.length !== 3) continue;

      h2.dataset[PROCESSED] = "1";
      processCard(h2, container);
    }
  }

  function processCard(h2, container) {
    const name = h2.textContent.trim();
    if (!name) return;

    const { street, postal, city } = extractAddress(h2, container);

    let query = name;
    if (street) query += ", " + street;
    if (postal && city) query += ", " + postal + " " + city;
    else {
      // repli : la ville est dans l'URL (/dentiste/paris)
      const urlCity = location.pathname.split("/").filter(Boolean)[1];
      if (urlCity) query += ", " + urlCity.replace(/-/g, " ");
    }

    const badge = makeBadge();
    h2.insertAdjacentElement("afterend", badge);

    chrome.runtime.sendMessage({ type: "getRating", query }, (resp) => {
      if (chrome.runtime.lastError || !resp) {
        badge.remove();
        return;
      }
      renderBadge(badge, resp, name);
    });
  }

  // Remonte le DOM jusqu'au bloc qui contient le code postal, puis parse l'adresse.
  function extractAddress(h2, container) {
    let node = h2;
    while (node && node !== container && node !== document.body) {
      const text = node.innerText || "";
      const m = text.match(/^(\d{5})\s+(.+)$/m);
      if (m) {
        const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
        const idx = lines.findIndex((l) => l.startsWith(m[1]));
        const prev = idx > 0 ? lines[idx - 1] : "";
        // La ligne précédente est la rue si elle contient un chiffre (n° de voie)
        const street = /\d/.test(prev) ? prev : "";
        return { street, postal: m[1], city: m[2] };
      }
      node = node.parentElement;
    }
    return { street: "", postal: "", city: "" };
  }

  function makeBadge() {
    const el = document.createElement("span");
    el.className = "gn-badge gn-loading";
    el.textContent = "★ …";
    el.title = "Recherche de la note Google…";
    return el;
  }

  function renderBadge(badge, resp, name) {
    badge.classList.remove("gn-loading");

    if (resp.error === "no_key") {
      badge.className = "gn-badge gn-setup";
      badge.textContent = "★ configurer";
      badge.title =
        "Cliquez pour configurer votre clé Google Places API (une seule fois).";
      badge.dataset.gnAction = "options";
      return;
    }

    if (resp.error) {
      badge.className = "gn-badge gn-error";
      badge.textContent = "★ erreur";
      badge.title =
        resp.error === "bad_key"
          ? "Clé API invalide ou Places API (New) non activée."
          : "Erreur lors de la requête Google Places.";
      return;
    }

    const mapsFallback =
      "https://www.google.com/maps/search/" + encodeURIComponent(name);
    // Lien direct vers l'onglet "Avis" quand disponible, sinon la fiche
    const mapsUrl = resp.reviewsUri || resp.mapsUri || mapsFallback;

    if (!resp.found || resp.rating == null) {
      badge.className = "gn-badge gn-none";
      badge.textContent = "★ aucune note";
      badge.title = resp.found
        ? "Trouvé sur Google Maps, mais sans note. Cliquez pour vérifier."
        : "Introuvable sur Google Maps. Cliquez pour chercher manuellement.";
    } else {
      badge.className = "gn-badge " + ratingClass(resp.rating);
      badge.textContent = `★ ${resp.rating.toFixed(1)} (${resp.count})`;
      badge.title =
        `${resp.placeName || name} — ${resp.rating.toFixed(1)}/5 sur ` +
        `${resp.count} avis Google. Cliquez pour lire les avis.`;
    }

    badge.dataset.gnUrl = mapsUrl;
  }

  function ratingClass(r) {
    if (r >= 4.5) return "gn-great";
    if (r >= 4.0) return "gn-good";
    if (r >= 3.5) return "gn-ok";
    return "gn-bad";
  }

  // Doctolib est une SPA : les résultats arrivent/changent dynamiquement.
  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(scan, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  scan();
})();
