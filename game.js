let scene, camera, renderer;
let player, playerVel = new THREE.Vector3();
let keys = {};
let reqId = null;

let wreckGroup, wreckCollider;
let burstShown = false;
let nearWreck = false;

const ui = {
  panel: document.getElementById('discovery-panel'),
  title: document.getElementById('discovery-title'),
  body: document.getElementById('discovery-body'),
  closeBtns: document.querySelectorAll('.close-discovery'),
};

function openDiscovery(title, html) {
  if (!ui.panel) return;
  ui.title.textContent = title || 'Discovery';
  ui.body.innerHTML = html || '';
  ui.panel.classList.remove('hidden');
}

function closeDiscovery() {
  if (!ui.panel) return;
  ui.panel.classList.add('hidden');
}

ui?.closeBtns?.forEach((b) => {
  b.addEventListener('click', closeDiscovery);
});

function initRenderer() {
  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 6, 14);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.6);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2cc, 0.9);
  sun.position.set(10, 18, 6);
  sun.castShadow = true;
  scene.add(sun);

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x2a302f,
    roughness: 1.0,
    metalness: 0.0,
  });
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
}

function initPlayer() {
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 20, 16),
    new THREE.MeshStandardMaterial({
      color: 0x80a9ff,
      roughness: 0.6,
      metalness: 0.1,
    })
  );
  body.position.set(0, 0.8, 0);
  body.castShadow = true;

  player = new THREE.Group();
  player.add(body);
  scene.add(player);
}

function createAncientWreck() {
  wreckGroup = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(18, 1, 18),
    new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.2,
      roughness: 0.9,
    })
  );
  base.position.set(0, 0.5, 0);
  base.receiveShadow = true;
  wreckGroup.add(base);

  const archMat = new THREE.MeshStandardMaterial({
    color: 0x6a5f4d,
    metalness: 0.1,
    roughness: 0.95,
  });
  const pillarGeo = new THREE.CylinderGeometry(0.8, 1, 8, 8);
  const lintelGeo = new THREE.BoxGeometry(8, 1, 2);

  const p1 = new THREE.Mesh(pillarGeo, archMat);
  p1.position.set(-3, 4.5, -2);
  p1.castShadow = true;

  const p2 = new THREE.Mesh(pillarGeo, archMat);
  p2.position.set(3, 4.5, -2);
  p2.castShadow = true;

  const lintel = new THREE.Mesh(lintelGeo, archMat);
  lintel.position.set(0, 9, -2);
  lintel.rotation.z = THREE.MathUtils.degToRad(-6);
  lintel.castShadow = true;

  wreckGroup.add(p1, p2, lintel);

  for (let i = 0; i < 10; i++) {
    const shard = new THREE.Mesh(
      new THREE.BoxGeometry(
        THREE.MathUtils.randFloat(0.4, 1.2),
        THREE.MathUtils.randFloat(0.2, 0.8),
        THREE.MathUtils.randFloat(0.4, 1.2)
      ),
      new THREE.MeshStandardMaterial({
        color: 0x4b4033,
        metalness: 0.05,
        roughness: 1.0,
      })
    );
    shard.position.set(
      THREE.MathUtils.randFloatSpread(14),
      THREE.MathUtils.randFloat(0.6, 1.2),
      THREE.MathUtils.randFloatSpread(14)
    );
    shard.rotation.set(
      THREE.MathUtils.randFloat(-0.2, 0.2),
      THREE.MathUtils.randFloat(-Math.PI, Math.PI),
      THREE.MathUtils.randFloat(-0.2, 0.2)
    );
    shard.castShadow = true;
    wreckGroup.add(shard);
  }

  wreckCollider = new THREE.Box3().setFromCenterAndSize(
    new THREE.Vector3(0, 4.5, -2),
    new THREE.Vector3(6, 8, 6)
  );

  wreckGroup.position.set(26, 0, -12);
  scene.add(wreckGroup);

  const torch = new THREE.PointLight(0xffb26a, 1.4, 20);
  torch.position.set(0, 7.5, -2);
  wreckGroup.add(torch);
}

