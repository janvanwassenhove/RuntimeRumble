export interface Settings {
  master: number;
  music: number;
  announcer: number;
  reducedShake: boolean;
  difficulty: number;
}
export const defaults: Settings = {
  master: 0.65,
  music: 0.3,
  announcer: 0.65,
  reducedShake: false,
  difficulty: 1,
};
export function loadSettings(): Settings {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem("rumble-settings") || "{}"),
    };
  } catch {
    return { ...defaults };
  }
}
export class AudioEngine {
  ctx?: AudioContext;
  master?: GainNode;
  beat = 0;
  clock = 0;
  active = false;
  intense = false;
  constructor(public settings: Settings) {}
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.master!.gain.value = this.settings.master;
  }
  tone(
    freq: number,
    duration: number,
    type: OscillatorType = "square",
    volume = 0.15,
    slide = 0,
  ) {
    if (!this.ctx || !this.master || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(freq, 15), t);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(15, freq + slide),
      t + duration,
    );
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  noise(duration = 0.15, volume = 0.15) {
    if (!this.ctx || !this.master) return;
    const b = this.ctx.createBuffer(
        1,
        Math.ceil(this.ctx.sampleRate * duration),
        this.ctx.sampleRate,
      ),
      a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++)
      a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
    const s = this.ctx.createBufferSource(),
      g = this.ctx.createGain();
    s.buffer = b;
    g.gain.value = volume;
    s.connect(g);
    g.connect(this.master);
    s.start();
    s.onended = () => {
      s.disconnect();
      g.disconnect();
    };
  }
  hit(heavy = false) {
    this.tone(heavy ? 85 : 240, heavy ? 0.28 : 0.12, "triangle", 0.45, -65);
    this.noise(heavy ? 0.2 : 0.09, heavy ? 0.3 : 0.13);
    this.tone(heavy ? 920 : 1600, 0.09, "sine", 0.08, -400);
  }
  alarm() {
    this.tone(620, 0.18, "square", 0.08, 220);
  }
  quack() {
    this.tone(290, 0.18, "sawtooth", 0.12, -180);
    this.tone(440, 0.13, "triangle", 0.1, -300);
  }
  say(text: string) {
    if (
      !this.ctx ||
      !("speechSynthesis" in window) ||
      this.settings.announcer <= 0 ||
      this.settings.master <= 0
    )
      return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    u.pitch = 0.55;
    u.volume = this.settings.announcer * this.settings.master;
    speechSynthesis.speak(u);
  }
  update(dt: number) {
    if (this.master) this.master.gain.value = this.settings.master;
    if (!this.active || !this.ctx) return;
    this.clock -= dt;
    if (this.clock > 0) return;
    this.clock = this.intense ? 0.125 : 0.15;
    const notes = [55, 55, 82.41, 55, 65.41, 55, 73.42, 49];
    const v = this.settings.music;
    this.tone(notes[Math.floor(this.beat / 2) % 8], 0.16, "sawtooth", v * 0.22);
    if (this.beat % 4 === 0) this.tone(150, 0.19, "sine", v * 0.55, -120);
    if (this.beat % 4 === 2) this.noise(0.08, v * 0.2);
    this.noise(0.022, v * 0.09);
    if (this.beat % 8 === 6)
      this.tone(
        notes[Math.floor(this.beat / 2) % 8] * 8,
        0.15,
        "triangle",
        v * 0.2,
      );
    this.beat++;
  }
}
