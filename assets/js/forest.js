(() => {
  'use strict';

  const scene = document.querySelector('.forest-scene');
  const toggle = document.querySelector('.motion-toggle');
  if (!scene || !toggle) return;

  const canopy = scene.querySelector('.forest-canopy');
  const leaves = scene.querySelector('.forest-leaves');
  const ctx = leaves.getContext('2d');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const leafTexture = new Image();
  const forestTexture = new Image();
  const wildlife = {};
  const state = {
    width: 1, height: 1, time: 0, previous: 0, frame: 0,
    paused: preference.matches, leafReady: false, particles: [], renderer: null
  };

  // A texture displacement shader moves foliage locally; trunks remain grounded.
  // The CSS photograph remains visible if WebGL is unavailable or loses context.
  const createCanopyRenderer = () => {
    const gl = canopy.getContext('webgl', {
      alpha: false, antialias: false, depth: false, powerPreference: 'low-power'
    });
    if (!gl) return null;
    const shaders = [];
    let program;
    let buffer;
    let texture;
    try {
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `
        attribute vec2 position;
        varying vec2 uv;
        void main() {
          uv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `);
      const fragment = compile(gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec2 uv;
        uniform sampler2D forest;
        uniform vec2 crop;
        uniform float time;
        void main() {
          vec2 point = (uv - 0.5) * crop * 0.97 + vec2(0.5, 1.0 - crop.y * 0.5);
          vec3 original = texture2D(forest, point).rgb;
          float foliage = smoothstep(0.015, 0.13, original.g - max(original.r * 0.92, original.b));
          float heightWeight = 1.0 - smoothstep(0.5, 0.76, point.y);
          float gust = 0.75 + 0.25 * sin(time * 0.43);
          float sway = sin(point.x * 13.0 + point.y * 9.0 + time * 1.1);
          float flutter = sin(point.x * 54.0 - point.y * 29.0 + time * 2.0);
          float weight = heightWeight * foliage;
          point.x += (sway * 0.006 + flutter * 0.001) * weight * gust;
          point.y += cos(point.x * 21.0 + time * 0.9) * 0.0025 * weight;
          vec3 color = texture2D(forest, point).rgb;
          float dapple = sin(point.x * 17.0 + point.y * 13.0 + time * 0.3);
          float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
          color = mix(vec3(luminance), color, 1.12);
          color *= 1.08 + dapple * foliage * heightWeight * 0.05;
          gl_FragColor = vec4(color, 1.0);
        }
      `);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Renderer unavailable');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, forestTexture);
      gl.uniform1i(gl.getUniformLocation(program, 'forest'), 0);
      const timeUniform = gl.getUniformLocation(program, 'time');
      const cropUniform = gl.getUniformLocation(program, 'crop');
      shaders.forEach((shader) => gl.deleteShader(shader));
      return {
        draw() {
          const screenAspect = state.width / state.height;
          const imageAspect = forestTexture.naturalWidth / forestTexture.naturalHeight;
          gl.viewport(0, 0, canopy.width, canopy.height);
          gl.uniform2f(cropUniform, Math.min(1, screenAspect / imageAspect), Math.min(1, imageAspect / screenAspect));
          gl.uniform1f(timeUniform, state.time);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      };
    } catch (_) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      return null;
    }
  };

  const makeLeaf = (scatter) => {
    const depth = 0.25 + Math.random() * 0.75;
    return {
      x: Math.random() * (state.width + 160) - 80,
      y: scatter ? Math.random() * state.height : -60,
      depth, size: 10 + depth * 25,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 1.1,
      speed: 20 + depth * 30
    };
  };

  const drawLeaves = (delta) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, state.width, state.height);
    if (!state.leafReady) return;
    const wind = 17 + Math.sin(state.time * 0.43) * 18;
    const aspect = leafTexture.naturalHeight / leafTexture.naturalWidth;
    for (const leaf of state.particles) {
      leaf.x += (wind + Math.sin(state.time * 0.85 + leaf.phase) * 19) * leaf.depth * delta;
      leaf.y += leaf.speed * delta;
      leaf.rotation += leaf.spin * delta;
      if (leaf.y > state.height + 65 || leaf.x > state.width + 90 || leaf.x < -130) {
        Object.assign(leaf, makeLeaf(false));
      }
      const edge = Math.min(1, Math.max(0, (leaf.y + 40) / 90), Math.max(0, (state.height + 35 - leaf.y) / 90));
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation + Math.sin(state.time * 0.6 + leaf.phase) * 0.3);
      // Foreshortening simulates a leaf slowly turning in the breeze.
      ctx.scale(Math.cos(state.time * 1.05 + leaf.phase) * 0.8, 1);
      ctx.globalAlpha = (0.3 + leaf.depth * 0.48) * edge * readingAttenuation(leaf.x);
      ctx.drawImage(leafTexture, -leaf.size / 2, -leaf.size * aspect / 2, leaf.size, leaf.size * aspect);
      ctx.restore();
    }
  };

  // Wildlife shares the pause clock and stays softer while crossing the reading column.
  const readingAttenuation = (x) => {
    const distance = Math.abs(x - state.width / 2);
    const halfColumn = Math.min(370, state.width / 2 - 16);
    const edge = Math.max(0, Math.min(1, (distance - halfColumn + 45) / 90));
    return 0.32 + edge * 0.68;
  };

  const drawSprite = (image, x, y, width, rotation = 0, scaleX = 1, opacity = 1) => {
    const height = width * image.naturalHeight / image.naturalWidth;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, 1);
    ctx.globalAlpha = opacity;
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  };

  const drawWildlife = () => {
    if (!ctx) return;
    const time = state.time;
    const mobile = state.width < 600;

    if (wildlife.birds) {
      const atlas = wildlife.birds;
      const frameWidth = atlas.naturalWidth / 2;
      const frameHeight = atlas.naturalHeight / 2;
      // Staggered pairs alternate direction, flapping then gliding through clearings.
      for (let index = 0; index < (mobile ? 3 : 5); index += 1) {
        const cycle = 24 + index * 3;
        const progress = ((time + index * 5.6 + 4) % cycle) / cycle;
        const rightward = index % 2 === 0;
        const x = (rightward ? progress : 1 - progress) * (state.width + 160) - 80;
        const y = state.height * (0.1 + index * 0.06) + Math.sin(progress * Math.PI * 2 + index) * 24;
        const size = (mobile ? 31 : 43) - index * 2;
        const phase = time * 7 + index * 1.3;
        const frame = (time + index) % 5 > 3.2 ? 1 : Math.floor(phase) % 4;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(rightward ? 1 : -1, 1);
        ctx.rotate(Math.cos(progress * Math.PI * 2 + index) * 0.12);
        ctx.globalAlpha = 0.85 * readingAttenuation(x);
        ctx.drawImage(atlas, (frame % 2) * frameWidth, Math.floor(frame / 2) * frameHeight,
          frameWidth, frameHeight, -size / 2, -size / 2 + (frame > 1 ? size * 0.085 : 0), size, size);
        ctx.restore();
      }
    }

    if (wildlife.butterfly) {
      for (let index = 0; index < (mobile ? 2 : 4); index += 1) {
        const side = index % 2 === 0 ? 0.1 : 0.9;
        const phase = time * (0.38 + index * 0.025) + index * 2.3;
        const x = state.width * side + Math.sin(phase) * (mobile ? 23 : 50) + Math.sin(phase * 2.1) * 13;
        const y = state.height * (0.46 + index * 0.1) + Math.cos(phase * 0.83) * 48 + Math.sin(time * 2.4 + index) * 5;
        const flap = 0.18 + Math.abs(Math.sin(time * 9 + index)) * 0.82;
        drawSprite(wildlife.butterfly, x, y, mobile ? 24 : 32, Math.sin(phase) * 0.35,
          flap, 0.92 * readingAttenuation(x));
      }
    }

  };

  const draw = (delta) => {
    if (state.renderer) state.renderer.draw();
    drawLeaves(delta);
    drawWildlife();
  };

  const tick = (timestamp) => {
    state.frame = 0;
    if (state.paused || document.hidden) return;
    // Limit rendering to 30 fps and clamp elapsed time after interruptions.
    const elapsed = state.previous ? timestamp - state.previous : 34;
    if (elapsed >= 32) {
      const delta = Math.min(elapsed / 1000, 0.065);
      state.previous = timestamp;
      state.time += delta;
      draw(delta);
    }
    state.frame = requestAnimationFrame(tick);
  };

  const syncPlayback = () => {
    cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.previous = 0;
    const stopped = state.paused || document.hidden;
    document.documentElement.classList.toggle('forest-paused', stopped);
    toggle.textContent = state.paused ? 'Play animation' : 'Pause animation';
    toggle.setAttribute('aria-pressed', String(state.paused));
    if (!stopped) state.frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    // Bound GPU work on large displays as well as phones.
    const resolution = Math.min(dpr, 1800 / Math.max(state.width, state.height));
    canopy.width = Math.max(1, Math.round(state.width * resolution));
    canopy.height = Math.max(1, Math.round(state.height * resolution));
    leaves.width = Math.round(state.width * dpr);
    leaves.height = Math.round(state.height * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.particles = Array.from({ length: state.width < 600 ? 18 : 38 }, () => makeLeaf(true));
    draw(0);
  };

  for (const name of ['birds', 'butterfly']) {
    const image = new Image();
    image.onload = () => { wildlife[name] = image; draw(0); };
    image.src = scene.dataset[name];
  }
  leafTexture.onload = () => { state.leafReady = true; draw(0); };
  leafTexture.src = scene.dataset.leaf;
  forestTexture.onload = () => {
    state.renderer = createCanopyRenderer();
    if (state.renderer) {
      state.renderer.draw();
      canopy.classList.add('is-ready');
    }
  };
  forestTexture.src = scene.dataset.image;

  canopy.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    state.renderer = null;
    canopy.classList.remove('is-ready');
  });
  canopy.addEventListener('webglcontextrestored', () => {
    state.renderer = createCanopyRenderer();
    if (state.renderer) { state.renderer.draw(); canopy.classList.add('is-ready'); }
  });
  toggle.addEventListener('click', () => { state.paused = !state.paused; syncPlayback(); });
  preference.addEventListener('change', (event) => { state.paused = event.matches; syncPlayback(); });
  document.addEventListener('visibilitychange', syncPlayback);
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }, { passive: true });
  resize();
  toggle.hidden = false;
  syncPlayback();
})();
