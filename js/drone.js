/* ============================================================
   FORGE7 // cursor drone
   A tiny maintenance unit that lives on the operations floor
   (MODULE 01 only - it does not follow you around the site).
   Leave it idle over the console and it performs an inspection.
   Fine pointers only; reduced-motion grounds the fleet.
   ============================================================ */
"use strict";

export function initDrone({ reduceMotion = false, onFeedLine = () => {} } = {}) {
  if (reduceMotion) return null;
  if (!window.matchMedia("(pointer: fine)").matches) return null;
  const zone = document.querySelector("#operations");
  if (!zone) return null;

  const el = document.createElement("div");
  el.className = "drone";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    '<svg viewBox="0 0 24 24">' +
    '<path d="M12 3 19 18 12 14.6 5 18Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle class="drone__core" cx="12" cy="13.4" r="1.7" fill="currentColor"/>' +
    "</svg>";
  document.body.appendChild(el);

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };
  let lastMove = performance.now();
  let lastInspect = 0;
  let patrolTl = null;
  let inspecting = false;
  let inside = false;
  let rot = 0;

  const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });
  gsap.set(el, { x: pos.x, y: pos.y, autoAlpha: 0, scale: 0.5 });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = zone.getBoundingClientRect();
    const within =
      e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    target.x = e.clientX + 18;
    target.y = e.clientY + 22;

    if (within !== inside) {
      inside = within;
      if (inside) {
        // wake up where the cursor enters, then shadow it
        gsap.set(el, { x: target.x + 30, y: target.y + 30 });
        gsap.to(el, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(2)", overwrite: "auto" });
      } else {
        stopPatrol();
        gsap.to(el, { autoAlpha: 0, scale: 0.5, duration: 0.3, overwrite: "auto" });
      }
    }
    if (!inside) return;

    lastMove = performance.now();
    if (inspecting) return;
    stopPatrol();
    xTo(target.x);
    yTo(target.y);
  });

  document.documentElement.addEventListener("pointerleave", () => {
    inside = false;
    stopPatrol();
    gsap.to(el, { autoAlpha: 0, scale: 0.5, duration: 0.4 });
  });

  // bank toward travel direction
  let px = pos.x;
  let py = pos.y;
  gsap.ticker.add(() => {
    const gx = gsap.getProperty(el, "x");
    const gy = gsap.getProperty(el, "y");
    const vx = gx - px;
    const vy = gy - py;
    px = gx;
    py = gy;
    if (Math.abs(vx) + Math.abs(vy) > 0.5) {
      const desired = (Math.atan2(vy, vx) * 180) / Math.PI + 90;
      let delta = desired - rot;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      rot += delta * 0.12;
      gsap.set(el, { rotation: rot });
    }
    maybeIdle();
  });

  function stopPatrol() {
    if (patrolTl) {
      patrolTl.kill();
      patrolTl = null;
    }
  }

  function maybeIdle() {
    if (!inside || inspecting || patrolTl) return;
    if (performance.now() - lastMove < 3500) return;

    const consoleEl = document.querySelector(".console");
    const feedLis = document.querySelectorAll("#opsFeed li");
    const overConsole =
      consoleEl &&
      (() => {
        const r = consoleEl.getBoundingClientRect();
        return target.x > r.left && target.x < r.right && target.y > r.top && target.y < r.bottom;
      })();

    if (overConsole && feedLis.length && performance.now() - lastInspect > 30000) {
      inspect(feedLis[Math.floor(Math.random() * feedLis.length)]);
    } else {
      // little holding-pattern loop around the cursor
      patrolTl = gsap.timeline({ repeat: -1 });
      patrolTl
        .to(el, { x: `+=14`, y: `-=10`, duration: 0.9, ease: "sine.inOut" })
        .to(el, { x: `-=28`, y: `-=6`, duration: 1.1, ease: "sine.inOut" })
        .to(el, { x: `+=14`, y: `+=16`, duration: 0.9, ease: "sine.inOut" });
    }
  }

  function inspect(li) {
    inspecting = true;
    lastInspect = performance.now();
    stopPatrol();
    const r = li.getBoundingClientRect();
    const ix = r.right - 30;
    const iy = r.top + r.height / 2;

    const sparks = Array.from({ length: 3 }, () => {
      const s = document.createElement("i");
      s.className = "drone__spark";
      document.body.appendChild(s);
      gsap.set(s, { x: ix, y: iy, autoAlpha: 0 });
      return s;
    });

    gsap
      .timeline({
        onComplete: () => {
          sparks.forEach((s) => s.remove());
          inspecting = false;
          lastMove = performance.now(); // settle, don't immediately re-inspect
        },
      })
      .to(el, { x: ix, y: iy, duration: 0.8, ease: "power2.inOut" })
      .to(el, { rotation: "+=360", duration: 0.6, ease: "power1.inOut" })
      .add(() => {
        onFeedLine("DRN-7", "cursor drone performed inspection", "nothing to fix ✓");
        sparks.forEach((s, i) =>
          gsap
            .timeline()
            .to(s, { autoAlpha: 1, duration: 0.05, delay: i * 0.06 })
            .to(s, {
              x: ix + (Math.random() - 0.5) * 36,
              y: iy - 10 - Math.random() * 18,
              autoAlpha: 0,
              duration: 0.5,
              ease: "power2.out",
            })
        );
      })
      .to(el, { x: () => target.x, y: () => target.y, duration: 0.7, ease: "power2.inOut" }, "+=0.35");
  }

  return el;
}
