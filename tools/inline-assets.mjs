// index.html 의 아트를 data URL 로 심는다 (단일 HTML 유지).
//   node tools/inline-assets.mjs [대상.html] [에셋폴더]
//   기본값: index.html / assets
//
// 왜 인라인인가: 배포본(games/tuho.html)은 파일 하나로 올라간다. 에셋을 따로 두면
// games/assets/tuho/ 와 repo 쪽을 늘 맞춰야 하고, 다른 게임들이 이미 그 숙제로
// 고생하고 있다(memory: "에셋은 3곳 일치"). 그림 8장 57KB 면 인라인이 더 싸다.
//
// **여러 번 돌려도 된다.** 이미 심어진 data URL 도 assets/manifest.json 순서대로
// 전부 다시 생성한다. 그래서 아트가 바뀌면 PNG 만 교체하고 이걸 다시 돌리면 되고,
// '편집용 사본'과 '배포용 사본'이 갈라지는 일이 생기지 않는다.
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2] || 'index.html';
const dir = process.argv[3] || 'assets';

const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const list = manifest.assets;
if (!Array.isArray(list) || !list.length) { console.error('manifest.json 의 assets 가 비었다'); process.exit(1); }

let html = fs.readFileSync(target, 'utf8');

// ART 로더의 배열 리터럴을 통째로 찾는다. 두 번째 요소가 파일 경로든 data URL 이든 상관없다.
const re = /(for\(const \[k,src\] of )\[[\s\S]*?\](\)\{)/;
const m = re.exec(html);
if (!m) { console.error('ART 로더 배열을 못 찾았다 (for(const [k,src] of [...]) 패턴)'); process.exit(1); }

let raw = 0, enc = 0;
const entries = list.map(([key, file]) => {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) { console.error(`없는 에셋: ${p}`); process.exit(1); }
  const buf = fs.readFileSync(p);
  const b64 = buf.toString('base64');
  raw += buf.length; enc += b64.length;
  console.log(`  ${key.padEnd(6)} ${file.padEnd(26)} ${(buf.length/1024).toFixed(1).padStart(6)} KB → ${(b64.length/1024).toFixed(1).padStart(6)} KB`);
  return `['${key}','data:image/png;base64,${b64}']`;
});

const before = html.length;
html = html.slice(0, m.index) + m[1] + '[' + entries.join(',\n                        ') + ']' + m[2] + html.slice(m.index + m[0].length);
fs.writeFileSync(target, html);

console.log(`  ${'-'.repeat(56)}`);
console.log(`  에셋 ${list.length}장  ${(raw/1024).toFixed(1)} KB → base64 ${(enc/1024).toFixed(1)} KB`);
console.log(`  ${target}  ${(before/1024).toFixed(1)} KB → ${(html.length/1024).toFixed(1)} KB`);
if (/'assets\//.test(html)) { console.error('✗ 아직 남은 assets/ 경로 참조가 있다'); process.exit(1); }
console.log('  ✓ 외부 에셋 의존 없음 (단일 파일)');
