import { garments } from "../catalog.js";
import { escapeHTML, icon, image, pieceName } from "../components/common.js";
import { getBag, bagSummary, updateQuantity, updateSize, removeLine, preferredSizeOptions, priceFor, formatPrice, commerceConfig, setMarket } from "../store.js";

export function sizeGuide() {
  return `<dialog id="size-guide-dialog" class="size-guide-dialog" aria-labelledby="size-guide-title"><div class="drawer-heading"><h2 id="size-guide-title">Finding your fit</h2><button type="button" class="icon-button" data-close aria-label="Close size guide">${icon("close")}</button></div><p>Start with the size you usually wear. Letter sizes can vary between cuts, so the atelier will confirm the garment measurements and fit.</p><dl class="measurement-guide"><div><dt>Chest</dt><dd>Measure around the fullest part of your chest, keeping the tape level.</dd></div><div><dt>Shoulder</dt><dd>A comfortable garment you already wear can help you compare shoulder width.</dd></div><div><dt>Length</dt><dd>Think about where you would like the garment to finish on your body.</dd></div></dl><p class="size-guide-note">All offered sizes are available. The atelier can help you choose your fit; exact garment measurements are confirmed before making.</p><a class="button" href="#/atelier?template=size">Help me choose a size ${icon("arrow")}</a></dialog>`;
}
function summaryMarkup() {
  const totals = bagSummary();
  return `<aside class="bag-summary" aria-labelledby="bag-summary-heading"><h2 id="bag-summary-heading">Your selection</h2><label class="market-label" for="bag-market">Shopping for</label><select id="bag-market" data-bag-market>${commerceConfig.markets.map(m=>`<option value="${m.country}" ${commerceConfig.market===m.country?"selected":""}>${m.country} · ${m.currency==="GHS"?"Ghana cedis (GHS)":"Naira (NGN)"}</option>`).join("")}</select><dl><div><dt>Pieces</dt><dd>${totals.count}</dd></div><div><dt>Subtotal</dt><dd>${formatPrice(totals.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${formatPrice(totals.delivery)}</dd></div><div class="bag-total"><dt>Total</dt><dd>${formatPrice(totals.total)}</dd></div></dl><p>All offered sizes are available. Prices and delivery are being confirmed. Nothing is reserved or charged by adding a look to your bag.</p><a class="button" href="#/checkout">Continue to checkout ${icon("arrow")}</a><a class="text-link" href="#/collection">Keep exploring</a></aside>`;
}
function contents() {
  const rows = getBag();
  if (!rows.length) return `<div class="bag-empty"><h2>A new chapter to wear.</h2><p>Your bag is waiting for a look you love.</p><a class="button" href="#/collection">Explore the collection ${icon("arrow")}</a></div>`;
  return `<div class="bag-layout"><div class="bag-lines">${rows.map(row => {
    const item = garments.find(garment => garment.slug === row.slug), name = pieceName(item);
    const query = new URLSearchParams({ garment: item.title, size: row.size, template: "custom" });
    return `<article class="bag-line"><a class="bag-image" href="#/collection/${item.slug}">${image(item, 'loading="lazy"')}</a><div class="bag-line-copy"><a href="#/collection/${item.slug}"><h2>${escapeHTML(name)}</h2></a><p class="bag-line-price">${formatPrice(priceFor(item.slug))}</p><label for="size-${escapeHTML(row.key)}">Preferred size</label><select id="size-${escapeHTML(row.key)}" data-bag-size="${escapeHTML(row.key)}">${preferredSizeOptions.map(size => `<option ${size === row.size ? "selected" : ""}>${escapeHTML(size)}</option>`).join("")}</select><div class="bag-line-actions"><div class="quantity-control" aria-label="Quantity for ${escapeHTML(name)}"><button type="button" data-quantity="${escapeHTML(row.key)}" data-value="${row.quantity - 1}" aria-label="Decrease quantity for ${escapeHTML(name)}, ${escapeHTML(row.size)}" ${row.quantity === 1 ? "disabled" : ""}>−</button><output aria-label="Quantity">${row.quantity}</output><button type="button" data-quantity="${escapeHTML(row.key)}" data-value="${row.quantity + 1}" aria-label="Increase quantity for ${escapeHTML(name)}, ${escapeHTML(row.size)}" ${row.quantity === 10 ? "disabled" : ""}>+</button></div><button type="button" class="bag-remove" data-remove="${escapeHTML(row.key)}" aria-label="Remove ${escapeHTML(name)}, ${escapeHTML(row.size)}">Remove</button></div><a class="bag-custom-link" href="#/atelier?${escapeHTML(query.toString())}">I'd like a custom version</a></div></article>`;
  }).join("")}</div>${summaryMarkup()}</div>`;
}
export function bagPage() {
  return `<main id="main" tabindex="-1"><section class="commerce-page shell"><header class="commerce-heading"><p class="eyebrow">Your selection</p><h1>Your bag</h1><p>Keep the looks you love together.</p></header><div id="bag-content">${contents()}</div><p id="bag-status" class="commerce-status" role="status" aria-live="polite"></p><button type="button" class="text-link" data-open="size-guide-dialog" aria-haspopup="dialog">Help with sizing</button>${sizeGuide()}</section></main>`;
}
export function bindBag() {
  const container = document.querySelector("#bag-content");
  if (!container) return () => {};
  const update = message => { container.innerHTML = contents(); document.querySelector("#bag-status").textContent = message; };
  const click = event => {
    const quantity = event.target.closest("[data-quantity]"), remove = event.target.closest("[data-remove]");
    if (quantity) { const key = quantity.dataset.quantity, next = Number(quantity.dataset.value); updateQuantity(key, next); update("Quantity updated."); container.querySelector(`[data-quantity="${CSS.escape(key)}"]:not(:disabled)`)?.focus(); }
    if (remove) { removeLine(remove.dataset.remove); update("Look removed from your bag."); container.querySelector("a")?.focus(); }
  };
  const change = event => { if(event.target.matches("[data-bag-market]")){setMarket(event.target.value);update(`Shopping for ${commerceConfig.market} in ${commerceConfig.currency}.`);container.querySelector("[data-bag-market]")?.focus();return;} if (event.target.matches("[data-bag-size]")) { const row = getBag().find(item => item.key === event.target.dataset.bagSize), size = event.target.value; const rows = updateSize(event.target.dataset.bagSize, size); update("Preferred size updated."); const changed = rows.find(item => item.slug === row?.slug && item.size === size); if (changed) container.querySelector(`[data-bag-size="${CSS.escape(changed.key)}"]`)?.focus(); } };
  container.addEventListener("click", click); container.addEventListener("change", change);
  return () => { container.removeEventListener("click", click); container.removeEventListener("change", change); };
}
