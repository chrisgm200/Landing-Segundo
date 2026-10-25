/* ============================================================
   CONFIGURACIÓN
   true  = las animaciones SIEMPRE se ven (aunque el sistema operativo tenga
           activado "reducir movimiento").
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

/* ---------- INDICADOR DEL MENÚ (se traslada con la navegación) ---------- */
const navIndicator = document.querySelector('.nav-indicator');
function moveIndicator() {
  if (!navIndicator) return;
  const active = navLinks.querySelector('a.active');
  if (!active || window.innerWidth <= MENU_BREAKPOINT) {
    navIndicator.style.opacity = '0';
    return;
  }
  navIndicator.style.opacity = '1';
  navIndicator.style.width = active.offsetWidth + 'px';
  navIndicator.style.height = active.offsetHeight + 'px';
  navIndicator.style.transform = 'translate(' + active.offsetLeft + 'px,' + active.offsetTop + 'px)';
}
window.addEventListener('resize', moveIndicator);
window.addEventListener('load', moveIndicator);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

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
    moveIndicator();
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
    const lastIndex = routeCards.length - 1;

    // Las tarjetas se apilan: la anterior se encoge un poco cuando la siguiente la cubre.
    routeCards.forEach((card, i) => {
      const next = routeCards[i + 1];
      if (!next || reduceMotion) { card.style.setProperty('--s', 1); return; }
      const dist = next.getBoundingClientRect().top - stickyTops[i];
      const p = clamp(1 - dist / (card.offsetHeight * 0.9), 0, 1);
      card.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
    });

    // Paso actual: el número de cada tarjeta se vuelve amarillo cuando se llega a ella
    let current = 1;
    routeCards.forEach((card, i) => {
      const reached = i === 0 || card.getBoundingClientRect().top <= stickyTops[i] + 24;
      card.classList.toggle('reached', reached);
      if (reached) current = i + 1;
    });

    // Barra de progreso: llega al 100 % justo cuando aparece el paso 5
    const rect = routeList.getBoundingClientRect();
    const last = routeCards[lastIndex];
    const padBottom = parseFloat(getComputedStyle(routeList).paddingBottom) || 0;
    const naturalLast = rect.height - last.offsetHeight - padBottom;
    const span = naturalLast - (stickyTops[lastIndex] - stickyTops[0]);
    const progress = span > 0 ? clamp((stickyTops[0] - rect.top) / span, 0, 1) : 0;
    if (routeBarFill) routeBarFill.style.transform = 'scaleX(' + progress.toFixed(3) + ')';
    if (routeCountNow) routeCountNow.textContent = current;
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

/* ---------- TIPOS DE ABUSO SEXUAL (pestañas + flechas) ---------- */
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
const conceptBody = conceptPanel.querySelector('.concept-body');
const conceptDots = [...conceptPanel.querySelectorAll('.concept-dots i')];
let conceptCurrent = 0;

function showConcept(i) {
  conceptCurrent = (i + conceptData.length) % conceptData.length;
  const [title, description] = conceptData[conceptCurrent];
  conceptButtons.forEach((button, index) => {
    const on = index === conceptCurrent;
    button.classList.toggle('active', on);
    button.setAttribute('aria-selected', String(on));
  });
  conceptDots.forEach((dot, index) => dot.classList.toggle('on', index === conceptCurrent));
  conceptPanel.dataset.tone = String(conceptCurrent);
  conceptBody.style.animation = 'none';
  void conceptBody.offsetWidth;
  conceptBody.style.animation = 'panel-in .35s both';
  conceptBody.querySelector('h3').textContent = title;
  conceptBody.querySelector('.concept-text').textContent = description;
}
conceptButtons.forEach(button => button.addEventListener('click', () => showConcept(Number(button.dataset.concept))));
conceptPanel.querySelector('.concept-prev').addEventListener('click', () => showConcept(conceptCurrent - 1));
conceptPanel.querySelector('.concept-next').addEventListener('click', () => showConcept(conceptCurrent + 1));

/* ---------- ACORDEONES (cada tarjeta se abre sola, sin mover las de al lado) ---------- */
function bindDetails(selector, closedText, openText) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener('toggle', () => {
      const label = card.querySelector('.t-label');
      if (label) label.textContent = card.open ? openText : closedText;
    });
  });
}
bindDetails('.team-card', 'Ver reseña', 'Ver menos');
bindDetails('.prevention-card', 'Ver consejo', 'Ver menos');