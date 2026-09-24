/* ==========================================================================
   AvenTP — comportements (sans dépendance)
   1. Menu burger (mobile)
   2. Diaporama des réalisations (accueil)
   3. Filtres de la page Réalisations
   ========================================================================== */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. Menu burger ---------- */
function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  // Un clic sur un lien (ancre de la même page) referme le menu.
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- 2. Diaporama ----------
   Le défilement est du scroll natif (CSS scroll-snap). Le JS se contente de :
   - calculer la « page » courante à partir de scrollLeft,
   - avancer d'une carte toutes les 4 s (pause au survol / au focus),
   - piloter flèches et points. */
function initCarousel(root) {
  const track = root.querySelector(".carousel__track");
  const slides = [...track.children];
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const dotsBox = root.querySelector(".carousel__dots");
  const DELAY = 4000;

  // Largeur d'un pas = largeur d'une carte + écart (gap) de la grille.
  const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  // Nombre de positions = cartes − cartes visibles + 1.
  const visible = () => Math.max(1, Math.round(track.clientWidth / step()));
  const positions = () => Math.max(1, slides.length - visible() + 1);
  const current = () => Math.round(track.scrollLeft / step());

  const goTo = (i) => {
    const n = positions();
    const target = ((i % n) + n) % n; // modulo positif : -1 → n-1
    track.scrollTo({ left: target * step() });
  };

  // Points : reconstruits si le nombre de positions change (redimensionnement).
  let dots = [];
  const buildDots = () => {
    const n = positions();
    if (dots.length === n) return;
    dotsBox.innerHTML = "";
    dots = Array.from({ length: n }, (_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Aller à la position ${i + 1} sur ${n}`);
      b.append(document.createElement("span"));
      b.addEventListener("click", () => { goTo(i); restart(); });
      dotsBox.append(b);
      return b;
    });
    syncDots();
  };
  const syncDots = () => {
    const c = current();
    dots.forEach((d, i) => d.setAttribute("aria-current", String(i === c)));
  };

  prev.addEventListener("click", () => { goTo(current() - 1); restart(); });
  next.addEventListener("click", () => { goTo(current() + 1); restart(); });

  let raf;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(syncDots);
  }, { passive: true });
  window.addEventListener("resize", buildDots);

  // Lecture automatique
  let timer = null;
  let paused = false;
  const start = () => {
    if (prefersReducedMotion || timer) return;
    timer = setInterval(() => { if (!paused && !document.hidden) goTo(current() + 1); }, DELAY);
  };
  const stop = () => { clearInterval(timer); timer = null; };
  function restart() { stop(); start(); }

  root.addEventListener("mouseenter", () => { paused = true; });
  root.addEventListener("mouseleave", () => { paused = false; });
  root.addEventListener("focusin", () => { paused = true; });
  root.addEventListener("focusout", () => { paused = false; });

  buildDots();
  start();
}

/* ---------- 3. Filtres ----------
   Chaque carte porte data-category="allees|terrasses|…".
   Chaque bouton porte data-filter="tous|allees|…". */
function initFilters(root) {
  const buttons = [...root.querySelectorAll("[data-filter]")];
  const items = [...document.querySelectorAll("[data-category]")];
  const counter = root.querySelector("[data-filter-count]");

  // Compteurs calculés depuis le HTML : ajouter une carte suffit.
  buttons.forEach((btn) => {
    const f = btn.dataset.filter;
    const n = f === "tous" ? items.length : items.filter((it) => it.dataset.category === f).length;
    const badge = btn.querySelector(".filter__count");
    if (badge) badge.textContent = n;
  });

  const apply = (filter) => {
    let shown = 0;
    items.forEach((it) => {
      const visible = filter === "tous" || it.dataset.category === filter;
      it.hidden = !visible;
      if (visible) shown++;
    });
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
    if (counter) counter.textContent = `${shown} réalisation${shown > 1 ? "s" : ""}`;
  };

  buttons.forEach((b) => b.addEventListener("click", () => {
    apply(b.dataset.filter);
    // Garde le filtre dans l'URL (#allees) : lien partageable, retour arrière OK.
    history.replaceState(null, "", b.dataset.filter === "tous" ? location.pathname : `#${b.dataset.filter}`);
  }));

  const fromHash = location.hash.slice(1);
  apply(buttons.some((b) => b.dataset.filter === fromHash) ? fromHash : "tous");
}

/* ---------- Démarrage ---------- */
initNavToggle();
document.querySelectorAll("[data-carousel]").forEach(initCarousel);
document.querySelectorAll("[data-filters]").forEach(initFilters);

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
