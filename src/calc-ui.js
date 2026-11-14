// Interface des calculateurs (définis dans calculators.js).
import { esc } from "./util.js";

export function renderCalc(c, box) {
  box.classList.add("calc");
  box.innerHTML = `<div class="calc-title">${esc(c.short || c.title)}</div>
    <div class="fields">${c.fields.map((f) => `<div class="f"><label for="f-${esc(f.id)}">${esc(f.label)}${f.optional ? " <small>(facultatif)</small>" : ""}</label>
      ${f.type === "select"
        ? `<select id="f-${esc(f.id)}" name="${esc(f.id)}">${f.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>`
        : `<div class="in"><input id="f-${esc(f.id)}" name="${esc(f.id)}" type="number" inputmode="decimal" ${f.min != null ? `min="${f.min}"` : ""} ${f.max != null ? `max="${f.max}"` : ""} step="${f.step ?? 1}" placeholder="—">${f.unit ? `<span class="u">${esc(f.unit)}</span>` : ""}</div>`}
    </div>`).join("")}</div>
    <div class="res"></div>
    <div class="calc-actions"><button type="button" class="back" data-reset>Effacer</button></div>`;
  const res = box.querySelector(".res");
  const update = () => {
    const vals = {}; let missing = false;
    for (const f of c.fields) {
      const el = box.querySelector(`[name="${f.id}"]`);
      if (f.type === "select") vals[f.id] = el.value;
      else { const v = el.value === "" ? null : Number(el.value); if (v == null || Number.isNaN(v)) { if (!f.optional) missing = true; } else vals[f.id] = v; }
    }
    if (missing) { res.innerHTML = `<div class="result"><div class="res-text">Renseigner les champs pour obtenir le résultat.</div></div>`; return; }
    const out = c.compute(vals);
    if (out.error) { res.innerHTML = `<div class="result warn"><div class="res-text">${esc(out.error)}</div></div>`; return; }
    res.innerHTML = `<div class="result ${out.level || ""}"><div class="res-row"><span class="res-num">${esc(out.num)}</span><span class="res-unit">${esc(out.unit || "")}</span></div>
      ${out.text ? `<div class="res-text">${out.text}</div>` : ""}${out.sub ? `<div class="subscores">${out.sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : ""}</div>`;
  };
  box.addEventListener("input", update);
  box.addEventListener("change", update);
  box.querySelector("[data-reset]").addEventListener("click", () => { box.querySelectorAll("input").forEach((i) => (i.value = "")); update(); });
  update();
}
