/*
 * Pinball Maker — Copyright (c) 2026 FUJIYAMA2236 — MIT License (see LICENSE)
 *
 * サンプルの書き出し（開発用）
 *   node tools/build-samples.js
 * js/templates.js のサンプルから、samples/ にプロジェクト(JSON)と遊べるHTMLを作ります。
 * エディタの「HTML書き出し」と同じ処理です。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/engine.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/templates.js'), 'utf8'), ctx);

const E = ctx.window.PinballEngine;
const engineSrc = vm.runInContext('createPinballEngine.toString()', ctx);
const outDir = path.join(root, 'samples');
fs.mkdirSync(outDir, { recursive: true });

const targets = { galaxy: 'galaxy-drive', standard: 'standard' };
for (const t of ctx.window.PINBALL_TEMPLATES) {
  const name = targets[t.id];
  if (!name) continue;
  const project = E.normalizeProject(JSON.parse(JSON.stringify(t.project)));
  // id を連番にして差分が出にくいようにする
  project.objects.forEach((o, i) => { o.id = 'o' + (i + 1); });
  fs.writeFileSync(path.join(outDir, name + '.pinball.json'), JSON.stringify(project, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, name + '.html'), E.buildStandaloneHTML(project, engineSrc));
  console.log('wrote samples/' + name + '.pinball.json, samples/' + name + '.html');
}
