// Mystical Island

let scene, camera, renderer, player;
let keys = {};
let discoveryObjects = [];
let gameInitialized = false;
let animationId;
let treasures = [];
let colliders = []; // {x,z,r}
const ISLAND_R = 75;
let boats = [];
let clouds = [];
let stormLight;
let birds = [];

// Audio for adventure mode
let audioCtx, masterGain;
let birdsTimer = null;
let thunderTimer = null;
let audioArmed = false;
let audioRunning = false;

// UI refs for warnings
let shoreWarnEl = null;
let shoreWarnVisible = false;

function armAudioOnce() {
  if (audioArmed) return;
  audioArmed = true;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(audioCtx.destination);
  } catch (e) {
    console.warn('Audio init failed:', e);
  }
}

function startAudioScene() {
  if (!audioArmed) armAudioOnce();
  if (!audioCtx) return;
  if (audioRunning) return;
  audioRunning = true;

  // Birds — small random chirps
  const birdChirp = () => {
    const now = audioCtx.currentTime;
    const nChirps = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nChirps; i++) {
      const t = now + Math.random() * 0.8;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const pan = (audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null);

      osc.type = 'triangle';
      const base = 1600 + Math.random() * 800;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), t + 0.12);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

      if (pan) {
        pan.pan.value = (Math.random() * 2 - 1) * 0.6;
        osc.connect(g).connect(pan).connect(masterGain);
      } else {
        osc.connect(g).connect(masterGain);
      }

      osc.start(t);
      osc.stop(t + 0.22);
    }
  };

  birdsTimer = setInterval(() => {
    if (Math.random() < 0.7) birdChirp();
  }, 2200);

  // Thunder
  const thunder = () => {
    if (!audioCtx) return;
    const dur = 2.8 + Math.random() * 1.4;

    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1.0 - i / data.length); // decaying noise
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;

    const filt = audioCtx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1200 + Math.random() * 800;

    const g = audioCtx.createGain();
    g.gain.value = 0.0001;

    const pan = (audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null);
    if (pan) pan.pan.value = (Math.random() * 2 - 1) * 0.5;

    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    if (pan) src.connect(filt).connect(g).connect(pan).connect(masterGain);
    else src.connect(filt).connect(g).connect(masterGain);
    src.start(now);
    src.stop(now + dur);

    lightningFlash();
  };

  const scheduleThunder = () => {
    thunder();
    const next = 8000 + Math.random() * 14000;
    thunderTimer = setTimeout(scheduleThunder, next);
  };
  scheduleThunder();
}

function stopAudioScene() {
  if (birdsTimer) { clearInterval(birdsTimer); birdsTimer = null; }
  if (thunderTimer) { clearTimeout(thunderTimer); thunderTimer = null; }
  audioRunning = false;
  try { if (audioCtx && audioCtx.state === 'running') audioCtx.suspend(); } catch {}
}

// expose audio controls for interact.js
window.startAudioScene = startAudioScene;
window.stopAudioScene = stopAudioScene;

// NAVIGATION & FIRST-GESTURE HOOK
document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Prime audio on first gesture
  const primeAudio = () => armAudioOnce();
  ['click','keydown','touchstart'].forEach(ev => document.addEventListener(ev, primeAudio, { once: true }));

  // Grab shore warning element
  shoreWarnEl = document.getElementById('shore-warning');
});

