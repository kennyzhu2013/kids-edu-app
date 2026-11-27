/** Shared children's illustration parts. Warm outlines, ages 3–6. */

export const INK = "#5c4036";

export function frame(w, h, body) {
  const radius = Math.min(32, Math.round(w / 7));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">\n<rect width="${w}" height="${h}" rx="${radius}" fill="#fff3da"/>\n${body}\n</svg>\n`;
}

export function icon(sprite, w = 88, h = 88, s = 0.82) {
  return frame(
    w,
    h,
    `<ellipse cx="${w / 2}" cy="${h - 11}" rx="${Math.round(w * 0.24)}" ry="5" fill="#f0dcc4"/>
<g transform="translate(${w / 2} ${Math.round(h / 2 + 1)}) scale(${s})">${sprite}</g>`,
  );
}

export function stage(content) {
  return frame(
    280,
    168,
    `<rect y="122" width="280" height="46" fill="#f8e7cf"/>
<ellipse cx="140" cy="124" rx="108" ry="10" fill="#f0d4b4"/>
${content}`,
  );
}

function ink(width = 2.5) {
  return `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
}

export function mia(pose = "wave") {
  const bow = `<g transform="translate(16 -42)">
<path d="M0 2c-9-7-15-2-15 2s7 7 15 2z" fill="#ff8ad4" ${ink(2)}/>
<path d="M0 2c9-7 15-2 15 2s-7 7-15 2z" fill="#ffb0e4" ${ink(2)}/>
<circle r="3.2" cy="2" fill="#ff6b4a" ${ink(1.6)}/>
</g>`;
  const face = `<circle cx="0" cy="-18" r="18" fill="#ffd0b8" ${ink()}/>
<path d="M-16 -24c2-14 32-16 34 0-10-8-26-8-34 0z" fill="#6b4638"/>
<path d="M-10 -30c8-6 16-4 20 0" stroke="#6b4638" stroke-width="6" fill="none" stroke-linecap="round"/>
${bow}
<ellipse cx="-6.5" cy="-18" rx="2.8" ry="3.4" fill="#3b2a24"/>
<ellipse cx="6.5" cy="-18" rx="2.8" ry="3.4" fill="#3b2a24"/>
<circle cx="-5.6" cy="-19.2" r="1.05" fill="#fff"/>
<circle cx="7.4" cy="-19.2" r="1.05" fill="#fff"/>
<path d="M-5 -11c3 4 8 4 11 0" stroke="#e07a62" stroke-width="2.1" fill="none" stroke-linecap="round"/>
<ellipse cx="-12" cy="-14" rx="2.8" ry="1.7" fill="#ffb199"/>
<ellipse cx="12" cy="-14" rx="2.8" ry="1.7" fill="#ffb199"/>`;
  const dress = `<path d="M-16 -2c-1 18 4 28 16 28s17-10 16-28c-8 7-26 7-32 0z" fill="#ff6b4a" ${ink()}/>
<circle cx="-7" cy="12" r="2.2" fill="#ffc44d"/>
<circle cx="6" cy="16" r="2.2" fill="#ffc44d"/>`;
  const legs = `<path d="M-6 26c-1 14-1 20-1 24M8 26c1 14 1 20 1 24" stroke="#ffd0b8" stroke-width="7" stroke-linecap="round"/>
<path d="M-6 26c-1 14-1 20-1 24M8 26c1 14 1 20 1 24" stroke="#5c4036" stroke-width="2.2" stroke-linecap="round"/>`;
  let limbs = `${legs}
<path d="M-16 8c-10 8-12 16-6 18" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  if (pose === "wave") {
    limbs += `<path d="M14 2c14-20 30-16 30-2" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="44" cy="-2" r="6.2" fill="#ffd0b8" ${ink(2)}/>`;
  } else if (pose === "bye") {
    limbs = `${legs}
<path d="M-18 0c-16 8-18 18-10 24" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="-28" cy="26" r="6" fill="#ffd0b8" ${ink(2)}/>
<path d="M16 6c10-2 14 4 12 10" stroke="#ffd0b8" stroke-width="6.5" fill="none" stroke-linecap="round"/>`;
  } else if (pose === "sit") {
    limbs = `<path d="M-20 18c-8 10-4 18 8 18h24c14 0 16-10 6-18z" fill="#ff6b4a" ${ink()}/>
<path d="M-18 8c-8 6-8 12-2 14" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M16 10c8 4 10 10 4 12" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  } else if (pose === "jump") {
    limbs = `<path d="M-12 20c-10 8-8 16 2 14M12 18c10 6 8 16-4 14" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M-12 20c-10 8-8 16 2 14M12 18c10 6 8 16-4 14" stroke="#5c4036" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M-18 2c-12-10-14-2-10 6" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M14 -2c12-16 26-12 24 2" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<circle cx="38" cy="-2" r="5.6" fill="#ffd0b8" ${ink(2)}/>`;
  } else if (pose === "run") {
    limbs = `<path d="M-14 18c-14 6-10 16 2 12M12 16c12 4 16 12 4 16" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M-14 18c-14 6-10 16 2 12M12 16c12 4 16 12 4 16" stroke="#5c4036" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<path d="M-16 6c-12 2-14 10-8 14" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M16 4c12-8 22-2 20 6" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M-28 4h-10M-26 12h-8" stroke="#ffc44d" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    limbs += `<path d="M16 8c8 8 8 14 2 16" stroke="#ffd0b8" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  }
  return `<g>${limbs}${dress}${face}</g>`;
}

