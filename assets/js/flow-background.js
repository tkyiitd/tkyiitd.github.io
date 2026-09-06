(() => {
  'use strict';
  const canvas = document.querySelector('.flow-canvas');
  const button = document.querySelector('.motion-toggle');
  if (!canvas || !button) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const step = 1 / 60;
  let width = 1, height = 1, birds = [], grid = new Map();
  let time = 0, previous = null, accumulator = 0, frame = 0;
  let paused = preference.matches;
  let seed = 7239;
  const pointer = { x: -1000, y: -1000, active: false };
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function populate() {
    // Stratified positions cover the entire viewport from the first frame.
    const count = Math.round(Math.max(140, Math.min(520, width * height / 3400)));
    const columns = Math.ceil(Math.sqrt(count * width / height));
    const rows = Math.ceil(count / columns);
    birds = Array.from({ length: count }, (_, i) => {
      const depth = random();
      const x = ((i % columns) + random()) / columns * width;
      const y = (Math.floor(i / columns) + random()) / rows * height;
      const angle = .5 + Math.sin(x / width * TAU) * 1.7 + Math.cos(y / height * TAU);
      const speed = 24 + depth * 24;
      return {
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        ax: 0, ay: 0, heading: angle, depth,
        size: 2.4 + depth * depth * 6.8,
        phase: random() * TAU, beat: .9 + random() * .45,
        shade: Math.floor(random() * 3)
      };
    }).sort((a, b) => a.depth - b.depth);
  }

  function simulate(dt) {
    time += dt;
    const radius = 78;
    const radius2 = radius * radius;
    grid.clear();
    for (const b of birds) {
      const key = `${Math.floor(b.x / radius)},${Math.floor(b.y / radius)}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(b);
    }

    // Reynolds-style separation, alignment and cohesion, evaluated from a
    // shared snapshot so no bird gets priority because of array ordering.
    for (const b of birds) {
      let count = 0, alignX = 0, alignY = 0, centerX = 0, centerY = 0;
      let separateX = 0, separateY = 0;
      const gx = Math.floor(b.x / radius), gy = Math.floor(b.y / radius);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const neighbors = grid.get(`${gx + ox},${gy + oy}`);
          if (!neighbors) continue;
          for (const other of neighbors) {
            if (other === b) continue;
            const dx = other.x - b.x, dy = other.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > radius2 || d2 < .001) continue;
            const distance = Math.sqrt(d2);
            // Gentle density pressure across the full neighborhood keeps
            // mobile flocks from collapsing into one crowded corner.
            const spread = (1 - distance / radius) * 7;
            separateX -= dx / distance * spread;
            separateY -= dy / distance * spread;
            if (d2 < 32 * 32) {
              const d = distance;
              const force = (1 - d / 32) * 34;
              separateX -= dx / d * force;
              separateY -= dy / d * force;
            }
            if (Math.abs(b.depth - other.depth) < .4) {
              count++;
              alignX += other.vx; alignY += other.vy;
              centerX += dx; centerY += dy;
            }
          }
        }
      }
      let ax = separateX, ay = separateY;
      if (count) {
        ax += (alignX / count - b.vx) * .68 + centerX / count * .095;
        ay += (alignY / count - b.vy) * .68 + centerY / count * .095;
      }
      // A slowly changing breeze prevents a single tight cluster and encourages
      // broad, curling formations rather than fixed routes or a looping video.
      ax += Math.sin(b.y / height * TAU + time * .105) * 7;
      ay += Math.cos(b.x / width * TAU - time * .085) * 7;
      if (pointer.active) {
        const dx = b.x - pointer.x, dy = b.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d > .1 && d < 115) {
          ax += dx / d * (1 - d / 115) * 20;
          ay += dy / d * (1 - d / 115) * 20;
        }
      }
      const magnitude = Math.hypot(ax, ay);
      const limit = magnitude > 26 ? 26 / magnitude : 1;
      b.ax = ax * limit; b.ay = ay * limit;
    }

    for (const b of birds) {
      b.vx += b.ax * dt; b.vy += b.ay * dt;
      const speed = Math.hypot(b.vx, b.vy) || 1;
      const min = 21 + b.depth * 14, max = 35 + b.depth * 23;
      const target = Math.max(min, Math.min(max, speed));
      b.vx *= target / speed; b.vy *= target / speed;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const angle = Math.atan2(b.vy, b.vx);
      const turn = Math.atan2(Math.sin(angle - b.heading), Math.cos(angle - b.heading));
      b.heading += turn * (1 - Math.exp(-dt * 6));
      // Wrap beyond the visible edge; the full wings have left before reentry.
      const margin = 28;
      if (b.x < -margin) b.x += width + margin * 2;
      if (b.x > width + margin) b.x -= width + margin * 2;
      if (b.y < -margin) b.y += height + margin * 2;
      if (b.y > height + margin) b.y -= height + margin * 2;
    }
  }

  function drawBird(b) {
    // A compact, articulated boid silhouette: tapered wings, body and tail.
    // Independent wing phases alternate gentle beats with extended glides.
    const cycle = time * b.beat + b.phase;
    const glide = Math.max(0, Math.sin(time * .33 + b.phase));
    const wing = .7 + .3 * Math.sin(cycle * TAU) * (1 - glide * .88);
    const sweep = .25 + .2 * Math.cos(cycle * TAU) * (1 - glide);
    const s = b.size;
    const colors = ['211, 230, 237', '235, 223, 200', '161, 198, 218'];
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.heading + Math.PI / 2);
    ctx.fillStyle = `rgba(${colors[b.shade]}, ${.29 + b.depth * .5})`;
    ctx.beginPath();
    ctx.moveTo(0, -s * .55);
    ctx.quadraticCurveTo(-s * .17, -s * .32, -s * .39, -s * .24);
    ctx.quadraticCurveTo(-s * .88, -s * .36, -s * 1.5 * wing, s * sweep);
    ctx.quadraticCurveTo(-s * .66, -s * .02, -s * .15, s * .22);
    ctx.lineTo(-s * .15, s * .6);
    ctx.lineTo(0, s * .43);
    ctx.lineTo(s * .15, s * .6);
    ctx.lineTo(s * .15, s * .22);
    ctx.quadraticCurveTo(s * .66, -s * .02, s * 1.5 * wing, s * sweep);
    ctx.quadraticCurveTo(s * .88, -s * .36, s * .39, -s * .24);
    ctx.quadraticCurveTo(s * .17, -s * .32, 0, -s * .55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    for (const b of birds) drawBird(b);
  }

  function resize() {
    const oldWidth = width, oldHeight = height;
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!birds.length) populate();
    else for (const b of birds) { b.x *= width / oldWidth; b.y *= height / oldHeight; }
    render();
  }

  function tick(now) {
    frame = 0;
    if (paused || document.hidden) return;
    if (previous !== null) accumulator += Math.min((now - previous) / 1000, .05);
    previous = now;
    let updated = false;
    while (accumulator >= step) {
      simulate(step); accumulator -= step; updated = true;
    }
    if (updated) render();
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0; previous = null; accumulator = 0;
    button.textContent = paused ? 'Play animation' : 'Pause animation';
    button.setAttribute('aria-pressed', String(paused));
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => { paused = !paused; sync(); });
  preference.addEventListener('change', () => { paused = preference.matches; sync(); });
  document.addEventListener('visibilitychange', () => { pointer.active = false; sync(); });
  window.addEventListener('pointermove', event => {
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true;
  }, { passive: true });
  window.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse') pointer.active = false;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });
  // Content paints first; the flock needs no images, fonts or media downloads.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    resize(); button.hidden = false; sync();
  }));
})();