function worldToScreen(worldPos) {
  const v = worldPos.clone().project(camera);
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const x = (v.x * 0.5 + 0.5) * w;
  const y = (-v.y * 0.5 + 0.5) * h;
  return { x, y, onScreen: v.z < 1 };
}

function spawnBurst(text, worldPos) {
  const host = document.getElementById('game-view');
  if (!host) return;

  const el = document.createElement('div');
  el.className = 'burst-label';
  el.textContent = text;
  host.appendChild(el);

  const p = worldToScreen(worldPos);
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;

  setTimeout(() => el.remove(), 2200);
}

function checkWreckProximity() {
  if (!player || !wreckGroup) return;

  const playerPos = player.position;
  const wreckWorld = new THREE.Vector3()
    .setFromMatrixPosition(wreckGroup.matrixWorld);

  const dist = playerPos.distanceTo(wreckWorld);
  nearWreck = dist < 10;

  if (nearWreck && !burstShown) {
    burstShown = true;
    const labelAnchor = new THREE.Vector3(0, 9.8, -2)
      .applyMatrix4(wreckGroup.matrixWorld);

    spawnBurst(
      'The stones remember you, Samuel.',
      labelAnchor
    );
  }
}

function handleEnterWreck() {
  if (!nearWreck) return;

  openDiscovery(
    'Ancient Wreck Interior',
    [
      '<p>You step beneath the broken arch.',
      'Ash and salt cling to the stone.</p>',
      '<ul>',
      '<li>Carvings speak of a watcher ',
      'named Samuel who bends time.</li>',
      '<li>A recess holds a rusted seal ',
      'with a faint, warm pulse.</li>',
      '<li>Air whispers like pages ',
      'turning in the dark.</li>',
      '</ul>',
      '<p>Outcome unlocked:',
      ' <strong>Portfolio Lore Fragment</strong>.',
      ' New glows may appear.</p>',
    ].join(' ')
  );
}

function onKeyDown(e) {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Enter' || e.key.toLowerCase() === 'e') {
    handleEnterWreck();
  }
}

function onKeyUp(e) {
  keys[e.key.toLowerCase()] = false;
}

function movePlayer(dt) {
  if (!player) return;

  const acc = 18.0;
  const drag = 8.0;

  const forward = (keys['w'] || keys['arrowup']) ? 1 : 0;
  const back = (keys['s'] || keys['arrowdown']) ? 1 : 0;
  const left = (keys['a'] || keys['arrowleft']) ? 1 : 0;
  const right = (keys['d'] || keys['arrowright']) ? 1 : 0;

  const dir = new THREE.Vector3(
    right - left,
    0,
    back - forward
  );

  if (dir.lengthSq() > 0) {
    dir.normalize();
    playerVel.addScaledVector(dir, acc * dt);
  }

  playerVel.multiplyScalar(Math.max(0, 1 - drag * dt));
  player.position.addScaledVector(playerVel, dt);

  const camTarget = player.position.clone();
  camera.position.lerp(
    new THREE.Vector3(
      camTarget.x + 0,
      camTarget.y + 6,
      camTarget.z + 14
    ),
    0.1
  );
  camera.lookAt(player.position);
}

function onResize() {
  if (!renderer || !camera) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  reqId = requestAnimationFrame(animate);
  const dt = 1 / 60;
  movePlayer(dt);
  checkWreckProximity();
  renderer.render(scene, camera);
}

window.initGame = function initGame() {
  initRenderer();
  initScene();
  initPlayer();
  createAncientWreck();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', onResize);

  animate();
};

window.stopGame = function stopGame() {
  if (reqId) {
    cancelAnimationFrame(reqId);
    reqId = null;
  }
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('resize', onResize);
};

window.startAudioScene = function () { /* no-op */ };
window.stopAudioScene = function () { /* no-op */ };
