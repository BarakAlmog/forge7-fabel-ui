/* ============================================================
   FORGE7 // the training floor
   A light Sokoban drill: push misplaced records onto their
   slots by hand, then watch AUTO-RUN do it without sighing.
   Legend: # wall · $ crate · . slot · @ operator · space floor
   ============================================================ */
"use strict";

const LEVELS = [
  {
    name: "INTAKE DUTY",
    map: [
      "########",
      "#      #",
      "#  ..  #",
      "#  $$  #",
      "#  @   #",
      "#      #",
      "########",
    ],
    solution: "UDRU",
    par: 4,
  },
  {
    name: "TRIAGE",
    map: [
      "#########",
      "#       #",
      "# .$@$. #",
      "#   $   #",
      "#   .   #",
      "#       #",
      "#########",
    ],
    solution: "RLLRD",
    par: 5,
  },
  {
    name: "MONTH-END CLOSE",
    map: [
      "#########",
      "#       #",
      "#  ## . #",
      "#  ##   #",
      "# $##   #",
      "# @  $  #",
      "#   .   #",
      "#########",
    ],
    solution: "RRRDRUUULUULLLDDDDLDRR",
    par: 22,
  },
];

const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const KEYMAP = {
  ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R",
  w: "U", s: "D", a: "L", d: "R", W: "U", S: "D", A: "L", D: "R",
};

const key = (x, y) => `${x},${y}`;

