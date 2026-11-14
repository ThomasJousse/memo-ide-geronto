# Journal des versions

## v1.0.0 — 2026-11-14

Première version complète (phases 3 à 11 du plan).

- **265 fiches** 100 % gérontologie : situations aiguës (34), syndromes gériatriques (26), troubles neurocognitifs (18), évaluation (13), pharmacologie du sujet âgé (21), médicaments de A à Z (91), soins et gestes (18), biologie (12), parcours et filière (18), relation et éthique (9), repères (5).
- **29 échelles interactives** (CAM, 4AT, MMSE, Mini-Cog, 5 mots, GDS, Cornell, ADL, IADL, AGGIR, MNA-SF, SPPB, Fried, CFS, ISAR, Algoplus, Doloplus, DN4, Braden, Norton, mini-Zarit, Charlson, AUDIT-C, Epworth, EAT-10, CHA₂DS₂-VA, HAS-BLED, charge anticholinergique…) et **12 calculateurs** (Cockcroft, CKD-EPI, IMC et dénutrition, TUG, équianalgésie, débit et hypodermoclyse, déficit en eau, besoins, osmolarité, QTc, calcémie corrigée, dose).
- **Annuaire local** modifiable, stocké sur l'appareil, avec sauvegarde et restauration.
- **Signaler une erreur** depuis chaque fiche (formulaire GitHub).
- **Version web installable et hors ligne** (manifeste, service worker).
- Relecture clinique transversale ([docs/RELECTURE.md](docs/RELECTURE.md)), sources ([docs/SOURCES.md](docs/SOURCES.md)), maintenance ([docs/MAINTENANCE.md](docs/MAINTENANCE.md)), Dependabot.

## v0.2.0 — 2026-11-14

Phase 2 du plan : le moteur complet.

- **Échelles interactives** rendues depuis des fichiers YAML : critères (CAM), somme de points (mini-GDS, GDS-15, MNA-SF) et grille AGGIR avec calcul du GIR selon l'algorithme officiel (annexe 2 du décret 2008-821, règles de synthèse des sous-variables du guide CNAMTS 2008 ; tests automatisés `npm test`).
- **7 calculateurs** : Cockcroft-Gault, CKD-EPI 2021, IMC et perte de poids (critères HAS 2021), débit de perfusion et d'hypodermoclyse, calcul de dose, QTc (Bazett, Fridericia), calcémie corrigée.
- **Favoris** (étoile sur chaque fiche) et **taille de texte** réglable (bouton Aa), mémorisés sur l'appareil.
- **Détection de mise à jour** : bandeau sur l'accueil quand une nouvelle release existe sur GitHub (seul appel réseau de l'app, silencieux hors ligne).
- Dépôt public et version web sur GitHub Pages.

## v0.1.0 — 2026-11-14

Première version installable (phase 1 du plan) : squelette de l'application, recherche, chapitres, 2 fiches de démonstration (Confusion aiguë, CAM), construction automatique de l'APK sur GitHub.
