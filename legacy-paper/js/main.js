/* ============================================================
   FORGE Nº7 · animation engine
   GSAP + ScrollTrigger + one honest <canvas>. No frameworks.
   ============================================================ */
"use strict";

document.documentElement.classList.add("js");
history.scrollRestoration = "manual";

if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
  document.documentElement.classList.remove("js");
  throw new Error("FORGE Nº7: GSAP failed to load. The page falls back to static print.");
}

gsap.registerPlugin(ScrollTrigger);

const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ------------------------------------------------------------
   SVG stroke "draw-in" helpers
   ------------------------------------------------------------ */
function prepDrawables(svg) {
  const strokes = [];
  const fills = [];
  $$(".dr", svg).forEach((el) => {
    const hasLength = typeof el.getTotalLength === "function";
    const stroked = getComputedStyle(el).stroke !== "none";
    if (hasLength && stroked) {
      const len = Math.ceil(el.getTotalLength()) + 2;
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
      strokes.push(el);
    } else {
      gsap.set(el, { autoAlpha: 0 });
      fills.push(el);
    }
  });
  return { strokes, fills };
}

function drawTimeline(svg, { duration = 1.8, stagger = 0.018 } = {}) {
  const { strokes, fills } = prepDrawables(svg);
  const tl = gsap.timeline();
  tl.to(strokes, {
    strokeDashoffset: 0,
    duration,
    ease: "power2.inOut",
    stagger,
  });
  if (fills.length) tl.to(fills, { autoAlpha: 1, duration: 0.5, stagger: 0.04 }, "-=0.6");
  return tl;
}

function showDrawablesInstantly(svg) {
  $$(".dr", svg).forEach((el) => {
    el.style.strokeDasharray = "none";
    el.style.strokeDashoffset = "0";
    gsap.set(el, { autoAlpha: 1 });
  });
}

/* ------------------------------------------------------------
   Stamp slam
   ------------------------------------------------------------ */
function slamStamp(el, { shakeTarget = null } = {}) {
  if (REDUCE) {
    gsap.set(el, { autoAlpha: 1 });
    return gsap.timeline();
  }
  const tl = gsap.timeline();
  tl.fromTo(
    el,
    { autoAlpha: 0, scale: 2.6, rotation: -18 },
    { autoAlpha: 1, scale: 1, rotation: -7, duration: 0.32, ease: "power4.in" }
  );
  if (shakeTarget) {
    tl.fromTo(
      shakeTarget,
      { x: -3 },
      { x: 0, duration: 0.3, ease: "elastic.out(1, 0.18)", clearProps: "x" },
      ">-0.02"
    );
  }
  tl.to(el, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }, ">-0.05");
  return tl;
}

/* ------------------------------------------------------------
   Hero intro
   ------------------------------------------------------------ */
function splitWords(line) {
  const words = [];
  Array.from(line.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (part.trim() === "") {
          frag.appendChild(document.createTextNode(part));
        } else {
          const w = document.createElement("span");
          w.className = "w";
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const w = document.createElement("span");
      w.className = "w";
      node.replaceWith(w);
      w.appendChild(node);
      words.push(w);
    }
  });
  return words;
}

