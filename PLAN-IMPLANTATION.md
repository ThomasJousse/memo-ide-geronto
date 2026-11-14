# Mémo IDE Géronto — plan d'implantation

Application Android (.apk) de poche pour une infirmière d'équipe mobile de gériatrie (EMG).
Même principe que le « Mémo IDE Détention » : **un carnet de poche cherchable, hors ligne, consulté 20 fois par jour**. On reprend uniquement son **moteur** (code de recherche, navigation, calculateurs). Le **contenu est écrit à neuf et ne concerne que la gérontologie** : aucune fiche de l'ancien artefact n'est reprise ou adaptée.

Plan rédigé le 14/11/2026. Nom de travail : **Mémo IDE Géronto** (à changer si Ophélie préfère autre chose).

---

## 1. Ce qu'on garde du Mémo Détention, ce qui change

| Élément | Mémo Détention | Mémo Géronto |
|---|---|---|
| Format | 1 fichier HTML de 1,5 Mo publié en artefact | Application Android installable (.apk) + version web PWA de secours (iPhone, PC) |
| Moteur | Recherche avec synonymes, surlignage, récents, chapitres colorés, fiches, calculateurs, annuaire, mode sombre | **Identique**, porté tel quel dans le projet (c'est déjà bon) |
| Contenu | Détention, addicto, psychiatrie, labo CHSF | **Rien n'est repris.** 100 % gérontologie, écrit à neuf : syndromes gériatriques, troubles neurocognitifs, échelles de l'évaluation gériatrique standardisée, pharmaco du sujet âgé, parcours/filière, fin de vie |
| Données | JSON inline dans le HTML | Fiches en **Markdown** (1 fichier = 1 fiche) compilées en JSON au build : plus facile à écrire, relire et corriger |
| Échelles | Texte + quelques calculateurs | **Échelles interactives** décrites en données (items, cotation, interprétation) : on coche, le score et l'interprétation s'affichent |
| Mise à jour | Republier l'artefact | Nouvelle version = tag Git → GitHub Actions construit l'APK → l'app signale « mise à jour disponible » |
| Données patient | Aucune | **Aucune** (rien n'est stocké, pas de compte, pas de réseau requis). Un calcul reste à l'écran et disparaît. |

---

## 2. Architecture technique

### 2.1 Stack retenue

- **Front** : HTML / CSS / JavaScript vanilla, même code que le Mémo (pas de framework : rapide, léger, zéro dépendance à maintenir).
- **Bundler** : Vite (assemble le JS, les CSS, les polices embarquées et le JSON de contenu).
- **Coque native** : **Capacitor 7** (Android). Plugins : StatusBar, SplashScreen, App (bouton retour), Preferences (favoris, taille de texte).
- **Build APK** : **GitHub Actions** sur `ubuntu-latest` (Java 17 + Android SDK via le wrapper Gradle). Aucune installation Android Studio sur ton PC.
- **Distribution** : GitHub Releases. L'APK signé est attaché à chaque release ; Ophélie l'installe depuis son téléphone (autorisation « sources inconnues » une seule fois). Pas de Google Play.
- **Version web** : le même build déployé sur GitHub Pages en PWA (installable sur iPhone / PC, hors ligne via service worker). Utile en cas de changement de téléphone.

### 2.2 Pourquoi pas Flutter, React Native ou Kotlin natif

Le Mémo existant est déjà un moteur web complet et éprouvé. Le réécrire en Flutter ou en Kotlin coûterait 3 à 4 fois plus pour un résultat identique à l'usage (lecture, recherche, calculs). Capacitor encapsule le web dans une vraie app Android avec icône, splash, bouton retour et mode hors ligne.

### 2.3 Structure du dépôt

```
memo-ide-geronto/
├── content/                    # LE contenu, en Markdown (1 fiche = 1 fichier)
│   ├── 01-urgences/            # ex : confusion-aigue.md, chute.md …
│   ├── 02-syndromes/
│   ├── 03-neurocognitif/
│   ├── 04-echelles/            # fiches explicatives des échelles
│   ├── 05-pharmaco/
│   ├── 06-medicaments/         # 1 fiche par molécule
│   ├── 07-soins-gestes/
│   ├── 08-biologie/
│   ├── 09-parcours-filiere/
│   ├── 10-communication-ethique/
│   ├── 11-reperes/             # sigles, numéros, annuaire local
│   └── scales/                 # échelles interactives en YAML (items + cotation)
├── src/
│   ├── app.js                  # moteur (recherche, rendu, navigation) porté du Mémo
│   ├── calculators.js          # calculateurs
│   ├── scales.js               # rendu des échelles interactives depuis scales/*.yaml
│   ├── styles.css              # design system du Mémo (palette géronto)
│   └── index.html
├── scripts/
│   ├── build-content.mjs       # Markdown + YAML → data.json (avec texte de recherche)
│   └── check-content.mjs       # lint : liens internes, tags, sources, fiches orphelines
├── android/                    # projet Capacitor généré (commité)
├── .github/workflows/
│   ├── apk-debug.yml           # à chaque push : APK debug téléchargeable (test)
│   ├── release.yml             # sur tag v* : APK signé + GitHub Release + changelog
│   └── pages.yml               # déploie la PWA sur GitHub Pages
├── docs/
│   ├── INSTALLATION.md         # guide d'installation pour Ophélie (captures)
│   ├── SOURCES.md              # recommandations HAS/SFGG utilisées, avec date
│   └── CONTRIBUER.md           # comment corriger une fiche (même sans coder)
├── PLAN-IMPLANTATION.md        # ce document
└── CHANGELOG.md
```

### 2.4 Format d'une fiche (Markdown + en-tête)

```markdown
---
id: confusion-aigue
cat: urgences
title: Confusion aiguë (delirium) — repérer et agir
tags: syndrome confusionnel, CAM, 4AT, agitation, désorientation, fluctuant, cause
resume: Début brutal + fluctuation + inattention = delirium jusqu'à preuve du contraire. Chercher la cause (RUDI).
sources: HAS 2009 Confusion aiguë chez la personne âgée ; SFGG
updated: 2026-11
---
Corps de la fiche en Markdown. Blocs spéciaux :
> [!attention] Texte en rouge
> [!repere] Texte en bleu
```

Le script de build fabrique l'objet `{id, cat, title, tags, resume, html, text}` que le moteur du Mémo attend déjà.

### 2.5 Format d'une échelle interactive (YAML)

```yaml
id: cam
title: CAM — Confusion Assessment Method
type: criteria            # ou "sum" (somme d'items), "grid" (AGGIR)
items:
  - {id: a, label: "Début brutal et évolution fluctuante", required: true}
  - {id: b, label: "Inattention", required: true}
  - {id: c, label: "Désorganisation de la pensée"}
  - {id: d, label: "Altération de la vigilance"}
rule: "a && b && (c || d)"
interpretation:
  positive: {text: "CAM positive : delirium probable → fiche Confusion aiguë", level: crit}
  negative: {text: "CAM négative", level: ok}
```

Le moteur génère la case à cocher, le résultat coloré et le lien vers la fiche de conduite à tenir.

---

## 3. Plan de contenu (ce que l'app contiendra)

Objectif v1.0 : **environ 260 fiches, 35 échelles interactives, 16 calculateurs, 90 fiches médicaments**. Volumes comparables au Mémo Détention, recentrés.

### Chapitre 1 — Situations aiguës de la personne âgée (≈ 35 fiches)
Présentations atypiques (le « ne va pas bien », chute, confusion comme seul signe), conduite générale ABCDE adaptée à l'âgé, constantes et seuils chez le sujet âgé, chute (bilan immédiat, relevé, chute sous anticoagulant, station au sol prolongée, rhabdomyolyse), traumatisme crânien sous anticoagulant/antiagrégant, confusion aiguë, déshydratation, hyponatrémie, hypernatrémie, hypercalcémie, hypoglycémie et hyperglycémie, sepsis sans fièvre, infection urinaire vs bactériurie asymptomatique, pneumopathie d'inhalation, décompensation cardiaque/OAP, SCA atypique, AVC et AIT, embolie pulmonaire, rétention aiguë d'urine, fécalome et occlusion, hémorragie digestive, douleur abdominale, hypothermie, canicule, malaise et syncope, hypotension orthostatique, crise convulsive tardive, fausse route, agitation aiguë, anaphylaxie, ACR (et question de la réanimation : directives anticipées), fin de vie en urgence.

### Chapitre 2 — Syndromes gériatriques (≈ 30 fiches)
Fragilité (Fried, SEGA), sarcopénie, dénutrition (critères HAS 2021 : IMC, perte de poids, albumine), déshydratation chronique, chutes récurrentes et syndrome post-chute (désadaptation psychomotrice), troubles de la marche et de l'équilibre, syndrome d'immobilisation et ses complications, escarres (stades, localisation, prévention, supports), incontinence urinaire et fécale, constipation, dysphagie et troubles de la déglutition (textures IDDSI), douleur chronique et sa sous-évaluation, dépression du sujet âgé, anxiété, troubles du sommeil, iatrogénie, troubles sensoriels (vision, audition), santé bucco-dentaire, ostéoporose et fractures, anémie, plaies chroniques (ulcères), œdèmes des membres inférieurs, vertiges, syndrome de glissement (et ses limites), isolement social, épuisement de l'aidant.

### Chapitre 3 — Troubles neurocognitifs et comportement (≈ 25 fiches)
Repérage des troubles cognitifs, maladie d'Alzheimer, démence vasculaire, démence à corps de Lewy (et danger des neuroleptiques), dégénérescence fronto-temporale, maladie de Parkinson et démence parkinsonienne, stades et évolution, SCPD (symptômes psycho-comportementaux) : agitation, agressivité, déambulation, cris, opposition aux soins, apathie, idées délirantes, hallucinations, désinhibition, troubles du sommeil ; conduite à tenir non médicamenteuse (HAS), quand un médicament et lequel, refus de soins et de nourriture, communication adaptée (validation, Humanitude, reformulation), environnement apaisant, consultation mémoire et CMRR, UCC/UHR/PASA, aides aux aidants.

### Chapitre 4 — Évaluation gériatrique standardisée : échelles (≈ 35 échelles interactives)
Cognition : MMSE, MoCA (résumé), test de l'horloge, 5 mots de Dubois, Codex, Mini-Cog, BREF.
Confusion : CAM, 4AT.
Humeur : GDS-15, mini-GDS (4 items), échelle de Cornell.
Autonomie : ADL de Katz, IADL de Lawton (4 items et 8 items), **grille AGGIR → GIR calculé**.
Nutrition : MNA-SF et MNA complet, critères HAS dénutrition.
Chute / mobilité : Timed Up and Go, appui unipodal, Tinetti, SPPB, test de la marche, « Stop walking when talking », score de risque de chute.
Fragilité / dépistage : Fried, SEGA grille A, ISAR, TRST, questionnaire fragilité HAS, échelle de Rockwood (CFS).
Douleur : EN/EVA/EVS, Algoplus, Doloplus-2, ECPA, DN4.
Escarre : Braden, Norton, Waterlow.
Comportement : NPI-ES, échelle de Cohen-Mansfield (résumé).
Aidant : Zarit et mini-Zarit.
Social : EPICES.
Comorbidités : Charlson. Dépendance alcool : AUDIT-C. Sommeil : Epworth. Déglutition : test de déglutition à l'eau, EAT-10.

### Chapitre 5 — Pharmacologie du sujet âgé (≈ 25 fiches)
Règles de prescription (start low, go slow, 1 molécule à la fois), modifications pharmacocinétiques, **adaptation à la fonction rénale** (Cockcroft vs CKD-EPI, lequel pour quel médicament), médicaments potentiellement inappropriés (liste Laroche, STOPP/START v3, Beers 2023), **charge anticholinergique**, benzodiazépines et hypnotiques (sevrage progressif), neuroleptiques et démence (surmortalité, DCL), antidépresseurs, anticoagulants et chutes, antiagrégants, antihypertenseurs et hypotension orthostatique, diurétiques, digoxine, antidiabétiques (sulfamides, metformine, insuline, objectifs HbA1c selon profil), opioïdes et équianalgésie, AINS (quasi contre-indiqués), laxatifs, IPP au long cours, médicaments et QT, interactions majeures, **écraser ou ouvrir : liste OMEDIT**, formes galéniques et dysphagie, déprescription, bilan partagé de médication, pilulier et PDA, pharmacovigilance.

### Chapitre 6 — Médicaments de A à Z (≈ 90 fiches)
Une fiche par molécule au format du Mémo (indication, posologie sujet âgé, adaptation rénale, effets, surveillance, contre-indications, écrasable ou non). Sélection : les psychotropes de la gériatrie (rispéridone, tiapride, halopéridol, quétiapine, olanzapine, mirtazapine, sertraline, citalopram/escitalopram, miansérine, oxazépam, lorazépam, zolpidem/zopiclone, mélatonine, hydroxyzine), anti-Alzheimer (donépézil, rivastigmine, galantamine, mémantine), antiparkinsoniens (lévodopa, ropinirole, rasagiline), antalgiques (paracétamol, tramadol, codéine, oxycodone, morphine, fentanyl patch, néfopam, prégabaline, gabapentine, lidocaïne patch), cardio (furosémide, bumétanide, spironolactone, hydrochlorothiazide, bisoprolol, amlodipine, IEC/ARA2, digoxine, amiodarone, trinitrine, statines), anticoagulants (apixaban, rivaroxaban, dabigatran, warfarine, fluindione, énoxaparine, tinzaparine), antiagrégants (aspirine, clopidogrel), diabète (metformine, gliclazide, sitagliptine, insulines), divers (lévothyroxine, IPP, macrogol, lactulose, dompéridone, métoclopramide, ondansétron, trimébutine, oxybutynine/solifénacine, tamsulosine, alfuzosine, alendronate, vitamine D, calcium, fer, B12, potassium, antibiotiques courants : amoxicilline, Augmentin, ceftriaxone, cotrimoxazole, fosfomycine, nitrofurantoïne, ciprofloxacine, lévofloxacine, métronidazole, doxycycline, pivmécillinam), fin de vie (midazolam, scopolamine/butylscopolamine, morphine SC, halopéridol, clonazépam).

### Chapitre 7 — Soins, gestes et prévention (≈ 30 fiches)
**Hypodermoclyse** (perfusion sous-cutanée : sites, débits, solutés, médicaments possibles en SC), voie SC des médicaments, sondage urinaire chez l'âgé et alternatives, soins d'escarres et choix des pansements, prévention des escarres (supports, positionnement, effleurage), bas de contention, prévention des chutes (environnement, chaussage, aides techniques), relevé du sol, **contention physique** (HAS : prescription, surveillance, alternatives), transferts et manutention, soins de bouche, toilette et habillage (préserver l'autonomie), nutrition (enrichissement, CNO, fractionnement, textures), hydratation (besoins, ruses), surveillance glycémique, ECG, prélèvements difficiles, oxygénothérapie, aspiration, aérosols, vaccinations du sujet âgé (grippe, Covid, pneumocoque, zona, VRS, dTP), dépistages, **soins palliatifs et fin de vie** (symptômes, sédation, SAP, loi Claeys-Leonetti, directives anticipées, personne de confiance, LATA), accompagnement du décès, soins post-mortem.

### Chapitre 8 — Biologie du sujet âgé (≈ 25 fiches)
Ce qui change avec l'âge (et ce qui ne change pas), créatinine et DFG (pourquoi la créatinine trompe), ionogramme (natrémie, kaliémie), calcium corrigé, albumine/préalbumine et CRP (dénutrition vs inflammation), NFS et anémie, B12/folates, vitamine D, TSH, HbA1c (objectifs par profil), BNP/NT-proBNP, troponine, CPK, bilan hépatique, INR, anti-Xa, ECBU et bactériurie asymptomatique (ne pas traiter), hémocultures, gaz du sang, **bilans types** : bilan de chute, bilan de confusion, bilan de dénutrition, bilan pré-anticoagulant, bilan de démence (HAS), valeurs critiques à appeler.

### Chapitre 9 — Parcours, filière et cadre (≈ 30 fiches)
Missions d'une **EMG** (intra et extra-hospitalier, urgences, EHPAD, domicile), l'évaluation gériatrique standardisée en pratique (déroulé d'une visite EMG, trame de compte rendu), plan personnalisé de santé (PPS), filière gériatrique (court séjour gériatrique, UHCD, SMR gériatrique, UCC, UHR, USLD, EHPAD, HDJ, consultation mémoire, HAD, SSIAD, SPASAD, accueil de jour, hébergement temporaire), orientation et Via Trajectoire, dispositifs de coordination (DAC, CLIC, MAIA, CPTS, PTA), aides financières (APA et GIR, ASH, PCH, ARDH, PAP), MDPH, **mesures de protection juridique** (sauvegarde de justice, curatelle, tutelle, habilitation familiale, mandat de protection future), refus de soins et consentement, maltraitance (repérage, 3977, signalement), hospitalisation sans consentement (rare), **DLU** (dossier de liaison d'urgence) et fiche de liaison, lettre de liaison, transmissions ciblées, secret et partage d'informations (équipe de soins), télémédecine en EHPAD, conduite automobile et âge, allocation de ressources (ALD), obsèques et démarches après décès (à l'usage des familles).

### Chapitre 10 — Communication, relation, éthique (≈ 12 fiches)
Communiquer avec une personne malentendante/malvoyante, avec une personne désorientée, annonce et mauvaises nouvelles, entretien avec les aidants, repérer l'épuisement de l'aidant, refus de soins (démarche), bientraitance, dilemmes éthiques fréquents (alimentation en fin de vie, contention, hospitalisation ou non), approches non médicamenteuses (musicothérapie, snoezelen, réminiscence), sexualité et intimité, spiritualité et fin de vie.

### Chapitre 11 — Calculateurs (16)
Cockcroft-Gault, CKD-EPI 2021, IMC et pourcentage de perte de poids (critères dénutrition), **GIR (AGGIR)**, calcul de dose, débit de perfusion et d'hypodermoclyse, dilution, **équianalgésie des opioïdes** (rotation, patch fentanyl), QTc, calcium corrigé, osmolarité, déficit hydrique (hypernatrémie), besoins caloriques et protéiques, charge anticholinergique, CHA₂DS₂-VA et HAS-BLED, Charlson.

### Chapitre 12 — Repères (≈ 8 fiches + annuaire)
Sigles de la gériatrie (EMG, EGS, SCPD, GIR, APA, DAC, SMR, UCC, UHR, USLD, DLU, PPS, LATA…), numéros utiles (15, 3977, 3114, SOS Médecins, pharmacie de garde), annuaire local **vide à remplir par Ophélie** (dans l'app ou via le fichier `annuaire.yaml`), modèles de transmissions (SBAR/SAED), check-list de la mallette EMG, check-list visite EHPAD.

### Écran d'accueil
- Bandeau « Situation aiguë » : Chute · Confusion · Déshydratation · Sepsis · Fausse route · AVC · Hypoglycémie · ACR.
- Bandeau « Échelles du quotidien » : CAM · MMSE · GDS · ADL/IADL · MNA · Braden · TUG · Algoplus · GIR.
- Récents, favoris, puis chapitres.

---

## 4. Phases et calendrier

Chaque phase = 1 ou plusieurs sessions Claude Code dans le dépôt. Durée indicative en heures de travail Claude (+ ton temps de relecture).

| Phase | Contenu | Livrable | Durée | Modèle |
|---|---|---|---|---|
| **0. Cadrage** | Ce plan, validation du périmètre et du nom avec Ophélie | PLAN-IMPLANTATION.md | fait | Opus 5.5 élevé (rédigé ici par Fable 5.1) |
| **1. Socle technique** | Dépôt GitHub, Vite, Capacitor Android, icône et splash, workflow APK debug, GitHub Pages | Un APK « Hello » installable sur son téléphone | 2 à 3 h | Sonnet 5.5 moyen |
| **2. Moteur** | Portage du moteur du Mémo (recherche, synonymes, fiches, chapitres, récents, mode sombre), pipeline Markdown→JSON, moteur d'échelles YAML, calculateurs, favoris, taille de texte, « mise à jour disponible » | App fonctionnelle avec 5 fiches de test et 2 échelles | 4 à 6 h | Sonnet 5.5 moyen (Opus 5.5 pour le moteur d'échelles) |
| **3. Contenu — lot A** | Ch. 1 Situations aiguës + Ch. 2 Syndromes gériatriques | 65 fiches, sources citées | 6 à 8 h | Opus 5.5 élevé |
| **4. Contenu — lot B** | Ch. 4 Échelles (35 YAML + fiches) + Ch. 11 Calculateurs | Échelles interactives validées sur cas tests | 6 à 8 h | Opus 5.5 élevé |
| **5. Contenu — lot C** | Ch. 3 Neurocognitif + Ch. 10 Communication | 37 fiches | 4 à 5 h | Opus 5.5 élevé |
| **6. Contenu — lot D** | Ch. 5 Pharmaco + Ch. 6 Médicaments (90 molécules) | 115 fiches | 8 à 10 h | Opus 5.5 élevé (fiches molécules : Sonnet 5.5 sur gabarit, puis relecture Opus) |
| **7. Contenu — lot E** | Ch. 7 Soins + Ch. 8 Biologie + Ch. 9 Parcours + Ch. 12 Repères | 93 fiches | 6 à 8 h | Opus 5.5 élevé |
| **8. Relecture clinique** | Passe de cohérence inter-fiches, vérification des posologies et seuils contre HAS/SFGG/Vidal, liste des points à faire valider par Ophélie | Rapport de relecture + corrections | 4 à 6 h | Opus 5.5 élevé |
| **9. Validation terrain** | Ophélie teste 2 semaines, remonte corrections (issues GitHub ou simple liste) | Liste de corrections | ton temps | Sonnet 5.5 moyen pour appliquer |
| **10. Release 1.0** | Keystore de signature, workflow release, APK signé, guide d'installation, PWA | GitHub Release v1.0.0 + docs/INSTALLATION.md | 2 h | Sonnet 5.5 moyen |
| **11. Vie de l'app** | Corrections, nouvelles fiches, annuaire, mises à jour des recos (ex. nouvelle reco HAS) | Releases v1.x | continu | Sonnet 5.5 moyen (Opus pour contenu clinique) |

Total indicatif : **45 à 60 heures de sessions** réparties sur 3 à 5 semaines à raison d'une ou deux sessions par jour. Phases 3 à 7 sont indépendantes et peuvent tourner en parallèle dans des sessions séparées (chacune n'écrit que dans son dossier `content/`).

---

## 5. Ce qu'il faut de ta part

0. **Outils sur ce PC** (vérifié le 14/11 : ni `gh`, ni Node, ni `git` détectés dans ce terminal). Phase 1 commence par les installer via `winget` : Git, GitHub CLI, Node LTS. Pas besoin d'Android Studio ni de Java : l'APK est construit sur GitHub.
1. **GitHub** : un dépôt `memo-ide-geronto` (privé recommandé). Je peux le créer avec `gh` une fois le CLI connecté à ton compte (`gh auth login`) ; sinon tu le crées et me donnes l'URL. Les Actions sont gratuites (2 000 min/mois en privé, largement assez : un build APK ≈ 6 min).
2. **Un dossier sur ton PC** pour le projet (cette session tourne dans un dossier temporaire).
3. **Pour la release signée** : un mot de passe de keystore que tu choisis. Je génère le keystore, tu le stockes en secret GitHub. Sans lui, pas de mise à jour « par-dessus » l'app installée.
4. **Validation d'Ophélie** sur : le nom, les 3 chapitres les plus utiles pour elle (à faire en premier), le format des fiches (une fiche exemple lui sera envoyée dès la phase 2), et le contenu local (annuaire CHSF, protocoles de l'EMG).

