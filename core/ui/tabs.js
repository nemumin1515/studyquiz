/**
 * tabs.js  v1.0
 * core/ui/tabs.js
 *
 * メインタブ・サブタブの切替を共通化する。
 *
 * 使い方:
 *   <script src="../../core/ui/tabs.js"></script>
 *
 * ■ メインタブ（AppCore.tabs.switchMain）
 *
 *   HTML側:
 *     <button class="tab-btn active" onclick="AppCore.tabs.switchMain('quiz', this)">クイズ</button>
 *     <button class="tab-btn"        onclick="AppCore.tabs.switchMain('record', this)">記録</button>
 *
 *   タブ切替時にアプリ固有処理を実行したい場合はコールバックを登録:
 *     AppCore.tabs.onSwitch('record',   () => renderPrintPreview());
 *     AppCore.tabs.onSwitch('settings', () => renderSettingsPage());
 *
 * ■ サブタブ（AppCore.tabs.switchSub）
 *
 *   HTML側:
 *     <button class="sub-tab active" onclick="AppCore.tabs.switchSub('list', this)">一覧</button>
 *     <button class="sub-tab"        onclick="AppCore.tabs.switchSub('delete', this)">記録を削除</button>
 *
 *   サブタブのコンテンツIDは "sub-{id}" の命名規則に従うこと:
 *     <div id="sub-list">...</div>
 *     <div id="sub-delete" style="display:none">...</div>
 *
 *   切替時コールバック:
 *     AppCore.tabs.onSubSwitch('list', () => renderPrintPreview());
 */

var AppCore = AppCore || {};

AppCore.tabs = (function () {

  // ---- コールバック登録テーブル ----
  const _callbacks    = {};  // メインタブ用
  const _subCallbacks = {};  // サブタブ用

  /**
   * メインタブ切替時のコールバックを登録する。
   * @param {string}   tabId    - ページID（例: 'record', 'settings'）
   * @param {Function} callback - タブを開いたときに実行する関数
   */
  function onSwitch(tabId, callback) {
    _callbacks[tabId] = callback;
  }

  /**
   * サブタブ切替時のコールバックを登録する。
   * @param {string}   subId    - サブタブID（例: 'list', 'delete'）
   * @param {Function} callback - サブタブを開いたときに実行する関数
   */
  function onSubSwitch(subId, callback) {
    _subCallbacks[subId] = callback;
  }

  /**
   * メインタブを切り替える。
   * - .page の active を切り替える
   * - .tab-btn の active を切り替える
   * - 登録済みコールバックを実行する
   *
   * @param {string}          pageId - ページID（例: 'quiz', 'record', 'settings'）
   * @param {HTMLElement|null} btn   - クリックされたタブボタン（null可）
   */
  function switchMain(pageId, btn) {
    // ページ切替
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    // ボタンのactive切替
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      // btnが渡されない場合（文字列呼び出し）はdata属性またはonclick内容で照合
      document.querySelectorAll('.tab-btn').forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        if (onclick.includes(`'${pageId}'`) || onclick.includes(`"${pageId}"`)) {
          b.classList.add('active');
        }
      });
    }

    // コールバック実行
    if (_callbacks[pageId]) _callbacks[pageId]();
  }

  /**
   * サブタブを切り替える。
   * - "sub-{id}" のIDを持つ要素の表示/非表示を切り替える
   * - .sub-tab の active を切り替える
   * - 登録済みコールバックを実行する
   *
   * @param {string}      subId - サブタブID（例: 'list', 'delete'）
   * @param {HTMLElement} btn   - クリックされたサブタブボタン
   */
  function switchSub(subId, btn) {
    // sub-{id} 要素の表示切替（兄弟要素をすべて非表示）
    const parent = btn ? btn.closest('.sub-tab-bar') : null;
    if (parent) {
      parent.querySelectorAll('.sub-tab').forEach(b => {
        b.classList.remove('active');
        const thisId = (b.getAttribute('onclick') || '').match(/['"](\w+)['"]/)?.[1];
        if (thisId) {
          const panel = document.getElementById('sub-' + thisId);
          if (panel) panel.style.display = 'none';
        }
      });
    } else {
      // sub-tab-barが特定できない場合はdocument全体から探す
      document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
    }

    // 対象パネルを表示
    const panel = document.getElementById('sub-' + subId);
    if (panel) panel.style.display = 'block';

    // ボタンをactive
    if (btn) btn.classList.add('active');

    // コールバック実行
    if (_subCallbacks[subId]) _subCallbacks[subId]();
  }

  // 公開API
  return { switchMain, switchSub, onSwitch, onSubSwitch };

})();
