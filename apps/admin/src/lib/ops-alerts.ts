let audioCtx: AudioContext | null = null;
let lastCritical = 0;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playAlertTone(kind: 'critical' | 'warning' = 'critical') {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = kind === 'critical' ? 880 : 660;
  gain.gain.value = 0.08;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.stop(ctx.currentTime + 0.3);
}

export function checkCriticalAlert(criticalCount: number, soundEnabled: boolean) {
  if (!soundEnabled) {
    lastCritical = criticalCount;
    return;
  }
  if (criticalCount > lastCritical && criticalCount > 0) {
    playAlertTone('critical');
  }
  lastCritical = criticalCount;
}
