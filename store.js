import { garments } from "./catalog.js";

export const preferredSizeOptions = Object.freeze(["S", "M", "L", "XL", "2XL", "3XL", "Made to measure"]);
// Prices use major currency units. Inventory records may supply sizes and stockBySize.
// Empty values deliberately represent business information that has not been supplied.
export const standardSizes = preferredSizeOptions.filter(size => size !== "Made to measure");
export const commerceConfig = { currency: "GHS", market: "Ghana", markets:[{country:"Ghana",currency:"GHS",deliveryMinor:null,paymentConfigured:false},{country:"Nigeria",currency:"NGN",deliveryMinor:null,paymentConfigured:false}], pricesByCurrencyMinor:{GHS:{},NGN:{}}, prices: {}, inventory: Object.fromEntries(garments.map(item => [item.slug, {sizes:[...standardSizes]}])), delivery: null, payment: {provider:"paystack",configured:false} };
export function setMarket(country) {
 const market=commerceConfig.markets.find(item=>item.country===country);if(!market)return false;
 commerceConfig.market=country;commerceConfig.currency=market.currency;
 commerceConfig.prices=Object.fromEntries(Object.entries(commerceConfig.pricesByCurrencyMinor?.[market.currency]||{}).filter(([slug,amount])=>garments.some(item=>item.slug===slug)&&Number.isSafeInteger(amount)&&amount>=0).map(([slug,amount])=>[slug,amount/100]));
 commerceConfig.delivery={fee:Number.isSafeInteger(market.deliveryMinor)?market.deliveryMinor/100:null,countries:commerceConfig.markets.map(item=>item.country)};
 commerceConfig.payment={provider:"paystack",configured:market.paymentConfigured===true};
 try{globalThis.localStorage?.setItem("legacy-shop-market-v1",country);}catch{}
 return true;
}
export async function loadCommerceConfig() {
 try { const response = await fetch("/api/commerce", {signal:AbortSignal.timeout(4000)}); if(!response.ok)return false; const data = await response.json();
  commerceConfig.currency = data.currency || null; commerceConfig.prices = Object.fromEntries(Object.entries(data.pricesMinor || {}).filter(([slug,amount]) => garments.some(item=>item.slug===slug) && Number.isSafeInteger(amount) && amount>=0).map(([slug,amount])=>[slug,amount/100]));
  commerceConfig.inventory = data.inventory || commerceConfig.inventory; commerceConfig.delivery = {fee:Number.isSafeInteger(data.deliveryMinor) ? data.deliveryMinor/100 : null,countries:data.deliveryCountries || []}; commerceConfig.payment = data.payment || {provider:"paystack",configured:false};
  const markets=Array.isArray(data.markets)?[...new Map(data.markets.filter(m=>m&&((m.country==="Ghana"&&m.currency==="GHS")||(m.country==="Nigeria"&&m.currency==="NGN"))).map(m=>[m.country,m])).values()]:[];
  if(markets.length){
   commerceConfig.markets=markets;commerceConfig.pricesByCurrencyMinor=data.pricesByCurrencyMinor||{};let saved;try{saved=globalThis.localStorage?.getItem("legacy-shop-market-v1");}catch{}
   const selected=markets.find(m=>m.country===saved)||markets.find(m=>m.country==="Ghana")||markets[0];setMarket(selected.country);
  }
  return true;
 } catch { return false; }
}
export const bagStorageKey = "legacy-shopping-bag-v1";
const knownSlugs = new Set(garments.map(item => item.slug));
let memoryBag = [], activeStorage, memoryOnly = false;
const lineKey = (slug, size) => `${slug}--${encodeURIComponent(size)}`;
function storage() {
  try {
    const current = globalThis.localStorage;
    if (current !== activeStorage) { activeStorage = current; memoryOnly = false; }
    return memoryOnly ? null : current;
  } catch { return null; }
}
function validQuantity(value) { return Number.isInteger(value) && value >= 1 && value <= 10; }
function cleanBag(value) {
  if (!Array.isArray(value)) return [];
  const combined = new Map();
  for (const row of value) {
    if (!row || !knownSlugs.has(row.slug) || !preferredSizeOptions.includes(row.size) || !validQuantity(row.quantity)) continue;
    const key = lineKey(row.slug, row.size);
    const quantity = Math.min(10, (combined.get(key)?.quantity || 0) + row.quantity);
    combined.set(key, { slug: row.slug, size: row.size, quantity, key });
  }
  return [...combined.values()];
}
export function getBag() {
  const target = storage();
  if (target) {
    try { memoryBag = cleanBag(JSON.parse(target.getItem(bagStorageKey) || "[]")); }
    catch { memoryOnly = true; }
  }
  return memoryBag.map(row => ({ ...row }));
}
function saveBag(rows) {
  memoryBag = cleanBag(rows);
  const target = storage();
  if (target) {
    try { target.setItem(bagStorageKey, JSON.stringify(memoryBag.map(({ slug, size, quantity }) => ({ slug, size, quantity })))); }
    catch { memoryOnly = true; }
  }
  if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") document.dispatchEvent(new CustomEvent("legacy:bag-change"));
  return getBag();
}
export function addToBag(slug, size, quantity = 1) {
  if (!knownSlugs.has(slug)) throw new RangeError("Choose a garment from the collection.");
  if (!preferredSizeOptions.includes(size)) throw new RangeError("Choose your preferred size.");
  if (!validQuantity(quantity)) throw new RangeError("Choose a quantity from 1 to 10.");
  const rows = getBag(), key = lineKey(slug, size), existing = rows.find(row => row.key === key);
  if (existing) existing.quantity = Math.min(10, existing.quantity + quantity);
  else rows.push({ slug, size, quantity });
  return saveBag(rows).find(row => row.key === key);
}
export function updateQuantity(key, quantity) {
  if (!validQuantity(quantity)) throw new RangeError("Choose a quantity from 1 to 10.");
  const rows = getBag(), row = rows.find(item => item.key === key);
  if (!row) return rows;
  row.quantity = quantity;
  return saveBag(rows);
}
export function updateSize(key, size) {
  if (!preferredSizeOptions.includes(size)) throw new RangeError("Choose your preferred size.");
  const rows = getBag(), row = rows.find(item => item.key === key);
  if (!row) return rows;
  const rest = rows.filter(item => item.key !== key), destination = rest.find(item => item.slug === row.slug && item.size === size);
  if (destination) destination.quantity = Math.min(10, destination.quantity + row.quantity);
  else rest.push({ ...row, size });
  return saveBag(rest);
}
export const removeLine = key => saveBag(getBag().filter(row => row.key !== key));
export const clearBag = () => saveBag([]);
export const getBagCount = () => getBag().reduce((sum, row) => sum + row.quantity, 0);
export function confirmedSizesFor(slug) {
  const record = commerceConfig.inventory[slug];
  if (!record) return [];
  const sizes = Array.isArray(record.sizes) ? record.sizes : Object.keys(record.stockBySize || {});
  return [...new Set(sizes)].filter(size => size !== "Made to measure" && preferredSizeOptions.includes(size) && (!Object.hasOwn(record.stockBySize || {}, size) || Number(record.stockBySize[size]) > 0));
}
export const matchesConfirmedSize = (slug, size) => !size || size === "all" || confirmedSizesFor(slug).includes(size);
export function priceFor(slug) {
  const amount = commerceConfig.prices[slug];
  return /^[A-Z]{3}$/.test(commerceConfig.currency || "") && typeof amount === "number" && Number.isFinite(amount) && amount >= 0 ? amount : null;
}
export function formatPrice(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || !/^[A-Z]{3}$/.test(commerceConfig.currency || "")) return "To be confirmed";
  return new Intl.NumberFormat("en", { style: "currency", currency: commerceConfig.currency }).format(amount);
}
export function bagSummary() {
  const rows = getBag();
  const priced = rows.length > 0 && rows.every(row => priceFor(row.slug) !== null);
  const subtotal = priced ? rows.reduce((sum, row) => sum + priceFor(row.slug) * row.quantity, 0) : null;
  const fee = commerceConfig.delivery?.fee;
  const delivery = typeof fee === "number" && Number.isFinite(fee) && fee >= 0 ? fee : null;
  return { count: rows.reduce((sum, row) => sum + row.quantity, 0), subtotal, delivery, total: subtotal !== null && delivery !== null ? subtotal + delivery : null, currency: commerceConfig.currency };
}
export function checkoutReadiness() {
  const rows = getBag(), missing = [];
  if (!rows.length) missing.push("a garment in your bag");
  if (!rows.length || rows.some(row => priceFor(row.slug) === null)) missing.push("confirmed prices and currency");
  if (rows.some(row => !confirmedSizesFor(row.slug).includes(row.size))) missing.push("confirmed size availability");
  if (bagSummary().delivery === null || !Array.isArray(commerceConfig.delivery?.countries) || !commerceConfig.delivery.countries.length) missing.push("delivery charges and destinations");
  if (commerceConfig.payment?.provider !== "paystack" || !commerceConfig.payment?.configured) missing.push("a connected payment service");
  return { ready: missing.length === 0, missing };
}
