// Échelles interactives, rendues depuis les YAML de content/scales/.
// Trois types : criteria (règle booléenne), sum (somme de points + tranches), grid (grille AGGIR).
import { esc } from "./util.js";
import { VARS, computeGIR, COMBINE, GIR_TEXT } from "./aggir.js";

const resultHTML = ({ num, max, level, text, link, linkLabel, sub, provisional }) => `
  <div class="result ${level || ""}">
    ${num != null ? `<div class="res-row"><span class="res-num">${esc(num)}${max != null ? `<span class="res-unit"> / ${esc(max)}</span>` : ""}</span>${provisional ? `<span class="res-unit">provisoire : ${esc(provisional)}</span>` : ""}</div>` : ""}
    ${text ? `<div class="res-text">${text}</div>` : ""}
    ${sub && sub.length ? `<div class="subscores">${sub.map((s) => `<span>${esc(s)}</span>`).join("")}</div>` : ""}
    ${link ? `<a class="res-link" href="#e-${esc(link)}">${esc(linkLabel || "Voir la fiche")} →</a>` : ""}
  </div>`;

/* ---------- criteria ---------- */
function compileRule(rule, ids) {
  if (!/^[a-z0-9_\s&|!()]+$/i.test(rule)) throw new Error("règle invalide");
  const used = rule.match(/[a-z][a-z0-9_]*/gi) || [];
  for (const u of used) if (!ids.includes(u)) throw new Error(`item inconnu « ${u} »`);
  return new Function(...ids, `return !!(${rule});`);
}
function renderCriteria(s, box, byId) {
  const ids = s.items.map((i) => i.id);
  const fn = compileRule(s.rule, ids);
  box.innerHTML = `<div class="checks">${s.items.map((i) => `<label><input type="checkbox" data-id="${esc(i.id)}"><span><strong>${esc(i.label)}</strong>${i.help ? `<br><small>${esc(i.help)}</small>` : ""}</span></label>`).join("")}</div><div class="res"></div>`;
  const update = () => {
    const vals = ids.map((id) => box.querySelector(`[data-id="${id}"]`).checked);
    const pos = fn(...vals);
    const it = pos ? s.interpretation.positive : s.interpretation.negative;
    box.querySelector(".res").innerHTML = resultHTML({ level: it.level, text: `<strong>${esc(it.text)}</strong>`, link: it.link && byId[it.link] ? it.link : null, linkLabel: it.link && byId[it.link] ? byId[it.link].title : null });
  };
  box.addEventListener("change", update);
  update();
}

/* ---------- sum ---------- */
export function sumMax(s) {
  return s.items.reduce((t, i) => t + (i.options ? Math.max(...i.options.map((o) => Number(o.points) || 0)) : i.scores ? 1 : Number(i.points ?? 1)), 0);
}
function renderSum(s, box, byId) {
  const max = sumMax(s);
  box.innerHTML = `${s.intro ? `<p class="calc-ex">${esc(s.intro)}</p>` : ""}<div class="items">${s.items.map((i, n) => {
    if (i.options) return `<fieldset class="sitem"><legend>${esc(i.label)}</legend><div class="opts">${i.options.map((o, k) => `<label><input type="radio" name="${esc(i.id)}" value="${k}" data-points="${Number(o.points) || 0}"><span>${esc(o.label)}</span><em>${Number(o.points) || 0}</em></label>`).join("")}</div></fieldset>`;
    if (i.scores) { const oui = i.scores === "oui" ? 1 : 0; return `<fieldset class="sitem yn"><legend><span class="n">${n + 1}.</span> ${esc(i.label)}</legend><div class="opts row"><label><input type="radio" name="${esc(i.id)}" value="oui" data-points="${oui}"><span>Oui</span></label><label><input type="radio" name="${esc(i.id)}" value="non" data-points="${1 - oui}"><span>Non</span></label></div></fieldset>`; }
    return `<label class="sitem chk"><input type="checkbox" name="${esc(i.id)}" data-points="${Number(i.points ?? 1)}"><span>${esc(i.label)}</span><em>${Number(i.points ?? 1)}</em></label>`;
  }).join("")}</div><div class="res"></div>`;
  const update = () => {
    let total = 0, answered = 0;
    for (const i of s.items) {
      const sel = box.querySelector(`[name="${i.id}"]:checked`);
      if (i.options || i.scores) { if (sel) { answered++; total += Number(sel.dataset.points); } }
      else { answered++; if (sel) total += Number(sel.dataset.points); }
    }
    const complete = answered === s.items.length;
    const range = (s.ranges || []).find((r) => (r.min == null || total >= r.min) && (r.max == null || total <= r.max));
    const link = range && range.link && byId[range.link] ? range.link : null;
    box.querySelector(".res").innerHTML = resultHTML({ num: total, max, level: complete ? range && range.level : "", text: range ? `<strong>${esc(range.text)}</strong>` : "", link, linkLabel: link ? byId[link].title : null, provisional: complete ? null : `${answered} / ${s.items.length} items renseignés` });
  };
  box.addEventListener("change", update);
  update();
}