---

## 6. Risques et garde-fous

- **Responsabilité médicale** : l'app est un aide-mémoire, pas une prescription. Disclaimer sur chaque fiche (comme le Mémo), sources datées, et **validation par Ophélie** avant la v1.0. Aucun contenu n'est inventé : chaque posologie ou seuil provient d'une source nommée (HAS, SFGG, Vidal, ANSM, OMEDIT, Beers/STOPP-START).
- **Fraîcheur des recommandations** : fichier `docs/SOURCES.md` avec la date de chaque reco ; revue annuelle.
- **Données personnelles** : aucune donnée patient, aucun compte, aucune télémétrie. Les calculs ne sont pas sauvegardés. Compatible RGPD par construction.
- **Android** : minimum Android 8 (API 26). Installation hors Play Store : prévoir le guide avec captures.
- **Perte du keystore** = impossible de mettre à jour l'app sans la réinstaller. Sauvegarde chiffrée du fichier chez toi.
- **Charge de relecture** : 260 fiches à relire est long. Priorisation : les 3 chapitres choisis par Ophélie sont relus en premier et livrés en v0.5 ; le reste suit.

---

## 7. Proposition de modèles par tâche

| Tâche | Modèle et effort | Pourquoi |
|---|---|---|
| Cadrage, architecture, plan (phase 0) | **Opus 5.5 — élevé** | Vision d'ensemble, arbitrages |
| Socle technique, CI, Capacitor, release (phases 1, 2, 10) | **Sonnet 5.5 — moyen** | Code standard, bien documenté ; rapide et économique |
| Moteur d'échelles interactives, calculateurs cliniques (phase 2 et 4) | **Opus 5.5 — moyen** | Logique de cotation à ne pas rater (GIR, équianalgésie) |
| Rédaction du contenu clinique (phases 3 à 7) | **Opus 5.5 — élevé** | Exactitude des posologies et des seuils ; recherche web des recos HAS/SFGG à chaque fiche |
| Fiches molécules sur gabarit (phase 6) | **Sonnet 5.5 — moyen**, puis relecture Opus 5.5 | 90 fiches au même format : Sonnet remplit vite, Opus vérifie |
| Relecture clinique transversale (phase 8) | **Opus 5.5 — élevé** | Cohérence entre 260 fiches, détection des contradictions |
| Corrections après test terrain, maintenance (phases 9, 11) | **Sonnet 5.5 — moyen** | Petites modifications ciblées |
| Conversion de masse, lint, génération de tags et synonymes | **Haiku 5.5 — bas** | Tâches mécaniques en volume |

Règle simple : **Sonnet pour le code, Opus 5.5 élevé pour le contenu, l'arbitrage et la relecture finale, Haiku pour le mécanique.**

---

## 8. Prochaine étape

Lancer la **phase 1** : choisir le dossier du projet, créer le dépôt GitHub, obtenir un premier APK installable. Ophélie pourra l'installer dès le premier jour et voir le contenu arriver release après release.
