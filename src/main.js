// Mémo IDE Géronto — moteur : recherche, chapitres, fiches, échelles interactives, calculateurs,
// favoris, récents, taille de texte, détection de mise à jour. Aucune donnée patient n'est conservée.
import DATA from "./generated/data.json";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { esc, norm } from "./util.js";
import { renderScale, scaleSearchText } from "./scales.js";
import { CALCULATORS } from "./calculators.js";
import { renderCalc } from "./calc-ui.js";
import { getFavs, isFav, toggleFav, getRecent, pushRecent, getSize, applySize, nextSize } from "./prefs.js";
import { checkForUpdate } from "./update.js";
import { renderAnnuaire } from "./annuaire.js";

const CATS = DATA.chapters;
const CAT_ORDER = Object.keys(CATS);

/* ---------- Corpus : fiches + échelles + calculateurs ---------- */
const scaleEntries = (DATA.scales || []).map((s) => ({ id: `scale-${s.id}`, cat: "echelles", kind: "scale", scale: s, title: s.title, short: s.short || "", tags: s.tags || "", resume: s.resume || "", sources: s.sources || "", updated: s.updated ? String(s.updated) : "", order: s.order ?? 500, text: scaleSearchText(s), html: "" }));
const calcEntries = CALCULATORS.map((c, i) => ({ id: `calc-${c.id}`, cat: "calc", kind: "calc", calc: c, title: c.title, short: c.short || "", tags: c.tags || "", resume: c.resume || "", sources: c.sources || "", order: i, text: "", html: "" }));
const annuaireEntry = { id: "annuaire", cat: "reperes", kind: "annuaire", title: "Annuaire local (à compléter)", short: "Annuaire", tags: "annuaire, téléphone, numéros, contacts, DAC, HAD, EMSP, astreinte, assistante sociale", resume: "Vos contacts professionnels du territoire, enregistrés sur ce téléphone uniquement.", order: 0, text: "", html: "" };
const E = [...DATA.entries, ...scaleEntries, ...calcEntries, annuaireEntry];
const byId = Object.fromEntries(E.map((e) => [e.id, e]));
const scaleForEntry = Object.fromEntries(scaleEntries.filter((s) => s.scale.entry).map((s) => [s.scale.entry, s.id]));
for (const e of E) { e._t = norm(e.title); e._g = norm(e.tags); e._r = norm(e.resume); e._x = norm(e.text); }
const SOS = (DATA.home.sos || []).filter((id) => byId[id]);
const QUICK = (DATA.home.quick || []).filter((id) => byId[id]);

const app = document.getElementById("app");
const qInput = document.getElementById("q");
const clearBtn = document.getElementById("clear");
document.getElementById("brand-meta").textContent = `v${__APP_VERSION__} · ${DATA.entries.length} fiches · ${scaleEntries.length} échelles`;

/* ---------- Recherche ---------- */
const STOP = new Set("de la le les du des et en a au aux un une d l pour par sur avec dans que qui est ce ou".split(" "));
const SYN = DATA.synonyms || {};
const tokens = (q) => norm(q).split(/[^a-z0-9.%]+/).filter((t) => t && !STOP.has(t) && (t.length > 1 || /\d/.test(t)));
function wordStart(field, t) { let i = field.indexOf(t); while (i >= 0) { if (i === 0 || /[^a-z0-9]/.test(field[i - 1])) return true; i = field.indexOf(t, i + 1); } return false; }
function scoreEntry(e, toks, qn) {
  let total = 0;
  for (const t of toks) {
    const alts = [t, ...(SYN[t] || [])]; let s = 0;
    for (const a of alts) {
      if (wordStart(e._t, a)) s = Math.max(s, 14); else if (e._t.includes(a)) s = Math.max(s, 9);
      if (s < 7 && e._g.includes(a)) s = Math.max(s, wordStart(e._g, a) ? 8 : 6);
      if (s < 3 && e._r.includes(a)) s = Math.max(s, 3);
      if (s < 1 && a.length > 1 && e._x.includes(a)) s = 1;
    }
    if (!s) return 0; total += s;
  }
  if (qn.length > 3 && e._t.includes(qn)) total += 12; else if (qn.length > 3 && (e._g.includes(qn) || e._x.includes(qn))) total += 10;
  return total;
}
function search(q) {
  const toks = tokens(q), qn = norm(q).trim();
  if (!toks.length) return { entries: [], toks };
  return { entries: E.map((e) => [scoreEntry(e, toks, qn), e]).filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0] || a[1].title.localeCompare(b[1].title)).map((x) => x[1]), toks };
}
function highlight(text, toks) {
  const n = norm(text); if (n.length !== text.length) return esc(text);
  const ranges = [];
  for (const t of toks) { if (t.length < 2) continue; let i = n.indexOf(t); while (i >= 0) { ranges.push([i, i + t.length]); i = n.indexOf(t, i + t.length); } }
  if (!ranges.length) return esc(text);
  ranges.sort((a, b) => a[0] - b[0]); let out = "", last = 0;
  for (const [a, b] of ranges) { if (a < last) continue; out += esc(text.slice(last, a)) + "<mark>" + esc(text.slice(a, b)) + "</mark>"; last = b; }
  return out + esc(text.slice(last));
}
function snippet(e, toks) {
  if (!e.text || e._x.length !== e.text.length) return "";
  let best = -1; for (const t of toks) { const i = e._x.indexOf(t); if (i >= 0 && (best < 0 || i < best)) best = i; }
  if (best < 0 || e._r.includes(toks[0])) return "";
  const a = Math.max(0, best - 60), b = Math.min(e.text.length, best + 110);
  return (a > 0 ? "…" : "") + highlight(e.text.slice(a, b), toks) + (b < e.text.length ? "…" : "");
}

