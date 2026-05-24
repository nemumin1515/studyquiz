/**
 * gradeChecker.js
 * 熟語が指定学年で出題可能かチェックする処理
 *
 * 使用するJSONファイル:
 *   - kanji.json     : schema["kanji","yomi","grade"]
 *   - gradejson.json : schema["grade_order","grade_label","grade_short","grade_code","legacy_grade_code"]
 *   - jukugo.json    : schema["jukugo","jukugo_yomi","jukugo_mean","kanji_reading","attr_1","attr_2","attr_3","attr_4"]
 *
 * 注意:
 *   このファイルは照合処理のみを行う。
 *   TextBox入力からの読み推定は autoSplitter.js で行う。
 *
 * 依存:
 *   - readingUtils.js  : findMatchingReading(), getKanaBetweenKanji()
 *   - kanjiData.js     : buildKanjiMap()
 */

// ===================================================
// jukugo.jsonのスキーマ定義（インデックス管理）
// ===================================================
const JUKUGO = {
  WORD          : 0, // jukugo
  YOMI          : 1, // jukugo_yomi
  MEAN          : 2, // jukugo_mean
  KANJI_READING : 3, // kanji_reading
  ATTR_1        : 4, // attr_1（汎用フィルター1）
  ATTR_2        : 5, // attr_2（汎用フィルター2）
  ATTR_3        : 6, // attr_3（汎用フィルター3）
  ATTR_4        : 7  // attr_4（汎用フィルター4）
};

// ===================================================
// 1. 学年比較
// ===================================================
function getGradeOrder(gradeCode, gradeData) {
  const row = gradeData.find(r => r[3] === gradeCode);
  return row ? row[0] : null;
}

// ===================================================
// 2. メイン関数: checkGrade
// ===================================================
/**
 * 熟語が指定学年で出題可能かチェックする
 *
 * @param {Array}    jukugoRow   - jukugo.jsonのdata1行
 * @param {string[]} limitGrades - 指定学年のgrade_codeの配列 例: ["E3","E5"]
 * @param {Object}   kanjiMap    - buildKanjiMap()で作成した辞書
 * @param {Array}    gradeData   - gradejson.jsonのdata配列
 * @returns {boolean}            - true: 出題可能 / false: 出題不可
 *
 * 【使用例】
 *   checkGrade(jukugoRow, ["E6"], kanjiMap, gradeData);
 *   checkGrade(jukugoRow, ["E3","E5"], kanjiMap, gradeData);
 */
function checkGrade(jukugoRow, limitGrades, kanjiMap, gradeData) {

  const jukugoWord    = jukugoRow[JUKUGO.WORD];
  const jukugoYomi    = jukugoRow[JUKUGO.YOMI];
  const kanjiReadings = jukugoRow[JUKUGO.KANJI_READING]; // index: 3

  const limitOrders = new Set(
    limitGrades
      .map(g => getGradeOrder(g, gradeData))
      .filter(o => o !== null)
  );

  if (limitOrders.size === 0) {
    console.warn("有効な指定学年がありません:", limitGrades);
    return false;
  }

  let remainingYomi = jukugoYomi;

  for (let i = 0; i < kanjiReadings.length; i++) {
    const kanji = kanjiReadings[i][0];

    const kanjiRows = kanjiMap[kanji] || [];
    if (kanjiRows.length === 0) {
      console.warn("kanji.jsonに見つかりません:", kanji);
      return false;
    }

    const nextKanji    = kanjiReadings[i + 1] ? kanjiReadings[i + 1][0] : null;
    const nextRows     = nextKanji ? (kanjiMap[nextKanji] || []) : [];
    // 括弧除去は findMatchingReading() 内の _stripParens() で処理される
    const nextReadings = nextRows.map(r => r[1]);

    const validReadings = kanjiRows
      .filter(row => {
        const gradeOrder = getGradeOrder(row[2], gradeData);
        return gradeOrder && limitOrders.has(gradeOrder);
      })
      .map(row => row[1]);

    if (validReadings.length === 0) return false;

    const matched = findMatchingReading(validReadings, remainingYomi, nextReadings);
    if (!matched) return false;

    remainingYomi = remainingYomi.slice(matched.consumed);

    const kanaBetween = getKanaBetweenKanji(jukugoWord, i);
    if (kanaBetween && remainingYomi.startsWith(kanaBetween)) {
      remainingYomi = remainingYomi.slice(kanaBetween.length);
    }
  }

  return true;
}

// ===================================================
// エクスポート（webアプリで使用する場合）
// ===================================================
// export { JUKUGO, getGradeOrder, checkGrade };
