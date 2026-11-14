# Mémo IDE Géronto

Carnet de poche **hors ligne** pour infirmière d'équipe mobile de gériatrie : fiches cliniques, échelles de l'évaluation gériatrique, calculateurs, repères de parcours. Application Android (.apk) et version web.

**265 fiches, 29 échelles interactives, 12 calculateurs, annuaire local.** Version web : https://thomasjousse.github.io/memo-ide-geronto/

- Installer l'app : [docs/INSTALLATION.md](docs/INSTALLATION.md)
- Plan complet du projet : [PLAN-IMPLANTATION.md](PLAN-IMPLANTATION.md)
- Relecture clinique et points à valider : [docs/RELECTURE.md](docs/RELECTURE.md) — sources : [docs/SOURCES.md](docs/SOURCES.md)
- Corriger ou ajouter une fiche : [docs/CONTRIBUER.md](docs/CONTRIBUER.md) — publier une version : [docs/MAINTENANCE.md](docs/MAINTENANCE.md)

## Comment c'est fait

| Couche | Outil |
|---|---|
| Contenu | Markdown (`content/**/*.md`) + échelles YAML (`content/scales/`), compilés en JSON par `scripts/build-content.mjs` |
| Interface | HTML / CSS / JS sans framework (`src/`), assemblé par Vite |
| Android | Capacitor (`android/`), APK construit par GitHub Actions |
| Distribution | GitHub Releases (APK signé à chaque tag `v*`) et GitHub Pages (version web) |

## Développer

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # vérifie les fiches : ids, chapitres, liens, sources
npm run build      # dist/
```

Aucune donnée patient n'est stockée. L'app ne fait aucun appel réseau.

## Avertissement

Aide-mémoire destiné à des professionnels de santé. Il ne remplace ni la prescription médicale, ni les protocoles de l'établissement, ni le jugement clinique. Le contenu a été rédigé avec l'aide d'une IA (Claude) à partir des recommandations citées sur chaque fiche ; il est en cours de validation par des professionnels de terrain. Chaque fiche cite ses sources et sa date de mise à jour.
