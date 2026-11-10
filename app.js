import { garments, designReferences } from "./catalog.js";
import { getCollection } from "./collections-data.js";
import { collectionsPage } from "./pages/collections.js";
import { conceptPage } from "./pages/concept.js";
import { header } from "./components/header.js";
import { footer } from "./components/footer.js";
import { icon, pieceName, responsiveSources } from "./components/common.js";
import { bindInquiryForm } from "./components/inquiry-form.js";
import { homePage, bindHome } from "./pages/home.js";
import { collectionPage, defaultSort, resultsMarkup, selectGarments, resultCount } from "./pages/collection.js";
import { detailPage } from "./pages/detail.js";
import { legacyPage } from "./pages/legacy.js";
import { atelierPage } from "./pages/atelier.js";
import { contactPage } from "./pages/contact.js";
import { bagPage, bindBag } from "./pages/bag.js";
import { checkoutPage, bindCheckout, paymentPage, bindPayment } from "./pages/checkout.js";
import { addToBag, getBagCount, loadCommerceConfig } from "./store.js";
import { blogPage, blogArticlePage } from "./pages/blog.js";
import { getArticle } from "./blog-content.js";
import { designPage } from "./pages/design.js";
import { bindDesignStudio } from "./design-studio.js";
import { bindColourExplorer } from "./colour-explorer.js";
import { initMotion } from "./motion.js";

