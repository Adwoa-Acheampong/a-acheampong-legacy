import { inquiryForm } from "../components/inquiry-form.js";
import { icon, escapeHTML } from "../components/common.js";
import { pieceName } from "../components/common.js";
import { garments } from "../catalog.js";
import { getBag } from "../store.js";
import { getDesignDraft } from "../design-studio.js";
export function atelierPage(params) {
  const from = params.get("from"), draft = from === "design" ? getDesignDraft() : null;
  const colour = /^#[\da-f]{6}$/i.test(params.get("color") || "") ? params.get("color").toUpperCase() : "";
  const selection = draft ? draft.brief : from === "bag" ? getBag().map(row => `${pieceName(garments.find(item => item.slug === row.slug))} · ${row.size} · Quantity ${row.quantity}`).join("\n") : colour ? [params.get("garment"), params.get("size") ? `Preferred size: ${params.get("size")}` : "", `Requested colour study: ${colour}`, "Please discuss the fabric and final colour with me."].filter(Boolean).join("\n") : "";
  const preview = draft ? `<aside class="enquiry-design-preview"><div>${draft.sketchSvg}</div><div><p class="eyebrow">Your design, ready to discuss</p><h2>A starting point for our conversation.</h2><p>Your latest design choices are included below. Download your sketch or illustration from the studio and attach it when you send your message.</p><a class="text-link" href="#/design">Return to your design ${icon("arrow")}</a>${draft.generated ? `<a class="text-link" href="${escapeHTML(draft.generated.imageUrl)}" target="_blank" rel="noopener noreferrer">Open saved AI illustration ${icon("arrow")}</a>` : ""}</div></aside>` : "";
  return `<main id="main" tabindex="-1"><header class="atelier-heading shell"><div><p class="eyebrow">The custom atelier</p><h1>Wear it your way.</h1><p>A collection piece, a special occasion or a new direction. Start with what you have in mind.</p><a class="text-link" href="#/design">Explore the design studio ${icon("arrow")}</a></div><div><h2>A conversation is all it takes to begin.</h2><p>Choose a suggested message below. Fit, fabric, price and timing can follow when we talk.</p></div></header><section class="form-section shell" aria-label="Prepare a custom enquiry">${preview}${inquiryForm(draft ? "My custom design" : from === "bag" ? "My bag selection" : params.get("garment") || "", params.get("size") || "", params.get("template") || (draft || colour ? "custom" : "look"), selection)}</section></main>`;
}
