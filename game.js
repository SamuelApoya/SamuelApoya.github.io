let scene, camera, renderer, player;
let moveState = { w: false, a: false, s: false, d: false };
let islands = [];
let treasures = [];
let discoveryPanel, discoveryTitle, discoveryBody;
let raycaster, mouse;
let animationId = null;

// Ancient wreck structure
let ancientWreck = null;
let wreckBounds = null;
let hasShownWreckMessage = false;
const WRECK_PROXIMITY = 15; // Distance to trigger message

function initGame() {
  if (!window.THREE) {
    console.error('THREE is not loaded');
    return;
  }

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // Scene
  scene = new window.THREE.Scene();
  scene.background = new window.THREE.Color(0x87ceeb);
  scene.fog = new window.THREE.Fog(0x87ceeb, 50, 200);

  // Camera
  camera = new window.THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 25, 40);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new window.THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;

  // Lighting
  const ambient = new window.THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const sun = new window.THREE.DirectionalLight(0xfff8dc, 0.8);
  sun.position.set(50, 80, 50);
  sun.castShadow = true;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 200;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  scene.add(sun);

  // Ocean
  const oceanGeo = new window.THREE.PlaneGeometry(400, 400);
  const oceanMat = new window.THREE.MeshStandardMaterial({
    color: 0x1e90ff,
    roughness: 0.3,
    metalness: 0.1,
  });
  const ocean = new window.THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = -0.5;
  ocean.receiveShadow = true;
  scene.add(ocean);

  // Create main island
  createMainIsland();

  // Create ancient wreck structure
  createAncientWreck();

  // Player avatar
  const bodyGeo = new window.THREE.CylinderGeometry(0.5, 0.5, 2, 8);
  const bodyMat = new window.THREE.MeshStandardMaterial({ color: 0xff6b6b });
  const body = new window.THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;

  const headGeo = new window.THREE.SphereGeometry(0.4, 8, 8);
  const headMat = new window.THREE.MeshStandardMaterial({ color: 0xffcc99 });
  const head = new window.THREE.Mesh(headGeo, headMat);
  head.position.y = 1.4;
  head.castShadow = true;

  player = new window.THREE.Group();
  player.add(body);
  player.add(head);
  player.position.set(0, 2, 0);
  scene.add(player);

  // Raycaster for clicks
  raycaster = new window.THREE.Raycaster();
  mouse = new window.THREE.Vector2();

  // Discovery panel refs
  discoveryPanel = document.getElementById('discovery-panel');
  discoveryTitle = document.getElementById('discovery-title');
  discoveryBody = document.getElementById('discovery-body');

  const closeBtn = document.querySelector('.close-discovery');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      discoveryPanel.classList.add('hidden');
    });
  }

  // Input
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('click', onCanvasClick);
  window.addEventListener('resize', onResize);

  animate();
}

function createMainIsland() {
  const islandGroup = new window.THREE.Group();

  // Base sand
  const baseGeo = new window.THREE.CylinderGeometry(20, 22, 3, 32);
  const baseMat = new window.THREE.MeshStandardMaterial({
    color: 0xf4e4c1,
    roughness: 0.9,
  });
  const base = new window.THREE.Mesh(baseGeo, baseMat);
  base.castShadow = true;
  base.receiveShadow = true;
  islandGroup.add(base);

  // Grassy top
  const topGeo = new window.THREE.CylinderGeometry(18, 20, 1.5, 32);
  const topMat = new window.THREE.MeshStandardMaterial({
    color: 0x6b8e23,
    roughness: 0.95,
  });
  const top = new window.THREE.Mesh(topGeo, topMat);
  top.position.y = 2.25;
  top.castShadow = true;
  top.receiveShadow = true;
  islandGroup.add(top);

  // Palm trees
  addPalmTree(islandGroup, 10, 3, 8);
  addPalmTree(islandGroup, -8, 3, 6);
  addPalmTree(islandGroup, 5, 3, -10);

  // Rocks
  addRock(islandGroup, -10, 3, -5, 1.2);
  addRock(islandGroup, 12, 3, -3, 0.9);
  addRock(islandGroup, 0, 3, 12, 1.5);

  islandGroup.position.y = 1.5;
  scene.add(islandGroup);
  islands.push(islandGroup);

  // Treasures
  addTreasure(8, 4.5, 5, '🤖 ML System', 'End-to-end ML pipeline with 35% improved accuracy.');
  addTreasure(-6, 4.5, -8, '⚡ Analytics Dashboard', 'Real-time dashboard processing 10k+ events/sec.');
  addTreasure(0, 4.5, -12, '🔧 DevOps Suite', 'Automation suite reducing deployment time by 60%.');
}

