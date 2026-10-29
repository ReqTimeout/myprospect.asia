import Lenis from 'lenis';
import { animate } from 'motion';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
  const groups = document.querySelectorAll('[data-reveal-group]');
  groups.forEach((g) => {
    const items = g.querySelectorAll('[data-reveal]');
    items.forEach((el, i) => {
      (el as HTMLElement).style.setProperty('--rd', `${Math.min(i * 90, 540)}ms`);
    });
  });

  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((t) => t.classList.add('rd-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('rd-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  targets.forEach((t) => io.observe(t));
}

function initMagnetic() {
  if (reduced || !window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((btn) => {
    let raf = 0;
    btn.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.16;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      animate(
        btn,
        { x: [{ to: 0 }], y: [{ to: 0 }] },
        { type: 'spring', stiffness: 320, damping: 16, duration: 0.45 }
      ).catch(() => {});
    });
  });
}

function initLenis() {
  if (reduced) return;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  document.documentElement.classList.add('lenis-on');
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el as HTMLElement, { offset: -76, duration: 1.1 });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initMagnetic();
    initLenis();
  });
} else {
  initReveal();
  initMagnetic();
  initLenis();
}
