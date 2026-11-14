# Mémo IDE Géronto

Carnet de poche **hors ligne** pour infirmière d'équipe mobile de gériatrie : fiches cliniques, échelles de l'évaluation gériatrique, calculateurs, repères de parcours. Application Android (.apk) et version web.

- Plan complet du projet : [PLAN-IMPLANTATION.md](PLAN-IMPLANTATION.md)
- Installer l'app : [docs/INSTALLATION.md](docs/INSTALLATION.md)
- Corriger ou ajouter une fiche : [docs/CONTRIBUER.md](docs/CONTRIBUER.md)

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

Aide-mémoire destiné à des professionnels de santé. Il ne remplace ni la prescription médicale, ni les protocoles de l'établissement, ni le jugement clinique. Chaque fiche cite ses sources et sa date de mise à jour.
