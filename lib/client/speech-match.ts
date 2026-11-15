/** 宽松对照：忽略大小写和标点，允许少字、近音和部分词对上。不上传录音。 */
export function normalizeSpeech(text: string) {
  return text
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(text: string) {
  return normalizeSpeech(text).replace(/\s/g, "");
}

function tokens(text: string) {
  const normalized = normalizeSpeech(text);
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length > 1) return parts;
  const chars = compact(normalized);
  if (/[\u4e00-\u9fff]/.test(chars) && chars.length > 1) return [...chars];
  return parts;
}

function editDistance(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j] ?? 0;
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min((row[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length] ?? 0;
}

function tokenClose(heard: string, expected: string) {
  if (heard === expected) return true;
  if (Math.max(heard.length, expected.length) < 3) return false;
  if (heard.includes(expected) || expected.includes(heard)) return true;
  return editDistance(heard, expected) <= 1;
}

export function speechMatches(heard: string, expected: string) {
  const left = normalizeSpeech(heard);
  const right = normalizeSpeech(expected);
  if (!left || !right) return false;
  if (left === right) return true;
  const heardCompact = compact(left);
  const expectedCompact = compact(right);
  if (expectedCompact.length <= 2 || heardCompact.length <= 2) {
    if (/[\u4e00-\u9fff]/.test(expectedCompact + heardCompact)) {
      return expectedCompact.includes(heardCompact) || heardCompact.includes(expectedCompact);
    }
    return tokens(right).some((token) => token.length >= 2 && (token === heardCompact || token.includes(heardCompact)));
  }
  if (left.includes(right) || right.includes(left)) return true;
  const allowance = Math.max(1, Math.floor(expectedCompact.length * 0.34));
  if (editDistance(heardCompact, expectedCompact) <= allowance) return true;
  const expectedTokens = tokens(right);
  const heardTokens = tokens(left);
  if (expectedTokens.length === 0 || heardTokens.length === 0) return false;
  const hits = expectedTokens.filter((token) => heardTokens.some((item) => tokenClose(item, token))).length;
  const need = expectedTokens.length === 1 ? 1 : Math.max(1, Math.ceil(expectedTokens.length * 0.5));
  return hits >= need;
}
