/**
 * points.js v1
 * ポイント・称号管理（共通部品）
 *
 * 使用するlocalStorageキー:
 *   learning_total_points  ← 全アプリ共通
 *
 * 【使い方】
 *   <script src="../../core/points.js"></script>
 *   で読み込むだけで使えます。
 *   APP_CONFIGより後に読み込んでください。
 */

// ===================================================
// 1. localStorageキー
// ===================================================
const POINTS_KEY = 'learning_total_points'; // 全アプリ共通

// ===================================================
// 2. 称号テーブル
// ===================================================
// ここを変更するだけで称号名・必要ポイントを変えられます
const LEVELS = [
  { min: 0,    label: '📖 見習い'      },
  { min: 50,   label: '✏️ 初学者'      },
  { min: 150,  label: '📚 学習者'      },
  { min: 300,  label: '🌱 努力家'      },
  { min: 500,  label: '🔥 読み師'      },
  { min: 800,  label: '⭐ 熟練者'      },
  { min: 1200, label: '🌟 漢字達人'    },
  { min: 2000, label: '🎓 漢字博士'    },
  { min: 3500, label: '👑 伝説の士'    },
];

// ===================================================
// 3. ポイントの読み込み・保存
// ===================================================

/**
 * localStorageからポイントを読み込む
 * @returns {number}
 */
function loadPoints() {
  try {
    const v = localStorage.getItem(POINTS_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch(e) {
    return 0;
  }
}

/**
 * localStorageにポイントを保存する
 * @param {number} pt
 */
function savePoints(pt) {
  try {
    localStorage.setItem(POINTS_KEY, String(pt));
  } catch(e) {}
}

// ===================================================
// 4. ポイントの加算
// ===================================================

/**
 * セッション終了時にポイントを加算する
 *
 * ルール:
 *   正解数 → そのままpt加算
 *   全問正解ボーナス → 問題数分のptを追加
 *
 * @param {number} score      - 正解数
 * @param {number} totalCount - 問題数
 * @returns {{ earned: number, bonus: number, total: number }}
 *   earned : 今回獲得pt（ボーナス含む）
 *   bonus  : 全問正解ボーナスpt（なければ0）
 *   total  : 加算後の合計pt
 */
function addPoints(score, totalCount) {
  const bonus    = (score === totalCount) ? totalCount : 0;
  const earned   = score + bonus;
  const current  = loadPoints();
  const newTotal = current + earned;
  savePoints(newTotal);
  return { earned, bonus, total: newTotal };
}

// ===================================================
// 5. 称号の取得
// ===================================================

/**
 * 現在の称号を返す
 * @param {number} pt
 * @returns {{ min: number, label: string }}
 */
function getRank(pt) {
  let rank = LEVELS[0];
  for (const lv of LEVELS) {
    if (pt >= lv.min) rank = lv;
  }
  return rank;
}

/**
 * 次の称号を返す（最高称号の場合はnull）
 * @param {number} pt
 * @returns {{ min: number, label: string } | null}
 */
function getNextRank(pt) {
  for (const lv of LEVELS) {
    if (pt < lv.min) return lv;
  }
  return null;
}

/**
 * 次の称号までの残りptを返す（最高称号の場合はnull）
 * @param {number} pt
 * @returns {number | null}
 */
function getPointsToNextRank(pt) {
  const next = getNextRank(pt);
  return next ? next.min - pt : null;
}

// ===================================================
// 6. ポイントのリセット
// ===================================================

/**
 * ポイントを0にリセットする
 *
 * ⚠ 注意:
 * 学習記録削除では絶対に呼ばないこと。
 *
 * records.js の clearRecords() / clearFocus() とは別用途。
 * これは「全アプリ共通ポイント」を消去する。
 *
 * 通常のアプリ利用では使用しない。
 * 開発・初期化専用。
 */
function resetPoints() {
  savePoints(0);
}

// ===================================================
// 7. 現在のポイントを保持する変数
// ===================================================
// アプリ起動時に1回だけ読み込む
let totalPoints = loadPoints();

// ===================================================
// 8. エクスポート（モジュール形式で使う場合）
// ===================================================
// HTMLから <script src="points.js"> で読み込む場合は不要です
// export { loadPoints, savePoints, addPoints, getRank, getNextRank, getPointsToNextRank, resetPoints, totalPoints, LEVELS, POINTS_KEY };


// ===================================================
// セッション終了時にまとめて加算
// ===================================================

function finishPointSession(score, totalCount) {
  const beforeTotal = loadPoints();
  const beforeRank  = getRank(beforeTotal);

  const bonus       = (score === totalCount) ? totalCount : 0;
  const earned      = score + bonus;
  const afterTotal  = beforeTotal + earned;
  const afterRank   = getRank(afterTotal);

  savePoints(afterTotal);

  return {
    beforeTotal,
    afterTotal,
    earned,
    bonus,
    beforeRank,
    afterRank,
    isRankUp: beforeRank.label !== afterRank.label
  };
}