function intro() {
  const heroFig = $(".fig--contraption");
  const heroReveals = $$(".hero [data-reveal]");
  const lines = $$(".hero__title .line");
  const words = lines.flatMap(splitWords);

  if (REDUCE) {
    gsap.set(heroReveals, { autoAlpha: 1, y: 0 });
    gsap.set($$(".margin-note"), { autoAlpha: 1 });
    showDrawablesInstantly(heroFig);
    return;
  }

  gsap.set(words, { yPercent: 120 });
  gsap.set(".margin-note--hero", { autoAlpha: 0, scale: 0.7, rotation: -14 });

  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".masthead__row", { y: -14, autoAlpha: 0, duration: 0.6 })
    .from(".masthead__dateline", { autoAlpha: 0, duration: 0.5 }, "-=0.35")
    .to(".hero__kicker", { autoAlpha: 1, y: 0, duration: 0.01 }, "-=0.2")
    .from(".hero__kicker .kicker__rule", { scaleX: 0, duration: 0.9, ease: "power2.inOut" }, "<")
    .to(words, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.07 }, "-=0.65")
    .to(".hero__sub", { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.55")
    .to(".hero__cta", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.45")
    .to(".hero__footnote", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.4")
    .add(drawTimeline(heroFig, { duration: 2.4 }), 0.9)
    .to(
      ".margin-note--hero",
      { autoAlpha: 0.85, scale: 1, rotation: 5, duration: 0.5, ease: "back.out(2.5)" },
      "-=1.2"
    );
}

/* ------------------------------------------------------------
   Generic scroll reveals (everything outside the hero)
   ------------------------------------------------------------ */
function reveals() {
  const els = $$("[data-reveal]").filter((el) => !el.closest(".hero"));
  els.forEach((el) => {
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

  $$(".margin-note").forEach((note) => {
    if (note.classList.contains("margin-note--hero")) return;
    if (REDUCE) {
      gsap.set(note, { autoAlpha: 0.85 });
      return;
    }
    gsap.fromTo(
      note,
      { autoAlpha: 0, scale: 0.7 },
      {
        autoAlpha: 0.85,
        scale: 1,
        duration: 0.55,
        ease: "back.out(2.2)",
        scrollTrigger: { trigger: note.parentElement, start: "top 60%", once: true },
      }
    );
  });
}

/* ------------------------------------------------------------
   Plate I · ledger tallies + PAID stamp
   ------------------------------------------------------------ */
function ledger() {
  $$("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    if (Number.isNaN(target)) throw new Error(`FORGE Nº7: bad data-count on ${el.outerHTML}`);
    if (REDUCE) {
      el.textContent = String(target);
      return;
    }
    const state = { v: 0 };
    gsap.to(state, {
      v: target,
      duration: 1.6,
      ease: "power2.out",
      snap: { v: 1 },
      onUpdate: () => (el.textContent = String(Math.round(state.v))),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  const stamp = $(".stamp--paid");
  ScrollTrigger.create({
    trigger: ".ledger__total",
    start: "top 80%",
    once: true,
    onEnter: () => slamStamp(stamp, { shakeTarget: ".ledger" }),
  });
}

/* ------------------------------------------------------------
   Plate II · seven stations, horizontal on desk-sized paper
   ------------------------------------------------------------ */
function stations() {
  const method = $(".method");
  const track = $("#methodTrack");
  const pin = $(".method__pin");
  const counter = $("#stationCounter");
  const heat = $("#methodHeat");
  const panels = $$(".station", track);

  ScrollTrigger.create({
    trigger: method,
    start: "top 75%",
    once: true,
    onEnter: () => {
      $$(".station__icon").forEach((icon, i) => {
        if (REDUCE) {
          showDrawablesInstantly(icon);
        } else {
          drawTimeline(icon, { duration: 1.1 }).delay(i * 0.12);
        }
      });
    },
  });

  const mm = gsap.matchMedia();

  mm.add("(min-width: 880px) and (prefers-reduced-motion: no-preference)", () => {
    method.classList.remove("is-static");
    const distance = () => track.scrollWidth - window.innerWidth;

    const scrollTween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const idx = Math.round(self.progress * (panels.length - 1));
          const label =
            idx === 0
              ? "STATION — / VII"
              : idx >= panels.length - 1
                ? "END OF PLATE II"
                : `STATION ${ROMAN[idx - 1]} / VII`;
          counter.textContent = label;
          gsap.set(heat, { scaleX: self.progress });
        },
      },
    });

    const numerals = $$(".station__numeral", track);
    numerals.forEach((num) => {
      gsap.fromTo(
        num,
        { xPercent: 14 },
        {
          xPercent: -10,
          ease: "none",
          scrollTrigger: {
            trigger: num.closest(".station"),
            containerAnimation: scrollTween,
            start: "left right",
            end: "right left",
            scrub: true,
          },
        }
      );
    });

    return () => {
      method.classList.add("is-static");
    };
  });

  mm.add("(max-width: 879px), (prefers-reduced-motion: reduce)", () => {
    method.classList.add("is-static");
    counter.textContent = "STATIONS I–VII";
  });
}

/* ------------------------------------------------------------
   Embers + sparks (one honest canvas)
   ------------------------------------------------------------ */
class Embers {
  constructor(canvas, host) {
    this.canvas = canvas;
    this.host = host;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.active = false;
    this.lastSpawn = 0;
    this.spawnRect = { x: 0, y: 0, w: 0, h: 0 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.resize();
    window.addEventListener("resize", () => this.resize());

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (this.active = e.isIntersecting)),
      { threshold: 0 }
    );
    io.observe(host);

    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  resize() {
    const box = this.host.getBoundingClientRect();
    this.w = box.width;
    this.h = box.height;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const ingot = $("#ingotBar");
    if (ingot) {
      const ir = ingot.getBoundingClientRect();
      this.spawnRect = {
        x: ir.left - box.left,
        y: ir.top - box.top,
        w: ir.width,
        h: ir.height,
      };
    }
  }

  spawnEmber() {
    const r = this.spawnRect;
    this.particles.push({
      type: "ember",
      x: r.x + Math.random() * r.w,
      y: r.y + Math.random() * r.h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(0.35 + Math.random() * 0.8),
      size: 0.8 + Math.random() * 1.8,
      life: 1,
      decay: 0.004 + Math.random() * 0.006,
      sway: Math.random() * Math.PI * 2,
      hue: 18 + Math.random() * 20,
    });
  }

  burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const speed = 2.2 + Math.random() * 6.5;
      this.particles.push({
        type: "spark",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 0.7 + Math.random() * 1.3,
        life: 1,
        decay: 0.018 + Math.random() * 0.025,
        sway: 0,
        hue: 24 + Math.random() * 18,
      });
    }
  }

  tick(now) {
    requestAnimationFrame(this.tick);
    const hasWork = this.particles.length > 0;
    if (!this.active && !hasWork) return;

    if (this.active && !REDUCE && now - this.lastSpawn > 90 && this.particles.length < 130) {
      this.spawnEmber();
      if (Math.random() > 0.6) this.spawnEmber();
      this.lastSpawn = now;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";

    this.particles = this.particles.filter((p) => {
      p.life -= p.decay;
      if (p.life <= 0) return false;

      if (p.type === "ember") {
        p.sway += 0.03;
        p.x += p.vx + Math.sin(p.sway) * 0.3;
        p.y += p.vy;
        p.vy -= 0.002;
        const flicker = 0.65 + Math.random() * 0.35;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue * p.life}, 100%, ${40 + 25 * p.life}%, ${p.life * flicker})`;
        ctx.arc(p.x, p.y, p.size * (0.6 + p.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        const px = p.x;
        const py = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16;
        p.vx *= 0.985;
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${p.hue}, 100%, ${55 + 25 * p.life}%, ${p.life})`;
        ctx.lineWidth = p.size;
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      return p.x > -20 && p.x < this.w + 20 && p.y > -20 && p.y < this.h + 20;
    });
  }
}

/* ------------------------------------------------------------
   Plate III · the forge floor (seven strikes)
   ------------------------------------------------------------ */
function forgeFloor() {
  const section = $(".forge");
  const canvas = $("#emberCanvas");
  const embers = new Embers(canvas, section);

  ScrollTrigger.create({
    trigger: section,
    start: "top 55%",
    end: "bottom 45%",
    onToggle: (self) => document.body.classList.toggle("is-hot", self.isActive),
  });

  const btn = $("#anvilBtn");
  const swing = $("#hammerSwing");
  const ingot = $("#ingot");
  const ingotGlow = $("#ingotGlow");
  const gear = $("#temperGear");
  const gearSpin = $("#temperGearSpin");
  const countEl = $("#strikeCount");
  const hintEl = $("#forgeHint");
  const tallies = $$("#tally i");
  const done = $("#forgeDone");
  const inner = $(".forge__inner");

  const HINTS = {
    1: "AGAIN.",
    2: "HARDER.",
    3: "GOOD. AGAIN.",
    4: "THE IRON LISTENS.",
    5: "NEARLY THERE.",
    6: "ONE MORE.",
  };

  gsap.set(swing, { svgOrigin: "330 40", rotation: REDUCE ? 0 : 26 });

  let strikes = 0;
  let busy = false;
  let tempered = false;

  function ingotPoint() {
    const box = section.getBoundingClientRect();
    const ir = $("#ingotBar").getBoundingClientRect();
    return { x: ir.left - box.left + ir.width * 0.55, y: ir.top - box.top + ir.height * 0.3 };
  }

  function impact() {
    strikes += 1;
    countEl.textContent = `STRIKE ${strikes} OF VII`;
    if (tallies[strikes - 1]) tallies[strikes - 1].classList.add("is-inked");
    if (HINTS[strikes]) hintEl.textContent = HINTS[strikes];
    if (navigator.vibrate) navigator.vibrate(12);

    const p = ingotPoint();
    embers.burst(p.x, p.y, REDUCE ? 8 : 26 + strikes * 4);

    if (!REDUCE) {
      gsap.fromTo(
        ingot,
        { scaleY: 1 - strikes * 0.03, scaleX: 1 + strikes * 0.035 },
        {
          scaleY: 1 - strikes * 0.038,
          scaleX: 1 + strikes * 0.045,
          svgOrigin: "240 148",
          duration: 0.2,
          ease: "power2.out",
        }
      );
      gsap.fromTo(ingotGlow, { opacity: 1, scale: 1.25, svgOrigin: "240 150" }, { opacity: 0.7, scale: 1, duration: 0.5 });
      gsap.fromTo(inner, { x: 4 }, { x: 0, duration: 0.35, ease: "elastic.out(1.4, 0.2)", clearProps: "x" });
    }

    if (strikes >= 7) temper();
  }

  function temper() {
    tempered = true;
    countEl.textContent = "STRIKE VII OF VII";
    hintEl.textContent = "WELL STRUCK.";
    btn.setAttribute("aria-label", "The iron is tempered");

    const p = ingotPoint();
    embers.burst(p.x, p.y, REDUCE ? 12 : 90);

    const tl = gsap.timeline();
    tl.to(ingot, { autoAlpha: 0, scale: 1.3, svgOrigin: "240 135", duration: 0.4, ease: "power2.in" })
      .to(swing, { autoAlpha: 0, duration: 0.4 }, "<")
      .fromTo(
        gear,
        { autoAlpha: 0, scale: 0.5, svgOrigin: "240 118" },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(2)" }
      )
      .add(() => {
        done.hidden = false;
        slamStamp($(".stamp--tempered"));
        gsap.from("#forgeDone p", { autoAlpha: 0, y: 14, duration: 0.6, ease: "power3.out" });
      });
    if (!REDUCE) {
      gsap.to(gearSpin, { rotation: 360, svgOrigin: "240 118", duration: 14, repeat: -1, ease: "none" });
    }
  }

  btn.addEventListener("click", () => {
    if (tempered) {
      if (!REDUCE) {
        gsap.fromTo(gear, { rotation: 0 }, { rotation: 8, duration: 0.4, svgOrigin: "240 118", ease: "elastic.out(2, 0.2)", clearProps: "rotation" });
      }
      return;
    }
    if (busy) return;
    busy = true;

    if (REDUCE) {
      impact();
      busy = false;
      return;
    }

    gsap
      .timeline({ onComplete: () => (busy = false) })
      .to(swing, { rotation: 34, duration: 0.07, ease: "power1.out" })
      .to(swing, { rotation: 0, duration: 0.08, ease: "power4.in", onComplete: impact })
      .to(swing, { rotation: 26, duration: 0.5, ease: "back.out(1.8)" });
  });
}

/* ------------------------------------------------------------
   Plate IV · works drawings draw themselves in
   ------------------------------------------------------------ */
function works() {
  $$(".works-card__fig").forEach((fig) => {
    if (REDUCE) {
      showDrawablesInstantly(fig);
      return;
    }
    const tl = drawTimeline(fig, { duration: 1.5 });
    tl.pause();
    ScrollTrigger.create({
      trigger: fig.closest(".works-card"),
      start: "top 78%",
      once: true,
      onEnter: () => tl.play(),
    });
  });
}

/* ------------------------------------------------------------
   Temperature gauge: scroll position as heat
   ------------------------------------------------------------ */
function gauge() {
  const merc = $("#gaugeMerc");
  const read = $("#gaugeRead");
  const gaugeEl = $(".gauge");
  const MIN = 20;
  const MAX = 1538;

  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const temp = Math.round(MIN + (MAX - MIN) * self.progress);
      read.textContent = `${String(temp).padStart(4, "0")}°C`;
      gsap.set(merc, { scaleY: self.progress });
      gaugeEl.classList.toggle("is-molten", temp > 850);
    },
  });
}

