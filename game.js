// mystical island adventure with ANCIENT WRECK
(function () {
  if (typeof window.THREE === 'undefined') {
    console.warn('THREE not loaded yet. game.js may be running too early.');
    return;
  }

  let scene, camera, renderer;
  let player, floor;
  const objects = [];
  let animationFrameId = null;

  // Movement
  const keys = {};
  const moveSpeed = 0.12;

  // Mouse raycast
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Discovery data
  const discoveries = {
    torch: {
      title: "🔥 The Eternal Flame",
      body: `<p>A torch that has burned for centuries, left by ancient travelers who once sought Samuel's wisdom.</p>
             <p><strong>Legend says:</strong> Those who find this flame are blessed with clarity in their code.</p>`
    },
    crystal: {
      title: "💎 Crystal of Knowledge",
      body: `<p>This mystical crystal contains fragments of Samuel's greatest projects, preserved in pure energy.</p>
             <ul>
               <li><strong>ML Mastery:</strong> Neural networks that learn and adapt</li>
               <li><strong>System Architecture:</strong> Scalable solutions for complex problems</li>
               <li><strong>DevOps Excellence:</strong> Automated pipelines that just work</li>
             </ul>`
    },
    scroll: {
      title: "📜 Ancient Scroll of Contact",
      body: `<p>An enchanted parchment that allows communication across dimensions.</p>
             <p><strong>To summon Samuel:</strong><br/>
             Email: <a href="mailto:sapoya26@colby.edu">sapoya26@colby.edu</a></p>
             <p>Speak your message, and it shall reach him wherever he may be in the digital realm.</p>`
    },
    wreck: {
      title: "🏚️ Samuel's Ancient Workshop",
      body: `<p>Within these crumbling walls, Samuel once crafted legendary systems. The air still hums with residual data energy.</p>
             <p><strong>Discovered artifacts:</strong></p>
             <ul>
               <li>Fragments of the First Algorithm</li>
               <li>Blueprints for Reality-Bending Code</li>
               <li>A terminal that still glows faintly...</li>
             </ul>
             <p><em>"Those who enter shall know the weight of ancient knowledge."</em></p>`
    }
  };

  const discovered = new Set();

  // Track wreck proximity for one-time trigger
  let hasTriggeredWreckWarning = false;
  const WRECK_WARNING_DISTANCE = 8;

  window.initGame = function () {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 60);

    // Camera
    camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    dirLight.position.set(20, 30, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    scene.add(dirLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x3d5a4f,
      roughness: 0.9 
    });
    floor = new THREE.Mesh(groundGeo, groundMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Player avatar
    const playerGroup = new THREE.Group();
    
    const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    playerGroup.add(body);

    const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 1.0;
    head.castShadow = true;
    playerGroup.add(head);

    playerGroup.position.set(0, 1.2, 15);
    scene.add(playerGroup);
    player = playerGroup;

    camera.position.set(0, 8, 20);
    camera.lookAt(player.position);

    // Create mystical objects
    createTreasures();
    
    // Create the ANCIENT WRECK
    createAncientWreck();

    // Events
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('click', onCanvasClick, false);
    window.addEventListener('resize', onWindowResize, false);

    animate();
  };

  function createTreasures() {
    // Torch
    const torchGroup = new THREE.Group();
    const stickGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.castShadow = true;
    torchGroup.add(stick);

    const flameGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 1
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 1.3;
    torchGroup.add(flame);

    const torchLight = new THREE.PointLight(0xff6600, 1.5, 10);
    torchLight.position.y = 1.3;
    torchGroup.add(torchLight);

    torchGroup.position.set(-8, 1, 5);
    scene.add(torchGroup);
    objects.push({ mesh: torchGroup, key: 'torch', label: '🔥 Torch' });

    // Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.8, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(10, 1.2, -6);
    crystal.castShadow = true;
    scene.add(crystal);

    const crystalLight = new THREE.PointLight(0x00ffff, 1, 8);
    crystalLight.position.copy(crystal.position);
    scene.add(crystalLight);

    objects.push({ mesh: crystal, key: 'crystal', label: '💎 Crystal' });

    // Scroll
    const scrollGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 12);
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0xf4e8c1 });
    const scroll = new THREE.Mesh(scrollGeo, scrollMat);
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(0, 0.8, -12);
    scroll.castShadow = true;
    scene.add(scroll);

    objects.push({ mesh: scroll, key: 'scroll', label: '📜 Scroll' });
  }

  function createAncientWreck() {
    const wreckGroup = new THREE.Group();
    
    // Floor of wreck
    const baseGeo = new THREE.BoxGeometry(6, 0.3, 5);
    const stoneMat = new THREE.MeshStandardMaterial({ 
      color: 0x4a4a4a,
      roughness: 0.95 
    });
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.15;
    base.castShadow = true;
    base.receiveShadow = true;
    wreckGroup.add(base);

    // Crumbling walls
    const wallMat = new THREE.MeshStandardMaterial({ 
      color: 0x5a5a5a,
      roughness: 0.9 
    });

    // Back wall
    const backWallGeo = new THREE.BoxGeometry(6, 3.5, 0.4);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 1.75, -2.3);
    backWall.castShadow = true;
    wreckGroup.add(backWall);

    // Left wall
    const leftWallGeo = new THREE.BoxGeometry(0.4, 2.5, 4);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-2.8, 1.25, -0.3);
    leftWall.castShadow = true;
    wreckGroup.add(leftWall);

    // Right wall
    const rightWallGeo = new THREE.BoxGeometry(0.4, 1.8, 3);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(2.8, 0.9, -0.3);
    rightWall.rotation.z = 0.1;
    rightWall.castShadow = true;
    wreckGroup.add(rightWall);

    // Broken roof pieces
    const roofPiece1Geo = new THREE.BoxGeometry(3, 0.3, 2.5);
    const roofPiece1 = new THREE.Mesh(roofPiece1Geo, wallMat);
    roofPiece1.position.set(-1.2, 3.2, -1);
    roofPiece1.rotation.z = 0.15;
    roofPiece1.castShadow = true;
    wreckGroup.add(roofPiece1);

    const roofPiece2Geo = new THREE.BoxGeometry(2, 0.3, 2);
    const roofPiece2 = new THREE.Mesh(roofPiece2Geo, wallMat);
    roofPiece2.position.set(1.5, 2.8, -0.5);
    roofPiece2.rotation.z = -0.2;
    roofPiece2.castShadow = true;
    wreckGroup.add(roofPiece2);

    // Ancient glowing symbol on back wall
    const symbolGeo = new THREE.CircleGeometry(0.6, 16);
    const symbolMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.6
    });
    const symbol = new THREE.Mesh(symbolGeo, symbolMat);
    symbol.position.set(0, 2, -2.09);
    wreckGroup.add(symbol);

    // Light inside
    const wreckLight = new THREE.PointLight(0x00ff88, 0.8, 12);
    wreckLight.position.set(0, 2, -1);
    wreckGroup.add(wreckLight);

    // Position the wreck
    wreckGroup.position.set(-15, 0, -8);
    scene.add(wreckGroup);

    // Add to interactable objects
    objects.push({ mesh: wreckGroup, key: 'wreck', label: 'Ancient Wreck' });
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    handleMovement();
    checkWreckProximity();
    animateTreasures();

    renderer.render(scene, camera);
  }

  function handleMovement() {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (keys['w'] || keys['arrowup']) {
      player.position.addScaledVector(forward, moveSpeed);
    }
    if (keys['s'] || keys['arrowdown']) {
      player.position.addScaledVector(forward, -moveSpeed);
    }
    if (keys['a'] || keys['arrowleft']) {
      player.position.addScaledVector(right, -moveSpeed);
    }
    if (keys['d'] || keys['arrowright']) {
      player.position.addScaledVector(right, moveSpeed);
    }

    // Camera follows
    const offset = new THREE.Vector3(0, 8, 12);
    const desiredPos = player.position.clone().add(offset);
    camera.position.lerp(desiredPos, 0.1);
    camera.lookAt(player.position);
  }

  function checkWreckProximity() {
    if (hasTriggeredWreckWarning) return;

    // Find the wreck object
    const wreckObj = objects.find(o => o.key === 'wreck');
    if (!wreckObj) return;

    const distance = player.position.distanceTo(wreckObj.mesh.position);
    
    if (distance < WRECK_WARNING_DISTANCE) {
      hasTriggeredWreckWarning = true;
      showBurstLabel("Samuel's presence lingers here... ancient and watching", wreckObj.mesh);
    }
  }

  function animateTreasures() {
    objects.forEach((obj) => {
      if (obj.key === 'crystal') {
        obj.mesh.rotation.y += 0.01;
        obj.mesh.position.y = 1.2 + Math.sin(Date.now() * 0.002) * 0.2;
      }
      if (obj.key === 'torch') {
        const flame = obj.mesh.children.find(c => c.geometry.type === 'ConeGeometry');
        if (flame) {
          flame.scale.y = 1 + Math.sin(Date.now() * 0.008) * 0.15;
        }
      }
    });
  }

  function onCanvasClick(event) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes = objects.map(o => o.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const obj = objects.find(o => 
        o.mesh === clickedMesh || o.mesh === clickedMesh.parent || o.mesh === clickedMesh.parent?.parent
      );

      if (obj && !discovered.has(obj.key)) {
        discovered.add(obj.key);
        showBurstLabel(obj.label, obj.mesh);
        setTimeout(() => showDiscovery(obj.key), 800);
      }
    }
  }

  function showBurstLabel(text, mesh) {
    const label = document.createElement('div');
    label.className = 'burst-label';
    label.textContent = text;
    document.body.appendChild(label);

    const vector = mesh.position.clone();
    vector.project(camera);

    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

    label.style.left = x + 'px';
    label.style.top = y + 'px';

    setTimeout(() => label.remove(), 2000);
  }

  function showDiscovery(key) {
    const panel = document.getElementById('discovery-panel');
    const title = document.getElementById('discovery-title');
    const body = document.getElementById('discovery-body');

    if (!panel || !title || !body) return;

    const data = discoveries[key];
    if (!data) return;

    title.textContent = data.title;
    body.innerHTML = data.body;

    panel.classList.remove('hidden');

    const closeBtn = document.querySelector('.close-discovery');
    if (closeBtn) {
      closeBtn.onclick = () => panel.classList.add('hidden');
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  window.stopGame = function () {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };
})();