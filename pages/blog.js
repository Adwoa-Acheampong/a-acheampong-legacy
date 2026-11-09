import { articles, getArticle } from "../blog-content.js";
import { escapeHTML, icon } from "../components/common.js";

const articleImage = (article, options = 'loading="lazy"') => `<img src="${article.image}" alt="${escapeHTML(article.imageAlt)}" width="${article.imageWidth}" height="${article.imageHeight}" ${options}/>`;
const collectionImage = article => `<img src="${article.collectionImage}" alt="${escapeHTML(article.collectionAlt)}" width="1167" height="1347" loading="lazy"/>`;
const articleMeta = article => `<p class="journal-meta"><span>${escapeHTML(article.category)}</span><span>${article.minutesRead} min read</span></p>`;
const articleLink = article => `#/blog/${article.slug}`;

function storyCard(article) {
  return `<article class="journal-card"><a href="${articleLink(article)}"><div class="journal-card-image">${articleImage(article)}</div>${articleMeta(article)}<h3>${escapeHTML(article.title)}</h3><p class="journal-card-excerpt">${escapeHTML(article.excerpt)}</p><span class="journal-read-link">Read the story ${icon("arrow")}</span></a></article>`;
}

export function blogPage(_params) {
  const [featured, ...more] = articles;
  return `<main id="main" class="journal-index" tabindex="-1"><header class="journal-heading shell"><p class="eyebrow">The journal</p><h1>Stories we carry.</h1><p>From our family to the details in a garment. A closer look at the work, the people and the next chapter.</p></header>
    <section class="journal-feature shell" aria-labelledby="journal-feature-title"><a class="journal-feature-image" href="${articleLink(featured)}" aria-label="Read ${escapeHTML(featured.title)}">${articleImage(featured, 'fetchpriority="high"')}</a><div class="journal-feature-copy">${articleMeta(featured)}<h2 id="journal-feature-title"><a href="${articleLink(featured)}">${escapeHTML(featured.title)}</a></h2><p>${escapeHTML(featured.excerpt)}</p><a class="ornament-button" href="${articleLink(featured)}">Read our story ${icon("arrow")}</a></div></section>
    <section class="journal-more shell" aria-labelledby="journal-more-title"><div class="journal-section-heading"><h2 id="journal-more-title">Inside the collection</h2><a class="text-link" href="#/collection">Explore the pieces ${icon("arrow")}</a></div><div class="journal-card-grid">${more.map(storyCard).join("")}</div></section>
    <section class="journal-invitation shell"><div><p class="eyebrow">A piece of your own</p><h2>Every conversation begins somewhere.</h2><p>A look you love, a detail you noticed or a new idea. Tell us what you have in mind.</p></div><a class="ornament-button" href="#/atelier?template=custom&garment=Custom%20piece">Discuss a custom piece ${icon("arrow")}</a></section></main>`;
}

export function blogArticlePage(slug) {
  const article = getArticle(slug);
  if (!article) return null;
  const related = articles.filter(other => other.slug !== slug);
  return `<main id="main" class="journal-article-page" tabindex="-1"><nav class="journal-breadcrumb shell" aria-label="Breadcrumb"><a href="#/blog">The journal</a><span aria-hidden="true">/</span><span>${escapeHTML(article.category)}</span></nav>
    <article class="journal-article"><header class="journal-article-heading shell">${articleMeta(article)}<h1>${escapeHTML(article.title)}</h1><p>${escapeHTML(article.excerpt)}</p></header><figure class="journal-article-hero shell">${articleImage(article, 'fetchpriority="high"')}<figcaption>${escapeHTML(article.caption)}</figcaption></figure>
    <div class="journal-reading-layout shell"><div class="journal-prose"><p class="journal-introduction">${escapeHTML(article.introduction)}</p>${article.sections.map(section => `<section><h2>${escapeHTML(section.heading)}</h2>${section.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("")}</section>`).join("")}</div>
    <aside class="journal-piece" aria-labelledby="journal-piece-title"><a href="#/collection/${article.garment}">${collectionImage(article)}</a><p class="eyebrow">From the collection</p><h2 id="journal-piece-title">A detail to make your own.</h2><a class="ornament-button" href="${article.action.href}">${escapeHTML(article.action.label)} ${icon("arrow")}</a><a class="text-link" href="${article.supportingAction.href}">${escapeHTML(article.supportingAction.label)} ${icon("arrow")}</a></aside></div></article>
    <section class="journal-more shell" aria-labelledby="journal-related-title"><div class="journal-section-heading"><h2 id="journal-related-title">More stories to carry</h2><a class="text-link" href="#/blog">Back to the journal ${icon("arrow")}</a></div><div class="journal-card-grid">${related.map(storyCard).join("")}</div></section></main>`;
}
