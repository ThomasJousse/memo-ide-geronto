// Compile content/ (Markdown + YAML) → src/generated/data.json
// Usage : node scripts/build-content.mjs [--check]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import yaml from "js-yaml";
import { marked } from "marked";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CONTENT = join(ROOT, "content");
const OUT_DIR = join(ROOT, "src", "generated");
const CHECK_ONLY = process.argv.includes("--check");
const problems = [];

/* ---------- Markdown : tableaux enveloppés, callouts > [!attention] / > [!repere] ---------- */
const renderer = new marked.Renderer();
const CALLOUTS = { attention: ["warn", "Attention"], repere: ["tip", "Repère"], astuce: ["tip", "Astuce"] };
renderer.blockquote = function ({ tokens }) {
  const inner = this.parser.parse(tokens);
  const m = inner.match(/^<p>\[!(\w+)\]\s*/);
  if (m && CALLOUTS[m[1].toLowerCase()]) {
    const [cls, label] = CALLOUTS[m[1].toLowerCase()];
    return `<aside class="callout ${cls}"><span class="callout-label">${label}</span>${inner.replace(m[0], "<p>")}</aside>`;
  }
  return `<blockquote>${inner}</blockquote>`;
};
renderer.table = function (token) {
  const html = marked.Renderer.prototype.table.call(this, token);
  return `<div class="tbl">${html}</div>`;
};
marked.use({ renderer, gfm: true, breaks: false });

const stripTags = (html) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

function parseFrontMatter(src, file) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) { problems.push(`${file} : en-tête --- manquant`); return null; }
  let meta;
  try { meta = yaml.load(m[1]) || {}; } catch (e) { problems.push(`${file} : en-tête invalide (${e.message})`); return null; }
  return { meta, body: m[2] };
}

function walk(dir, ext) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, ext));
    else if (name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

/* ---------- Chapitres, accueil, synonymes ---------- */
const chapters = yaml.load(readFileSync(join(CONTENT, "chapters.yaml"), "utf8"));
const home = yaml.load(readFileSync(join(CONTENT, "home.yaml"), "utf8"));
const synonyms = existsSync(join(CONTENT, "synonyms.yaml")) ? yaml.load(readFileSync(join(CONTENT, "synonyms.yaml"), "utf8")) : {};

/* ---------- Fiches ---------- */
const entries = [];
const ids = new Set();
for (const file of walk(CONTENT, ".md")) {
  const rel = relative(CONTENT, file).replace(/\\/g, "/");
  if (rel.startsWith("_") || basename(file).startsWith("_")) continue;
  const parsed = parseFrontMatter(readFileSync(file, "utf8"), rel);
  if (!parsed) continue;
  const { meta, body } = parsed;
  const id = meta.id || basename(file, ".md");
  for (const k of ["cat", "title"]) if (!meta[k]) problems.push(`${rel} : champ « ${k} » manquant`);
  if (ids.has(id)) problems.push(`${rel} : id « ${id} » en double`);
  ids.add(id);
  if (meta.cat && !chapters[meta.cat]) problems.push(`${rel} : chapitre inconnu « ${meta.cat} »`);
  if (!meta.sources) problems.push(`${rel} : pas de « sources »`);
  const html = marked.parse(body).trim();
  entries.push({
    id, cat: meta.cat, title: meta.title, short: meta.short || "", tags: meta.tags || "", resume: meta.resume || "",
    sources: meta.sources || "", updated: meta.updated ? String(meta.updated) : "", order: meta.order,
    html, text: stripTags(html),
  });
}

/* ---------- Échelles (YAML, rendues par la phase 2) ---------- */
const scales = [];
for (const file of walk(join(CONTENT, "scales"), ".yaml")) {
  const rel = relative(CONTENT, file).replace(/\\/g, "/");
  try {
    const s = yaml.load(readFileSync(file, "utf8"));
    if (!s.id || !s.title || !s.items) problems.push(`${rel} : échelle incomplète (id, title, items)`);
    scales.push(s);
  } catch (e) { problems.push(`${rel} : YAML invalide (${e.message})`); }
}

/* ---------- Liens internes ---------- */
const all = new Set([...ids, ...scales.map((s) => `scale-${s.id}`)]);
for (const e of entries) {
  for (const m of e.html.matchAll(/href="#e-([a-z0-9-]+)"/g)) if (!all.has(m[1])) problems.push(`${e.id} : lien vers fiche inconnue « ${m[1]} »`);
}
// Les raccourcis d'accueil peuvent pointer vers des fiches pas encore écrites : simple avertissement.
const pending = [...(home.sos || []), ...(home.quick || [])].filter((id) => !all.has(id));
if (pending.length) console.warn(`home.yaml : ${pending.length} raccourci(s) vers des fiches à écrire : ${pending.join(", ")}`);

/* ---------- Sortie ---------- */
const counts = {};
for (const e of entries) counts[e.cat] = (counts[e.cat] || 0) + 1;
console.log(`${entries.length} fiches, ${scales.length} échelles — ` + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(", "));
if (problems.length) {
  console.error(`\n${problems.length} problème(s) :\n - ` + problems.join("\n - "));
  if (CHECK_ONLY) process.exit(1);
}
if (!CHECK_ONLY) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "data.json"), JSON.stringify({ chapters, home, synonyms, entries, scales }));
  console.log(`→ src/generated/data.json`);
}