// DISCOVERIES CONTENT
const discoveries = {
  windmill: { title: '🏛️ Ancient Windmill', content: `
      <p>You've discovered the Ancient Windmill — a testament to engineering ingenuity!</p>
      <h3>ML Prediction System Project</h3>
      <p>Like this windmill harnesses wind, I built a pipeline that harnesses data patterns to improve accuracy by 35%.</p>
      <ul>
        <li><strong>Tech Stack:</strong> Python, TensorFlow, Docker</li>
        <li><strong>Impact:</strong> 40% faster processing</li>
        <li><strong>Scale:</strong> 100k+ predictions/day</li>
      </ul>`},
  temple: { title: '⛩️ Sacred Temple', content: `
      <p>The Temple holds ancient wisdom and modern innovation!</p>
      <h3>Real-time Analytics Dashboard</h3>
      <p>Processes 10,000+ events per second with sub-100ms latency.</p>
      <ul>
        <li><strong>Stack:</strong> React, Node.js, PostgreSQL, WebSockets</li>
        <li><strong>Users:</strong> 1,000+ concurrent</li>
      </ul>`},
  treasure: { title: '💎 Hidden Treasure', content: `
      <p>A chest filled with automation gems!</p>
      <h3>DevOps Automation Suite</h3>
      <ul>
        <li><strong>Stack:</strong> Python, Kubernetes, GitHub Actions, Terraform</li>
        <li><strong>Benefit:</strong> 60% faster deploys</li>
        <li><strong>Reliability:</strong> 99.9% uptime</li>
      </ul>`},
  lighthouse: { title: '🗼 Ancient Lighthouse', content: `
      <p>The Lighthouse guides travelers safely home.</p>
      <h3>About Me</h3>
      <p>I'm Samuel, a Software and ML Engineer focused on clear, reliable systems.</p>
      <h3>Get In Touch</h3>
      <p>📧 <a href="mailto:samuel@example.com">Email</a><br>
         💻 <a target="_blank" href="https://github.com/samuelapoya">GitHub</a><br>
         💼 <a target="_blank" href="https://linkedin.com">LinkedIn</a></p>`},
  ruins: { title: '🏛️ Ancient Ruins', content: `
      <p>Secrets of distributed systems lie within.</p>
      <h3>Microservices Architecture</h3>
      <ul>
        <li><strong>Stack:</strong> Go, Docker, Redis, RabbitMQ</li>
        <li><strong>Scale:</strong> 5M+ requests/day</li>
        <li><strong>Latency:</strong> &lt;50ms</li>
      </ul>`},
  statue: { title: '🗿 Mystical Pillar', content: `
      <p>The ancient pillar watches over the island's knowledge.</p>
      <h3>AI Chatbot System</h3>
      <ul>
        <li><strong>Stack:</strong> Python, FastAPI, PostgreSQL</li>
        <li><strong>Accuracy:</strong> 92% intent recognition</li>
        <li><strong>Coverage:</strong> 12 languages</li>
      </ul>`}
};

// INITIALIZE GAME
window.initGame = function () {
  if (gameInitialized) return;
  gameInitialized = true;

  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('No #game-canvas found.');
    return;
  }

  scene = new THREE.Scene();
  scene.background = createStormSky();
  scene.fog = new THREE.Fog(0x5e6a75, 55, 220);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1400);
  camera.position.set(0, 8, 15);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const sun = new THREE.DirectionalLight(0xB9C3CF, 0.85);
  sun.position.set(100, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 4096;
  sun.shadow.mapSize.height = 4096;
  Object.assign(sun.shadow.camera, { near: 0.5, far: 600, left: -160, right: 160, top: 160, bottom: -160 });
  scene.add(sun);

  stormLight = new THREE.PointLight(0xFFFFFF, 0, 400);
  stormLight.position.set(0, 120, 0);
  scene.add(stormLight);

  // Ground & sea
  const terrain = createTerrain(); scene.add(terrain);
  scene.add(createBeachRing());
  scene.add(createOcean());
  addCollider(0, 0, ISLAND_R);

  // Player
  player = createPlayer();
  scene.add(player);

  // Landmarks
  createWindmill(-25, 0, -25, 8);
  createTemple(30, 0, -20, 10);
  createLighthouse(-35, 0, 25, 10);
  createAncientRuins(20, 0, 30, 9);
  createMysticalStatue(-15, 0, 35, 6);

  // Treasures
  [
    [15, 0, 25], [-30, 0, -10], [35, 0, 5], [-5, 0, -35],
    [25, 0, -5], [-20, 0, 20], [10, 0, -20], [40, 0, 15],
    [-25, 0, 30], [5, 0, 35], [30, 0, -30], [-35, 0, -20]
  ].forEach(([x, y, z]) => createTreasureChest(x, y, z, 2.6));

  // Vegetation (trees/rocks block)
  for (let i = 0; i < 60; i++) randomPalm();
  for (let i = 0; i < 100; i++) randomBush();
  for (let i = 0; i < 40; i++) randomRock();
  for (let i = 0; i < 50; i++) randomFlower();

  // Boats & beach
  createBoats();
  createGiantVessels(4);
  createBeachDetails();

  // Clouds & birds
  createClouds(44, 0.9);
  createBirdFlock(14);

  // Input & UI
  document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  document.addEventListener('keyup',   e => keys[e.key.toLowerCase()] = false);
  canvas.addEventListener('click', onCanvasClick);
  window.addEventListener('resize', onWindowResize);

  const panel = document.getElementById('discovery-panel');
  const closeBtn = document.querySelector('.close-discovery');
  if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel && !panel.classList.contains('hidden')) panel.classList.add('hidden');
  });

  animate();
};

