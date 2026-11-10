# CubeDojo (PWA)

Apprendre le Rubik's Cube : guides, algorithmes (PLL + OLL 2-look), entraînements, chrono. 100 % statique, hors ligne.

- Lancer : `python3 -m http.server 8080` puis http://localhost:8080 (un service worker exige http(s) ou localhost)
- Tests : `node tests/verify.mjs` (simulateur 3x3 + vérification de chaque algorithme)
- Déploiement : copier le dossier tel quel sur n'importe quel hébergement statique (HTTPS requis pour l'installation)
