// Tests de l'algorithme AGGIR (node scripts/test-aggir.mjs). Cas construits à la main depuis l'annexe 2.
import { computeGIR, COMBINE, VARS } from "../src/aggir.js";

const mods = (m) => Object.fromEntries(VARS.map((v) => [v, m]));
const cases = [
  // tout C : groupe A = 2000+1200+40+40+60+100+800+200 = 4440 ≥ 4380 → rang 1 → GIR 1
  { name: "tout C", m: mods("C"), rank: 1, gir: 1 },
  // tout A : aucun point → groupe H total 0 → rang 13 → GIR 6
  { name: "tout A", m: mods("A"), rank: 13, gir: 6 },
  // tout B : A 220, B 568, C 312, D 600, E 500, F 600, G 1100 ≥ 650 → rang 10 → GIR 4
  { name: "tout B", m: mods("B"), rank: 10, gir: 4 },
  // grabataire lucide : cohérence/orientation A, le reste C → A : 40+40+60+100+800+200 = 1240 ; B : 1240-80 = 1160 ; C : 40+40+60+160+1000+400 = 1700 ≥ 1700 → rang 5 → GIR 2
  { name: "grabataire lucide", m: { ...mods("C"), coh: "A", ori: "A" }, rank: 5, gir: 2 },
  // dément déambulant : cohérence C, orientation C, transferts A, déplacements A, le reste B → A : 2000+1200+16+16+20+16 = 3268 < 3390 ; B : 1500+1200+16+16+0+16 = 2748 ≥ 2016 → rang 4 → GIR 2
  { name: "dément déambulant", m: { coh: "C", ori: "C", toi: "B", hab: "B", ali: "B", eli: "B", tra: "A", din: "A", dex: "C", ale: "C" }, rank: 4, gir: 2 },
  // aide ponctuelle toilette seulement : toilette B, reste A → … H : 2000 ≥ 2000 → rang 12 → GIR 5
  { name: "toilette B seule", m: { ...mods("A"), toi: "B" }, rank: 12, gir: 5 },
  // toilette C, habillage C, reste A → A 80, B 80, C 80, D 0, E 800, F 1000 ≥ 800 → rang 9 → GIR 3
  { name: "toilette C + habillage C", m: { ...mods("A"), toi: "C", hab: "C" }, rank: 9, gir: 3 },
];
let ko = 0;
for (const c of cases) {
  const r = computeGIR(c.m);
  const ok = r.rank === c.rank && r.gir === c.gir;
  if (!ok) ko++;
  console.log(`${ok ? "OK " : "KO "} ${c.name} → rang ${r.rank}, GIR ${r.gir} (attendu rang ${c.rank}, GIR ${c.gir})`);
}
const combos = [
  ["toilette", ["A", "A"], "A"], ["toilette", ["A", "C"], "B"], ["toilette", ["C", "C"], "C"],
  ["habillage", ["A", "A", "A"], "A"], ["habillage", ["C", "C", "B"], "B"], ["habillage", ["C", "C", "C"], "C"],
  ["alimentation", ["A", "A"], "A"], ["alimentation", ["B", "C"], "C"], ["alimentation", ["C", "B"], "C"], ["alimentation", ["A", "C"], "B"], ["alimentation", ["B", "B"], "B"],
  ["elimination", ["A", "A"], "A"], ["elimination", ["A", "C"], "C"], ["elimination", ["B", "B"], "B"],
  ["orientation", ["A", "B"], "B"], ["orientation", ["C", "A"], "C"], ["coherence", ["B", "C"], "C"],
];
for (const [rule, args, want] of combos) {
  const got = COMBINE[rule](...args);
  if (got !== want) ko++;
  console.log(`${got === want ? "OK " : "KO "} ${rule} ${args.join("")} → ${got} (attendu ${want})`);
}
if (ko) { console.error(`${ko} test(s) en échec`); process.exit(1); }
console.log("Tous les tests AGGIR passent.");