export function xiaoya(pose = "idle") {
  const eyes =
    pose === "happy"
      ? `<path d="M-12 0c2.4 3.2 5 3.2 7.2 0" stroke="#3b2a24" stroke-width="2.3" fill="none" stroke-linecap="round"/>
<path d="M4 0c2.4 3.2 5 3.2 7.2 0" stroke="#3b2a24" stroke-width="2.3" fill="none" stroke-linecap="round"/>
<path d="M-6 8c4 5 12 5 16 0" stroke="#e07a62" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-8" cy="2" r="2.8" fill="#3b2a24"/>
<circle cx="8" cy="2" r="2.8" fill="#3b2a24"/>
<circle cx="-7.1" cy="1" r="1" fill="#fff"/>
<circle cx="8.9" cy="1" r="1" fill="#fff"/>
<path d="M-5 9c3.2 3.6 8 3.6 11 0" stroke="#e07a62" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const arm =
    pose === "wave"
      ? `<path d="M18 6c10-6 18-16 12-24" stroke="#ffd7bf" stroke-width="6.5" fill="none" stroke-linecap="round"/>
<circle cx="28" cy="-20" r="5.2" fill="#ffd7bf" ${ink(2)}/>`
      : `<path d="M18 12c10 4 14 12 8 16" stroke="#ffd7bf" stroke-width="6.5" fill="none" stroke-linecap="round"/>
<circle cx="26" cy="30" r="5.2" fill="#ffd7bf" ${ink(2)}/>`;
  return `<g>
${arm}
<path d="M0 -24c-5-16-22-22-28-12 8 3 18 8 28 12z" fill="#1fa97a" stroke="#146b48" stroke-width="2" stroke-linejoin="round"/>
<path d="M0 -24c5-16 22-22 28-12-8 3-18 8-28 12z" fill="#3dcb7a" stroke="#1a8a62" stroke-width="2" stroke-linejoin="round"/>
<path d="M0 -20v12" stroke="#146b48" stroke-width="3.2" stroke-linecap="round"/>
<circle cy="14" r="26" fill="#fff8ef" ${ink()}/>
<circle cx="-13" cy="18" r="4.2" fill="#ffb199"/>
<circle cx="13" cy="18" r="4.2" fill="#ffb199"/>
<g transform="translate(0 12)">${eyes}</g>
</g>`;
}

export function apple(fill = "#ff5a5a") {
  const leaf = fill === "#ffc83d" ? "#e0a030" : "#c43c3c";
  return `<g>
<path d="M0 -20c16 0 26 14 26 28 0 16-12 26-26 26S-26 24-26 8C-26 -8-14-20 0-20z" fill="${fill}" stroke="${leaf}" stroke-width="2.5"/>
<ellipse cx="-8" cy="0" rx="7" ry="10" fill="#fff" opacity="0.28"/>
<path d="M-1 -20c2-10 9-14 13-11" stroke="#6b4638" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<path d="M-1 -18c9-9 18-3 20 3-9 0-15 0-20-3z" fill="#2eaf68" stroke="#1a8a62" stroke-width="1.6" stroke-linejoin="round"/>
</g>`;
}

export function ball(fill) {
  return `<g>
<circle cy="2" r="24" fill="${fill}" ${ink()}/>
<path d="M-20 6c4-16 36-16 40 0" stroke="#fff" stroke-width="3.5" fill="none" opacity="0.4"/>
<ellipse cx="-8" cy="-8" rx="7" ry="4.5" fill="#fff" opacity="0.62"/>
</g>`;
}

export function swatch(fill) {
  return `<g>
<rect x="-18" y="-26" width="36" height="42" rx="9" fill="${fill}" ${ink()}/>
<rect x="-12" y="-18" width="14" height="8" rx="3" fill="#fff" opacity="0.45"/>
<path d="M8 16c8 8 4 16-2 18" stroke="${fill}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M8 16c8 8 4 16-2 18" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
</g>`;
}

export function star() {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? 26 : 11;
    const angle = -Math.PI / 2 + i * (Math.PI / 5);
    points.push(`${(Math.cos(angle) * radius).toFixed(1)},${(Math.sin(angle) * radius + 2).toFixed(1)}`);
  }
  return `<g>
<polygon points="${points.join(" ")}" fill="#ffc44d" ${ink()}/>
<ellipse cx="-6" cy="-4" rx="5" ry="3" fill="#fff" opacity="0.45"/>
</g>`;
}

export function cat() {
  return `<g>
<path d="M14 16c12 2 16-8 8-14" stroke="#ffb067" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M14 16c12 2 16-8 8-14" ${ink(2)} fill="none"/>
<ellipse cx="0" cy="16" rx="18" ry="14" fill="#ffb067" ${ink()}/>
<circle cy="-4" r="16" fill="#ffb067" ${ink()}/>
<path d="M-14 -12l-8-16 14 8z" fill="#ffb067" ${ink()}/>
<path d="M14 -12l8-16-14 8z" fill="#ffb067" ${ink()}/>
<path d="M-14 -14l-3-8 7 4z" fill="#ffb7c8"/>
<path d="M14 -14l3-8-7 4z" fill="#ffb7c8"/>
<path d="M-4 -16c2 3 6 3 8 0" stroke="#e0894a" stroke-width="2" fill="none" stroke-linecap="round"/>
<ellipse cx="-6" cy="-4" rx="2.4" ry="3.1" fill="#3b2a24"/>
<ellipse cx="6" cy="-4" rx="2.4" ry="3.1" fill="#3b2a24"/>
<circle cx="-5.2" cy="-5" r="0.9" fill="#fff"/>
<circle cx="6.8" cy="-5" r="0.9" fill="#fff"/>
<path d="M0 0l-2.2 2.4h4.4z" fill="#e07a62"/>
<path d="M0 3c-4 3-7 2-9 0M0 3c4 3 7 2 9 0" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M-10 1h-12M-10 5h-11M10 1h12M10 5h11" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>
</g>`;
}

export function dog() {
  return `<g>
<ellipse cx="-16" cy="2" rx="8" ry="12" fill="#e0a36a" ${ink()}/>
<ellipse cx="16" cy="2" rx="8" ry="12" fill="#e0a36a" ${ink()}/>
<ellipse cx="-16" cy="4" rx="4" ry="7" fill="#f0c39a"/>
<ellipse cx="16" cy="4" rx="4" ry="7" fill="#f0c39a"/>
<circle cy="2" r="18" fill="#f0b56a" ${ink()}/>
<ellipse cy="10" rx="8" ry="6" fill="#fff8ef"/>
<ellipse cx="-6" cy="-2" rx="2.5" ry="3.2" fill="#3b2a24"/>
<ellipse cx="6" cy="-2" rx="2.5" ry="3.2" fill="#3b2a24"/>
<circle cx="-5.2" cy="-3.1" r="0.9" fill="#fff"/>
<circle cx="6.8" cy="-3.1" r="0.9" fill="#fff"/>
<ellipse cy="8" rx="3.2" ry="2.4" fill="#5c4036"/>
<path d="M0 11c3 4 6 3 7 0" fill="#e07a62"/>
<path d="M-14 14c-6 10-2 16 6 12" stroke="#e0a36a" stroke-width="5" fill="none" stroke-linecap="round"/>
</g>`;
}

export function bird() {
  return `<g>
<ellipse cx="-2" cy="8" rx="16" ry="13" fill="#ffc44d" ${ink()}/>
<path d="M-6 6c-14 2-18 12-8 14 6-6 12-8 8-14z" fill="#f0a020" ${ink(2)}/>
<circle cx="6" cy="-6" r="11" fill="#ffc44d" ${ink()}/>
<path d="M4 -16c4-8 10-8 12-2-6 1-10 2-12 2z" fill="#ff6b4a" ${ink(2)}/>
<path d="M12 -4l12-2-12 6z" fill="#ff6b4a" ${ink(2)}/>
<circle cx="9" cy="-7" r="2.2" fill="#3b2a24"/>
<circle cx="9.7" cy="-7.7" r="0.8" fill="#fff"/>
<path d="M-8 20c2 4 6 4 8 0M2 20c2 4 6 4 8 0" stroke="#e0894a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
</g>`;
}

export function fish() {
  return `<g>
<path d="M18 2l16-12v24z" fill="#3d94f5" ${ink()}/>
<ellipse cx="-2" cy="2" rx="22" ry="14" fill="#4aa3ff" ${ink()}/>
<path d="M-8 2c6-8 16-8 22 0" stroke="#7ec8ff" stroke-width="3" fill="none" opacity="0.8"/>
<path d="M-2 -12c4-8 10-6 8 2" fill="#7ec8ff" ${ink(2)}/>
<circle cx="-12" cy="0" r="3" fill="#fff"/>
<circle cx="-11" cy="0" r="1.6" fill="#3b2a24"/>
<path d="M-6 8c3 3 8 3 11 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.8"/>
<circle cx="20" cy="-18" r="2.2" fill="#fff" opacity="0.8"/>
<circle cx="28" cy="-10" r="1.4" fill="#fff" opacity="0.7"/>
</g>`;
}

function moodFace(mood) {
  let brows = "";
  let eyes = `<ellipse cx="-7" cy="-2" rx="2.8" ry="3.3" fill="#3b2a24"/>
<ellipse cx="7" cy="-2" rx="2.8" ry="3.3" fill="#3b2a24"/>
<circle cx="-6.1" cy="-3.1" r="1" fill="#fff"/>
<circle cx="7.9" cy="-3.1" r="1" fill="#fff"/>`;
  let mouth = `<path d="M-7 8c4 5 10 5 14 0" stroke="#e07a62" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
  let extra = `<ellipse cx="-12" cy="4" rx="3" ry="1.8" fill="#ffb199"/><ellipse cx="12" cy="4" rx="3" ry="1.8" fill="#ffb199"/>`;
  if (mood === "sad") {
    brows = `<path d="M-12 -10c3 2 6 2 8 0M4 -10c2 2 5 2 8 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    mouth = `<path d="M-7 12c4-5 10-5 14 0" stroke="#7eb6ff" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
    extra = `<path d="M12 2c1 6 1 8 0 12" stroke="#7eb6ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<circle cx="12" cy="16" r="1.6" fill="#7eb6ff"/>`;
  } else if (mood === "angry") {
    brows = `<path d="M-13 -8l8 4M13 -8l-8 4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
    mouth = `<path d="M-6 10h12" stroke="#e07a62" stroke-width="2.6" stroke-linecap="round"/>`;
    extra = `<path d="M16 -18c4 2 6 2 8-2" stroke="#ffb199" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else if (mood === "scared") {
    eyes = `<circle cx="-7" cy="-2" r="4" fill="#fff" ${ink(2)}/><circle cx="7" cy="-2" r="4" fill="#fff" ${ink(2)}/>
<circle cx="-7" cy="-1" r="2" fill="#3b2a24"/><circle cx="7" cy="-1" r="2" fill="#3b2a24"/>`;
    mouth = `<ellipse cx="0" cy="10" rx="3.2" ry="4" fill="#e07a62"/>`;
    extra = "";
  } else if (mood === "closed") {
    eyes = `<path d="M-12 -2c3 3 6 3 9 0M3 -2c3 3 6 3 9 0" stroke="${INK}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`;
    mouth = `<path d="M-5 8c3 3 7 3 10 0" stroke="#e07a62" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  }
  return `<g>
<circle r="26" fill="#ffd0b8" ${ink()}/>
<path d="M-22 -6c2-18 42-18 44 2-12-10-34-10-44-2z" fill="#6b4638"/>
${brows}${eyes}${mouth}${extra}
</g>`;
}

export function happy() {
  return moodFace("happy");
}
export function sad() {
  return moodFace("sad");
}
export function angry() {
  return moodFace("angry");
}
export function scared() {
  return moodFace("scared");
}
export function eyesClosed() {
  return moodFace("closed");
}

export function feelings() {
  return `<g>
<g transform="translate(-16 -12) scale(0.42)">${happy()}</g>
<g transform="translate(16 -12) scale(0.42)">${sad()}</g>
<g transform="translate(-16 16) scale(0.42)">${angry()}</g>
<g transform="translate(16 16) scale(0.42)">${scared()}</g>
</g>`;
}

function grownHair(kind) {
  if (kind === "dad") return `<path d="M-16 -22h32v8c-4-4-28-4-32-8z" fill="#4a342c"/>`;
  if (kind === "mom") {
    return `<path d="M-18 -16c2-16 34-16 36 2-8-8-28-8-36-2z" fill="#6b4638"/>
<circle cx="14" cy="-24" r="7" fill="#6b4638" ${ink(2)}/>
<path d="M-16 -8c-2 16-2 20 0 24M16 -8c2 16 2 20 0 24" stroke="#6b4638" stroke-width="5" stroke-linecap="round"/>`;
  }
  return `<path d="M-6 -18c2-8 10-8 12 0" stroke="#6b4638" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}

function person(kind) {
  const shirt = kind === "dad" ? "#3d94f5" : kind === "mom" ? "#ff8ad4" : "#ffc44d";
  const head = kind === "baby" ? 16 : 14;
  const body = kind === "baby" ? 16 : 18;
  return `<g>
${kind === "baby" ? "" : `<path d="M-8 8c-1 16 0 24 0 28M8 8c1 16 0 24 0 28" stroke="#ffd0b8" stroke-width="6" stroke-linecap="round"/>`}
<path d="M-${body} 4h${body * 2}v22c0 8-6 12-${body} 12s-${body}-4-${body}-12z" fill="${shirt}" ${ink()}/>
<circle cy="-12" r="${head}" fill="#ffd0b8" ${ink()}/>
${grownHair(kind)}
<circle cx="-5" cy="-12" r="1.8" fill="#3b2a24"/>
<circle cx="5" cy="-12" r="1.8" fill="#3b2a24"/>
<path d="M-4 -6c2.4 3 6 3 8.4 0" stroke="#e07a62" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<ellipse cx="-9" cy="-9" rx="2.2" ry="1.3" fill="#ffb199"/>
<ellipse cx="9" cy="-9" rx="2.2" ry="1.3" fill="#ffb199"/>
${kind === "dad" ? `<path d="M-8 2c2 3 6 3 8 2" stroke="#c9895a" stroke-width="2" fill="none" stroke-linecap="round"/>` : ""}
</g>`;
}

export function dad() {
  return person("dad");
}
export function mom() {
  return person("mom");
}
export function baby() {
  return person("baby");
}

export function sun() {
  const rays = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = i * 45;
    rays.push(`<line x1="0" y1="-18" x2="0" y2="-30" stroke="#ffc44d" stroke-width="4" stroke-linecap="round" transform="rotate(${angle})"/>`);
  }
  return `<g>${rays.join("")}<circle r="16" fill="#ffc44d" ${ink()}/>
<circle cx="-5" cy="-2" r="1.6" fill="#5c4036"/><circle cx="5" cy="-2" r="1.6" fill="#5c4036"/>
<path d="M-4 4c2.5 3 6 3 8 0" stroke="#e07a62" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</g>`;
}

export function moon() {
  return `<g>
<path d="M6 -22a20 20 0 1 0 0 44 16 16 0 1 1 0-44z" fill="#ffc44d" ${ink()}/>
<circle cx="2" cy="-4" r="1.5" fill="#fff8ef"/><circle cx="8" cy="6" r="1.2" fill="#fff8ef"/>
</g>`;
}

export function hand() {
  return `<path d="M-8 6c0-10 4-12 8-12 2 0 3 2 3 5v8c0-8 2-12 6-12s6 5 6 12v-2c0-8 2-12 6-12s6 5 6 13v16c0 16-10 24-22 24h-6c-12 0-16-8-16-18z" fill="#ffd0b8" ${ink()}/>`;
}

export function hands() {
  return `<g>
<g transform="translate(-16 0) scale(0.62)">${hand()}</g>
<g transform="translate(16 0) scale(0.62)">${hand()}</g>
</g>`;
}

export function eye() {
  return `<g>
<ellipse rx="26" ry="16" fill="#fff" ${ink()}/>
<circle r="8" fill="#4aa3ff"/>
<circle r="4.2" fill="#3b2a24"/>
<circle cx="2.4" cy="-2.2" r="1.8" fill="#fff"/>
</g>`;
}

export function eyes() {
  return `<g>
<g transform="translate(-16 0) scale(0.62)">${eye()}</g>
<g transform="translate(16 0) scale(0.62)">${eye()}</g>
</g>`;
}

export function nose() {
  return `<path d="M2 -22c10 10 12 18 6 28-10 4-18 0-20-6 6-10 8-16 14-22z" fill="#ffd0b8" stroke="#e07a62" stroke-width="2.5" stroke-linejoin="round"/>`;
}

export function mouth() {
  return `<g>
<path d="M-22 -6c8 22 36 22 44 0-6 8-38 8-44 0z" fill="#ff8a9a" stroke="#e07a62" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M-12 0c8 8 16 8 24 0" stroke="#fff" stroke-width="3" fill="none" opacity="0.75" stroke-linecap="round"/>
</g>`;
}

export function umbrella() {
  return `<g>
<path d="M-28 2c0-20 12-32 28-32s28 12 28 32z" fill="#4aa3ff" ${ink()}/>
<path d="M-28 2c8 6 12 6 18 0s12-6 20 0 12 6 18 0" stroke="#fff" stroke-width="3" fill="none" opacity="0.55"/>
<path d="M0 2v24" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<path d="M0 26c8 0 10 6 4 8" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
</g>`;
}

export function rain() {
  return `<g>
<path d="M-12 -6c0 8 4 8 0 16M2 -12c0 8 4 8 0 16M14 -4c0 8 4 8 0 16" stroke="#4aa3ff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
</g>`;
}

export function car() {
  return `<g>
<path d="M-22 2l8-16h28l8 16" fill="#ff8a5b" ${ink()}/>
<rect x="-8" y="-10" width="16" height="10" rx="2" fill="#cdebff"/>
<rect x="-28" y="0" width="56" height="18" rx="6" fill="#ff6b4a" ${ink()}/>
<circle cx="-16" cy="20" r="6" fill="#3b2a24"/><circle cx="-16" cy="20" r="2" fill="#fff"/>
<circle cx="16" cy="20" r="6" fill="#3b2a24"/><circle cx="16" cy="20" r="2" fill="#fff"/>
</g>`;
}

export function bus() {
  return `<g>
<rect x="-28" y="-18" width="56" height="36" rx="8" fill="#ffc44d" ${ink()}/>
<rect x="-20" y="-10" width="14" height="12" rx="2" fill="#cdebff"/>
<rect x="-2" y="-10" width="14" height="12" rx="2" fill="#cdebff"/>
<circle cx="-16" cy="20" r="5" fill="#3b2a24"/>
<circle cx="16" cy="20" r="5" fill="#3b2a24"/>
</g>`;
}

export function bike() {
  return `<g>
<circle cx="-16" cy="12" r="12" fill="none" ${ink(3)}/>
<circle cx="18" cy="12" r="12" fill="none" ${ink(3)}/>
<path d="M-16 12l10-20h14l8 20" stroke="#ff6b4a" stroke-width="3" fill="none" stroke-linejoin="round"/>
<circle cx="-16" cy="12" r="2" fill="${INK}"/>
</g>`;
}

export function plane() {
  return `<g>
<path d="M-28 4h22l8-16 6 16h22l-10 8H8l-8 12-4-12h-16z" fill="#7ec8ff" ${ink()}/>
<circle cx="8" cy="2" r="2" fill="#fff"/>
</g>`;
}

export function hat() {
  return `<g>
<ellipse cy="14" rx="28" ry="8" fill="#ffc44d" ${ink()}/>
<path d="M-16 10c2-22 10-30 16-30s14 8 16 30" fill="#ff6b4a" ${ink()}/>
</g>`;
}

export function coat() {
  return `<g>
<path d="M-16 -18l16-10 16 10-4 36h-24z" fill="#4aa3ff" ${ink()}/>
<path d="M0 -16v32" stroke="#fff" stroke-width="2.4"/>
<circle cy="2" r="2" fill="#ffc44d"/>
</g>`;
}

export function clock() {
  return `<g>
<circle cy="2" r="26" fill="#fff" stroke="#ff6b4a" stroke-width="4"/>
<circle cy="2" r="3" fill="${INK}"/>
<path d="M0 2V-12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<path d="M0 2l12 8" stroke="#ff6b4a" stroke-width="3" stroke-linecap="round"/>
</g>`;
}

export function toybox() {
  return `<g>
<rect x="-26" y="-4" width="52" height="28" rx="6" fill="#ff8a5b" ${ink()}/>
<path d="M-26 -8h52v10h-52z" fill="#ffc44d" ${ink()}/>
<circle cx="-8" cy="10" r="6" fill="#4aa3ff"/>
</g>`;
}

export function blocks() {
  return `<g>
<rect x="-24" y="4" width="20" height="20" rx="3" fill="#ff6b4a" ${ink()}/>
<rect x="-2" y="-16" width="20" height="20" rx="3" fill="#4aa3ff" ${ink()}/>
<rect x="-2" y="6" width="20" height="18" rx="3" fill="#ffc44d" ${ink()}/>
</g>`;
}

export function rice() {
  return `<g>
<ellipse cy="10" rx="24" ry="12" fill="#fff" ${ink()}/>
<ellipse cy="6" rx="16" ry="7" fill="#f4e1b5"/>
<path d="M-18 8c4 6 32 6 36 0" stroke="#f0dcc4" stroke-width="2" fill="none"/>
</g>`;
}

export function milk() {
  return `<g>
<rect x="-14" y="-24" width="28" height="46" rx="8" fill="#fff" ${ink()}/>
<rect x="-8" y="-6" width="16" height="16" rx="3" fill="#7ec8ff"/>
<path d="M-6 -24h12v6h-12z" fill="#d9c7b2"/>
</g>`;
}

export function bread() {
  return `<g>
<path d="M-24 6c0-16 10-26 24-26s24 10 24 26v12h-48z" fill="#f0b45a" ${ink()}/>
<path d="M-18 6h36" stroke="#c9895a" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="-8" cy="-4" r="1.4" fill="#c9895a"/><circle cx="6" cy="-2" r="1.4" fill="#c9895a"/>
</g>`;
}

export function mountain() {
  return `<g>
<polygon points="-30,24 -4,-22 18,24" fill="#7d9a6a" ${ink()}/>
<polygon points="-4,24 16,-8 36,24" fill="#5f8f62" ${ink()}/>
<path d="M-10 -8l6-8 6 8" fill="#fff" opacity="0.85"/>
</g>`;
}

export function water() {
  return `<g>
<path d="M-26  -4c8 8 14 8 22 0s14-8 22 0 12 8 16 0" stroke="#4aa3ff" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M-26 12c8 8 14 8 22 0s14-8 22 0 12 8 16 0" stroke="#7ec8ff" stroke-width="6" fill="none" stroke-linecap="round"/>
</g>`;
}

export function fire() {
  return `<g>
<path d="M0 -26c8 12 20 16 20 32a20 20 0 1 1-40 0c0-12 8-18 12-24 2 8 6 10 8-8z" fill="#ff6b4a" ${ink()}/>
<path d="M0 -2c4 6 8 8 8 14a8 8 0 1 1-16 0c0-4 2-6 4-8 1 4 2 4 4-6z" fill="#ffc44d"/>
</g>`;
}

export function soap() {
  return `<g>
<rect x="-22" y="-8" width="44" height="24" rx="10" fill="#bfe6ff" ${ink()}/>
<circle cx="-18" cy="-16" r="5" fill="#fff" opacity="0.95"/>
<circle cx="-6" cy="-22" r="3.5" fill="#fff" opacity="0.9"/>
<circle cx="8" cy="-14" r="4" fill="#fff" opacity="0.85"/>
</g>`;
}

export function wet() {
  return `<g>
<g transform="translate(0 8) scale(0.72)">${hand()}</g>
<path d="M-16 -28c0 8 4 8 0 14M-2 -32c0 8 4 8 0 14M12 -26c0 8 4 8 0 14" stroke="#4aa3ff" stroke-width="3.2" fill="none" stroke-linecap="round"/>
</g>`;
}

export function dry() {
  return `<g>
<rect x="-20" y="-24" width="40" height="46" rx="8" fill="#fff" stroke="#f0c27a" stroke-width="3"/>
<path d="M-12 -8h24M-12 2h24M-12 12h24" stroke="#ffd0b8" stroke-width="4" stroke-linecap="round"/>
</g>`;
}

export function rinse() {
  return `<g>
<path d="M-18 -26h22v8H-8" stroke="#d9c7b2" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-4 -16c0 10 4 12 0 20M8 -16c0 10 4 12 0 20" stroke="#4aa3ff" stroke-width="4" fill="none" stroke-linecap="round"/>
<g transform="translate(2 16) scale(0.4)">${hand()}</g>
</g>`;
}

export function stop() {
  return `<g>
<rect x="-6" y="-28" width="12" height="56" rx="4" fill="#5c4036"/>
<circle cy="-16" r="7" fill="#ff5a5a"/>
<circle cy="0" r="7" fill="#ffc44d"/>
<circle cy="16" r="7" fill="#3dcb7a"/>
</g>`;
}

export function tooth() {
  return `<g>
<path d="M-16 -16c0-10 32-10 32 0 0 16-2 28-6 32-4 0-4-12-10-12s-6 12-10 12c-4-4-6-16-6-32z" fill="#fff" ${ink()}/>
<path d="M-8 -8c4 6 12 6 16 0" stroke="#d7eef8" stroke-width="3" fill="none"/>
</g>`;
}

export function brush() {
  return `<g>
<rect x="-5" y="-28" width="10" height="24" rx="3" fill="#4aa3ff" ${ink()}/>
<path d="M-12 -4h24l-3 22h-18z" fill="#fff" ${ink()}/>
<path d="M-8 8h16M-7 14h14" stroke="#7ec8ff" stroke-width="2"/>
</g>`;
}

export function phone() {
  return `<g>
<rect x="-16" y="-28" width="32" height="54" rx="8" fill="#3b2a24" ${ink()}/>
<rect x="-11" y="-20" width="22" height="34" rx="3" fill="#7ec8ff"/>
<circle cy="20" r="2.2" fill="#fff"/>
<path d="M22 -18c6 4 8 8 6 12" stroke="#ffc44d" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</g>`;
}

export function candy() {
  return `<g>
<ellipse rx="14" ry="12" fill="#ff6b4a" ${ink()}/>
<path d="M-14 0l-14-10v20z" fill="#ffc44d" ${ink()}/>
<path d="M14 0l14-10v20z" fill="#ffc44d" ${ink()}/>
<path d="M-6 -2c4 6 8 6 12 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.7"/>
</g>`;
}

export function numeral(n, dots) {
  const label = String(n);
  const size = label.length > 1 ? 18 : 26;
  let dotSvg = "";
  if (dots) {
    const count = Math.min(n, 5);
    for (let i = 0; i < count; i += 1) {
      const x = (i - (count - 1) / 2) * 10;
      dotSvg += `<circle cx="${x}" cy="32" r="3.3" fill="#ff6b4a"/>`;
    }
  }
  return `<g>
<circle r="22" fill="#fff" stroke="#ff6b4a" stroke-width="3.5"/>
<text x="0" y="${size > 20 ? 8 : 7}" text-anchor="middle" font-family="Verdana, Trebuchet MS, sans-serif" font-size="${size}" font-weight="700" fill="#ff6b4a">${label}</text>
${dotSvg}
</g>`;
}

export function strokes(count) {
  let bars = "";
  for (let i = 0; i < count; i += 1) {
    const y = (i - (count - 1) / 2) * 12;
    bars += `<rect x="-18" y="${y - 3}" width="36" height="7" rx="3.5" fill="#5c4036"/>`;
  }
  return `<g>${bars}</g>`;
}

export function sizedBall(r) {
  return `<g>
<circle cy="2" r="${r}" fill="#ff6b4a" ${ink()}/>
<ellipse cx="${-r * 0.28}" cy="${-r * 0.3}" rx="${r * 0.28}" ry="${r * 0.16}" fill="#fff" opacity="0.5"/>
</g>`;
}

export function pencil(len) {
  const left = -len / 2;
  return `<g>
<rect x="${left + 12}" y="-7" width="${len - 16}" height="14" rx="2" fill="#ffc44d" ${ink()}/>
<path d="M${left + 12} -7l-14 7 14 7z" fill="#ffd0b8" ${ink()}/>
<rect x="${left + len - 10}" y="-7" width="10" height="14" fill="#ff8a9a" ${ink()}/>
</g>`;
}

export function shapeCircle() {
  return `<g><circle cy="2" r="26" fill="#ff8a5b" ${ink()}/><ellipse cx="-8" cy="-8" rx="8" ry="5" fill="#fff" opacity="0.35"/></g>`;
}
export function shapeSquare() {
  return `<g><rect x="-24" y="-22" width="48" height="48" rx="8" fill="#4aa3ff" ${ink()}/><rect x="-16" y="-14" width="16" height="8" rx="3" fill="#fff" opacity="0.4"/></g>`;
}
export function shapeTriangle() {
  return `<g><polygon points="0,-28 30,24 -30,24" fill="#3dcb7a" ${ink()}/><ellipse cx="-6" cy="4" rx="6" ry="4" fill="#fff" opacity="0.3"/></g>`;
}

export function yes() {
  return `<g>
<circle r="26" fill="#3dcb7a" ${ink()}/>
<path d="M-12 2l8 8 16-18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</g>`;
}
export function no() {
  return `<g>
<circle r="26" fill="#fff" ${ink(4)}/>
<path d="M-12 -12l24 24" stroke="#ff6b4a" stroke-width="5" stroke-linecap="round"/>
</g>`;
}
export function ask() {
  return `<g>
<circle r="26" fill="#4aa3ff" ${ink()}/>
<circle cx="-8" cy="-8" r="2.2" fill="#fff"/><circle cx="8" cy="-8" r="2.2" fill="#fff"/>
<text x="0" y="16" text-anchor="middle" font-family="Verdana, sans-serif" font-size="22" font-weight="700" fill="#fff">?</text>
</g>`;
}
export function enough() {
  return `<g>
${rice()}
<path d="M8 -16l6 6 12-12" stroke="#1fa97a" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</g>`;
}

export function queueKid(color) {
  return `<g>
<circle cy="-16" r="12" fill="#ffd0b8" ${ink()}/>
<path d="M-10 -20c2-8 18-8 20 2-6-4-16-4-20-2z" fill="#6b4638"/>
<circle cx="-4" cy="-16" r="1.6" fill="#3b2a24"/>
<circle cx="4" cy="-16" r="1.6" fill="#3b2a24"/>
<path d="M-4 -12c2 2 6 2 8 0" stroke="#e07a62" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<rect x="-12" y="-2" width="24" height="22" rx="8" fill="${color}" ${ink()}/>
</g>`;
}

export function cluster(draw, total, scale = 0.4) {
  const cols = Math.min(3, total);
  let body = "";
  for (let i = 0; i < total; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const rows = Math.ceil(total / cols);
    const x = (col - (cols - 1) / 2) * 30;
    const y = (row - (rows - 1) / 2) * 28;
    body += `<g transform="translate(${x} ${y}) scale(${scale})">${draw()}</g>`;
  }
  return `<g>${body}</g>`;
}

export function lessMark() {
  return cluster(() => apple(), 2, 0.46);
}
export function moreMark() {
  return cluster(() => apple(), 5, 0.34);
}
export function sameMark() {
  return `<g>
<g transform="translate(-16 2) scale(0.42)">${apple()}</g>
<path d="M-6 -6h12M-6 6h12" stroke="#1fa97a" stroke-width="3.4" stroke-linecap="round"/>
<g transform="translate(16 2) scale(0.42)">${apple()}</g>
</g>`;
}

export function different() {
  return `<g>
<g transform="translate(-14 0) scale(0.48)">${apple()}</g>
<g transform="translate(16 0) scale(0.5)">${shapeSquare()}</g>
</g>`;
}

export function follow() {
  return `<g>
<g transform="translate(-14 4) scale(0.55)">${queueKid("#ff6b4a")}</g>
<g transform="translate(16 8) scale(0.42)">${queueKid("#4aa3ff")}</g>
</g>`;
}

export function hold() {
  return `<g>
<g transform="translate(-16 2) scale(0.5)">${dad()}</g>
<g transform="translate(18 8) scale(0.42)">${baby()}</g>
<path d="M-2 10h8" stroke="#ffd0b8" stroke-width="5" stroke-linecap="round"/>
</g>`;
}

export function door() {
  return `<g>
<rect x="-18" y="-28" width="36" height="56" rx="4" fill="#f3d2b0" ${ink()}/>
<circle cx="10" cy="2" r="2.6" fill="#c9895a"/>
</g>`;
}

export function book() {
  return `<g>
<rect x="-18" y="-14" width="36" height="28" rx="3" fill="#fff" stroke="#ff6b4a" stroke-width="2.5"/>
<path d="M0 -14v28" stroke="#ff6b4a" stroke-width="2"/>
<path d="M-12 -4h8M-12 4h6" stroke="#ffb199" stroke-width="2" stroke-linecap="round"/>
</g>`;
}

export function hiBubble() {
  return `<g>
<rect x="-24" y="-16" width="48" height="28" rx="12" fill="#fff" ${ink()}/>
<path d="M-4 12l-8 10 16-8z" fill="#fff" ${ink()}/>
<text x="0" y="4" text-anchor="middle" font-family="Verdana, Trebuchet MS, sans-serif" font-size="16" font-weight="700" fill="#ff6b4a">Hi</text>
</g>`;
}

export function swoosh() {
  return `<g>
<path d="M-24 10c12-18 32-18 46-2" stroke="#ff6b4a" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M-16 18c10-10 24-10 34 0" stroke="#ffc44d" stroke-width="4" fill="none" stroke-linecap="round"/>
</g>`;
}

export function scale() {
  return `<g>
<path d="M0 20V-16" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<path d="M-26 -8h52" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
<circle cy="22" r="6" fill="#ffc44d" ${ink(2)}/>
<path d="M-26 -8l-8 16h16z" fill="#cdebff" ${ink(2)}/>
<path d="M26 -16l-8 16h16z" fill="#cdebff" ${ink(2)}/>
<g transform="translate(-26 2) scale(0.22)">${apple()}</g>
<g transform="translate(22 -10) scale(0.28)">${apple()}</g>
</g>`;
}

export function plate() {
  return `<g>
<ellipse rx="28" ry="10" cy="8" fill="#fff" ${ink()}/>
<ellipse rx="16" ry="6" cy="6" fill="#f4e1b5"/>
</g>`;
}

export function sprites() {
  return {
    sun: sun,
    moon: moon,
    apple: () => apple("#ff5a5a"),
    appleY: () => apple("#ffc83d"),
    milk,
    bread,
    rice,
    cat,
    dog,
    bird,
    fish,
    ballR: () => ball("#ff5a5a"),
    ballY: () => ball("#ffc83d"),
    ballB: () => ball("#4aa3ff"),
    ballG: () => ball("#3dcb7a"),
    swR: () => swatch("#ff5a5a"),
    swY: () => swatch("#ffc83d"),
    swB: () => swatch("#4aa3ff"),
    swG: () => swatch("#3dcb7a"),
    dad,
    mom,
    baby,
    hat,
    coat,
    umbrella,
    rain,
    car,
    bus,
    bike,
    plane,
    clock,
    soap,
    tooth,
    brush,
    phone,
    star,
    circle: shapeCircle,
    square: shapeSquare,
    triangle: shapeTriangle,
    eye,
    nose,
    mouth,
    hand,
    hands,
    happy,
    sad,
    angry,
    scared,
    n1: () => numeral(1, false),
    n2: () => numeral(2, false),
    n3: () => numeral(3, false),
    n5: () => numeral(5, false),
    n6: () => numeral(6, false),
    n8: () => numeral(8, false),
    n10: () => numeral(10, false),
    bar1: () => strokes(1),
    bar2: () => strokes(2),
    bar3: () => strokes(3),
    big: () => sizedBall(26),
    small: () => sizedBall(10),
    long: () => pencil(58),
    short: () => pencil(30),
    blocks,
    toybox,
    water,
    fire,
    mountain,
    kidR: () => queueKid("#ff6b4a"),
    kidB: () => queueKid("#4aa3ff"),
    kidG: () => queueKid("#3dcb7a"),
    swoosh,
    scale,
    plate,
    wet,
    rinse,
    dry,
    many: moreMark,
    few: lessMark,
    stop,
    candy,
    door,
    book,
    hi: hiBubble,
  };
}

export function place(name, x, y, s, kit) {
  const draw = kit[name];
  if (!draw) throw new Error(`缺少零件 ${name}`);
  return `<g transform="translate(${x} ${y}) scale(${s})">${draw()}</g>`;
}

export function host(who, pose, x, y, s) {
  const body = who === "mia" ? mia(pose) : xiaoya(pose);
  return `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
}
