(() => {
  'use strict';
  const scene = document.querySelector('.ocean-scene');
  const toggle = document.querySelector('.motion-toggle');
  if (!scene || !toggle) return;
  const water = scene.querySelector('.ocean-water');
  const boat = scene.querySelector('.ocean-boat');
  const ctx = boat.getContext('2d');
  const poseCanvas = document.createElement('canvas');
  poseCanvas.width = 512;
  poseCanvas.height = 512;
  const poseContext = poseCanvas.getContext('2d');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const landscape = new Image();
  const rower = new Image();
  const state = {
    width: 1, height: 1, time: 0, previous: 0, frame: 0,
    paused: preference.matches, renderer: null, rowingMotion: null, rowerReady: false,
    cropX: 1, cropY: 1, centerX: 0.5
  };

  const createWaterRenderer = () => {
    const gl = water.getContext('webgl', {
      alpha: false, antialias: false, depth: false, powerPreference: 'low-power'
    });
    if (!gl) return null;
    const shaders = [];
    let program, buffer, texture;
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
        uniform sampler2D landscape;
        uniform vec2 crop;
        uniform float centerX;
        uniform float time;
        void main() {
          vec2 p = (uv - 0.5) * crop + vec2(centerX, 0.5);
          float sea = 1.0 - smoothstep(0.375, 0.405, p.y);
          float depth = clamp((0.405 - p.y) / 0.405, 0.0, 1.0);
          float wind = time * 0.75 + sin(time * 0.12) * 0.6;
          float swell = sin(p.x * 35.0 + p.y * 52.0 - wind);
          float smallWave = sin(p.x * 103.0 - p.y * 170.0 - wind * 1.65);
          vec2 samplePoint = p;
          samplePoint.x += sea * (0.25 + depth * 0.75) * (swell * 0.008 + smallWave * 0.0018);
          samplePoint.y += sea * depth * sin(p.y * 120.0 - wind * 1.2 + p.x * 18.0) * 0.0038;
          vec3 color = texture2D(landscape, clamp(samplePoint, 0.001, 0.999)).rgb;
          // Advect two overlapping sky samples in one direction. Their resets occur
          // only at zero weight, so the wind never reverses or visibly jumps.
          float sky = smoothstep(0.44, 0.52, p.y);
          float island = (1.0 - smoothstep(0.065, 0.15, abs(p.x - 0.58)))
            * (1.0 - smoothstep(0.67, 0.72, p.y));
          float edge = smoothstep(0.0, 0.055, p.x) * (1.0 - smoothstep(0.945, 1.0, p.x));
          float cloudMask = sky * (1.0 - island) * edge;
          float phaseA = fract(time * 0.004);
          float phaseB = fract(time * 0.004 + 0.5);
          float weightA = 0.5 - 0.5 * cos(phaseA * 6.2831853);
          vec2 driftA = vec2((phaseA - 0.5) * 0.15, 0.0);
          vec2 driftB = vec2((phaseB - 0.5) * 0.15, 0.0);
          vec3 skyA = texture2D(landscape, clamp(p - driftA, 0.001, 0.999)).rgb;
          vec3 skyB = texture2D(landscape, clamp(p - driftB, 0.001, 0.999)).rgb;
          color = mix(color, skyA * weightA + skyB * (1.0 - weightA), cloudMask);
          float light = pow(max(0.0, sin(p.x * 180.0 + p.y * 300.0 - time * 1.15)
            * sin(p.y * 240.0 + p.x * 16.0 + time * 0.53)), 10.0);
          color += sea * (0.018 + depth * 0.065) * light * vec3(0.6, 0.88, 1.0);
          color *= 1.0 + sea * swell * 0.048;
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
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, landscape);
      gl.uniform1i(gl.getUniformLocation(program, 'landscape'), 0);
      const uniforms = ['time', 'crop', 'centerX'].map((name) => gl.getUniformLocation(program, name));
      shaders.forEach((shader) => gl.deleteShader(shader));
      return { draw() {
        gl.viewport(0, 0, water.width, water.height);
        gl.uniform1f(uniforms[0], state.time);
        gl.uniform2f(uniforms[1], state.cropX, state.cropY);
        gl.uniform1f(uniforms[2], state.centerX);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } };
    } catch (_) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      return null;
    }
  };

  const drawBoat = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, state.width, state.height);
    if (!state.rowerReady) return;
    const mobile = state.width < 600;
    // A continuous approach eases toward the island without teleporting to shore.
    const progress = 0.08 + 0.87 * (1 - Math.exp(-state.time / 180));
    const targetX = ((0.56 - state.centerX) / state.cropX + 0.5) * state.width;
    const targetY = ((0.65 - 0.5) / state.cropY + 0.5) * state.height;
    const startX = state.width * (mobile ? 0.22 : 0.16);
    const startY = state.height * 0.89;
    const x = startX + (targetX - startX) * progress;
    const y = startY + (targetY - startY) * progress + Math.sin(state.time * 1.2) * 1.8;
    const size = (mobile ? 134 : 205) * (1 - progress * 0.72);
    const opacity = 1;
    const stroke = state.time * Math.PI * 2 / 4.8;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(stroke) * 0.018);

    // A spreading wake fades behind the stern; stroke ripples alternate sides.
    for (let index = 0; index < 10; index += 1) {
      const age = ((state.time * 0.36 + index / 10) % 1);
      ctx.strokeStyle = `rgba(179, 231, 249, ${Math.sin(age * Math.PI) * opacity * 0.18})`;
      ctx.lineWidth = Math.max(0.55, size / 150);
      ctx.beginPath();
      ctx.ellipse(0, size * (0.28 + age * 0.4), size * (0.18 + age * 0.36), size * (0.035 + age * 0.065), 0, 0.12, Math.PI - 0.12);
      ctx.stroke();
    }
    const phase = (state.time / 2.4) % 1;
    const side = Math.floor(state.time / 2.4) % 2 ? 1 : -1;
    ctx.strokeStyle = `rgba(220, 247, 255, ${Math.sin(phase * Math.PI) * opacity * 0.42})`;
    ctx.beginPath();
    ctx.ellipse(side * size * 0.35, size * 0.1, size * (0.025 + phase * 0.13), size * (0.012 + phase * 0.025), -side * 0.1, 0, Math.PI * 2);
    ctx.stroke();

    const sourceWidth = rower.naturalWidth / 3;
    const sourceHeight = rower.naturalHeight / 2;
    ctx.globalAlpha = opacity;
    if (poseContext && state.rowingMotion) {
      state.rowingMotion.paint(poseContext, state.time);
      ctx.drawImage(poseCanvas, -size / 2, -size / 2, size, size);
    } else {
      ctx.drawImage(rower, 0, 0,
        sourceWidth, sourceHeight, -size / 2, -size / 2, size, size);
    }
    ctx.restore();
  };

  const draw = () => {
    if (state.renderer) state.renderer.draw();
    drawBoat();
  };
  const tick = (timestamp) => {
    state.frame = 0;
    if (state.paused || document.hidden) return;
    const elapsed = state.previous ? timestamp - state.previous : 16.7;
    if (elapsed >= 15) {
      state.time += Math.min(elapsed / 1000, 0.065);
      state.previous = timestamp;
      draw();
    }
    state.frame = requestAnimationFrame(tick);
  };
  const syncPlayback = () => {
    cancelAnimationFrame(state.frame);
    state.frame = 0;
    state.previous = 0;
    toggle.textContent = state.paused ? 'Play animation' : 'Pause animation';
    toggle.setAttribute('aria-pressed', String(state.paused));
    if (!state.paused && !document.hidden) state.frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resolution = Math.min(dpr, 1800 / Math.max(state.width, state.height));
    water.width = Math.max(1, Math.round(state.width * resolution));
    water.height = Math.max(1, Math.round(state.height * resolution));
    boat.width = Math.round(state.width * dpr);
    boat.height = Math.round(state.height * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const imageAspect = landscape.naturalWidth ? landscape.naturalWidth / landscape.naturalHeight : 16 / 9;
    const aspect = state.width / state.height;
    state.cropX = Math.min(1, aspect / imageAspect);
    state.cropY = Math.min(1, imageAspect / aspect);
    state.centerX = state.cropX / 2 + (1 - state.cropX) * 0.62;
    draw();
  };

  rower.onload = () => {
    state.rowerReady = true;
    state.rowingMotion = window.createRowingMotion ? window.createRowingMotion(rower) : null;
    drawBoat();
  };
  rower.src = scene.dataset.rower;
  landscape.onload = () => {
    state.renderer = createWaterRenderer();
    resize();
    if (state.renderer) water.classList.add('is-ready');
  };
  landscape.src = scene.dataset.image;
  water.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    state.renderer = null;
    water.classList.remove('is-ready');
  });
  water.addEventListener('webglcontextrestored', () => {
    state.renderer = createWaterRenderer();
    if (state.renderer) { state.renderer.draw(); water.classList.add('is-ready'); }
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
