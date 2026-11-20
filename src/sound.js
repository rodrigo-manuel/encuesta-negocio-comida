let ctx;
let silenciado = false;

try {
  silenciado = localStorage.getItem("silenciado") === "1";
} catch {
  // sin almacenamiento disponible
}

export const isMuted = () => silenciado;

export function setMuted(v) {
  silenciado = v;
  try {
    localStorage.setItem("silenciado", v ? "1" : "0");
  } catch {
    // sin almacenamiento disponible
  }
}

export function haptic(ms = 12) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    // no soportado
  }
}

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = "sine", vol = 0.15) {
  if (silenciado) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = c.currentTime + start;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    // audio no disponible
  }
}

export const playPop = () => tone(620, 0, 0.12, "triangle");

export const playSelect = () => {
  tone(520, 0, 0.08, "sine");
  tone(780, 0.06, 0.1, "sine");
};

export const playSuccess = () => {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.25, "sine", 0.18));
};

export const playError = () => {
  tone(220, 0, 0.15, "sawtooth", 0.08);
  tone(160, 0.1, 0.2, "sawtooth", 0.08);
};