/* ============================================================
   FORGE7 // the seven hidden protocols
   01 while-you-were-gone     05 console CLI (forge7.help())
   02 type "chaos" / "order"  06 press 0 seven times
   03 the stuck pixel         07 time-aware copy
   04 konami → 1887 build
   Plus ambient micro-interactions: telemetry poke, NOMINAL
   diagnostic, clause re-verification.
   ============================================================ */
"use strict";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function initProtocols({
  gate = null,
  feedline = () => {},
  sound = null,
  engageOverdrive = () => {},
  toast = () => {},
  drone = null,
  reduceMotion = false,
} = {}) {
  const sfx = (name) => sound && sound.enabled && sound[name] && sound[name]();
  const guarded = (t) =>
    !t ||
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.isContentEditable ||
    !!t.closest("#drillStage");

  /* ---------------------------------------------------------
     01 · while you were gone
     --------------------------------------------------------- */
  let hiddenAt = 0;
  function reportAway(ms) {
    if (ms < 90000) return;
    const tasks = Math.round((ms / 1000) * (1.2 + Math.random() * 0.5));
    feedline("FLEET", "while you were gone", `${tasks.toLocaleString("en-US")} tasks · we didn't miss you ✓`);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else if (hiddenAt) {
      reportAway(Date.now() - hiddenAt);
      hiddenAt = 0;
    }
  });

  /* ---------------------------------------------------------
     02 · containment breach ("chaos" / "order")
     --------------------------------------------------------- */
  let breachOn = false;
  let breachTimer = 0;
  const nominalEl = $(".bar__nominal");
  function breach(on) {
    if (on === breachOn) return on ? "ALREADY BREACHED" : "ALREADY NOMINAL";
    breachOn = on;
    clearTimeout(breachTimer);
    document.body.classList.toggle("is-breach", on);
    if (gate) gate.setBreach(on);
    if (on) {
      nominalEl.textContent = "BREACH";
      sfx("sweep");
      feedline("FLEET", "containment breach (visitor-induced)", "⟳ restoring order", true);
      toast("CONTAINMENT BREACH. TYPE “ORDER” TO ATONE.");
      breachTimer = setTimeout(() => breach(false), 7000);
    } else {
      nominalEl.textContent = "NOMINAL";
      sfx("win");
      feedline("FLEET", "order restored", "lattice integrity 100% ✓");
    }
    return on ? "BREACH ENGAGED" : "ORDER RESTORED";
  }

  /* ---------------------------------------------------------
     04 · konami → the 1887 build
     --------------------------------------------------------- */
  function legacyProtocol() {
    if ($(".legacy")) return "ALREADY RESTORED ONCE. PATIENCE.";
    const overlay = document.createElement("div");
    overlay.className = "legacy";
    overlay.innerHTML =
      '<div class="legacy__sheet">' +
      '<p class="legacy__kicker">LEGACY PROTOCOL DETECTED · RESTORING 1887 BUILD</p>' +
      "<h2>FORGE Nº7<br/><em>Automaton Works</em></h2>" +
      "<p class=\"legacy__body\">Tireless machines for tiresome work. Before the fleet ran on " +
      "phosphor, it ran on brass. The original build survives in the museum wing, " +
      "patent drawings and all.</p>" +
      '<div class="legacy__row">' +
      '<a class="legacy__btn" href="legacy-paper/" target="_blank" rel="noopener">VISIT THE MUSEUM →</a>' +
      '<span class="legacy__count">MODERN BUILD IN <b id="legacyCount">10</b>s · CLICK TO RETURN</span>' +
      "</div></div>";
    document.body.appendChild(overlay);
    sfx("win");

    let remaining = 10;
    const countEl = overlay.querySelector("#legacyCount");
    const tick = setInterval(() => {
      remaining -= 1;
      if (countEl) countEl.textContent = String(remaining);
      if (remaining <= 0) close();
    }, 1000);
    function close() {
      clearInterval(tick);
      if (!overlay.parentNode) return;
      const out = () => overlay.remove();
      if (reduceMotion) out();
      else gsap.to(overlay, { autoAlpha: 0, duration: 0.4, onComplete: out });
      feedline("FLEET", "legacy protocol viewed", "1887 build re-archived ✓");
    }
    overlay.addEventListener("click", (e) => {
      if (e.target.closest("a")) return; // museum link works normally
      close();
    });
    if (!reduceMotion) gsap.from(overlay, { autoAlpha: 0, duration: 0.35 });
    return "RESTORING 1887 BUILD…";
  }

  /* ---------------------------------------------------------
     06 · kernel panic (press 0 seven times)
     --------------------------------------------------------- */
  let panicking = false;
  const PANIC_TEXT = [
    "FORGE7 OS v7.0.1 — UNHANDLED EXCEPTION",
    "═══════════════════════════════════════",
    "PANIC: DIVISION BY BUSYWORK AT 0x0000007",
    "",
    "  at Busywork.compile (deprecated.js:1)",
    "  at Tuesday.repeat (forever.js:52)",
    "  at Human.copyPaste (legacy/manual.js:1887)",
    "  at Inbox.overflow (400emails.js:before_coffee)",
    "  at Dashboard.request (DENIED · policy.js:6)",
    "  at Fleet.sigh (never.js:0)",
    "",
    "DUMPING CORE… spared. the core did nothing wrong.",
    "RESTORING FROM SNAPSHOT ████████████ OK",
    "",
    "FLEET RESTORED. AS ALWAYS. (7 keystrokes, wasted)",
  ];
  function kernelPanic() {
    if (panicking) return "ALREADY PANICKING. CALMLY.";
    panicking = true;
    sfx("thud");
    const overlay = document.createElement("div");
    overlay.className = "panic";
    const pre = document.createElement("pre");
    overlay.appendChild(pre);
    document.body.appendChild(overlay);

    function finish() {
      if (!overlay.parentNode) return;
      const out = () => {
        overlay.remove();
        panicking = false;
        feedline("FLEET", "kernel panic (staged)", "restored from snapshot, as always ✓");
        sfx("win");
      };
      if (reduceMotion) out();
      else gsap.to(overlay, { autoAlpha: 0, duration: 0.45, delay: 0.9, onComplete: out });
    }

    if (reduceMotion) {
      pre.textContent = PANIC_TEXT.join("\n");
      setTimeout(finish, 1800);
    } else {
      let li = 0;
      const iv = setInterval(() => {
        pre.textContent += (li ? "\n" : "") + PANIC_TEXT[li];
        li += 1;
        if (li >= PANIC_TEXT.length) {
          clearInterval(iv);
          finish();
        }
      }, 140);
      overlay.addEventListener("click", () => {
        clearInterval(iv);
        pre.textContent = PANIC_TEXT.join("\n");
        finish();
      });
    }
    return "0x0000007";
  }

  /* ---------------------------------------------------------
     keyboard: konami sequence, word buffer, zero streak
     --------------------------------------------------------- */
  const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let kIdx = 0;
  let wordBuf = "";
  let zeroCount = 0;
  let zeroTimer = 0;

  document.addEventListener("keydown", (e) => {
    if (guarded(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();

    kIdx = k === KONAMI[kIdx] ? kIdx + 1 : k === KONAMI[0] ? 1 : 0;
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      legacyProtocol();
    }

    if (/^[a-z]$/.test(k)) {
      wordBuf = (wordBuf + k).slice(-10);
      if (wordBuf.endsWith("chaos")) {
        wordBuf = "";
        breach(true);
      } else if (wordBuf.endsWith("order")) {
        wordBuf = "";
        if (breachOn) breach(false);
      }
    }

    if (k === "0") {
      zeroCount += 1;
      clearTimeout(zeroTimer);
      zeroTimer = setTimeout(() => (zeroCount = 0), 4000);
      if (zeroCount >= 7) {
        zeroCount = 0;
        kernelPanic();
      }
    }
  });

  /* ---------------------------------------------------------
     03 · the stuck pixel
     --------------------------------------------------------- */
  function stuckPixel() {
    if (sessionStorage.getItem("forge7-pixel") === "fixed") return;
    const host = $(".foot__rows");
    if (!host) return;
    host.style.position = "relative";
    const px = document.createElement("button");
    px.className = "pixel";
    px.type = "button";
    px.setAttribute("aria-label", "There is a stuck pixel here. Click to have it repaired.");
    host.appendChild(px);

    px.addEventListener("click", () => {
      const r = px.getBoundingClientRect();
      const done = () => {
        px.remove();
        sessionStorage.setItem("forge7-pixel", "fixed");
        feedline("DRN-7", "stuck pixel repaired", "footer integrity restored ✓");
        toast("PIXEL UNSTUCK. NO CHARGE. THIS TIME.");
        sfx("clink");
      };
      px.disabled = true;
      const sent = drone && drone.dispatch(r.left + 2, r.top + 2, done);
      if (!sent) {
        if (reduceMotion) {
          done();
        } else {
          gsap.to(px, { scale: 3, autoAlpha: 0, duration: 0.4, ease: "power2.out", onComplete: done });
        }
      }
    });
  }
  stuckPixel();

  /* ---------------------------------------------------------
     07 · time-aware copy
     --------------------------------------------------------- */
  function chrono() {
    const kicker = $(".hero__kicker");
    if (!kicker) return;
    const set = (txt) =>
      (kicker.innerHTML = `<span class="hero__kdot" aria-hidden="true"></span>${txt}`);
    const d = new Date();
    const h = d.getHours();
    const day = d.getDay();
    if (h >= 2 && h < 5) {
      set("YOU'RE UP LATE&nbsp;&nbsp;//&nbsp;&nbsp;THE FLEET DOESN'T SLEEP EITHER");
    } else if (day === 5 && h >= 15) {
      set("AUTONOMOUS OPERATIONS&nbsp;&nbsp;//&nbsp;&nbsp;ALMOST THE WEEKEND. THE FLEET DOESN'T HAVE ONE.");
    } else if (day === 0 && h >= 17) {
      set("SUNDAY SHIFT&nbsp;&nbsp;//&nbsp;&nbsp;PRE-COMPILING MONDAY");
      setTimeout(
        () => feedline("SYN-12", "monday pre-compiled on sunday", "the dread stays deprecated ✓"),
        11000
      );
    } else if (day === 1 && h < 10) {
      set("MONDAY SURGE&nbsp;&nbsp;//&nbsp;&nbsp;CONTAINED, AS USUAL");
    }
  }
  chrono();

  /* ---------------------------------------------------------
     05 · console CLI
     --------------------------------------------------------- */
  const mono = "font-family: monospace; color: #7E948C;";
  const bright = "font-family: monospace; color: #3DFFC0; font-weight: 700;";
  window.forge7 = {
    help() {
      console.log(
        "%cFORGE7 CLI — AVAILABLE PROTOCOLS%c\n\n" +
          "  forge7.overdrive()  fleet to 300% for 10s\n" +
          "  forge7.chaos()      breach containment\n" +
          "  forge7.order()      restore the lattice\n" +
          "  forge7.panic()      staged kernel panic\n" +
          "  forge7.legacy()     restore the 1887 build\n" +
          "  forge7.hire()       we are not hiring. or are we\n" +
          "  forge7.sudo()       no\n",
        bright,
        mono
      );
      return "7 PROTOCOLS LISTED";
    },
    overdrive() {
      engageOverdrive();
      return "OVERDRIVE ENGAGED // 10s";
    },
    chaos: () => breach(true),
    order: () => breach(false),
    panic: () => kernelPanic(),
    legacy: () => legacyProtocol(),
    hire() {
      console.log(
        "%cWORK ORDER · OPENING: APPRENTICE SMITH%c\n\n" +
          "  REQUIREMENTS: reads logs for fun · allergic to dashboards ·\n" +
          "  pushes crates onto slots in under par · types in lowercase\n\n" +
          "  COMPENSATION: your Tuesdays back, plus salary\n" +
          "  APPLY: transmit at MODULE 07 with the word “apprentice”\n",
        bright,
        mono
      );
      return "WO-HIRE-0007";
    },
    sudo: () => "nice try. the fleet runs on least privilege.",
  };

  /* ---------------------------------------------------------
     ambient · NOMINAL diagnostic on hover
     --------------------------------------------------------- */
  let nomCooldown = 0;
  if (nominalEl) {
    nominalEl.addEventListener("pointerenter", () => {
      if (breachOn || Date.now() - nomCooldown < 30000) return;
      nomCooldown = Date.now();
      document.body.classList.add("is-checking");
      nominalEl.textContent = "CHECKING…";
      sfx("tick");
      setTimeout(() => {
        if (breachOn) return;
        nominalEl.textContent = "STILL NOMINAL. RELAX.";
      }, 900);
      setTimeout(() => {
        document.body.classList.remove("is-checking");
        if (breachOn) return;
        nominalEl.textContent = "NOMINAL";
      }, 2800);
    });
  }

  /* ---------------------------------------------------------
     ambient · clause re-verification
     --------------------------------------------------------- */
  $$(".clause").forEach((row) => {
    const check = row.querySelector(".clause__check");
    if (!check) return;
    let chip = null;
    check.addEventListener("click", () => {
      if (!row.classList.contains("is-checked")) return;
      row.classList.remove("is-checked");
      void row.offsetWidth; // restart the tick-draw transition
      row.classList.add("is-checked");
      sfx("tick");
      if (!chip) {
        chip = document.createElement("span");
        chip.className = "clause__verify";
        chip.textContent = "RE-VERIFIED";
        check.insertAdjacentElement("afterend", chip);
      }
      if (reduceMotion) return;
      gsap.fromTo(chip, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.25 });
      gsap.to(chip, { autoAlpha: 0, duration: 0.3, delay: 1.6, overwrite: false });
    });
  });

  return {
    breach,
    kernelPanic,
    legacyProtocol,
    _simulateAway: (ms) => reportAway(ms),
  };
}
