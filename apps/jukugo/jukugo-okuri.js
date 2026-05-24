window.JukugoOkuri = {
  countOkuriTargets,
  hasOkuriParen,
  parseOkuriReading,
  createOkuriEntryFromRow,
  extractKanaAfterTargetKanji,
  findKanjiPositionByOrder,
  stripTrailingParticle,
  makeOkuriChoices
};

const KEEP_TRAILING_PARTICLE_WORDS = new Set([
  '直ちに',
  '既に',
  '正に',
  '当に',
  '応に',
  '殊に',
  '遂に',
  '偏に',
  '大いに',
  '頻りに',
  '殆ど',
  '我が'
]);

function countOkuriTargets(kanjiReading) {
  return (kanjiReading || []).filter(([, y]) => hasOkuriParen(y)).length;
}

function hasOkuriParen(yomi) {
  return /\([^)]*\)|（[^）]*）/.test(String(yomi));
}

function parseOkuriReading(yomi) {
  const s = String(yomi);
  const m = s.match(/^(.+?)[\(（]([^\)）]+)[\)）]$/);
  if (!m) return null;

  return {
    stem: m[1],
    dictOkuri: m[2]
  };
}

function createOkuriEntryFromRow(row, slotIndex) {
  const word = String(row[0] || '');
  const kanjiReading = row[3] || [];

  // 送り仮名候補が1つだけの語だけ対応
  if (countOkuriTargets(kanjiReading) !== 1) return null;

  const item = kanjiReading[slotIndex];
  if (!item) return null;

  const kanji = String(item[0] || '');
  const yomi  = String(item[1] || '');

  if (!hasOkuriParen(yomi)) return null;

  const parsed = parseOkuriReading(yomi);
  if (!parsed) return null;

  const rawKana = extractKanaAfterTargetKanji(word, kanjiReading, slotIndex);

  // 厚紙・似姿など、表記上送り仮名がないものは対象外
  if (!rawKana) return null;

  const stripped = stripTrailingParticle(rawKana, word);
  const answer = stripped.text;

  if (!answer) return null;

  return {
    kanji,
    stem: parsed.stem,
    answer,
    choices: makeOkuriChoices(parsed.stem, answer)
  };
}

function extractKanaAfterTargetKanji(word, kanjiReading, targetIndex) {
  const targetKanji = String(kanjiReading[targetIndex][0] || '');

  const targetPos = findKanjiPositionByOrder(word, kanjiReading, targetIndex);
  if (targetPos < 0) return '';

  const afterTargetPos = targetPos + targetKanji.length;

  let nextPos = word.length;

  for (let i = targetIndex + 1; i < kanjiReading.length; i++) {
    const nextKanji = String(kanjiReading[i][0] || '');
    if (!nextKanji) continue;

    const p = word.indexOf(nextKanji, afterTargetPos);
    if (p >= 0) {
      nextPos = p;
      break;
    }
  }

  const between = word.slice(afterTargetPos, nextPos);
  const kanaParts = between.match(/[\u3041-\u309F]+/g);

  return kanaParts ? kanaParts.join('') : '';
}

function findKanjiPositionByOrder(word, kanjiReading, targetIndex) {
  let searchFrom = 0;

  for (let i = 0; i <= targetIndex; i++) {
    const kanji = String(kanjiReading[i][0] || '');
    const pos = word.indexOf(kanji, searchFrom);

    if (pos < 0) return -1;
    if (i === targetIndex) return pos;

    searchFrom = pos + kanji.length;
  }

  return -1;
}

function stripTrailingParticle(text, word = '') {
  let s = String(text);

  // 例外語は、末尾が助詞に見えても送り仮名として残す
  if (KEEP_TRAILING_PARTICLE_WORDS.has(String(word))) {
    return {
      text: s,
      removed: ''
    };
  }

  const particles = ['を', 'の', 'に', 'と', 'が', 'は', 'へ', 'で', 'も'];

  for (const p of particles) {
    if (s.endsWith(p) && s.length > p.length) {
      return {
        text: s.slice(0, -p.length),
        removed: p
      };
    }
  }

  return {
    text: s,
    removed: ''
  };
}


function makeOkuriChoices(stem, answer) {
  const fullChars = Array.from(String(stem) + String(answer));
  const answerLen = Array.from(String(answer)).length;
  const baseStart = fullChars.length - answerLen;
  const stemLen = Array.from(String(stem)).length;

  const minStart = Math.max(1, baseStart - (stemLen - 1));
  const choices = [];

  // 1. 正解の送り仮名と、語幹側へ1文字ずつ広げた候補を作る
  // 例：stem「やぶ」+ answer「れる」→「れる」「ぶれる」
  for (let i = baseStart; i >= minStart; i--) {
    choices.push(fullChars.slice(i).join(''));
  }

  // 2. 送り仮名が2文字以上ある場合は、送り仮名内部の短い候補も作る
  // 例：「れる」→「る」、「げる」→「る」
  for (let i = baseStart + 1; i < fullChars.length; i++) {
    choices.push(fullChars.slice(i).join(''));
  }

  // 重複を除いて返す
  return Array.from(new Set(choices));
}