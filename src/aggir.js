// Algorithme officiel de la grille AGGIR — annexe 2 du décret n° 2008-821 du 21 août 2008
// (article R. 232-3 et annexe 2-2 du Code de l'action sociale et des familles).
// Valeurs recopiées de l'annexe officielle le 14/11/2026 ; ne pas modifier sans source.
// Ordre des variables : cohérence, orientation, toilette, habillage, alimentation, élimination,
// transferts, déplacements intérieurs, déplacements extérieurs, alerter (communication à distance).
export const VARS = ["coh", "ori", "toi", "hab", "ali", "eli", "tra", "din", "dex", "ale"];

const GROUPS = [
  { name: "A", C: [2000, 1200, 40, 40, 60, 100, 800, 200, 0, 0], B: [0, 0, 16, 16, 20, 16, 120, 32, 0, 0], ranks: [[4380, 1], [4140, 2], [3390, 3]] },
  { name: "B", C: [1500, 1200, 40, 40, 60, 100, 800, -80, 0, 0], B: [320, 120, 16, 16, 0, 16, 120, -40, 0, 0], ranks: [[2016, 4]] },
  { name: "C", C: [0, 0, 40, 40, 60, 160, 1000, 400, 0, 0], B: [0, 0, 16, 16, 20, 20, 200, 40, 0, 0], ranks: [[1700, 5], [1432, 6]] },
  { name: "D", C: [0, 0, 0, 0, 2000, 400, 2000, 200, 0, 0], B: [0, 0, 0, 0, 200, 200, 200, 0, 0, 0], ranks: [[2400, 7]] },
  { name: "E", C: [400, 400, 400, 400, 400, 800, 800, 200, 0, 0], B: [0, 0, 100, 100, 100, 100, 100, 0, 0, 0], ranks: [[1200, 8]] },
  { name: "F", C: [200, 200, 500, 500, 500, 500, 500, 500, 200, 0], B: [0, 100, 100, 100, 100, 100, 100, 0, 0, 0], ranks: [[800, 9]] },
  { name: "G", C: [150, 150, 300, 300, 500, 500, 400, 200, 0, 0], B: [0, 0, 200, 200, 200, 200, 200, 100, 0, 0], ranks: [[650, 10]] },
  { name: "H", C: [0, 0, 3000, 3000, 3000, 3000, 1000, 1000, 0, 0], B: [0, 0, 2000, 2000, 2000, 2000, 2000, 1000, 0, 0], ranks: [[4000, 11], [2000, 12]], last: 13 },
];

const RANK_TO_GIR = { 1: 1, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 4, 11: 4, 12: 5, 13: 6 };

/** @param {Record<string,"A"|"B"|"C">} mods modalités par variable (clés de VARS) */
export function computeGIR(mods) {
  const trace = [];
  for (const g of GROUPS) {
    let total = 0;
    VARS.forEach((v, i) => { const m = mods[v]; if (m === "C") total += g.C[i]; else if (m === "B") total += g.B[i]; });
    trace.push({ group: g.name, total });
    for (const [seuil, rank] of g.ranks) if (total >= seuil) return { rank, gir: RANK_TO_GIR[rank], trace };
    if (g.last) return { rank: g.last, gir: RANK_TO_GIR[g.last], trace };
  }
  return null;
}

// Règles de synthèse des sous-variables, recopiées du guide d'utilisation AGGIR (CNAMTS, janvier 2008,
// annexe 2-1 du CASF) : toilette p. 10, élimination p. 12, habillage p. 14, alimentation p. 17,
// orientation p. 27, cohérence p. 29.
const allA = (...m) => m.every((x) => x === "A");
const allC = (...m) => m.every((x) => x === "C");
const anyC = (...m) => m.some((x) => x === "C");
export const COMBINE = {
  toilette: (h, b) => (allA(h, b) ? "A" : allC(h, b) ? "C" : "B"),                       // AA = A ; CC = C ; autres = B
  habillage: (h, m, b) => (allA(h, m, b) ? "A" : allC(h, m, b) ? "C" : "B"),             // AAA = A ; CCC = C ; autres = B
  alimentation: (s, m) => (allA(s, m) ? "A" : allC(s, m) || (s === "B" && m === "C") || (s === "C" && m === "B") ? "C" : "B"), // AA = A ; CC, BC, CB = C ; autres = B
  elimination: (u, f) => (allA(u, f) ? "A" : anyC(u, f) ? "C" : "B"),                    // AA = A ; CC, CB, BC, CA, AC = C ; autres = B
  orientation: (t, e) => (allA(t, e) ? "A" : anyC(t, e) ? "C" : "B"),                    // AA = A ; AB, BA, BB = B ; un C = C
  coherence: (c, k) => (allA(c, k) ? "A" : anyC(c, k) ? "C" : "B"),                      // AA = A ; AB, BA, BB = B ; un C = C
};

export const GIR_TEXT = {
  1: ["Personne confinée au lit ou au fauteuil, dont les fonctions mentales sont gravement altérées, ou en fin de vie : présence indispensable et continue d'intervenants.", "crit"],
  2: ["Confinée au lit ou au fauteuil avec des fonctions mentales non totalement altérées, ou fonctions mentales altérées mais déplacements possibles (déambulation) : prise en charge pour la plupart des activités de la vie courante.", "crit"],
  3: ["Autonomie mentale conservée, autonomie locomotrice partielle : aide plusieurs fois par jour pour l'autonomie corporelle (toilette, habillage, élimination).", "warn"],
  4: ["N'assume pas seule ses transferts mais se déplace à l'intérieur une fois levée (aide pour toilette et habillage), ou pas de problème locomoteur mais aide pour les activités corporelles et les repas.", "warn"],
  5: ["Aide ponctuelle pour la toilette, la préparation des repas et le ménage. Pas de droit à l'APA (aide ménagère possible via la caisse de retraite).", "ok"],
  6: ["Autonome pour les actes essentiels de la vie courante.", "ok"],
};
