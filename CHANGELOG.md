# Journal des versions

## v0.2.0 — 2026-11-14

Phase 2 du plan : le moteur complet.

- **Échelles interactives** rendues depuis des fichiers YAML : critères (CAM), somme de points (mini-GDS, GDS-15, MNA-SF) et grille AGGIR avec calcul du GIR selon l'algorithme officiel (annexe 2 du décret 2008-821, règles de synthèse des sous-variables du guide CNAMTS 2008 ; tests automatisés `npm test`).
- **7 calculateurs** : Cockcroft-Gault, CKD-EPI 2021, IMC et perte de poids (critères HAS 2021), débit de perfusion et d'hypodermoclyse, calcul de dose, QTc (Bazett, Fridericia), calcémie corrigée.
- **Favoris** (étoile sur chaque fiche) et **taille de texte** réglable (bouton Aa), mémorisés sur l'appareil.
- **Détection de mise à jour** : bandeau sur l'accueil quand une nouvelle release existe sur GitHub (seul appel réseau de l'app, silencieux hors ligne).
- Dépôt public et version web sur GitHub Pages.

## v0.1.0 — 2026-11-14

Première version installable (phase 1 du plan) : squelette de l'application, recherche, chapitres, 2 fiches de démonstration (Confusion aiguë, CAM), construction automatique de l'APK sur GitHub.
