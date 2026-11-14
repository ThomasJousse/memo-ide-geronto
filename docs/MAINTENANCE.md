# Faire vivre l'application (phase 11)

## Publier une nouvelle version

1. Modifier ou ajouter les fiches dans `content/` (voir [CONTRIBUER.md](CONTRIBUER.md)).
2. Vérifier : `npm run check` et `npm test`, puis `npm run dev` pour relire à l'écran.
3. Mettre à jour `CHANGELOG.md` et la version dans `package.json` (1.0.1 pour une correction, 1.1.0 pour du nouveau contenu).
4. Commiter, puis créer le tag : `git tag -a v1.1.0 -m "v1.1.0"` et `git push --follow-tags`.
5. GitHub Actions construit l'APK signé et publie la release ; la version web se met à jour à chaque push sur `main`.
6. Sur le téléphone, le bandeau « Version disponible » apparaît au prochain lancement avec réseau.

## Traiter les retours terrain (phase 9)

- Les corrections arrivent par le formulaire « Correction de contenu » (lien en bas de chaque fiche) ou directement.
- Priorité : les signalements « risque pour un patient » sont corrigés et publiés dans la journée.
- Chaque correction cite sa source ; mettre à jour le champ `updated` de la fiche.
- Tenir à jour la liste des points validés dans [RELECTURE.md](RELECTURE.md).

## Revue annuelle (chaque novembre)

- Calendrier vaccinal de l'année.
- Nouvelles recommandations HAS, SFGG, SFAP, ESC, SPILF (voir [SOURCES.md](SOURCES.md)).
- Statut des médicaments (déremboursements, nouvelles AMM, alertes ANSM).
- Vérifier les liens et les numéros utiles.

## Technique

- Dependabot propose chaque mois les mises à jour des dépendances et des actions GitHub : accepter si le build passe.
- La clé de signature (`Documents\memo-ide-geronto-keystore`) doit rester sauvegardée : sans elle, impossible de publier une mise à jour installable par-dessus l'application existante.
- Modèles recommandés : Sonnet 5.5 moyen pour le code et les petites corrections, Opus 5.5 élevé pour le contenu clinique et les relectures, Haiku 5.5 pour les tâches mécaniques en volume.
