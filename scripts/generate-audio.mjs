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

let count = 0;
for (const name of fs.readdirSync(levelsDir)) {
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
console.log(`音频 ${count} 条 · 中文 huayan · 英文 lessac`);
