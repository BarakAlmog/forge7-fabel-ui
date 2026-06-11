/* ============================================================
   FORGE7 // MANUAL MODE (whack-a-task)
   Your week, compressed: tasks pop out of the floor, you put
   them down. 45 seconds. Mind the coffee - a human is holding
   it. Then FLEET MODE plays the same week without you.
   ============================================================ */
"use strict";

const $ = (sel, ctx = document) => ctx.querySelector(sel);

/* ---------------- the cast ---------------- */
const ART = {
  invoice: `<svg viewBox='0 0 64 64' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <path d='M16 8 H40 L50 18 V54 a3 3 0 0 1 -3 3 H19 a3 3 0 0 1 -3 -3 Z' stroke='currentColor' stroke-width='2.5'/>
    <path d='M40 8 V18 H50' stroke='currentColor' stroke-width='2.5'/>
    <path d='M22 25 H38 M22 31 H42' stroke='currentColor' stroke-width='2' opacity='.5'/>
    <circle cx='23.5' cy='40' r='2.3' fill='currentColor'/>
    <circle cx='32.5' cy='40' r='2.3' fill='currentColor'/>
    <path d='M19 34 l7 3 M37 37 l7 -3' stroke='currentColor' stroke-width='2.4'/>
    <path d='M24 49 q4 -3.5 8 0' stroke='currentColor' stroke-width='2.2'/>
    <circle cx='43' cy='48' r='6' stroke='currentColor' stroke-width='2'/>
    <path d='M43 44.6 v6.8 M45 46 q-2 -1.4 -3.6 0 q-1.4 1.6 .4 2.2 q2.4 .6 2.8 2 q.3 1.6 -2 1.6 q-1.6 0 -2.4 -1' stroke='currentColor' stroke-width='1.5'/>
  </svg>`,
  email: `<svg viewBox='0 0 64 64' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <rect x='8' y='16' width='48' height='32' rx='3' stroke='currentColor' stroke-width='2.5'/>
    <path d='M9 18 L32 36 L55 18' stroke='currentColor' stroke-width='2.5'/>
    <circle cx='25' cy='41' r='3.4' stroke='currentColor' stroke-width='2'/>
    <circle cx='39' cy='41' r='3.4' stroke='currentColor' stroke-width='2'/>
    <circle cx='25.8' cy='42' r='1.3' fill='currentColor'/>
    <circle cx='39.8' cy='42' r='1.3' fill='currentColor'/>
    <path d='M21 34 q4 -3 8 -1.5 M35 32.5 q4 -1.5 8 1.5' stroke='currentColor' stroke-width='2'/>
    <rect x='10' y='8' width='18' height='9' rx='2' fill='currentColor' opacity='.85'/>
    <path d='M13 11 h5 M13 14 h9' stroke='#04130D' stroke-width='1.6'/>
  </svg>`,
  bug: `<svg viewBox='0 0 64 64' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <ellipse cx='32' cy='38' rx='13' ry='10' stroke='currentColor' stroke-width='2.5'/>
    <circle cx='32' cy='21' r='7' stroke='currentColor' stroke-width='2.5'/>
    <path d='M29 15 q-3 -5 -8 -6 M35 15 q3 -5 8 -6' stroke='currentColor' stroke-width='2'/>
    <circle cx='20.6' cy='8.6' r='1.6' fill='currentColor'/>
    <circle cx='43.4' cy='8.6' r='1.6' fill='currentColor'/>
    <path d='M32 29 V47 M20 33 l-8 -4 M19 39 h-9 M21 45 l-8 5 M44 33 l8 -4 M45 39 h9 M43 45 l8 5' stroke='currentColor' stroke-width='2'/>
    <circle cx='29.6' cy='20' r='1.9' fill='currentColor'/>
    <circle cx='35.6' cy='20' r='1.9' fill='currentColor'/>
    <path d='M29 25 l2 1.6 2 -1.6' stroke='currentColor' stroke-width='1.8'/>
  </svg>`,
  report: `<svg viewBox='0 0 64 64' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <rect x='14' y='9' width='36' height='47' rx='2.5' stroke='currentColor' stroke-width='2.5'/>
    <path d='M22 9 V56' stroke='currentColor' stroke-width='2'/>
    <path d='M14 20 H50 M14 28 H50' stroke='currentColor' stroke-width='2' opacity='.6'/>
    <path d='M28 15 h14' stroke='currentColor' stroke-width='2' opacity='.5'/>
    <path d='M28 41 q3 2.4 6 0 M38 41 q3 2.4 6 0' stroke='currentColor' stroke-width='2.2'/>
    <path d='M27 38.5 h7 M37 38.5 h7' stroke='currentColor' stroke-width='1.6' opacity='.7'/>
    <path d='M33 50 h7' stroke='currentColor' stroke-width='2.2'/>
    <path d='M55 12 q4.5 6.5 0 9 q-3.5 -2.5 0 -9' stroke='currentColor' stroke-width='1.8'/>
  </svg>`,
  mug: `<svg viewBox='0 0 64 64' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <path d='M18 26 h25 v20 a6 6 0 0 1 -6 6 h-13 a6 6 0 0 1 -6 -6 Z' stroke='currentColor' stroke-width='2.5'/>
    <path d='M43 30 c8.5 -1 8.5 13 -.5 11' stroke='currentColor' stroke-width='2.5'/>
    <path d='M24 19 q2.5 -4 0 -8 M33 19 q2.5 -4 0 -8' stroke='currentColor' stroke-width='2' opacity='.6'/>
    <path d='M24 35.5 q3 -3 6 0 M32 35.5 q3 -3 6 0' stroke='currentColor' stroke-width='2.2'/>
    <path d='M27 43 q4 3.4 8 0' stroke='currentColor' stroke-width='2.2'/>
    <circle cx='22.5' cy='40' r='1.5' fill='currentColor' opacity='.45'/>
    <circle cx='40.5' cy='40' r='1.5' fill='currentColor' opacity='.45'/>
  </svg>`,
  dashboard: `<svg viewBox='0 0 64 64' fill='none' stroke-linecap='round' stroke-linejoin='round'>
    <rect x='8' y='12' width='48' height='32' rx='3' stroke='currentColor' stroke-width='2.5'/>
    <path d='M27 44 h10 l3 9 H24 Z' stroke='currentColor' stroke-width='2.2'/>
    <path d='M20 56 h24' stroke='currentColor' stroke-width='2.2'/>
    <rect x='13' y='19' width='9.5' height='5.5' rx='1' fill='currentColor'/>
    <rect x='26.5' y='19' width='9.5' height='5.5' rx='1' fill='currentColor'/>
    <path d='M22.5 21.5 h4' stroke='currentColor' stroke-width='1.8'/>
    <path d='M16 33 q5.5 4.5 12 -1' stroke='currentColor' stroke-width='2.2'/>
    <rect x='41' y='22' width='3.2' height='14' fill='currentColor' opacity='.8'/>
    <rect x='46' y='26' width='3.2' height='10' fill='currentColor' opacity='.6'/>
    <rect x='51' y='30' width='3.2' height='6' fill='currentColor' opacity='.45'/>
  </svg>`,
};

