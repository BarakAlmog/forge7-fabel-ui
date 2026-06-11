/* ============================================================
   FORGE7 // main orchestrator
   Boot → gate → live feed → telemetry. GSAP + one honest fleet.
   ============================================================ */
import { createGateScene } from "./gate.js";
import { initDrill } from "./drill.js";
import { SoundDeck } from "./sound.js";
import { initDrone } from "./drone.js";
import { initHaze } from "./haze.js";

document.documentElement.classList.add("js");
history.scrollRestoration = "manual";

if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
  document.documentElement.classList.remove("js");
  throw new Error("FORGE7 // GSAP failed to load. Page falls back to static mode.");
}
gsap.registerPlugin(ScrollTrigger);
if (typeof ScrambleTextPlugin !== "undefined") gsap.registerPlugin(ScrambleTextPlugin);

const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pad = (n, w) => String(n).padStart(w, "0");

const state = { overdrive: false, booted: false, heroOn: true };
const sound = new SoundDeck();

/* ------------------------------------------------------------
   Sound toggle (muted by default; a stored preference re-arms
   on the first gesture, which satisfies autoplay policy)
   ------------------------------------------------------------ */
function soundToggle() {
  const btn = $("#sndBtn");
  const apply = (on) => {
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "SND·ON" : "SND·OFF";
  };
  const enable = (on) => {
    sound.setEnabled(on);
    apply(on);
    if (on) {
      sound.blip();
      if (state.heroOn) sound.startHum();
    }
  };
  btn.addEventListener("click", () => enable(!sound.enabled));
  apply(false);
  if (SoundDeck.wantsSound()) {
    document.addEventListener("pointerdown", () => enable(true), { once: true });
  }
}

/* ------------------------------------------------------------
   Gate scene
   ------------------------------------------------------------ */
const gate = createGateScene($("#gateCanvas"), { reduceMotion: REDUCE });

if (gate) {
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    gate.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  });
}

/* ------------------------------------------------------------
   Hero flight: pin the hero and fly the camera through the gate.
   The copy follows the journey - chaos out, order in.
   ------------------------------------------------------------ */
