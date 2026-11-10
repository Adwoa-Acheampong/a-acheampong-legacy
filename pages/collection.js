import { garments, designReferences, filterOptions } from "../catalog.js";
import { conceptDesigns } from "../collections-data.js";
import { disclosure, escapeHTML, icon, imageSource, productCard, pieceName } from "../components/common.js";
import { preferredSizeOptions, matchesConfirmedSize } from "../store.js";

const inCollection = (item, collection) => !collection || (item.collection || "signature-tunics") === collection.slug;
export const defaultSort = collection => collection ? "collection" : "name";
const sortOrder = (params, collection) => ["name", "collection"].includes(params.get("sort")) ? params.get("sort") : defaultSort(collection);
export function selectGarments(params = new URLSearchParams(), collection = null) {
  const query = (params.get("q") || "").trim().toLowerCase();
  const filter = params.get("filter") || "all", concepts = collection?.kind === "concept";
  const source = collection ? concepts ? conceptDesigns : garments : designReferences;
  const items = source.filter(item => inCollection(item, collection) && (concepts || matchesConfirmedSize(item.slug, params.get("size"))) && (concepts || filter === "all" || item.tags.includes(filter)) && `${item.title} ${item.palette} ${item.category} ${item.details} ${item.slug}`.toLowerCase().includes(query));
  if (sortOrder(params, collection) === "name") items.sort((a, b) => pieceName(a).localeCompare(pieceName(b)));
  return items;
}
export function resultCount(params, collection = null) {
  const count = selectGarments(params, collection).length;
  const label = !collection ? "design" : collection.kind === "concept" ? "concept" : "piece";
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}
export function resultsMarkup(params, collection = null) {
  const items = selectGarments(params, collection), concepts = collection?.kind === "concept";
  const label = !collection ? "designs" : concepts ? "concepts" : "pieces";
  return items.length ? `<h2 class="sr-only">${!collection ? "All designs" : concepts ? "Collection concepts" : "Collection pieces"}</h2><div class="product-grid catalog-grid">${items.map(productCard).join("")}</div>` : `<div class="empty-state"><h2>No ${label} match your selection.</h2><p>Try another colour or detail, or clear your filters to explore this collection.</p><button class="button" type="button" data-reset>Show all ${label} ${icon("arrow")}</button></div>`;
}
export function collectionPage(params = new URLSearchParams(), collection = null) {
  const concepts = collection?.kind === "concept", title = collection?.name || "All garments";
  const description = collection?.description || "Signature tunics, printed shirts and cultural designs. Every collection, together.";
  const hero = collection?.image || garments.find(item => item.slug === "brown-linear").image;
  const selectedSort = sortOrder(params, collection);
  return `<main id="main" tabindex="-1"><header class="collection-heading collection-hero ${collection ? "named-collection-hero" : ""}"><img ${imageSource(hero, "100vw")} alt="" width="1167" height="1347" fetchpriority="high"/><div class="shell"><p class="eyebrow">${concepts ? "Design concepts · Custom possibilities" : "The showroom"}</p><h1>${escapeHTML(title)}</h1><p>${escapeHTML(description)}</p>${collection ? `<a class="text-link" href="#/collections">Explore all collections ${icon("arrow")}</a>` : ""}</div></header>
  <section class="shell collection-body" data-component="collection-catalog" aria-label="Browse ${concepts ? "design concepts" : "garments"}">${concepts ? '<p class="collection-concept-note">Original design concepts for a custom conversation. These designs are not stocked garments; fabric, construction and feasibility are agreed with the atelier.</p>' : ""}<form id="collection-controls" class="catalog-controls"><div class="catalog-search"><label class="sr-only" for="catalog-query">Search ${concepts ? "concepts" : "garments"}</label>${icon("search")}<input type="search" id="catalog-query" name="q" placeholder="Search colour, pattern or piece" value="${escapeHTML(params.get("q") || "")}" autocomplete="off"/></div>
  <div class="sort-field"><label for="catalog-sort">Sort by</label><select id="catalog-sort" name="sort"><option value="collection" ${selectedSort === "collection" ? "selected" : ""}>Collection order</option><option value="name" ${selectedSort === "name" ? "selected" : ""}>Name A–Z</option></select></div></form>
  ${concepts ? '<select id="catalog-size" hidden disabled aria-label="Concept size filter unavailable"><option value="all">All</option></select>' : `<div class="filter-row" role="group" aria-label="Filter garments">${filterOptions.map(([key, label]) => `<button class="filter-button" type="button" data-filter="${key}" aria-pressed="${(params.get("filter") || "all") === key}">${escapeHTML(!collection && key === "all" ? "All designs" : label.replace("Print and colour-block", "Print & colour"))}</button>`).join("")}</div><div class="catalog-size"><label for="catalog-size">Size</label><select id="catalog-size"><option value="all">All sizes</option>${preferredSizeOptions.filter(size => size !== "Made to measure").map(size => `<option ${params.get("size") === size ? "selected" : ""}>${size}</option>`).join("")}</select><p>${collection ? "All sizes available." : "All standard garment sizes available."}</p></div>`}<div class="catalog-meta"><p id="result-count" role="status" aria-live="polite">${resultCount(params, collection)}</p><button class="text-link" type="button" data-reset>Clear filters</button></div><div id="collection-results">${resultsMarkup(params, collection)}</div>${concepts ? '<p class="image-note">AI-generated design concepts. Details are a starting point for the atelier and may evolve before making.</p>' : disclosure + (!collection ? '<p class="image-note">Design concepts are labelled and can be developed with the atelier.</p>' : "")}</section></main>`;
}
