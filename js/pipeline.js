/* ============================================================
   FORGE7 // the assembly floor
   A pocket Incredible Machine: records pour from the intake,
   you place parts (route / validate / shred), press RUN, and
   keep your hands off. Designing this is literally the job.
   Sprites: Kenney 1-bit pack (CC0).
   ============================================================ */
"use strict";

const $ = (sel, ctx = document) => ctx.querySelector(sel);

const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const TURN_R = { N: "E", E: "S", S: "W", W: "N" };
const ROT = { N: 0, E: 90, S: 180, W: 270 }; // sprite faces north natively
const key = (x, y) => `${x},${y}`;

/* part sprite coordinates on the Kenney sheet */
const SPR = {
  arrow: [24, 12],
  stamp: [47, 0],
  shred: [9, 8],
  triage: [16, 3],
  intake: [46, 0],
  db: [3, 7],
  crate: [9, 7],
  bill: [43, 4],
  bug: [29, 5],
  bot: [30, 5],
};

const PART_LABEL = { arrow: "ROUTER", stamp: "VALIDATOR", shred: "SHREDDER", triage: "TRIAGE GATE" };

const LEVELS = [
  {
    name: "FIRST PIPELINE",
    cols: 9,
    rows: 5,
    walls: [],
    intakes: [{ x: 0, y: 2, dir: "E", queue: "IIII" }],
    db: { x: 8, y: 2 },
    tray: { arrow: 0, stamp: 1, shred: 0, triage: 0 },
    par: 1,
    spawnEvery: 3,
    brief:
      "Four invoices head for the archive - but the archive only accepts <b>validated</b> records. Drop the VALIDATOR on their path and press RUN.",
    solution: [{ t: "stamp", x: 4, y: 2 }],
  },
  {
    name: "CROSSED WIRES",
    cols: 9,
    rows: 6,
    walls: [
      [4, 1],
      [4, 2],
      [4, 4],
    ],
    intakes: [
      { x: 0, y: 1, dir: "E", queue: "IIII" },
      { x: 0, y: 4, dir: "E", queue: "SSS" },
    ],
    db: { x: 8, y: 4 },
    tray: { arrow: 3, stamp: 1, shred: 1, triage: 0 },
    par: 5,
    spawnEvery: 3,
    brief:
      "Two feeds, one archive, a spam lane, and crates in the way. Invoices: validate, then file. Spam: shred it before it hits the crates. Parts are exact - no spares.",
    solution: [
      { t: "arrow", x: 3, y: 1, dir: "S" },
      { t: "arrow", x: 3, y: 3, dir: "E" },
      { t: "arrow", x: 8, y: 3, dir: "S" },
      { t: "stamp", x: 5, y: 3 },
      { t: "shred", x: 3, y: 4 },
    ],
  },
  {
    name: "MONTH-END MIXER",
    cols: 9,
    rows: 6,
    walls: [
      [6, 1],
      [4, 3],
    ],
    intakes: [{ x: 0, y: 2, dir: "E", queue: "ISIISIS" }],
    db: { x: 8, y: 1 },
    tray: { arrow: 3, stamp: 1, shred: 1, triage: 1 },
    par: 6,
    spawnEvery: 3,
    brief:
      "One pipe, mixed traffic. The TRIAGE GATE passes invoices straight and kicks spam 90° right. Sort them, validate the real ones, dogleg into the archive. This is the month-end special.",
    solution: [
      { t: "triage", x: 3, y: 2 },
      { t: "stamp", x: 5, y: 2 },
      { t: "arrow", x: 7, y: 2, dir: "N" },
      { t: "arrow", x: 7, y: 1, dir: "E" },
      { t: "arrow", x: 3, y: 4, dir: "E" },
      { t: "shred", x: 6, y: 4 },
    ],
  },
];

const NO_AUDIO = { tick() {}, clink() {}, thud() {}, win() {} };