// SKY, TERRAIN, OCEAN
function createStormSky() {
  const canvas = document.createElement('canvas');
  canvas.width = 2; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#6b7d8a');
  grad.addColorStop(0.5, '#5b6773');
  grad.addColorStop(1, '#4f5a63');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 2, 256);
  return new THREE.CanvasTexture(canvas);
}
function createTerrain() {
  const geo = new THREE.CircleGeometry(80, 128);
  const pos = geo.attributes.position;
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getY(i);
    const elev =
      Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3 +
      Math.sin(x * 0.05) * 2 +
      Math.cos(z * 0.08) * 1.5 +
      (Math.random() - 0.5) * 0.5;
    pos.setZ(i, Math.max(0, elev));
    const dist = Math.sqrt(x*x + z*z);
    const earthiness = THREE.MathUtils.clamp((elev + 1.5) / 6 + (dist/80)*0.3, 0, 1);
    const green = new THREE.Color(0x2f7d31);
    const brown = new THREE.Color(0x7a5e3b);
    const c = green.clone().lerp(brown, earthiness * 0.55);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}
function createBeachRing() {
  const geo = new THREE.RingGeometry(75, 82, 128);
  const mat = new THREE.MeshStandardMaterial({ color: 0xEDC9AF, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.15;
  mesh.receiveShadow = true;
  return mesh;
}
function createOcean() {
  const geo = new THREE.CircleGeometry(170, 128);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0088ff, roughness: 0.15, metalness: 0.75, transparent: true, opacity: 0.92
  });
  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.8;
  water.receiveShadow = true;
  water.userData = { t: 0 };
  return water;
}

// CLOUDS & LIGHTNING VISUAL
function makeCloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  for (let i=0;i<5;i++){
    const x = 40 + i*45, y = 60 - Math.random()*14;
    const r = 46 + Math.random()*20;
    const grad = ctx.createRadialGradient(x, y, r*0.2, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r*0.7, 0, 0, Math.PI*2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}
function createClouds(n=40, opacity=0.85) {
  const tex = makeCloudTexture();
  for (let i = 0; i < n; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(44 + Math.random()*34, 22 + Math.random()*16, 1);
    const ang = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 85;
    sprite.position.set(Math.cos(ang)*dist, 28 + Math.random()*24, Math.sin(ang)*dist);
    sprite.userData = { speed: 0.05 + Math.random()*0.06 };
    scene.add(sprite);
    clouds.push(sprite);
  }
}
function lightningFlash() {
  if (!stormLight) return;
  stormLight.intensity = 0;
  const peak = 8 + Math.random()*6;
  const flashes = 2 + Math.floor(Math.random()*2);
  let count = 0;
  const doFlash = () => {
    stormLight.position.set((Math.random()-0.5)*80, 120 + Math.random()*20, (Math.random()-0.5)*80);
    stormLight.intensity = peak;
    setTimeout(() => { stormLight.intensity = 0; }, 100 + Math.random()*120);
    count++;
    if (count < flashes) setTimeout(doFlash, 80 + Math.random()*120);
  };
  doFlash();
}

// PLAYER
function createPlayer() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 2, 16),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
  );
  body.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.8 })
  );
  head.position.y = 1.5; head.castShadow = true;
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16),
    new THREE.MeshStandardMaterial({ color: 0x654321 })
  );
  hat.position.y = 2.2; hat.castShadow = true;
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16),
    new THREE.MeshStandardMaterial({ color: 0x654321 })
  );
  brim.position.y = 2.0; brim.castShadow = true;
  g.add(body, head, hat, brim);
  g.position.set(0, 1, 0);
  return g;
}

// UTILS
function glowSphere(r, color) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.97 }));
}
function addCollider(x, z, r) { colliders.push({ x, z, r }); }

