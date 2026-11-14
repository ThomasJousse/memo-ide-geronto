// Calculateurs cliniques. Chaque calculateur : champs + fonction compute(valeurs) → résultat.
// Aucune valeur n'est conservée : le calcul vit le temps de l'écran.
const r1 = (x) => Math.round(x * 10) / 10;
const r0 = (x) => Math.round(x);

const KDIGO = (dfg) =>
  dfg >= 90 ? ["G1 : fonction rénale normale ou élevée", "ok"]
  : dfg >= 60 ? ["G2 : légèrement diminuée", "ok"]
  : dfg >= 45 ? ["G3a : légèrement à modérément diminuée", "warn"]
  : dfg >= 30 ? ["G3b : modérément à sévèrement diminuée", "warn"]
  : dfg >= 15 ? ["G4 : sévèrement diminuée", "crit"]
  : ["G5 : insuffisance rénale terminale", "crit"];

// Facteur = mg de morphine orale par unité de dose quotidienne (ratios SFETD / AFSOS, indicatifs).
const OPIOIDS = [
  { id: "morphine-po", label: "Morphine orale", factor: 1, unit: "mg/24 h" },
  { id: "morphine-sc", label: "Morphine SC", factor: 2, unit: "mg/24 h" },
  { id: "morphine-iv", label: "Morphine IV", factor: 3, unit: "mg/24 h" },
  { id: "oxycodone-po", label: "Oxycodone orale", factor: 2, unit: "mg/24 h" },
  { id: "hydromorphone-po", label: "Hydromorphone orale", factor: 7.5, unit: "mg/24 h" },
  { id: "fentanyl", label: "Fentanyl patch", factor: 2.4, unit: "µg/h" },
  { id: "tramadol", label: "Tramadol oral", factor: 0.2, unit: "mg/24 h" },
  { id: "codeine", label: "Codéine orale", factor: 1 / 6, unit: "mg/24 h" },
];

const creatToUmol =(v, unit) => (unit === "mgL" ? v * 8.84 : unit === "mgdL" ? v * 88.4 : v);

