import {escapeHTML} from "./components/common.js";
import {dimensions,profiles} from "./colour-profiles.js";
export const colourChoices=[["Cream","#E7D8BC"],["Coffee","#674432"],["Midnight","#273749"],["Forest","#3D6150"],["Burgundy","#793F46"],["Sky blue","#A7C7D6"],["Terracotta","#BC6C4E"]];
export function colourExplorer(item){
 if(!profiles[item.slug])return `<a class="text-link" href="#/design?reference=${encodeURIComponent(item.slug)}">Explore a custom colour in the design studio →</a>`;
 return `<section class="colour-explorer" aria-labelledby="colour-heading"><div class="colour-heading"><h2 id="colour-heading">Explore other colours</h2><button type="button" class="text-link" data-colour-original aria-pressed="true">Original</button></div><div class="fabric-swatches" role="group" aria-label="Fabric colour studies">${colourChoices.map(([name,hex])=>`<button type="button" data-fabric-colour="${hex}" data-colour-label="${name}" style="--fabric-colour:${hex}" aria-label="Preview ${name}" aria-pressed="false"></button>`).join("")}<label class="custom-fabric-colour"><span class="sr-only">Choose any fabric colour</span><input id="custom-fabric-colour" type="color" value="#674432" aria-label="Choose any fabric colour"/></label></div><p id="selected-fabric-colour" role="status" aria-live="polite">Original design</p><p class="colour-study-note">A digital colour study. Fabric and final colour are agreed with the atelier.</p><a id="colour-studio-link" class="text-link" href="#/design?reference=${item.slug}">Develop this design →</a></section>`;
}
export function renderColourStudy(item,hex,prefix="colour-study"){
 if(!/^#[0-9a-f]{6}$/i.test(hex)||!dimensions[item.slug]||!profiles[item.slug])return"";
 const [w,h]=dimensions[item.slug],profile=profiles[item.slug],rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const channel=(name,index)=>`<feFunc${name} type="linear" slope="${(rgb[index]*.45).toFixed(4)}" intercept="${(rgb[index]*.62).toFixed(4)}"/>`;
 return `<svg class="garment-colour-preview" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${escapeHTML(item.title)} digital colour study in ${hex}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="${prefix}-tone" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${channel("R",0)}${channel("G",1)}${channel("B",2)}</feComponentTransfer></filter><mask id="${prefix}-cloth" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><g transform="scale(${w/1000} ${h/1000})"><path d="${profile.cut}" fill="white"/>${profile.keep.map(d=>`<path d="${d}" fill="black"/>`).join("")}</g></mask></defs><image href="${item.image}" width="${w}" height="${h}"/><image href="${item.image}" width="${w}" height="${h}" filter="url(#${prefix}-tone)" mask="url(#${prefix}-cloth)"/></svg>`;
}
export function bindColourExplorer(item,onChange=()=>{}){
 if(!profiles[item.slug])return{getColour:()=>"",reset:()=>{},dispose:()=>{}};
 const section=document.querySelector(".colour-explorer"),gallery=document.querySelector(".gallery-main"),original=document.querySelector("#gallery-main-image"),zoom=document.querySelector("#zoom-image"),zoomDialog=document.querySelector("#zoom-dialog");
 let selected="";
 const reset=()=>set("","");
 function set(hex,name){selected=hex;gallery.querySelector(".garment-colour-preview")?.remove();zoomDialog.querySelector(".garment-colour-preview")?.remove();original.hidden=Boolean(hex);zoom.hidden=Boolean(hex);
  if(hex){gallery.insertAdjacentHTML("afterbegin",renderColourStudy(item,hex,"gallery-colour"));zoomDialog.insertAdjacentHTML("beforeend",renderColourStudy(item,hex,"zoom-colour"));}
  section.querySelectorAll("[data-fabric-colour]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.fabricColour?.toLowerCase()===hex.toLowerCase())));section.querySelector("[data-colour-original]").setAttribute("aria-pressed",String(!hex));document.querySelector("#selected-fabric-colour").textContent=hex?(name||"Custom colour")+" · "+hex.toUpperCase():"Original design";document.querySelector("#colour-studio-link").href="#/design?"+new URLSearchParams({reference:item.slug,...(hex?{color:hex}:{})});onChange(hex);
 }
 section.querySelectorAll("[data-fabric-colour]").forEach(button=>button.addEventListener("click",()=>set(button.dataset.fabricColour,button.dataset.colourLabel)));
 section.querySelector("[data-colour-original]").addEventListener("click",reset);
 section.querySelector("input[type=color]").addEventListener("input",event=>set(event.target.value,"Custom colour"));
 return{getColour:()=>selected,reset,dispose:()=>{}};
}