/* ---------- Rendu ---------- */
const cc = (cat) => `--cc: var(--c-${cat})`;
const pill = (cat) => `<span class="pill" style="${cc(cat)}">${esc(CATS[cat].short)}</span>`;
const kindTag = (e) => (e.kind === "scale" ? `<span class="kind">échelle</span>` : e.kind === "calc" ? `<span class="kind">calcul</span>` : "");
function itemHTML(e, toks) {
  const sn = toks ? snippet(e, toks) : "";
  return `<a class="item" href="#e-${e.id}"><span class="it">${toks ? pill(e.cat) : ""}${kindTag(e)}${toks ? highlight(e.title, toks) : esc(e.title)}</span>
    ${e.resume ? `<span class="ir">${toks ? highlight(e.resume, toks) : esc(e.resume)}</span>` : ""}${sn ? `<span class="is">${sn}</span>` : ""}</a>`;
}
const chips = (ids, style) => `<div class="sos" ${style ? `style="${style}"` : ""}>${ids.map((id) => `<a href="#e-${id}">${esc(byId[id].short || byId[id].title)}</a>`).join("")}</div>`;
const backBar = (e) => `<div class="crumb"><button class="back" type="button" data-back>← Retour</button>${e ? pill(e.cat) : ""}${e ? `<button class="fav ${isFav(e.id) ? "on" : ""}" type="button" data-fav="${esc(e.id)}" aria-pressed="${isFav(e.id)}" title="Favori">${isFav(e.id) ? "★" : "☆"}</button>` : ""}</div>`;
const DISCLAIMER = `<p class="foot">Aide-mémoire pour la prise en soin de la personne âgée. Il ne remplace ni la prescription médicale, ni les protocoles de l'établissement, ni le jugement clinique. Contenu rédigé avec l'aide d'une IA à partir des recommandations citées sur chaque fiche, en cours de validation par des professionnels de terrain : signalez toute erreur.</p>`;
const sourcesHTML = (e) => (e.sources ? `<p class="sources">Sources : ${esc(e.sources)}${e.updated ? ` · mis à jour ${esc(e.updated)}` : ""}</p>` : "");