function heroFlight() {
  const flow = $("#flowTag");
  const flightEls = $$("[data-flight]");

  // forge hum follows the gate on/off screen (motion preference agnostic)
  ScrollTrigger.create({
    trigger: ".hero",
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      state.heroOn = self.isActive;
      if (self.isActive) sound.startHum();
      else sound.stopHum();
    },
  });

  if (REDUCE) {
    if (gate) gate.setScroll(1);
    gsap.set(flightEls, { autoAlpha: 1, y: 0 });
    flow.textContent = "FLOW: NOMINAL";
    return;
  }

  let lastBucket = "";
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "+=140%",
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        if (gate) gate.setScroll(p);
        // kicker + hint are set directly from progress: scrub-rewind of
        // lazily-initialized tweens proved unreliable for these two
        if (state.booted) {
          gsap.set("#heroHint", { autoAlpha: Math.max(0, 1 - p / 0.08) });
          gsap.set(".hero__kicker", {
            autoAlpha: p < 0.34 ? 1 : Math.max(0.35, 1 - ((p - 0.34) / 0.2) * 0.65),
          });
        }
        const bucket =
          p < 0.45 ? "FLOW: INBOUND CHAOS" : p < 0.68 ? "CROSSING THE GATE…" : "FLOW: NOMINAL";
        if (bucket !== lastBucket) {
          lastBucket = bucket;
          flow.textContent = bucket;
        }
      },
    },
  });

  // NOTE: kicker/hint/chaos use explicit fromTo values - lazy capture would
  // record 0 if the playhead enters before the boot intro reveals them
  // (fast scrollers, deep links), making them rewind to invisible.
  tl.fromTo(
    ".line--order .line__in",
    { autoAlpha: 0.32 },
    { autoAlpha: 1, duration: 0.16, immediateRender: true, ease: "power1.in" },
    0.56
  )
    .fromTo(
      ".line--chaos .line__in",
      { xPercent: 0, autoAlpha: 1 },
      { xPercent: -12, autoAlpha: 0.08, duration: 0.32, ease: "power1.in", immediateRender: false },
      0.28
    )
    .to(".hero__sub", { autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" }, 0.72)
    .to(".hero__cta", { autoAlpha: 1, y: 0, duration: 0.13, ease: "power2.out" }, 0.79)
    .to(".tele", { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.87);
}

/* ------------------------------------------------------------
   Boot sequence
   ------------------------------------------------------------ */
function boot() {
  const overlay = $("#boot");
  const linesEl = $("#bootLines");
  const barEl = $("#bootBar");

  const SCRIPT = [
    { text: "FORGE7 OS v7.0.1 // AUTONOMOUS OPERATIONS", cls: "" },
    { text: "> mounting fleet ............... OK", cls: "dim", ok: true },
    { text: "> waking the machines .......... OK", cls: "dim", ok: true },
    { text: "> suppressing busywork ......... OK", cls: "dim", ok: true },
    { text: "> ONLINE.", cls: "" },
  ];

  function finish() {
    if (state.booted) return;
    state.booted = true;
    document.documentElement.style.overflow = "";
    if (REDUCE) {
      overlay.remove();
      heroIntro(true);
      return;
    }
    gsap.to(overlay, {
      yPercent: -100,
      duration: 0.7,
      ease: "power4.inOut",
      onComplete: () => overlay.remove(),
    });
    overlay.classList.add("is-done");
    heroIntro(false);
  }

  if (REDUCE) {
    finish();
    return;
  }

  document.documentElement.style.overflow = "hidden";
  overlay.addEventListener("click", finish, { once: false });

  let li = 0;
  function typeLine() {
    if (state.booted) return;
    if (li >= SCRIPT.length) {
      setTimeout(finish, 260);
      return;
    }
    const line = SCRIPT[li];
    const node = document.createElement("span");
    if (line.cls) node.className = line.cls;
    linesEl.appendChild(node);
    linesEl.appendChild(document.createTextNode("\n"));
    let ci = 0;
    const iv = setInterval(() => {
      if (state.booted) { clearInterval(iv); return; }
      ci += randInt(2, 4);
      let shown = line.text.slice(0, ci);
      if (line.ok && ci >= line.text.length) {
        node.innerHTML = line.text.replace(/OK$/, '<span class="ok">OK</span>');
      } else {
        node.textContent = shown;
      }
      if (ci >= line.text.length) {
        clearInterval(iv);
        li += 1;
        setTimeout(typeLine, 70);
      }
    }, 14);
  }
  typeLine();
  gsap.to(barEl, { scaleX: 1, duration: 1.45, ease: "power2.inOut" });
  setTimeout(finish, 2600); // hard ceiling - boot never holds the page hostage
}

/* ------------------------------------------------------------
   Hero intro
   ------------------------------------------------------------ */
function heroIntro(instant) {
  const lines = $$(".hero__title .line__in");
  const reveals = $$("[data-boot-reveal]");
  if (instant) {
    gsap.set(lines, { yPercent: 0 });
    gsap.set(reveals, { autoAlpha: 1, y: 0 });
    return;
  }
  gsap.set(lines, { yPercent: 110 });
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.to(lines, { yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.12 }, 0.1)
    .to(reveals, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.45);
}
gsap.set($$(".hero__title .line__in"), { yPercent: 110 });

/* ------------------------------------------------------------
   UTC clock
   ------------------------------------------------------------ */
function clockUTC() {
  const el = $("#utcClock");
  const tick = () => {
    const d = new Date();
    el.innerHTML =
      `${pad(d.getUTCHours(), 2)}:${pad(d.getUTCMinutes(), 2)}:${pad(d.getUTCSeconds(), 2)}<i>UTC</i>`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ------------------------------------------------------------
   Telemetry counters (simulated, plausibly alive)
   ------------------------------------------------------------ */
function telemetry() {
  const heroTasks = $("#heroTasks");
  let heroCount = 0;
  function bumpHero() {
    heroCount += state.overdrive ? randInt(2, 5) : 1;
    heroTasks.textContent = String(heroCount);
    setTimeout(bumpHero, state.overdrive ? rand(280, 700) : rand(1400, 3400));
  }
  setTimeout(bumpHero, 1200);

  const tasksEl = $("#mTasksToday");
  const d = new Date();
  let tasksToday = Math.floor((d.getHours() * 60 + d.getMinutes()) * 4.7 + randInt(0, 120));
  const renderTasks = () => (tasksEl.textContent = tasksToday.toLocaleString("en-US"));
  renderTasks();
  function bumpTasks() {
    tasksToday += state.overdrive ? randInt(6, 18) : randInt(1, 4);
    renderTasks();
    setTimeout(bumpTasks, state.overdrive ? rand(300, 700) : rand(1500, 3200));
  }
  setTimeout(bumpTasks, 2000);

  const hoursEl = $("#mHours");
  let hours = 1287 + d.getDay() * 41;
  const renderHours = () => (hoursEl.textContent = hours.toLocaleString("en-US"));
  renderHours();
  setInterval(() => {
    hours += 1;
    renderHours();
  }, 41000);
}

/* ------------------------------------------------------------
   Live ops feed
   ------------------------------------------------------------ */
function opsFeed() {
  const feed = $("#opsFeed");
  const queueEl = $("#queueDepth");
  const cycleEl = $("#cycleTime");
  const MAX_LINES = 12;
  let visible = true;

  const POOL = [
    ["ING-09", "invoice batch ingested", "47 records → ERP ✓"],
    ["ING-04", "PO matched against receipt", "Δ 0.00 ✓"],
    ["ING-09", "hostile PDF subdued", "schema v11 applied ✓"],
    ["CHS-02", "signature secured", "letter #2291 countersigned ✓"],
    ["CHS-02", "chase cycle complete", "reply detected, tone: sheepish ✓"],
    ["SYN-12", "weekly report synthesized", "6 sources reconciled ✓"],
    ["SYN-12", "anomaly annotated", "margin drift flagged for humans ✓"],
    ["TRI-07", "inbox triaged", "38 routed · 11 drafted ✓"],
    ["TRI-07", "escalation routed", "to the right human, first try ✓"],
    ["CRM-11", "lead enriched", "23 fields populated ✓"],
    ["PAY-05", "payroll prep verified", "0 anomalies ✓"],
    ["REC-03", "stock reconciled", "3 warehouses agree ✓"],
    ["FLEET", "human intervention check", "not required ✓"],
  ];

  const now = () => {
    const d = new Date();
    return `${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}`;
  };

  function push(sys, act, res, warn = false) {
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="t">[${now()}]</span>` +
      `<span class="fsys">${sys}</span>` +
      `<span class="body"><span class="act">${act}</span> ` +
      `<span class="res${warn ? " res--warn" : ""}">${res}</span></span>` +
      `<span class="ms">${rand(0.3, 3.9).toFixed(1)}s</span>`;
    feed.appendChild(li);
    while (feed.children.length > MAX_LINES) feed.removeChild(feed.firstChild);
    if (!REDUCE) {
      gsap.from(li, { autoAlpha: 0, y: 8, duration: 0.35, ease: "power2.out" });
    }
    if (visible) sound.blip();
  }

  let pendingRetry = null;
  function cycle() {
    if (visible) {
      if (pendingRetry) {
        push(pendingRetry[0], pendingRetry[1], "recovered on retry ✓");
        pendingRetry = null;
      } else if (Math.random() < 0.07) {
        const p = POOL[randInt(0, POOL.length - 1)];
        push(p[0], p[1], "⟳ RETRY 1/3 · upstream timeout", true);
        pendingRetry = p;
      } else {
        const p = POOL[randInt(0, POOL.length - 1)];
        push(p[0], p[1], p[2]);
      }
      queueEl.textContent = pad(randInt(3, 14), 2);
      cycleEl.textContent = `${rand(1.2, 2.6).toFixed(1)}s`;
    }
    setTimeout(cycle, state.overdrive ? rand(220, 480) : rand(950, 1900));
  }

  // seed a few lines so the console never looks empty
  for (let i = 0; i < 5; i++) {
    const p = POOL[randInt(0, POOL.length - 1)];
    push(p[0], p[1], p[2]);
  }
  cycle();

  new IntersectionObserver((entries) => (visible = entries[0].isIntersecting), { threshold: 0 })
    .observe(feed);

  // other modules (the training drill) can report into the fleet feed
  document.addEventListener("forge7:feedline", (e) => {
    const { sys, act, res } = e.detail;
    push(sys, act, res);
  });
}

/* ------------------------------------------------------------
   Scroll reveals
   ------------------------------------------------------------ */
function reveals() {
  $$("[data-reveal]").forEach((el) => {
    if (REDUCE) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // module names decode themselves as they arrive
  if (!REDUCE && typeof ScrambleTextPlugin !== "undefined") {
    $$(".mod__name").forEach((el) => {
      const original = el.textContent;
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(el, {
            duration: 1.1,
            scrambleText: { text: original, chars: "▮▯/\\_0147", speed: 0.4 },
          }),
      });
    });
  }
}

/* ------------------------------------------------------------
   Module 03: protocol rail
   ------------------------------------------------------------ */
function protocol() {
  const num = $("#protoNum");
  const arc = $("#protoArc");
  const cards = $$(".proto-card");
  const ARC_LEN = 326.7;

  function setPhase(idx) {
    const phase = pad(idx + 1, 2);
    if (num.textContent === phase) return;
    num.textContent = phase;
    if (!REDUCE) {
      gsap.fromTo(num, { yPercent: 24, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" });
    }
    gsap.to(arc, {
      strokeDashoffset: ARC_LEN * (1 - (idx + 1) / 7),
      duration: REDUCE ? 0 : 0.5,
      ease: "power2.inOut",
    });
  }

  cards.forEach((card, idx) => {
    ScrollTrigger.create({
      trigger: card,
      start: "top 55%",
      end: "bottom 55%",
      onEnter: () => { card.classList.add("is-active"); setPhase(idx); },
      onEnterBack: () => { card.classList.add("is-active"); setPhase(idx); },
      onLeave: () => card.classList.remove("is-active"),
      onLeaveBack: () => card.classList.remove("is-active"),
    });
  });
}

/* ------------------------------------------------------------
   Module 04 + 05: count-ups and clause checks
   ------------------------------------------------------------ */
function counters() {
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    if (Number.isNaN(target)) throw new Error(`FORGE7 // bad data-count on ${el.outerHTML}`);
    if (REDUCE) {
      el.textContent = String(target);
      return;
    }
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.4,
      ease: "power2.out",
      snap: { v: 1 },
      onUpdate: () => (el.textContent = String(Math.round(obj.v))),
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

function clauses() {
  $$(".clause").forEach((row, i) => {
    ScrollTrigger.create({
      trigger: row,
      start: "top 82%",
      once: true,
      onEnter: () => setTimeout(() => row.classList.add("is-checked"), i * 60),
    });
  });
}

/* ------------------------------------------------------------
   Module 06: access form
   ------------------------------------------------------------ */
function accessForm() {
  const form = $("#accessForm");
  const sess = `SESS-${pad(randInt(100, 9999), 4)}`;
  $("#sessId").textContent = sess;
  $("#sessEcho").textContent = sess;

  const error = $("#accessError");
  const done = $("#accessDone");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#fName").value.trim();
    const email = $("#fChannel").value.trim();
    const chore = $("#fChore").value.trim();
    const hours = $("#fHours").value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !chore || !hours) {
      error.hidden = false;
      if (!REDUCE) {
        gsap.fromTo("#transmitBtn", { x: -5 }, { x: 0, duration: 0.4, ease: "elastic.out(1.8, 0.2)", clearProps: "x" });
      }
      return;
    }

    error.hidden = true;
    form.classList.add("is-sent");
    $("#transmitBtn").disabled = true;
    sound.thud();
    sound.win();
    done.hidden = false;
    if (!REDUCE) {
      gsap.from(done, { autoAlpha: 0, y: 14, duration: 0.6, ease: "power3.out" });
    }
    done.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "nearest" });
  });
}

/* ------------------------------------------------------------
   Footer: heat-haze canvas drives the fill sweep; the DOM
   clip-path version stays as the fallback when canvas is out
   ------------------------------------------------------------ */
function footerFill() {
  const haze = initHaze({ reduceMotion: REDUCE });
  if (haze) {
    ScrollTrigger.create({
      trigger: ".foot__shout",
      start: "top 85%",
      end: "top 30%",
      scrub: REDUCE ? false : 0.5,
      onUpdate: (self) => haze.setProgress(self.progress),
    });
    return;
  }
  gsap.to(".foot__fill", {
    clipPath: "inset(0 0% 0 0)",
    ease: "none",
    scrollTrigger: {
      trigger: ".foot__shout",
      start: "top 85%",
      end: "top 30%",
      scrub: REDUCE ? false : 0.5,
    },
  });
}

/* ------------------------------------------------------------
   Overdrive: press 7
   ------------------------------------------------------------ */
function overdrive() {
  const banner = $("#ovrBanner");
  const count = $("#ovrCount");
  let timer = null;

  function engage() {
    if (state.overdrive) return;
    state.overdrive = true;
    document.body.classList.add("is-overdrive");
    if (gate) gate.setOverdrive(true);
    sound.sweep();
    gsap.to(banner, { autoAlpha: 1, y: -80, duration: 0.4, ease: "back.out(1.6)" });

    let remaining = 10;
    count.textContent = String(remaining);
    timer = setInterval(() => {
      remaining -= 1;
      count.textContent = String(remaining);
      if (remaining <= 0) disengage();
    }, 1000);
  }

  function disengage() {
    clearInterval(timer);
    state.overdrive = false;
    document.body.classList.remove("is-overdrive");
    if (gate) gate.setOverdrive(false);
    gsap.to(banner, { autoAlpha: 0, y: 0, duration: 0.4, ease: "power2.in" });
  }

  gsap.set(banner, { autoAlpha: 0, y: 0 });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "7") return;
    const tag = document.activeElement ? document.activeElement.tagName : "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    engage();
  });
}

