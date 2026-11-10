import { articles, getArticle } from "../blog-content.js";
import { escapeHTML, icon, image, pieceName } from "../components/common.js";

const articleMeta = article => `<p class="journal-meta"><span>${escapeHTML(article.category)}</span><span>${article.minutesRead} min read</span></p>`;
const articleLink = article => `#/blog/${article.slug}`;

function lookFigure(item, caption) {
  return `<figure class="journal-look"><a href="#/collection/${item.slug}" aria-label="View ${escapeHTML(pieceName(item))}">${image(item, 'loading="lazy"', "(max-width: 699px) 90vw, 360px")}</a><figcaption>${escapeHTML(caption)} <a class="text-link" href="#/collection/${item.slug}">View the concept ${icon("arrow")}</a></figcaption></figure>`;
}

export function journalFeature(article, headingId, options = 'loading="lazy"') {
  const href = articleLink(article);
  return `<section class="journal-feature shell" aria-labelledby="${headingId}"><a class="journal-feature-image" href="${href}" aria-label="Read ${escapeHTML(article.title)}">${image(article.hero, options, "(max-width: 699px) 90vw, 380px")}</a><div class="journal-feature-copy">${articleMeta(article)}<h2 id="${headingId}"><a href="${href}">${escapeHTML(article.title)}</a></h2><p>${escapeHTML(article.excerpt)}</p><a class="ornament-button" href="${href}">Read the story ${icon("arrow")}</a></div></section>`;
}

export function blogPage() {
  const [featured] = articles;
  return `<main id="main" class="journal-index" tabindex="-1"><header class="journal-heading shell"><p class="eyebrow">The journal</p><h1>Stories we carry.</h1><p>A closer look at African fashion, the diaspora and the details that bring our designs together.</p></header>
    ${journalFeature(featured, "journal-feature-title", 'fetchpriority="high"')}</main>`;
}

export function blogArticlePage(slug) {
  const article = getArticle(slug);
  if (!article) return null;
  return `<main id="main" class="journal-article-page" tabindex="-1"><nav class="journal-breadcrumb shell" aria-label="Breadcrumb"><a href="#/blog">The journal</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHTML(article.title)}</span></nav>
    <article class="journal-article"><header class="journal-article-heading shell">${articleMeta(article)}<h1>${escapeHTML(article.title)}</h1><p>${escapeHTML(article.excerpt)}</p></header>
    <div class="shell"><div class="journal-prose"><p class="journal-introduction">${escapeHTML(article.introduction)}</p>
    ${article.sections.map(section => `<section><h2>${escapeHTML(section.heading)}</h2>${section.look ? lookFigure(section.look, section.caption) : ""}${section.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join("")}</section>`).join("")}
    <section class="journal-sources"><h2>Further reading</h2><ul>${article.sources.map(source => `<li><a href="${escapeHTML(source.href)}">${escapeHTML(source.title)}</a></li>`).join("")}</ul></section>
    <a class="text-link" href="#/blog">Back to the journal ${icon("arrow")}</a></div></div></article></main>`;
}