// BIRDS
function createBird() {
  const geom = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0, 0, 0,
    -0.6, 0.15, 0,
    -0.6, -0.15, 0
  ]);
  geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  const mat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.0, roughness: 1.0, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = false;
  return mesh;
}
function createBirdFlock(n = 12) {
  for (let i = 0; i < n; i++) {
    const b = createBird();
    const radius = 18 + Math.random() * 30;
    const height = 18 + Math.random() * 16;
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.005 + Math.random() * 0.006;
    const wobble = Math.random() * Math.PI * 2;
    b.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    scene.add(b);
    birds.push({ mesh: b, angle, radius, height, speed, wobble });
  }
}
function updateBirds(t) {
  for (const b of birds) {
    b.angle += b.speed;
    const y = b.height + Math.sin(t * 2 + b.wobble) * 1.2;
    const x = Math.cos(b.angle) * b.radius;
    const z = Math.sin(b.angle) * b.radius;
    b.mesh.position.set(x, y, z);
    b.mesh.rotation.y = Math.atan2(Math.cos(b.angle), Math.sin(b.angle));
    b.mesh.rotation.z = Math.sin(t * 10 + b.wobble) * 0.15;
  }
}

// LANDMARKS, TREASURE
function createWindmill(x, y, z, r=8) {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 3, 15, 12),
    new THREE.MeshStandardMaterial({ color: 0xA0826D, roughness: 0.9 })
  );
  tower.castShadow = true; group.add(tower);

  const blades = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 9, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.6 })
    );
    blade.position.y = 7.5;
    blade.rotation.z = (i * Math.PI) / 2;
    blade.castShadow = true;
    blades.add(blade);
  }
  blades.position.y = 7.5;
  group.add(blades);
  group.userData.blades = blades;

  const marker = glowSphere(1.6, 0xFFD700); marker.position.y = 13; group.add(marker);
  const light = new THREE.PointLight(0xFFD700, 3.3, 24); light.position.y = 13; group.add(light);

  group.position.set(x, y + 7.5, z);
  scene.add(group);
  discoveryObjects.push({ mesh: group, type: 'windmill', discovered: false });
  addCollider(x, z, r);
}
function createTemple(x, y, z, r=10) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.95 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), stone);
  base.castShadow = true; group.add(base);
  for (let i = 0; i < 5; i++) {
    const stair = new THREE.Mesh(new THREE.BoxGeometry(12 - i * 0.5, 0.5, 2), stone);
    stair.position.set(0, -1 + i * 0.5, 7 - i);
    stair.castShadow = true; group.add(stair);
  }
  const pillarGeo = new THREE.CylinderGeometry(0.8, 1, 12, 12);
  [[-5,7,-5],[5,7,-5],[-5,7,5],[5,7,5]].forEach(p => {
    const pillar = new THREE.Mesh(pillarGeo, stone);
    pillar.position.set(...p); pillar.castShadow = true; group.add(pillar);
  });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(10, 5, 4), new THREE.MeshStandardMaterial({ color: 0x8B0000 }));
  roof.position.y = 15; roof.rotation.y = Math.PI / 4; roof.castShadow = true; group.add(roof);
  const marker = glowSphere(1.7, 0xFF1493); marker.position.y = 17; group.add(marker);
  const light = new THREE.PointLight(0xFF1493, 3.2, 26); light.position.y = 17; group.add(light);

  group.position.set(x, y + 1, z);
  scene.add(group);
  discoveryObjects.push({ mesh: group, type: 'temple', discovered: false });
  addCollider(x, z, r);
}
function createLighthouse(x, y, z, r=10) {
  const group = new THREE.Group();
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 3.5, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
  );
  tower.castShadow = true; group.add(tower);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 3.6, 3, 16),
      new THREE.MeshStandardMaterial({ color: 0xFF0000 })
    );
    stripe.position.y = -6 + i * 6; group.add(stripe);
  }
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 2.5, 3, 16),
    new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.6 })
  );
  top.position.y = 11.5; group.add(top);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2, 16), new THREE.MeshStandardMaterial({ color: 0xFF0000 }));
  roof.position.y = 14; roof.castShadow = true; group.add(roof);
  const lamp = glowSphere(1.9, 0xFFFF00); lamp.position.y = 11.5; group.add(lamp);
  const marker = glowSphere(1.5, 0x00FFFF); marker.position.y = 16; group.add(marker);
  const light = new THREE.PointLight(0xFFFFAA, 2.2, 40); light.position.y = 12; group.add(light);

  group.position.set(x, y + 10, z);
  scene.add(group);
  discoveryObjects.push({ mesh: group, type: 'lighthouse', discovered: false });
  addCollider(x, z, r);
}
function createAncientRuins(x, y, z, r=9) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.95 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), stone);
  plinth.castShadow = true; group.add(plinth);
  for (let i = 0; i < 6; i++) {
    const h = 6 + Math.random() * 4;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, h, 10), stone);
    const angle = (i / 6) * Math.PI * 2;
    col.position.set(Math.cos(angle) * 3.5, h / 2 + 1, Math.sin(angle) * 3.5);
    col.rotation.y = Math.random() * Math.PI;
    col.castShadow = true;
    group.add(col);
  }
  const marker = glowSphere(1.5, 0xFFA500); marker.position.y = 9; group.add(marker);
  const light = new THREE.PointLight(0xFFA500, 2.6, 28); light.position.y = 9; group.add(light);

  group.position.set(x, y + 1, z);
  scene.add(group);
  discoveryObjects.push({ mesh: group, type: 'ruins', discovered: false });
  addCollider(x, z, r);
}
function createMysticalStatue(x, y, z, r=6) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4), stone); base.castShadow = true; group.add(base);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 6, 12), stone);
  body.position.y = 4; body.castShadow = true; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 16), stone);
  head.position.y = 7.5; head.castShadow = true; group.add(head);
  const marker = glowSphere(1.2, 0x7FFFD4); marker.position.y = 10; group.add(marker);
  const light = new THREE.PointLight(0x7FFFD4, 2.0, 24); light.position.y = 10; group.add(light);

  group.position.set(x, y + 1, z);
  scene.add(group);
  discoveryObjects.push({ mesh: group, type: 'statue', discovered: false });
  addCollider(x, z, r);
}
function createTreasureChest(x, y, z, r=2.6) {
  const group = new THREE.Group();
  group.userData = { open: false, bobPhase: Math.random() * Math.PI * 2 };

  const chestMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7, metalness: 0.2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 1.5), chestMat); body.castShadow = true; group.add(body);
  const lid  = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 1.6), chestMat); lid.position.y = 0.9; lid.castShadow = true; group.add(lid);

  const gold = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.9, roughness: 0.1 });
  const trim1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.7), gold); trim1.position.y = 0; group.add(trim1);
  const trim2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 1.7), gold); trim2.position.y = 0.8; group.add(trim2);

  const colors = [0xFFD700, 0xFF1493, 0x00FF00, 0x00FFFF, 0xFF4500];
  for (let i = 0; i < 6; i++) {
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
    gem.position.set((Math.random() - 0.5) * 1.5, 1.2 + Math.random() * 0.3, (Math.random() - 0.5) * 1);
    group.add(gem);
  }

  const marker = glowSphere(1.0, 0xFFFFFF); marker.position.y = 2; group.add(marker);
  const light = new THREE.PointLight(0xFFD700, 3.6, 14); light.position.y = 2; group.add(light);

  group.position.set(x, y + 0.75, z);
  scene.add(group);

  treasures.push(group);
  discoveryObjects.push({ mesh: group, type: 'treasure', discovered: false });
  addCollider(x, z, r);
}