const TYPES = {
  invoice: {
    label: "THE INVOICE",
    pts: 10,
    hits: 1,
    weight: 28,
    lifeMul: 1,
    sfx: "whack",
    quips: ["FILED.", "PAID. ALLEGEDLY.", "INTO THE LEDGER."],
  },
  email: {
    label: "THE EMAIL",
    pts: 10,
    hits: 1,
    weight: 26,
    lifeMul: 0.95,
    sfx: "whack",
    quips: ["ARCHIVED.", "MARKED UNREAD FOREVER.", "RE: RE: RESOLVED."],
  },
  bug: {
    label: "THE SPAM",
    pts: 25,
    hits: 1,
    weight: 17,
    lifeMul: 0.7,
    sfx: "splat",
    quips: ["SQUASHED.", "UNSUBSCRIBED. PERMANENTLY.", "NICE TRY, “PRINCE”."],
  },
  report: {
    label: "THE REPORT",
    pts: 15,
    hits: 2,
    weight: 13,
    lifeMul: 1.45,
    sfx: "clang",
    quips: ["DRAFT 2: FINAL_FINAL.", "SUBMITTED. NOBODY WILL READ IT."],
    midQuips: ["NEEDS ANOTHER PASS…"],
  },
  mug: {
    label: "THE COFFEE",
    pts: -50,
    hits: 1,
    weight: 9,
    lifeMul: 1.1,
    sfx: "sad",
    danger: true,
    quips: ["THAT WAS A HUMAN'S. -50", "HR HAS BEEN NOTIFIED. -50", "MONSTER. -50"],
  },
  dashboard: {
    label: "A DASHBOARD",
    pts: 100,
    hits: 1,
    weight: 7,
    lifeMul: 0.8,
    sfx: "jackpot",
    gold: true,
    quips: ["CLAUSE 06 ENFORCED. +100", "NO DASHBOARDS. +100"],
  },
};