/* ---------- grid (AGGIR) ---------- */
const seg = (name) => `<div class="seg" role="radiogroup">${["A", "B", "C"].map((m) => `<label><input type="radio" name="${esc(name)}" value="${m}"><span>${m}</span></label>`).join("")}</div>`;
function renderGrid(s, box) {
  box.innerHTML = `${s.intro ? `<p class="calc-ex">${esc(s.intro)}</p>` : ""}
  <div class="adverbes callout tip"><span class="callout-label">Cotation</span><p><strong>A</strong> : fait seul, spontanément, totalement, habituellement et correctement. <strong>C</strong> : ne fait pas, ou aucun des quatre adverbes. <strong>B</strong> : tout le reste (fait partiellement, pas habituellement, pas correctement, ou sur stimulation).</p></div>
  <div class="items">${s.variables.map((v) => `<fieldset class="sitem grid" data-var="${esc(v.id)}"><legend>${esc(v.label)}${v.discriminant === false ? ` <small>(non comptée pour le GIR)</small>` : ""}</legend>${v.help ? `<p class="help">${esc(v.help)}</p>` : ""}
    ${v.sub ? `<div class="subs">${v.sub.map((u) => `<div class="subrow"><span>${esc(u.label)}</span>${seg(`${v.id}.${u.id}`)}</div>`).join("")}<div class="subrow synth"><span>Synthèse ${esc(v.label.toLowerCase())}</span><strong class="mod" data-mod="${esc(v.id)}">—</strong></div></div>` : seg(v.id)}
  </fieldset>`).join("")}</div><div class="res"></div>`;
  const val = (name) => { const r = box.querySelector(`[name="${name}"]:checked`); return r ? r.value : null; };
  const update = () => {
    const mods = {};
    for (const v of s.variables) {
      if (v.sub) {
        const subs = v.sub.map((u) => val(`${v.id}.${u.id}`));
        const m = subs.every(Boolean) ? COMBINE[v.combine](...subs) : null;
        box.querySelector(`[data-mod="${v.id}"]`).textContent = m || "—";
        if (m) mods[v.id] = m;
      } else { const m = val(v.id); if (m) mods[v.id] = m; }
    }
    const needed = VARS.filter((v) => !["dex", "ale"].includes(v));
    const missing = needed.filter((v) => !mods[v]);
    if (missing.length) { box.querySelector(".res").innerHTML = resultHTML({ num: "GIR ?", level: "", provisional: `${needed.length - missing.length} / ${needed.length} variables discriminantes codées` }); return; }
    const r = computeGIR(mods);
    const [txt, level] = GIR_TEXT[r.gir];
    box.querySelector(".res").innerHTML = resultHTML({ num: `GIR ${r.gir}`, level, text: `<strong>${esc(txt)}</strong>${r.gir <= 4 ? " Ouvre droit à l'APA." : ""}`, sub: [`Rang ${r.rank}`, ...r.trace.map((t) => `Groupe ${t.group} : ${t.total}`)] });
  };
  box.addEventListener("change", update);
  update();
}

/* ---------- entrée ---------- */
export function renderScale(s, box, byId) {
  box.classList.add("scale");
  if (s.type === "criteria") renderCriteria(s, box, byId);
  else if (s.type === "sum") renderSum(s, box, byId);
  else if (s.type === "grid") renderGrid(s, box);
  else box.innerHTML = `<div class="empty">Type d'échelle inconnu : ${esc(s.type)}</div>`;
}
export const scaleSearchText = (s) => [s.intro, ...(s.items || s.variables || []).map((i) => [i.label, i.help, ...(i.options || []).map((o) => o.label)].join(" "))].join(" ");
