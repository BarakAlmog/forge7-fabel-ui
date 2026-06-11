/* ============================================================
   FORGE7 // the gate
   Chaos in, order out: a particle stream crosses the ring at
   x=0 and snaps from hot turbulence into a cool lattice.
   ============================================================ */
import * as THREE from "./vendor/three.module.min.js";

const HOT = new THREE.Color("#FF6A00");
const HOT2 = new THREE.Color("#FFB454");
const PHOS = new THREE.Color("#3DFFC0");
const CYAN = new THREE.Color("#71E6FF");

function softDotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createGateScene(canvas, { reduceMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    console.error("FORGE7 // WebGL unavailable - the gate stays closed. Falling back to static void.", err);
    canvas.style.display = "none";
    const hero = canvas.closest(".hero");
    if (hero) {
      hero.style.background =
        "radial-gradient(60% 50% at 50% 45%, rgba(61,255,192,0.12), transparent 70%)," +
        "radial-gradient(40% 40% at 30% 55%, rgba(255,106,0,0.08), transparent 70%)";
    }
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080a, 0.042);

  // Off-axis: the flow runs along X; viewed from (x,y,z) the ring reads
  // as a 3/4-perspective ellipse instead of an edge-on line.
  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 60);
  const CAM_BASE = { x: 5.4, y: 1.5, z: 7.0 };
  camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
  camera.lookAt(0, 0, 0);

  /* ---------- the gate ---------- */
  const gate = new THREE.Group();

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.035, 10, 140),
    new THREE.MeshBasicMaterial({ color: PHOS, transparent: true, opacity: 0.95 })
  );
  const ringOuter = new THREE.Mesh(
    new THREE.TorusGeometry(2.62, 0.011, 8, 140),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.4 })
  );
  const ringHeat = new THREE.Mesh(
    new THREE.TorusGeometry(2.16, 0.008, 8, 140),
    new THREE.MeshBasicMaterial({ color: HOT, transparent: true, opacity: 0.5 })
  );
  gate.add(ring, ringOuter, ringHeat);

  const tickGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
  const tickMat = new THREE.MeshBasicMaterial({ color: PHOS, transparent: true, opacity: 0.8 });
  for (let i = 0; i < 4; i++) {
    const tick = new THREE.Mesh(tickGeo, tickMat);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    tick.position.set(Math.cos(a) * 2.85, Math.sin(a) * 2.85, 0);
    tick.rotation.z = a + Math.PI / 2;
    gate.add(tick);
  }

  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softDotTexture(),
      color: PHOS,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.scale.set(8.5, 8.5, 1);
  gate.add(glow);

  gate.rotation.y = Math.PI / 2; // ring plane = YZ, flow axis = X
  scene.add(gate);

  /* ---------- the stream ---------- */
  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
  const COUNT = reduceMotion ? 1800 : isSmall ? 2800 : 7000;
  const X_MIN = -10.5;
  const X_MAX = 10.5;

  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const spd = new Float32Array(COUNT);
  const chaosY = new Float32Array(COUNT);
  const chaosZ = new Float32Array(COUNT);
  const laneY = new Float32Array(COUNT);
  const laneZ = new Float32Array(COUNT);
  const coolMix = new Float32Array(COUNT);

  function assignLanes(i) {
    laneY[i] = (Math.floor(Math.random() * 9) - 4) * 0.46;
    laneZ[i] = (Math.floor(Math.random() * 5) - 2) * 0.46;
    chaosY[i] = (Math.random() - 0.5) * 4.6;
    chaosZ[i] = (Math.random() - 0.5) * 3.0;
    seed[i] = Math.random() * Math.PI * 2;
    spd[i] = 1.5 + Math.random() * 1.3;
    coolMix[i] = Math.random();
  }

  for (let i = 0; i < COUNT; i++) {
    assignLanes(i);
    pos[i * 3] = X_MIN + Math.random() * (X_MAX - X_MIN);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.065,
    map: softDotTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ---------- state ---------- */
  const pointer = { x: 0, y: 0 };
  let scrollP = 0;
  let overdrive = false;
  let visible = true;
  let running = false;
  let rafId = 0;
  const clock = new THREE.Clock();
  const tmp = new THREE.Color();

  let portraitFactor = 1;
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // portrait: pull back so the ring frames the copy instead of crowding it
    portraitFactor = camera.aspect < 0.8 ? 1.45 : camera.aspect < 1.1 ? 1.2 : 1;
  }

  function step(dt, t) {
    const speedFactor = overdrive ? 3.1 : 1;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      let x = pos[ix] + spd[i] * speedFactor * dt;
      if (x > X_MAX) {
        x = X_MIN + Math.random() * 1.5;
        assignLanes(i);
      }

      const s = smoothstep(-2.4, 0.7, x);
      const swirlY =
        Math.sin(t * 1.35 + seed[i] + x * 0.75) * 1.05 +
        Math.sin(t * 2.4 + seed[i] * 2.1) * 0.32;
      const swirlZ =
        Math.cos(t * 1.15 + seed[i] * 1.7 + x * 0.55) * 0.78;

      const calmY = laneY[i] + Math.sin(t * 0.9 + seed[i] * 3) * 0.045;
      const calmZ = laneZ[i];

      pos[ix] = x;
      pos[ix + 1] = (chaosY[i] + swirlY) * (1 - s) + calmY * s;
      pos[ix + 2] = (chaosZ[i] + swirlZ) * (1 - s) + calmZ * s;

      // colour: hot → cool across the gate, flash at the ring
      const flick = 0.82 + 0.18 * Math.sin(t * 7 + seed[i] * 9);
      tmp.copy(HOT).lerp(HOT2, (Math.sin(seed[i] * 5) + 1) * 0.3);
      const cool = coolMix[i] > 0.7 ? CYAN : PHOS;
      tmp.lerp(cool, s);
      const gateGlow = Math.exp(-x * x * 1.6) * 0.85;
      const bright = (0.5 + 0.5 * flick) * (0.62 + gateGlow);
      col[ix] = tmp.r * bright;
      col[ix + 1] = tmp.g * bright;
      col[ix + 2] = tmp.b * bright;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;

    // gate pulse
    const pulse = 1 + Math.sin(t * 2.1) * 0.012;
    ring.scale.set(pulse, pulse, 1);
    ringHeat.rotation.z = t * 0.18;
    ringOuter.rotation.z = -t * 0.1;
    glow.material.opacity = 0.13 + Math.sin(t * 2.1) * 0.04 + (overdrive ? 0.1 : 0);

    // camera: parallax + scroll dolly along its own axis
    const dolly = (1 + scrollP * 0.3) * portraitFactor;
    const targetX = CAM_BASE.x * dolly + pointer.x * 0.9;
    const targetY = CAM_BASE.y * dolly - pointer.y * 0.5;
    const targetZ = CAM_BASE.z * dolly;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.lookAt(0, 0, 0);
  }

  function frame() {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    step(dt, clock.elapsedTime);
    renderer.render(scene, camera);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    clock.getDelta();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }
  function syncRunState() {
    if (visible && !document.hidden) start();
    else stop();
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncRunState);
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      syncRunState();
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  // first frame (also the only frame under reduced motion)
  step(0.016, 0.5);
  renderer.render(scene, camera);
  if (!reduceMotion) syncRunState();

  return {
    setPointer(nx, ny) {
      pointer.x = nx;
      pointer.y = ny;
    },
    setScroll(p) {
      scrollP = p;
      if (reduceMotion) {
        const dolly = (1 + p * 0.3) * portraitFactor;
        camera.position.set(CAM_BASE.x * dolly, CAM_BASE.y * dolly, CAM_BASE.z * dolly);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }
    },
    setOverdrive(on) {
      overdrive = on;
    },
  };
}