function createAncientWreck() {
  const wreckGroup = new window.THREE.Group();

  // Main building base
  const foundationGeo = new window.THREE.BoxGeometry(12, 2, 10);
  const stoneMat = new window.THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 1,
  });
  const foundation = new window.THREE.Mesh(foundationGeo, stoneMat);
  foundation.position.y = 4;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  wreckGroup.add(foundation);

  // Weathered walls
  const wallMat = new window.THREE.MeshStandardMaterial({
    color: 0x5a5a5a,
    roughness: 0.95,
  });

  // Left wall
  const leftWallGeo = new window.THREE.BoxGeometry(1, 6, 10);
  const leftWall = new window.THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(-5.5, 6, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  wreckGroup.add(leftWall);

  // Right wall
  const rightWallGeo = new window.THREE.BoxGeometry(1, 6, 10);
  const rightWall = new window.THREE.Mesh(rightWallGeo, wallMat);
  rightWall.position.set(5.5, 6, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  wreckGroup.add(rightWall);

  // Back wall
  const backWallGeo = new window.THREE.BoxGeometry(12, 6, 1);
  const backWall = new window.THREE.Mesh(backWallGeo, backMat);
  backWall.position.set(0, 6, -4.5);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  wreckGroup.add(backWall);

  // Front walls
  const frontLeftGeo = new window.THREE.BoxGeometry(3, 6, 1);
  const frontLeft = new window.THREE.Mesh(frontLeftGeo, wallMat);
  frontLeft.position.set(-3.5, 6, 4.5);
  frontLeft.castShadow = true;
  frontLeft.receiveShadow = true;
  wreckGroup.add(frontLeft);

  const frontRightGeo = new window.THREE.BoxGeometry(3, 6, 1);
  const frontRight = new window.THREE.Mesh(frontRightGeo, wallMat);
  frontRight.position.set(3.5, 6, 4.5);
  frontRight.castShadow = true;
  frontRight.receiveShadow = true;
  wreckGroup.add(frontRight);

  // Doorway lintel
  const lintelGeo = new window.THREE.BoxGeometry(4, 0.8, 1);
  const lintel = new window.THREE.Mesh(lintelGeo, wallMat);
  lintel.position.set(0, 8.4, 4.5);
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  wreckGroup.add(lintel);

  // Collapsed roof sections
  const roofMat = new window.THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    roughness: 1,
  });

  const roofLeft = new window.THREE.BoxGeometry(6, 0.5, 10);
  const roofLeftMesh = new window.THREE.Mesh(roofLeft, roofMat);
  roofLeftMesh.position.set(-3, 9.5, 0);
  roofLeftMesh.rotation.z = 0.3;
  roofLeftMesh.castShadow = true;
  wreckGroup.add(roofLeftMesh);

  const roofRight = new window.THREE.BoxGeometry(5, 0.5, 10);
  const roofRightMesh = new window.THREE.Mesh(roofRight, roofMat);
  roofRightMesh.position.set(3.5, 9.2, 0);
  roofRightMesh.rotation.z = -0.4;
  roofRightMesh.castShadow = true;
  wreckGroup.add(roofRightMesh);

  // Decorative ancient pillars
  const pillarGeo = new window.THREE.CylinderGeometry(0.6, 0.7, 5, 8);
  const pillarMat = new window.THREE.MeshStandardMaterial({
    color: 0x6a6a6a,
    roughness: 1,
  });

  const pillar1 = new window.THREE.Mesh(pillarGeo, pillarMat);
  pillar1.position.set(-4, 5.5, 3);
  pillar1.castShadow = true;
  wreckGroup.add(pillar1);

  const pillar2 = new window.THREE.Mesh(pillarGeo, pillarMat);
  pillar2.position.set(4, 5.5, 3);
  pillar2.castShadow = true;
  wreckGroup.add(pillar2);

  // Overgrown vines/moss effect
  const vineMat = new window.THREE.MeshStandardMaterial({
    color: 0x2d5016,
    roughness: 1,
  });

  for (let i = 0; i < 8; i++) {
    const vineGeo = new window.THREE.BoxGeometry(0.3, Math.random() * 3 + 2, 0.3);
    const vine = new window.THREE.Mesh(vineGeo, vineMat);
    vine.position.set(
      (Math.random() - 0.5) * 10,
      Math.random() * 4 + 4,
      (Math.random() - 0.5) * 8
    );
    wreckGroup.add(vine);
  }

  // Position the wreck on the island
  wreckGroup.position.set(-15, 3, -15);
  scene.add(wreckGroup);
  ancientWreck = wreckGroup;

  // Define collision bounds
  wreckBounds = {
    minX: wreckGroup.position.x - 6,
    maxX: wreckGroup.position.x + 6,
    minZ: wreckGroup.position.z - 5,
    maxZ: wreckGroup.position.z + 5,
    doorMinX: wreckGroup.position.x - 2,
    doorMaxX: wreckGroup.position.x + 2,
    doorZ: wreckGroup.position.z + 4.5,
  };
}

