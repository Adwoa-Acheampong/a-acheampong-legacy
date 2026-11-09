export const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const pieceName = item => item.title.replace(/^(?:Piece|Concept) \d+ — /, "").replace("Kinari", "Cream").replace("Study", "Detail");
export const pieceNumber = item => item.title.match(/Piece \d+/)?.[0] || item.slug;
export const image = (item, options = "") => {
  const width = Number.isInteger(item.imageWidth) && item.imageWidth > 0 ? item.imageWidth : 1167;
  const height = Number.isInteger(item.imageHeight) && item.imageHeight > 0 ? item.imageHeight : 1347;
  if (item.focus === "left" || item.focus === "right") return `<span class="paired-view paired-view-${item.focus}" style="--paired-aspect:${width/(2*height)}" role="img" aria-label="${escapeHTML(item.alt || item.caption || pieceName(item))}"><img src="${escapeHTML(item.image)}" alt="" aria-hidden="true" width="${width}" height="${height}" ${options}/></span>`;
  return `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.alt)}" width="${width}" height="${height}" ${options}/>`;
};
export const brandAssets = {
  tileLight: "/assets/brand/portfolio-adinkra-gold-red.png",
  tileGreen: "/assets/brand/portfolio-adinkra-green.png",
  atlas: "/assets/brand/portfolio-adinkra-atlas.jpg",
  logoInk: "/assets/brand/legacy-wordmark-ink.svg",
  logoIvory: "/assets/brand/legacy-wordmark-ivory.svg",
  label: "/assets/brand/legacy-clothing-label.svg",
  logoSupplied: "/assets/brand/acheampong-sankofa-original.png"
};
export const adinkraMark = (name = "Gye Nyame") => `<span class="adinkra-mark ${name === "Akofena" ? "akofena-mark" : "gye-mark"}" role="img" aria-label="${name} — artwork from the Acheampong portfolio"></span>`;
export function icon(name) {
  const paths = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    close: '<path d="m5 5 14 14M5 19 19 5"/>',
    arrow: '<path d="M3 12h17m-6-6 6 6-6 6"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    bag: '<path d="M5 7h14l2 14H3L5 7Z"/><path d="M9 8V5a3 3 0 0 1 6 0v3"/>',
    zoom: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6M7 10h6M10 7v6"/>'
  };
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}
export function productCard(item) {
  return `<article class="product-card" data-component="product-card"><a href="#/collection/${item.slug}">
    <div class="product-image">${image(item, 'loading="lazy" decoding="async"')}${item.gallery?.[1] ? `<img class="product-alternate" src="${escapeHTML(item.gallery[1])}" alt="" aria-hidden="true" width="${item.imageWidth || 1167}" height="${item.imageHeight || 1347}" loading="lazy"/>` : ""}${item.isConcept ? '<span class="concept-badge">Concept design</span>' : ""}
    <span class="card-action" aria-hidden="true">View ${item.isConcept ? "concept" : "piece"} ${icon("arrow")}</span></div>
    <div class="product-label"><h3>${escapeHTML(pieceName(item))}</h3>${icon("arrow")}</div>
    <p>${escapeHTML(item.palette)}</p>${item.caption ? `<p class="product-caption">${escapeHTML(item.caption)}</p>` : ""}</a></article>`;
}
export const disclosure = '<p class="image-note">Showroom images have been digitally prepared from the collection photographs. Fit, fabric and final details are confirmed with the atelier.</p>';
