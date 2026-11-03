export class AudioEngine {
  constructor() {
    this.enabled = true;
    try { this.enabled = localStorage.getItem('eter_audio') !== 'off'; } catch {}
    this.ctx = null;
  }
  unlock() {
    if (!this.enabled) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {}
  }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('eter_audio', this.enabled ? 'on' : 'off'); } catch {}
    if (this.enabled) this.unlock();
    return this.enabled;
  }
  play(type) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;
    const settings = { slash:[210,90,.07,'sawtooth'], bolt:[670,310,.12,'sine'], hit:[110,75,.045,'triangle'], pickup:[620,860,.07,'sine'], level:[460,900,.28,'triangle'], death:[280,60,.36,'triangle'] };
    const [from,to,duration,wave] = settings[type] || settings.pickup;
    try {
      const osc=this.ctx.createOscillator(), gain=this.ctx.createGain(), now=this.ctx.currentTime;
      osc.type=wave;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+duration);
      gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.025,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(gain);gain.connect(this.ctx.destination);osc.start(now);osc.stop(now+duration+.012);
    } catch {}
  }
}
