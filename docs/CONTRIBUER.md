# Corriger ou ajouter une fiche

Une fiche = un fichier Markdown dans `content/<chapitre>/`. Exemple : `content/01-urgences/confusion-aigue.md`.

```markdown
---
id: confusion-aigue            # identifiant unique, sans accent (sert aux liens #e-id)
cat: urgences                  # clé d'un chapitre de content/chapters.yaml
title: Confusion aiguë (delirium) — repérer et agir
short: Confusion               # libellé court pour les raccourcis de l'accueil (facultatif)
order: 2                       # position dans le chapitre (facultatif)
tags: delirium, CAM, désorientation     # mots que la recherche doit trouver
resume: Une phrase qui tient sur deux lignes, affichée en tête de fiche et dans les résultats.
sources: HAS 2009 ; SFGG       # obligatoire
updated: 2026-11
---
Corps en Markdown : titres `##`, listes, tableaux, **gras**.

> [!attention]
> Encadré rouge (danger, contre-indication).

> [!repere]
> Encadré bleu (astuce, point de repère).

Lien vers une autre fiche : [CAM](#e-cam)
```

Vérifier avant de proposer : `npm run check` signale les ids en double, les chapitres inconnus, les liens cassés et les fiches sans source.

Une échelle interactive = un fichier YAML dans `content/scales/` (voir `cam.yaml`) plus sa fiche explicative dans `content/04-echelles/`.
