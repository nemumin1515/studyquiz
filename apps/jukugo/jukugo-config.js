/**
 * jukugo-config.js v1
 * 熟語クイズ アプリ設定
 *
 * 【読み込み順】
 *   1. jukugo-config.js  ← このファイル（APP_CONFIGを定義）
 *   2. ../../core/strage/points.js
 *   3. ../../core/strage/records.js
 *   4. index.html 内インラインスクリプト（backup / quiz ロジック）
 */

const APP_CONFIG = {
  appId    : 'jukugo_app',
  appTitle : '熟語クイズ',

  // データファイルのパス（index.html からの相対パス）
  dataFile : '../../data/jukugo.json',

  // 絞り込みフィルターの表示ラベル
  filterLabels: {
    attr_1 : 'テキスト',
    attr_2 : '学期',
    attr_3 : '小テスト範囲',
    attr_4 : '小テスト',
  },
};
