// Détection de mise à jour : une requête vers l'API GitHub au lancement, silencieuse en cas d'échec
// (hors ligne, quota, dépôt inaccessible). Seul appel réseau de l'application.
import { getSkippedVersion, skipVersion } from "./prefs.js";

const REPO = "ThomasJousse/memo-ide-geronto";
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

const parse = (v) => String(v).replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
export function isNewer(remote, local) {
  const a = parse(remote), b = parse(local);
  for (let i = 0; i < 3; i++) { if ((a[i] || 0) > (b[i] || 0)) return true; if ((a[i] || 0) < (b[i] || 0)) return false; }
  return false;
}

export async function checkForUpdate(currentVersion, onUpdate) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" }, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return;
    const rel = await res.json();
    const tag = rel.tag_name || "";
    if (!tag || !isNewer(tag, currentVersion) || getSkippedVersion() === tag) return;
    const apk = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
    onUpdate({ version: tag.replace(/^v/, ""), url: apk ? apk.browser_download_url : rel.html_url, page: rel.html_url, skip: () => skipVersion(tag) });
  } catch { /* silencieux */ }
}
