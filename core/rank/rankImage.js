/**
 * rankImage.js
 * 称号アップ時のイラストを、未表示のものからランダムに選ぶ共通部品
 */

const RANK_IMAGE_HISTORY_KEY = 'learning_rank_shown_images';

function loadRankImageHistory() {
  try {
    const v = localStorage.getItem(RANK_IMAGE_HISTORY_KEY);
    return v ? JSON.parse(v) : [];
  } catch (e) {
    return [];
  }
}

function saveRankImageHistory(history) {
  try {
    localStorage.setItem(RANK_IMAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {}
}

async function loadRankImageList(jsonPath) {
  const res = await fetch(jsonPath);
  if (!res.ok) {
    throw new Error('称号イラスト一覧を読み込めませんでした');
  }
  return res.json();
}

function pickRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 未表示の称号イラストを1つ返す
 *
 * @param {string} jsonPath 例: "../../assets/rank/rank_images.json"
 * @param {string} imageBasePath 例: "../../assets/rank/images/"
 * @returns {Promise<{src:string, filename:string} | null>}
 */
async function getNextRankImage(jsonPath, imageBasePath) {
  const imageList = await loadRankImageList(jsonPath);

  if (!Array.isArray(imageList) || imageList.length === 0) {
    return null;
  }

  let history = loadRankImageHistory();

  let unused = imageList.filter(filename => !history.includes(filename));

  // 全部表示済みなら履歴をリセットして、また全画像から選ぶ
  if (unused.length === 0) {
    history = [];
    unused = [...imageList];
  }

  const filename = pickRandomItem(unused);

  history.push(filename);
  saveRankImageHistory(history);

  return {
    filename,
    src: imageBasePath + filename
  };
}