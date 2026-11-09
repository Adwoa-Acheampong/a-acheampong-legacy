import { designReferences as garments } from "./catalog.js";
import { escapeHTML, pieceName } from "./components/common.js";

export const DESIGN_STORAGE_KEY = "legacy.design-studio.v1";
export const DESIGN_OPTIONS = Object.freeze({
  mannequin: [["male", "Male"], ["female", "Female"]],
  silhouette: [["tunic", "Tunic"], ["dress", "Dress"], ["two-piece", "Two-piece"]],
  sleeve: [["short", "Short sleeves"], ["long", "Long sleeves"], ["sleeveless", "Sleeveless"]],
  neckline: [["round", "Round"], ["v-neck", "V-neck"], ["notched", "Notched"]]
});
export const DESIGN_DEFAULTS = Object.freeze({ version: 1, mannequin: "male", silhouette: "tunic", sleeve: "short", neckline: "notched", baseColor: "#e9dfcc", accentColor: "#634737", prompt: "", referenceSlug: "", generated: null, previousGenerated: null, pending: null, updatedAt: "" });
let memoryDraft = null;
let memoryStorage = null;
const label = (key, value) => DESIGN_OPTIONS[key].find(option => option[0] === value)?.[1] || value;
const colour = (value, fallback) => /^#[\da-f]{6}$/i.test(value || "") ? value.toLowerCase() : fallback;
const cleanText = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";
const errorText = value => typeof value === "string" ? value.slice(0, 240) : typeof value?.message === "string" ? value.message.slice(0, 240) : "";
const imageUrl = value => typeof value === "string" && /^\/api\/designs\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\/image$/i.test(value) ? value : "";
const requestId = value => typeof value === "string" && /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(value) ? value.toLowerCase() : "";
function generatedRecord(value) {
  if (!value || typeof value !== "object" || !imageUrl(value.imageUrl)) return null;
  return { id: cleanText(value.id, 200), imageUrl: imageUrl(value.imageUrl), prompt: cleanText(value.prompt, 1600), fingerprint: cleanText(value.fingerprint, 4000) };
}
export function normaliseDesignDraft(value) {
  const source = value && typeof value === "object" && value.version === 1 ? value : {};
  const next = { ...DESIGN_DEFAULTS };
  for (const key of Object.keys(DESIGN_OPTIONS)) if (DESIGN_OPTIONS[key].some(option => option[0] === source[key])) next[key] = source[key];
  next.baseColor = colour(source.baseColor, next.baseColor); next.accentColor = colour(source.accentColor, next.accentColor);
  next.prompt = cleanText(source.prompt, 1600);
  next.referenceSlug = garments.some(item => item.slug === source.referenceSlug) ? source.referenceSlug : "";
  next.generated = generatedRecord(source.generated); next.previousGenerated = generatedRecord(source.previousGenerated);
  next.updatedAt = cleanText(source.updatedAt, 40);
  if (source.pending?.payload && typeof source.pending.payload === "object") {
    const id = requestId(source.pending.id), savedRequest = requestId(source.pending.requestId) || id;
    const payload = designPayload({ ...source.pending.payload, version: 1 });
    if (savedRequest && validateDesignBrief(payload).valid) next.pending = { requestId: savedRequest, ...(id ? { id } : {}), payload };
  }
  return next;
}
export function designPayload(draft) {
  const source = draft || DESIGN_DEFAULTS;
  return { prompt: cleanText(source.prompt, 1600), mannequin: source.mannequin, silhouette: source.silhouette, sleeve: source.sleeve, neckline: source.neckline, baseColor: colour(source.baseColor, DESIGN_DEFAULTS.baseColor), accentColor: colour(source.accentColor, DESIGN_DEFAULTS.accentColor), ...(garments.some(item => item.slug === source.referenceSlug) ? { referenceSlug: source.referenceSlug } : {}) };
}
/** Reuse the saved attempt after an uncertain response. A changed design is a
 * distinct request; a known completed/failed attempt is retired by the binder. */
