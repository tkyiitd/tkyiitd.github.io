// A small progressive enhancement: all profile text is rendered by Jekyll.
// No entrance effect hides content, waits for the scene, or captures scrolling.
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shells = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) return;

  const entrances = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      entrances.unobserve(entry.target);
    }
  }, { threshold: 0, rootMargin: '0px 0px 48px 0px' });
  shells.forEach(shell => {
    // Leave already visible sections untouched, including direct anchor visits.
    if (preference.matches || shell.getBoundingClientRect().top < window.innerHeight + 48) return;
    shell.classList.add('reveal-ready');
    entrances.observe(shell);
  });
  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    entrances.disconnect();
    shells.forEach(shell => shell.classList.remove('reveal-ready', 'is-visible'));
  });

  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  const visible = new Set();
  const navigation = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    // Prefer the later visible section, including the short contact section at
    // the bottom, where the page cannot scroll enough to reach the top edge.
    const current = [...sections].reverse().find(section => visible.has(section));
    links.forEach((link, index) => {
      if (sections[index] === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-100px 0px -15% 0px' });
  sections.filter(Boolean).forEach(section => navigation.observe(section));
})();