/* ------------------------------------------------------------
   Anchors, coords, furniture
   ------------------------------------------------------------ */
function anchors() {
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (id === "#") return;
      const target = $(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });
}

function coordsReadout() {
  const el = $("#coordsRead");
  let queued = false;
  window.addEventListener("pointermove", (e) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      el.textContent = `CUR X:${pad(Math.round(e.clientX), 4)} Y:${pad(Math.round(e.clientY), 4)}`;
      queued = false;
    });
  });
}

function furniture() {
  const baseTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "SYSTEMS STILL RUNNING // FORGE7" : baseTitle;
  });

  console.log(
    "%cFORGE7 // AUTONOMOUS OPERATIONS%c\n\n" +
      "┌─────────────────────────────────────┐\n" +
      "│  CHAOS IN.            ORDER OUT.    │\n" +
      "│  ▓▓▒▒░░  ──▶  ◯  ──▶  ║║║║║║║║      │\n" +
      "└─────────────────────────────────────┘\n\n" +
      "You opened the hood. Naturally.\n" +
      "Vanilla JS, GSAP, Three.js, one honest particle field.\n" +
      "Press [7] for overdrive. Request access at MODULE 06.\n",
    "font-family: monospace; font-size: 14px; font-weight: 700; color: #3DFFC0;",
    "font-family: monospace; font-size: 11px; color: #7E948C;"
  );
}

/* ------------------------------------------------------------
   Ignite
   ------------------------------------------------------------ */
boot();
clockUTC();
telemetry();
opsFeed();
reveals();
heroFlight();
protocol();
counters();
clauses();
accessForm();
footerFill();
overdrive();
anchors();
coordsReadout();
furniture();
soundToggle();

const feedline = (sys, act, res) =>
  document.dispatchEvent(new CustomEvent("forge7:feedline", { detail: { sys, act, res } }));

const drill = initDrill({
  reduceMotion: REDUCE,
  onFeedLine: feedline,
  audio: {
    tick: () => sound.tick(),
    clink: () => sound.clink(),
    thud: () => sound.thud(),
    win: () => sound.win(),
  },
});
window.__forge7Drill = drill; // console tinkerers welcome

initDrone({ reduceMotion: REDUCE, onFeedLine: feedline });

window.addEventListener("load", () => {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
});
