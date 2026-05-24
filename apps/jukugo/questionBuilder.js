/**
 * questionBuilder.js v2
 * jukugo.json の行データから問題オブジェクトを作る（司令塔）
 *
 * 依存:
 *   - jukugo-okuri.js  : window.JukugoOkuri
 *   - jukugo-choice.js : window.JukugoChoice
 *
 * 読み込み順:
 *   jukugo-okuri.js
 *   jukugo-choice.js
 *   questionBuilder.js  ← このファイル
 *
 * 公開関数:
 *   buildQuestions(pool, setting)
 *     → Question[] を返す
 *
 * Question の形式:
 * {
 *   word        : '喜ぶ',
 *   yomi        : 'よろこぶ',
 *   mean        : '...',
 *   kanjiReading: [...],
 *   slots       : [
 *     { kanji, stem, okuri, choices, hasOkuri }
 *   ]
 * }
 */

/**
 * pool（jukugo.json の行配列）から問題キューを生成する
 *
 * @param {Array}  pool    - buildPool() でフィルター済みの行配列
 * @param {Object} setting - { count, ratio }
 * @returns {Array} Question[]
 */
function buildQuestions(pool, setting) {
  const focus      = loadFocus().filter(w => pool.some(r => r[0] === w));
  const normalRows = pool.filter(r => !focus.includes(r[0]));
  const focusRows  = pool.filter(r =>  focus.includes(r[0]));

  let focusCount = 0;
  if (setting.ratio === 'all' && focus.length) {
    focusCount = Math.min(focus.length, setting.count);
  } else if (setting.ratio === 'half' && focus.length) {
    focusCount = Math.min(focus.length, Math.floor(setting.count / 2));
  }

  const normalCount = setting.count - focusCount;

  const picked = [
    ...qbShuffle([...focusRows]).slice(0, focusCount),
    ...qbShuffle([...normalRows]).slice(0, normalCount),
  ];

  return qbShuffle(picked).map(row => createQuestionFromRow(row, setting));
}

/**
 * jukugo.json の1行から問題オブジェクトを作る
 *
 * 「戦績」→ 通常熟語問題（jukugo-kanji）
 * 「喜ぶ」→ 送り仮名問題（jukugo-okuri）
 *
 * @param {Array}  row
 * @param {Object} setting - { gradeLimit }
 * @returns {Object} Question
 */
function createQuestionFromRow(row, setting) {
  const gradeLimit = setting.gradeLimit || null;

  const slots = (row[3] || []).map(([k, y], i) => {
    // 送り仮名判定 → JukugoOkuri に委譲
    const entry = JukugoOkuri.createOkuriEntryFromRow(row, i);

    if (entry) {
      // 送り仮名問題スロット
      return {
        kanji    : k,
        stem     : entry.stem,
        okuri    : entry.answer,
        choices  : qbShuffle([...entry.choices]),
        hasOkuri : true,
      };
    }

    // 通常漢字スロット（選択肢は JukugoChoice に委譲）
    const stem = JukugoChoice.stripParens(y);
    return {
      kanji    : k,
      stem,
      okuri    : null,
      choices  : null,   // renderQuestion() で JukugoChoice.generateChoices() を呼ぶ
      hasOkuri : false,
    };
  });

  return {
    word        : row[0],
    yomi        : row[1],
    mean        : row[2],
    kanjiReading: row[3],
    slots,
  };
}

/**
 * シャッフル（questionBuilder 内部用）
 * index.html の shuffle() と独立して動作する
 */
function qbShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