function checkWreckProximity() {
  if (!player || !ancientWreck || hasShownWreckMessage) return;

  const distance = player.position.distanceTo(ancientWreck.position);
  
  if (distance < WRECK_PROXIMITY) {
    hasShownWreckMessage = true;
    showBurstLabel(
      player.position.x,
      player.position.y + 3,
      player.position.z,
      "Samuel's forgotten sanctuary whispers..."
    );
  }
}

function isInsideWreck(x, z) {
  if (!wreckBounds) return false;
  
  // Check if inside building bounds
  const inBounds = x > wreckBounds.minX && x < wreckBounds.maxX &&
                   z > wreckBounds.minZ && z < wreckBounds.maxZ;
  
  // Check if in doorway
  const inDoorway = x > wreckBounds.doorMinX && x < wreckBounds.doorMaxX &&
                    z > wreckBounds.doorZ - 1 && z < wreckBounds.doorZ + 1;
  
  return inBounds && !inDoorway;
}

function checkWreckCollision(newX, newZ) {
  if (!wreckBounds) return false;

  // Check walls
  // Left wall
  if (newX < wreckBounds.minX + 0.5 && newX > wreckBounds.minX - 1 &&
      newZ > wreckBounds.minZ && newZ < wreckBounds.maxZ) {
    return true;
  }
  
  // Right wall
  if (newX > wreckBounds.maxX - 0.5 && newX < wreckBounds.maxX + 1 &&
      newZ > wreckBounds.minZ && newZ < wreckBounds.maxZ) {
    return true;
  }
  
  // Back wall
  if (newZ < wreckBounds.minZ + 0.5 && newZ > wreckBounds.minZ - 1 &&
      newX > wreckBounds.minX && newX < wreckBounds.maxX) {
    return true;
  }
  
  // Front wall
  if (newZ > wreckBounds.doorZ - 0.5 && newZ < wreckBounds.doorZ + 0.5) {
    // Check if NOT in doorway area
    if (newX < wreckBounds.doorMinX || newX > wreckBounds.doorMaxX) {
      if (newX > wreckBounds.minX && newX < wreckBounds.maxX) {
        return true;
      }
    }
  }
  
  return false;
}

function addPalmTree(parent, x, y, z) {
  const trunkGeo = new window.THREE.CylinderGeometry(0.3, 0.4, 5, 8);
  const trunkMat = new window.THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const trunk = new window.THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, y + 2.5, z);
  trunk.castShadow = true;
  parent.add(trunk);

  const leavesGeo = new window.THREE.ConeGeometry(2, 3, 8);
  const leavesMat = new window.THREE.MeshStandardMaterial({ color: 0x228b22 });
  const leaves = new window.THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.set(x, y + 6, z);
  leaves.castShadow = true;
  parent.add(leaves);
}

