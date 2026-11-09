const sessions = new WeakMap();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const restoreAttribute = (node, name, value) => value === null ? node.removeAttribute(name) : node.setAttribute(name, value);

/** Enhance the current page; call the returned disposer before replacing route markup. */
export function initMotion(root = globalThis.document) {
  if (!root?.querySelectorAll) return () => {};
  sessions.get(root)?.();
  const doc = root.ownerDocument || root;
  const win = doc.defaultView;
  if (!win) return () => {};
  const scope = root.documentElement || root;
  const select = selector => [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = win.matchMedia("(min-width: 900px)");
  const initialScopeClass = scope.classList.contains("motion-ready");
  const seen = new WeakSet();
  const staggerDelays = new Map();
  const revealSet = new Set(select("[data-reveal]"));
  select("[data-stagger]").forEach(group => {
    const marked = [...group.querySelectorAll("[data-reveal]")];
    const children = marked.length ? marked : [...group.children];
    const interval = clamp(Number(group.dataset.stagger) || 65, 35, 90);
    children.forEach((node, index) => { revealSet.add(node); staggerDelays.set(node, Math.min(index * interval, 210)); });
  });
  const reveals = [...revealSet].map(node => ({
    node, reveal: node.classList.contains("motion-reveal"), shown: node.classList.contains("is-revealed"),
    pending: node.getAttribute("data-motion-pending"), delay: node.style.getPropertyValue("--reveal-delay")
  }));
  const parallax = select("[data-parallax]").map(node => {
    const amount = Number.parseFloat(node.dataset.parallax);
    return { node, amount: clamp(Number.isFinite(amount) ? amount : 16, 0, 24), original: node.style.getPropertyValue("--parallax-y") };
  });
  const headers = select(".site-header[data-landing-header]").map(node => ({ node, scrolled: node.classList.contains("is-scrolled") }));
  const stories = select("[data-story-track]").map(track => {
    const visual = track.querySelector("[data-story-visual]");
    const scenes = [...track.querySelectorAll("[data-story-scene]")];
    const frames = [...(visual?.querySelectorAll("[data-story-frame]") || [])];
    if (!visual || !scenes.length || scenes.length !== frames.length) return null;
    return {
      track, scenes, active: -1, ready: track.classList.contains("story-motion-ready"),
      previousIndex: track.getAttribute("data-active-scene"),
      sceneStates: scenes.map(node => node.classList.contains("is-current")),
      frames: frames.map(node => ({ node, active: node.classList.contains("is-active"), hidden: node.getAttribute("aria-hidden"), inert: node.inert })),
      counters: [...track.querySelectorAll("[data-story-index]")].map(node => ({ node, text: node.textContent }))
    };
  }).filter(Boolean);
  let observer = null;
  let scheduled = 0;
  let disposed = false;

  function reveal(node) {
    seen.add(node);
    node.removeAttribute("data-motion-pending");
    node.classList.add("is-revealed");
    observer?.unobserve(node);
  }
  function configureReveals() {
    observer?.disconnect();
    observer = null;
    scope.classList.toggle("motion-ready", !reduced.matches);
    if (!reduced.matches && win.IntersectionObserver) {
      observer = new win.IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
      }, { threshold: .12, rootMargin: "0px 0px -7% 0px" });
    }
    reveals.forEach(({ node }) => {
      node.classList.add("motion-reveal");
      node.style.setProperty("--reveal-delay", `${staggerDelays.get(node) || 0}ms`);
      const rect = node.getBoundingClientRect();
      if (reduced.matches || !observer) {
        node.removeAttribute("data-motion-pending");
        node.classList.add("is-revealed");
      } else if (seen.has(node) || rect.top <= win.innerHeight * .94) reveal(node);
      else {
        node.classList.remove("is-revealed");
        node.setAttribute("data-motion-pending", "true");
        observer.observe(node);
      }
    });
    queueUpdate();
  }
  function update() {
    scheduled = 0;
    if (disposed) return;
    const viewport = win.innerHeight;
    const chapterSelections = stories.map(story => {
      const distances = story.scenes.map(scene => {
        const rect = scene.getBoundingClientRect();
        return Math.abs(rect.top + rect.height / 2 - viewport * .52);
      });
      return distances.indexOf(Math.min(...distances));
    });
    const offsets = parallax.map(({ node, amount }) => {
      if (reduced.matches || !desktop.matches) return 0;
      const rect = (node.parentElement || node).getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) return 0;
      return clamp((rect.top + rect.height / 2 - viewport / 2) / ((viewport + rect.height) / 2), -1, 1) * -amount;
    });
    headers.forEach(({ node }) => node.classList.toggle("is-scrolled", win.scrollY > 32));
    stories.forEach((story, index) => {
      const active = chapterSelections[index];
      if (active === story.active) return;
      story.active = active;
      story.track.classList.add("story-motion-ready");
      story.track.setAttribute("data-active-scene", String(active));
      story.scenes.forEach((node, i) => node.classList.toggle("is-current", i === active));
      story.frames.forEach(({ node }, i) => {
        node.classList.toggle("is-active", i === active);
        node.setAttribute("aria-hidden", String(i !== active));
        node.inert = i !== active;
      });
      story.counters.forEach(({ node }) => { node.textContent = `${String(active + 1).padStart(2, "0")} / ${String(story.scenes.length).padStart(2, "0")}`; });
    });
    parallax.forEach(({ node }, index) => node.style.setProperty("--parallax-y", `${offsets[index].toFixed(2)}px`));
  }
  function queueUpdate() {
    if (!disposed && !scheduled) scheduled = win.requestAnimationFrame(update);
  }
  function onScrollControl(event) {
    const trigger = event.target.closest?.("[data-scroll-to]");
    if (!trigger || !root.contains(trigger)) return;
    const target = doc.getElementById((trigger.dataset.scrollTo || "").replace(/^#/, ""));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduced.matches ? "auto" : "smooth", block: "start" });
    if (target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
  }
  function onPreferenceChange() { configureReveals(); }
  root.addEventListener("click", onScrollControl);
  root.addEventListener("load", queueUpdate, true);
  win.addEventListener("scroll", queueUpdate, { passive: true });
  win.addEventListener("resize", queueUpdate, { passive: true });
  reduced.addEventListener("change", onPreferenceChange);
  desktop.addEventListener("change", queueUpdate);
  configureReveals();
  win.cancelAnimationFrame(scheduled);
  update();
  doc.fonts?.ready.then(() => { if (!disposed) queueUpdate(); });

  function cleanup() {
    if (disposed) return;
    disposed = true;
    observer?.disconnect();
    win.cancelAnimationFrame(scheduled);
    root.removeEventListener("click", onScrollControl);
    root.removeEventListener("load", queueUpdate, true);
    win.removeEventListener("scroll", queueUpdate);
    win.removeEventListener("resize", queueUpdate);
    reduced.removeEventListener("change", onPreferenceChange);
    desktop.removeEventListener("change", queueUpdate);
    scope.classList.toggle("motion-ready", initialScopeClass);
    reveals.forEach(({ node, reveal: initial, shown, pending, delay }) => {
      node.classList.toggle("motion-reveal", initial);
      node.classList.toggle("is-revealed", shown);
      restoreAttribute(node, "data-motion-pending", pending);
      delay ? node.style.setProperty("--reveal-delay", delay) : node.style.removeProperty("--reveal-delay");
    });
    parallax.forEach(({ node, original }) => original ? node.style.setProperty("--parallax-y", original) : node.style.removeProperty("--parallax-y"));
    headers.forEach(({ node, scrolled }) => node.classList.toggle("is-scrolled", scrolled));
    stories.forEach(story => {
      story.track.classList.toggle("story-motion-ready", story.ready);
      restoreAttribute(story.track, "data-active-scene", story.previousIndex);
      story.scenes.forEach((node, i) => node.classList.toggle("is-current", story.sceneStates[i]));
      story.frames.forEach(({ node, active, hidden, inert }) => {
        node.classList.toggle("is-active", active);
        restoreAttribute(node, "aria-hidden", hidden);
        node.inert = inert;
      });
      story.counters.forEach(({ node, text }) => { node.textContent = text; });
    });
    if (sessions.get(root) === cleanup) sessions.delete(root);
  }
  sessions.set(root, cleanup);
  return cleanup;
}
