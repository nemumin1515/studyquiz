/**
 * readingUtils.js
 * 読みの変換・照合に関する処理
 *
 * 注意:
 *   normalizeReading() はここには含まない。
 *   TextBox入力が必要になった時点で autoSplitter.js に実装する。
 *   括弧除去が必要な箇所は findMatchingReading() 内でインライン処理している。
 */

// ===================================================
// 括弧除去（インライン用ヘルパー）
// ===================================================
// normalizeReading() の代わりに内部でのみ使用する
// 例: "ふか(い)"    → "ふか"
// 例: "あめ（さめ）" → "あめ"
function _stripParens(str) {
  return String(str)
    .replace(/（.*?）/g, "")  // 全角括弧を除去
    .replace(/\(.*?\)/g, ""); // 半角括弧を除去
}

// ===================================================
// 1. 促音変換（次の漢字の読みを考慮）
// ===================================================
// 例: "はつ" の次が "た行" → "はっ"
// 例: "じゅう" の次が "か行" → "じゅっ"
function toSokuonByNext(reading, nextReading) {
  if (!reading || !nextReading) return reading;

  const nextStartsWithKSTH =
    /^[かきくけこさしすせそたちつてとはひふへほ]/.test(nextReading);

  if (!nextStartsWithKSTH) return reading;

  if (reading === "じゅう") return "じゅっ";

  if (/[きくちつ]$/.test(reading)) {
    return reading.slice(0, -1) + "っ";
  }

  return reading;
}

// ===================================================
// 2. 濁音変換
// ===================================================
// 例: "かみ" → "がみ"
function toDakuon(text) {
  const map = {
    "か":"が","き":"ぎ","く":"ぐ","け":"げ","こ":"ご",
    "さ":"ざ","し":"じ","す":"ず","せ":"ぜ","そ":"ぞ",
    "た":"だ","ち":"ぢ","つ":"づ","て":"で","と":"ど",
    "は":"ば","ひ":"び","ふ":"ぶ","へ":"べ","ほ":"ぼ"
  };
  text = String(text);
  const first = text[0];
  return (map[first] || first) + text.slice(1);
}

// ===================================================
// 3. 半濁音変換
// ===================================================
// 例: "はく" → "ぱく"
function toHandakuon(text) {
  const map = {
    "は":"ぱ","ひ":"ぴ","ふ":"ぷ","へ":"ぺ","ほ":"ぽ"
  };
  text = String(text);
  const first = text[0];
  return (map[first] || first) + text.slice(1);
}

// ===================================================
// 4. 読みの照合
// ===================================================
// normalizeReading() の代わりに _stripParens() をインラインで使用
function findMatchingReading(readings, remainingYomi, nextReadings) {

  const sortedReadings = readings
    .map(r => _stripParens(r))
    .filter(r => r)
    .sort((a, b) => b.length - a.length);

  for (const base of sortedReadings) {
    const candidates = [
      { match: base, output: base }
    ];

    for (const next of nextReadings) {
      const sokuon = toSokuonByNext(base, _stripParens(next));
      if (sokuon !== base) {
        candidates.push({ match: sokuon, output: base });
      }
    }

    candidates.push({ match: toDakuon(base),    output: base });
    candidates.push({ match: toHandakuon(base), output: base });

    for (const c of candidates) {
      if (c.match && remainingYomi.startsWith(c.match)) {
        return { output: c.output, consumed: c.match.length };
      }
    }
  }

  return null;
}

// ===================================================
// 5. 漢字と漢字の間のひらがなを取得
// ===================================================
function getKanaBetweenKanji(word, kanjiIndex) {
  const parts = word.match(/[一-龥々]|[ぁ-んー]+/g) || [];
  let count = -1;

  for (let i = 0; i < parts.length - 1; i++) {
    if (/^[一-龥々]$/.test(parts[i])) {
      count++;
      if (count === kanjiIndex && /^[ぁ-んー]+$/.test(parts[i + 1])) {
        return parts[i + 1];
      }
    }
  }

  return "";
}

// ===================================================
// エクスポート（webアプリで使用する場合）
// ===================================================
// export { toSokuonByNext, toDakuon, toHandakuon, findMatchingReading, getKanaBetweenKanji };
