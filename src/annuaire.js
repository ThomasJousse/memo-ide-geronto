// Annuaire local : contacts professionnels du territoire, saisis par l'utilisatrice et stockés
// uniquement sur l'appareil (localStorage). Aucune donnée patient : ne pas y saisir de patients.
import { esc } from "./util.js";

const KEY = "memo-geronto-annuaire";
const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } };
const telHref = (t) => "tel:" + String(t).replace(/[^\d+]/g, "");

export function renderAnnuaire(box) {
  box.classList.add("annuaire");
  let filter = "";
  const draw = () => {
    const list = load().sort((a, b) => (a.groupe || "").localeCompare(b.groupe || "") || a.nom.localeCompare(b.nom));
    const shown = list.filter((c) => !filter || [c.nom, c.fonction, c.groupe, c.tel, c.note].join(" ").toLowerCase().includes(filter));
    let lastGroup = null;
    box.innerHTML = `
      <div class="callout tip"><span class="callout-label">Confidentialité</span><p>Contacts professionnels uniquement, enregistrés sur ce téléphone et nulle part ailleurs. Ne pas saisir de données de patients.</p></div>
      <div class="ann-tools"><input type="search" class="ann-filter" placeholder="Filtrer l'annuaire" value="${esc(filter)}" aria-label="Filtrer l'annuaire"></div>
      ${shown.length ? `<div class="contacts">${shown.map((c) => {
        const g = c.groupe || "Autres";
        const head = g !== lastGroup ? `<div class="subh">${esc(g)}</div>` : "";
        lastGroup = g;
        return `${head}<div class="ct" data-id="${esc(c.id)}"><div class="who"><span class="fn">${esc(c.nom)}</span>${c.fonction ? ` <span class="nm">· ${esc(c.fonction)}</span>` : ""}${c.note ? `<div class="nm">${esc(c.note)}</div>` : ""}</div>
          <div class="ct-actions">${c.tel ? `<a class="tel" href="${esc(telHref(c.tel))}">${esc(c.tel)}</a>` : ""}<button type="button" class="copy" data-edit="${esc(c.id)}">Modifier</button></div></div>`;
      }).join("")}</div>` : `<div class="empty">${list.length ? "Aucun contact ne correspond." : "Annuaire vide. Ajoutez les numéros de votre territoire : DAC, HAD, équipe de soins palliatifs, consultation mémoire, gériatre d'astreinte, assistante sociale…"}</div>`}
      <form class="calc ann-form" autocomplete="off">
        <div class="calc-title">Ajouter ou modifier un contact</div>
        <input type="hidden" name="id">
        <div class="fields">
          <div class="f"><label>Nom ou structure</label><input name="nom" required maxlength="80"></div>
          <div class="f"><label>Fonction</label><input name="fonction" maxlength="80"></div>
          <div class="f"><label>Téléphone</label><input name="tel" type="tel" inputmode="tel" maxlength="30"></div>
          <div class="f"><label>Rubrique</label><input name="groupe" list="ann-groupes" maxlength="40" placeholder="Hôpital, Ville, Social…"><datalist id="ann-groupes">${[...new Set(list.map((c) => c.groupe).filter(Boolean))].map((g) => `<option value="${esc(g)}">`).join("")}</datalist></div>
        </div>
        <div class="f"><label>Note</label><input name="note" maxlength="140" placeholder="Horaires, poste, bip…"></div>
        <div class="calc-actions"><button type="button" class="back" data-del hidden>Supprimer</button><button type="reset" class="back">Effacer</button><button type="submit" class="cta">Enregistrer</button></div>
      </form>
      <div class="calc-actions"><button type="button" class="back" data-export>Copier l'annuaire (sauvegarde)</button><button type="button" class="back" data-import>Restaurer depuis une copie</button></div>`;
    const form = box.querySelector(".ann-form");
    box.querySelector(".ann-filter").addEventListener("input", (e) => { filter = e.target.value.toLowerCase(); const pos = e.target.selectionStart; draw(); const f = box.querySelector(".ann-filter"); f.focus(); f.setSelectionRange(pos, pos); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (!d.nom.trim()) return;
      const all = load();
      const item = { id: d.id || String(Date.now()), nom: d.nom.trim(), fonction: d.fonction.trim(), tel: d.tel.trim(), groupe: d.groupe.trim(), note: d.note.trim() };
      const i = all.findIndex((c) => c.id === item.id);
      if (i >= 0) all[i] = item; else all.push(item);
      if (!save(all)) alert("Enregistrement impossible sur cet appareil.");
      draw();
    });
    form.addEventListener("reset", () => { setTimeout(() => { form.querySelector("[data-del]").hidden = true; form.elements.id.value = ""; }, 0); });
    box.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
      const c = load().find((x) => x.id === b.dataset.edit); if (!c) return;
      for (const k of ["id", "nom", "fonction", "tel", "groupe", "note"]) form.elements[k].value = c[k] || "";
      form.querySelector("[data-del]").hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    form.querySelector("[data-del]").addEventListener("click", () => {
      const id = form.elements.id.value; if (!id) return;
      if (!confirm("Supprimer ce contact ?")) return;
      save(load().filter((c) => c.id !== id)); draw();
    });
    box.querySelector("[data-export]").addEventListener("click", async () => {
      const txt = JSON.stringify(load());
      try { await navigator.clipboard.writeText(txt); alert("Annuaire copié. Collez-le dans une note ou un mail à vous-même pour le sauvegarder."); }
      catch { prompt("Copiez ce texte pour sauvegarder l'annuaire :", txt); }
    });
    box.querySelector("[data-import]").addEventListener("click", () => {
      const txt = prompt("Collez ici une copie de l'annuaire (elle remplacera l'annuaire actuel) :");
      if (!txt) return;
      try { const v = JSON.parse(txt); if (!Array.isArray(v)) throw 0; save(v.filter((c) => c && c.nom).map((c, i) => ({ id: String(c.id || Date.now() + i), nom: String(c.nom), fonction: String(c.fonction || ""), tel: String(c.tel || ""), groupe: String(c.groupe || ""), note: String(c.note || "") }))); draw(); }
      catch { alert("Texte non reconnu."); }
    });
  };
  draw();
}