export function initPipeline({ reduceMotion = false, onFeedLine = () => {}, audio = NO_AUDIO } = {}) {
  const board = $("#pipeBoard");
  const trayEl = $("#pipeTray");
  const levelEl = $("#pipeLevel");
  const noteEl = $("#pipeNote");
  const statusEl = $("#pipeStatus");
  const runBtn = $("#pipeRun");
  const clearBtn = $("#pipeClear");
  const autoBtn = $("#pipeAuto");
  const nextBtn = $("#pipeNext");
  const scoresEl = $("#pipeScores");
  if (!board) throw new Error("FORGE7 // pipeline markup missing");

  const ROMAN = ["I", "II", "III"];
  const st = {
    level: 0,
    walls: new Set(),
    intakes: [],
    db: null,
    parts: new Map(), // "x,y" -> {t, dir, el}
    tray: {},
    armed: null, // part type or "erase"
    records: [],
    running: false,
    auto: false,
    timer: 0,
    tickN: 0,
    filed: 0,
    shredded: 0,
    errors: 0,
    spawned: 0,
    totalInv: 0,
    totalSpam: 0,
    cleared: [false, false, false],
  };

  const L = () => LEVELS[st.level];

  /* ---------------- rendering ---------------- */
  function setTileVar() {
    const w = board.clientWidth;
    board.style.setProperty("--tile", `${w / L().cols}px`);
  }
  window.addEventListener("resize", setTileVar);

  function tileEl(cls, x, y, sprKey, rot = 0) {
    const el = document.createElement("div");
    el.className = `pipe__cell ${cls}`;
    el.style.setProperty("--cx", x);
    el.style.setProperty("--cy", y);
    if (sprKey) {
      const s = document.createElement("i");
      s.className = "sprT";
      s.style.setProperty("--spr-x", SPR[sprKey][0]);
      s.style.setProperty("--spr-y", SPR[sprKey][1]);
      if (rot) s.style.transform = `rotate(${rot}deg)`;
      el.appendChild(s);
    }
    board.appendChild(el);
    return el;
  }

  function load(idx) {
    stopRun();
    st.level = idx;
    st.walls.clear();
    st.parts.clear();
    st.records.forEach((r) => r.el.remove());
    st.records = [];
    st.tray = { ...L().tray };
    st.armed = null;
    st.filed = 0;
    st.shredded = 0;
    st.errors = 0;
    st.spawned = 0;
    st.tickN = 0;
    board.innerHTML = "";
    board.style.aspectRatio = `${L().cols} / ${L().rows}`;
    setTileVar();

    for (let y = 0; y < L().rows; y++)
      for (let x = 0; x < L().cols; x++) tileEl("pipe__floor", x, y);

    L().walls.forEach(([x, y]) => {
      st.walls.add(key(x, y));
      tileEl("pipe__wall", x, y, "crate");
    });
    st.intakes = L().intakes.map((it) => ({ ...it, qi: 0 }));
    st.intakes.forEach((it) => tileEl("pipe__intake", it.x, it.y, "intake"));
    st.db = { ...L().db };
    tileEl("pipe__db", st.db.x, st.db.y, "db");

    st.totalInv = st.intakes.reduce((n, it) => n + (it.queue.match(/I/g) || []).length, 0);
    st.totalSpam = st.intakes.reduce((n, it) => n + (it.queue.match(/S/g) || []).length, 0);

    levelEl.textContent = `LEVEL ${ROMAN[idx]} / III · ${L().name}`;
    noteEl.innerHTML = L().brief;
    nextBtn.hidden = true;
    scoresEl.hidden = true;
    renderTray();
    renderStatus();
    setRunUI(false);
  }

  /* ---------------- tray ---------------- */
  function renderTray() {
    trayEl.innerHTML = "";
    Object.entries(st.tray).forEach(([t, count]) => {
      if (L().tray[t] === 0) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pipe__chip";
      b.dataset.part = t;
      b.disabled = count === 0;
      b.classList.toggle("is-armed", st.armed === t);
      b.innerHTML =
        `<i class="sprT" style="--spr-x:${SPR[t === "arrow" ? "arrow" : t][0]};--spr-y:${SPR[t][1]}"></i>` +
        `<span>${PART_LABEL[t]}</span><b>×${count}</b>`;
      b.addEventListener("click", () => {
        st.armed = st.armed === t ? null : t;
        renderTray();
      });
      trayEl.appendChild(b);
    });
    const er = document.createElement("button");
    er.type = "button";
    er.className = "pipe__chip pipe__chip--erase";
    er.classList.toggle("is-armed", st.armed === "erase");
    er.innerHTML = "<span>ERASE</span>";
    er.addEventListener("click", () => {
      st.armed = st.armed === "erase" ? null : "erase";
      renderTray();
    });
    trayEl.appendChild(er);
  }

  function renderStatus() {
    statusEl.innerHTML =
      `FILED <b>${st.filed}/${st.totalInv}</b> · SHREDDED <b>${st.shredded}/${st.totalSpam}</b>` +
      ` · INTERVENTIONS <b class="${st.errors ? "is-bad" : ""}">${st.errors}</b>`;
  }

  /* ---------------- placement ---------------- */
  function cellFromEvent(e) {
    const r = board.getBoundingClientRect();
    const t = r.width / L().cols;
    const x = Math.floor((e.clientX - r.left) / t);
    const y = Math.floor((e.clientY - r.top) / t);
    if (x < 0 || y < 0 || x >= L().cols || y >= L().rows) return null;
    return { x, y };
  }

  function blocked(x, y) {
    const k = key(x, y);
    return (
      st.walls.has(k) ||
      st.intakes.some((it) => it.x === x && it.y === y) ||
      (st.db.x === x && st.db.y === y)
    );
  }

  function place(t, x, y, dir = "E", silent = false) {
    const k = key(x, y);
    if (blocked(x, y) || st.parts.has(k) || st.tray[t] <= 0) return false;
    const el = tileEl(`pipe__part pipe__part--${t}`, x, y, t === "arrow" ? "arrow" : t, t === "arrow" ? ROT[dir] : 0);
    st.parts.set(k, { t, dir, el });
    st.tray[t] -= 1;
    if (!silent) {
      audio.clink();
      if (!reduceMotion) gsap.from(el, { scale: 0.4, duration: 0.25, ease: "back.out(2.5)" });
    }
    renderTray();
    return true;
  }

  function removePart(k) {
    const p = st.parts.get(k);
    if (!p) return;
    st.tray[p.t] += 1;
    p.el.remove();
    st.parts.delete(k);
    audio.tick();
    renderTray();
  }

  board.addEventListener("click", (e) => {
    if (st.running) return;
    const c = cellFromEvent(e);
    if (!c) return;
    const k = key(c.x, c.y);
    const existing = st.parts.get(k);

    if (st.armed === "erase") {
      removePart(k);
      return;
    }
    if (existing) {
      if (existing.t === "arrow") {
        existing.dir = TURN_R[existing.dir];
        existing.el.querySelector(".sprT").style.transform = `rotate(${ROT[existing.dir]}deg)`;
        audio.tick();
      } else {
        removePart(k);
      }
      return;
    }
    if (st.armed && st.armed !== "erase") place(st.armed, c.x, c.y);
  });

  /* ---------------- simulation ---------------- */
  function spawnRecord(intake) {
    const ch = intake.queue[intake.qi];
    intake.qi += 1;
    st.spawned += 1;
    const isSpam = ch === "S";
    const el = document.createElement("div");
    el.className = `pipe__rec ${isSpam ? "is-spam" : "is-inv"}`;
    el.innerHTML = `<i class="sprT" style="--spr-x:${SPR[isSpam ? "bug" : "bill"][0]};--spr-y:${SPR[isSpam ? "bug" : "bill"][1]}"></i>`;
    el.style.setProperty("--cx", intake.x);
    el.style.setProperty("--cy", intake.y);
    board.appendChild(el);
    st.records.push({ x: intake.x, y: intake.y, dir: intake.dir, spam: isSpam, stamped: false, el });
  }

  function consume(rec, ok) {
    st.records = st.records.filter((r) => r !== rec);
    if (reduceMotion) {
      rec.el.remove();
      return;
    }
    gsap.to(rec.el, {
      scale: ok ? 0.2 : 1.4,
      autoAlpha: 0,
      duration: 0.3,
      onComplete: () => rec.el.remove(),
    });
  }

  function fail(rec, why) {
    st.errors += 1;
    rec.el.classList.add("is-error");
    audio.thud();
    consume(rec, false);
    renderStatus();
    noteEl.innerHTML = `<span class="is-bad">HUMAN INTERVENTION:</span> ${why}. The fleet sighs (it can't, but it would).`;
  }

  function tick() {
    st.tickN += 1;

    // spawn
    if (st.tickN % L().spawnEvery === 1) {
      st.intakes.forEach((it) => {
        if (it.qi < it.queue.length) spawnRecord(it);
      });
    }

    // resolve current cell, then move
    [...st.records].forEach((rec) => {
      const p = st.parts.get(key(rec.x, rec.y));
      if (p) {
        if (p.t === "arrow") rec.dir = p.dir;
        if (p.t === "stamp" && !rec.spam && !rec.stamped) {
          rec.stamped = true;
          rec.el.classList.add("is-stamped");
          audio.clink();
          if (!reduceMotion) gsap.fromTo(p.el, { scale: 1.15 }, { scale: 1, duration: 0.2 });
        }
        if (p.t === "triage" && rec.spam) rec.dir = TURN_R[rec.dir];
        if (p.t === "shred") {
          if (rec.spam) {
            st.shredded += 1;
            audio.tick();
            consume(rec, true);
          } else {
            fail(rec, "an invoice went into the shredder");
          }
          renderStatus();
          return;
        }
      }
      if (st.db.x === rec.x && st.db.y === rec.y) {
        if (!rec.spam && rec.stamped) {
          st.filed += 1;
          audio.tick();
          consume(rec, true);
        } else if (rec.spam) {
          fail(rec, "spam reached the archive");
        } else {
          fail(rec, "an unvalidated record reached the archive");
        }
        renderStatus();
        return;
      }

      const [dx, dy] = DIRS[rec.dir];
      const nx = rec.x + dx;
      const ny = rec.y + dy;
      if (nx < 0 || ny < 0 || nx >= L().cols || ny >= L().rows || st.walls.has(key(nx, ny))) {
        fail(rec, "a record hit the crates and was lost");
        return;
      }
      rec.x = nx;
      rec.y = ny;
      if (reduceMotion) {
        rec.el.style.setProperty("--cx", nx);
        rec.el.style.setProperty("--cy", ny);
      } else {
        gsap.to(rec.el, { "--cx": nx, "--cy": ny, duration: 0.22, ease: "none" });
      }
    });

    // done?
    const exhausted = st.intakes.every((it) => it.qi >= it.queue.length);
    if (exhausted && st.records.length === 0) finish();
  }

  /* ---------------- run control ---------------- */
  function setRunUI(running) {
    runBtn.textContent = running ? "STOP ⏹" : "RUN ▸";
    board.classList.toggle("is-running", running);
    autoBtn.disabled = running;
  }

  function startRun() {
    if (st.running) return;
    // reset run state but keep parts
    st.records.forEach((r) => r.el.remove());
    st.records = [];
    st.intakes.forEach((it) => (it.qi = 0));
    st.filed = 0;
    st.shredded = 0;
    st.errors = 0;
    st.tickN = 0;
    st.running = true;
    st.armed = null;
    renderTray();
    renderStatus();
    noteEl.textContent = "RUNNING. Hands off - that's the whole point.";
    setRunUI(true);
    st.timer = setInterval(tick, reduceMotion ? 150 : 260);
  }

  function stopRun() {
    clearInterval(st.timer);
    st.running = false;
    setRunUI(false);
  }

  function finish() {
    stopRun();
    const partsUsed = st.parts.size;
    const partsWord = partsUsed === 1 ? "part" : "parts";
    const win = st.filed === st.totalInv && st.shredded === st.totalSpam && st.errors === 0;

    if (win) {
      st.cleared[st.level] = true;
      board.classList.add("is-won");
      setTimeout(() => board.classList.remove("is-won"), 900);
      audio.win();
      const wasAuto = st.auto;
      noteEl.innerHTML = wasAuto
        ? `AUTO-DESIGN COMPLETE — ${partsUsed} ${partsWord}, zero interventions. Designed in under a second. <b>This is the job.</b> Yours starts at <a href="#access">MODULE 07</a>.`
        : st.level < LEVELS.length - 1
          ? `PIPELINE CERTIFIED ✓ — ${partsUsed} ${partsWord} (fleet par: ${L().par}). It now runs without you. Feels good, doesn't it.`
          : `ASSEMBLY FLOOR CLEARED ✓ — You just did, in miniature, what we do for a living. <a href="#access">Commission the full-size version at MODULE 07.</a>`;
      onFeedLine(
        "SIM-77",
        wasAuto ? "pipeline auto-designed" : "pipeline certified by visitor",
        `${partsUsed} parts · 0 interventions ✓`
      );
      showScores(partsUsed);
      if (st.level < LEVELS.length - 1) nextBtn.hidden = false;
    } else {
      audio.thud();
      const misses = [];
      if (st.filed < st.totalInv) misses.push(`${st.totalInv - st.filed} unfiled`);
      if (st.shredded < st.totalSpam) misses.push(`${st.totalSpam - st.shredded} spam loose`);
      if (st.errors) misses.push(`${st.errors} interventions`);
      noteEl.innerHTML = `RUN FAILED — ${misses.join(" · ")}. Redesign and run again. (The fleet's first drafts fail too. Ours just fail in staging.)`;
      onFeedLine("SIM-77", "pipeline run failed", `${misses.join(" · ")} ⟳`, true);
    }
    st.auto = false;
  }

  runBtn.addEventListener("click", () => (st.running ? stopRun() : startRun()));
  clearBtn.addEventListener("click", () => {
    if (st.running) return;
    [...st.parts.keys()].forEach(removePart);
    noteEl.innerHTML = L().brief;
  });
  nextBtn.addEventListener("click", () => load(st.level + 1));

  /* ---------------- auto-design: the sales pitch ---------------- */
  function autoDesign() {
    if (st.running) return;
    load(st.level);
    st.auto = true;
    noteEl.textContent = "UNIT TR-7 DESIGNING… you may feel briefly obsolete.";
    audio.tick();
    const sol = L().solution;
    sol.forEach((p, i) => {
      setTimeout(() => {
        place(p.t, p.x, p.y, p.dir || "E");
        if (i === sol.length - 1) setTimeout(startRun, reduceMotion ? 100 : 420);
      }, (reduceMotion ? 30 : 170) * i);
    });
  }
  autoBtn.addEventListener("click", autoDesign);

  /* ---------------- floor records ---------------- */
  function showScores(partsUsed) {
    const list = scoresEl.querySelector("ol");
    const rows = [
      { name: "UNIT TR-7", v: `${L().par} PARTS`, note: "machine. obviously.", cls: "is-machine" },
      {
        name: "YOU",
        v: `${partsUsed} PARTS`,
        note: partsUsed <= L().par ? "fleet-grade design" : "it runs. that counts.",
        cls: "is-you",
      },
      { name: "OP. KLAUS", v: `${L().par + 2} PARTS`, note: "added a belt 'for safety'", cls: "" },
    ];
    list.innerHTML = rows
      .map((r) => `<li class="${r.cls}"><b>${r.name}</b><i>${r.v}</i><span>${r.note}</span></li>`)
      .join("");
    scoresEl.hidden = false;
    if (!reduceMotion) {
      gsap.from(list.children, { autoAlpha: 0, x: -10, duration: 0.4, stagger: 0.07, ease: "power2.out" });
    }
  }

  load(0);
  return {
    loadLevel: (i) => load(i),
    autoDesign,
    place: (t, x, y, dir) => place(t, x, y, dir),
    run: startRun,
    state: () => ({
      running: st.running,
      filed: st.filed,
      shredded: st.shredded,
      errors: st.errors,
      cleared: [...st.cleared],
    }),
    levelCount: LEVELS.length,
  };
}
