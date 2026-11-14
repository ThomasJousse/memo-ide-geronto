# Rapport de relecture clinique (phase 8)

Date : 14/11/2026. Version relue : contenu de la v1.0.0 (265 fiches, 29 échelles, 12 calculateurs).

## Ce qui a été vérifié

### Automatiquement, à chaque build (`npm run check`, `npm test`)

- Identifiants uniques, chapitre valide, présence d'une source sur chaque fiche et chaque échelle.
- Tous les liens internes entre fiches, échelles et calculateurs pointent vers un élément existant.
- Échelles : champs requis par type, points numériques, tranches d'interprétation couvrant tout le score.
- Algorithme AGGIR : 24 cas tests (GIR et règles de synthèse) recopiés de l'annexe 2 du décret 2008-821 et du guide CNAMTS 2008.

### Manuellement : cohérence des valeurs clés entre fiches

| Donnée | Fiches concernées | Statut |
|---|---|---|
| Paracétamol : 3 g/j chez l'âgé fragile, < 50 kg | m-paracetamol, douleur-chronique | Cohérent |
| Escitalopram ≤ 10 mg, citalopram ≤ 20 mg après 65 ans | m-escitalopram, antidepresseurs-sujet-age, psychotropes-demence, medicaments-qt | Cohérent |
| Apixaban : critères de réduction de dose | m-apixaban, anticoagulants-sujet-age, adaptation-renale | Cohérent |
| Énoxaparine : seuils de clairance | m-enoxaparine, adaptation-renale | Cohérent |
| Metformine : seuils de clairance | m-metformine, adaptation-renale, antidiabetiques-sujet-age | Cohérent |
| Nitrofurantoïne contre-indiquée si clairance < 45 | m-antibiotiques-cystite, adaptation-renale, antibiotiques-sujet-age | Cohérent |
| Tramadol ≤ 300 mg/j après 75 ans | m-tramadol, opioides-sujet-age | Cohérent |
| Morphine orale → SC ÷ 2, → IV ÷ 3 | m-morphine, voie-sc-medicaments, calculateur d'équianalgésie | Cohérent |
| Fentanyl 12 µg/h ≈ 30 mg, 25 µg/h ≈ 60 mg de morphine orale | m-fentanyl, calculateur | Cohérent |
| Hydroxyzine ≤ 50 mg/j chez l'âgé | m-hydroxyzine | Cohérent avec l'ANSM |
| Dénutrition HAS 2021 (IMC < 22, perte ≥ 5 % / 1 mois, ≥ 10 % / 6 mois ; sévère IMC < 20, ≥ 10 % / 1 mois, ≥ 15 % / 6 mois, albumine < 30) | denutrition, calculateur IMC, albumine-crp, scale MNA-SF | Cohérent |
| Hypodermoclyse 1 à 1,5 L par site et par 24 h | hypodermoclyse, calculateur de débit | Cohérent |
| TUG ≥ 20 s = risque élevé | chute, chutes-repetees, calculateur TUG | Cohérent |
| Fièvre chez l'âgé (≥ 37,8 °C répétée, + 1,3 °C, < 36 °C) | constantes-sujet-age, sepsis-sujet-age | Cohérent |

### Sources douteuses retirées pendant la relecture

Quelques références dont l'existence ou la date n'étaient pas certaines ont été remplacées par des sources vérifiables ou plus générales (fiches scpd-agitation, bientraitance, antihypertenseurs-sujet-age, m-b12-folates, valeurs-critiques, contention, hypodermoclyse).

## Points à faire valider par une professionnelle de terrain

Ces éléments sont exacts selon les sources citées, mais dépendent des **protocoles locaux** ou de choix cliniques où la littérature varie. À relire en priorité par Ophélie et, si possible, par le gériatre et le pharmacien de l'équipe.

1. **Doses en soins palliatifs** (midazolam, scopolamine, morphine SC) : fiches m-midazolam, m-scopolamine, detresse-fin-de-vie, soins-palliatifs. Aligner sur le protocole de l'EMSP locale.
2. **Médicaments en sous-cutané hors AMM** (ceftriaxone, furosémide, halopéridol) : voie-sc-medicaments, m-ceftriaxone. Vérifier la liste de l'établissement.
3. **Liste des médicaments écrasables** : ecrasement. Remplacer les exemples par la référence de la pharmacie de l'hôpital si elle diffère.
4. **Concentration des gouttes** (halopéridol, loxapine, cyamémazine, escitalopram) : selon les présentations disponibles dans l'établissement.
5. **Calendrier vaccinal** (pneumocoque, VRS, Covid-19) : vaccinations. À revoir chaque année avec le calendrier officiel.
6. **Seuils d'échelles où la littérature varie** : Cornell (> 10 / > 18), catégories ADL, SPPB (7 à 9 / ≤ 6), MMSE (seuils GRECO selon le niveau d'études), Doloplus (cotation générique 0 à 3 : utiliser la grille officielle).
7. **Ratios d'équianalgésie** du calculateur : indicatifs (SFETD, AFSOS) ; la réduction de 25 à 50 % est rappelée.
8. **Liste ACB** (charge anticholinergique) : non exhaustive.
9. **Valeurs critiques biologiques** : remplacer par les seuils du laboratoire du CHSF.
10. **Accès en France aux anticorps anti-amyloïde** : à mettre à jour selon les décisions HAS à venir.
11. **Tinzaparine en insuffisance rénale** : vérifier la conduite locale.
12. **Organisation de l'EMG** (missions, compte rendu, check-lists) : adapter au fonctionnement réel de l'équipe.

## Comment remonter une correction

Voir [CONTRIBUER.md](CONTRIBUER.md) ou ouvrir un ticket « Correction de contenu » sur GitHub (formulaire prévu). Chaque correction validée part dans la version suivante de l'application.
