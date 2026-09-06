(() => {
  'use strict';
  const video = document.querySelector('.ocean-video');
  const toggle = document.querySelector('.motion-toggle');
  if (!video || !toggle) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let wanted = !preference.matches;
  let loaded = false;
  let generation = 0;

  video.muted = true;
  video.defaultMuted = true;

  const updateButton = () => {
    toggle.textContent = wanted ? 'Pause background' : 'Play background';
    toggle.setAttribute('aria-pressed', String(!wanted));
  };

  const revealFrame = () => {
    if (!video.error && video.readyState >= 2) video.classList.add('is-ready');
  };
  video.addEventListener('playing', () => {
    if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(revealFrame);
    else revealFrame();
  });
  video.addEventListener('error', () => {
    // The poster and page remain usable if the media cannot load.
    video.classList.remove('is-ready');
    loaded = false;
    wanted = false;
    generation += 1;
    updateButton();
  });

  const syncPlayback = () => {
    const request = ++generation;
    updateButton();
    if (!wanted || document.hidden) {
      video.pause();
      return;
    }
    if (!loaded) {
      video.src = video.dataset.src;
      video.preload = 'auto';
      loaded = true;
    }
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        if (request !== generation) return;
        // Autoplay restrictions leave a working, explicitly labelled play button.
        wanted = false;
        updateButton();
      });
    }
  };

  toggle.addEventListener('click', () => { wanted = !wanted; syncPlayback(); });
  preference.addEventListener('change', (event) => { wanted = !event.matches; syncPlayback(); });
  document.addEventListener('visibilitychange', syncPlayback);
  toggle.hidden = false;
  updateButton();

  // Text and its inline styles paint before we start downloading the video.
  // Nothing about displaying the page depends on media events or JavaScript.
  requestAnimationFrame(() => requestAnimationFrame(syncPlayback));
})();