/* ------------------------------------------------------------
   Plate VII · the work order
   ------------------------------------------------------------ */
function commission() {
  const form = $("#orderForm");
  const orderNo = `Nº ${String(700 + Math.floor(Math.random() * 299)).padStart(4, "0")}`;
  $("#orderNo").textContent = orderNo;
  $("#orderNoEcho").textContent = orderNo;

  const error = $("#orderError");
  const received = $("#orderReceived");
  const seal = $("#sealBtn");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#fName").value.trim();
    const reach = $("#fReach").value.trim();
    const chore = $("#fChore").value.trim();
    const hours = $("#fHours").value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reach);

    if (!name || !emailOk || !chore || !hours) {
      error.hidden = false;
      if (!REDUCE) {
        gsap.fromTo(seal, { x: -5 }, { x: 0, duration: 0.4, ease: "elastic.out(1.8, 0.2)", clearProps: "x" });
      }
      return;
    }

    error.hidden = true;
    form.classList.add("is-sent");
    seal.disabled = true;
    received.hidden = false;
    slamStamp($(".stamp--received"), { shakeTarget: form });
    if (!REDUCE) {
      gsap.from("#orderReceived p", { autoAlpha: 0, y: 12, duration: 0.6, delay: 0.25, ease: "power3.out" });
    }
    received.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "nearest" });
  });
}

