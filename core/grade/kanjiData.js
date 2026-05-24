/**
 * kanjiData.js
 * kanji.json を使いやすい辞書形式に変換する処理
 *
 * 使用するJSONファイル:
 *   - kanji.json : schema["kanji","yomi","grade"]
 */

// ===================================================
// 1. kanji.jsonを辞書形式に変換（事前に1回だけ実行する）
// ===================================================
// 例: kanjiMap["直"] → [["直","ただ(ちに)","E2"], ...]
function buildKanjiMap(kanjiData) {
  const kanjiMap = {};
  for (const row of kanjiData) {
    const k = row[0];
    if (!kanjiMap[k]) kanjiMap[k] = [];
    kanjiMap[k].push(row);
  }
  return kanjiMap;
}

// ===================================================
// エクスポート（webアプリで使用する場合）
// ===================================================
// export { buildKanjiMap };
