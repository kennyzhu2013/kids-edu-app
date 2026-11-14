import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const levelsDir = path.join(root, "content/fixtures/levels");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "qimeng-audio-"));

function voiceFor(text) {
  return /[\u4e00-\u9fff]/.test(text) ? "cmn+f3" : "en-us+f3";
}

function synthesize(text, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const wav = path.join(tmp, `${path.basename(dest)}.wav`);
  execFileSync("espeak-ng", ["-v", voiceFor(text), "-s", "122", "-p", "58", "-w", wav, text], { stdio: "ignore" });
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", wav, "-ar", "22050", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "48k", dest],
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
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`音频 ${count} 条`);
