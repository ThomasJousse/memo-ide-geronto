// Préférences locales (favoris, récents, taille de texte). Stockage : localStorage du WebView,
// qui persiste entre les lancements et les mises à jour de l'app. Aucune donnée patient.
const K = { fav: "memo-geronto-fav", recent: "memo-geronto-recent", size: "memo-geronto-size", skip: "memo-geronto-skip-version" };
const read = (k, fallback) => { try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const getFavs = () => read(K.fav, []);
export const isFav = (id) => getFavs().includes(id);
export function toggleFav(id) {
  const f = getFavs();
  const next = f.includes(id) ? f.filter((x) => x !== id) : [id, ...f];
  write(K.fav, next.slice(0, 50));
  return next.includes(id);
}

export const getRecent = () => read(K.recent, []);
export const pushRecent = (id) => write(K.recent, [id, ...getRecent().filter((x) => x !== id)].slice(0, 8));

export const SIZES = ["M", "L", "XL"];
export const getSize = () => { const s = read(K.size, "M"); return SIZES.includes(s) ? s : "M"; };
export function applySize(s) { document.documentElement.dataset.size = s; write(K.size, s); }
export const nextSize = () => SIZES[(SIZES.indexOf(getSize()) + 1) % SIZES.length];

export const getSkippedVersion = () => read(K.skip, "");
export const skipVersion = (v) => write(K.skip, v);
