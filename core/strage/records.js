/**
 * records.js v2
 * 学習記録・重点問題・バックアップ保管庫の管理（共通部品）
 *
 * 方針:
 *   - ポイントは points.js の learning_total_points で全アプリ共通
 *   - 記録は APP_CONFIG.appId ごとに保存
 *   - 重点問題も APP_CONFIG.appId ごとに保存
 *   - バックアップ全体は learning_apps_backup_archive に保管
 *
 * 読み込み順:
 *   1. app-config.js
 *   2. points.js
 *   3. records.js
 */

// ===================================================
// 1. localStorageキー
// ===================================================

// アプリごとの記録・重点問題
const RECORDS_KEY = `${APP_CONFIG.appId}_records`;
const FOCUS_KEY   = `${APP_CONFIG.appId}_focus`;
const WRONG_KEY   = `${APP_CONFIG.appId}_wrong`;

// 全アプリ分を保管するバックアップ保管庫
const BACKUP_ARCHIVE_KEY = 'learning_apps_backup_archive';


// ===================================================
// 2. バックアップ保管庫
// ===================================================

function createEmptyBackupArchive() {
  return {
    backupType : 'learning_apps_backup',
    version    : 2,
    exportedAt : new Date().toISOString(),
    shared     : {},
    apps       : {}
  };
}

function normalizeBackupArchive(data) {
  const archive = data && typeof data === 'object'
    ? data
    : createEmptyBackupArchive();

  if (archive.backupType !== 'learning_apps_backup') {
    archive.backupType = 'learning_apps_backup';
  }

  if (!archive.version || archive.version < 2) {
    archive.version = 2;
  }

  if (!archive.shared || typeof archive.shared !== 'object') {
    archive.shared = {};
  }

  if (!archive.apps || typeof archive.apps !== 'object') {
    archive.apps = {};
  }

  if (!archive.exportedAt) {
    archive.exportedAt = new Date().toISOString();
  }

  return archive;
}

function loadBackupArchive() {
  try {
    const v = localStorage.getItem(BACKUP_ARCHIVE_KEY);
    return v ? normalizeBackupArchive(JSON.parse(v)) : createEmptyBackupArchive();
  } catch(e) {
    return createEmptyBackupArchive();
  }
}

function saveBackupArchive(data) {
  try {
    const archive = normalizeBackupArchive(data);
    localStorage.setItem(BACKUP_ARCHIVE_KEY, JSON.stringify(archive));
  } catch(e) {}
}

/**
 * 現在開いているアプリの記録・重点問題を
 * バックアップ保管庫の apps[APP_CONFIG.appId] に反映する
 */
function saveCurrentAppDataToArchive() {
  const archive = loadBackupArchive();

  archive.version    = 2;
  archive.exportedAt = new Date().toISOString();

  // points.js が読み込まれている場合だけ、共通ポイントも保管庫に反映
  if (typeof loadPoints === 'function') {
    archive.shared.points = loadPoints();
  }

archive.apps[APP_CONFIG.appId] = {
  records: loadRecords(),
  focus  : loadFocus(),
  wrong  : loadWrongItems()
};

  saveBackupArchive(archive);
}

/**
 * 外部から読み込んだバックアップ全体を保管庫に保存する
 */
function storeImportedBackupArchive(data) {
  const archive = normalizeBackupArchive(data);

  // points.js が読み込まれていて、バックアップにポイントがあれば復元
  if (
    archive.shared &&
    typeof archive.shared.points === 'number' &&
    typeof savePoints === 'function'
  ) {
    savePoints(archive.shared.points);
  }

  saveBackupArchive(archive);
}

/**
 * 保管庫から、現在開いているアプリの記録・重点問題だけを復元する
 */
function restoreCurrentAppDataFromArchive() {
  const archive = loadBackupArchive();
  const appData = archive.apps?.[APP_CONFIG.appId];

  if (!appData) return false;

  if (Array.isArray(appData.records)) {
    saveRecords(appData.records);
  }

  if (Array.isArray(appData.focus)) {
    saveFocus(appData.focus);
  }

  if (Array.isArray(appData.wrong)) {
    saveWrongItems(appData.wrong);
  }

  return true;
}


// ===================================================
// 3. 記録の読み込み・保存・削除
// ===================================================

function loadRecords() {
  try {
    const v = localStorage.getItem(RECORDS_KEY);
    return v ? JSON.parse(v) : [];
  } catch(e) {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch(e) {}

  // 記録を保存したら、バックアップ保管庫にも反映
  saveCurrentAppDataToArchive();
}

function addRecord(record) {
  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
}

function clearRecords() {
  saveRecords([]);
}

function getNowString() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


// ===================================================
// 4. 重点問題の読み込み・保存・削除
// ===================================================

function loadFocus() {
  try {
    const v = localStorage.getItem(FOCUS_KEY);
    return v ? JSON.parse(v) : [];
  } catch(e) {
    return [];
  }
}

function saveFocus(focus) {
  try {
    localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
  } catch(e) {}

  // 重点問題を保存したら、バックアップ保管庫にも反映
  saveCurrentAppDataToArchive();
}

function clearFocus() {
  saveFocus([]);
}

// ===================================================
// 5. 誤答データの読み込み・保存・削除
// ===================================================

function loadWrongItems() {
  try {
    const v = localStorage.getItem(WRONG_KEY);
    return v ? JSON.parse(v) : [];
  } catch(e) {
    return [];
  }
}

function saveWrongItems(items) {
  try {
    localStorage.setItem(WRONG_KEY, JSON.stringify(items));
  } catch(e) {}

  saveCurrentAppDataToArchive();
}

function addWrongItem(item) {
  if (!item || !item.word) return;

  const items = loadWrongItems();
  const now = getNowString();

  const word = String(item.word || '');
  const yomi = String(item.yomi || '');
  const wrongWord = String(item.wrongWord || '');

  const mistake = {
    date: now,
    wrongWord
  };

  const found = items.find(x => x.word === word);

  if (found) {
    found.yomi = yomi || found.yomi || '';
    found.wrongCount = (found.wrongCount || 0) + 1;
    found.lastWrongAt = now;

    found.mistakes = Array.isArray(found.mistakes)
      ? found.mistakes
      : [];

    found.mistakes.unshift(mistake);

    // 直近10件だけ保持
    found.mistakes = found.mistakes.slice(0, 10);

  } else {

    items.unshift({
      word,
      yomi,
      wrongCount: 1,
      lastWrongAt: now,

      mistakes: [
        mistake
      ]
    });
  }

  saveWrongItems(items);
}

function clearWrongItems() {
  saveWrongItems([]);
}