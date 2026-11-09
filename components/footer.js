import { wordmark } from "./header.js";
import { adinkraMark } from "./common.js";
export function footer() {
  return `<footer class="site-footer" data-component="site-footer"><div class="shell footer-main"><div class="footer-brand"><a href="#/" aria-label="A Acheampong Legacy home">${wordmark(true)}</a><p>Rooted in faith.<br/>Carried forward through craft.</p></div>
    <nav aria-label="Explore"><h2>Explore</h2><a href="#/collection">All garments</a><a href="#/collections">Shop by collection</a><a href="#/design">Design studio</a><a href="#/atelier">Custom atelier</a><a href="#/legacy">Our legacy</a><a href="#/blog">Blog</a><a href="#/contact">Contact</a></nav>
    <div class="footer-faith">${adinkraMark()}<p>Gye Nyame<br/><span>Except for God</span></p></div></div>
    <div class="shell footer-bottom"><span>© ${new Date().getFullYear()} A Acheampong Legacy</span><span>A family legacy in African wear.</span><a href="#/legacy">The story behind the symbols</a></div></footer>`;
}