export const CALCULATORS = [
  {
    id: "cockcroft",
    title: "Clairance de la créatinine — Cockcroft et Gault",
    short: "Cockcroft",
    tags: "clairance, créatinine, Cockcroft, Gault, fonction rénale, adaptation posologique, DFG",
    resume: "Formule historique, celle que citent la plupart des RCP pour adapter les posologies. Sous-estime chez le sujet âgé maigre, surestime chez l'obèse.",
    sources: "Cockcroft DW, Gault MH. Nephron 1976 ; HAS 2011 Évaluation du DFG",
    fields: [
      { id: "age", label: "Âge", unit: "ans", type: "number", min: 18, max: 120 },
      { id: "sexe", label: "Sexe", type: "select", options: [["F", "Femme"], ["H", "Homme"]] },
      { id: "poids", label: "Poids", unit: "kg", type: "number", min: 20, max: 250, step: 0.1 },
      { id: "creat", label: "Créatinine", type: "number", min: 10, max: 3000, step: 0.1 },
      { id: "unit", label: "Unité", type: "select", options: [["umol", "µmol/L"], ["mgL", "mg/L"], ["mgdL", "mg/dL"]] },
    ],
    compute: ({ age, sexe, poids, creat, unit }) => {
      const cr = creatToUmol(creat, unit);
      const k = sexe === "H" ? 1.23 : 1.04;
      const cl = ((140 - age) * poids * k) / cr;
      const [txt, level] = KDIGO(cl);
      return { num: r0(cl), unit: "mL/min", level, text: `<strong>${txt}</strong>. Valeur à utiliser pour les posologies dont le RCP se réfère à Cockcroft (AOD, HBPM, metformine, nombreux antibiotiques).` };
    },
  },
  {
    id: "ckdepi",
    title: "DFG estimé — CKD-EPI 2021",
    short: "CKD-EPI",
    tags: "DFG, débit de filtration glomérulaire, CKD-EPI, créatinine, insuffisance rénale chronique, stade KDIGO",
    resume: "Formule de référence pour classer la maladie rénale chronique (indexée à 1,73 m²). Version 2021 sans coefficient ethnique.",
    sources: "Inker LA et al., NEJM 2021 ; KDIGO 2024",
    fields: [
      { id: "age", label: "Âge", unit: "ans", type: "number", min: 18, max: 120 },
      { id: "sexe", label: "Sexe", type: "select", options: [["F", "Femme"], ["H", "Homme"]] },
      { id: "creat", label: "Créatinine", type: "number", min: 10, max: 3000, step: 0.1 },
      { id: "unit", label: "Unité", type: "select", options: [["umol", "µmol/L"], ["mgL", "mg/L"], ["mgdL", "mg/dL"]] },
    ],
    compute: ({ age, sexe, creat, unit }) => {
      const scr = creatToUmol(creat, unit) / 88.4; // mg/dL
      const kappa = sexe === "F" ? 0.7 : 0.9, alpha = sexe === "F" ? -0.241 : -0.302;
      const ratio = scr / kappa;
      let dfg = 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, age);
      if (sexe === "F") dfg *= 1.012;
      const [txt, level] = KDIGO(dfg);
      return { num: r0(dfg), unit: "mL/min/1,73 m²", level, text: `<strong>${txt}</strong>. Chez le sujet âgé, un DFG entre 45 et 60 sans albuminurie ni autre marqueur est fréquent : interpréter avec le médecin.` };
    },
  },
  {
    id: "imc",
    title: "IMC et perte de poids — critères de dénutrition (≥ 70 ans)",
    short: "IMC / poids",
    tags: "IMC, indice de masse corporelle, perte de poids, dénutrition, HAS 2021, poids, taille, pourcentage",
    resume: "Calcule l'IMC et le pourcentage de perte de poids, puis les compare aux critères phénotypiques HAS 2021 de la personne de 70 ans et plus.",
    sources: "HAS 2021 Diagnostic de la dénutrition chez la personne de 70 ans et plus",
    fields: [
      { id: "poids", label: "Poids actuel", unit: "kg", type: "number", min: 20, max: 250, step: 0.1 },
      { id: "taille", label: "Taille", unit: "cm", type: "number", min: 120, max: 220 },
      { id: "avant", label: "Poids antérieur", unit: "kg", type: "number", min: 20, max: 250, step: 0.1, optional: true },
      { id: "delai", label: "Il y a", type: "select", options: [["1", "1 mois"], ["6", "6 mois"], ["hab", "poids habituel (avant la maladie)"]] },
    ],
    compute: ({ poids, taille, avant, delai }) => {
      const imc = poids / Math.pow(taille / 100, 2);
      const sub = [`IMC ${r1(imc)} kg/m²`];
      let level = "ok", msgs = [];
      if (imc < 20) { level = "crit"; msgs.push("IMC < 20 : critère de dénutrition <strong>sévère</strong>"); }
      else if (imc < 22) { level = "warn"; msgs.push("IMC < 22 : critère phénotypique de dénutrition"); }
      else msgs.push("IMC ≥ 22 : pas de critère sur l'IMC");
      let num = r1(imc), unit = "kg/m²";
      if (avant && avant > poids) {
        const pct = ((avant - poids) / avant) * 100;
        sub.push(`Perte ${r1(avant - poids)} kg = ${r1(pct)} %`);
        const sev = delai === "1" ? 10 : 15, mod = delai === "1" ? 5 : 10;
        if (pct >= sev) { level = "crit"; msgs.push(`Perte ≥ ${sev} % : dénutrition <strong>sévère</strong>`); }
        else if (pct >= mod) { level = level === "crit" ? "crit" : "warn"; msgs.push(`Perte ≥ ${mod} % : critère phénotypique de dénutrition`); }
        else msgs.push(`Perte < ${mod} % : pas de critère sur le poids`);
      }
      return { num, unit, level, sub, text: msgs.join(". ") + ". Le diagnostic demande <strong>1 critère phénotypique + 1 critère étiologique</strong> (apports réduits, malabsorption, maladie aiguë ou chronique, inflammation)." };
    },
  },
  {
    id: "debit",
    title: "Débit de perfusion et d'hypodermoclyse",
    short: "Débit perf",
    tags: "débit, perfusion, hypodermoclyse, gouttes par minute, mL/h, sous-cutané, pousse-seringue",
    resume: "Volume et durée → mL/h et gouttes/min (perfuseur standard 20 gouttes/mL). Rappel : une hypodermoclyse ne dépasse pas 1 à 1,5 L par site et par 24 h.",
    sources: "SFGG / SFAP recommandations hypodermoclyse ; pratique courante",
    fields: [
      { id: "vol", label: "Volume", unit: "mL", type: "number", min: 1, max: 5000 },
      { id: "h", label: "Durée : heures", unit: "h", type: "number", min: 0, max: 48, optional: true },
      { id: "min", label: "et minutes", unit: "min", type: "number", min: 0, max: 59, optional: true },
      { id: "gtt", label: "Perfuseur", type: "select", options: [["20", "20 gouttes/mL (standard)"], ["60", "60 gouttes/mL (micro-gouttes)"], ["15", "15 gouttes/mL (sang)"]] },
    ],
    compute: ({ vol, h = 0, min = 0, gtt }) => {
      const dur = (h || 0) * 60 + (min || 0);
      if (!dur) return { error: "Indiquer une durée." };
      const mlh = (vol / dur) * 60, gpm = (vol * Number(gtt)) / dur;
      const level = mlh > 125 ? "warn" : "ok";
      return { num: r1(mlh), unit: "mL/h", level, sub: [`${r0(gpm)} gouttes/min`, `${r0(gpm / 6 * 10) / 10} gouttes / 10 s`], text: level === "warn" ? "Au-delà de 125 mL/h en sous-cutané, risque d'œdème et de douleur au point de ponction : préférer deux sites ou allonger la durée." : "Débit compatible avec une hypodermoclyse par gravité (pas de pompe nécessaire)." };
    },
  },
  {
    id: "dose",
    title: "Calcul de dose",
    short: "Dose",
    tags: "calcul de dose, posologie, concentration, mg, mL, comprimé, règle de trois",
    resume: "Dose prescrite et présentation disponible → volume à prélever ou nombre d'unités.",
    sources: "Règle de trois ; vérification croisée recommandée pour les médicaments à haut risque",
    fields: [
      { id: "presc", label: "Dose prescrite", unit: "mg", type: "number", min: 0, step: 0.001 },
      { id: "dispo", label: "Présentation : quantité", unit: "mg", type: "number", min: 0, step: 0.001 },
      { id: "par", label: "contenue dans", unit: "mL ou unité", type: "number", min: 0, step: 0.01 },
    ],
    compute: ({ presc, dispo, par }) => {
      if (!dispo || !par) return { error: "Indiquer la présentation (ex. 10 mg dans 2 mL, ou 500 mg dans 1 comprimé)." };
      const q = (presc / dispo) * par;
      return { num: Math.round(q * 100) / 100, unit: "mL ou unités", level: "ok", text: `Concentration ${Math.round((dispo / par) * 1000) / 1000} mg par mL ou unité. Faire vérifier par une collègue pour insuline, anticoagulants, opioïdes, potassium.` };
    },
  },
  {
    id: "qtc",
    title: "QT corrigé",
    short: "QTc",
    tags: "QT, QTc, Bazett, Fridericia, ECG, torsade de pointes, médicaments allongeant le QT",
    resume: "QT mesuré et fréquence cardiaque → QTc selon Bazett et Fridericia (préférée si FC < 60 ou > 100).",
    sources: "ESC 2022 arythmies ventriculaires ; CredibleMeds",
    fields: [
      { id: "qt", label: "QT mesuré", unit: "ms", type: "number", min: 200, max: 800 },
      { id: "fc", label: "Fréquence cardiaque", unit: "/min", type: "number", min: 20, max: 250 },
      { id: "sexe", label: "Sexe", type: "select", options: [["F", "Femme"], ["H", "Homme"]] },
    ],
    compute: ({ qt, fc, sexe }) => {
      const rr = 60 / fc;
      const baz = qt / Math.sqrt(rr), fri = qt / Math.cbrt(rr);
      const seuil = sexe === "F" ? 460 : 450;
      const ref = fc < 60 || fc > 100 ? fri : baz;
      const level = ref > 500 ? "crit" : ref > seuil ? "warn" : "ok";
      return { num: r0(ref), unit: "ms", level, sub: [`Bazett ${r0(baz)} ms`, `Fridericia ${r0(fri)} ms`], text: level === "crit" ? "<strong>QTc > 500 ms</strong> : risque de torsade de pointes, prévenir le médecin, lister les médicaments allongeant le QT, vérifier kaliémie, magnésémie, calcémie." : level === "warn" ? `QTc > ${seuil} ms : allongé. Revoir les psychotropes, antiémétiques, antibiotiques (macrolides, fluoroquinolones) et les électrolytes.` : "QTc dans les limites." };
    },
  },
  {
    id: "calcium",
    title: "Calcémie corrigée",
    short: "Ca corrigé",
    tags: "calcium, calcémie corrigée, albumine, hypercalcémie, hypocalcémie, dénutrition",
    resume: "Chez l'âgé souvent hypoalbuminémique, la calcémie mesurée sous-estime la vraie calcémie. Ca corrigé = Ca + 0,02 × (40 − albumine).",
    sources: "Formule de Payne ; valeurs usuelles 2,20 – 2,60 mmol/L",
    fields: [
      { id: "ca", label: "Calcémie", unit: "mmol/L", type: "number", min: 0.5, max: 5, step: 0.01 },
      { id: "alb", label: "Albumine", unit: "g/L", type: "number", min: 5, max: 60, step: 0.1 },
    ],
    compute: ({ ca, alb }) => {
      const c = ca + 0.02 * (40 - alb);
      const level = c > 3 || c < 2 ? "crit" : c > 2.6 || c < 2.2 ? "warn" : "ok";
      return { num: Math.round(c * 100) / 100, unit: "mmol/L", level, text: c > 2.6 ? "<strong>Hypercalcémie</strong> : penser confusion, constipation, déshydratation, polyurie ; causes fréquentes : médicaments (vitamine D, calcium, thiazidiques), hyperparathyroïdie, cancer." : c < 2.2 ? "<strong>Hypocalcémie</strong> : vérifier vitamine D, magnésium, fonction rénale ; signes : crampes, paresthésies, QT long." : "Calcémie corrigée dans les valeurs usuelles." };
    },
  },
  {
    id: "tug",
    title: "Timed Up and Go (TUG) et appui unipodal",
    short: "TUG",
    tags: "TUG, Timed Up and Go, chute, marche, équilibre, appui unipodal, risque de chute, mobilité",
    resume: "Se lever d'un fauteuil à accoudoirs, marcher 3 m, faire demi-tour, revenir s'asseoir, à vitesse habituelle avec l'aide technique habituelle. ≥ 20 s = mobilité réduite, risque de chute élevé.",
    sources: "Podsiadlo D, Richardson S, J Am Geriatr Soc 1991 ; HAS 2009 Chutes répétées ; Vellas BJ et al. 1997 (appui unipodal)",
    fields: [
      { id: "tug", label: "Durée du TUG", unit: "s", type: "number", min: 1, max: 300, step: 0.1 },
      { id: "unipodal", label: "Appui unipodal (meilleur côté)", unit: "s", type: "number", min: 0, max: 60, step: 0.1, optional: true },
    ],
    compute: ({ tug, unipodal }) => {
      const level = tug >= 20 ? "crit" : tug > 13.5 ? "warn" : "ok";
      const sub = [];
      let extra = "";
      if (unipodal != null) { sub.push(`Appui unipodal ${unipodal} s`); if (unipodal < 5) extra = " Appui unipodal < 5 s : risque de chute traumatique augmenté."; }
      const txt = tug >= 20 ? "<strong>Mobilité réduite, risque de chute élevé</strong> : évaluation des chutes, kinésithérapie, aides techniques." : tug > 13.5 ? "<strong>Risque de chute augmenté</strong> : programme d'équilibre et de renforcement." : "Mobilité satisfaisante.";
      return { num: tug, unit: "s", level: extra && level === "ok" ? "warn" : level, sub, text: txt + extra + " Observer aussi la qualité : demi-tour décomposé, appui sur les accoudoirs, instabilité." };
    },
  },
  {
    id: "equianalgesie",
    title: "Équianalgésie des opioïdes (rotation)",
    short: "Équianalgésie",
    tags: "équianalgésie, rotation des opioïdes, morphine, oxycodone, fentanyl, patch, hydromorphone, tramadol, codéine, conversion, équivalence",
    resume: "Convertit une dose quotidienne d'opioïde en équivalent morphine orale, puis vers un autre opioïde. Réduire la nouvelle dose de 25 à 50 % (tolérance croisée incomplète), davantage chez l'âgé fragile.",
    sources: "SFETD 2016 et AFSOS 2019 Rotation des opioïdes ; ANSM ; Mercadante S, Caraceni A, Palliat Med 2011",
    fields: [
      { id: "from", label: "Opioïde actuel", type: "select", options: OPIOIDS.map((o) => [o.id, o.label]) },
      { id: "dose", label: "Dose par 24 h (µg/h pour un patch)", type: "number", min: 0, step: 0.1 },
      { id: "to", label: "Vers", type: "select", options: OPIOIDS.map((o) => [o.id, o.label]) },
    ],
    compute: ({ from, dose, to }) => {
      const a = OPIOIDS.find((o) => o.id === from), b = OPIOIDS.find((o) => o.id === to);
      const eqm = dose * a.factor;
      const target = eqm / b.factor;
      const red = [Math.round(target * 0.5 * 10) / 10, Math.round(target * 0.75 * 10) / 10];
      const sub = [`Équivalent morphine orale : ${Math.round(eqm)} mg/24 h`, `Équivalence brute : ${Math.round(target * 10) / 10} ${b.unit}`];
      if (b.id === "tramadol" && target > 300) sub.push("Au-delà du maximum du tramadol chez l'âgé (300 mg/j)");
      if (b.id === "fentanyl" && eqm < 30) sub.push("Patch le plus faible : 12 µg/h ≈ 30 mg de morphine orale");
      return { num: `${red[0]} – ${red[1]}`, unit: `${b.unit} (dose réduite de 25 à 50 %)`, level: "warn", sub, text: `Ratios indicatifs : ${a.label} → morphine orale × ${a.factor}. <strong>Décision et prescription médicales.</strong> Prévoir des interdoses (environ 1/10 à 1/6 de la dose quotidienne), réévaluer douleur et vigilance à 24 – 48 h. Patch de fentanyl : délai d'action de 12 à 24 h, poursuivre l'ancien opioïde 12 h après la pose.` };
    },
  },
  {
    id: "deficit-eau",
    title: "Déficit en eau (hypernatrémie)",
    short: "Déficit en eau",
    tags: "déficit hydrique, eau libre, hypernatrémie, déshydratation intracellulaire, eau totale, natrémie",
    resume: "Déficit (L) = eau totale × (Na / 140 − 1). Eau totale chez l'âgé ≈ 45 % du poids chez la femme, 50 % chez l'homme. Corriger en 48 à 72 h, baisse de la natrémie ≤ 10 mmol/L par 24 h.",
    sources: "Adrogué HJ, Madias NE, NEJM 2000 ; SFGG",
    fields: [
      { id: "na", label: "Natrémie", unit: "mmol/L", type: "number", min: 120, max: 200, step: 0.1 },
      { id: "poids", label: "Poids", unit: "kg", type: "number", min: 20, max: 250, step: 0.1 },
      { id: "sexe", label: "Sexe", type: "select", options: [["F", "Femme"], ["H", "Homme"]] },
    ],
    compute: ({ na, poids, sexe }) => {
      if (na <= 145) return { num: 0, unit: "L", level: "ok", text: "Pas d'hypernatrémie : pas de déficit en eau libre calculable." };
      const act = poids * (sexe === "F" ? 0.45 : 0.5);
      const def = act * (na / 140 - 1);
      return { num: r1(def), unit: "L", level: na >= 155 ? "crit" : "warn", sub: [`Eau totale estimée ${r1(act)} L`], text: "À ajouter aux besoins de base (≈ 30 mL/kg/j) et aux pertes en cours (fièvre, diarrhée). Apport d'eau libre (boissons, eau gélifiée, glucosé 5 % SC ou IV) <strong>sur prescription</strong>, sur 48 à 72 h, natrémie de contrôle à 6 – 12 h." };
    },
  },
  {
    id: "besoins",
    title: "Besoins nutritionnels et hydriques",
    short: "Besoins",
    tags: "besoins nutritionnels, calories, kcal, protéines, eau, hydratation, dénutrition, apports, CNO",
    resume: "Personne âgée : 30 kcal/kg/j (30 à 40 si dénutrition ou agression), protéines 1 à 1,2 g/kg/j (1,2 à 1,5 si dénutrition), eau ≈ 30 mL/kg/j.",
    sources: "HAS 2021 Dénutrition ≥ 70 ans ; ESPEN 2022 Geriatrics",
    fields: [
      { id: "poids", label: "Poids", unit: "kg", type: "number", min: 20, max: 250, step: 0.1 },
      { id: "etat", label: "Situation", type: "select", options: [["n", "Pas de dénutrition"], ["d", "Dénutrition ou maladie aiguë"]] },
      { id: "fievre", label: "Température", unit: "°C", type: "number", min: 34, max: 42, step: 0.1, optional: true },
    ],
    compute: ({ poids, etat, fievre }) => {
      const d = etat === "d";
      const kcal = d ? [30 * poids, 40 * poids] : [30 * poids, 30 * poids];
      const prot = d ? [1.2 * poids, 1.5 * poids] : [1 * poids, 1.2 * poids];
      let eau = 30 * poids;
      if (fievre && fievre > 37) eau += Math.round((fievre - 37) * 400);
      return { num: kcal[0] === kcal[1] ? r0(kcal[0]) : `${r0(kcal[0])} – ${r0(kcal[1])}`, unit: "kcal/j", level: "ok", sub: [`Protéines ${r0(prot[0])} – ${r0(prot[1])} g/j`, `Eau ≈ ${r0(eau / 50) * 50} mL/j (boissons + aliments)`], text: "Un complément nutritionnel oral standard apporte environ 300 kcal et 20 g de protéines (vérifier le produit). Répartir les protéines sur les repas, collations enrichies." };
    },
  },
  {
    id: "osmolarite",
    title: "Osmolarité plasmatique calculée",
    short: "Osmolarité",
    tags: "osmolarité, osmolalité, hyperosmolaire, natrémie, glycémie, urée, déshydratation, coma hyperosmolaire",
    resume: "Osmolarité efficace = 2 × Na + glycémie (mmol/L). Normale 285 à 295 mOsm/L ; > 320 dans le syndrome d'hyperglycémie hyperosmolaire.",
    sources: "ADA Hyperglycemic crises 2024 ; formules classiques de biochimie",
    fields: [
      { id: "na", label: "Natrémie", unit: "mmol/L", type: "number", min: 100, max: 200, step: 0.1 },
      { id: "gly", label: "Glycémie", unit: "g/L", type: "number", min: 0.2, max: 20, step: 0.01 },
      { id: "uree", label: "Urée", unit: "mmol/L", type: "number", min: 0, max: 100, step: 0.1, optional: true },
    ],
    compute: ({ na, gly, uree }) => {
      const g = gly * 5.55;
      const eff = 2 * na + g;
      const sub = [`Glycémie ${r1(g)} mmol/L`];
      if (uree != null) sub.push(`Osmolarité totale ${r0(eff + uree)} mOsm/L`);
      const level = eff > 320 ? "crit" : eff > 295 || eff < 275 ? "warn" : "ok";
      return { num: r0(eff), unit: "mOsm/L (efficace)", level, sub, text: eff > 320 ? "<strong>Hyperosmolarité majeure</strong> : risque de coma hyperosmolaire, avis médical urgent." : eff > 295 ? "Hyperosmolarité : déshydratation intracellulaire, hydrater selon prescription." : eff < 275 ? "Hypo-osmolarité (hyponatrémie vraie probable)." : "Osmolarité normale." };
    },
  },
];

export const calcById = Object.fromEntries(CALCULATORS.map((c) => [c.id, c]));
