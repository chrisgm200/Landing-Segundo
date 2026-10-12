/* ============================================================
   CONFIGURACIÓN
   true  = las animaciones SIEMPRE se ven (aunque el sistema operativo tenga
           activado "reducir movimiento" / "mostrar animaciones" desactivado).
   false = se respeta esa preferencia del sistema (solo desvanecimientos suaves).
   ============================================================ */
const FORCE_ANIMATIONS = true;

const root = document.documentElement;
if (FORCE_ANIMATIONS) root.classList.add('force-motion');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !FORCE_ANIMATIONS;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/* ---------- MENÚ HAMBURGUESA ---------- */
const siteHeader = document.getElementById('site-header');
const navPill = document.querySelector('.nav-pill');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('nav-links');
const navBackdrop = document.getElementById('nav-backdrop');
const MENU_BREAKPOINT = 860;

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  navLinks.classList.toggle('open', open);
  siteHeader.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navBackdrop.addEventListener('click', () => setMenu(false));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > MENU_BREAKPOINT) setMenu(false); });

/* ---------- ANIMACIÓN AL HACER SCROLL (bajando y subiendo) ----------
   Entra en pantalla -> aparece. Sale -> se oculta, para repetirse en ambos sentidos.
   Si sale por ARRIBA (estás subiendo), vuelve a entrar desde arriba (reversa). */
const revealEls = [...document.querySelectorAll('.reveal')];
revealEls.forEach(el => {
  const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.setProperty('--d', Math.min(siblings.indexOf(el), 5) * 0.09 + 's');
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('is-visible');
      } else {
        el.dataset.from = entry.boundingClientRect.top < 0 ? 'top' : 'bottom';
        el.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

/* ---------- SECCIÓN ACTIVA EN EL MENÚ ---------- */
const sections = [...document.querySelectorAll('main section[id]')];
const links = [...document.querySelectorAll('.nav-links a')];
const activeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => {
      const active = link.getAttribute('href') === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(section => activeObserver.observe(section));

/* ---------- EFECTOS LIGADOS AL SCROLL ---------- */
const progressBar = document.getElementById('scroll-progress');
const routeList = document.getElementById('route-list');
const routeCards = routeList ? [...routeList.querySelectorAll('.route-card')] : [];
const routeBarFill = document.getElementById('route-bar-fill');
const routeCountNow = document.getElementById('route-count-now');
let stickyTops = [];
let ticking = false;

function measureRoute() {
  stickyTops = routeCards.map(card => parseFloat(getComputedStyle(card).top) || 0);
}

function updateScroll() {
  const y = window.scrollY || window.pageYOffset;
  const vh = window.innerHeight;
  const docH = document.documentElement.scrollHeight - vh;

  navPill.classList.toggle('scrolled', y > 30);
  if (progressBar) progressBar.style.transform = 'scaleX(' + (docH > 0 ? clamp(y / docH, 0, 1) : 0) + ')';

  if (routeCards.length) {
    // Las tarjetas se apilan: la anterior se encoge un poco cuando la siguiente la cubre.
    routeCards.forEach((card, i) => {
      const next = routeCards[i + 1];
      if (!next || reduceMotion) { card.style.setProperty('--s', 1); return; }
      const dist = next.getBoundingClientRect().top - stickyTops[i];
      const p = clamp(1 - dist / (card.offsetHeight * 0.9), 0, 1);
      card.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
    });

    // Barra de progreso y contador de pasos (solo visibles en escritorio)
    const rect = routeList.getBoundingClientRect();
    const last = routeCards[routeCards.length - 1];
    const total = rect.height - last.offsetHeight;
    const progress = total > 0 ? clamp((stickyTops[0] - rect.top) / total, 0, 1) : 0;
    if (routeBarFill) routeBarFill.style.transform = 'scaleX(' + progress.toFixed(3) + ')';
    if (routeCountNow) routeCountNow.textContent = Math.min(routeCards.length, Math.floor(progress * routeCards.length) + 1);
  }
  ticking = false;
}

window.addEventListener('scroll', () => {
  if (!ticking) { window.requestAnimationFrame(updateScroll); ticking = true; }
}, { passive: true });
window.addEventListener('resize', () => { measureRoute(); updateScroll(); });
window.addEventListener('load', () => { measureRoute(); updateScroll(); });
measureRoute();
updateScroll();

/* ---------- CONCEPTOS (pestañas) ---------- */
const conceptData = [
  ['Agresión y violación sexual', 'Actos que atentan contra la libertad sexual mediante violencia o intimidación. Se configura como violación al existir acceso carnal (vaginal, anal o bucal) o penetración de objetos o miembros corporales.'],
  ['Abuso sexual directo', 'Actos contra la indemnidad o libertad sexual sin violencia física o intimidación, ni consentimiento válido, aprovechándose de una posición de autoridad o superioridad para coaccionar a la víctima.'],
  ['Abuso sexual indirecto', 'Inducción a participar o presenciar conductas sexuales sin contacto físico directo. Incluye comunicaciones o propuestas por internet, teléfono u otra tecnología de la información, y la obtención o exhibición engañosa de material pornográfico.'],
  ['Acoso sexual', 'Solicitud habitual o continuada de favores sexuales dentro de una relación pastoral o docente, creando un entorno intimidatorio, hostil o humillante.'],
  ['Provocación sexual', 'Ejecución o imposición de actos de exhibición obscena (exhibicionismo) ante un menor o persona vulnerable.'],
  ['Explotación sexual o corrupción', 'Inducir, promover, facilitar o lucrar con la prostitución u otra forma de explotación de un menor o persona en condición de vulnerabilidad.'],
  ['Pornografía infantil', 'Captación, producción, tenencia, comercialización, difusión o exhibición por cualquier medio de material pornográfico que involucra a menores o personas en condición de vulnerabilidad.']
];
const conceptButtons = [...document.querySelectorAll('.concept-tab')];
const conceptPanel = document.querySelector('.concept-panel');

function showConcept(i) {
  const [title, description] = conceptData[i];
  conceptButtons.forEach((button, index) => {
    button.classList.toggle('active', index === i);
    button.setAttribute('aria-selected', String(index === i));
  });
  conceptPanel.style.animation = 'none';
  void conceptPanel.offsetWidth;
  conceptPanel.style.animation = 'panel-in .35s both';
  conceptPanel.querySelector('.concept-index').textContent = String(i + 1).padStart(2, '0') + ' / 07';
  conceptPanel.querySelector('h3').textContent = title;
  conceptPanel.querySelector('p').textContent = description;
}
conceptButtons.forEach(button => button.addEventListener('click', () => showConcept(Number(button.dataset.concept))));

/* ---------- PREVENCIÓN (acordeón nativo accesible) ---------- */
document.querySelectorAll('.prevention-card').forEach(card => {
  card.addEventListener('toggle', () => {
    const label = card.querySelector('.advice-toggle');
    if (label) {
      label.childNodes[0].textContent = card.open ? 'Ocultar consejo ' : 'Ver consejo ';
      label.setAttribute('aria-expanded', String(card.open));
    }
  });
});