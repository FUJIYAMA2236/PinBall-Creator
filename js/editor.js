/*
 * Pinball Maker — Copyright (c) 2026 FUJIYAMA2236 — MIT License (see LICENSE)
 *
 * ピンボールメーカー エディタ
 * ------------------------------------------------------------------
 * テーブル（project）を編集し、engine.js でそのまま遊べるHTMLとして書き出します。
 * 画面の文字は日本語 / English の2言語（L() と P2() を参照）。
 */
(function () {
  'use strict';

  const E = window.PinballEngine;
  const ENGINE_SRC = createPinballEngine.toString(); // 書き出しHTMLに埋め込むエンジン本体
  const TEMPLATES = window.PINBALL_TEMPLATES || [];
  const AUTOSAVE_KEY = 'pinball-maker:autosave';
  const DEVICE_KEY = 'pinball-maker:device';
  const GRID = 10;
  const DEG = Math.PI / 180;
  const ACCENT = '#36e0ff';
  const COORD_KEYS = [['x', 'y'], ['x1', 'y1'], ['x2', 'y2'], ['x3', 'y3'], ['cx', 'cy']];

  const SWATCHES = ['#ff3d81', '#ff8a3d', '#ffd23f', '#7dff6a', '#36e0ff', '#4d7cff', '#b07bff', '#ff7ab8', '#ffffff', '#c0c6d8', '#5a6080'];
  const BG_SWATCHES = ['#0a0f2e', '#1d0b3d', '#050a24', '#2a0a3d', '#06231a', '#021b33', '#05445e', '#141414', '#3b0f2f', '#ffe3f1', '#d9f0ff'];

  // ================================================================
  //  言語（日本語 / English）
  // ================================================================
  const LANG_KEY = 'pinball-maker:lang';
  let lang = (function () {
    try { const v = localStorage.getItem(LANG_KEY); if (v === 'ja' || v === 'en') return v; } catch (e) { /* 無視 */ }
    return /^ja\b/i.test(navigator.language || '') ? 'ja' : 'en';
  })();
  const L = (ja, en) => (lang === 'en' ? en : ja);     // その場で表示する文字列
  const P2 = (ja, en) => ({ ja, en });                 // あとで表示する文字列（パーツ定義など）
  const tr = (v) => (v && typeof v === 'object' ? v[lang] : v);

  const THEMES = [
    { name: P2('ネオン', 'Neon'), bg1: '#0a0f2e', bg2: '#1d0b3d', wallColor: '#4de8ff', ballColor: '#eef2ff', pattern: 'stars' },
    { name: P2('サンセット', 'Sunset'), bg1: '#1d0b2b', bg2: '#5a1a3c', wallColor: '#ffb347', ballColor: '#fff4e6', pattern: 'stripes' },
    { name: P2('フォレスト', 'Forest'), bg1: '#06231a', bg2: '#0d3b2a', wallColor: '#9dff7a', ballColor: '#f4ffe9', pattern: 'dots' },
    { name: P2('オーシャン', 'Ocean'), bg1: '#021b33', bg2: '#05445e', wallColor: '#7fe7ff', ballColor: '#eaffff', pattern: 'dots' },
    { name: P2('モノクロ', 'Mono'), bg1: '#141414', bg2: '#2b2b2b', wallColor: '#e6e6e6', ballColor: '#ffffff', pattern: 'grid' },
    { name: P2('キャンディ', 'Candy'), bg1: '#ffe3f1', bg2: '#d9f0ff', wallColor: '#ff5fa2', ballColor: '#6b6b8f', pattern: 'dots' },
  ];

  // index.html に書かれた文字（data-i18n / data-i18n-html / data-i18n-title で指定）
  const UI = {
    app: P2('ピンボールメーカー', 'Pinball Maker'),
    'new': P2('新規', 'New'), 'new.t': P2('新しく作る（ひな形を選ぶ）', 'New table (choose a template)'),
    open: P2('開く', 'Open'), 'open.t': P2('ファイルを開く（.json / 書き出したhtml）', 'Open a file (.json or an exported .html)'),
    save: P2('保存', 'Save'), 'save.t': P2('作品を保存（Ctrl+S）', 'Save your table as a file (Ctrl+S)'),
    'undo.t': P2('元に戻す（Ctrl+Z）', 'Undo (Ctrl+Z)'), 'redo.t': P2('やり直し（Ctrl+Y）', 'Redo (Ctrl+Y)'),
    'title.t': P2('ゲームのタイトル（タイトル画面に表示されます）', 'Game title (shown on the title screen)'),
    'help.t': P2('使い方・ライセンス', 'How to use / License'),
    lang: P2('English', '日本語'), 'lang.t': P2('Switch to English', '日本語に切り替え'),
    play: P2('テストプレイ', 'Test play'), 'play.t': P2('テストプレイ（Ctrl+Enter）', 'Test play (Ctrl+Enter)'),
    'export': P2('HTML書き出し', 'Export HTML'), 'export.t': P2('遊べるHTMLファイルとして書き出す', 'Export as a playable HTML file'),
    parts: P2('パーツ', 'PARTS'),
    'parts.hint': P2('ドラッグしてテーブルに置く<br>クリックで真ん中に追加', 'Drag onto the table<br>or click to add in the middle'),
    'zoomOut.t': P2('縮小', 'Zoom out'), 'zoomIn.t': P2('拡大', 'Zoom in'),
    fit: P2('全体', 'Fit'), 'fit.t': P2('全体を表示', 'Show the whole table'),
    snap: P2('吸着', 'Snap'), 'snap.t': P2('パーツを10マス単位でそろえる', 'Snap parts to a 10-unit grid'),
    grid: P2('方眼', 'Grid'), 'grid.t': P2('方眼と左右対称の軸を表示', 'Show the grid and the mirror axis'),
    openFile: P2('ファイルから開く…', 'Open a file…'),
    playTitle: P2('テストプレイ', 'Test play'), phone: P2('スマホ表示', 'Phone'), pc: P2('PC表示', 'Desktop'),
    restart: P2('最初から', 'Restart'),
    playTip: P2('操作：左右をクリック / Z・/ キー　発射：長押し / Space　揺らす：X・. / 上へはらう（キーはテーブル設定で変更可）',
      'Flippers: click left/right or Z and /   Launch: hold, or Space   Nudge: X . or flick up (keys can be changed in table settings)'),
    playClose: P2('編集に戻る（Esc）', 'Back to editor (Esc)'),
    exportTitle: P2('HTMLとして書き出す', 'Export as HTML'),
    exportLead: P2('1つのHTMLファイルにゲームがまるごと入ります。ブラウザで開くだけで遊べます。', 'The whole game goes into one HTML file. Just open it in a browser to play.'),
    fileName: P2('ファイル名', 'File name'), download: P2('ダウンロード', 'Download'),
    helpTitle: P2('使い方・ライセンス', 'How to use / License'),
  };

  function applyStaticText() {
    document.documentElement.lang = lang;
    document.title = tr(UI.app);
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(UI[el.dataset.i18n]); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = tr(UI[el.dataset.i18nHtml]); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = tr(UI[el.dataset.i18nTitle]); });
  }

  // ================================================================
  //  パーツ定義（パレットとインスペクタの中身）
  // ================================================================
  const range = (key, label, min, max, step, help) => ({ kind: 'range', key, label, min, max, step, help });
  const color = (auto) => ({ kind: 'color', key: 'color', label: P2('色', 'Color'), auto });
  const score = range('score', P2('得点', 'Points'), 0, 5000, 10);
  const group = { kind: 'seg', key: 'group', label: P2('グループ', 'Group'),
    help: P2('同じグループを全部そろえるとボーナス', 'Complete every part in the same group for a bonus'),
    options: [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D']] };
  const bounce = range('bounce', P2('はね返り', 'Bounciness'), 0.1, 0.95, 0.05);
  const thick = range('thick', P2('太さ', 'Thickness'), 2, 16, 1);
  const size = (min, max) => range('r', P2('大きさ', 'Size'), min, max, 1);
  const kick = (max) => range('power', P2('はじく強さ', 'Kick strength'), 200, max, 20);
  const angle = (step) => range('angle', P2('回転', 'Rotation'), -180, 180, step);
  const CAT = { wall: P2('かべ', 'Walls'), score: P2('得点パーツ', 'Scoring'), ctrl: P2('操作', 'Controls'), deco: P2('飾り', 'Decoration') };

  const PARTS = [
    { type: 'wall', cat: CAT.wall, name: P2('壁', 'Wall'),
      desc: P2('まっすぐな壁。両端の●をドラッグすると長さや向きが変わります。',
        'A straight wall. Drag the ● at either end to change its length and direction.'),
      make: (x, y) => ({ x1: x - 60, y1: y, x2: x + 60, y2: y }),
      props: [color(true), thick, bounce] },
    { type: 'curve', cat: CAT.wall, name: P2('カーブ壁', 'Curve'), full: P2('カーブ壁', 'Curved wall'),
      desc: P2('曲がった壁。両端の●と、まん中の◆をドラッグして曲がり具合を調整します。',
        'A curved wall. Drag the ● ends and the ◆ in the middle to shape the curve.'),
      make: (x, y) => ({ x1: x - 70, y1: y + 30, cx: x, cy: y - 50, x2: x + 70, y2: y + 30 }),
      props: [color(true), thick, bounce] },
    { type: 'post', cat: CAT.wall, name: P2('ポスト', 'Post'),
      desc: P2('小さな丸いゴムの柱。レーンの仕切りや通り道づくりに。', 'A small round rubber post. Handy for lane dividers and paths.'),
      make: (x, y) => ({ x, y }),
      props: [color(), size(3, 24), bounce] },
    { type: 'gate', cat: CAT.wall, name: P2('ゲート', 'Gate'), full: P2('ワンウェイゲート', 'One-way gate'),
      desc: P2('矢印の向きにだけボールを通す扉。発射レーンの出口などに使います。',
        'Lets the ball through only in the arrow direction. Use it at the exit of the plunger lane.'),
      make: (x, y) => ({ x1: x + 22, y1: y, x2: x - 22, y2: y }),
      props: [color(), { kind: 'button', label: P2('通す向きを反転', 'Reverse direction'), run: swapEnds }] },
    { type: 'bumper', cat: CAT.score, name: P2('バンパー', 'Bumper'),
      desc: P2('当たるとボールを勢いよくはじき返す、ピンボールの主役。', 'Kicks the ball away hard when hit — the star of any pinball table.'),
      make: (x, y) => ({ x, y }),
      props: [color(), size(12, 60), kick(1400), score] },
    { type: 'slingshot', cat: CAT.score, name: P2('スリング', 'Sling'), full: P2('スリングショット', 'Slingshot'),
      desc: P2('三角形のはじき台。白いゴムの面に当たるとボールをはじきます。3つの角をドラッグして変形。',
        'A triangular kicker. The white rubber side kicks the ball. Drag the three corners to reshape it.'),
      make: (x, y, right) => right
        ? { x1: x + 25, y1: y - 55, x2: x - 30, y2: y + 55, x3: x + 25, y3: y + 35 }
        : { x1: x - 25, y1: y - 55, x2: x + 30, y2: y + 55, x3: x - 25, y3: y + 35 },
      props: [color(), kick(1200), score] },
    { type: 'target', cat: CAT.score, name: P2('ターゲット', 'Target'),
      desc: P2('当てると光る的。同じグループを全部光らせるとボーナス！', 'Lights up when hit. Light every target in the same group for a bonus!'),
      make: (x, y) => ({ x1: x, y1: y - 16, x2: x, y2: y + 16 }),
      props: [color(), score, group] },
    { type: 'droptarget', cat: CAT.score, name: P2('ドロップ', 'Drop'), full: P2('ドロップターゲット', 'Drop target'),
      desc: P2('当てると倒れる的。同じグループを全部倒すとボーナス、そして復活します。',
        'Drops when hit. Knock down the whole group for a bonus — then they pop back up.'),
      make: (x, y) => ({ x1: x, y1: y - 16, x2: x, y2: y + 16 }),
      props: [color(), score, group] },
    { type: 'rollover', cat: CAT.score, name: P2('ロールオーバー', 'Rollover'),
      desc: P2('ボールが上を通ると点灯。同じグループを全部点灯させると得点倍率アップ！（フリッパーを押すと点灯が左右にずれます）',
        'Lights up when the ball rolls over it. Light the whole group to raise the score multiplier! (Pressing a flipper shifts the lit lanes.)'),
      make: (x, y) => ({ x, y }),
      props: [color(), size(8, 30), score, group] },
    { type: 'hole', cat: CAT.score, name: P2('ホール', 'Hole'), full: P2('ホール', 'Kickout hole'),
      desc: P2('ボールを一時的に捕まえて、矢印の向きへ打ち出します。矢印の先をドラッグして向きを変更。',
        'Catches the ball for a moment and shoots it out along the arrow. Drag the arrow tip to aim.'),
      make: (x, y) => ({ x, y }),
      props: [color(), size(10, 40), range('angle', P2('打ち出す向き', 'Launch direction'), -180, 180, 5),
        range('power', P2('打ち出す強さ', 'Launch strength'), 200, 1800, 20),
        range('hold', P2('捕まえる時間（秒）', 'Hold time (sec)'), 0.2, 3, 0.1), score] },
    { type: 'flipper', cat: CAT.ctrl, name: P2('フリッパー', 'Flipper'),
      desc: P2('プレイヤーが操作する打ち返し板。左ボタン（画面の左側）か右ボタン（右側）で動きます。先端の●で長さと角度を変更。',
        'The paddles the player controls. They move with the left button (left half of the screen) or the right button (right half). Drag the ● at the tip to change length and angle.'),
      make: (x, y, right) => ({ x, y, side: right ? 'right' : 'left' }),
      props: [{ kind: 'seg', key: 'side', label: P2('形（向き）', 'Shape'), help: P2('左用は支点が左、右用は支点が右', 'Left-hand pivots on the left, right-hand on the right'),
        options: [['left', P2('左用', 'Left-hand')], ['right', P2('右用', 'Right-hand')]] },
        { kind: 'seg', key: 'button', label: P2('操作するボタン', 'Controlled by'),
          help: P2('「左」「右」を選ぶと、形とは逆のボタンで動くフリッパーも作れます', 'Choose Left or Right to make a flipper that moves with the opposite button from its shape'),
          options: [['auto', P2('形と同じ', 'Same as shape')], ['left', P2('左', 'Left')], ['right', P2('右', 'Right')]] },
        range('length', P2('長さ', 'Length'), 30, 180, 1), range('angle', P2('角度', 'Angle'), -80, 80, 1),
        range('sweep', P2('振れ幅', 'Swing'), 20, 100, 1), range('power', P2('強さ', 'Strength'), 0.5, 1.6, 0.05), color()] },
    { type: 'plunger', cat: CAT.ctrl, name: P2('発射台', 'Plunger'),
      desc: P2('ボールが出てくる場所。長押しして離すと発射します。テーブルに1つだけ置けます。',
        'Where the ball comes out. Hold and release to launch. Only one per table.'),
      make: (x, y) => ({ x, y }), unique: true,
      props: [range('power', P2('最大パワー', 'Max power'), 800, 3200, 50), color()] },
    { type: 'text', cat: CAT.deco, name: P2('文字', 'Text'),
      desc: P2('テーブルに描く文字。当たり判定はありません。', 'Text painted on the table. The ball passes over it.'),
      make: (x, y) => ({ x, y, text: 'TEXT', size: 40, alpha: 0.5 }), icon: { text: 'Aa', size: 40, alpha: 1 },
      props: [{ kind: 'text', key: 'text', label: P2('文字（改行もOK）', 'Text (line breaks OK)'), multiline: true },
        range('size', P2('大きさ', 'Size'), 10, 160, 1), color(), range('alpha', P2('濃さ', 'Opacity'), 0.05, 1, 0.05), angle(1)] },
    { type: 'deco', cat: CAT.deco, name: P2('飾りライト', 'Light'), full: P2('飾りライト', 'Decoration light'),
      desc: P2('キラキラ光る飾り。当たり判定はありません。', 'A twinkling decoration. The ball passes over it.'),
      make: (x, y) => ({ x, y }),
      props: [{ kind: 'seg', key: 'shape', label: P2('形', 'Shape'), options: [['star', '★'], ['circle', '●'], ['diamond', '◆'], ['arrow', '▲'], ['heart', '♥']] },
        color(), size(3, 60), angle(5), { kind: 'check', key: 'blink', label: P2('ゲーム中に点滅する', 'Blink during the game') }] },
  ];
  const PART = {};
  PARTS.forEach((p) => { PART[p.type] = p; });
  const partName = (o) => tr(PART[o.type].full || PART[o.type].name);
  const propSpec = (type, key) => PART[type].props.find((p) => p.key === key);

  function swapEnds(o) {
    [o.x1, o.x2] = [o.x2, o.x1];
    [o.y1, o.y2] = [o.y2, o.y1];
  }

  // ================================================================
  //  状態
  // ================================================================
  let project = null;
  let sel = new Set();
  let hoverId = null, hoverHandle = null;
  let drag = null;
  let ghost = null;                 // パレットからドラッグ中のパーツ
  let bgEdit = false;               // 背景画像の調整モード中
  const view = { s: 1, ox: 0, oy: 0, auto: true };
  const opt = { snap: true, grid: true };
  const hist = { stack: [], idx: -1 };
  let clipboard = null, pasteN = 0;
  let spaceDown = false;
  let renderQueued = false;
  let inspFields = [];
  let nudgeTimer = 0;
  let device = storeGet(DEVICE_KEY) || 'phone';

  const $ = (s) => document.querySelector(s);
  const stage = $('#stage'), sctx = stage.getContext('2d'), stageWrap = $('#stageWrap');
  const inspector = $('#inspector'), statusEl = $('#status'), titleInput = $('#titleInput');
  const measure = document.createElement('canvas').getContext('2d');

  function storeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 保存できない環境 */ } }

  // 小さなDOMヘルパー
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of kids.flat()) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c.nodeType ? c : String(c));
    }
    return el;
  }

  // ================================================================
  //  幾何
  // ================================================================
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const snapV = (v, on) => (on ? Math.round(v / GRID) * GRID : Math.round(v));
  const normAngle = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function findObj(id) { return project.objects.find((o) => o.id === id); }
  function selected() { return project.objects.filter((o) => sel.has(o.id)); }
  function uid() { let id; do id = E.newId(); while (findObj(id)); return id; }

  function translate(o, dx, dy) {
    for (const [kx, ky] of COORD_KEYS) {
      if (o[kx] !== undefined) { o[kx] += dx; o[ky] += dy; }
    }
  }
  function anchorOf(o) { return o.x !== undefined ? [o.x, o.y] : [o.x1, o.y1]; }

  function mirrorObj(o, mx) {
    for (const [kx] of COORD_KEYS) if (o[kx] !== undefined) o[kx] = 2 * mx - o[kx];
    if (o.type === 'flipper') {
      o.side = o.side === 'left' ? 'right' : 'left';
      if (o.button === 'left' || o.button === 'right') o.button = o.button === 'left' ? 'right' : 'left';
    }
    if (o.type === 'hole') o.angle = normAngle(180 - o.angle);
    if (o.type === 'text' || o.type === 'deco') o.angle = -o.angle;
    if (o.type === 'gate') swapEnds(o);
  }

  function textSize(o) {
    measure.font = '900 ' + o.size + 'px ' + E.FONT;
    const lines = String(o.text).split('\n');
    const w = Math.max(o.size * 0.5, ...lines.map((l) => measure.measureText(l).width));
    return [w, lines.length * o.size * 1.1];
  }

  function bounds(o) {
    const T = project.table;
    let xs, ys, pad = 0;
    switch (o.type) {
      case 'wall': case 'target': case 'droptarget': case 'gate':
        xs = [o.x1, o.x2]; ys = [o.y1, o.y2]; pad = (o.thick || 5) + 1;
        break;
      case 'curve': {
        const p = E.bezierPts(o);
        xs = p.map((q) => q[0]); ys = p.map((q) => q[1]); pad = o.thick + 1;
        break;
      }
      case 'slingshot':
        xs = [o.x1, o.x2, o.x3]; ys = [o.y1, o.y2, o.y3]; pad = 5;
        break;
      case 'flipper': {
        const g = E.flipperGeom(o);
        xs = [o.x, o.x + Math.cos(g.rest) * o.length, o.x + Math.cos(g.up) * o.length];
        ys = [o.y, o.y + Math.sin(g.rest) * o.length, o.y + Math.sin(g.up) * o.length];
        pad = g.r1;
        break;
      }
      case 'plunger':
        return { x0: o.x - 14, y0: o.y - T.ballSize * 2 - 3, x1: o.x + 14, y1: Math.min(Math.max(T.height, o.y + 10), o.y + 90) };
      case 'text': {
        const [w, hh] = textSize(o), a = o.angle * DEG;
        const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
        const hw = (w * c + hh * s) / 2, hv = (w * s + hh * c) / 2;
        return { x0: o.x - hw, y0: o.y - hv, x1: o.x + hw, y1: o.y + hv };
      }
      default:
        return { x0: o.x - o.r, y0: o.y - o.r, x1: o.x + o.r, y1: o.y + o.r };
    }
    return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
  }

  function inTri(px, py, o) {
    const s = (ax, ay, bx, by) => (px - bx) * (ay - by) - (ax - bx) * (py - by);
    const d1 = s(o.x1, o.y1, o.x2, o.y2), d2 = s(o.x2, o.y2, o.x3, o.y3), d3 = s(o.x3, o.y3, o.x1, o.y1);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  }

  function hits(o, x, y, tol) {
    switch (o.type) {
      case 'wall': case 'target': case 'droptarget': case 'gate':
        return E.segDist(x, y, o.x1, o.y1, o.x2, o.y2) <= (o.thick || 5) + tol;
      case 'curve': {
        const p = E.bezierPts(o);
        for (let i = 1; i < p.length; i++) {
          if (E.segDist(x, y, p[i - 1][0], p[i - 1][1], p[i][0], p[i][1]) <= o.thick + tol) return true;
        }
        return false;
      }
      case 'slingshot':
        return inTri(x, y, o) || [[1, 2], [2, 3], [3, 1]].some(([a, b]) =>
          E.segDist(x, y, o['x' + a], o['y' + a], o['x' + b], o['y' + b]) <= 5 + tol);
      case 'flipper': {
        const g = E.flipperGeom(o);
        return E.segDist(x, y, o.x, o.y, o.x + Math.cos(g.rest) * o.length, o.y + Math.sin(g.rest) * o.length) <= g.r1 + tol;
      }
      case 'text': {
        const [w, hh] = textSize(o), a = -o.angle * DEG, dx = x - o.x, dy = y - o.y;
        const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        return Math.abs(lx) <= w / 2 + tol && Math.abs(ly) <= hh / 2 + tol;
      }
      case 'plunger': {
        const b = bounds(o);
        return x >= b.x0 - tol && x <= b.x1 + tol && y >= b.y0 - tol && y <= b.y1 + tol;
      }
      default:
        return Math.hypot(x - o.x, y - o.y) <= o.r + tol;
    }
  }

  const HIT_ORDER = E.LAYERS.slice().reverse();
  // 指定した位置にあるパーツ（上に描かれているものから順）
  function candidatesAt(x, y, tolPx) {
    const tol = (tolPx || 6) / view.s, out = [];
    for (const type of HIT_ORDER) {
      for (let i = project.objects.length - 1; i >= 0; i--) {
        const o = project.objects[i];
        if (o.type === type && hits(o, x, y, tol)) out.push(o);
      }
    }
    return out;
  }

  // 選択中のパーツに出すハンドル
  function handlesOf(o) {
    const P = (k, x, y, shape) => ({ k, x, y, shape: shape || 'dot' });
    switch (o.type) {
      case 'wall': case 'target': case 'droptarget': case 'gate':
        return [P('p1', o.x1, o.y1), P('p2', o.x2, o.y2)];
      case 'curve':
        return [P('p1', o.x1, o.y1), P('c', o.cx, o.cy, 'diamond'), P('p2', o.x2, o.y2)];
      case 'slingshot':
        return [P('p1', o.x1, o.y1), P('p2', o.x2, o.y2), P('p3', o.x3, o.y3)];
      case 'flipper': {
        const g = E.flipperGeom(o);
        return [P('tip', o.x + Math.cos(g.rest) * o.length, o.y + Math.sin(g.rest) * o.length)];
      }
      case 'hole': {
        const a = o.angle * DEG, L = o.r + 26, d = Math.max(o.r, 16 / view.s) * Math.SQRT1_2;
        return [P('r', o.x + d, o.y - d, 'square'), P('dir', o.x + Math.cos(a) * L, o.y + Math.sin(a) * L, 'ring')];
      }
      case 'bumper': case 'post': case 'rollover': case 'deco': {
        const d = Math.max(o.r, 16 / view.s) * Math.SQRT1_2;
        return [P('r', o.x + d, o.y - d, 'square')];
      }
      default:
        return [];
    }
  }

  const END_HINT = P2('<b>端の点</b>：ドラッグで長さ・向きを変更', '<b>End point</b>: drag to change length and direction');
  const HANDLE_HINT = {
    p1: END_HINT, p2: END_HINT,
    p3: P2('<b>角</b>：ドラッグで形を変更', '<b>Corner</b>: drag to reshape'),
    c: P2('<b>カーブの◆</b>：ドラッグで曲がり具合を変更', '<b>Curve ◆</b>: drag to bend the curve'),
    r: P2('<b>■</b>：ドラッグで大きさを変更', '<b>■</b>: drag to resize'),
    dir: P2('<b>矢印の先</b>：ドラッグで打ち出す向きを変更', '<b>Arrow tip</b>: drag to aim the launch'),
    tip: P2('<b>フリッパーの先端</b>：ドラッグで長さと角度を変更（点線は振り上げたときの位置）',
      '<b>Flipper tip</b>: drag to change length and angle (the dotted outline is the raised position)'),
  };

  // 縦か横、動かした量が大きい方だけを残す（Shift ドラッグ用）
  function straight(dx, dy) { return Math.abs(dx) >= Math.abs(dy) ? { dx, dy: 0 } : { dx: 0, dy }; }

  // fixed：'x' / 'y' はその座標を動かさない（吸着もしない）。shift：角度を45°おきにそろえる
  function applyHandle(o, k, wx, wy, snap, fixed, shift) {
    const sx = fixed === 'x' ? wx : snapV(wx, snap), sy = fixed === 'y' ? wy : snapV(wy, snap);
    switch (k) {
      case 'p1': o.x1 = sx; o.y1 = sy; break;
      case 'p2': o.x2 = sx; o.y2 = sy; break;
      case 'p3': o.x3 = sx; o.y3 = sy; break;
      case 'c': o.cx = sx; o.cy = sy; break;
      case 'r': {
        const sp = propSpec(o.type, 'r');
        o.r = clamp(Math.round(Math.hypot(wx - o.x, wy - o.y)), sp.min, sp.max);
        break;
      }
      case 'dir': {
        const step = shift ? 45 : snap ? 15 : 1;
        o.angle = normAngle(Math.round(Math.atan2(wy - o.y, wx - o.x) / DEG / step) * step);
        break;
      }
      case 'tip': {
        const a = Math.atan2(wy - o.y, wx - o.x) / DEG, step = shift ? 45 : snap ? 2 : 1;
        const ang = normAngle(o.side === 'right' ? 180 - a : a);
        o.angle = clamp(Math.round(ang / step) * step, -80, 80);
        o.length = clamp(Math.round(Math.hypot(wx - o.x, wy - o.y)), 30, 180);
        break;
      }
    }
  }

  // ================================================================
  //  履歴（元に戻す / やり直し）と自動保存
  // ================================================================
  // 背景画像（大きな data URL）は履歴に毎回コピーしないよう、短い参照キーに置き換えて積む
  const imgKeyOf = new Map(), imgOfKey = new Map();
  function packImage(k, v) {
    if (k !== 'bgImage' || typeof v !== 'string' || v.length < 256) return v;
    let key = imgKeyOf.get(v);
    if (!key) { key = '@img' + imgKeyOf.size; imgKeyOf.set(v, key); imgOfKey.set(key, v); }
    return key;
  }
  function unpackImage(k, v) { return k === 'bgImage' && imgOfKey.has(v) ? imgOfKey.get(v) : v; }

  function commit() {
    const s = JSON.stringify(project, packImage);
    if (hist.stack[hist.idx] === s) return;
    hist.stack.length = hist.idx + 1;
    hist.stack.push(s);
    if (hist.stack.length > 200) hist.stack.shift();
    hist.idx = hist.stack.length - 1;
    autosave();
    updateToolbar();
    if (!sel.size) refreshChecks();
  }
  function resetHistory() { hist.stack = []; hist.idx = -1; commit(); }
  function undo() { if (hist.idx > 0) { hist.idx--; restoreHistory(); } }
  function redo() { if (hist.idx < hist.stack.length - 1) { hist.idx++; restoreHistory(); } }
  function restoreHistory() {
    project = JSON.parse(hist.stack[hist.idx], unpackImage);
    if (!project.table.bgImage) bgEdit = false;
    for (const id of [...sel]) if (!findObj(id)) sel.delete(id);
    autosave();
    refreshAll();
  }

  let autosaveWarned = false;
  function autosave() {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
      autosaveWarned = false;
    } catch (e) {
      if (!autosaveWarned) {
        autosaveWarned = true;
        toast(L('ブラウザに自動保存できませんでした（画像が大きすぎるかも）。「保存」でファイルにしてください',
          'Could not autosave in this browser (the image may be too large). Use "Save" to keep a file.'), 'error');
      }
    }
  }
  function isDirty() { return hist.idx > 0; }

  function updateToolbar() {
    $('#btnUndo').disabled = hist.idx <= 0;
    $('#btnRedo').disabled = hist.idx >= hist.stack.length - 1;
  }

  // ================================================================
  //  描画
  // ================================================================
  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(render);
  }

  function toScreen(x, y) { return { x: x * view.s + view.ox, y: y * view.s + view.oy }; }
  function toWorld(sx, sy) { return { x: (sx - view.ox) / view.s, y: (sy - view.oy) / view.s }; }
  function stagePos(e) { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  function isLight(c) {
    const v = parseInt(String(c).slice(1), 16);
    return ((v >> 16 & 255) * 0.299 + (v >> 8 & 255) * 0.587 + (v & 255) * 0.114) / 255 > 0.6;
  }

  function render() {
    renderQueued = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = stageWrap.clientWidth, ch = stageWrap.clientHeight;
    const pw = Math.round(cw * dpr), ph = Math.round(ch * dpr);
    if (stage.width !== pw || stage.height !== ph) { stage.width = pw; stage.height = ph; }
    const ctx = sctx, T = project.table, k = view.s * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pw, ph);

    ctx.setTransform(k, 0, 0, k, view.ox * dpr, view.oy * dpr);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 40 * dpr;
    ctx.fillStyle = T.bg1;
    ctx.fillRect(0, 0, T.width, T.height);
    ctx.restore();
    E.drawScene(ctx, project, { editor: true, px: k, onImage: requestRender });
    let bgRect = null;
    if (bgEdit) {
      // 調整中は、切り取られて見えない部分も薄く表示する
      const img = E.getImage(T.bgImage);
      if (img && img.complete && img.naturalWidth) {
        bgRect = E.bgPlacement(project, img);
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.drawImage(img, bgRect.x, bgRect.y, bgRect.w, bgRect.h);
        ctx.restore();
      }
    }
    if (opt.grid && !bgEdit) drawGrid(ctx, T);
    if (ghost) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      E.drawObject(ctx, ghost, T, null, { editor: true, px: k });
      ctx.restore();
    }

    // ここからは画面座標で描く（ハンドルなどは拡大率に関係なく同じ大きさ）
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (bgRect) {
      const a = toScreen(bgRect.x, bgRect.y), b = toScreen(bgRect.x + bgRect.w, bgRect.y + bgRect.h);
      ctx.save();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.restore();
    }
    if (hoverId && !sel.has(hoverId) && !drag && !bgEdit) {
      const o = findObj(hoverId);
      if (o) outline(ctx, o, 'rgba(54,224,255,0.5)', [3, 3]);
    }
    for (const o of selected()) outline(ctx, o, ACCENT, [6, 4]);
    if (sel.size === 1) drawHandles(ctx, selected()[0]);
    if (drag && drag.mode === 'box') {
      const a = toScreen(drag.start.x, drag.start.y), b = toScreen(drag.cur.x, drag.cur.y);
      ctx.fillStyle = 'rgba(54,224,255,0.08)';
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      ctx.setLineDash([]);
    }
  }

  function drawGrid(ctx, T) {
    const ink = isLight(T.bg1) ? '0,0,40' : '255,255,255';
    const step = view.s * GRID >= 7 ? GRID : GRID * 2;
    ctx.save();
    ctx.lineWidth = 1 / view.s;
    ctx.beginPath();
    for (let x = step; x < T.width; x += step) if (x % 100) { ctx.moveTo(x, 0); ctx.lineTo(x, T.height); }
    for (let y = step; y < T.height; y += step) if (y % 100) { ctx.moveTo(0, y); ctx.lineTo(T.width, y); }
    ctx.strokeStyle = 'rgba(' + ink + ',0.05)';
    ctx.stroke();
    ctx.beginPath();
    for (let x = 100; x < T.width; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, T.height); }
    for (let y = 100; y < T.height; y += 100) { ctx.moveTo(0, y); ctx.lineTo(T.width, y); }
    ctx.strokeStyle = 'rgba(' + ink + ',0.11)';
    ctx.stroke();
    // 左右対称の軸
    ctx.setLineDash([8 / view.s, 6 / view.s]);
    ctx.strokeStyle = 'rgba(255,61,129,0.55)';
    ctx.lineWidth = 1.5 / view.s;
    ctx.beginPath();
    ctx.moveTo(T.mirrorX, 0);
    ctx.lineTo(T.mirrorX, T.height);
    ctx.stroke();
    ctx.restore();
  }

  function outline(ctx, o, color, dash) {
    const b = bounds(o), p0 = toScreen(b.x0, b.y0), p1 = toScreen(b.x1, b.y1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash(dash);
    ctx.strokeRect(Math.round(p0.x) - 4.5, Math.round(p0.y) - 4.5, Math.round(p1.x - p0.x) + 9, Math.round(p1.y - p0.y) + 9);
    ctx.restore();
  }

  function drawHandles(ctx, o) {
    if (!o) return;
    ctx.save();
    if (o.type === 'curve') {
      const a = toScreen(o.x1, o.y1), c = toScreen(o.cx, o.cy), b = toScreen(o.x2, o.y2);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(54,224,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (o.type === 'flipper') {
      const p = toScreen(o.x, o.y);
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 6, p.y); ctx.lineTo(p.x + 6, p.y); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x, p.y + 6);
      ctx.stroke();
    }
    for (const hd of handlesOf(o)) {
      const p = toScreen(hd.x, hd.y);
      const active = (drag && drag.mode === 'handle' && drag.k === hd.k) || hoverHandle === hd.k;
      ctx.beginPath();
      if (hd.shape === 'square') ctx.rect(p.x - 6, p.y - 6, 12, 12);
      else if (hd.shape === 'diamond') { ctx.moveTo(p.x, p.y - 8); ctx.lineTo(p.x + 8, p.y); ctx.lineTo(p.x, p.y + 8); ctx.lineTo(p.x - 8, p.y); ctx.closePath(); }
      else ctx.arc(p.x, p.y, hd.shape === 'ring' ? 8 : 7, 0, Math.PI * 2);
      ctx.fillStyle = active ? ACCENT : '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2;
      ctx.strokeStyle = active ? '#ffffff' : ACCENT;
      ctx.stroke();
      if (hd.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // パーツのアイコン（エンジンで実物を描く）
  function renderIcon(canvas, o, size) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    const T = project ? project.table : E.normalizeProject({}).table;
    const b = bounds(o), w = b.x1 - b.x0, hh = b.y1 - b.y0;
    const s = Math.min((size - 8) / Math.max(w, hh, 1), 1.8) * dpr;
    ctx.setTransform(s, 0, 0, s, size * dpr / 2 - (b.x0 + w / 2) * s, size * dpr / 2 - (b.y0 + hh / 2) * s);
    E.drawObject(ctx, o, T, null, { px: s, time: 0.4, cheap: false });
  }

  function iconObject(def) {
    const raw = Object.assign({ type: def.type }, def.make(0, 0, false), def.icon || {});
    if (def.type === 'flipper') raw.length = 70;
    return E.normalizeProject({ objects: [raw] }).objects[0];
  }

  // ================================================================
  //  表示範囲（ズーム・パン）
  // ================================================================
  function fitView() {
    const T = project.table, cw = stageWrap.clientWidth, ch = stageWrap.clientHeight;
    const pad = 28;
    view.s = Math.max(0.05, Math.min((cw - pad * 2) / T.width, (ch - pad * 2 - 40) / T.height));
    view.ox = (cw - T.width * view.s) / 2;
    view.oy = (ch - 40 - T.height * view.s) / 2;
    view.auto = true;
    requestRender();
  }

  function zoomAt(sx, sy, s) {
    const T = project.table, cw = stageWrap.clientWidth, ch = stageWrap.clientHeight;
    const fit = Math.min(cw / T.width, ch / T.height);
    s = clamp(s, fit * 0.4, fit * 8);
    const w = toWorld(sx, sy);
    view.s = s;
    view.ox = sx - w.x * s;
    view.oy = sy - w.y * s;
    view.auto = false;
    requestRender();
  }

  // ================================================================
  //  テーブル上の操作
  // ================================================================
  const pointers = new Map();

  function bindStage() {
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    stage.addEventListener('pointerleave', () => { if (!drag) { hoverId = null; hoverHandle = null; requestRender(); setStatus(defaultStatus()); } });
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
    stage.addEventListener('dblclick', (e) => {
      const p = stagePos(e), w = toWorld(p.x, p.y);
      if (!candidatesAt(w.x, w.y).length) fitView();
    });
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = stagePos(e), f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018));
      if (bgEdit) {
        const T = project.table;
        T.bgZoom = clamp(Math.round(T.bgZoom * f * 100) / 100, 0.2, 4);
        refreshInspectorValues();
        requestRender();
        clearTimeout(nudgeTimer);
        nudgeTimer = setTimeout(commit, 400);
        return;
      }
      zoomAt(p.x, p.y, view.s * f);
    }, { passive: false });
  }

  function onDown(e) {
    hideMenu();
    stage.setPointerCapture(e.pointerId);
    const p = stagePos(e);
    pointers.set(e.pointerId, p);
    if (pointers.size === 2) {
      // 2本指：ピンチで拡大縮小・移動
      if (drag && drag.moved) commit();
      clearTimeout(drag && drag.lp);
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      drag = { mode: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: view.s, w0: toWorld(mid.x, mid.y), bg: bgEdit, z0: project.table.bgZoom };
      return;
    }
    if (pointers.size > 2) return;
    const w = toWorld(p.x, p.y);
    const touch = e.pointerType === 'touch';

    if (e.button === 1 || spaceDown || e.button === 2) {
      drag = { mode: 'pan', sx: p.x, sy: p.y, ox: view.ox, oy: view.oy, moved: false, menu: e.button === 2, cx: e.clientX, cy: e.clientY, w };
      stage.style.cursor = 'grabbing';
      return;
    }
    if (bgEdit) {
      drag = { mode: 'bg', sx: w.x, sy: w.y, x0: project.table.bgX, y0: project.table.bgY, moved: false };
      return;
    }
    const hd = handleAt(p.x, p.y, touch ? 18 : 10);
    if (hd) {
      const hp = handlesOf(hd.o).find((x) => x.k === hd.k);   // Shift で縦・横に固定するときの起点
      drag = { mode: 'handle', id: hd.o.id, k: hd.k, moved: false, start: w, hx: hp.x, hy: hp.y };
      setStatus(tr(HANDLE_HINT[hd.k]));
      requestRender();
      return;
    }
    const cands = candidatesAt(w.x, w.y, touch ? 12 : 6);
    if (cands.length) {
      const o = cands[0];
      if (e.ctrlKey || e.metaKey) {                 // Ctrl + クリック：選択に追加 / 解除
        if (sel.has(o.id)) sel.delete(o.id); else sel.add(o.id);
        drag = null;
        refreshSelection();
        return;
      }
      // Shift + クリックは選択に追加 / 解除、Shift + ドラッグは縦・横にまっすぐ移動
      const wasSel = sel.has(o.id), wasOnly = sel.size === 1 && wasSel;
      if (!wasSel) { if (e.shiftKey) sel.add(o.id); else sel = new Set([o.id]); }
      const orig = new Map(selected().map((x) => [x.id, clone(x)]));
      drag = { mode: 'move', start: w, sp: p, anchor: anchorOf(o), orig, moved: false, wasOnly, cands, clickId: o.id,
        shift: e.shiftKey, unselect: e.shiftKey && wasSel };
      if (touch) drag.lp = setTimeout(() => { if (drag && drag.mode === 'move' && !drag.moved) { drag = null; showObjectMenu(e.clientX, e.clientY); } }, 550);
      refreshSelection();
      return;
    }
    // 何もない所：範囲選択
    if (!e.shiftKey) sel.clear();
    drag = { mode: 'box', start: w, cur: w, base: new Set(sel), sp: p };
    if (touch) drag.lp = setTimeout(() => { if (drag && drag.mode === 'box' && Math.hypot(drag.cur.x - drag.start.x, drag.cur.y - drag.start.y) * view.s < 6) { drag = null; showStageMenu(e.clientX, e.clientY, w); } }, 550);
    refreshSelection();
  }

  function onMove(e) {
    const p = stagePos(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
    const w = toWorld(p.x, p.y);
    if (!drag) { updateHover(p, w, e.pointerType === 'touch'); return; }
    switch (drag.mode) {
      case 'pinch': {
        if (pointers.size < 2) return;
        const [a, b] = [...pointers.values()];
        if (drag.bg) {
          project.table.bgZoom = clamp(Math.round(drag.z0 * Math.hypot(a.x - b.x, a.y - b.y) / drag.d0 * 100) / 100, 0.2, 4);
          drag.moved = true;
          refreshInspectorValues();
          requestRender();
          break;
        }
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const T = project.table, fit = Math.min(stageWrap.clientWidth / T.width, stageWrap.clientHeight / T.height);
        view.s = clamp(drag.s0 * Math.hypot(a.x - b.x, a.y - b.y) / drag.d0, fit * 0.4, fit * 8);
        view.ox = mid.x - drag.w0.x * view.s;
        view.oy = mid.y - drag.w0.y * view.s;
        view.auto = false;
        requestRender();
        break;
      }
      case 'pan':
        if (Math.hypot(p.x - drag.sx, p.y - drag.sy) > 3) drag.moved = true;
        view.ox = drag.ox + p.x - drag.sx;
        view.oy = drag.oy + p.y - drag.sy;
        view.auto = false;
        requestRender();
        break;
      case 'bg': {
        const T = project.table;
        T.bgX = clamp(Math.round(drag.x0 + w.x - drag.sx), -T.width, T.width);
        T.bgY = clamp(Math.round(drag.y0 + w.y - drag.sy), -T.height, T.height);
        drag.moved = true;
        refreshInspectorValues();
        requestRender();
        break;
      }
      case 'handle': {
        const o = findObj(drag.id);
        if (!o) return;
        let tx = w.x, ty = w.y, fixed = null;
        if (e.shiftKey && drag.k !== 'r' && drag.k !== 'tip' && drag.k !== 'dir') {
          // Shift：ハンドルを、押した位置から縦か横（動かした量が大きい方）にだけ動かす
          const a = straight(w.x - drag.start.x, w.y - drag.start.y);
          tx = drag.hx + a.dx; ty = drag.hy + a.dy;
          fixed = a.dx === 0 ? 'x' : 'y';
        }
        applyHandle(o, drag.k, tx, ty, opt.snap && !e.altKey, fixed, e.shiftKey);
        drag.moved = true;
        setStatus(e.shiftKey ? L('Shift：縦・横（向きは45°おき）にそろえて変形中', 'Shift: reshaping straight (angles in 45° steps)') : tr(HANDLE_HINT[drag.k]));
        refreshInspectorValues();
        requestRender();
        break;
      }
      case 'move': {
        if (!drag.moved && Math.hypot(p.x - drag.sp.x, p.y - drag.sp.y) < 4) return;
        drag.moved = true;
        clearTimeout(drag.lp);
        const snap = opt.snap && !e.altKey;
        let rx = w.x - drag.start.x, ry = w.y - drag.start.y;
        if (e.shiftKey) { const a = straight(rx, ry); rx = a.dx; ry = a.dy; }   // Shift：縦か横にだけ動かす
        const nx = rx === 0 ? drag.anchor[0] : snapV(drag.anchor[0] + rx, snap);
        const ny = ry === 0 ? drag.anchor[1] : snapV(drag.anchor[1] + ry, snap);
        const dx = nx - drag.anchor[0], dy = ny - drag.anchor[1];
        for (const o of selected()) {
          const src = drag.orig.get(o.id);
          if (!src) continue;
          for (const [kx, ky] of COORD_KEYS) if (o[kx] !== undefined) { o[kx] = src[kx] + dx; o[ky] = src[ky] + dy; }
        }
        setStatus(e.shiftKey ? L('Shift：縦・横にまっすぐ移動中', 'Shift: moving straight')
          : L('ドラッグで移動中（Shift で縦・横だけ、Alt で吸着なし）', 'Moving (Shift: straight only, Alt: no snapping)'));
        refreshInspectorValues();
        requestRender();
        break;
      }
      case 'box': {
        drag.cur = w;
        const x0 = Math.min(drag.start.x, w.x), x1 = Math.max(drag.start.x, w.x);
        const y0 = Math.min(drag.start.y, w.y), y1 = Math.max(drag.start.y, w.y);
        sel = new Set(drag.base);
        for (const o of project.objects) {
          const b = bounds(o);
          if (b.x0 >= x0 && b.x1 <= x1 && b.y0 >= y0 && b.y1 <= y1) sel.add(o.id);
        }
        requestRender();
        break;
      }
    }
  }

  function onUp(e) {
    pointers.delete(e.pointerId);
    if (!drag) return;
    clearTimeout(drag.lp);
    const d = drag;
    if (d.mode === 'pinch') {
      if (pointers.size === 0) { drag = null; if (d.bg && d.moved) commit(); }
      return;
    }
    drag = null;
    stage.style.cursor = bgEdit ? 'move' : '';
    if (d.mode === 'bg') { if (d.moved) commit(); return; }
    if (d.mode === 'pan' && d.menu && !d.moved) {
      // 右クリック → メニュー
      const c = candidatesAt(d.w.x, d.w.y);
      if (c.length) {
        if (!sel.has(c[0].id)) sel = new Set([c[0].id]);
        refreshSelection();
        showObjectMenu(d.cx, d.cy);
      } else showStageMenu(d.cx, d.cy, d.w);
      return;
    }
    if (d.mode === 'move' && !d.moved && d.unselect) sel.delete(d.clickId);   // 選択中のパーツを Shift + クリック → 選択から外す
    else if (d.mode === 'move' && !d.moved && !d.shift && d.wasOnly && d.cands.length > 1) {
      // 同じ場所をもう一度クリック → 下に重なっているパーツへ
      const i = d.cands.findIndex((o) => o.id === d.clickId);
      sel = new Set([d.cands[(i + 1) % d.cands.length].id]);
    }
    if ((d.mode === 'move' || d.mode === 'handle') && d.moved) commit();
    refreshSelection();
  }

  function handleAt(sx, sy, r) {
    if (sel.size !== 1) return null;
    const o = selected()[0];
    if (!o) return null;
    for (const hd of handlesOf(o)) {
      const p = toScreen(hd.x, hd.y);
      if (Math.hypot(p.x - sx, p.y - sy) <= r) return { o, k: hd.k };
    }
    return null;
  }

  function updateHover(p, w, touch) {
    if (touch) return;
    if (bgEdit) { stage.style.cursor = spaceDown ? 'grab' : 'move'; setStatus(defaultStatus()); return; }
    const hd = handleAt(p.x, p.y, 10);
    let id = null, cursor = '';
    if (hd) { cursor = 'grab'; setStatus(tr(HANDLE_HINT[hd.k])); }
    else {
      const c = candidatesAt(w.x, w.y);
      if (c.length) {
        id = c[0].id;
        cursor = 'move';
        setStatus('<b>' + partName(c[0]) + '</b>' + L('：クリックで選択・ドラッグで移動', ': click to select, drag to move') +
          (c.length > 1 ? L('（重なっている時はもう一度クリックで下のパーツ）', ' (click again to pick the part underneath)') : '') +
          L(' ・ 右クリックでメニュー', ' · right-click for menu'));
      } else setStatus(defaultStatus());
    }
    if (spaceDown) cursor = 'grab';
    stage.style.cursor = cursor;
    const hk = hd ? hd.k : null;
    if (id !== hoverId || hk !== hoverHandle) { hoverId = id; hoverHandle = hk; requestRender(); }
  }

  function setStatus(html) {
    if (statusEl._html === html) return;
    statusEl._html = html;
    statusEl.innerHTML = html;
  }
  function defaultStatus() {
    if (bgEdit) {
      return L('<b>背景画像を調整中</b>：ドラッグで移動 ・ ホイール（2本指ピンチ）で拡大縮小 ・ 矢印キーで微調整 ・ Esc または「調整を終える」で終了',
        '<b>Adjusting the background image</b>: drag to move · wheel (or pinch) to zoom · arrow keys to fine-tune · Esc or "Done" to finish');
    }
    if (sel.size) {
      const name = sel.size === 1 ? partName(selected()[0]) : sel.size + L('個のパーツ', ' parts');
      return L('<b>' + name + '</b>を選択中 ・ ドラッグで移動（Shift で縦・横だけ）・ Delete で削除 ・ Ctrl+D で複製 ・ M で左右反転コピー ・ 矢印キーで微調整',
        '<b>' + name + '</b> selected · drag to move (Shift: straight only) · Delete to remove · Ctrl+D to duplicate · M to mirror-copy · arrow keys to nudge');
    }
    return L('左の<b>パーツ</b>をテーブルへドラッグして置こう ・ 空いている所をドラッグで範囲選択 ・ ホイールで拡大縮小 ・ <b>テストプレイ</b>ですぐ遊べます',
      'Drag <b>parts</b> from the left onto the table · drag on empty space to box-select · wheel to zoom · try it with <b>Test play</b>');
  }

  // ================================================================
  //  パレット（パーツ一覧）
  // ================================================================
  function buildPalette() {
    const box = $('#parts');
    box.innerHTML = '';
    let cat = null;
    for (const def of PARTS) {
      if (def.cat !== cat) { cat = def.cat; box.append(h('div', { class: 'part-cat', text: tr(cat) })); }
      const cv = h('canvas');
      renderIcon(cv, iconObject(def), 52);
      const btn = h('button', { class: 'part', type: 'button', title: tr(def.full || def.name) + '\n' + tr(def.desc) }, cv, h('span', { text: tr(def.name) }));
      attachPaletteDrag(btn, def, cv);
      box.append(btn);
    }
  }

  function attachPaletteDrag(btn, def, icon) {
    let pd = null;
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      hideMenu();
      pd = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, el: null };
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* 古いブラウザ */ }
    });
    btn.addEventListener('pointermove', (e) => {
      if (!pd || e.pointerId !== pd.id) return;
      if (!pd.moved && Math.hypot(e.clientX - pd.sx, e.clientY - pd.sy) < 6) return;
      if (!pd.moved) {
        pd.moved = true;
        const cv = h('canvas');
        renderIcon(cv, iconObject(def), 52);
        pd.el = h('div', { class: 'drag-ghost' }, cv);
        document.body.append(pd.el);
      }
      pd.el.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      const r = stage.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside) {
        const w = toWorld(e.clientX - r.left, e.clientY - r.top);
        ghost = makePart(def.type, snapV(w.x, opt.snap), snapV(w.y, opt.snap));
      } else ghost = null;
      pd.el.classList.toggle('over', inside);
      const nm = tr(def.full || def.name);
      setStatus(inside ? L('ここで指を離すと<b>' + nm + '</b>を置きます', 'Release here to place the <b>' + nm + '</b>')
        : L('テーブルの上まで運んでください', 'Bring it over the table'));
      requestRender();
    });
    const end = (e, cancel) => {
      if (!pd || e.pointerId !== pd.id) return;
      const was = pd, g = ghost;
      pd = null;
      ghost = null;
      if (was.el) was.el.remove();
      if (cancel) { requestRender(); return; }
      if (was.moved) {
        if (g) addObject(g); else { requestRender(); setStatus(defaultStatus()); }
      } else {
        // クリック：見えている範囲の真ん中に追加
        const T = project.table;
        const c = toWorld(stageWrap.clientWidth / 2, (stageWrap.clientHeight - 40) / 2);
        addObject(makePart(def.type, snapV(clamp(c.x, 40, T.width - 40), opt.snap), snapV(clamp(c.y, 60, T.height - 60), opt.snap)));
      }
    };
    btn.addEventListener('pointerup', (e) => end(e, false));
    btn.addEventListener('pointercancel', (e) => end(e, true));
  }

  function makePart(type, x, y) {
    const def = PART[type];
    const raw = Object.assign({ type }, def.make(x, y, x > project.table.mirrorX));
    const o = E.normalizeProject({ objects: [raw] }).objects[0];
    o.id = uid();
    return o;
  }

  function addObject(o) {
    if (bgEdit) setBgEdit(false);
    const def = PART[o.type];
    if (def.unique) {
      const ex = project.objects.find((x) => x.type === o.type);
      if (ex) {
        sel = new Set([ex.id]);
        refreshSelection();
        const nm = tr(def.name);
        toast(L(nm + 'は1つだけ置けます。今ある' + nm + 'を選びました', 'Only one ' + nm.toLowerCase() + ' per table. Selected the existing one.'));
        return;
      }
    }
    project.objects.push(o);
    sel = new Set([o.id]);
    commit();
    refreshSelection();
  }

  // ================================================================
  //  インスペクタ（右パネル）
  // ================================================================
  function refreshSelection() {
    buildInspector();
    requestRender();
    setStatus(defaultStatus());
  }

  function buildInspector() {
    inspFields = [];
    const scroll = inspector.scrollTop, same = inspector._key === [...sel].join(',');
    inspector.innerHTML = '';
    const list = selected();
    if (!list.length) inspector.append(tablePanel());
    else if (list.length === 1) inspector.append(partPanel(list[0]));
    else inspector.append(multiPanel(list));
    inspector._key = [...sel].join(',');
    if (same) inspector.scrollTop = scroll;
  }

  function refreshInspectorValues() { inspFields.forEach((f) => f.refresh()); }

  function fmtNum(v, step) {
    const d = step < 1 ? (String(step).split('.')[1] || '').length : 0;
    return Number(v).toFixed(d);
  }
  function toHex6(c) {
    let s = String(c || '#ffffff').toLowerCase();
    if (/^#[0-9a-f]{3}$/.test(s)) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    return /^#[0-9a-f]{6}$/.test(s) ? s : '#ffffff';
  }

  // 設定項目1つ分のUIを作る
  function field(spec, target, onLive) {
    const live = () => { if (onLive) onLive(); requestRender(); };
    const done = () => commit();
    let el, refresh = () => {};
    const label = h('label', null, tr(spec.label), spec.help ? h('span', { class: 'help', text: tr(spec.help) }) : null);
    switch (spec.kind) {
      case 'range': {
        const rng = h('input', { type: 'range', min: spec.min, max: spec.max, step: spec.step });
        const num = h('input', { type: 'number', class: 'num', step: spec.step });
        refresh = () => { rng.value = target[spec.key]; if (document.activeElement !== num) num.value = fmtNum(target[spec.key], spec.step); };
        rng.addEventListener('input', () => { target[spec.key] = Number(rng.value); num.value = fmtNum(rng.value, spec.step); live(); });
        rng.addEventListener('change', done);
        num.addEventListener('change', () => {
          const v = Number(num.value);
          if (isFinite(v)) target[spec.key] = clamp(v, spec.min, spec.max);
          num.value = fmtNum(target[spec.key], spec.step);
          refresh(); live(); done();
        });
        el = h('div', { class: 'field' }, label, h('div', { class: 'range-row' }, rng, num));
        break;
      }
      case 'color': {
        // spec.auto：true なら「自動」（テーマの壁の色）。{ text, title, from } で別の意味の「色なし」ボタンにできる
        const row = h('div', { class: 'swatches' }), btns = [], au = spec.auto && spec.auto !== true ? spec.auto : null;
        if (spec.auto) btns.push(h('button', { class: 'sw auto', type: 'button', 'data-c': '',
          text: au ? tr(au.text) : L('自動', 'Auto'), title: au ? tr(au.title) : L('テーマの壁の色を使う', 'Use the theme wall color') }));
        for (const c of spec.swatches || SWATCHES) btns.push(h('button', { class: 'sw', type: 'button', title: c, style: '--c:' + c, 'data-c': c }));
        btns.forEach((b) => {
          b.addEventListener('click', () => { target[spec.key] = b.dataset.c; refresh(); live(); done(); });
          row.append(b);
        });
        const pick = h('input', { type: 'color' });
        pick.addEventListener('input', () => { target[spec.key] = pick.value; refresh(); live(); });
        pick.addEventListener('change', done);
        row.append(h('label', { class: 'picker', title: L('好きな色を選ぶ', 'Pick any color') }, pick));
        refresh = () => {
          const v = String(target[spec.key] || '').toLowerCase();
          btns.forEach((b) => b.classList.toggle('on', b.dataset.c.toLowerCase() === v));
          pick.value = toHex6(v || project.table[au ? au.from : 'wallColor']);
        };
        el = h('div', { class: 'field' }, label, row);
        break;
      }
      case 'seg': {
        const wrap = h('div', { class: 'seg' });
        const btns = spec.options.map(([v, text]) => {
          const b = h('button', { type: 'button', text: tr(text) });
          b.addEventListener('click', () => { target[spec.key] = v; refresh(); live(); done(); });
          wrap.append(b);
          return [v, b];
        });
        refresh = () => btns.forEach(([v, b]) => b.classList.toggle('on', target[spec.key] === v));
        el = h('div', { class: 'field' }, label, wrap);
        break;
      }
      case 'check': {
        const cb = h('input', { type: 'checkbox' });
        cb.addEventListener('change', () => { target[spec.key] = cb.checked; live(); done(); });
        refresh = () => { cb.checked = !!target[spec.key]; };
        el = h('div', { class: 'field' }, h('div', null, h('label', { class: 'switch' }, cb, tr(spec.label))),
          spec.help ? h('span', { class: 'help', text: tr(spec.help) }) : null);
        break;
      }
      case 'text': {
        const inp = spec.multiline ? h('textarea', { class: 'txt', rows: 2, spellcheck: 'false' }) : h('input', { class: 'txt', spellcheck: 'false' });
        inp.addEventListener('input', () => { target[spec.key] = inp.value; live(); });
        inp.addEventListener('change', done);
        refresh = () => { if (document.activeElement !== inp) inp.value = target[spec.key]; };
        el = h('div', { class: 'field' }, label, inp);
        break;
      }
      case 'number': {
        const inp = h('input', { type: 'number', class: 'num', step: spec.step || 1 });
        inp.addEventListener('change', () => {
          const v = Number(inp.value);
          if (isFinite(v)) target[spec.key] = clamp(Math.round(v), spec.min, spec.max);
          refresh(); live(); done();
        });
        refresh = () => { if (document.activeElement !== inp) inp.value = Math.round(target[spec.key]); };
        el = h('div', { class: 'field' }, label, inp);
        break;
      }
      case 'button':
        el = h('div', { class: 'field' }, h('button', { class: 'btn', type: 'button', text: tr(spec.label), style: 'width:100%',
          onclick: () => { spec.run(target); commit(); refreshSelection(); } }));
        break;
    }
    refresh();
    inspFields.push({ refresh });
    return el;
  }

  function xyField(o) {
    const fx = h('input', { type: 'number', class: 'num' }), fy = h('input', { type: 'number', class: 'num' });
    const apply = () => {
      const x = Number(fx.value), y = Number(fy.value);
      if (isFinite(x)) o.x = Math.round(x);
      if (isFinite(y)) o.y = Math.round(y);
      requestRender();
      commit();
    };
    fx.addEventListener('change', apply);
    fy.addEventListener('change', apply);
    const refresh = () => {
      if (document.activeElement !== fx) fx.value = Math.round(o.x);
      if (document.activeElement !== fy) fy.value = Math.round(o.y);
    };
    refresh();
    inspFields.push({ refresh });
    return h('div', { class: 'field' }, h('div', { class: 'xy' }, h('span', { text: 'X' }), fx, h('span', { text: 'Y' }), fy));
  }

  function sec(title, ...kids) { return h('section', { class: 'sec' }, title ? h('h3', { text: title }) : null, ...kids); }

  function head(o, title, desc) {
    let icon = null;
    if (o) { icon = h('canvas'); renderIcon(icon, o, 46); }
    return h('div', { class: 'insp-head' }, icon, h('div', null, h('div', { class: 'insp-name', text: title }), h('div', { class: 'insp-desc', text: desc })));
  }

  function tablePanel() {
    const T = project.table;
    const root = h('div');
    root.append(head(null, L('テーブル設定', 'Table settings'), L('パーツをクリックすると、そのパーツの設定に切り替わります。', 'Click a part to edit that part instead.')));
    root.append(sec(L('ゲームのタイトル', 'Game title'), field({ kind: 'text', key: 'title', label: '' }, project, () => { titleInput.value = project.title; })));

    const themes = h('div', { class: 'themes' });
    for (const th of THEMES) {
      const b = h('button', { type: 'button', class: 'theme' + (T.bg1 === th.bg1 && T.wallColor === th.wallColor ? ' on' : ''), text: tr(th.name),
        style: 'background:linear-gradient(' + th.bg1 + ',' + th.bg2 + ');--w:' + th.wallColor + (isLight(th.bg1) ? ';color:#3a2340;text-shadow:none' : ';color:#fff') });
      b.addEventListener('click', () => {
        Object.keys(th).forEach((k) => { if (k !== 'name') T[k] = th[k]; });
        commit();
        buildInspector();
        requestRender();
      });
      themes.append(b);
    }
    root.append(sec(L('テーマ（ワンタッチで配色を変更）', 'Theme (one-tap color scheme)'), themes));

    root.append(sec(L('色と背景', 'Colors & background'),
      field({ kind: 'color', key: 'bg1', label: P2('背景（上）', 'Background (top)'), swatches: BG_SWATCHES }, T),
      field({ kind: 'color', key: 'bg2', label: P2('背景（下）', 'Background (bottom)'), swatches: BG_SWATCHES }, T),
      field({ kind: 'seg', key: 'pattern', label: P2('背景の模様', 'Pattern'), options: [['none', P2('なし', 'None')], ['stars', P2('星', 'Stars')],
        ['grid', P2('方眼', 'Grid')], ['dots', P2('ドット', 'Dots')], ['stripes', P2('斜線', 'Stripes')]] }, T),
      field({ kind: 'color', key: 'wallColor', label: P2('壁の色', 'Wall color'), help: P2('色が「自動」の壁に使われます', 'Used by walls whose color is "Auto"') }, T),
      field({ kind: 'color', key: 'ballColor', label: P2('ボールの色', 'Ball color') }, T),
      ...bgImageFields(T)));

    root.append(sec(L('ルール', 'Rules'),
      field(range('balls', P2('ボールの数', 'Balls per game'), 1, 9, 1), T),
      field(range('ballSave', P2('ボールセーブ（秒）', 'Ball save (sec)'), 0, 20, 1, P2('発射直後に落ちたら1回戻る', 'A ball lost right after launch comes back once')), T),
      field(range('gravity', P2('重力', 'Gravity'), 0.5, 1.8, 0.05, P2('大きいほどボールが速い', 'Higher = faster ball')), T),
      field(range('ballSize', P2('ボールの大きさ', 'Ball size'), 7, 20, 1), T)));

    root.append(sec(L('台揺らし・TILT', 'Nudge & TILT'),
      field({ kind: 'check', key: 'nudge', label: P2('台を揺らせる（上へサッとはらう / ↑キー）', 'Allow nudging (flick up / ↑ key)') }, T),
      field({ kind: 'check', key: 'shake', label: P2('スマホを振っても揺らせる', 'Shake the phone to nudge') }, T),
      field({ kind: 'check', key: 'tilt', label: P2('揺らしすぎるとTILT', 'Too much nudging causes TILT') }, T),
      field(range('tiltWarnings', P2('TILTまでの警告回数', 'Warnings before TILT'), 0, 5, 1,
        P2('短い間に何度も揺らすと警告。回数を超えるとTILT（フリッパーが止まり、そのボールを失う）',
          'Nudging repeatedly gives a warning. Go past the limit and it\'s TILT (flippers stop and the ball is lost)')), T)));

    root.append(sec(L('キー設定（パソコンで遊ぶとき）', 'Keyboard controls (PC)'), keyConfigFields(T)));

    root.append(sec(L('ゲーム画面の言語', 'Game language'),
      field({ kind: 'seg', key: 'lang', label: '', options: [['auto', P2('自動（遊ぶ人の言語）', 'Auto (player\'s language)')], ['ja', '日本語'], ['en', 'English']],
        help: P2('書き出したゲームのボタンや説明の言語です', 'Language of the buttons and instructions in the exported game') }, T)));

    root.append(h('section', { class: 'sec', id: 'checkSec' }));

    const adv = h('details', null, h('summary', { text: L('テーブルの大きさ・対称軸', 'Table size & mirror axis') }),
      field({ kind: 'number', key: 'width', label: P2('幅', 'Width'), min: 300, max: 1400 }, T, () => fitView()),
      field({ kind: 'number', key: 'height', label: P2('高さ', 'Height'), min: 400, max: 2400 }, T, () => fitView()),
      field({ kind: 'number', key: 'mirrorX', label: P2('左右対称の軸（X）', 'Mirror axis (X)'), help: P2('「左右反転コピー」の基準', 'Used by "Mirror copy"'), min: 0, max: 2400 }, T),
      h('p', { class: 'note', text: L('大きさを変えても外壁は自動では動きません。パーツを動かして合わせてください。', 'Changing the size does not move the outer walls. Move the parts to fit.') }));
    root.append(sec(null, adv));
    setTimeout(refreshChecks);
    return root;
  }

  function bgImageFields(T) {
    const box = h('div', { class: 'field' }, h('label', null, L('背景画像', 'Background image'),
      h('span', { class: 'help', text: L('好きな画像をテーブルの背景にできます（画像ファイルをウィンドウへドロップしてもOK）',
        'Use any picture as the table background (you can also drop an image file onto the window)') })));
    const pick = () => $('#imageInput').click();
    if (!T.bgImage) {
      box.append(h('button', { class: 'btn', type: 'button', style: 'width:100%', text: L('画像を選ぶ…', 'Choose image…'), onclick: pick }));
      return [box];
    }
    const thumb = h('div', { class: 'bg-thumb', title: Math.round(T.bgImage.length * 0.75 / 1024) + 'KB' });
    thumb.style.backgroundImage = 'url("' + T.bgImage + '")';
    box.append(thumb, h('div', { class: 'actions' },
      h('button', { class: 'btn', type: 'button', text: L('画像を変更…', 'Change…'), onclick: pick }),
      h('button', { class: 'btn danger', type: 'button', text: L('画像を外す', 'Remove'), onclick: () => { T.bgImage = ''; setBgEdit(false); commit(); buildInspector(); requestRender(); } })));
    const adjust = h('div', { class: 'field' },
      h('button', { class: 'btn' + (bgEdit ? ' primary' : ''), type: 'button', style: 'width:100%',
        text: bgEdit ? L('✓ 調整を終える', '✓ Done') : L('✥ テーブル上でドラッグして調整', '✥ Adjust by dragging on the table'), onclick: () => setBgEdit(!bgEdit) }),
      h('p', { class: 'note', text: bgEdit
        ? L('ドラッグで移動、ホイール（2本指ピンチ）で拡大縮小。点線が画像全体、明るい部分が実際に表示される範囲です。',
          'Drag to move, wheel (or pinch) to zoom. The dotted box is the whole image; the bright part is what will show.')
        : L('画像をつかんで動かしたり、拡大縮小したりできます。', 'Grab the image to move it or zoom in and out.') }));
    return [box,
      field({ kind: 'seg', key: 'bgArea', label: P2('表示する範囲', 'Show image in'),
        help: P2('「枠の内側」は壁で囲まれた部分だけに表示し、はみ出しを切り取ります', '"Inside the frame" shows it only where the walls enclose the table and trims the rest'),
        options: [['frame', P2('枠の内側だけ', 'Inside the frame')], ['table', P2('テーブル全体', 'Whole table')]] }, T),
      field({ kind: 'seg', key: 'bgFit', label: P2('画像の合わせ方', 'Fit'),
        options: [['cover', P2('すき間なく', 'Fill')], ['contain', P2('画像全体', 'Whole image')], ['stretch', P2('引き伸ばし', 'Stretch')]] }, T),
      adjust,
      field(range('bgZoom', P2('拡大', 'Zoom'), 0.2, 4, 0.05), T),
      field(range('bgX', P2('横の位置', 'Horizontal position'), -Math.round(T.width), Math.round(T.width), 1), T),
      field(range('bgY', P2('縦の位置', 'Vertical position'), -Math.round(T.height), Math.round(T.height), 1), T),
      field({ kind: 'button', label: P2('位置と拡大をリセット', 'Reset position & zoom'), run: (t) => { t.bgZoom = 1; t.bgX = 0; t.bgY = 0; } }, T),
      field(range('bgAlpha', P2('画像の濃さ', 'Image opacity'), 0.1, 1, 0.05,
        P2('下げると下地の色と混ざって、パーツが見やすくなります', 'Lower it to blend with the color behind the image so parts stand out')), T),
      field({ kind: 'color', key: 'bgBase', label: P2('画像の下地の色', 'Color behind the image'), swatches: BG_SWATCHES,
        help: P2('「画像の濃さ」を下げたときや、「画像全体」で余白ができたときに見える色。「なし」なら背景（上・下）のグラデーションが透けます',
          'Shows through when the opacity is lowered or "Whole image" leaves margins. "None" lets the background gradient (top/bottom) show'),
        auto: { text: P2('なし', 'None'), title: P2('背景のグラデーションをそのまま使う', 'Use the background gradient'), from: 'bg1' } }, T)];
  }

  // ---------------------------------------------------------- キー設定
  const KEY_ROWS = [
    ['keysLeft', P2('左フリッパー', 'Left flipper')],
    ['keysRight', P2('右フリッパー', 'Right flipper')],
    ['keysLaunch', P2('発射', 'Launch')],
    ['keysNudgeL', P2('揺らす（左上へ）', 'Nudge (up-left)')],
    ['keysNudgeR', P2('揺らす（右上へ）', 'Nudge (up-right)')],
    ['keysNudgeUp', P2('揺らす（真上へ）', 'Nudge (up)')],
  ];
  const MAX_KEYS = 4;
  let keyCapture = null;      // { field, btn }：次に押されたキーを登録する

  const keyCodes = (T, f) => String(T[f] || '').split(/\s+/).filter(Boolean);

  function keyConfigFields(T) {
    const box = h('div', { class: 'keycfg' });
    for (const [f, label] of KEY_ROWS) {
      const chips = h('div', { class: 'keychips' });
      for (const c of keyCodes(T, f)) {
        chips.append(h('span', { class: 'keychip' }, h('kbd', { text: E.keyLabel(c, lang) }),
          h('button', { type: 'button', class: 'keyx', text: '×', title: L('このキーを外す', 'Remove this key'),
            onclick: () => { T[f] = keyCodes(T, f).filter((x) => x !== c).join(' '); commit(); buildInspector(); } })));
      }
      if (keyCodes(T, f).length < MAX_KEYS) {
        chips.append(h('button', { type: 'button', class: 'keyadd', text: L('＋ キー', '+ Key'), title: L('押してから、割り当てたいキーを押す', 'Click, then press a key'),
          onclick: (ev) => startKeyCapture(f, ev.currentTarget) }));
      }
      box.append(h('div', { class: 'keyrow' }, h('div', { class: 'keyname', text: tr(label) }), chips));
    }
    box.append(h('div', { class: 'keyfoot' },
      h('button', { class: 'btn', type: 'button', text: L('初期設定に戻す', 'Reset to defaults'),
        onclick: () => { for (const [f] of KEY_ROWS) T[f] = E.TABLE_DEFAULTS[f]; commit(); buildInspector(); toast(L('キー設定を初期設定に戻しました', 'Keyboard controls reset')); } }),
      h('p', { class: 'note', text: L('「＋ キー」を押してから、割り当てたいキーを押します（Esc でやめる）。一時停止は P / Esc で固定です。',
        'Click "+ Key", then press the key to assign (Esc cancels). Pause is always P / Esc.') })));
    return box;
  }

  function startKeyCapture(field, btn) {
    cancelKeyCapture();
    keyCapture = { field, btn };
    btn.textContent = L('キーを押してください…', 'Press a key…');
    btn.classList.add('capturing');
  }

  function cancelKeyCapture() {
    if (!keyCapture) return;
    const btn = keyCapture.btn;
    keyCapture = null;
    btn.textContent = L('＋ キー', '+ Key');
    btn.classList.remove('capturing');
  }

  // キー設定の待ち受け中に押されたキーを登録する。ほかの動作に同じキーがあれば付け替える
  function captureKey(e) {
    e.preventDefault();
    const c = e.code;
    if (!c || c === 'Escape') { cancelKeyCapture(); return; }
    if (E.RESERVED_KEYS[c]) { toast(L('P は一時停止のキーなので使えません', 'P is reserved for pause'), 'error'); return; }
    const T = project.table, f = keyCapture.field;
    let from = null;
    for (const [g, label] of KEY_ROWS) {
      if (g !== f && keyCodes(T, g).indexOf(c) >= 0) { T[g] = keyCodes(T, g).filter((x) => x !== c).join(' '); from = label; }
    }
    const mine = keyCodes(T, f);
    if (mine.indexOf(c) < 0) mine.push(c);
    T[f] = mine.join(' ');
    keyCapture = null;
    commit();
    buildInspector();
    const name = E.keyLabel(c, lang);
    toast(from ? L(name + ' を「' + tr(from) + '」から付け替えました', 'Moved ' + name + ' from "' + tr(from) + '"')
      : L(name + ' を割り当てました', 'Assigned ' + name));
  }

  // 背景画像の調整モード（テーブル上のドラッグ・ホイールが画像の移動・拡大になる）
  function setBgEdit(on) {
    on = !!(on && project.table.bgImage);
    if (bgEdit === on) return;
    bgEdit = on;
    if (on && sel.size) sel.clear();
    buildInspector();
    setStatus(defaultStatus());
    stage.style.cursor = on ? 'move' : '';
    requestRender();
  }

  // 画像を読み込み、テーブルに必要な大きさまで縮めて data URL にする（書き出しHTMLに埋め込むため）
  function loadBgImage(file) {
    if (!file || !/^image\//.test(file.type)) { toast(L('画像ファイルを選んでください', 'Please choose an image file'), 'error'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const T = project.table, iw = img.naturalWidth, ih = img.naturalHeight;
      const s = Math.min(1, Math.max(1.5 * T.width / iw, 1.5 * T.height / ih), 2400 / Math.max(iw, ih));
      const w = Math.max(1, Math.round(iw * s)), hh = Math.max(1, Math.round(ih * s));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = hh;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, hh);
      let transparent = false;
      if (file.type !== 'image/jpeg') {
        const d = ctx.getImageData(0, 0, w, hh).data;
        for (let i = 3; i < d.length; i += 16) if (d[i] < 250) { transparent = true; break; }
      }
      T.bgImage = transparent ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
      sel.clear();
      commit();
      refreshSelection();
      const kb = Math.round(T.bgImage.length * 0.75 / 1024);
      toast(L('背景画像を設定しました（' + kb + 'KB）。右のパネルで位置や濃さを調整できます',
        'Background image set (' + kb + 'KB). Adjust position and opacity in the right panel.'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast(L('この画像は読み込めませんでした', 'Could not load this image'), 'error'); };
    img.src = url;
  }

  function refreshChecks() {
    const box = document.getElementById('checkSec');
    if (!box) return;
    const warns = checkProject();
    const counts = {};
    for (const o of project.objects) counts[o.type] = (counts[o.type] || 0) + 1;
    box.innerHTML = '';
    box.append(h('h3', { text: L('チェック', 'Check') }),
      h('ul', { class: 'warns' }, warns.length ? warns.map((w) => h('li', { text: w })) : h('li', { class: 'good', text: L('✓ 遊べる状態です！', '✓ Ready to play!') })),
      h('div', { class: 'counts' }, PARTS.filter((p) => counts[p.type]).map((p) => h('span', { text: tr(p.name) + ' ×' + counts[p.type] }))));
  }

  function checkProject() {
    const w = [], objs = project.objects, T = project.table;
    if (!objs.some((o) => o.type === 'plunger')) w.push(L('発射台がありません（ボールはテーブルの上から落ちてきます）', 'No plunger (the ball will drop from the top of the table)'));
    if (!objs.some((o) => o.type === 'flipper' && E.flipperButton(o) === 'left')) w.push(L('左ボタンで動くフリッパーがありません', 'No flipper on the left button'));
    if (!objs.some((o) => o.type === 'flipper' && E.flipperButton(o) === 'right')) w.push(L('右ボタンで動くフリッパーがありません', 'No flipper on the right button'));
    const out = objs.filter((o) => { const b = bounds(o); return b.x1 < 0 || b.y1 < 0 || b.x0 > T.width || b.y0 > T.height; }).length;
    if (out) w.push(L('テーブルの外に出ているパーツが' + out + '個あります', out + ' part(s) are outside the table'));
    return w;
  }

  function partPanel(o) {
    const def = PART[o.type];
    const root = h('div');
    root.append(head(o, partName(o), tr(def.desc)));
    root.append(sec(L('設定', 'Settings'), ...def.props.map((spec) => field(spec, o))));
    if (o.x !== undefined) root.append(sec(L('位置', 'Position'), xyField(o)));
    root.append(sec(L('操作', 'Actions'), actionButtons(def.unique)));
    return root;
  }

  function multiPanel(list) {
    const counts = {};
    for (const o of list) counts[o.type] = (counts[o.type] || 0) + 1;
    const one = Object.keys(counts).length === 1;
    const root = h('div');
    root.append(head(one ? list[0] : null, one ? partName(list[0]) + ' ×' + list.length : L(list.length + '個のパーツを選択中', list.length + ' parts selected'),
      L('共通の設定はまとめて変更できます。移動・複製・左右反転コピー・削除もまとめてできます。',
        'Settings they share can be changed for all of them at once. You can also move, duplicate, mirror-copy or delete them together.')));
    if (!one) root.append(sec(L('選択中のパーツ', 'Selected parts'), h('div', { class: 'counts' }, PARTS.filter((p) => counts[p.type]).map((p) => h('span', { text: tr(p.name) + ' ×' + counts[p.type] })))));
    const specs = commonSpecs(list);
    if (specs.length) {
      const target = multiTarget(list);
      root.append(sec(L('まとめて設定', 'Settings for all'), ...specs.map((spec) => {
        // 値がそろっていない項目には「バラバラ」の印。どれか変えるとすべて同じ値になるので印を消す
        let tag = spec.kind !== 'button' && list.some((o) => o[spec.key] !== list[0][spec.key])
          ? h('span', { class: 'mixed', text: L('バラバラ', 'mixed') }) : null;
        const el = field(spec, target, () => { if (tag) { tag.remove(); tag = null; } });
        const lb = el.querySelector('label');
        if (tag && lb) lb.insertBefore(tag, lb.querySelector('.help'));
        return el;
      })));
    } else {
      root.append(sec(L('まとめて設定', 'Settings for all'), h('p', { class: 'note', text: L('選んだパーツに共通の設定はありません。', 'These parts have no settings in common.') })));
    }
    root.append(sec(L('操作', 'Actions'), actionButtons(false)));
    return root;
  }

  // 選んだパーツすべてにある設定（同じ項目名・同じ種類）を集める。
  // スライダーは全員が使える範囲に狭め、ボタン（ゲートの反転など）は同じ種類のパーツだけのときに出す
  function commonSpecs(list) {
    const types = [...new Set(list.map((o) => o.type))];
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const out = [];
    for (const spec of PART[types[0]].props) {
      if (spec.kind === 'text') continue;
      if (spec.kind === 'button') {
        if (types.length === 1) out.push(Object.assign({}, spec, { run: () => list.forEach((o) => spec.run(o)) }));
        continue;
      }
      const all = types.map((t) => PART[t].props.find((p) => p.key === spec.key && p.kind === spec.kind && same(p.label, spec.label)));
      if (all.some((p) => !p)) continue;
      const m = Object.assign({}, spec);
      if (!all.every((p) => same(p.help, spec.help))) delete m.help;
      if (spec.kind === 'seg' && !all.every((p) => same(p.options.map((x) => x[0]), spec.options.map((x) => x[0])))) continue;
      if (spec.kind === 'range') {
        m.min = Math.max(...all.map((p) => p.min));
        m.max = Math.min(...all.map((p) => p.max));
        m.step = Math.min(...all.map((p) => p.step));
        if (m.min >= m.max) continue;
      }
      if (spec.kind === 'color' && !all.every((p) => same(p.auto, spec.auto))) delete m.auto;
      out.push(m);
    }
    return out;
  }

  // 複数のパーツをまとめて読み書きする入れ物。文字の値がそろっていないときは MIXED を返す（どの候補も選択表示しない）
  const MIXED = '\u0000mixed';
  function multiTarget(list) {
    return new Proxy({}, {
      get: (_, k) => {
        const v = list[0][k];
        return typeof v === 'string' && list.some((o) => o[k] !== v) ? MIXED : v;
      },
      set: (_, k, v) => { for (const o of list) o[k] = v; return true; },
    });
  }

  function actionButtons(unique) {
    const b = (text, fn, cls) => h('button', { class: 'btn' + (cls ? ' ' + cls : ''), type: 'button', text, onclick: fn });
    return h('div', { class: 'actions' },
      unique ? null : b(L('複製', 'Duplicate'), () => duplicateSel()),
      unique ? null : b(L('左右反転コピー', 'Mirror copy'), mirrorCopySel),
      b(L('左右反転', 'Flip'), mirrorSel),
      b(L('削除', 'Delete'), deleteSel, 'danger'));
  }

  // ================================================================
  //  編集コマンド
  // ================================================================
  function deleteSel() {
    if (!sel.size) return;
    project.objects = project.objects.filter((o) => !sel.has(o.id));
    sel.clear();
    commit();
    refreshSelection();
  }

  // unique なパーツ（発射台）が2つにならないように追加する
  function insertCopies(copies) {
    const out = copies.filter((c) => !PART[c.type].unique || !project.objects.some((o) => o.type === c.type));
    if (!out.length) return;
    project.objects.push(...out);
    sel = new Set(out.map((c) => c.id));
    commit();
    refreshSelection();
  }

  function duplicateSel() {
    insertCopies(selected().map((o) => { const c = clone(o); c.id = uid(); translate(c, 20, 20); return c; }));
  }

  function mirrorCopySel() {
    const mx = project.table.mirrorX;
    const copies = selected().filter((o) => !PART[o.type].unique).map((o) => { const c = clone(o); c.id = uid(); mirrorObj(c, mx); return c; });
    if (!copies.length) return;
    insertCopies(copies);
    toast(L('左右対称の位置にコピーしました（ピンクの点線が対称軸）', 'Copied to the mirrored position (the pink dotted line is the axis)'));
  }

  function mirrorSel() {
    if (!sel.size) return;
    const list = selected();
    // 選択範囲の中心で反転
    let x0 = Infinity, x1 = -Infinity;
    for (const o of list) { const b = bounds(o); x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); }
    const mx = list.length === 1 && list[0].x !== undefined ? list[0].x : (x0 + x1) / 2;
    list.forEach((o) => mirrorObj(o, mx));
    commit();
    refreshSelection();
  }

  function copySel() {
    if (!sel.size) return;
    clipboard = JSON.stringify(selected());
    pasteN = 0;
    toast(L(sel.size + '個コピーしました', 'Copied ' + sel.size + ' part(s)'));
  }

  function paste(at) {
    if (!clipboard) return;
    pasteN++;
    const list = JSON.parse(clipboard);
    let dx = 20 * pasteN, dy = 20 * pasteN;
    if (at) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const o of list) { const b = bounds(o); x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); }
      dx = snapV(at.x - (x0 + x1) / 2, opt.snap);
      dy = snapV(at.y - (y0 + y1) / 2, opt.snap);
    }
    insertCopies(list.map((o) => { o.id = uid(); translate(o, dx, dy); return o; }));
  }

  function selectAll() { sel = new Set(project.objects.map((o) => o.id)); refreshSelection(); }

  function nudge(dx, dy) {
    if (bgEdit) {
      const T = project.table;
      T.bgX = clamp(T.bgX + dx, -T.width, T.width);
      T.bgY = clamp(T.bgY + dy, -T.height, T.height);
      refreshInspectorValues();
      requestRender();
      clearTimeout(nudgeTimer);
      nudgeTimer = setTimeout(commit, 400);
      return;
    }
    if (!sel.size) return;
    selected().forEach((o) => translate(o, dx, dy));
    refreshInspectorValues();
    requestRender();
    clearTimeout(nudgeTimer);
    nudgeTimer = setTimeout(commit, 400);
  }

  // ================================================================
  //  メニュー・トースト
  // ================================================================
  const menu = $('#ctxMenu');
  function showMenu(cx, cy, items) {
    menu.innerHTML = '';
    for (const it of items) {
      if (it === '-') { menu.append(h('div', { class: 'sep' })); continue; }
      if (it.hidden) continue;
      const b = h('button', { type: 'button', class: it.danger ? 'danger' : null }, h('span', { text: it.label }), h('kbd', { text: it.key || '' }));
      if (it.disabled) b.disabled = true, b.style.opacity = 0.4;
      b.addEventListener('click', () => { hideMenu(); it.fn(); });
      menu.append(b);
    }
    menu.classList.add('show');
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.min(cx, window.innerWidth - r.width - 8) + 'px';
    menu.style.top = Math.min(cy, window.innerHeight - r.height - 8) + 'px';
  }
  function hideMenu() { menu.classList.remove('show'); }
  function showObjectMenu(cx, cy) {
    const unique = selected().every((o) => PART[o.type].unique);
    showMenu(cx, cy, [
      { label: L('複製', 'Duplicate'), key: 'Ctrl+D', fn: duplicateSel, hidden: unique },
      { label: L('左右反転コピー', 'Mirror copy'), key: 'M', fn: mirrorCopySel, hidden: unique },
      { label: L('左右反転', 'Flip'), fn: mirrorSel },
      '-',
      { label: L('コピー', 'Copy'), key: 'Ctrl+C', fn: copySel },
      { label: L('貼り付け', 'Paste'), key: 'Ctrl+V', fn: () => paste(), disabled: !clipboard },
      '-',
      { label: L('削除', 'Delete'), key: 'Delete', fn: deleteSel, danger: true },
    ]);
  }
  function showStageMenu(cx, cy, w) {
    showMenu(cx, cy, [
      { label: L('ここに貼り付け', 'Paste here'), key: 'Ctrl+V', fn: () => paste(w), disabled: !clipboard },
      { label: L('すべて選択', 'Select all'), key: 'Ctrl+A', fn: selectAll },
      { label: L('全体を表示', 'Fit to view'), fn: fitView },
      '-',
      { label: L('テストプレイ', 'Test play'), key: 'Ctrl+Enter', fn: openPlay },
    ]);
  }
  document.addEventListener('pointerdown', (e) => {
    if (!menu.contains(e.target)) hideMenu();
    if (keyCapture && e.target !== keyCapture.btn) cancelKeyCapture();
  });

  let toastTimer = 0;
  function toast(msg, kind) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast' + (kind ? ' ' + kind : ''); }, 2600);
  }

  // ================================================================
  //  モーダル・ファイル・テストプレイ・書き出し
  // ================================================================
  function openModal(id) { $(id).classList.add('show'); }
  function closeModal(id) { $(id).classList.remove('show'); }
  function anyModal() { return document.querySelector('.modal.show'); }

  function bindModals() {
    document.querySelectorAll('.modal').forEach((m) => {
      m.addEventListener('click', (e) => {
        if (m.id === 'playModal') return;
        if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('show');
      });
    });
  }

  function openTemplates(first) {
    tplFirst = first;
    $('#tplTitle').textContent = first ? L('ようこそ！ ピンボールを作りましょう', 'Welcome! Let\'s build a pinball game') : L('新しく作る', 'New table');
    $('#tplLead').textContent = first
      ? L('まずはひな形を選んでください。そこへパーツを足したり消したりして、自分だけのピンボールに仕上げます。',
        'Pick a template to start from. Then add and remove parts to make it your own.')
      : L('ひな形を選んでください。今のテーブルは置き換わります（必要なら先に「保存」を）。',
        'Pick a template. It replaces the current table (use "Save" first if you want to keep it).');
    const grid = $('#tplGrid');
    grid.innerHTML = '';
    for (const t of TEMPLATES) {
      const cv = h('canvas'), name = tr(t.name);
      const card = h('button', { class: 'tpl', type: 'button' }, cv, h('b', { text: name }), h('small', { text: tr(t.desc) }));
      card.addEventListener('click', () => {
        if (!first && isDirty() && !confirm(L('今のテーブルを「' + name + '」に置き換えます。よろしいですか？', 'Replace the current table with "' + name + '"?'))) return;
        loadProject(t.project);
        closeModal('#tplModal');
        toast(L('「' + name + '」を読み込みました。パーツを足したり消したりしてみよう！', 'Loaded "' + name + '". Now add and remove parts!'));
      });
      grid.append(card);
      requestAnimationFrame(() => renderThumb(cv, t.project));
    }
    openModal('#tplModal');
  }

  function renderThumb(canvas, proj) {
    const p = E.normalizeProject(proj), T = p.table;
    const w = 280, k = w / T.width;
    canvas.width = w;
    canvas.height = Math.round(T.height * k);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    E.drawScene(ctx, p, { px: k, time: 0 });
  }

  function loadProject(data) {
    project = E.normalizeProject(clone(data));
    sel.clear();
    hoverId = null;
    bgEdit = false;
    resetHistory();
    fitView();
    refreshAll();
  }

  function refreshAll() {
    titleInput.value = project.title;
    buildInspector();
    updateToolbar();
    setStatus(defaultStatus());
    requestRender();
  }

  function safeName(s) { return String(s || 'pinball').trim().replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60) || 'pinball'; }

  function download(text, filename, type) {
    const url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
    const a = h('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  function saveJSON() {
    download(JSON.stringify(project, null, 2), safeName(project.title) + '.pinball.json', 'application/json');
    toast(L('作品を保存しました（.pinball.json）', 'Saved your table (.pinball.json)'));
  }

  function openFile(file) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const text = String(rd.result);
        const data = /^\s*</.test(text) ? E.extractProjectFromHTML(text) : JSON.parse(text);
        if (!data || !Array.isArray(data.objects)) throw new Error('not a pinball project');
        if (isDirty() && !confirm(L('今のテーブルを閉じて「' + file.name + '」を開きます。よろしいですか？', 'Close the current table and open "' + file.name + '"?'))) return;
        loadProject(data);
        closeModal('#tplModal');
        toast(L('「' + project.title + '」を開きました', 'Opened "' + project.title + '"'));
      } catch (err) {
        toast(L('このファイルは読み込めませんでした', 'Could not open this file'), 'error');
      }
    };
    rd.readAsText(file);
  }

  // テストプレイ（書き出すのと同じHTMLを iframe で動かす）
  const playFrame = $('#playFrame'), playArea = $('#playArea'), deviceEl = $('#device');
  function openPlay() {
    hideMenu();
    const warns = checkProject();
    if (warns.length) toast('⚠ ' + warns[0]);
    startPlay();
    openModal('#playModal');
    setDevice(device);
  }
  // テーブルの言語が「自動」のときは、エディタの表示言語でテストプレイする
  function startPlay() { playFrame.srcdoc = E.buildStandaloneHTML(project, ENGINE_SRC, { autostart: true, lang }); }
  function closePlay() {
    closeModal('#playModal');
    playFrame.srcdoc = '';
    stage.focus();
  }
  function setDevice(d) {
    device = d;
    storeSet(DEVICE_KEY, d);
    playArea.className = 'play-area ' + d;
    document.querySelectorAll('#deviceSeg button').forEach((b) => b.classList.toggle('on', b.dataset.dev === d));
    fitDevice();
  }
  function fitDevice() {
    if (device !== 'phone') { deviceEl.style.transform = ''; return; }
    const a = playArea.getBoundingClientRect();
    const s = Math.min(1, (a.width - 48) / 390, (a.height - 48) / 844);
    deviceEl.style.transform = 'scale(' + s + ')';
  }
  // テストプレイ中のキー入力をゲームに届ける。
  // 表示切替などのボタンを押すとフォーカスがエディタ側に移るので、ゲームへ戻す
  function focusGame() {
    try { playFrame.focus(); playFrame.contentWindow.focus(); } catch (e) { /* 無視 */ }
  }
  playFrame.addEventListener('load', focusGame);
  document.querySelector('.play-bar').addEventListener('click', () => setTimeout(focusGame));
  function forwardKey(e) {
    if (!$('#playModal').classList.contains('show') || e.key === 'Escape') return false;
    try {
      const w = playFrame.contentWindow;
      w.dispatchEvent(new w.KeyboardEvent(e.type, { code: e.code, key: e.key, repeat: e.repeat, bubbles: true, cancelable: true }));
    } catch (err) { /* ゲームが読み込み中など */ }
    e.preventDefault();
    focusGame();
    return true;
  }
  window.addEventListener('message', (e) => { if (e.data && e.data.type === 'pinball-exit') closePlay(); });

  function openExport() {
    $('#exportName').value = safeName(project.title);
    openModal('#exportModal');
    setTimeout(() => $('#exportName').select(), 50);
  }
  function doExport() {
    const name = safeName($('#exportName').value) + '.html';
    download(E.buildStandaloneHTML(project, ENGINE_SRC), name, 'text/html');
    closeModal('#exportModal');
    toast(L('「' + name + '」を書き出しました！ ダブルクリックで遊べます', 'Exported "' + name + '"! Double-click it to play.'));
  }

  // ================================================================
  //  ボタン・キーボード
  // ================================================================
  function bindToolbar() {
    $('#btnNew').addEventListener('click', () => openTemplates(false));
    $('#btnOpen').addEventListener('click', () => $('#fileInput').click());
    $('#tplOpenFile').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) openFile(f); e.target.value = ''; });
    $('#imageInput').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) loadBgImage(f); e.target.value = ''; });
    $('#btnSave').addEventListener('click', saveJSON);
    $('#btnUndo').addEventListener('click', undo);
    $('#btnRedo').addEventListener('click', redo);
    $('#btnHelp').addEventListener('click', () => openModal('#helpModal'));
    $('#btnPlay').addEventListener('click', openPlay);
    $('#btnExport').addEventListener('click', openExport);
    $('#exportGo').addEventListener('click', doExport);
    $('#exportName').addEventListener('keydown', (e) => { if (e.key === 'Enter') doExport(); });
    $('#playClose').addEventListener('click', closePlay);
    $('#playRestart').addEventListener('click', startPlay);
    $('#btnLang').addEventListener('click', () => setLang(lang === 'ja' ? 'en' : 'ja'));
    document.querySelectorAll('#deviceSeg button').forEach((b) => b.addEventListener('click', () => setDevice(b.dataset.dev)));
    $('#zoomIn').addEventListener('click', () => zoomAt(stageWrap.clientWidth / 2, stageWrap.clientHeight / 2, view.s * 1.25));
    $('#zoomOut').addEventListener('click', () => zoomAt(stageWrap.clientWidth / 2, stageWrap.clientHeight / 2, view.s / 1.25));
    $('#zoomFit').addEventListener('click', fitView);
    $('#optSnap').addEventListener('change', (e) => { opt.snap = e.target.checked; });
    $('#optGrid').addEventListener('change', (e) => { opt.grid = e.target.checked; requestRender(); });
    titleInput.addEventListener('input', () => { project.title = titleInput.value; refreshInspectorValues(); });
    titleInput.addEventListener('change', () => { if (!project.title.trim()) { project.title = 'MY PINBALL'; titleInput.value = project.title; } commit(); });
    window.addEventListener('resize', () => { fitDevice(); hideMenu(); });
    new ResizeObserver(() => { if (view.auto) fitView(); else requestRender(); }).observe(stageWrap);

    // ファイルをウィンドウにドロップ：画像なら背景に、それ以外は作品として開く
    window.addEventListener('dragover', (e) => { if (e.dataTransfer && [...e.dataTransfer.types].indexOf('Files') >= 0) e.preventDefault(); });
    window.addEventListener('drop', (e) => {
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (!f) return;
      e.preventDefault();
      if (/^image\//.test(f.type)) loadBgImage(f); else openFile(f);
    });
  }

  function bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (keyCapture) { captureKey(e); return; }        // キー設定の待ち受け中は、押したキーを登録するだけ
      const ae = document.activeElement;
      const typing = ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && !/^(range|checkbox|color|button)$/.test(ae.type)));
      const mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();

      if ($('#playModal').classList.contains('show')) {
        if (e.key === 'Escape') { e.preventDefault(); closePlay(); }
        else forwardKey(e);
        return;
      }
      if (anyModal()) {
        if (e.key === 'Escape') anyModal().classList.remove('show');
        return;
      }
      if (mod && key === 'enter') { e.preventDefault(); openPlay(); return; }
      if (mod && key === 's') { e.preventDefault(); saveJSON(); return; }
      if (typing) return;
      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && key === 'y') { e.preventDefault(); redo(); return; }
      if (mod && key === 'd') { e.preventDefault(); duplicateSel(); return; }
      if (mod && key === 'c') { copySel(); return; }
      if (mod && key === 'v') { paste(); return; }
      if (mod && key === 'a') { e.preventDefault(); selectAll(); return; }
      if (mod) return;
      const step = e.shiftKey ? 10 : 1;
      switch (e.key) {
        case 'Delete': case 'Backspace': e.preventDefault(); deleteSel(); break;
        case 'Escape':
          hideMenu();
          if (bgEdit) { setBgEdit(false); break; }
          sel.clear();
          refreshSelection();
          break;
        case 'ArrowLeft': e.preventDefault(); nudge(-step, 0); break;
        case 'ArrowRight': e.preventDefault(); nudge(step, 0); break;
        case 'ArrowUp': e.preventDefault(); nudge(0, -step); break;
        case 'ArrowDown': e.preventDefault(); nudge(0, step); break;
        case 'm': case 'M': mirrorCopySel(); break;
        case '?': openModal('#helpModal'); break;
        case ' ':
          e.preventDefault();
          if (!spaceDown) { spaceDown = true; stage.style.cursor = 'grab'; }
          break;
      }
    });
    document.addEventListener('keyup', (e) => {
      if (forwardKey(e)) return;
      if (e.key === ' ') { spaceDown = false; stage.style.cursor = bgEdit ? 'move' : ''; }
    });
    window.addEventListener('blur', () => { spaceDown = false; });
  }

  // 表示言語の切り替え（作り直せるものはすべて作り直す）
  let tplFirst = false;
  function setLang(next) {
    lang = next;
    storeSet(LANG_KEY, lang);
    applyStaticText();
    buildPalette();
    buildInspector();
    setStatus(defaultStatus());
    if ($('#tplModal').classList.contains('show')) openTemplates(tplFirst);
  }

  // ================================================================
  //  起動
  // ================================================================
  function init() {
    applyStaticText();
    let saved = null;
    try { saved = JSON.parse(storeGet(AUTOSAVE_KEY)); } catch (e) { saved = null; }
    const first = !(saved && Array.isArray(saved.objects));
    project = E.normalizeProject(first ? (TEMPLATES[0] ? TEMPLATES[0].project : {}) : saved);
    buildPalette();
    bindStage();
    bindToolbar();
    bindModals();
    bindKeys();
    resetHistory();
    fitView();
    refreshAll();
    if (first) openTemplates(true);
  }

  init();
})();
