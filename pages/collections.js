import { collections } from "../collections-data.js";
import { designReferences } from "../catalog.js";
import { escapeHTML, icon, imageSource } from "../components/common.js";

export function collectionCards(items = collections) {
  return `<div class="collections-grid">${items.map(collection => {
    const count = designReferences.filter(item => item.collection === collection.slug).length;
    const concept = collection.kind === "concept";
    return `<article class="collection-card"><a href="#/collections/${collection.slug}"><div class="collection-card-image${concept ? " collection-card-image--concept" : ""}"><img ${imageSource(collection.image, "(max-width: 539px) 90vw, (max-width: 999px) 46vw, 420px")} alt="${escapeHTML(collection.imageAlt || `${collection.name} collection preview`)}" width="1024" height="1536" loading="lazy" decoding="async"/><span>${count} ${concept ? "design concepts" : "pieces"}</span></div><div class="collection-card-heading"><h3>${escapeHTML(collection.name)}</h3>${icon("arrow")}</div><p>${escapeHTML(collection.description)}</p></a></article>`;
  }).join("")}</div>`;
}
export function collectionsPage() {
  return `<main id="main" class="collections-index" tabindex="-1"><header class="collections-heading shell"><p class="eyebrow">A Acheampong Legacy</p><h1>Shop by collection</h1><p>Explore our signature tunics, printed shirts and new cultural design collections.</p></header><section class="shell collections-index-body" aria-label="Explore collections">${collectionCards()}<p class="collections-concept-note">The cultural fusion collections present original design concepts. Begin a conversation with the atelier to explore fabric, construction and fit.</p><a class="button button-outline" href="#/collection">View all designs ${icon("arrow")}</a></section></main>`;
}
