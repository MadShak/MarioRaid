var MK = window.MK = window.MK || {};

MK.Audio = (function () {
  let ctx = null;
  let master = null;
  let engineOsc = null;
  let engineGain = null;
  let unlocked = false;
  let muted = false;

  function ensureContext() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    const c = ensureContext();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    unlocked = true;
  }

  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('mousedown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });

  function noiseBuffer(duration) {
    const c = ensureContext();
    const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function tone(freqStart, freqEnd, duration, type, gainValue) {
    const c = ensureContext();
    if (!c || muted) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), c.currentTime + duration);
    gain.gain.setValueAtTime(gainValue, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain).connect(master);
    osc.start();
    osc.stop(c.currentTime + duration + 0.02);
  }

  function burst(duration, gainValue, filterFreq) {
    const c = ensureContext();
    if (!c || muted) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(duration);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, c.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, c.currentTime + duration);
    const gain = c.createGain();
    gain.gain.setValueAtTime(gainValue, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    src.connect(filter).connect(gain).connect(master);
    src.start();
  }

  const effects = {
    shoot() {
      tone(900, 380, 0.09, 'square', 0.18);
    },
    explosion() {
      burst(0.45, 0.5, 2200);
      tone(160, 40, 0.35, 'sawtooth', 0.2);
    },
    crash() {
      burst(0.7, 0.6, 1400);
      tone(120, 30, 0.6, 'sawtooth', 0.3);
    },
    fuel() {
      tone(440, 880, 0.18, 'triangle', 0.2);
      setTimeout(() => tone(660, 1320, 0.16, 'triangle', 0.18), 90);
    },
    bridge() {
      burst(0.5, 0.55, 1800);
    },
    start() {
      tone(300, 900, 0.25, 'triangle', 0.22);
    },
    gameover() {
      tone(500, 90, 0.9, 'sawtooth', 0.25);
    },
    hit() {
      tone(220, 90, 0.15, 'square', 0.2);
    },
  };

  function play(name) {
    const fn = effects[name];
    if (fn) fn();
  }

  function startEngine() {
    const c = ensureContext();
    if (!c || engineOsc) return;
    engineOsc = c.createOscillator();
    const sub = c.createOscillator();
    engineGain = c.createGain();
    engineGain.gain.value = 0.06;
    engineOsc.type = 'sawtooth';
    sub.type = 'triangle';
    engineOsc.frequency.value = 90;
    sub.frequency.value = 45;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    engineOsc.connect(filter);
    sub.connect(filter);
    filter.connect(engineGain).connect(master);
    engineOsc.start();
    sub.start();
    engineOsc._sub = sub;
  }

  function updateEngine(intensity) {
    if (!engineOsc || !ctx) return;
    const f = 80 + MK.clamp(intensity, 0, 1) * 70;
    engineOsc.frequency.setTargetAtTime(f, ctx.currentTime, 0.08);
    engineOsc._sub.frequency.setTargetAtTime(f / 2, ctx.currentTime, 0.08);
    engineGain.gain.setTargetAtTime(muted ? 0 : 0.05 + intensity * 0.05, ctx.currentTime, 0.1);
  }

  function stopEngine() {
    if (!engineOsc) return;
    try {
      engineOsc.stop();
      engineOsc._sub.stop();
    } catch (e) {
      /* already stopped */
    }
    engineOsc = null;
    engineGain = null;
  }

  function setMuted(value) {
    muted = value;
    if (master) master.gain.value = muted ? 0 : 0.35;
  }

  function isMuted() {
    return muted;
  }

  return { play, startEngine, updateEngine, stopEngine, setMuted, isMuted, unlock };
})();
