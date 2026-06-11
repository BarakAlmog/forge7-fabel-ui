/* ============================================================
   FORGE7 // the gate
   Chaos in, order out: a particle stream crosses the ring at
   x=0 and snaps from hot turbulence into a cool lattice.
   Scroll flies the camera straight through the ring, with an
   UnrealBloom flash at the crossing.
   ============================================================ */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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

  const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.4 : 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080a, 0.042);

  // Off-axis: the flow runs along X; viewed from (x,y,z) the ring reads
  // as a 3/4-perspective ellipse instead of an edge-on line.
  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 60);
  const CAM_BASE = { x: 5.4, y: 1.5, z: 7.0 };

  // Scroll flight: chaos side → through the ring → settle on the order side.
  const FLIGHT = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-8.4, 1.2, 5.8),
      new THREE.Vector3(-4.8, 0.6, 3.4),
      new THREE.Vector3(-1.7, 0.4, 2.2),
      new THREE.Vector3(0.7, 0.55, 2.0), // skim the ring's edge, keep it in frame
      new THREE.Vector3(3.0, 1.0, 4.2),
      new THREE.Vector3(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z),
    ],
    false,
    "centripetal"
  );
  const CROSS_P = 0.58; // flight progress where the camera pierces the ring
  const ORIGIN = new THREE.Vector3(0, 0, 0);
  const camPos = new THREE.Vector3();
  const camAhead = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  camera.position.copy(FLIGHT.getPoint(0));
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
    laneY[i] = (Math.floor(Math.random() * 9) - 4) * 0.5;
    laneZ[i] = (Math.floor(Math.random() * 7) - 3) * 0.5;
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
    size: 0.055,
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

  /* ---------- post: bloom, kept on a tight leash ----------
     High threshold so only the ring and the hottest particles
     glow; everything else stays crisp phosphor-on-void. */
  const BLOOM_BASE = isSmallScreen ? 0.26 : 0.32;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth || 1, canvas.clientHeight || 1),
    BLOOM_BASE, // strength
    0.32, // radius
    0.42 // threshold
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  /* ---------- state ---------- */
  const pointer = { x: 0, y: 0 };
  let scrollP = 0;
  let overdrive = false;
  let visible = true;
  let running = false;
  let rafId = 0;
  let lastFrameAt = 0;
  let elapsed = 0;
  const tmp = new THREE.Color();

  let portraitFactor = 1;
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // portrait: pull back so the ring frames the copy instead of crowding it
    portraitFactor = camera.aspect < 0.8 ? 1.45 : camera.aspect < 1.1 ? 1.2 : 1;
  }

  // Position + aim the camera for flight progress p. `smooth` lerps the
  // pointer-parallax so the flight itself stays locked on rails.
  function placeCamera(p, smooth) {
    FLIGHT.getPoint(p, camPos);
    // portrait pull-back fades in as the flight settles
    const pf = 1 + (portraitFactor - 1) * p;
    camPos.multiplyScalar(pf);
    const parallaxAmt = 0.25 + 0.75 * p;
    camPos.x += pointer.x * 0.9 * parallaxAmt;
    camPos.y += -pointer.y * 0.5 * parallaxAmt;
    if (smooth > 0) camera.position.lerp(camPos, Math.min(1, smooth * 60 * 0.016 * 4));
    else camera.position.copy(camPos);

    FLIGHT.getPoint(Math.min(0.97, p + 0.1), camAhead);
    const w = smoothstep(0.5, 0.82, p);
    camTarget.copy(camAhead).lerp(ORIGIN, w);
    camera.lookAt(camTarget);
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

      // colour: hot → cool across the gate, lifted near the ring
      const flick = 0.82 + 0.18 * Math.sin(t * 7 + seed[i] * 9);
      tmp.copy(HOT).lerp(HOT2, (Math.sin(seed[i] * 5) + 1) * 0.3);
      const cool = coolMix[i] > 0.7 ? CYAN : PHOS;
      tmp.lerp(cool, s);
      const gateGlow = Math.exp(-x * x * 1.6) * 0.45;
      // particles right in front of the lens dim out instead of ballooning
      const ddx = pos[ix] - camera.position.x;
      const ddy = pos[ix + 1] - camera.position.y;
      const ddz = pos[ix + 2] - camera.position.z;
      const nearFade = smoothstep(0.35, 1.8, Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz));
      const bright = (0.5 + 0.5 * flick) * (0.58 + gateGlow) * nearFade;
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

    // crossing flash: a wink, not a flashbang
    const crossGlow = Math.exp(-((scrollP - CROSS_P) ** 2) / (2 * 0.045 ** 2));
    // the glow sprite is a billboard - fade it out as the camera closes in,
    // otherwise it washes the whole frame mid-flight
    const camDist = camera.position.length();
    const spriteFade = smoothstep(2.2, 4.8, camDist);
    glow.material.opacity =
      (0.1 + Math.sin(t * 2.1) * 0.03 + (overdrive ? 0.06 : 0) + crossGlow * 0.1) * spriteFade;
    bloomPass.strength = (overdrive ? BLOOM_BASE + 0.22 : BLOOM_BASE) + crossGlow * 0.5;

    // camera: fly the curve, look slightly ahead, hand over to the
    // origin-framed composition once we're through
    placeCamera(scrollP, 0.06);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min((now - lastFrameAt) / 1000, 0.05);
    lastFrameAt = now;
    elapsed += dt;
    step(dt, elapsed);
    composer.render();
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    lastFrameAt = performance.now();
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
  composer.render();
  if (!reduceMotion) syncRunState();

  return {
    setPointer(nx, ny) {
      pointer.x = nx;
      pointer.y = ny;
    },
    setScroll(p) {
      scrollP = p;
      if (reduceMotion) {
        placeCamera(p, 0);
        composer.render();
      }
    },
    setOverdrive(on) {
      overdrive = on;
    },
  };
}