function addRock(parent, x, y, z, scale = 1) {
  const rockGeo = new window.THREE.DodecahedronGeometry(scale, 0);
  const rockMat = new window.THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 1,
  });
  const rock = new window.THREE.Mesh(rockGeo, rockMat);
  rock.position.set(x, y, z);
  rock.castShadow = true;
  rock.receiveShadow = true;
  parent.add(rock);
}

function addTreasure(x, y, z, title, description) {
  const geo = new window.THREE.SphereGeometry(0.8, 16, 16);
  const mat = new window.THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffaa00,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.8,
  });
  const orb = new window.THREE.Mesh(geo, mat);
  orb.position.set(x, y, z);
  orb.castShadow = true;

  orb.userData = { title, description, discovered: false };
  scene.add(orb);
  treasures.push(orb);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  // Move player
  const speed = 0.2;
  let newX = player.position.x;
  let newZ = player.position.z;

  if (moveState.w) newZ -= speed;
  if (moveState.s) newZ += speed;
  if (moveState.a) newX -= speed;
  if (moveState.d) newX += speed;

  // Check wreck collision before moving
  if (!checkWreckCollision(newX, newZ)) {
    player.position.x = newX;
    player.position.z = newZ;
  }

  // Rotate player toward movement
  if (moveState.w || moveState.s || moveState.a || moveState.d) {
    const angle = Math.atan2(newX - player.position.x, newZ - player.position.z);
    player.rotation.y = angle;
  }

  // Check wreck proximity
  checkWreckProximity();

  // Animate treasures
  treasures.forEach((t) => {
    if (!t.userData.discovered) {
      t.rotation.y += 0.02;
      t.position.y += Math.sin(Date.now() * 0.003 + t.position.x) * 0.005;
    }
  });

  // Camera follows player
  camera.position.x = player.position.x;
  camera.position.z = player.position.z + 20;
  camera.position.y = player.position.y + 15;
  camera.lookAt(player.position);

  renderer.render(scene, camera);
}

function onKeyDown(e) {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') moveState.w = true;
  if (k === 's' || k === 'arrowdown') moveState.s = true;
  if (k === 'a' || k === 'arrowleft') moveState.a = true;
  if (k === 'd' || k === 'arrowright') moveState.d = true;
}

function onKeyUp(e) {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') moveState.w = false;
  if (k === 's' || k === 'arrowdown') moveState.s = false;
  if (k === 'a' || k === 'arrowleft') moveState.a = false;
  if (k === 'd' || k === 'arrowright') moveState.d = false;
}

function onCanvasClick(e) {
  if (!raycaster || !camera) return;
  const canvas = renderer.domElement;
  const rect = canvas.getBoundingClientRect();

  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(treasures, false);

  if (hits.length > 0) {
    const orb = hits[0].object;
    if (!orb.userData.discovered) {
      orb.userData.discovered = true;

      // Show burst label
      showBurstLabel(
        orb.position.x,
        orb.position.y + 2,
        orb.position.z,
        orb.userData.title
      );

      // Show discovery panel after short delay
      setTimeout(() => {
        showDiscovery(orb.userData.title, orb.userData.description);
      }, 400);

      // Make treasure fade
      orb.material.emissiveIntensity = 0.1;
      orb.material.opacity = 0.6;
      orb.material.transparent = true;
    }
  }
}

function showBurstLabel(x, y, z, text) {
  const label = document.createElement('div');
  label.className = 'burst-label';
  label.textContent = text;
  document.body.appendChild(label);

  const vec = new window.THREE.Vector3(x, y, z);
  vec.project(camera);

  const sx = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-vec.y * 0.5 + 0.5) * window.innerHeight;

  label.style.left = sx + 'px';
  label.style.top = sy + 'px';

  setTimeout(() => label.remove(), 2000);
}

function showDiscovery(title, description) {
  if (!discoveryPanel || !discoveryTitle || !discoveryBody) return;
  discoveryTitle.textContent = title;
  discoveryBody.innerHTML = `<p>${description}</p>`;
  discoveryPanel.classList.remove('hidden');
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function stopGame() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('click', onCanvasClick);
  window.removeEventListener('resize', onResize);
  
  // Reset wreck message flag
  hasShownWreckMessage = false;
}

window.initGame = initGame;
window.stopGame = stopGame;