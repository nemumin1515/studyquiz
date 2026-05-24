/**
 * autoSplitter.js
 * TextBox入力された未分解の語を、漢字ごとの読みへ推定分解する処理
 *
 * 注意:
 *   このファイルは TextBox入力機能を実装する際に追加する。
 *   現時点では未使用。
 *
 * 依存:
 *   - readingUtils.js : findMatchingReading(), getKanaBetweenKanji()
 *   - kanjiData.js    : buildKanjiMap()
 *
 * 使用イメージ:
 *   入力: "厚い雲" / "あついくも"
 *   出力: [["厚","あつ(い)"],["雲","くも"]]
 */

// ===================================================
// 1. 読みの整形（括弧内を除去）
// ===================================================
// TextBox入力の前処理として使用する
// 例: "ふか(い)"    → "ふか"
// 例: "あめ（さめ）" → "あめ"
function normalizeReading(reading) {
  return String(reading)
    .replace(/（.*?）/g, "")  // 全角括弧を除去
    .replace(/\(.*?\)/g, ""); // 半角括弧を除去
}

// ===================================================
// 2. kanji_readingを自動生成する
// ===================================================
// TextBox入力時のみ使用する。
// jukugo.json利用時は照合のみで足りるため、この関数は不要。
//
// @param {string} word     - 熟語 例: "厚い雲"
// @param {string} yomi     - 読み 例: "あついくも"
// @param {Object} kanjiMap - buildKanjiMap()で作成した辞書
// @returns {Array|null}    - 例: [["厚","あつ(い)"],["雲","くも"]]
function buildKanjiReading(word, yomi, kanjiMap) {

  const kanjiList = String(word).match(/[一-龥々]/g) || [];
  if (kanjiList.length === 0) return null;

  const result      = [];
  let remainingYomi = String(yomi);

  for (let i = 0; i < kanjiList.length; i++) {
    const kanji     = kanjiList[i];
    const nextKanji = kanjiList[i + 1] || null;

    const kanjiRows = kanjiMap[kanji] || [];
    if (kanjiRows.length === 0) {
      result.push([kanji, ""]);
      continue;
    }

    const readings     = kanjiRows.map(r => r[1]);
    const nextRows     = nextKanji ? (kanjiMap[nextKanji] || []) : [];
    const nextReadings = nextRows.map(r => normalizeReading(r[1]));
    const matched      = findMatchingReading(readings, remainingYomi, nextReadings);

    if (matched) {
      result.push([kanji, matched.output]);
      remainingYomi = remainingYomi.slice(matched.consumed);
    } else {
      result.push([kanji, ""]);

      // 次の漢字がある場合、その漢字の読みが始まる位置まで remainingYomi を進める
      if (nextKanji) {
        const nextCandidates = (kanjiMap[nextKanji] || [])
          .map(r => normalizeReading(r[1]))
          .filter(r => r);
        let nextPos = -1;
        for (const r of nextCandidates) {
          const pos = remainingYomi.indexOf(r);
          if (pos > 0 && (nextPos === -1 || pos < nextPos)) {
            nextPos = pos;
          }
        }
        if (nextPos > 0) {
          remainingYomi = remainingYomi.slice(nextPos);
        }
      }
    }

    const kanaBetween = getKanaBetweenKanji(word, i);
    if (kanaBetween && remainingYomi.startsWith(kanaBetween)) {
      remainingYomi = remainingYomi.slice(kanaBetween.length);
    }
  }

  return result;
}

// ===================================================
// エクスポート（webアプリで使用する場合）
// ===================================================
// export { normalizeReading, buildKanjiReading };
