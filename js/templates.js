/*
 * Pinball Maker — Copyright (c) 2026 FUJIYAMA2236 — MIT License (see LICENSE)
 *
 * ひな形（テンプレート）とサンプル
 * ------------------------------------------------------------------
 * 「新規」ボタンで選べるテーブルです。座標はテーブル左上が (0,0)、
 * 幅 560 × 高さ 1000。右端の細い通路が発射レーンです。
 */
(function () {
  'use strict';

  const MX = 260; // 左右対称の軸（発射レーンを除いたプレイフィールドの中心）

  function mirror(o) {
    const m = Object.assign({}, o);
    ['x', 'x1', 'x2', 'x3', 'cx'].forEach((k) => { if (m[k] !== undefined) m[k] = 2 * MX - m[k]; });
    if (m.type === 'flipper') m.side = m.side === 'right' ? 'left' : 'right';
    if (m.type === 'hole') m.angle = 180 - m.angle;
    if (m.type === 'text' || m.type === 'deco') m.angle = -(m.angle || 0);
    if (m.type === 'gate') { [m.x1, m.x2] = [m.x2, m.x1]; [m.y1, m.y2] = [m.y2, m.y1]; }
    return m;
  }

  // 左側の部品と、その左右反転コピーをまとめて返す
  function pair(list) { return list.concat(list.map(mirror)); }

  // 外枠・発射レーン・フリッパーなど、どのテーブルにも必要な骨組み
  function shell(outlanes) {
    const o = [
      { type: 'wall', x1: 552, y1: 1000, x2: 552, y2: 190 },
      { type: 'curve', x1: 552, y1: 190, cx: 552, cy: 14, x2: 280, y2: 14 },
      { type: 'curve', x1: 280, y1: 14, cx: 8, cy: 14, x2: 8, y2: 190 },
      { type: 'wall', x1: 8, y1: 190, x2: 8, y2: outlanes ? 1000 : 820 },
      { type: 'wall', x1: 512, y1: 1000, x2: 512, y2: 300 },
      { type: 'gate', x1: 549, y1: 262, x2: 515, y2: 297 },
      { type: 'plunger', x: 532, y: 960 },
    ];
    if (outlanes) {
      // アウトレーン（外側の通路）はボール1個がちょうど通れる幅にする
      o.push(...pair([
        { type: 'wall', x1: 46, y1: 700, x2: 46, y2: 836 },
        { type: 'wall', x1: 46, y1: 836, x2: 150, y2: 890 },
        { type: 'post', x: 46, y: 694, r: 6 },
      ]));
    } else {
      o.push(...pair([{ type: 'wall', x1: 8, y1: 820, x2: 150, y2: 890 }]));
    }
    o.push(...pair([{ type: 'flipper', side: 'left', x: 156, y: 900, length: 88, angle: 28 }]));
    return o;
  }

  const standard = {
    title: 'MY PINBALL',
    table: { width: 560, height: 1000, mirrorX: MX, bg1: '#0a0f2e', bg2: '#1d0b3d', pattern: 'stars',
      wallColor: '#4de8ff', ballColor: '#eef2ff', balls: 3, gravity: 1, ballSave: 6, ballSize: 12 },
    objects: shell(false).concat(
      pair([{ type: 'slingshot', x1: 70, y1: 690, x2: 128, y2: 800, x3: 70, y3: 780 }]),
      [
        { type: 'bumper', x: 190, y: 300, r: 28, color: '#ff3d81' },
        { type: 'bumper', x: 330, y: 300, r: 28, color: '#ff3d81' },
        { type: 'bumper', x: 260, y: 400, r: 28, color: '#ffd23f' },
        { type: 'rollover', x: 200, y: 120 },
        { type: 'rollover', x: 260, y: 120 },
        { type: 'rollover', x: 320, y: 120 },
        { type: 'text', x: MX, y: 580, text: 'PINBALL', size: 52, alpha: 0.2 },
      ]
    ),
  };

  const blank = {
    title: 'MY PINBALL',
    table: Object.assign({}, standard.table, { bg1: '#101626', bg2: '#1a2338', pattern: 'grid', wallColor: '#9ab4ff' }),
    objects: shell(false),
  };

  const galaxy = {
    title: 'GALAXY DRIVE',
    table: { width: 560, height: 1000, mirrorX: MX, bg1: '#050a24', bg2: '#2a0a3d', pattern: 'stars',
      wallColor: '#4de8ff', ballColor: '#f1f4ff', balls: 3, gravity: 1, ballSave: 8, ballSize: 12 },
    objects: shell(true).concat(
      pair([{ type: 'slingshot', x1: 84, y1: 690, x2: 136, y2: 798, x3: 84, y3: 780, color: '#36e0ff', score: 10 }]),
      [
        // 上のレーン（3つ全部光らせると倍率アップ）
        { type: 'wall', x1: 170, y1: 66, x2: 170, y2: 118, thick: 4 },
        { type: 'wall', x1: 230, y1: 66, x2: 230, y2: 118, thick: 4 },
        { type: 'wall', x1: 290, y1: 66, x2: 290, y2: 118, thick: 4 },
        { type: 'wall', x1: 350, y1: 66, x2: 350, y2: 118, thick: 4 },
        { type: 'rollover', x: 200, y: 92, color: '#7dff6a', score: 100, group: 'A' },
        { type: 'rollover', x: 260, y: 92, color: '#7dff6a', score: 100, group: 'A' },
        { type: 'rollover', x: 320, y: 92, color: '#7dff6a', score: 100, group: 'A' },
        // バンパー
        { type: 'bumper', x: 200, y: 232, r: 28, color: '#ff3d81', score: 100 },
        { type: 'bumper', x: 320, y: 232, r: 28, color: '#ff3d81', score: 100 },
        { type: 'bumper', x: 260, y: 318, r: 28, color: '#ffd23f', score: 100 },
        // 左：ボールを捕まえてバンパーへ打ち出す穴
        { type: 'hole', x: 74, y: 318, r: 18, color: '#b07bff', score: 1000, angle: 6, power: 820, hold: 1.2 },
        // 左：ドロップターゲット（上の斜め壁は、壁とのすき間にボールが挟まらないように）
        { type: 'wall', x1: 8, y1: 396, x2: 32, y2: 418, thick: 4 },
        { type: 'droptarget', x1: 34, y1: 420, x2: 37, y2: 452, color: '#ff8a3d', score: 500, group: 'A' },
        { type: 'droptarget', x1: 38, y1: 464, x2: 41, y2: 496, color: '#ff8a3d', score: 500, group: 'A' },
        { type: 'droptarget', x1: 42, y1: 508, x2: 45, y2: 540, color: '#ff8a3d', score: 500, group: 'A' },
        // 右：スタンドターゲット
        { type: 'wall', x1: 512, y1: 368, x2: 490, y2: 388, thick: 4 },
        { type: 'target', x1: 488, y1: 392, x2: 488, y2: 422, color: '#ffd23f', score: 200, group: 'A' },
        { type: 'target', x1: 488, y1: 436, x2: 488, y2: 466, color: '#ffd23f', score: 200, group: 'A' },
        { type: 'target', x1: 488, y1: 480, x2: 488, y2: 510, color: '#ffd23f', score: 200, group: 'A' },
        // 右：上段のミニフリッパー
        { type: 'wall', x1: 512, y1: 544, x2: 492, y2: 566, thick: 4 },
        { type: 'flipper', side: 'right', x: 494, y: 574, length: 62, angle: 22, sweep: 50, color: '#ffffff' },
        // 飾り
        { type: 'text', x: MX, y: 470, text: 'GALAXY\nDRIVE', size: 46, color: '#9be7ff', alpha: 0.22 },
        { type: 'deco', x: 200, y: 160, r: 10, shape: 'arrow', color: '#7dff6a', blink: true },
        { type: 'deco', x: 260, y: 160, r: 10, shape: 'arrow', color: '#7dff6a', blink: true },
        { type: 'deco', x: 320, y: 160, r: 10, shape: 'arrow', color: '#7dff6a', blink: true },
        { type: 'deco', x: 120, y: 600, r: 12, shape: 'star', color: '#ffd23f', blink: true },
        { type: 'deco', x: 400, y: 640, r: 9, shape: 'star', color: '#ff7ab8', blink: true },
        { type: 'deco', x: 260, y: 640, r: 8, shape: 'diamond', color: '#36e0ff', blink: true },
        { type: 'deco', x: 230, y: 380, r: 6, shape: 'circle', color: '#ffffff', blink: true },
        { type: 'deco', x: 300, y: 395, r: 5, shape: 'circle', color: '#ffffff', blink: true },
      ]
    ),
  };

  window.PINBALL_TEMPLATES = [
    { id: 'standard', project: standard,
      name: { ja: 'スタンダード', en: 'Standard' },
      desc: { ja: 'バンパー・スリングショット・レーン付き。まずはここから！', en: 'Bumpers, slingshots and lanes. A good place to start!' } },
    { id: 'blank', project: blank,
      name: { ja: 'からっぽ', en: 'Blank' },
      desc: { ja: '外枠・発射台・フリッパーだけ。ゼロから作りたい人に', en: 'Just the frame, plunger and flippers. Build from scratch.' } },
    { id: 'galaxy', project: galaxy,
      name: { ja: 'サンプル：GALAXY DRIVE', en: 'Sample: GALAXY DRIVE' },
      desc: { ja: 'ほぼ全部のパーツを使った完成版サンプル', en: 'A finished sample that uses almost every part' } },
  ];
})();
