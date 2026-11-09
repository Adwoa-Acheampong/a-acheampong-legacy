import {garments} from "../catalog.js";
import {escapeHTML,icon,pieceName} from "../components/common.js";
import {getBag,bagSummary,formatPrice,checkoutReadiness,standardSizes,updateQuantity,removeLine,commerceConfig,setMarket} from "../store.js";
const snapshotKey="legacy-paystack-checkout-v1";
export const checkoutRequestKey="legacy-paystack-requests-v1";
const validReference=value=>typeof value==="string"&&/^legacy-[a-f0-9]{48}$/.test(value);
const validToken=value=>typeof value==="string"&&/^[A-Za-z0-9_-]{43}$/.test(value);
const validFingerprint=value=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
function checkoutStorage(){try{return globalThis.sessionStorage;}catch{return null;}}
function requestRecords(storage){
 try{const saved=JSON.parse(storage?.getItem(checkoutRequestKey)||"[]");return Array.isArray(saved)?saved.filter(row=>validFingerprint(row?.fingerprint)&&typeof row.key==="string"&&/^[A-Za-z0-9._:-]{16,128}$/.test(row.key)).slice(-20):[];}catch{return[];}
}
// Customer details are used only to calculate a digest; the retry journal stores
// no email, name, address or order body. Line order and harmless case changes do
// not produce a second checkout attempt.
export async function checkoutFingerprint(payload,cryptoImpl=globalThis.crypto){
 const grouped=new Map();
 for(const row of payload.lines){const key=`${row.slug}:${row.size}`;grouped.set(key,{slug:row.slug,size:row.size,qty:(grouped.get(key)?.qty||0)+row.qty});}
 const customer=Object.fromEntries(["email","name","address","city","country"].map(key=>[key,String(payload.customer[key]||"").trim()]));
 customer.email=customer.email.toLowerCase();customer.country=customer.country.toLowerCase();
 const normalized={lines:[...grouped.values()].sort((a,b)=>a.slug.localeCompare(b.slug)||a.size.localeCompare(b.size)),customer};
 const bytes=await cryptoImpl.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(normalized)));
 return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
}
export async function checkoutRequest(payload,{storage=checkoutStorage(),cryptoImpl=globalThis.crypto}={}){
 const fingerprint=await checkoutFingerprint(payload,cryptoImpl),records=requestRecords(storage);
 const existing=records.find(row=>row.fingerprint===fingerprint);
 if(existing)return{fingerprint,key:existing.key};
 const record={fingerprint,key:cryptoImpl.randomUUID()};
 try{storage.setItem(checkoutRequestKey,JSON.stringify([...records,record].slice(-20)));}
 catch{throw new Error("Your browser couldn’t save checkout progress. Allow this site to save session data before starting a payment.");}
 return record;
}
function retireRequest(fingerprint,storage=checkoutStorage()){
 if(!validFingerprint(fingerprint))return;
 storage?.setItem(checkoutRequestKey,JSON.stringify(requestRecords(storage).filter(row=>row.fingerprint!==fingerprint)));
}
export function saveCheckoutSnapshot(result,lines,{fingerprint,uncertain=false,storage=checkoutStorage()}={}){
 if(!validReference(result?.reference)||!validToken(result?.token))throw new Error("The payment reference could not be verified. Check payment status before trying again.");
 const selected=lines.map(row=>({slug:row.slug,size:row.size,qty:row.qty}));
 if(!selected.length||selected.some(row=>!garments.some(item=>item.slug===row.slug)||!standardSizes.includes(row.size)||!Number.isInteger(row.qty)||row.qty<1||row.qty>10))throw new Error("The original bag selection could not be saved. Check payment status before trying again.");
 const snapshot={reference:result.reference,token:result.token,lines:selected,consumed:false,uncertain,fingerprint};
 try{storage.setItem(snapshotKey,JSON.stringify(snapshot));}catch{const error=new Error("Your browser couldn’t save this payment reference. Check payment status before trying again.");error.paymentDetails={reference:result.reference,token:result.token};throw error;}
 return snapshot;
}
function readSnapshot(storage=checkoutStorage()){
 try{const saved=JSON.parse(storage?.getItem(snapshotKey)||"null");return validReference(saved?.reference)&&validToken(saved?.token)?saved:null;}catch{return null;}
}
export function paymentVerificationHash(result){
 if(!validReference(result?.reference)||!validToken(result?.token))throw new Error("The payment verification link is incomplete.");
 return `#/payment?${new URLSearchParams({reference:result.reference,token:result.token})}`;
}
export function consumePaidCheckout(reference,token,{storage=checkoutStorage()}={}){
 const saved=readSnapshot(storage);
 if(saved?.reference!==reference||saved.token!==token||saved.consumed||!Array.isArray(saved.lines))return false;
 if(saved.lines.some(row=>!garments.some(item=>item.slug===row?.slug)||!standardSizes.includes(row.size)||!Number.isInteger(row.qty)||row.qty<1||row.qty>10))return false;
 // Mark before editing the bag, so a repeated verification cannot remove a
 // later addition with the same garment and size.
 saved.consumed=true;storage.setItem(snapshotKey,JSON.stringify(saved));
 for(const purchased of saved.lines){const row=getBag().find(item=>item.slug===purchased.slug&&item.size===purchased.size);if(row){const remaining=row.quantity-purchased.qty;remaining>0?updateQuantity(row.key,remaining):removeLine(row.key);}}
 retireRequest(saved.fingerprint,storage);return true;
}
function checkoutField([key,label,autocomplete]){return `<div class="field ${key==="address"?"full":""}"><label for="checkout-${key}">${label}</label>${key==="country"?`<select id="checkout-country" name="country" required autocomplete="country-name" aria-describedby="checkout-country-error">${commerceConfig.markets.map(m=>`<option value="${m.country}" ${m.country===commerceConfig.market?"selected":""}>${m.country} · ${m.currency}</option>`).join("")}</select>`:`<input id="checkout-${key}" name="${key}" ${key==="contact"?'type="email"':""} autocomplete="${autocomplete}" required maxlength="${key==="address"?300:120}" aria-describedby="checkout-${key}-error"/>`}<p id="checkout-${key}-error" class="field-error"></p></div>`;}
function summaryMarkup(){const totals=bagSummary();return `<aside class="checkout-summary" id="checkout-summary"><h2>Your bag</h2><p class="checkout-market-note">${escapeHTML(commerceConfig.market)} · ${escapeHTML(commerceConfig.currency || "")}</p><ul>${getBag().map(row=>{const item=garments.find(g=>g.slug===row.slug);return `<li><span>${escapeHTML(pieceName(item))}<small>${escapeHTML(row.size)} · Quantity ${row.quantity}</small></span><a href="#/bag" aria-label="Edit ${escapeHTML(pieceName(item))}">Edit</a></li>`;}).join("")}</ul><dl><div><dt>Subtotal</dt><dd>${formatPrice(totals.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${formatPrice(totals.delivery)}</dd></div><div class="bag-total"><dt>Total</dt><dd>${formatPrice(totals.total)}</dd></div></dl><p class="payment-provider">Paystack checkout</p></aside>`;}
export function checkoutPage(){
 if(!getBag().length)return `<main id="main" tabindex="-1"><section class="commerce-page shell"><header class="commerce-heading"><p class="eyebrow">Checkout</p><h1>Find your first look.</h1><p>Add a garment to your bag before continuing.</p></header><a class="button" href="#/collection">Explore the collection ${icon("arrow")}</a></section></main>`;
 const ready=checkoutReadiness().ready;
 return `<main id="main" tabindex="-1"><section class="commerce-page shell"><header class="commerce-heading"><p class="eyebrow">Your next chapter</p><h1>Checkout</h1><p>Your chosen looks, all in one place.</p></header><div class="checkout-layout"><form id="checkout-form" class="checkout-form" novalidate><h2>Contact & delivery</h2><div class="checkout-fields">${[["name","Full name","name"],["contact","Email address","email"],["address","Delivery address","street-address"],["city","Town or city","address-level2"],["country","Country","country-name"]].map(checkoutField).join("")}</div><div class="checkout-availability"><h3>${ready?"Ready for Paystack checkout.":"Paystack checkout is being prepared."}</h3><p>${ready?"You will review and complete your payment on Paystack. Your card details stay with the payment provider.":"Prices and delivery totals will appear here before you pay. You can review your details or discuss your selection with us."}</p></div><button class="button" type="submit">${ready?"Pay with Paystack":"Review checkout details"} ${icon("arrow")}</button><p id="checkout-status" class="commerce-status" role="status" aria-live="polite"></p><a class="text-link" href="#/atelier?template=custom&from=bag">Discuss my selection with the atelier</a></form>${summaryMarkup()}</div></section></main>`;
}
export function bindCheckout(){
 const form=document.querySelector("#checkout-form");if(!form)return()=>{};let pending=false,alive=true;
 const lockedFields=new Map();
 const lockFields=()=>{for(const name of["name","contact","address","city","country"]){const field=form.elements[name];if(field){lockedFields.set(field,field.disabled);field.disabled=true;}}};
 const unlockFields=()=>{for(const[field,disabled]of lockedFields)field.disabled=disabled;lockedFields.clear();};
 const remembered=readSnapshot();
 if(remembered?.uncertain&&!remembered.consumed){form.querySelector("#checkout-status").textContent="An earlier payment request needs to be checked before starting another.";form.querySelector('button[type="submit"]').textContent="Check existing payment";}
 const submit=async event=>{
  event.preventDefault();if(pending)return;
  const previous=readSnapshot();if(previous?.uncertain&&!previous.consumed){location.hash=paymentVerificationHash(previous);return;}
  const data=Object.fromEntries(new FormData(form)),errors={};
  for(const[key,label]of[["name","your name"],["contact","your email"],["address","your address"],["city","your town or city"],["country","your country"]])if(!data[key]?.trim())errors[key]="Please add "+label+".";
  if(data.contact?.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.trim()))errors.contact="Enter a valid email address for Paystack.";
  for(const key of["name","contact","address","city","country"]){form.elements[key].setAttribute("aria-invalid",String(Boolean(errors[key])));form.querySelector("#checkout-"+key+"-error").textContent=errors[key]||"";}
  const status=form.querySelector("#checkout-status");if(Object.keys(errors).length){status.textContent="Please check the highlighted details.";form.elements[Object.keys(errors)[0]].focus();return;}
  if(!checkoutReadiness().ready){status.textContent="Your details are reviewed. Paystack payments are not enabled yet, and no order has been placed or sent. You can discuss your selection with the atelier.";return;}
  const lines=getBag().map(row=>({slug:row.slug,size:row.size,qty:row.quantity})),payload={lines,customer:{email:data.contact.trim(),name:data.name.trim(),address:data.address.trim(),city:data.city.trim(),country:data.country.trim()}};
  pending=true;lockFields();const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent="Preparing your secure Paystack checkout…";
  try{
   const request=await checkoutRequest(payload);if(!alive)return;
   const response=await fetch("/api/payments/initialize",{method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":request.key},body:JSON.stringify(payload)}),result=await response.json();
   const details=response.ok?result:result.error?.details;
   if(validReference(details?.reference)&&validToken(details?.token)){
    // Save the original selection even when initialization timed out. A valid
    // reference is reconciled before another initialization is allowed.
    saveCheckoutSnapshot(details,lines,{fingerprint:request.fingerprint,uncertain:!response.ok});
    if(!alive)return;
    if(!response.ok){location.hash=paymentVerificationHash(details);return;}
   }
   if(!response.ok)throw new Error(result.error?.message||"Paystack checkout could not be started.");
   let target;try{target=new URL(result.authorizationUrl);}catch{}
   if(!target||target.protocol!=="https:"||target.hostname!=="checkout.paystack.com"||target.port||target.username||target.password||target.hash||target.pathname==="/"){
    if(validReference(result.reference)&&validToken(result.token)){saveCheckoutSnapshot(result,lines,{fingerprint:request.fingerprint,uncertain:true});if(alive)location.hash=paymentVerificationHash(result);return;}
    throw new Error("The checkout address could not be verified. Check payment status before trying again.");
   }
   // An unexpected provider response cannot redirect without a saved, valid
   // verification reference and the original bag snapshot.
   if(!validReference(result.reference)||!validToken(result.token))throw new Error("The payment reference could not be verified. Check payment status before trying again.");
   if(alive)location.assign(target.href);
  }catch(error){if(alive){if(validReference(error.paymentDetails?.reference)&&validToken(error.paymentDetails?.token)){location.hash=paymentVerificationHash(error.paymentDetails);return;}status.textContent=error.message;button.disabled=false;pending=false;unlockFields();}}
 };
 const change=event=>{if(pending||event.target.name!=="country")return;setMarket(event.target.value);document.querySelector("#checkout-summary").outerHTML=summaryMarkup();const ready=checkoutReadiness().ready;const area=form.querySelector(".checkout-availability");area.querySelector("h3").textContent=ready?"Ready for Paystack checkout.":"Paystack checkout is being prepared.";area.querySelector("p").textContent=ready?"You will review and complete your payment on Paystack. Your card details stay with the payment provider.":"Prices and delivery totals will appear here before you pay. You can review your details or discuss your selection with us.";if(!readSnapshot()?.uncertain)form.querySelector('button[type="submit"]').textContent=ready?"Pay with Paystack":"Review checkout details";};
 form.addEventListener("change",change);form.addEventListener("submit",submit);return()=>{alive=false;form.removeEventListener("change",change);form.removeEventListener("submit",submit);};
}
export function paymentPage(params){return `<main id="main" tabindex="-1"><section class="contact-page shell"><p class="eyebrow">Paystack payment</p><h1>Checking your payment.</h1><p id="payment-status" role="status" aria-live="polite">We’ll confirm the result before updating your order.</p><p class="piece-reference">Reference: ${escapeHTML(params.get("reference")||"Not supplied")}</p><button class="button" id="retry-payment" type="button">Check payment status ${icon("arrow")}</button><a class="text-link" href="#/bag">Return to your bag ${icon("arrow")}</a></section></main>`;}
export function bindPayment(params){
 const button=document.querySelector("#retry-payment"),status=document.querySelector("#payment-status"),reference=params.get("reference"),token=params.get("token");let alive=true,pending=false;
 const check=async()=>{if(pending)return;pending=true;button.disabled=true;
  try{if(!reference||!token)throw new Error("This payment link is incomplete. Please contact us with your payment reference.");const response=await fetch("/api/payments/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,token})}),result=await response.json();if(!response.ok)throw new Error(result.error?.message||"The payment result could not be checked.");if(result.reference!==reference||!["paid","pending","failed"].includes(result.status))throw new Error("The saved payment reference did not match this result. Contact us before starting another payment.");if(!alive)return;
   if(result.status==="paid"){document.querySelector("main h1").textContent="Payment confirmed.";status.textContent="Your Paystack payment is confirmed. Keep your reference for any questions about your order.";try{consumePaidCheckout(reference,token);}catch{status.textContent+=" Your bag could not be updated on this device; keep this reference before making another purchase.";}}
   else{document.querySelector("main h1").textContent=result.status==="failed"?"Payment wasn’t completed.":"Payment is still being confirmed.";status.textContent="No successful payment has been confirmed for this reference yet. You can check again.";
    if(result.status==="failed"){try{const saved=readSnapshot();if(saved?.reference===reference&&saved.token===token){saved.uncertain=false;saved.consumed=true;checkoutStorage().setItem(snapshotKey,JSON.stringify(saved));retireRequest(saved.fingerprint);}}catch{}}
   }
  }catch(error){if(alive){document.querySelector("main h1").textContent="We couldn’t confirm this payment.";status.textContent=error.message;}}
  finally{pending=false;if(alive)button.disabled=false;}
 };button.addEventListener("click",check);void check();return()=>{alive=false;button.removeEventListener("click",check);};
}
