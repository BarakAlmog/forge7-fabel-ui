/* ============================================================
   FORGE7 // sound deck
   Fully synthesized WebAudio - no samples, no requests.
   Muted by default; the toggle in the console bar wakes it.
   ============================================================ */
"use strict";

const STORE_KEY = "forge7-sound";

export class SoundDeck {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.master = null;
    this.hum = null;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setEnabled(on) {
    this.enabled = on;
    localStorage.setItem(STORE_KEY, on ? "1" : "0");
    if (on) this._ensure();
    else this.stopHum();
  }

  static wantsSound() {
    return localStorage.getItem(STORE_KEY) === "1";
  }

  _tone({ freq = 440, end = freq, dur = 0.08, type = "sine", gain = 0.05, delay = 0 }) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  /* a console line lands */
  blip() {
    this._tone({ freq: 1150 + Math.random() * 250, end: 740, dur: 0.045, type: "square", gain: 0.012 });
  }

  /* drill: step, push, blocked, solved */
  tick() {
    this._tone({ freq: 640, end: 500, dur: 0.03, type: "triangle", gain: 0.025 });
  }
  clink() {
    this._tone({ freq: 330, end: 165, dur: 0.09, type: "triangle", gain: 0.05 });
    this._tone({ freq: 1500, end: 950, dur: 0.04, type: "sine", gain: 0.02, delay: 0.006 });
  }
  thud() {
    this._tone({ freq: 120, end: 55, dur: 0.12, type: "sine", gain: 0.07 });
  }
  win() {
    [392, 523, 659].forEach((f, i) =>
      this._tone({ freq: f, dur: 0.13, type: "triangle", gain: 0.04, delay: i * 0.09 })
    );
  }

  /* overdrive engage */
  sweep() {
    this._tone({ freq: 180, end: 1400, dur: 0.5, type: "sawtooth", gain: 0.028 });
  }

  /* whack-a-task: the percussion section */
  whack() {
    this._tone({ freq: 190, end: 65, dur: 0.07, type: "square", gain: 0.07 });
    this._tone({ freq: 950, end: 700, dur: 0.018, type: "sine", gain: 0.03 });
  }
  splat() {
    this._tone({ freq: 720, end: 130, dur: 0.1, type: "sawtooth", gain: 0.045 });
  }
  clang() {
    this._tone({ freq: 330, end: 300, dur: 0.09, type: "triangle", gain: 0.05 });
    this._tone({ freq: 495, end: 470, dur: 0.07, type: "triangle", gain: 0.03, delay: 0.004 });
  }
  sad() {
    // two-note trombone of shame
    this._tone({ freq: 392, end: 370, dur: 0.16, type: "sawtooth", gain: 0.035 });
    this._tone({ freq: 311, end: 280, dur: 0.3, type: "sawtooth", gain: 0.035, delay: 0.17 });
  }
  jackpot() {
    [523, 659, 784, 1046].forEach((f, i) =>
      this._tone({ freq: f, dur: 0.09, type: "square", gain: 0.03, delay: i * 0.06 })
    );
  }
  comboUp() {
    this._tone({ freq: 600, end: 1300, dur: 0.09, type: "triangle", gain: 0.035 });
  }
  alarm() {
    // two-tone whoop, rising panic
    this._tone({ freq: 620, end: 930, dur: 0.22, type: "square", gain: 0.025 });
    this._tone({ freq: 930, end: 620, dur: 0.22, type: "square", gain: 0.025, delay: 0.24 });
  }
  meltdown() {
    this._tone({ freq: 420, end: 48, dur: 0.7, type: "sawtooth", gain: 0.05 });
    this._tone({ freq: 96, end: 40, dur: 0.5, type: "sine", gain: 0.06, delay: 0.15 });
  }

  /* low forge drone while the gate is on screen */
  startHum() {
    if (!this.enabled || !this.ctx || this.hum) return;
    const t = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    o1.type = "sawtooth";
    o1.frequency.value = 55;
    o2.type = "sine";
    o2.frequency.value = 110.3; // slight detune against o1's harmonic - it breathes
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.016, t + 1.2);
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 0.006;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    o1.connect(g);
    o2.connect(g);
    g.connect(this.master);
    o1.start(t);
    o2.start(t);
    lfo.start(t);
    this.hum = { o1, o2, lfo, g };
  }

  stopHum() {
    if (!this.hum || !this.ctx) return;
    const { o1, o2, lfo, g } = this.hum;
    const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    [o1, o2, lfo].forEach((o) => o.stop(t + 0.7));
    this.hum = null;
  }
}
