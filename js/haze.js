/* ============================================================
   FORGE7 // heat haze
   "WHILE YOU SLEEP" rendered to canvas and displaced in thin
   slices - a heat shimmer that intensifies on hover. Canvas 2D
   on purpose: no second WebGL context for one effect.
   ============================================================ */
"use strict";

const TEXT = "WHILE YOU SLEEP";

export function initHaze({ reduceMotion = false } = {}) {
  const big = document.getElementById("sleepBig");
  const shout = document.querySelector(".foot__shout");
  if (!big || !shout) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "haze";
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // hide the DOM glyphs but keep their layout box; the canvas child
  // re-enables its own visibility
  big.style.visibility = "hidden";
  const domFill = big.querySelector(".foot__fill");
  if (domFill) domFill.style.display = "none";
  big.appendChild(canvas);

  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");

  let w = 0;
  let h = 0;
  let pad = 0;
  let dpr = 1;
  let progress = 0;
  let amp = 0;
  let ampTarget = 0;
  let baseAmp = reduceMotion ? 0 : 1.1;
  let visible = false;
  let rafId = 0;
  let t = 0;
  let lastTs = 0;

  function drawSource() {
    const r = big.getBoundingClientRect();
    if (r.width === 0) return;
    offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    offCtx.clearRect(0, 0, w, h);
    let fontPx = r.height * 1.02;
    offCtx.font = `700 ${fontPx}px "Space Grotesk", "Helvetica Neue", sans-serif`;
    const tw = offCtx.measureText(TEXT).width;
    const maxW = w - pad * 1.2;
    if (tw > maxW) {
      fontPx *= maxW / tw;
      offCtx.font = `700 ${fontPx}px "Space Grotesk", "Helvetica Neue", sans-serif`;
    }
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    const cx = w / 2;
    const cy = h / 2 + fontPx * 0.04;

    offCtx.lineWidth = 1.4;
    offCtx.strokeStyle = "rgba(232, 244, 238, 0.5)";
    offCtx.strokeText(TEXT, cx, cy);

    if (progress > 0.001) {
      offCtx.save();
      offCtx.beginPath();
      offCtx.rect(0, 0, w * progress, h);
      offCtx.clip();
      offCtx.shadowColor = "rgba(61, 255, 192, 0.45)";
      offCtx.shadowBlur = 34;
      offCtx.fillStyle = "#3DFFC0";
      offCtx.fillText(TEXT, cx, cy);
      offCtx.restore();
    }
  }

  function blit(now) {
    const dt = Math.min((now - lastTs) / 1000 || 0.016, 0.05);
    lastTs = now;
    t += dt;
    amp += (ampTarget - amp) * 0.07;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (amp < 0.05) {
      ctx.drawImage(off, 0, 0);
      return;
    }
    const sliceH = Math.max(2, Math.round(2.5 * dpr));
    for (let y = 0; y < canvas.height; y += sliceH) {
      const k = y / dpr;
      const dx =
        (Math.sin(k * 0.05 + t * 2.6) + Math.sin(k * 0.013 - t * 1.2) * 0.65) * amp * dpr;
      ctx.drawImage(off, 0, y, canvas.width, sliceH, dx, y, canvas.width, sliceH);
    }
  }

  function frame(now) {
    rafId = visible && !reduceMotion ? requestAnimationFrame(frame) : 0;
    blit(now);
  }

  function measure() {
    const r = big.getBoundingClientRect();
    if (r.width === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    pad = Math.ceil(r.height * 0.5);
    w = Math.ceil(r.width + pad * 2);
    h = Math.ceil(r.height + pad * 2);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = `${-pad}px`;
    canvas.style.top = `${-pad}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    off.width = canvas.width;
    off.height = canvas.height;
    drawSource();
    blit(performance.now());
  }

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    ampTarget = visible ? baseAmp : 0;
    if (visible && !rafId && !reduceMotion) {
      lastTs = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  }).observe(shout);

  shout.addEventListener("pointerenter", () => (ampTarget = reduceMotion ? 0 : 6.5));
  shout.addEventListener("pointerleave", () => (ampTarget = baseAmp));
  shout.addEventListener("pointerdown", () => {
    if (reduceMotion) return;
    ampTarget = 6.5;
    setTimeout(() => (ampTarget = visible ? baseAmp : 0), 1600);
  });

  window.addEventListener("resize", measure);
  document.fonts.ready.then(measure);
  measure();

  return {
    setProgress(p) {
      progress = p;
      drawSource();
      if (!rafId) blit(performance.now());
    },
  };
}