// trees, rocks add colliders; bushes do not
function randomPalm() {
  const a = Math.random() * Math.PI * 2, d = 15 + Math.random() * 55;
  const x = Math.cos(a) * d, z = Math.sin(a) * d;

  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 }));
  trunk.castShadow = true; g.add(trunk);
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.3, 6, 4), frondMat);
    frond.position.y = 10; frond.rotation.z = Math.PI / 3; frond.rotation.y = (i * Math.PI * 2) / 8;
    frond.castShadow = true; g.add(frond);
  }
  g.position.set(x, 6, z);
  scene.add(g);

  addCollider(x, z, 1.3); // block around trunk
}
function randomBush() {
  const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 60;
  const bush = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random(), 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.95 }));
  bush.position.set(Math.cos(a) * d, 0.5, Math.sin(a) * d);
  bush.scale.y = 0.8; bush.castShadow = true; scene.add(bush);
}
function randomRock() {
  const a = Math.random() * Math.PI * 2, d = 15 + Math.random() * 55;
  const size = 1 + Math.random() * 2;
  const x = Math.cos(a) * d, z = Math.sin(a) * d;
  const rock = new THREE.Mesh(new THREE.SphereGeometry(size, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9 }));
  rock.position.set(x, size * 0.3, z);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  rock.scale.set(1, 0.6, 1); rock.castShadow = true; scene.add(rock);

  addCollider(x, z, size * 0.9);
}
function randomFlower() {
  const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 60;
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x2E7D32 }));
  stem.position.y = 0.75; g.add(stem);
  const colors = [0xFF1493, 0xFF6347, 0xFFD700, 0xFF69B4, 0xDC143C];
  const petalColor = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < 6; i++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.4 }));
    const ang = (i * Math.PI * 2) / 6;
    petal.position.set(Math.cos(ang) * 0.3, 1.5, Math.sin(ang) * 0.3);
    petal.scale.set(0.8, 0.5, 0.8); g.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xFFFF00 }));
  center.position.y = 1.5; g.add(center);
  g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  scene.add(g);
}
function createBeachDetails() {
  for (let i = 0; i < 15; i++) {
    const ang = Math.random() * Math.PI * 2, d = 82 + Math.random() * 3;
    const seashell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xFFE4C4, roughness: 0.6 }));
    seashell.position.set(Math.cos(ang) * d, 0.2, Math.sin(ang) * d);
    seashell.scale.set(1, 0.5, 1.2);
    scene.add(seashell);
  }
}

