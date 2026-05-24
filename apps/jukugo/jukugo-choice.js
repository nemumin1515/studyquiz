window.JukugoChoice = (() => {
  let kanjiData = [];
  let gradeData = [];
  let kanjiGradeMap = {};

  let yomiToKanjiMap = null;
  let allKanjiPool = null;
  let gradeOrderCache = null;

  function init(options) {
    kanjiData = options.kanjiData || [];
    gradeData = options.gradeData || [];
    kanjiGradeMap = options.kanjiGradeMap || {};

    yomiToKanjiMap = null;
    allKanjiPool = null;
    gradeOrderCache = null;
  }

  function stripParens(s) {
    return String(s)
      .replace(/（.*?）/g, '')
      .replace(/\(.*?\)/g, '');
  }

  function buildYomiMap() {
    if (yomiToKanjiMap) return;

    yomiToKanjiMap = {};

    for (const row of kanjiData) {
      // kanji.json: [漢字, 読み, grade_code]
      const k = row[0];
      const yomi = stripParens(row[1]);

      if (!k || !yomi) continue;

      if (!yomiToKanjiMap[yomi]) {
        yomiToKanjiMap[yomi] = new Set();
      }

      yomiToKanjiMap[yomi].add(k);
    }

    for (const yomi in yomiToKanjiMap) {
      yomiToKanjiMap[yomi] = [...yomiToKanjiMap[yomi]];
    }
  }

  function getAllKanji() {
    if (allKanjiPool) return allKanjiPool;

    allKanjiPool = [...new Set(
      kanjiData
        .map(row => row[0])
        .filter(Boolean)
    )];

    return allKanjiPool;
  }

  function getGradeOrder() {
    if (gradeOrderCache) return gradeOrderCache;

    gradeOrderCache = {};

    for (const row of gradeData) {
      const gradeOrder = row[0];
      const gradeCode = row[3];
      gradeOrderCache[gradeCode] = gradeOrder;
    }

    return gradeOrderCache;
  }

  function isWithinSelectedGrades(kanji, selectedGrades) {
    // selectedGrades が空なら、学年制限なし
    if (!Array.isArray(selectedGrades) || selectedGrades.length === 0) {
      return true;
    }

    const kanjiGrade = kanjiGradeMap[kanji];
    if (!kanjiGrade) return false;

    return selectedGrades.includes(kanjiGrade);
  }

  function shuffle(arr) {
    const a = [...arr];

    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
  }

  function generateChoices(correctKanji, yomi, selectedGrades) {
    buildYomiMap();

    const selectedGradeList = Array.isArray(selectedGrades)
      ? selectedGrades
      : [];

    // ① 同じ読みを持つ別の漢字のうち、選択された配当学年内のもの
    const sameYomi = (yomiToKanjiMap[yomi] || [])
      .filter(k =>
        k !== correctKanji &&
        isWithinSelectedGrades(k, selectedGradeList)
      );

    // ② 同じ読みではないが、選択された配当学年内のもの
    const allOthersInGrade = getAllKanji()
      .filter(k =>
        k !== correctKanji &&
        !sameYomi.includes(k) &&
        isWithinSelectedGrades(k, selectedGradeList)
      );

    const distractors = [];

    // ① 同じ読みを持つ別の漢字を最大5個
    distractors.push(
      ...shuffle(sameYomi).slice(0, 5)
    );

    // ② ①が5個未満なら、選択された配当学年内からランダム補充
    if (distractors.length < 5) {
      distractors.push(
        ...shuffle(allOthersInGrade).slice(0, 5 - distractors.length)
      );
    }

    // ③ ①②でも足りない場合は、学年制限を外して全漢字から補充
    if (distractors.length < 5) {
      const fallback = getAllKanji()
        .filter(k =>
          k !== correctKanji &&
          !distractors.includes(k)
        );

      distractors.push(
        ...shuffle(fallback).slice(0, 5 - distractors.length)
      );
    }

    // ④ 正解 + ①〜③の5個をシャッフルして6択完成
    return shuffle([
      correctKanji,
      ...distractors.slice(0, 5)
    ]);
  }

  return {
    init,
    stripParens,
    generateChoices
  };
})();