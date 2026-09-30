// A continuous, native-scrolling document. Content unfolds from each preceding
// section's trailing space; backgrounds never pin, overlap, or cover earlier text.
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('#main');
  const nav = document.querySelector('.site-nav');
  if (!main || !nav) return;
  const glass = nav.querySelector('.nav-inner');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let shineFrame = 0, shinePointer = null;
  glass?.addEventListener('pointermove', event => {
    if (preference.matches || !finePointer.matches) return;
    shinePointer = { x: event.clientX, y: event.clientY };
    glass.classList.add('is-lit');
    if (!shineFrame) shineFrame = requestAnimationFrame(() => {
      shineFrame = 0;
      if (preference.matches) return;
      const bounds = glass.getBoundingClientRect();
      glass.style.setProperty('--shine-x', `${shinePointer.x - bounds.left}px`);
      glass.style.setProperty('--shine-y', `${shinePointer.y - bounds.top}px`);
    });
  }, { passive: true });
  glass?.addEventListener('pointerleave', () => {
    glass.classList.remove('is-lit');
  });
  const shells = [...document.querySelectorAll('[data-reveal]')];
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let frame = 0, preferredSection = null;
  const smooth = value => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };

  function update() {
    frame = 0;
    const height = window.innerHeight;
    const navHeight = nav.getBoundingClientRect().height;
    if (!preference.matches) {
      const bounds = shells.map(shell => shell.parentElement.getBoundingClientRect());
      const travel = window.innerWidth <= 740 ? 32 : 48;
      shells.forEach((shell, index) => {
        // Adjacent section boundaries are shared in normal flow. The heading
        // leads, then its content follows through the same soft emergence curve.
        const progress = (height - bounds[index].top) / (height * .72);
        const heading = smooth(progress);
        const content = smooth((progress - .1) / .9);
        shell.style.setProperty('--heading-rise', `${(travel * .65 * (1 - heading)).toFixed(2)}px`);
        shell.style.setProperty('--content-rise', `${(travel * (1 - content)).toFixed(2)}px`);
      });
    }
    const readingLine = navHeight + Math.max(120, height * .3);
    const atBottom = window.scrollY + height >= document.documentElement.scrollHeight - 4;
    const current = preferredSection || (atBottom ? sections[sections.length - 1] : [...sections].reverse().find(section => {
      const heading = section.querySelector('h2');
      return heading && heading.getBoundingClientRect().top <= readingLine;
    }));
    links.forEach((link, index) => {
      if (sections[index] === current) {
        if (!link.hasAttribute('aria-current')) link.setAttribute('aria-current', 'location');
      } else link.removeAttribute('aria-current');
    });
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function configure() {
    if (preference.matches) glass?.classList.remove('is-lit');
    main.classList.toggle('flow-enabled', !preference.matches);
    if (preference.matches) shells.forEach(shell => {
      shell.style.removeProperty('--heading-rise');
      shell.style.removeProperty('--content-rise');
    });
    schedule();
  }
  function followReading() { preferredSection = null; schedule(); }
  preference.addEventListener('change', configure);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('wheel', followReading, { passive: true });
  window.addEventListener('touchmove', followReading, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) followReading();
  });
  // Anchors, focus and browser history use their native behavior again.
  nav.addEventListener('click', event => {
    const link = event.target.closest('.nav-links a');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    preferredSection = document.getElementById(link.getAttribute('href').slice(1));
    schedule();
  });
  window.addEventListener('hashchange', () => {
    preferredSection = document.getElementById(window.location.hash.slice(1));
    schedule();
  });
  if ('ResizeObserver' in window) {
    const sizing = new ResizeObserver(schedule);
    shells.forEach(shell => sizing.observe(shell.parentElement));
    sizing.observe(nav);
  }
  preferredSection = document.getElementById(window.location.hash.slice(1));
  configure();
})();