export function initDrill({ reduceMotion = false, onFeedLine = () => {} } = {}) {
  const board = document.getElementById("drillBoard");
  const stage = document.getElementById("drillStage");
  const levelEl = document.getElementById("drillLevel");
  const movesEl = document.getElementById("drillMoves");
  const pushesEl = document.getElementById("drillPushes");
  const noteEl = document.getElementById("drillNote");
  const nextBtn = document.getElementById("drillNext");
  const undoBtn = document.getElementById("drillUndo");
  const resetBtn = document.getElementById("drillReset");
  const autoBtn = document.getElementById("drillAuto");
  if (!board) throw new Error("FORGE7 // drill markup missing");

  const ROMAN = ["I", "II", "III"];
  const state = {
    level: 0,
    walls: new Set(),
    targets: new Set(),
    crates: new Map(), // "x,y" -> element
    player: { x: 0, y: 0, el: null },
    cols: 0,
    rows: 0,
    moves: 0,
    pushes: 0,
    history: [],
    won: false,
    auto: false,
    cleared: [false, false, false],
  };

  /* ---------- rendering ---------- */
  function tilePercent() {
    return { w: 100 / state.cols, h: 100 / state.rows };
  }

  function place(el, x, y) {
    const t = tilePercent();
    el.style.left = `${x * t.w}%`;
    el.style.top = `${y * t.h}%`;
  }

  function spawnTile(cls, x, y) {
    const el = document.createElement("div");
    el.className = cls;
    const t = tilePercent();
    el.style.width = `${t.w}%`;
    el.style.height = `${t.h}%`;
    place(el, x, y);
    board.appendChild(el);
    return el;
  }

  function load(idx) {
    state.level = idx;
    state.walls.clear();
    state.targets.clear();
    state.crates.clear();
    state.history = [];
    state.moves = 0;
    state.pushes = 0;
    state.won = false;
    board.innerHTML = "";

    const map = LEVELS[idx].map;
    state.rows = map.length;
    state.cols = map[0].length;
    board.style.aspectRatio = `${state.cols} / ${state.rows}`;

    map.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === "#") {
          state.walls.add(key(x, y));
          spawnTile("drill__wall", x, y);
          return;
        }
        spawnTile("drill__floor", x, y);
        if (ch === "." || ch === "*" || ch === "+") {
          state.targets.add(key(x, y));
          spawnTile("drill__slot", x, y);
        }
        if (ch === "$" || ch === "*") {
          const crate = spawnTile("drill__crate", x, y);
          crate.innerHTML = "<i></i><i></i>";
          state.crates.set(key(x, y), crate);
        }
        if (ch === "@" || ch === "+") {
          const bot = spawnTile("drill__bot", x, y);
          bot.innerHTML = '<span class="drill__bot-ring"></span><span class="drill__bot-core"></span>';
          state.player = { x, y, el: bot };
        }
      });
    });

    state.crates.forEach((el, k) => syncCrate(el, k));
    levelEl.textContent = `LEVEL ${ROMAN[idx]} / III · ${LEVELS[idx].name}`;
    updateHud();
    setNote(
      idx === 0
        ? "Push every misplaced record (orange) onto a slot (green). You are the machine now."
        : idx === 1
          ? "Three records, three slots. The fleet calls this a warm-up."
          : "The month-end special: two records, two corners, one long walk. Feel it."
    );
    nextBtn.hidden = true;
  }

  function syncCrate(el, k) {
    el.classList.toggle("is-slotted", state.targets.has(k));
  }

  function updateHud() {
    movesEl.textContent = String(state.moves).padStart(3, "0");
    pushesEl.textContent = String(state.pushes).padStart(2, "0");
  }

  function setNote(html) {
    noteEl.innerHTML = html;
  }

  function slide(el, x, y) {
    if (reduceMotion) {
      place(el, x, y);
      return;
    }
    const t = tilePercent();
    gsap.to(el, { left: `${x * t.w}%`, top: `${y * t.h}%`, duration: 0.13, ease: "power2.out" });
  }

  function bump(dir) {
    if (reduceMotion) return;
    const [dx, dy] = DIRS[dir];
    gsap.fromTo(
      state.player.el,
      { xPercent: dx * 18, yPercent: dy * 18 },
      { xPercent: 0, yPercent: 0, duration: 0.18, ease: "power2.out" }
    );
  }

  /* ---------- game logic ---------- */
  function tryMove(dir, viaAuto = false) {
    if (state.won || (state.auto && !viaAuto)) return false;
    const [dx, dy] = DIRS[dir];
    const { x, y } = state.player;
    const nx = x + dx;
    const ny = y + dy;
    const nk = key(nx, ny);

    if (state.walls.has(nk)) {
      bump(dir);
      return false;
    }

    let pushed = null;
    if (state.crates.has(nk)) {
      const cx = nx + dx;
      const cy = ny + dy;
      const ck = key(cx, cy);
      if (state.walls.has(ck) || state.crates.has(ck)) {
        bump(dir);
        return false;
      }
      const crateEl = state.crates.get(nk);
      state.crates.delete(nk);
      state.crates.set(ck, crateEl);
      slide(crateEl, cx, cy);
      syncCrate(crateEl, ck);
      pushed = { from: nk, to: ck };
      state.pushes += 1;
    }

    state.player.x = nx;
    state.player.y = ny;
    slide(state.player.el, nx, ny);
    state.moves += 1;
    state.history.push({ x, y, pushed });
    updateHud();

    if (pushed) checkWin();
    return true;
  }

  function undo() {
    if (state.won || state.auto) return;
    const last = state.history.pop();
    if (!last) return;
    if (last.pushed) {
      const crateEl = state.crates.get(last.pushed.to);
      state.crates.delete(last.pushed.to);
      state.crates.set(last.pushed.from, crateEl);
      const [fx, fy] = last.pushed.from.split(",").map(Number);
      slide(crateEl, fx, fy);
      syncCrate(crateEl, last.pushed.from);
      state.pushes -= 1;
    }
    state.player.x = last.x;
    state.player.y = last.y;
    slide(state.player.el, last.x, last.y);
    state.moves -= 1;
    updateHud();
  }

  function isSolved() {
    for (const t of state.targets) if (!state.crates.has(t)) return false;
    return true;
  }

  function checkWin() {
    if (!isSolved()) return;
    state.won = true;
    state.cleared[state.level] = true;
    board.classList.add("is-won");
    setTimeout(() => board.classList.remove("is-won"), 900);

    if (state.auto) return; // auto-run announces itself

    const quips = [
      `CONTAINED ✓ — ${state.moves} moves. Honest work. A Forge7 system does this ≈4,000 times a day and has never once felt proud.`,
      `CONTAINED ✓ — ${state.moves} moves. Imagine doing that every Tuesday, forever. That was the job.`,
      `DRILL COMPLETE ✓ — ${state.moves} moves, ${state.pushes} pushes. You now qualify for the waiting list at <a href="#access">MODULE 07</a>. The fleet remains unimpressed.`,
    ];
    setNote(quips[state.level]);
    onFeedLine("DRL-01", "training drill solved by visitor", `${state.moves} moves · fleet unimpressed ✓`);
    if (state.level < LEVELS.length - 1) {
      nextBtn.hidden = false;
    }
  }

  /* ---------- auto-run: the actual sales pitch ---------- */
  function autoRun() {
    if (state.auto) return;
    load(state.level);
    state.auto = true;
    board.classList.add("is-auto");
    autoBtn.disabled = true;
    setNote("AUTO-RUN ENGAGED. Hands off. This is the part where we replace you, but only for the boring bits.");

    const sol = LEVELS[state.level].solution;
    const stepMs = reduceMotion ? 40 : 95;
    const t0 = performance.now();
    let i = 0;

    const timer = setInterval(() => {
      if (i >= sol.length) {
        clearInterval(timer);
        const secs = ((performance.now() - t0) / 1000).toFixed(1);
        state.auto = false;
        board.classList.remove("is-auto");
        autoBtn.disabled = false;
        if (isSolved()) {
          setNote(
            `AUTO-RUN COMPLETE — ${sol.length} moves in ${secs}s. It will not be celebrating. It has more work.` +
              (state.level < LEVELS.length - 1 ? "" : ` Convinced? <a href="#access">Request access at MODULE 07.</a>`)
          );
          onFeedLine("DRL-01", "training drill autorun", `${sol.length} moves · ${secs}s · as usual ✓`);
          if (state.level < LEVELS.length - 1) nextBtn.hidden = false;
        } else {
          // a stored solution failing is a bug worth hearing about
          throw new Error(`FORGE7 // drill level ${state.level + 1} solution failed verification`);
        }
        return;
      }
      tryMove(sol[i], true);
      i += 1;
    }, stepMs);
  }

  /* ---------- input ---------- */
  stage.addEventListener("keydown", (e) => {
    const dir = KEYMAP[e.key];
    if (dir) {
      e.preventDefault();
      tryMove(dir);
      return;
    }
    if (e.key === "z" || e.key === "Z" || e.key === "u" || e.key === "U") {
      e.preventDefault();
      undo();
    }
    if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      load(state.level);
    }
  });

  stage.addEventListener("pointerdown", () => stage.focus({ preventScroll: true }));
  stage.addEventListener("focus", () => stage.classList.add("is-live"));
  stage.addEventListener("blur", () => stage.classList.remove("is-live"));

  // swipe (mobile)
  let touchStart = null;
  stage.addEventListener("touchstart", (e) => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener("touchmove", (e) => {
    if (touchStart) e.preventDefault(); // the board owns this gesture, not the scroll
  }, { passive: false });
  stage.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    tryMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U"));
  });

  // d-pad
  document.querySelectorAll("[data-drill-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      tryMove(btn.dataset.drillDir);
      stage.focus({ preventScroll: true });
    });
  });

  undoBtn.addEventListener("click", undo);
  resetBtn.addEventListener("click", () => load(state.level));
  autoBtn.addEventListener("click", autoRun);
  nextBtn.addEventListener("click", () => {
    load(state.level + 1);
    stage.focus({ preventScroll: true });
  });

  load(0);
  return {
    // exposed for verification and tinkering
    move: (d) => tryMove(d),
    loadLevel: (i) => load(i),
    autoRun,
    solved: () => isSolved(),
    levelCount: LEVELS.length,
  };
}
