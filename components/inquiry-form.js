import { escapeHTML, icon } from "./common.js";
export const atelierContact = Object.freeze({ email: "cc@aacheampong.com", whatsapp: "https://wa.me/qr/VFXTJV2O5DEME1" });
const templates = { look: "I’d love this look in my size. Could you help me with availability and price?", custom: "I’d like a custom version of this design. Could we discuss the possibilities?", size: "I love this piece and would like help choosing the right size." };
export function buildInquirySummary(data) {
 const selection = (data.selection || "").trim().split("\n").filter(line => !/^Preferred size:/i.test(line)).join("\n").trim();
 return ["A ACHEAMPONG LEGACY", `Look / idea: ${data.garment.trim()}${data.size?.trim() ? `\nPreferred size: ${data.size.trim()}` : ""}`, selection ? `Selection details:\n${selection}` : "", (data.message || "").trim(), "Please confirm availability, price and next steps."].filter(Boolean).join("\n\n");
}
export function inquiryForm(selected = "", size = "", template = "look", selection = "") {
 return `<form id="inquiry-form" class="inquiry-form" novalidate><div class="form-intro"><p class="eyebrow">Let’s talk clothes</p><h2>What would you love to wear?</h2><p>Start with a look or an idea. We can work out the fit and finer details together.</p></div>
 <div class="inquiry-templates" role="group" aria-label="Suggested messages">${[["look","This look, in my size"],["custom","A custom version"],["size","Help me choose a size"]].map(([key,label])=>`<button type="button" data-template="${key}" aria-pressed="${key===template}">${label}</button>`).join("")}</div>
 ${selection ? `<div class="bag-enquiry-selection"><p>Your selection</p><pre>${escapeHTML(selection)}</pre><input type="hidden" name="selection" value="${escapeHTML(selection)}"/></div>` : ""}<div class="form-grid"><div class="field full"><label for="garment">The look or idea</label><input id="garment" name="garment" value="${escapeHTML(selected)}" placeholder="A collection piece or something you have in mind" maxlength="180" required aria-describedby="garment-error"/><p class="field-error" id="garment-error"></p></div>
 ${size?`<div class="field full"><label for="requested-size">Preferred size</label><input id="requested-size" name="size" value="${escapeHTML(size)}" maxlength="120"/></div>`:""}
 <div class="field full"><label for="message">Your message <span>(edit it your way)</span></label><textarea id="message" name="message" rows="4" maxlength="3000">${escapeHTML(templates[template] || templates.look)}</textarea></div></div>
 <div class="form-actions"><button class="button" type="submit">Prepare inquiry ${icon("arrow")}</button><p id="form-status" role="status" aria-live="polite"></p></div>
 <section id="prepared-inquiry" class="prepared-inquiry" hidden aria-labelledby="prepared-heading"><p class="eyebrow">Not sent · Ready to share</p><h3 id="prepared-heading" tabindex="-1">Your message is ready.</h3><label class="sr-only" for="inquiry-summary">Your enquiry</label><textarea id="inquiry-summary" class="inquiry-summary" readonly rows="7"></textarea>
 <div class="enquiry-destinations"><a id="email-inquiry" class="button" href="mailto:${atelierContact.email}">Open email ${icon("arrow")}</a><button class="button button-outline" type="button" id="copy-inquiry">Copy message</button><a class="button button-outline" href="${atelierContact.whatsapp}" target="_blank" rel="noopener noreferrer">Open WhatsApp ${icon("arrow")}</a></div><p>For WhatsApp, copy the message and paste it into the conversation. You review and send it yourself.</p><button class="text-link" type="button" id="download-inquiry">Download message</button></section></form>`;
}
export function bindInquiryForm() {
 const form=document.querySelector("#inquiry-form"),status=form.querySelector("#form-status"),prepared=form.querySelector("#prepared-inquiry"),output=form.querySelector("#inquiry-summary");
 let summary="";
 const invalidate=()=>{if(summary){summary="";prepared.hidden=true;status.textContent="Prepare your updated message when you’re ready.";}};
 form.addEventListener("input",invalidate);
 form.querySelectorAll("[data-template]").forEach(button=>button.addEventListener("click",()=>{form.querySelectorAll("[data-template]").forEach(other=>other.setAttribute("aria-pressed",String(other===button)));form.elements.message.value=templates[button.dataset.template];invalidate();}));
 form.addEventListener("submit",event=>{
  event.preventDefault();const data=Object.fromEntries(new FormData(form)),missing=!data.garment.trim();
  form.elements.garment.setAttribute("aria-invalid",String(missing));form.querySelector("#garment-error").textContent=missing?"Add a look or idea to begin.":"";
  if(missing){status.textContent="Tell us which look or idea you have in mind.";form.elements.garment.focus();return;}
  summary=buildInquirySummary(data);
  output.value=summary;form.querySelector("#email-inquiry").href=`mailto:${atelierContact.email}?subject=${encodeURIComponent(`Clothing enquiry — ${data.garment.trim()}`)}&body=${encodeURIComponent(summary)}`;prepared.hidden=false;status.textContent="Prepared. Not sent.";form.querySelector("#prepared-heading").focus();
 });
 form.querySelector("#copy-inquiry").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(summary);status.textContent="Copied. Paste your message into WhatsApp when it opens.";}catch{output.focus();output.select();status.textContent="Select and copy your message below.";}});
 form.querySelector("#download-inquiry").addEventListener("click",()=>{const url=URL.createObjectURL(new Blob([summary],{type:"text/plain;charset=utf-8"})),link=document.createElement("a");link.href=url;link.download="acheampong-legacy-enquiry.txt";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent="Message downloaded. Not sent.";});
}
