// Obtient un refresh_token Chrome Web Store (one-time).
// Usage : CLIENT_ID=... CLIENT_SECRET=... node publish/get-refresh-token.mjs
// Ouvre le navigateur, vous cliquez « Autoriser », le token s'affiche et
// s'écrit dans publish/.env (ignoré par git).

import http from "node:http";
import { exec } from "node:child_process";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENV = join(HERE, ".env");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Manque CLIENT_ID et/ou CLIENT_SECRET dans l'environnement.");
  process.exit(1);
}

const PORT = 8976;
const REDIRECT = `http://127.0.0.1:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/chromewebstore";

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, REDIRECT);
  const code = u.searchParams.get("code");
  if (!code) {
    res.end("En attente du code d'autorisation…");
    return;
  }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT,
      }),
    });
    const tok = await tokenRes.json();
    if (!tok.refresh_token) {
      res.end("Pas de refresh_token reçu : " + JSON.stringify(tok));
      console.error("Échec :", tok);
      server.close();
      return;
    }
    // écrit/merge le .env
    let env = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
    const set = (k, v) => {
      env = env.replace(new RegExp(`^${k}=.*$`, "m"), "").trim();
      env += `\n${k}=${v}`;
    };
    set("CLIENT_ID", CLIENT_ID);
    set("CLIENT_SECRET", CLIENT_SECRET);
    set("REFRESH_TOKEN", tok.refresh_token);
    writeFileSync(ENV, env.trim() + "\n");
    res.end("✅ Refresh token obtenu et enregistré dans publish/.env. Vous pouvez fermer cet onglet.");
    console.log("\n✅ refresh_token enregistré dans publish/.env\n");
    server.close();
  } catch (e) {
    res.end("Erreur : " + e.message);
    console.error(e);
    server.close();
  }
});

server.listen(PORT, () => {
  console.log("Ouverture du navigateur pour autorisation…");
  console.log("Si rien ne s'ouvre, visitez :\n" + authUrl + "\n");
  exec(`open "${authUrl}"`);
});