const RANKS = [
  [0, "RANK: INTERN — the backlog won."],
  [100, "RANK: COORDINATOR — respectable violence."],
  [250, "RANK: OPS LEAD — nearly mechanical."],
  [400, "RANK: SUSPICIOUSLY GOOD — are you a script?"],
];

const ROUND_SECONDS = 45;
const FLEET_SECONDS = 8;
const NO_AUDIO = {};

export function initWhack({ reduceMotion = false, onFeedLine = () => {}, sound = NO_AUDIO } = {}) {
  const board = $("#wkBoard");
  const overlay = $("#wkOverlay");
  const timeEl = $("#wkTime");
  const scoreEl = $("#wkScore");
  const escEl = $("#wkEsc");
  const streakEl = $("#wkStreak");
  const panel = board.closest(".wk");
  const pressureFill = $("#wkPressureFill");
  const pressureLabel = $("#wkPressureLabel");
  const floorName = $("#wkFloorName");
  const helpBtn = $("#wkHelp");
  if (!board) throw new Error("FORGE7 // whack markup missing");

  const sfx = (name) => sound.enabled && sound[name] && sound[name]();

  const st = {
    mode: "idle", // idle | manual | fleet
    score: 0,
    escalated: 0,
    streak: 0,
    best: 0,
    timeLeft: ROUND_SECONDS,
    startedAt: 0,
    spawnT: 0,
    clockT: 0,
    slots: [],
    played: false,
    pressure: 0,
    stage: 0,
    smokeT: 0,
  };

  /* ---------------- stress system ----------------
     Misses feed the pressure bar; the floor reacts in stages:
     1 (25%): bar flickers amber, HELP ME!!! appears
     2 (50%): sirens, red heat-wash, harder shakes
     3 (75%): smoke - the machine is burning
     100%: meltdown. the round does not survive it. */
  const heat = document.createElement("i");
  heat.className = "wk__heatwash";
  board.appendChild(heat);
  const sirenL = document.createElement("i");
  sirenL.className = "wk__siren wk__siren--l";
  const sirenR = document.createElement("i");
  sirenR.className = "wk__siren wk__siren--r";
  board.appendChild(sirenL);
  board.appendChild(sirenR);

  const FLOOR_NAMES = [
    "SIM-WHACK // OPS FLOOR 7",
    "SIM-WHACK // OPS FLOOR 7",
    "SIM-WHACK // OPS FLOOR 7 — GETTING WARM",
    "SIM-WHACK // OPS FLOOR 7 — ON FIRE",
  ];
  const PRESSURE_LABELS = [
    "BACKLOG PRESSURE",
    "BACKLOG PRESSURE — RISING",
    "BACKLOG PRESSURE — CRITICAL",
    "BACKLOG PRESSURE — MELTDOWN IMMINENT",
  ];

  function renderPressure() {
    pressureFill.style.width = `${st.pressure}%`;
    gsap.set(heat, { opacity: (st.pressure / 100) * 0.55 });
  }

  function shake(strength) {
    if (reduceMotion) return;
    gsap.fromTo(
      panel,
      { x: -strength },
      { x: 0, duration: 0.3 + strength * 0.04, ease: "elastic.out(1.6, 0.22)", overwrite: "auto" }
    );
  }

  function smokePuff() {
    const b = board.getBoundingClientRect();
    const s = document.createElement("i");
    s.className = "wk__smoke";
    board.appendChild(s);
    const x = 20 + Math.random() * (b.width - 60);
    gsap.set(s, { x, y: b.height * (0.25 + Math.random() * 0.6) });
    gsap.to(s, {
      y: `-=${70 + Math.random() * 70}`,
      x: x + (Math.random() - 0.5) * 40,
      scale: 2 + Math.random(),
      autoAlpha: 0,
      duration: 1.7 + Math.random() * 0.8,
      ease: "power1.out",
      onComplete: () => s.remove(),
    });
  }

  function setStage(stage) {
    if (stage === st.stage) return;
    const rising = stage > st.stage;
    st.stage = stage;
    panel.classList.toggle("is-stage1", stage >= 1);
    panel.classList.toggle("is-stage2", stage >= 2);
    panel.classList.toggle("is-stage3", stage >= 3);
    floorName.textContent = FLOOR_NAMES[stage];
    pressureLabel.textContent = PRESSURE_LABELS[stage];

    helpBtn.hidden = !(stage >= 1 && st.mode === "manual");

    if (rising && stage >= 2) sfx("alarm");
    clearInterval(st.smokeT);
    if (stage >= 3 && !reduceMotion) {
      st.smokeT = setInterval(smokePuff, 420);
    }
  }

  function addPressure(amount) {
    if (st.mode !== "manual") return;
    st.pressure = Math.min(100, st.pressure + amount);
    renderPressure();
    setStage(st.pressure >= 75 ? 3 : st.pressure >= 50 ? 2 : st.pressure >= 25 ? 1 : 0);
    shake(2 + st.stage * 2);
    if (st.pressure >= 100) end(true);
  }

  function resetStress() {
    st.pressure = 0;
    clearInterval(st.smokeT);
    setStage(0);
    renderPressure();
    helpBtn.hidden = true;
  }

  helpBtn.addEventListener("click", () => {
    sfx("tick");
    const term = document.querySelector("#access");
    if (term) term.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  /* ---------------- board ---------------- */
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement("div");
    slot.className = "wk__slot";
    slot.innerHTML = "<i class='wk__hatch' aria-hidden='true'></i>";
    board.insertBefore(slot, overlay);
    st.slots.push({ el: slot, task: null });
  }

  function hud() {
    timeEl.textContent = `${st.timeLeft}s`;
    scoreEl.textContent = String(st.score);
    escEl.textContent = String(st.escalated);
    streakEl.textContent = `×${1 + Math.min(2, Math.floor(st.streak / 8))}`;
  }

  /* ---------------- juice ---------------- */
  function floatQuip(x, y, text, cls = "") {
    const q = document.createElement("span");
    q.className = `wk__quip ${cls}`;
    q.textContent = text;
    board.appendChild(q);
    gsap.set(q, { x, y });
    if (reduceMotion) {
      setTimeout(() => q.remove(), 700);
      return;
    }
    gsap
      .timeline({ onComplete: () => q.remove() })
      .fromTo(q, { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.12 })
      .to(q, { y: y - 44, duration: 0.7, ease: "power1.out" }, 0)
      .to(q, { autoAlpha: 0, duration: 0.25 }, 0.5);
  }

  function burst(x, y, color) {
    if (reduceMotion) return;
    for (let i = 0; i < 7; i++) {
      const s = document.createElement("i");
      s.className = "wk__shard";
      s.style.background = color;
      board.appendChild(s);
      const a = Math.random() * Math.PI * 2;
      const d = 26 + Math.random() * 30;
      gsap.set(s, { x, y });
      gsap.to(s, {
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d - 14,
        autoAlpha: 0,
        scale: 0.4,
        duration: 0.45 + Math.random() * 0.2,
        ease: "power2.out",
        onComplete: () => s.remove(),
      });
    }
    const ring = document.createElement("i");
    ring.className = "wk__ring";
    ring.style.borderColor = color;
    board.appendChild(ring);
    gsap.set(ring, { x: x - 22, y: y - 22 });
    gsap.fromTo(
      ring,
      { scale: 0.3, autoAlpha: 0.9 },
      { scale: 1.5, autoAlpha: 0, duration: 0.4, ease: "power2.out", onComplete: () => ring.remove() }
    );
  }

  function centerOf(el) {
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
  }

  /* ---------------- tasks ---------------- */
  function pickType() {
    const pool = Object.entries(TYPES);
    let total = pool.reduce((n, [, t]) => n + t.weight, 0);
    let roll = Math.random() * total;
    for (const [key, t] of pool) {
      roll -= t.weight;
      if (roll <= 0) return key;
    }
    return "invoice";
  }

  function elapsedMs() {
    return performance.now() - st.startedAt;
  }

  function spawnTask() {
    const free = st.slots.filter((s) => !s.task);
    if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)];
    const key = st.mode === "fleet" ? pickTypeFleet() : pickType();
    const type = TYPES[key];

    const el = document.createElement("button");
    el.type = "button";
    el.className = `wk__task wk--${key}`;
    el.setAttribute("aria-label", type.label);
    el.innerHTML = ART[key];
    slot.el.appendChild(el);

    const life =
      st.mode === "fleet"
        ? 1200
        : Math.max(680, 1500 - elapsedMs() * 0.014) * type.lifeMul;

    const task = { key, type, el, slot, hitsLeft: type.hits, dead: false, timer: 0 };
    slot.task = task;

    if (reduceMotion) {
      el.style.transform = "translateY(4%)";
    } else {
      gsap.fromTo(el, { yPercent: 105 }, { yPercent: 4, duration: 0.22, ease: "back.out(1.8)" });
      // idle wiggle while it waits
      gsap.to(el, { rotation: key === "bug" ? 6 : 3, duration: 0.18, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.25 });
    }

    task.timer = setTimeout(() => despawn(task), life);
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      whack(task);
    });

    if (st.mode === "fleet") {
      setTimeout(() => whack(task, true), 90 + Math.random() * 60);
    }
  }

  function pickTypeFleet() {
    // the fleet never gets baited: no mugs in its run (it checks first)
    const keys = ["invoice", "email", "bug", "report", "dashboard"];
    return keys[Math.floor(Math.random() * keys.length)];
  }

  function clearTask(task) {
    clearTimeout(task.timer);
    task.dead = true;
    task.slot.task = null;
    gsap.killTweensOf(task.el);
  }

  function despawn(task) {
    if (task.dead || st.mode === "idle") return;
    clearTask(task);
    const { x, y } = centerOf(task.el);
    const isNeutral = task.key === "mug" || task.key === "dashboard";
    if (!isNeutral) {
      st.escalated += 1;
      st.streak = 0;
      floatQuip(x, y - 20, "ESCALATED ↑", "is-warn");
      addPressure(12);
    }
    if (reduceMotion) task.el.remove();
    else {
      gsap.to(task.el, {
        yPercent: 110,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => task.el.remove(),
      });
    }
    hud();
  }

  function whack(task, byFleet = false) {
    if (task.dead || st.mode === "idle") return;
    const { x, y } = centerOf(task.el);
    const type = task.type;

    // the report takes two good hits
    if (task.hitsLeft > 1) {
      task.hitsLeft -= 1;
      sfx("clang");
      floatQuip(x, y - 26, type.midQuips[0]);
      if (!reduceMotion) {
        gsap.fromTo(task.el, { scaleY: 0.72, scaleX: 1.18 }, { scaleY: 1, scaleX: 1, duration: 0.3, ease: "elastic.out(1.4, 0.4)", transformOrigin: "bottom center" });
      }
      malletSwing(x, y);
      return;
    }

    clearTask(task);
    const mult = byFleet ? 1 : 1 + Math.min(2, Math.floor(st.streak / 8));
    const gained = type.pts * (type.pts > 0 ? mult : 1);
    st.score += gained;

    if (type.danger) {
      st.streak = 0;
      sfx("sad");
      addPressure(8);
      document.body.classList.add("is-hr");
      setTimeout(() => document.body.classList.remove("is-hr"), 350);
      floatQuip(x, y - 26, type.quips[Math.floor(Math.random() * type.quips.length)], "is-bad");
      if (!reduceMotion) {
        gsap.fromTo(task.el, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(2, 0.2)" });
        gsap.to(task.el, { autoAlpha: 0, duration: 0.3, delay: 0.35, onComplete: () => task.el.remove() });
      } else task.el.remove();
    } else {
      if (!byFleet) {
        st.streak += 1;
        if (st.streak % 8 === 0) {
          sfx("comboUp");
          floatQuip(x, y - 48, `COMBO ×${1 + Math.min(2, Math.floor(st.streak / 8))}`, "is-combo");
        }
      }
      sfx(type.sfx);
      const color = getComputedStyle(task.el).color;
      burst(x, y, color);
      floatQuip(x, y - 26, type.quips[Math.floor(Math.random() * type.quips.length)], type.gold ? "is-gold" : "");
      if (reduceMotion) task.el.remove();
      else {
        gsap.to(task.el, {
          scaleY: 0.12,
          scaleX: 1.35,
          autoAlpha: 0,
          transformOrigin: "bottom center",
          duration: 0.18,
          ease: "power3.in",
          onComplete: () => task.el.remove(),
        });
      }
    }
    if (!byFleet) malletSwing(x, y);
    hud();
  }

  /* ---------------- mallet cursor (fine pointers) ---------------- */
  let mallet = null;
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    mallet = document.createElement("div");
    mallet.className = "wk__mallet";
    mallet.innerHTML = `<svg viewBox='0 0 48 48' fill='none'>
      <path d='M22 26 L10 40' stroke='#C8FFE9' stroke-width='4.5' stroke-linecap='round'/>
      <rect x='20' y='6' width='20' height='14' rx='3' transform='rotate(45 30 13)' fill='#0C1318' stroke='#3DFFC0' stroke-width='2.5'/>
    </svg>`;
    board.appendChild(mallet);
    gsap.set(mallet, { autoAlpha: 0 });
    board.addEventListener("pointermove", (e) => {
      const b = board.getBoundingClientRect();
      gsap.to(mallet, { x: e.clientX - b.left, y: e.clientY - b.top, autoAlpha: 1, duration: 0.12, overwrite: "auto" });
    });
    board.addEventListener("pointerleave", () => gsap.to(mallet, { autoAlpha: 0, duration: 0.2 }));
  }
  function malletSwing() {
    if (!mallet) return;
    gsap.fromTo(mallet, { rotation: -50 }, { rotation: 0, duration: 0.3, ease: "back.out(2)" });
  }

  /* ---------------- rounds ---------------- */
  function setOverlay(html) {
    overlay.innerHTML = html;
    overlay.hidden = false;
  }

  function clearBoard() {
    st.slots.forEach((s) => {
      if (s.task) {
        clearTimeout(s.task.timer);
        gsap.killTweensOf(s.task.el);
        s.task.el.remove();
        s.task = null;
      }
    });
  }

  function spawnLoop() {
    if (st.mode === "idle") return;
    spawnTask();
    const e = elapsedMs();
    // late shift: the backlog starts arriving in pairs
    if (st.mode === "manual" && e > 15000 && Math.random() < Math.min(0.45, (e - 15000) / 50000)) {
      spawnTask();
    }
    const interval =
      st.mode === "fleet"
        ? Math.max(170, 300 - e * 0.012)
        : Math.max(380, 1050 - e * 0.015);
    st.spawnT = setTimeout(spawnLoop, interval);
  }

  function start(fleet = false) {
    clearBoard();
    resetStress();
    overlay.hidden = true;
    st.mode = fleet ? "fleet" : "manual";
    board.classList.toggle("is-fleet", fleet);
    st.score = 0;
    st.escalated = 0;
    st.streak = 0;
    st.timeLeft = fleet ? FLEET_SECONDS : ROUND_SECONDS;
    st.startedAt = performance.now();
    hud();
    sfx("tick");
    spawnLoop();
    st.clockT = setInterval(() => {
      st.timeLeft -= 1;
      hud();
      if (st.timeLeft <= 0) end();
    }, 1000);
  }

  function end(meltdown = false) {
    const wasFleet = st.mode === "fleet";
    st.mode = "idle";
    clearTimeout(st.spawnT);
    clearInterval(st.clockT);
    clearBoard();
    resetStress();
    board.classList.remove("is-fleet");
    sfx(meltdown ? "meltdown" : wasFleet ? "win" : "thud");

    if (meltdown) {
      st.played = true;
      st.best = Math.max(st.best, st.score);
      onFeedLine("SIM-05", "manual mode meltdown", `pressure 100% · floor lost ⟳`, true);
      setOverlay(
        `<p class='wk__big wk__big--melt'>MELTDOWN.</p>` +
          `<p class='wk__sub'>Backlog pressure hit 100% with ${st.timeLeft}s still on the clock.` +
          ` The floor is gone. The tasks won.<br/>This is the exact moment people call us.` +
          ` <a href='#access'>Skip the next meltdown →</a></p>` +
          `<div class='wk__btns'><button class='btn btn--ghost' data-wk='manual'>AGAIN</button>` +
          `<button class='btn btn--solid' data-wk='fleet'>WATCH FLEET MODE ▸</button></div>`
      );
      return;
    }

    if (wasFleet) {
      onFeedLine("SIM-05", "fleet mode demo", `${st.score} pts · 0 escalated · as usual ✓`);
      setOverlay(
        `<p class='wk__big'>FLEET: ${st.score} PTS</p>` +
          `<p class='wk__sub'>Zero escalations. Zero rage. It would do this all year.<br/>` +
          `Your best: ${st.best} pts. <a href='#access'>Commission the thing that just beat you →</a></p>` +
          `<div class='wk__btns'><button class='btn btn--ghost' data-wk='manual'>REMATCH, HUMAN</button></div>`
      );
    } else {
      st.played = true;
      st.best = Math.max(st.best, st.score);
      const rankLine =
        st.score < 0
          ? "RANK: HR INCIDENT — you mostly whacked the coffee."
          : ([...RANKS].reverse().find(([min]) => st.score >= min) || RANKS[0])[1];
      onFeedLine("SIM-05", "manual mode round complete", `${st.score} pts · ${st.escalated} escalated ✓`);
      setOverlay(
        `<p class='wk__big'>${st.score} PTS</p>` +
          `<p class='wk__sub'>${rankLine}<br/>${st.escalated} task${st.escalated === 1 ? "" : "s"} escalated while you were busy whacking.</p>` +
          `<div class='wk__btns'><button class='btn btn--ghost' data-wk='manual'>AGAIN</button>` +
          `<button class='btn btn--solid' data-wk='fleet'>WATCH FLEET MODE ▸</button></div>`
      );
    }
  }

  function intro() {
    const roster = [
      ["invoice", "10", ""],
      ["email", "10", ""],
      ["bug", "25", ""],
      ["report", "15×2", "two hits"],
      ["dashboard", "+100", "clause 06"],
      ["mug", "-50", "DO NOT"],
    ]
      .map(
        ([k, pts, note]) =>
          `<figure class='wk__cast wk--${k}'>${ART[k]}<figcaption>${TYPES[k].label}<b>${pts}</b>${note ? `<i>${note}</i>` : ""}</figcaption></figure>`
      )
      .join("");
    setOverlay(
      `<p class='wk__sub wk__sub--top'>TODAY'S BACKLOG:</p>` +
        `<div class='wk__roster'>${roster}</div>` +
        `<div class='wk__btns'><button class='btn btn--solid' data-wk='manual'>START MANUAL MODE ▸</button></div>` +
        `<p class='wk__hint'>WHACK EVERYTHING. EXCEPT THE COFFEE. A HUMAN IS HOLDING IT.</p>`
    );
  }

  overlay.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-wk]");
    if (!btn) return;
    start(btn.dataset.wk === "fleet");
  });

  intro();
  hud();

  return {
    start,
    end,
    state: () => ({ mode: st.mode, score: st.score, escalated: st.escalated, best: st.best }),
    _spawn: spawnTask,
    _whackAll: () => st.slots.forEach((s) => s.task && whack(s.task)),
    _addPressure: addPressure,
  };
}