// BOATS
function createBoats() {
  const pos = [
    { a: 0, d: 95 }, { a: Math.PI / 3, d: 100 }, { a: (2 * Math.PI) / 3, d: 105 },
    { a: Math.PI, d: 98 }, { a: (4 * Math.PI) / 3, d: 102 }, { a: (5 * Math.PI) / 3, d: 97 }
  ];
  pos.forEach(p => {
    const x = Math.cos(p.a) * p.d, z = Math.sin(p.a) * p.d;
    boats.push(createBoat(x, -0.5, z, p.a, p.d));
  });
}
function createGiantVessels(count = 3) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = 125 + Math.random() * 30;
    const x = Math.cos(a)*d, z = Math.sin(a)*d;
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x4b2f20, roughness: 0.85 }));
    hull.castShadow = true; g.add(hull);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(20, 1.2, 5),
      new THREE.MeshStandardMaterial({ color: 0x9d816a, roughness: 0.9 }));
    deck.position.y = 3.5; g.add(deck);
    const mast1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 18, 10),
      new THREE.MeshStandardMaterial({ color: 0x403022 }));
    mast1.position.set(-5, 10, 0); g.add(mast1);
    const mast2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 20, 10),
      new THREE.MeshStandardMaterial({ color: 0x403022 }));
    mast2.position.set(6, 11, 0); g.add(mast2);
    const sailMat = new THREE.MeshStandardMaterial({ color: 0xfaf7ef, side: THREE.DoubleSide, roughness: 0.7 });
    const sail1 = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), sailMat);
    sail1.position.set(-5, 10, 3); sail1.rotation.y = Math.PI/6; g.add(sail1);
    const sail2 = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), sailMat);
    sail2.position.set(6, 11, 3.2); sail2.rotation.y = Math.PI/6; g.add(sail2);

    g.position.set(x, -0.5, z);
    g.rotation.y = a + Math.PI/2;
    scene.add(g);
    boats.push({ mesh: g, angle: a, distance: d, speed: 0.00010 + Math.random()*0.00008, bobPhase: Math.random()*Math.PI*2 });
  }
}
function createBoat(x, y, z, angle, distance) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 }));
  hull.castShadow = true; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
  bow.rotation.z = -Math.PI / 2; bow.position.set(5, 0, 0); bow.castShadow = true; g.add(bow);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x654321 }));
  mast.position.y = 5; mast.castShadow = true; g.add(mast);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(5, 6),
    new THREE.MeshStandardMaterial({ color: 0xFFFAF0, side: THREE.DoubleSide }));
  sail.position.set(0, 5, 1.5); sail.rotation.y = Math.PI / 6; sail.castShadow = true; g.add(sail);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 2.5),
    new THREE.MeshStandardMaterial({ color: 0xD2691E }));
  deck.position.y = 1.2; g.add(deck);
  g.position.set(x, y, z);
  g.rotation.y = angle + Math.PI / 2;
  scene.add(g);
  return { mesh: g, angle, distance, speed: 0.00022 + Math.random() * 0.00025, bobPhase: Math.random() * Math.PI * 2 };
}

