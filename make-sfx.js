// يولّد مؤثرات صوتية بسيطة (WAV) داخل مجلد public — بلا أي مكتبات.
const fs = require("fs");
const SR = 44100;
fs.mkdirSync("public", {recursive: true});

const wav = (name, samples) => {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(`public/${name}.wav`, Buffer.concat([h, data]));
  console.log("public/" + name + ".wav");
};
const make = (sec, fn) => Array.from({length: Math.floor(sec * SR)}, (_, i) => fn(i / SR, i));
const tone = (t, f) => Math.sin(2 * Math.PI * f * t);
const rnd = () => Math.random() * 2 - 1;

// نقرة قصيرة
wav("tick", make(0.06, (t) => tone(t, 1900) * Math.exp(-t * 90) * 0.8));
// ضربة اللمس
wav("tap", make(0.25, (t) => (tone(t, 150 - t * 200) * Math.exp(-t * 18) + rnd() * Math.exp(-t * 200) * 0.4) * 0.9));
// رنّة خفيفة
wav("ding", make(0.9, (t) => (tone(t, 880) + 0.5 * tone(t, 1320)) * Math.exp(-t * 6) * 0.5));
// حركة قلم البلوتر: ضجيج مرشّح مع اهتزاز بطيء
let prev = 0, lp = 0;
wav("pen", make(2.4, (t) => {
  const n = rnd(); const hp = n - prev; prev = n; lp += (hp - lp) * 0.35;
  return lp * (0.35 + 0.25 * Math.sin(2 * Math.PI * 9 * t)) * Math.min(1, t * 8) * Math.min(1, (2.4 - t) * 8);
}));
// ووش: ضجيج يتصاعد ثم يخفت
let l2 = 0;
wav("whoosh", make(0.8, (t) => {
  const a = Math.sin(Math.PI * Math.min(1, t / 0.8)) ** 2;
  l2 += (rnd() - l2) * (0.02 + 0.25 * (t / 0.8));
  return l2 * a * 2.2;
}));
// خاتمة: ثلاث نغمات صاعدة
wav("chime", make(1.6, (t) => {
  let v = 0;
  [[660, 0], [880, 0.12], [1320, 0.24]].forEach(([f, d]) => {
    if (t >= d) v += tone(t, f) * Math.exp(-(t - d) * 4) * 0.35;
  });
  return v;
}));