const app = document.querySelector("#app");
let firstRender = true;
let disposeMotion = () => {};
let disposePage = () => {};
function openDialog(dialog, trigger) {
  dialog.showModal(); document.body.classList.add("dialog-open");
  const containFocus = event => {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll("a[href],button,input,select,textarea,[tabindex='0']")].filter(control => !control.disabled && control.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  dialog.addEventListener("keydown", containFocus);
  dialog.addEventListener("close", () => { dialog.removeEventListener("keydown", containFocus); document.body.classList.remove("dialog-open"); trigger?.focus(); }, { once: true });
}
function bindGlobal() {
  document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => openDialog(document.getElementById(button.dataset.open), button)));
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close], a").forEach(control => control.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  });
  document.querySelector("#global-search").addEventListener("submit", event => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q").trim();
    document.querySelector("#search-dialog").close();
    const target = `#/collection${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    if (location.hash === target) render(); else location.hash = target;
  });
  document.querySelectorAll("[data-hero]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-hero]").forEach(other => other.setAttribute("aria-pressed", String(other === button)));
    document.querySelectorAll(".campaign-panel").forEach((panel, index) => panel.classList.toggle("is-selected", String(index) === button.dataset.hero));
  }));
  bindImages();
}
function bindImages() {
  document.querySelectorAll("img:not([data-error-bound])").forEach(img => { img.dataset.errorBound = "true"; img.addEventListener("error", () => {
    const picture = img.parentElement?.closest("picture");
    const mobileSource = picture?.querySelector('source[type="image/webp"]');
    if (mobileSource && matchMedia(mobileSource.media).matches && img.currentSrc.includes("/assets/previews/")) {
      mobileSource.remove();
      return;
    }
    const pictureSources = picture?.querySelectorAll("source");
    if (img.hasAttribute("srcset") || pictureSources?.length) {
      pictureSources?.forEach(source => source.remove());
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      return;
    }
    const message = document.createElement("span"); message.className = "media-error"; message.textContent = "Image unavailable. Open the piece for its details."; img.replaceWith(message);
  }); });
}
function bindCollection(params, collection = null) {
  const form = document.querySelector("#collection-controls");
  const update = () => {
    history.replaceState(null, "", `${collection ? `#/collections/${collection.slug}` : "#/collection"}${params.size ? `?${params}` : ""}`);
    document.querySelector("#collection-results").innerHTML = resultsMarkup(params, collection);
    document.querySelector("#result-count").textContent = resultCount(params, collection);
    document.querySelectorAll("[data-filter]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.filter === (params.get("filter") || "all"))));
    document.querySelectorAll("[data-reset]").forEach(button => button.onclick = reset);
    bindImages();
  };
  const reset = () => { for (const key of [...params.keys()]) params.delete(key); form.reset(); form.querySelector("input").value = ""; form.querySelector("select").value = defaultSort(collection); document.querySelector("#catalog-size").value = "all"; update(); };
  form.addEventListener("submit", event => event.preventDefault());
  form.querySelector("input").addEventListener("input", event => { const value = event.target.value.trim(); value ? params.set("q", value) : params.delete("q"); update(); });
  form.querySelector("select").addEventListener("change", event => { event.target.value === defaultSort(collection) ? params.delete("sort") : params.set("sort", event.target.value); update(); });
  document.querySelector("#catalog-size").addEventListener("change", event => { event.target.value === "all" ? params.delete("size") : params.set("size", event.target.value); update(); });
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { button.dataset.filter === "all" ? params.delete("filter") : params.set("filter", button.dataset.filter); update(); }));
  document.querySelectorAll("[data-reset]").forEach(button => button.onclick = reset);
}
function bindDetail(item) {
  const main = document.querySelector("#gallery-main-image");
  const zoom = document.querySelector("#zoom-image");
  const form = document.querySelector("#detail-buy-form");
  const updateCustomLink = (colour = explorer.getColour()) => {
    const size = new FormData(form).get("size") || "";
    document.querySelector("#detail-enquire").href = `#/atelier?${new URLSearchParams({garment: pieceName(item), size, ...(colour ? {color: colour} : {})})}`;
    form.querySelector('button[type="submit"]').innerHTML = `${colour ? "Add original design to bag" : "Add to bag"} ${icon("bag")}`;
  };
  const explorer = bindColourExplorer(item, updateCustomLink);
  document.querySelectorAll("[data-gallery-image]").forEach(button => button.addEventListener("click", () => {
    explorer.reset();
    const source = button.dataset.galleryImage;
    main.src = source;
    main.srcset = responsiveSources(source) || "";
    zoom.src = source;
    document.querySelectorAll("[data-gallery-image]").forEach(other => other.setAttribute("aria-pressed", String(other === button)));
  }));
  const zoomButton = document.querySelector("[data-zoom]");
  zoomButton.addEventListener("click", () => openDialog(document.querySelector("#zoom-dialog"), zoomButton));
  form.addEventListener("change", () => updateCustomLink());
  form.addEventListener("submit", event => {
    event.preventDefault(); const data = new FormData(form), status = document.querySelector("#detail-feedback");
    if (!data.get("size")) { status.textContent = "Choose your preferred size first."; form.querySelector("input[name=size]").focus(); return; }
    try { addToBag(item.slug, data.get("size"), Number(data.get("quantity"))); status.textContent = explorer.getColour() ? "The original design is in your bag. Use the custom version enquiry for your colour study." : "Added to your bag. All sizes available; the price will be confirmed before payment."; document.querySelector("#detail-view-bag").hidden = false; }
    catch (error) { status.textContent = error.message; }
  });
  return explorer.dispose;
}
function render() {
  disposeMotion(); disposePage(); disposePage = () => {};
  document.querySelectorAll("dialog[open]").forEach(dialog => dialog.close());
  document.body.classList.remove("dialog-open");
  const [path, query = ""] = (location.hash || "#/").slice(1).split("?");
  const params = new URLSearchParams(query);
  const item = path.startsWith("/collection/") ? designReferences.find(garment => garment.slug === path.slice(12)) : null;
  const collection = path.startsWith("/collections/") ? getCollection(path.slice(13)) : null;
  const article = path.startsWith("/blog/") ? getArticle(path.slice(6)) : null;
  const pages = { "/": () => homePage(), "/collection": () => collectionPage(params), "/legacy": () => legacyPage(), "/atelier": () => atelierPage(params), "/contact": () => contactPage(), "/bag": bagPage, "/checkout": checkoutPage, "/blog": () => blogPage(params), "/design": () => designPage(params), "/payment": () => paymentPage(params) };
  const page = item ? item.isConcept ? conceptPage(item) : detailPage(item) : collection ? collectionPage(params, collection) : path === "/collections" ? collectionsPage() : article ? blogArticlePage(article.slug) : pages[path]?.() || `<main id="main" tabindex="-1"><section class="contact-page shell"><p class="eyebrow">Page not found</p><h1>Let's find your piece.</h1><a class="button" href="#/collection">Return to collection ${icon("arrow")}</a></section></main>`;
  const names = { "/": "Showroom", "/collection": "All garments", "/legacy": "Our legacy", "/atelier": "Custom atelier", "/contact": "Contact", "/bag": "Your bag", "/checkout": "Checkout", "/blog": "Stories we carry", "/design": "Design studio", "/payment": "Payment status" };
  app.innerHTML = header(path) + page + footer();
  document.title = `${item ? pieceName(item) : collection?.name || article?.title || (path === "/collections" ? "Shop by collection" : names[path]) || "Page not found"} | A Acheampong Legacy`;
  document.querySelector('meta[name="description"]').content = article?.excerpt || (path === "/blog" ? "Explore African fashion and diaspora design through the garments of A Acheampong Legacy." : "Discover African wear from A Acheampong Legacy. Explore the collection and begin a personal tailoring enquiry with our family atelier.");
  bindGlobal();
  if (path === "/") bindHome();
  if (path === "/bag") disposePage = bindBag();
  if (path === "/checkout") disposePage = bindCheckout();
  if (path === "/payment") disposePage = bindPayment(params);
  if (path === "/design") disposePage = bindDesignStudio();
  if (path === "/collection" || collection) bindCollection(params, collection);
  if (item && !item.isConcept) disposePage = bindDetail(item);
  if (path === "/atelier") bindInquiryForm();
  window.scrollTo({ top: 0, behavior: "instant" });
  disposeMotion = initMotion(document);
  if (!firstRender) document.querySelector("#main").focus({ preventScroll: true });
  firstRender = false;
}
window.addEventListener("hashchange", render);
document.addEventListener("legacy:bag-change", () => document.querySelectorAll("[data-bag-count]").forEach(node => node.textContent = getBagCount()));
document.querySelector(".skip-link").addEventListener("click", event => { event.preventDefault(); document.querySelector("#main").focus(); document.querySelector("#main").scrollIntoView(); });
await loadCommerceConfig();
render();