/* ------------------------------------------------------------
   Anchor scrolling (JS-driven; CSS smooth scrolling is off
   because it interferes with ScrollTrigger's pin refresh)
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

/* ------------------------------------------------------------
   Furniture: tab-away title, console plate
   ------------------------------------------------------------ */
function furniture() {
  const baseTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "COME BACK. THE CHORES WON’T. · FORGE Nº7" : baseTitle;
  });

  console.log(
    "%cFORGE Nº7 — AUTOMATON WORKS%c\n\n" +
      "        ______________\n" +
      "       /              \\__\n" +
      "  ____/   ANVIL Nº7      \\\n" +
      "  \\        ____________  /\n" +
      "   \\______/            \\/\n" +
      "\nYou opened the hood. Naturally.\n" +
      "The machines here are vanilla JS, GSAP, and one honest <canvas>.\n" +
      "No frameworks were harmed. Commission: the form at Plate VII.\n",
    "font-family: Georgia, serif; font-size: 16px; font-weight: 600; color: #E04E0E;",
    "font-family: monospace; font-size: 11px; color: #6A6052;"
  );
}

/* ------------------------------------------------------------
   Ignite
   ------------------------------------------------------------ */
intro();
reveals();
ledger();
stations();
forgeFloor();
works();
gauge();
commission();
anchors();
furniture();

window.addEventListener("load", () => {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
});
