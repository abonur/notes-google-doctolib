const keyInput = document.getElementById("key");
const status = document.getElementById("status");
const cacheInfo = document.getElementById("cacheInfo");

async function refresh() {
  const all = await chrome.storage.local.get(null);
  if (all.apiKey) {
    keyInput.value = all.apiKey;
    status.textContent = "✓ Clé personnelle utilisée (appels directs à Google)";
    status.className = "ok";
  } else {
    status.textContent = "Service partagé utilisé — aucune clé requise.";
    status.className = "ok";
  }
  const cacheCount = Object.keys(all).filter((k) => k.startsWith("cache:")).length;
  cacheInfo.textContent = `Cache : ${cacheCount} praticien(s)`;
}

document.getElementById("save").addEventListener("click", async () => {
  const apiKey = keyInput.value.trim();
  if (!apiKey) {
    await chrome.storage.local.remove("apiKey");
  } else {
    await chrome.storage.local.set({ apiKey });
  }
  status.textContent = apiKey
    ? "✓ Clé enregistrée — rechargez la page Doctolib."
    : "Clé supprimée — retour au service partagé.";
  status.className = "ok";
  refresh();
});

document.getElementById("clearCache").addEventListener("click", async () => {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((k) => k.startsWith("cache:"));
  await chrome.storage.local.remove(keys);
  refresh();
});

refresh();
