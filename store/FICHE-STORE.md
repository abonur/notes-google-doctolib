# Fiche Chrome Web Store — textes prêts à coller

## Nom
Notes Google pour Doctolib

## Description courte (132 caractères max)
Affiche la note Google des praticiens directement dans les résultats Doctolib. Cliquez sur la pastille pour lire les avis.

## Description longue
Choisissez votre praticien en connaissance de cause.

Quand vous cherchez un médecin, dentiste ou spécialiste sur Doctolib, cette
extension affiche automatiquement sa note Google (étoiles et nombre d'avis)
sous forme de pastille colorée à côté de son nom, directement dans la liste
des résultats :

★ Pastille verte : 4,5/5 et plus
★ Vert clair : 4,0 à 4,4
★ Orange : 3,5 à 3,9
★ Rouge : moins de 3,5

Un clic sur la pastille ouvre directement la page des avis Google du
praticien dans un nouvel onglet — sans quitter votre recherche Doctolib.

FONCTIONNEMENT
• Notes fournies par l'API officielle Google Places (pas de scraping)
• Aucune configuration requise : installez et cherchez
• Cache intelligent pour des affichages instantanés
• Option avancée : utilisez votre propre clé Google Places API

CONFIDENTIALITÉ
L'extension n'envoie que le nom public et l'adresse du cabinet des praticiens
affichés (informations déjà publiques sur Doctolib). Aucune donnée personnelle
ou de santé vous concernant n'est collectée. Pas de compte, pas de traceurs,
pas de publicité.

LIMITES
La correspondance praticien ↔ fiche Google se fait par recherche
nom + adresse : dans de rares cas (cabinets de groupe, homonymes), la note
peut être celle du cabinet. Le clic sur la pastille permet de vérifier.

Extension indépendante, non affiliée à Doctolib SAS ni à Google LLC.

## Catégorie
Outils de recherche (ou « Shopping » / « Productivité » selon disponibilité)

## Langue
Français

## Captures d'écran à fournir (1280×800, 1 à 5)
1. Listing Doctolib avec plusieurs pastilles colorées visibles (vert/orange/rouge)
2. Zoom sur une carte praticien avec la pastille à côté du nom
3. La page d'avis Google ouverte après un clic
4. Le popup de réglages

Astuce : ouvrez une recherche Doctolib dense (ex. dentiste paris), réglez la
fenêtre à 1280×800 et capturez avec ⌘⇧4 puis la barre d'espace.

## Justifications des permissions (formulaire « Confidentialité »)
- `storage` : mémoriser le cache des notes et la clé API optionnelle de
  l'utilisateur.
- `host doctolib.fr` : injecter les pastilles de notes dans les pages de
  résultats de recherche.
- `host places.googleapis.com` : récupérer les notes via l'API officielle
  Google Places quand l'utilisateur fournit sa propre clé.
- `host doctolib-notes-google.abonur.workers.dev` : contacter notre unique
  service intermédiaire qui interroge l'API Google Places sans exposer de clé
  (domaine exact, pas de joker).
- Usage unique (single purpose) : afficher la note Google des praticiens
  dans les résultats de recherche Doctolib.

## URL de la politique de confidentialité
https://abonur.github.io/notes-google-doctolib/privacy-policy.html (en ligne ✓)

## Captures d'écran
Prêtes dans `store/captures/` (4 × 1280×800) :
capture-1-listing, capture-2-zoom, capture-3-avis, capture-4-popup