function renderHome() {
  const counts = {}; for (const e of E) counts[e.cat] = (counts[e.cat] || 0) + 1;
  const recent = getRecent().filter((id) => byId[id]), favs = getFavs().filter((id) => byId[id]);
  app.innerHTML = `<div class="view"><div id="update-slot"></div>
    ${SOS.length ? `<section><h2 class="section">Situation aiguë</h2>${chips(SOS)}</section>` : ""}
    ${QUICK.length ? `<section><h2 class="section">Échelles du quotidien</h2>${chips(QUICK, cc("echelles"))}</section>` : ""}
    ${favs.length ? `<section><h2 class="section">Favoris</h2><div class="recent">${favs.map((id) => `<a href="#e-${id}">★ ${esc(byId[id].short || byId[id].title)}</a>`).join("")}</div></section>` : ""}
    ${recent.length ? `<section><h2 class="section">Consultées récemment</h2><div class="recent">${recent.map((id) => `<a href="#e-${id}">${esc(byId[id].short || byId[id].title)}</a>`).join("")}</div></section>` : ""}
    <section><h2 class="section">Chapitres</h2><div class="chapters">${CAT_ORDER.map((k) => { const c = CATS[k]; const unit = k === "echelles" ? "échelles et fiches" : k === "calc" ? "outils" : "fiches";
      return `<a class="chap" href="#c-${k}" style="${cc(k)}"><span class="tab">${esc(c.n)}</span><span class="t">${esc(c.label)}</span><span class="s">${counts[k] || 0} ${unit} · ${esc(c.sub)}</span></a>`; }).join("")}</div></section>
    <p class="note">Tapez un mot dans la recherche : nom de fiche, échelle, médicament, sigle. L'étoile ☆ en haut d'une fiche l'ajoute aux favoris.</p>${DISCLAIMER}</div>`;
  if (pendingUpdate) showUpdate(pendingUpdate);
}
function renderCat(cat) {
  const c = CATS[cat]; if (!c) return renderHome();
  const list = E.filter((e) => e.cat === cat).sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
  app.innerHTML = `<div class="view" style="${cc(cat)}">${backBar()}<div class="chap-head"><span class="num">Chapitre ${esc(c.n)}</span><h1>${esc(c.label)}</h1><span class="note">${esc(c.sub)}</span></div>
    ${list.length ? `<div class="list">${list.map((e) => itemHTML(e)).join("")}</div>` : `<div class="empty">Chapitre en cours de rédaction.</div>`}</div>`;
}
function renderEntry(id) {
  const e = byId[id]; if (!e) return renderHome();
  pushRecent(id);
  const linkedScale = scaleForEntry[e.id];
  const linkedEntry = e.kind === "scale" && e.scale.entry && byId[e.scale.entry] ? e.scale.entry : null;
  app.innerHTML = `<div class="view" style="${cc(e.cat)}">${backBar(e)}<article class="entry"><h1>${kindTag(e)}${esc(e.title)}</h1>${e.resume ? `<p class="lead">${esc(e.resume)}</p>` : ""}
    ${linkedScale ? `<a class="cta" href="#e-${linkedScale}">Ouvrir l'échelle interactive →</a>` : ""}
    <div class="tool"></div>${e.html ? `<div class="content">${e.html}</div>` : ""}
    ${linkedEntry ? `<a class="cta soft" href="#e-${linkedEntry}">Fiche explicative : ${esc(byId[linkedEntry].title)} →</a>` : ""}
    ${sourcesHTML(e)}${DISCLAIMER}</article></div>`;
  const tool = app.querySelector(".tool");
  if (e.kind === "scale") renderScale(e.scale, tool, byId); else if (e.kind === "calc") renderCalc(e.calc, tool); else if (e.kind === "annuaire") renderAnnuaire(tool); else tool.remove();
  window.scrollTo(0, 0);
}
function renderSearch(q) {
  const { entries, toks } = search(q);
  app.innerHTML = `<div class="view">${entries.length ? `<div class="list">${entries.slice(0, 60).map((e) => itemHTML(e, toks)).join("")}</div>` : `<div class="empty">Aucune fiche pour « ${esc(q)} ».</div>`}</div>`;
}

/* ---------- Mise à jour ---------- */
let pendingUpdate = null;
function showUpdate(u) {
  const slot = document.getElementById("update-slot"); if (!slot) return;
  slot.innerHTML = `<div class="banner"><span>Version <strong>${esc(u.version)}</strong> disponible.</span><a href="${esc(u.url)}" target="_blank" rel="noopener">Télécharger</a><button type="button" class="back" data-skip>Ignorer</button></div>`;
  slot.querySelector("[data-skip]").addEventListener("click", () => { u.skip(); pendingUpdate = null; slot.innerHTML = ""; });
}

/* ---------- Navigation ---------- */
function route() {
  const h = decodeURIComponent(location.hash || "");
  if (qInput.value && !h.startsWith("#q=")) { qInput.value = ""; clearBtn.hidden = true; }
  if (h.startsWith("#e-")) return renderEntry(h.slice(3));
  if (h.startsWith("#c-")) return renderCat(h.slice(3));
  if (h === "#annuaire") return renderEntry("annuaire");
  if (h.startsWith("#q=")) { qInput.value = h.slice(3); clearBtn.hidden = false; return renderSearch(h.slice(3)); }
  renderHome();
}
let timer;
qInput.addEventListener("input", () => { clearBtn.hidden = !qInput.value; clearTimeout(timer); timer = setTimeout(() => { const v = qInput.value.trim(); history.replaceState(null, "", v ? "#q=" + encodeURIComponent(v) : "#"); route(); }, 120); });
clearBtn.addEventListener("click", () => { qInput.value = ""; clearBtn.hidden = true; location.hash = ""; qInput.focus(); });
app.addEventListener("click", (ev) => {
  const back = ev.target.closest("[data-back]"); if (back) { ev.preventDefault(); history.length > 1 ? history.back() : (location.hash = ""); return; }
  const fav = ev.target.closest("[data-fav]"); if (fav) { const on = toggleFav(fav.dataset.fav); fav.classList.toggle("on", on); fav.textContent = on ? "★" : "☆"; fav.setAttribute("aria-pressed", on); }
});
const sizeBtn = document.getElementById("size");
applySize(getSize());
sizeBtn.addEventListener("click", () => { applySize(nextSize()); sizeBtn.setAttribute("aria-label", `Taille du texte : ${getSize()}`); });
window.addEventListener("hashchange", route);
route();
checkForUpdate(__APP_VERSION__, (u) => { pendingUpdate = u; showUpdate(u); });

/* Bouton retour Android */
if (Capacitor.isNativePlatform()) {
  App.addListener("backButton", ({ canGoBack }) => { if (location.hash && location.hash !== "#") { if (canGoBack) history.back(); else location.hash = ""; } else App.exitApp(); });
}