// INTERACTION
function screenRay(x, y) {
  const mouse = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(mouse, camera);
  return ray;
}
function onCanvasClick(event) {
  const ray = screenRay(event.clientX, event.clientY);
  discoveryObjects.forEach(obj => {
    const hit = ray.intersectObject(obj.mesh, true);
    if (hit.length) {
      const dist = player.position.distanceTo(obj.mesh.position);
      if (dist < 20) {
        if (obj.type === 'treasure') {
          const openNow = toggleTreasure(obj.mesh);
          if (openNow) {
            showDiscovery('treasure');
            burstLabelAt(obj.mesh.position, randomTreasureTitle());
          } else {
            const panel = document.getElementById('discovery-panel');
            if (panel) panel.classList.add('hidden');
          }
        } else {
          showDiscovery(obj.type);
        }
        obj.discovered = true;
      }
    }
  });
}
function toggleTreasure(mesh) {
  mesh.userData.open = !mesh.userData.open;
  const lid = mesh.children.find(ch => ch.geometry && ch.geometry.type === 'BoxGeometry' && ch.position.y === 0.9);
  const light = mesh.children.find(ch => ch.isPointLight);
  const glow  = mesh.children.find(ch => ch.material && ch.material.transparent);
  if (lid) lid.rotation.z = mesh.userData.open ? -0.9 : 0;
  if (light) light.intensity = mesh.userData.open ? 4.8 : 3.6;
  if (glow && glow.material) glow.material.opacity = mesh.userData.open ? 1.0 : 0.97;
  return mesh.userData.open;
}
function randomTreasureTitle() {
  const pool = [
    "Samuel's Insight Treasure",
    "Samuel's Deployment Vault",
    "Data Alchemy Cache",
    "Latency Slayer Gem",
    "Reliability Relic",
    "Ship-It Sapphire",
    "Zero-Downtime Ruby",
    "Scaling Emerald"
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}
function burstLabelAt(worldPos, text) {
  const div = document.createElement('div');
  div.className = 'burst-label';
  div.textContent = text;
  const v = worldPos.clone().project(camera);
  const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
  div.style.left = `${sx}px`;
  div.style.top  = `${sy}px`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 1900);
}
function showDiscovery(type) {
  const panel = document.getElementById('discovery-panel');
  const title = document.getElementById('discovery-title');
  const body  = document.getElementById('discovery-body');
  const d = discoveries[type]; if (!d) return;
  title.textContent = d.title;
  body.innerHTML = d.content;
  panel.classList.remove('hidden');
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// MOVEMENT and COLLISIONS
function reflectVec(vx, vz, nx, nz) {
  const dot = vx*nx + vz*nz;
  return { x: vx - 2*dot*nx, z: vz - 2*dot*nz };
}
function tryMove(dx, dz) {
  const speedVec = { x: dx, z: dz };
  const next = player.position.clone().add(new THREE.Vector3(dx, 0, dz));

  // Outer boundary bounce
  const distToCenter = Math.hypot(next.x, next.z);
  if (distToCenter > ISLAND_R - 0.2) {
    const nx = next.x / distToCenter, nz = next.z / distToCenter;
    const r = reflectVec(speedVec.x, speedVec.z, nx, nz);
    const alt = player.position.clone().add(new THREE.Vector3(r.x*0.6, 0, r.z*0.6));
    if (Math.hypot(alt.x, alt.z) <= ISLAND_R - 0.2) player.position.copy(alt);
    return;
  }

  // Landmark, tree, rock bounces
  for (const col of colliders) {
    if (col.x === 0 && col.z === 0 && col.r === ISLAND_R) continue;
    const dxC = next.x - col.x;
    const dzC = next.z - col.z;
    const d = Math.hypot(dxC, dzC);
    if (d < col.r) {
      const nx = dxC / (d || 1), nz = dzC / (d || 1);
      const r = reflectVec(speedVec.x, speedVec.z, nx, nz);
      const alt = player.position.clone().add(new THREE.Vector3(r.x*0.6, 0, r.z*0.6));
      const stillColliding = Math.hypot(alt.x - col.x, alt.z - col.z) < col.r;
      if (!stillColliding && Math.hypot(alt.x, alt.z) <= ISLAND_R) player.position.copy(alt);
      else {
        const tryX = player.position.clone().add(new THREE.Vector3(speedVec.x, 0, 0));
        const tryZ = player.position.clone().add(new THREE.Vector3(0, 0, speedVec.z));
        const okX = Math.hypot(tryX.x - col.x, tryX.z - col.z) >= col.r && Math.hypot(tryX.x, tryX.z) <= ISLAND_R;
        const okZ = Math.hypot(tryZ.x - col.x, tryZ.z) >= col.r && Math.hypot(tryZ.x, tryZ.z) <= ISLAND_R;
        if (okX) player.position.copy(tryX);
        else if (okZ) player.position.copy(tryZ);
      }
      return;
    }
  }

  player.position.copy(next);
}

// Shore warning UI toggle
function setShoreWarning(show) {
  if (!shoreWarnEl) return;
  if (show && !shoreWarnVisible) {
    shoreWarnEl.classList.remove('hidden');
    shoreWarnVisible = true;
  } else if (!show && shoreWarnVisible) {
    shoreWarnEl.classList.add('hidden');
    shoreWarnVisible = false;
  }
}

// LOOP
function animate() {
  animationId = requestAnimationFrame(animate);

  const speed = 0.28;
  let mx = 0, mz = 0;
  if (keys['a'] || keys['arrowleft'])  mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (keys['w'] || keys['arrowup'])    mz -= 1;
  if (keys['s'] || keys['arrowdown'])  mz += 1;
  if (mx || mz) {
    const len = Math.hypot(mx, mz);
    mx = (mx / len) * speed;
    mz = (mz / len) * speed;
    tryMove(mx, mz);
    player.rotation.y = Math.atan2(mx, mz);
  }

  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 15;
  camera.position.y = player.position.y + 10;
  camera.lookAt(player.position);

  const t = performance.now() * 0.001;

  // Glow + windmill
  discoveryObjects.forEach(obj => {
    const m = obj.mesh.children.find(ch => ch.material && ch.material.transparent);
    if (m && m.material) {
      m.position.y += Math.sin(t * 2) * 0.02;
      m.material.opacity = 0.65 + Math.sin(t * 7) * 0.35; // brighter, quicker blink
    }
    if (obj.type === 'windmill' && obj.mesh.userData.blades) {
      obj.mesh.userData.blades.rotation.z += 0.05;
    }
  });

  // Ocean subtle motion
  const ocean = scene.children.find(
    ch => ch.geometry && ch.geometry.type === 'CircleGeometry' && ch.position && ch.position.y < -0.5
  );
  if (ocean && ocean.userData) {
    ocean.userData.t = (ocean.userData.t || 0) + 0.005;
    ocean.rotation.z = Math.sin(ocean.userData.t) * 0.006;
    if (ocean.material && 'opacity' in ocean.material) {
      ocean.material.opacity = 0.9 + Math.sin(ocean.userData.t * 2) * 0.02;
    }
  }

  // Boats
  boats.forEach(b => {
    b.angle += b.speed;
    b.mesh.position.set(Math.cos(b.angle) * b.distance, -0.5 + Math.sin(t * 2 + b.bobPhase) * 0.2, Math.sin(b.angle) * b.distance);
    b.mesh.rotation.y = b.angle + Math.PI / 2;
  });

  // Birds flight update
  updateBirds(t);

  // Treasure bob
  treasures.forEach(tr => {
    tr.position.y = 0.75 + Math.sin(t * 2 + (tr.userData.bobPhase || 0)) * 0.05;
  });

  // Clouds drift
  for (const cl of clouds) {
    cl.position.x += cl.userData.speed * 0.04;
    if (Math.hypot(cl.position.x, cl.position.z) > 150) {
      cl.position.x *= -0.8; cl.position.z *= -0.8;
    }
  }

  // Pirate warning near shore
  const distFromCenter = Math.hypot(player.position.x, player.position.z);
  const shoreThreshold = ISLAND_R - 6; // within 6 units of shoreline
  setShoreWarning(distFromCenter >= shoreThreshold);

  renderer.render(scene, camera);
}

window.stopGame = function () {
  if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
};