export function prepareDesignRequest(value, makeId = () => globalThis.crypto.randomUUID()) {
  const draft = normaliseDesignDraft({ ...value, version: 1 }), payload = designPayload(draft), pending = draft.pending;
  if (pending && JSON.stringify(pending.payload) === JSON.stringify(payload)) return { ...pending, payload };
  const id = requestId(makeId());
  if (!id) throw new Error("A saved illustration request could not be created.");
  return { requestId: id, payload };
}
export async function submitDesignRequest(request, { fetchImpl = globalThis.fetch, signal } = {}) {
  if (!requestId(request?.requestId) || !validateDesignBrief(request.payload).valid) throw new Error("The saved illustration request is incomplete.");
  return fetchImpl("/api/designs", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": request.requestId }, body: JSON.stringify(request.payload), signal });
}
export function validateDesignBrief(draft) {
  const errors = [];
  if (typeof draft?.prompt !== "string" || draft.prompt.trim().length < 8) errors.push("Describe a little more of the look you have in mind.");
  if ((draft?.prompt?.length || 0) > 1600) errors.push("Keep your design description under 1,600 characters.");
  for (const key of Object.keys(DESIGN_OPTIONS)) if (!DESIGN_OPTIONS[key].some(option => option[0] === draft?.[key])) errors.push(`Choose a ${key}.`);
  if (!/^#[\da-f]{6}$/i.test(draft?.baseColor || "") || !/^#[\da-f]{6}$/i.test(draft?.accentColor || "")) errors.push("Choose valid base and accent colours.");
  return { valid: errors.length === 0, errors };
}
export function buildDesignBrief(value) {
  const draft = normaliseDesignDraft({ ...value, version: 1, pending: null });
  const reference = garments.find(item => item.slug === draft.referenceSlug);
  return ["CUSTOM DESIGN IDEA", `${label("mannequin", draft.mannequin)} mannequin · ${label("silhouette", draft.silhouette)}`, `${label("sleeve", draft.sleeve)} · ${label("neckline", draft.neckline)} neckline`, `Base colour: ${draft.baseColor} · Accent colour: ${draft.accentColor}`, reference ? `Collection reference: ${pieceName(reference)}` : "", draft.prompt ? `Design description: ${draft.prompt}` : "Design details to discuss with the atelier.", draft.generated ? "Visual: AI illustration saved with this design; the image can be shared separately." : "Visual: live design sketch", draft.generated && draft.generated.fingerprint !== JSON.stringify(designPayload(draft)) ? "The illustration is from an earlier version; the description contains my latest choices." : "", "Please confirm fabric, fit, price and what can be made."].filter(Boolean).join("\n");
}
function storage() { try { return globalThis.localStorage; } catch { return null; } }
export function saveDesignDraft(value, target = storage()) {
  const draft = normaliseDesignDraft({ ...value, version: 1, updatedAt: new Date().toISOString() }); memoryDraft = draft; memoryStorage = target;
  try { target?.setItem(DESIGN_STORAGE_KEY, JSON.stringify(draft)); return Boolean(target); } catch { return false; }
}
export function getDesignDraft(target = storage()) {
  let draft = !target || target === memoryStorage ? memoryDraft : null;
  try { const stored = target?.getItem(DESIGN_STORAGE_KEY); if (stored) { const parsed = JSON.parse(stored); if (!draft || (Date.parse(parsed.updatedAt) || 0) >= (Date.parse(draft.updatedAt) || 0)) draft = parsed; } } catch { /* The sketch remains usable without storage. */ }
  draft = normaliseDesignDraft(draft);
  return { ...draft, brief: buildDesignBrief(draft), sketchSvg: renderDesignSketch(draft) };
}
export function designDraftForReference(slug = "", selectedColor = "") {
  const current = getDesignDraft(), reference = garments.find(item => item.slug === slug);
  const preferredColor = colour(selectedColor, "");
  if (!reference || current.referenceSlug === slug) return normaliseDesignDraft({ ...current, ...(preferredColor ? { baseColor: preferredColor } : {}) });
  const bases = [["pale blue", "#bfcedf"], ["deep navy", "#263044"], ["navy", "#263044"], ["turquoise", "#17a6ac"], ["deep coffee", "#56402f"], ["dark coffee", "#56402f"], ["coffee", "#634737"], ["black", "#262529"], ["cool grey", "#a1a0ab"], ["white", "#f5f1e9"], ["cream", "#e9dfcc"], ["gold", "#b49a52"], ["vermilion", "#ad4732"], ["green", "#456f45"], ["peach", "#dca475"]];
  return normaliseDesignDraft({ ...DESIGN_DEFAULTS, referenceSlug: slug, sleeve: slug === "heritage-panel" ? "sleeveless" : "short", baseColor: preferredColor || bases.find(([name]) => reference.palette.toLowerCase().startsWith(name))?.[1] || DESIGN_DEFAULTS.baseColor, prompt: `A custom version of ${pieceName(reference)}, preserving its construction and signature details. Use my selected colour palette.` });
}

/** An immediate vector sketch, deliberately distinct from an AI-generated image. */
export function renderDesignSketch(value) {
  const d = normaliseDesignDraft({ ...value, version: 1, pending: null });
  const female = d.mannequin === "female", base = d.baseColor, accent = d.accentColor;
  const waist = female ? "Q197 245 202 304" : "L179 304", rightWaist = female ? "Q283 245 278 304" : "L301 304";
  const body = d.silhouette === "dress" ? `M178 155Q208 142 214 140H266Q272 142 302 155L286 238Q273 275 281 320L346 552Q240 574 134 552L199 320Q207 275 194 238Z` : `M178 155Q208 142 214 140H266Q272 142 302 155L309 236${rightWaist}L309 ${d.silhouette === "two-piece" ? 365 : 451}Q240 ${d.silhouette === "two-piece" ? 378 : 469} 171 ${d.silhouette === "two-piece" ? 365 : 451}${waist}L171 236Z`;
  const sleeves = d.sleeve === "sleeveless" ? "" : d.sleeve === "long" ? `<path d="M180 156L164 158Q147 182 136 228L117 343L148 351L174 258L191 195ZM300 156L316 158Q333 182 344 228L363 343L332 351L306 258L289 195Z" fill="${base}" stroke="#4b382b" stroke-opacity=".4"/><path d="M119 331L151 340M329 340L361 331" stroke="${accent}" stroke-width="13"/>` : `<path d="M180 156L164 158L139 217L169 236L192 187ZM300 156L316 158L341 217L311 236L288 187Z" fill="${base}" stroke="#4b382b" stroke-opacity=".4"/><path d="M142 210L173 228M307 228L338 210" stroke="${accent}" stroke-width="8"/>`;
  const neck = d.neckline === "v-neck" ? '<path d="M215 141L240 191L265 141Z" fill="url(#studio-form)"/>' : d.neckline === "notched" ? '<path d="M221 141Q240 152 259 141L247 176H233Z" fill="url(#studio-form)"/>' : '<path d="M215 141Q240 180 265 141" fill="url(#studio-form)"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 660" role="img" aria-labelledby="studio-sketch-title studio-sketch-desc"><title id="studio-sketch-title">${label("mannequin", d.mannequin)} mannequin wearing a ${label("silhouette", d.silhouette).toLowerCase()} design sketch</title><desc id="studio-sketch-desc">Live vector sketch. ${escapeHTML(label("sleeve", d.sleeve))}, ${escapeHTML(label("neckline", d.neckline))} neckline, base ${base}, accent ${accent}. This is not an AI illustration or a confirmed tailoring pattern.</desc><defs><linearGradient id="studio-form" x1="0" x2="1"><stop stop-color="#9d8060"/><stop offset=".48" stop-color="#cfb28b"/><stop offset="1" stop-color="#a48663"/></linearGradient><linearGradient id="studio-floor"><stop stop-color="#a18a70" stop-opacity="0"/><stop offset=".5" stop-color="#a18a70" stop-opacity=".22"/><stop offset="1" stop-color="#a18a70" stop-opacity="0"/></linearGradient></defs><ellipse cx="240" cy="624" rx="128" ry="12" fill="url(#studio-floor)"/><g fill="url(#studio-form)" stroke="#8d7459" stroke-opacity=".35"><ellipse cx="240" cy="88" rx="${female ? 30 : 33}" ry="41"/><path d="M221 121L217 147L177 160Q164 178 164 227L180 342Q191 365 189 406L197 583L222 586L237 428H243L258 586L283 583L291 406Q289 365 300 342L316 227Q316 178 303 160L263 147L259 121Z"/><path d="M177 165Q151 177 140 222L118 346Q114 369 122 377Q136 381 142 363L170 273L190 193ZM303 165Q329 177 340 222L362 346Q366 369 358 377Q344 381 338 363L310 273L290 193Z"/><path d="M197 578L189 605Q211 613 226 603L223 578ZM257 578L254 603Q269 613 291 605L283 578Z"/></g>${d.silhouette === "two-piece" ? `<path d="M188 350H292L291 583H256L240 427L224 583H189Z" fill="${base}" stroke="#4b382b" stroke-opacity=".45"/><path d="M187 363H293" stroke="${accent}" stroke-width="13"/><path d="M240 381V426" stroke="#4b382b" stroke-opacity=".3"/>` : ""}${sleeves}<path d="${body}" fill="${base}" stroke="#4b382b" stroke-opacity=".4" stroke-width="1.4"/><path d="M240 175V${d.silhouette === "dress" ? 310 : d.silhouette === "two-piece" ? 337 : 416}" stroke="${accent}" stroke-width="17"/><path d="M240 187V${d.silhouette === "dress" ? 300 : d.silhouette === "two-piece" ? 328 : 402}" stroke="#fffaf3" stroke-opacity=".5" stroke-width="1" stroke-dasharray="2 18"/>${neck}<path d="M271 219H292V247H271Z" fill="none" stroke="${accent}" stroke-opacity=".8" stroke-width="2"/>${d.silhouette === "dress" ? `<path d="M194 305Q240 316 286 305" fill="none" stroke="${accent}" stroke-width="9"/>` : ""}<path d="M178 ${d.silhouette === "dress" ? 545 : d.silhouette === "two-piece" ? 358 : 444}Q240 ${d.silhouette === "dress" ? 564 : d.silhouette === "two-piece" ? 371 : 461} 302 ${d.silhouette === "dress" ? 545 : d.silhouette === "two-piece" ? 358 : 444}" fill="none" stroke="${accent}" stroke-opacity=".6" stroke-width="2"/></svg>`;
}

export function bindDesignStudio() {
  const root = document.querySelector("#design-studio");
  if (!root) return () => {};
  const abort = new AbortController(), urls = new Set();
  let draft = designDraftForReference(root.dataset.referenceSlug, root.dataset.initialColor), undo = null, ready = false, generating = false, disposed = false, timer = 0, generation = 0, view = "sketch";
  const status = root.querySelector("#studio-status"), preview = root.querySelector("#studio-canvas"), form = root.querySelector("#studio-brief-form"), generate = root.querySelector("#studio-generate");
  const fingerprint = value => JSON.stringify(designPayload(value));
  const persist = () => saveDesignDraft(draft);
  const say = message => { status.textContent = message; };
  const draw = () => {
    const record = view === "previous" ? draft.previousGenerated : draft.generated;
    preview.innerHTML = view === "sketch" || !record ? renderDesignSketch(draft) : `<img src="${escapeHTML(record.imageUrl)}" alt="AI illustration of your custom clothing design"/>`;
    root.querySelectorAll("[data-studio-view]").forEach(button => { const key = button.dataset.studioView; button.hidden = key === "previous" && !draft.previousGenerated; button.disabled = key !== "sketch" && !(key === "previous" ? draft.previousGenerated : draft.generated); button.setAttribute("aria-pressed", String(view === key)); });
    root.querySelector("#studio-preview-label").textContent = view === "sketch" ? "Live design sketch" : view === "previous" ? "Previous AI illustration" : "AI illustration";
    root.querySelector("#studio-preview-note").textContent = view === "sketch" ? "A live sketch of your selected shape and colours. Your written details guide the AI illustration." : record?.fingerprint !== fingerprint(draft) ? "This illustration belongs to an earlier version. Illustrate again to include your latest changes." : "An AI design visual to discuss with the atelier. Fabric, construction and fit are confirmed together.";
    root.querySelector("#studio-download-image").hidden = !record || view === "sketch";
    const openImage = root.querySelector("#studio-open-image"); openImage.hidden = !record || view === "sketch"; openImage.href = record?.imageUrl || "#";
    for (const key of ["baseColor", "accentColor"]) root.querySelector(`[data-colour-value="${key}"]`).textContent = draft[key].toUpperCase();
    root.querySelectorAll("[data-studio-colour]").forEach(button => button.setAttribute("aria-pressed", String(draft[button.dataset.colourTarget] === button.dataset.studioColour)));
    root.querySelector("#studio-brief-preview").textContent = buildDesignBrief(draft);
    root.querySelector("#studio-undo-reset").hidden = !undo;
  };
  const syncControls = () => {
    for (const key of Object.keys(DESIGN_OPTIONS)) root.querySelectorAll(`[name="studio-${key}"]`).forEach(input => { input.checked = input.value === draft[key]; });
    for (const key of ["baseColor", "accentColor"]) { root.querySelector(`[name="${key}"]`).value = draft[key]; root.querySelector(`[data-colour-value="${key}"]`).textContent = draft[key].toUpperCase(); }
    form.elements.prompt.value = draft.prompt; draw();
  };
  const pendingState = active => { generating = active; root.setAttribute("aria-busy", String(active)); generate.disabled = active || !ready; generate.textContent = active ? "Illustrating your idea…" : "Illustrate with AI"; };
  function finish(job, payload) {
    if (job.status === "complete" && imageUrl(job.imageUrl)) {
      draft.previousGenerated = draft.generated; draft.generated = { id: cleanText(job.id, 200), imageUrl: imageUrl(job.imageUrl), prompt: payload.prompt, fingerprint: fingerprint(payload) }; draft.pending = null; persist(); view = "current"; draw(); say("Your illustration is ready. Refine your idea or share this design with the atelier."); pendingState(false); return true;
    }
    if (job.status === "failed" || job.status === "complete") { draft.pending = null; persist(); say(errorText(job.error) || "The illustration could not be completed. Your sketch and brief are safe; you can try again."); pendingState(false); return true; }
    return false;
  }
  async function poll(id, payload, started = Date.now(), failures = 0, ticket = generation) {
    if (disposed || ticket !== generation) return;
    try {
      const response = await fetch(`/api/designs/${encodeURIComponent(id)}`, { signal: abort.signal });
      if (response.status === 404) { pendingState(false); say("That illustration request could not be found yet. Your request is saved; Illustrate with AI will check the same request before starting another."); return; }
      if (!response.ok) throw new Error("The illustration service could not be reached.");
      const job = await response.json(); if (disposed || ticket !== generation) return;
      if (requestId(job.id) !== requestId(id)) throw new Error("The illustration request did not match.");
      if (finish(job, payload)) return;
      if (Date.now() - started > 300000) { pendingState(false); say("Your illustration is taking longer. Your draft is saved; you can return later or keep refining the sketch."); return; }
      timer = setTimeout(() => poll(id, payload, started, 0, ticket), 1800);
    } catch (error) {
      if (disposed || ticket !== generation || error.name === "AbortError") return;
      if (failures < 2) timer = setTimeout(() => poll(id, payload, started, failures + 1, ticket), 2200);
      else { pendingState(false); say("The illustration connection was interrupted. Your draft is saved; return later to check it again."); }
    }
  }
  async function startRequest(request) {
    const ticket = ++generation; clearTimeout(timer); draft.pending = request;
    // The request UUID must survive navigation before a paid provider call can
    // start. A storage-blocked visitor can still edit/download/share the sketch.
    if (!persist()) { pendingState(false); say("Your browser couldn’t save illustration progress. Allow this site to save your draft before starting an AI illustration. Your live sketch is still available."); return; }
    pendingState(true); say("Creating or checking your saved illustration request. You can keep working with your live sketch.");
    const payload = request.payload;
    try {
      const response = await submitDesignRequest(request, { signal: abort.signal });
      const job = await response.json(); if (disposed || ticket !== generation) return;
      if (!response.ok) throw new Error(errorText(job.error) || "The illustration could not be started. Please try again.");
      if (requestId(job.id) !== request.requestId) throw new Error("The illustration request did not match. Your saved request is safe; check it again before starting another.");
      if (finish(job, payload)) return;
      draft.pending = { requestId: request.requestId, id: job.id, payload }; persist(); poll(draft.pending.id, payload, Date.now(), 0, ticket);
    } catch (error) { if (!disposed && ticket === generation && error.name !== "AbortError") { pendingState(false); say(error.message + " Your request is saved; trying again checks the same request."); } }
  }
  async function illustrate(event) {
    event.preventDefault(); if (!ready || generating) return;
    draft.prompt = form.elements.prompt.value.trim(); const validation = validateDesignBrief(draft);
    form.elements.prompt.setAttribute("aria-invalid", String(!validation.valid));
    if (!validation.valid) { say(validation.errors[0]); form.elements.prompt.focus(); return; }
    try { await startRequest(prepareDesignRequest(draft)); } catch (error) { say(error.message); }
  }
  function download(blob, filename) { const url = URL.createObjectURL(blob); urls.add(url); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => { URL.revokeObjectURL(url); urls.delete(url); }, 1000); }
  root.addEventListener("input", event => {
    const input = event.target;
    if (input.name === "prompt") draft.prompt = input.value.slice(0, 1600);
    else if (["baseColor", "accentColor"].includes(input.name)) { draft[input.name] = colour(input.value, draft[input.name]); view = "sketch"; }
    else return;
    persist(); draw();
  }, { signal: abort.signal });
  root.addEventListener("change", event => { const key = event.target.name?.replace(/^studio-/, ""); if (!DESIGN_OPTIONS[key]) return; draft[key] = event.target.value; view = "sketch"; persist(); draw(); }, { signal: abort.signal });
  root.addEventListener("error", event => { if (event.target instanceof HTMLImageElement && preview.contains(event.target)) { view = "sketch"; draw(); say("The illustration could not be loaded. Your live sketch and design brief are still here."); } }, { capture: true, signal: abort.signal });
  root.addEventListener("click", async event => {
    const viewButton = event.target.closest("[data-studio-view]");
    if (viewButton) { view = viewButton.dataset.studioView; draw(); return; }
    const swatch = event.target.closest("[data-studio-colour]");
    if (swatch) { draft[swatch.dataset.colourTarget] = swatch.dataset.studioColour; view = "sketch"; persist(); syncControls(); return; }
    const action = event.target.closest("[data-studio-action]")?.dataset.studioAction;
    if (action === "save") say(persist() ? "Your design draft is saved on this device." : "Your sketch is ready for this visit. Download it to keep a copy.");
    if (action === "reset") { if (fingerprint(draft) === fingerprint(DESIGN_DEFAULTS) && !draft.generated && !draft.pending) { say("Your design is already fresh. Your previous draft is still available through Undo reset."); return; } generation++; clearTimeout(timer); pendingState(false); undo = normaliseDesignDraft(draft); draft = { ...DESIGN_DEFAULTS, pending: undo.pending }; view = "sketch"; persist(); syncControls(); say("A fresh design is ready. Undo reset brings your previous draft back. Any unfinished illustration request remains saved."); if (draft.pending) { pendingState(true); poll(draft.pending.id || draft.pending.requestId, draft.pending.payload); } }
    if (action === "undo") { if (undo) { draft = undo; undo = null; view = "sketch"; persist(); syncControls(); say("Your previous design is restored."); if (draft.pending?.id) { pendingState(true); poll(draft.pending.id, draft.pending.payload); } else if (ready && draft.pending) void startRequest(draft.pending); } }
    if (action === "view-preview") root.querySelector(".studio-visual").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    if (action === "download-sketch") { download(new Blob([renderDesignSketch(draft)], { type: "image/svg+xml;charset=utf-8" }), "legacy-custom-design.svg"); say("Your live sketch is ready to download."); }
    if (action === "download-image") {
      const record = view === "previous" ? draft.previousGenerated : draft.generated;
      try { const response = await fetch(record.imageUrl, { signal: abort.signal }); if (!response.ok) throw new Error(); download(await response.blob(), "legacy-ai-design.png"); say("Your AI illustration is ready to download."); }
      catch (error) { if (error.name !== "AbortError") say("The image could not be downloaded here. Open the illustration and save it from your browser."); }
    }
    if (event.target.closest("[data-studio-enquire]")) persist();
  }, { signal: abort.signal });
  form.addEventListener("submit", illustrate, { signal: abort.signal });
  persist(); syncControls(); pendingState(false);
  fetch("/api/capabilities", { signal: abort.signal }).then(response => response.ok ? response.json() : null).then(capabilities => {
    if (disposed) return; ready = capabilities?.ai?.ready === true; pendingState(false);
    root.querySelector("#studio-ai-availability").textContent = ready ? "AI illustration is available. Describe your idea and bring it to life." : "AI illustration is not connected yet. You can still refine, save and share your live sketch with the atelier.";
    if (draft.pending?.id) { pendingState(true); say("Checking your saved illustration…"); poll(draft.pending.id, draft.pending.payload); }
    else if (ready && draft.pending) void startRequest(draft.pending);
  }).catch(error => { if (!disposed && error.name !== "AbortError") { pendingState(false); root.querySelector("#studio-ai-availability").textContent = "AI illustration is not connected yet. Your live sketch and design brief are ready to use."; } });
  return () => { disposed = true; abort.abort(); clearTimeout(timer); urls.forEach(url => URL.revokeObjectURL(url)); };
}
