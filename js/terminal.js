/* ============================================================
   FORGE7 // access terminal
   Module 07 as a Fallout-style console: log in, answer the
   smith's questions line by line, transmit. The transcript
   accumulates above the prompt like a real tty.
   ============================================================ */
"use strict";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const pad = (n, w) => String(n).padStart(w, "0");

export function initTerminal({ reduceMotion = false, sound = null, feedline = () => {}, toast = () => {} } = {}) {
  const lockEl = $("#termLock");
  const consoleEl = $("#termConsole");
  const linesEl = $("#termLines");
  const inputRow = $("#termInputRow");
  const input = $("#termInput");
  const loginBtn = $("#termLogin");
  const screen = $(".term__screen");
  const content = $(".term__content");
  if (!lockEl || !input) throw new Error("FORGE7 // terminal markup missing");

  const sess = `SESS-${pad(100 + Math.floor(Math.random() * 9899), 4)}`;
  $("#sessId").textContent = sess;

  const sfx = (name) => sound && sound.enabled && sound[name] && sound[name]();
  const answers = {};
  let stepIdx = 0;
  let busy = false; // system is typing
  let done = false;

  const STEPS = [
    {
      key: "name",
      prompt: "state your name, operator:",
      validate: (v) => (v.length >= 2 ? true : "a name. any name. an alias is fine:"),
    },
    {
      key: "channel",
      prompt: "callback channel (email):",
      validate: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? true
          : "that's not a channel the fleet can reach. email, please:",
    },
    {
      key: "chore",
      prompt: "describe the chore, plainly. what eats your hours:",
      validate: (v) =>
        v.length >= 12 ? true : "more detail, operator. the machines bill by specificity:",
    },
    {
      key: "hours",
      prompt: "hours it steals, weekly (a number):",
      validate: (v) => {
        const n = Number(v);
        return Number.isFinite(n) && n >= 1 && n <= 120
          ? true
          : "numbers only. the fleet is pedantic:";
      },
    },
    {
      key: "confirm",
      prompt: `transmit work order ${sess}? [Y/N]`,
      validate: (v) => {
        const t = v.trim().toLowerCase();
        if (t === "y" || t === "yes") return true;
        if (t === "n" || t === "no")
          return "no rush. type Y when ready - or RESTART to start over.";
        return "[Y/N], operator. binary keeps the fleet calm:";
      },
    },
  ];

  /* ---------- transcript ---------- */
  function addLine(cls, text) {
    const div = document.createElement("div");
    div.className = `term__line ${cls}`;
    div.textContent = text;
    linesEl.appendChild(div);
    content.scrollTop = content.scrollHeight;
    return div;
  }

  function sysType(text, after) {
    busy = true;
    inputRow.classList.add("is-waiting");
    const line = addLine("t-sys", "");
    if (reduceMotion) {
      line.textContent = text;
      busy = false;
      inputRow.classList.remove("is-waiting");
      if (after) after();
      return;
    }
    const full = text;
    let i = 0;
    const iv = setInterval(() => {
      i += 1 + Math.floor(Math.random() * 2);
      line.textContent = full.slice(0, i);
      content.scrollTop = content.scrollHeight;
      if (i >= full.length) {
        clearInterval(iv);
        sfx("blip");
        busy = false;
        inputRow.classList.remove("is-waiting");
        if (after) after();
      }
    }, 14);
  }

  function ask() {
    sysType(STEPS[stepIdx].prompt, () => input.focus({ preventScroll: true }));
  }

  /* ---------- login sequence ---------- */
  function login() {
    loginBtn.disabled = true;
    sfx("tick");
    const boot = ["CONNECTING TO FORGE7//OPS …", "ACCESS GRANTED. WELCOME, GUEST-7."];
    const showConsole = () => {
      lockEl.hidden = true;
      consoleEl.hidden = false;
      let i = 0;
      const next = () => {
        if (i < boot.length) {
          const t = boot[i];
          i += 1;
          sysType(t, () => setTimeout(next, reduceMotion ? 0 : 120));
        } else {
          addLine("t-gap", "");
          ask();
        }
      };
      next();
    };
    if (reduceMotion) {
      showConsole();
      return;
    }
    // CRT wake-up: flicker + jitter, then the console
    gsap
      .timeline({ onComplete: showConsole })
      .to(screen, { opacity: 0.2, duration: 0.05 })
      .to(screen, { opacity: 1, duration: 0.05 })
      .to(screen, { opacity: 0.4, duration: 0.04 })
      .to(screen, { opacity: 1, duration: 0.08 })
      .fromTo(screen, { x: -3 }, { x: 0, duration: 0.2, ease: "power2.out" });
  }

  /* ---------- input handling ---------- */
  function restart() {
    stepIdx = 0;
    Object.keys(answers).forEach((k) => delete answers[k]);
    sysType("wiped. fresh work order. let's go again.", () => ask());
  }

  function submit() {
    done = true;
    inputRow.hidden = true;
    const seq = [
      "ENCRYPTING ....... OK",
      "QUEUED ✓ // ACK < 24H",
      `work order ${sess} is on the bench. a human replies within one working day.`,
      "the machines stay busy. keep the chore warm - it has weeks to live.",
    ];
    let i = 0;
    const next = () => {
      if (i >= seq.length) return;
      const t = seq[i];
      i += 1;
      sysType(t, () => setTimeout(next, reduceMotion ? 0 : 150));
    };
    next();
    feedline("ACC-01", "access request queued", `${sess} · human notified ✓`);
    toast("REQUEST QUEUED ✓ // ACK < 24H");
    sfx("win");
  }

  input.closest("form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (busy || done) return;
    const value = input.value.trim();
    if (!value) return;
    addLine("t-usr", `> ${value}`);
    input.value = "";
    sfx("tick");

    const lower = value.toLowerCase();
    if (lower === "restart") {
      restart();
      return;
    }
    if (lower === "help") {
      sysType("answer the question. RESTART starts over. that's the whole manual.", () => {});
      return;
    }

    const step = STEPS[stepIdx];
    const verdict = step.validate(value);
    if (verdict !== true) {
      sysType(verdict, () => {});
      return;
    }
    answers[step.key] = value;
    stepIdx += 1;
    if (stepIdx >= STEPS.length) submit();
    else ask();
  });

  loginBtn.addEventListener("click", login);
  consoleEl.addEventListener("click", () => {
    if (!done) input.focus({ preventScroll: true });
  });

  return { login, _answers: answers };
}
