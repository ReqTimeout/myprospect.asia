import Lenis from 'lenis';
import { animate } from 'motion';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function initGsap() {
  if (reduced) return;
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const dist = parseFloat(el.dataset.parallax || '-30');
    gsap.to(el, {
      y: dist,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
    });
  });

  await document.fonts.ready;
  const { SplitText } = await import('gsap/SplitText');

  const heroTitle = document.querySelector<HTMLElement>('[data-hero="title"]');
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (heroTitle) {
    const lines = new SplitText(heroTitle, { type: 'lines', mask: 'lines', autoSplit: true });
    tl.from(lines.lines, { yPercent: 108, duration: 1, stagger: 0.09, ease: 'power4.out' }, 0.1);
  }
  const badge = document.querySelector<HTMLElement>('[data-hero="badge"]');
  if (badge) tl.from(badge, { y: -18, opacity: 0, duration: 0.7, ease: 'back.out(2)' }, 0.05);
  const sub = document.querySelector<HTMLElement>('[data-hero="sub"]');
  if (sub) tl.from(sub, { y: 22, opacity: 0, duration: 0.8 }, 0.75);
  const photo = document.querySelector<HTMLElement>('[data-hero="photo"]');
  if (photo) tl.from(photo, { scale: 0.88, y: 40, opacity: 0, duration: 1.2, ease: 'expo.out' }, 0.55);
  const cta = document.querySelector<HTMLElement>('[data-hero="cta"]');
  if (cta) tl.from(cta, { y: 26, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' }, 1);

  document.querySelectorAll<HTMLElement>('.display').forEach((el) => {
    if (el.closest('astro-island')) return;
    if (el.hasAttribute('data-reveal') || el.closest('[data-reveal]')) return;
    if (el.hasAttribute('data-hero')) return;
    if (!(el.textContent ?? '').trim()) return;
    try {
      const st = new SplitText(el, { type: 'chars', autoSplit: true, mask: 'chars' });
      gsap.from(st.chars, {
        yPercent: 115,
        opacity: 0,
        rotate: 3,
        duration: 0.75,
        ease: 'power4.out',
        stagger: 0.016,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    } catch {
      /* heading kecil — skip split */
    }
  });
}

function initScrollProgress() {
  const bar = document.querySelector<HTMLElement>('.scroll-progress');
  if (!bar) return;
  let current = 0;
  let target = 0;
  const loop = () => {
    current += (target - current) * 0.12;
    bar.style.transform = `scaleX(${current.toFixed(4)})`;
    requestAnimationFrame(loop);
  };
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    target = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
  requestAnimationFrame(loop);
}

function initSpotlight() {
  const hero = document.querySelector<HTMLElement>('.hero-glow');
  if (!hero || reduced || !window.matchMedia('(pointer: fine)').matches) return;
  let tx = 50;
  let ty = 26;
  let cx = 50;
  let cy = 26;
  const loop = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    hero.style.setProperty('--mx', `${cx}%`);
    hero.style.setProperty('--my', `${cy}%`);
    requestAnimationFrame(loop);
  };
  window.addEventListener('pointermove', (e) => {
    tx = (e.clientX / window.innerWidth) * 100;
    ty = (e.clientY / window.innerHeight) * 100;
  }, { passive: true });
  requestAnimationFrame(loop);
}

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
    initScrollProgress();
    initSpotlight();
    initGsap().catch(() => {});
  });
} else {
  initReveal();
  initMagnetic();
  initLenis();
  initScrollProgress();
  initSpotlight();
  initGsap().catch(() => {});
}
