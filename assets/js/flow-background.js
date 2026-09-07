// Load the local 3D engine only after the profile's first paint.
requestAnimationFrame(() => requestAnimationFrame(async () => {
  const canvas = document.querySelector('.flow-canvas');
  const button = document.querySelector('.motion-toggle');
  if (!canvas || !button) return;
  try {
    const [THREE, { Flock }] = await Promise.all([
      import('./three/three.module.min.js'), import('./flock-model.js')
    ]);
    start(THREE, Flock, canvas, button);
  } catch (error) {
    // The independently rendered sky and profile stay usable without WebGL.
    canvas.style.opacity = '0';
    button.hidden = true;
    console.warn('Murmuration unavailable; using the static sky.', error);
  }
}));

function start(THREE, Flock, canvas, button) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.innerWidth < 600;
  const flock = new Flock(mobile ? 1200 : 3200, window.innerWidth / window.innerHeight);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 600);
  camera.position.set(0, 0, 172);
  camera.lookAt(0, 0, 0);

  // One instanced draw call, with articulated wings animated on the GPU.
  const geometry = new THREE.InstancedBufferGeometry();
  const vertices = new Float32Array([
    -.045,0,-.2, .045,0,-.2, 0,.035,.28,
    0,0,.12, -.24,0,-.015, -.09,0,-.14,
    -.24,0,-.015, -.53,0,-.28, -.09,0,-.14,
    0,0,.12, .09,0,-.14, .24,0,-.015,
    .24,0,-.015, .09,0,-.14, .53,0,-.28,
    0,0,-.12, -.085,0,-.34, .085,0,-.34
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  const positions = new THREE.InstancedBufferAttribute(flock.positions, 3).setUsage(THREE.DynamicDrawUsage);
  const velocities = new THREE.InstancedBufferAttribute(flock.velocities, 3).setUsage(THREE.DynamicDrawUsage);
  const banks = new THREE.InstancedBufferAttribute(flock.banks, 1).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('birdPosition', positions);
  geometry.setAttribute('birdVelocity', velocities);
  geometry.setAttribute('birdBank', banks);
  geometry.setAttribute('birdPhase', new THREE.InstancedBufferAttribute(flock.phases, 1));
  geometry.setAttribute('birdSize', new THREE.InstancedBufferAttribute(flock.sizes, 1));
  geometry.instanceCount = flock.count;
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 birdPosition;
      attribute vec3 birdVelocity;
      attribute float birdBank;
      attribute float birdPhase;
      attribute float birdSize;
      uniform float uTime;
      varying float vDistance;
      varying float vLight;
      void main() {
        vec3 p = position;
        float glide = smoothstep(-.3, .7, sin(uTime * .42 + birdPhase));
        float flap = sin(uTime * (7.0 + birdSize) + birdPhase);
        p.y += abs(p.x) * flap * (.12 + .78 * glide);
        p.z += abs(p.x) * cos(uTime * 7.0 + birdPhase) * .075;
        vec3 forward = normalize(birdVelocity);
        vec3 reference = abs(forward.y) > .95 ? vec3(1.,0.,0.) : vec3(0.,1.,0.);
        vec3 right = normalize(cross(reference, forward));
        vec3 up = normalize(cross(forward, right));
        vec3 bankRight = right * cos(birdBank) + up * sin(birdBank);
        vec3 bankUp = up * cos(birdBank) - right * sin(birdBank);
        vec3 world = birdPosition + (bankRight * p.x + bankUp * p.y + forward * p.z) * birdSize;
        vec4 view = modelViewMatrix * vec4(world, 1.);
        vDistance = -view.z;
        vLight = .5 + .5 * abs(dot(bankUp, vec3(.3,.7,.4)));
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      varying float vDistance;
      varying float vLight;
      void main() {
        vec3 ink = mix(vec3(.012,.02,.029), vec3(.038,.05,.061), vLight);
        float haze = smoothstep(125., 240., vDistance) * .56;
        gl_FragColor = vec4(mix(ink, vec3(.43,.51,.55), haze), 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let paused = preference.matches, lost = false;
  let frame = 0, previous = null, accumulator = 0;
  const pointer = { active: false, x: 0, y: 0 };
  function render() {
    positions.needsUpdate = velocities.needsUpdate = banks.needsUpdate = true;
    material.uniforms.uTime.value = flock.time;
    renderer.render(scene, camera);
  }
  function resize() {
    const width = Math.max(1, window.innerWidth), height = Math.max(1, window.innerHeight);
    flock.resize(width / height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (!lost) render();
  }
  function tick(now) {
    frame = 0;
    if (paused || lost || document.hidden) return;
    if (previous !== null) accumulator += Math.min((now - previous) / 1000, .06);
    previous = now;
    let updated = false;
    while (accumulator >= 1 / 30) {
      // Slower simulation time gives the flock unhurried collective turns.
      flock.step(1 / 45, pointer);
      accumulator -= 1 / 30;
      updated = true;
    }
    if (updated) render();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0; previous = null; accumulator = 0;
    button.textContent = paused ? 'Play animation' : 'Pause animation';
    button.setAttribute('aria-pressed', String(paused));
    if (!paused && !lost && !document.hidden) frame = requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => { paused = !paused; sync(); });
  preference.addEventListener('change', () => { paused = preference.matches; sync(); });
  document.addEventListener('visibilitychange', () => { pointer.active = false; sync(); });
  window.addEventListener('pointermove', event => {
    const halfHeight = Math.tan(25 * Math.PI / 180) * camera.position.z;
    pointer.x = (event.clientX / window.innerWidth * 2 - 1) * halfHeight * camera.aspect;
    pointer.y = (1 - event.clientY / window.innerHeight * 2) * halfHeight;
    pointer.active = true;
  }, { passive: true });
  window.addEventListener('pointerup', event => {
    if (event.pointerType !== 'mouse') pointer.active = false;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); lost = true; canvas.style.opacity = '0'; button.hidden = true; sync();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; canvas.style.opacity = '1'; button.hidden = false; resize(); sync();
  });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150);
  }, { passive: true });
  resize();
  button.hidden = false;
  sync();
}
