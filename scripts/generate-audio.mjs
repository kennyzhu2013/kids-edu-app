import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const levelsDir = path.join(root, "content/fixtures/levels");
const voiceDir = process.env.PIPER_VOICE_DIR || path.join(os.tmpdir(), "piper-voices");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "qimeng-audio-"));
const piper = process.env.PIPER_BIN || "piper";

const VOICES = {
  zh: {
    file: "zh_CN-huayan-medium.onnx",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx",
  },
  en: {
    file: "en_US-lessac-medium.onnx",
    url: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
  },
};

function ensureVoice(kind) {
  const voice = VOICES[kind];
  const model = path.join(voiceDir, voice.file);
  const config = `${model}.json`;
  if (fs.existsSync(model) && fs.existsSync(config)) return model;
  fs.mkdirSync(voiceDir, { recursive: true });
  execFileSync("curl", ["-fsSL", "-o", model, voice.url], { stdio: "inherit" });
  execFileSync("curl", ["-fsSL", "-o", config, `${voice.url}.json`], { stdio: "inherit" });
  if (!fs.existsSync(model) || fs.statSync(model).size < 1_000_000) {
    throw new Error(`Piper 语音模型没有下完整：${model}`);
  }
  return model;
}

const zhModel = ensureVoice("zh");
const enModel = ensureVoice("en");

function modelFor(text) {
  return /[\u4e00-\u9fff]/.test(text) ? zhModel : enModel;
}

function synthesize(text, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const wav = path.join(tmp, `${Buffer.from(dest).toString("hex").slice(0, 24)}.wav`);
  execFileSync(piper, ["--model", modelFor(text), "--output_file", wav, "--length-scale", "1.15"], {
    input: text,
    stdio: ["pipe", "ignore", "pipe"],
  });
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", wav, "-ar", "22050", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", dest],
    { stdio: "ignore" },
  );
  fs.unlinkSync(wav);
}

function synthesizeGames() {
  const gamesDir = path.join(root, "content/fixtures/games");
  let made = 0;
  const jobs = [];
  for (const name of fs.readdirSync(gamesDir)) {
    if (!name.endsWith(".json")) continue;
    const game = JSON.parse(fs.readFileSync(path.join(gamesDir, name), "utf8"));
    const queue = (text, asset) => {
      if (!text || !asset || !asset.startsWith("/")) return;
      jobs.push([text, path.join(root, "public", asset.slice(1))]);
    };
    queue(game.introScript, game.audioIntro);
    queue(game.promptSpeak, game.promptAudio);
    for (const color of game.colors ?? []) queue(color.speak, color.audio);
    for (const shape of game.shapes ?? []) queue(shape.speak, shape.audio);
    for (const cue of Object.values(game.cues ?? {})) queue(cue.speak, cue.audio);
  }
  for (const [text, dest] of jobs) {
    synthesize(text, dest);
    made += 1;
    console.log(dest.replace(root, ""));
  }
  console.log(`游戏语音 ${made} 条`);
}

function writeWav(file, samples, sampleRate) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }
  fs.writeFileSync(file, buffer);
}

function noise(index) {
  const value = Math.sin(index * 12.9898) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function addMallet(samples, sampleRate, frequency, start, duration, amplitude) {
  const from = Math.floor(start * sampleRate);
  const to = Math.min(samples.length, Math.floor((start + duration) * sampleRate));
  for (let index = from; index < to; index += 1) {
    const time = (index - from) / sampleRate;
    const attack = Math.sin(Math.min(1, time / 0.008) * (Math.PI / 2));
    const envelope = attack * Math.exp(-time * 7.2);
    const tone =
      Math.sin(2 * Math.PI * frequency * time) +
      0.28 * Math.sin(2 * Math.PI * frequency * 2.76 * time) +
      0.08 * noise(index) * Math.exp(-time * 40);
    samples[index] += tone * envelope * amplitude;
  }
}

function synthesizeCues() {
  const sampleRate = 22050;
  const cues = {
    ok: { seconds: 0.72, notes: [[523.25, 0], [659.25, 0.11], [783.99, 0.22]] },
    again: { seconds: 0.55, notes: [[392, 0], [311.13, 0.16]] },
  };
  const dir = path.join(root, "public/audio/sfx");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, cue] of Object.entries(cues)) {
    const samples = new Array(Math.floor(cue.seconds * sampleRate)).fill(0);
    const amplitude = name === "ok" ? 0.55 : 0.42;
    for (const [frequency, start] of cue.notes) addMallet(samples, sampleRate, frequency, start, 0.48, amplitude);
    let peak = 0.001;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    for (let index = 0; index < samples.length; index += 1) samples[index] = (samples[index] / peak) * 0.86;
    const wav = path.join(tmp, `${name}.wav`);
    const dest = path.join(dir, `${name}.mp3`);
    writeWav(wav, samples, sampleRate);
    execFileSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-i", wav, "-ar", "22050", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", dest],
      { stdio: "ignore" },
    );
    fs.unlinkSync(wav);
  }
  console.log("提示音 ok / again");
}

const gamesOnly = process.argv.includes("--games");
const levelsOnly = process.argv.includes("--levels");

if (!levelsOnly) {
  synthesizeCues();
  synthesizeGames();
}

let count = 0;
if (!gamesOnly) for (const name of fs.readdirSync(levelsDir)) {
  if (!name.endsWith(".json")) continue;
  const file = path.join(levelsDir, name);
  const level = JSON.parse(fs.readFileSync(file, "utf8"));
  const introPath = path.join(root, "public", "audio", level.id, "intro.mp3");
  synthesize(level.introScript, introPath);
  level.audioIntro = `/audio/${level.id}/intro.mp3`;
  count += 1;
  for (const step of level.steps ?? []) {
    const line = step.promptSpeak || step.promptText;
    if (!line) continue;
    const stepPath = path.join(root, "public", "audio", level.id, `${step.id}.mp3`);
    synthesize(line, stepPath);
    step.promptAudio = `/audio/${level.id}/${step.id}.mp3`;
    count += 1;
  }
  fs.writeFileSync(file, `${JSON.stringify(level, null, 2)}\n`);
  if (count % 20 === 0) console.log(`已合成 ${count}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
if (!gamesOnly) console.log(`音频 ${count} 条 · 中文 huayan · 英文 lessac`);
