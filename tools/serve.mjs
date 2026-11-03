#!/usr/bin/env node
/**
 * 의존성 없는 정적 서버.
 *   node tools/serve.mjs [포트]
 *
 * 루트를 저장소가 아니라 **상위 폴더(D:/AI/workspace/game)** 로 잡는다.
 * 프로토가 에셋을 `../../images/` 로 참조하기 때문에, 저장소를 루트로 띄우면
 * 경로가 루트를 벗어나 404 가 난다.
 *   → http://localhost:<포트>/share-arrowhead/proto/vertical.html
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');          // = D:/AI/workspace/game
const PORT = +(process.argv[2] || 8812);

const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
  '.json':'application/json', '.webmanifest':'application/manifest+json' };

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  const target = path.resolve(ROOT, '.' + url);
  // 루트 밖 접근 차단
  if (!target.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }
  fs.stat(target, (err, st) => {
    if (err) { res.writeHead(404, {'content-type':'text/plain; charset=utf-8'}).end('404 ' + url); return; }
    const file = st.isDirectory() ? path.join(target, 'index.html') : target;
    fs.readFile(file, (e, buf) => {
      if (e) { res.writeHead(404).end('404'); return; }
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store'
      }).end(buf);
    });
  });
}).listen(PORT, () => {
  console.log(`root  ${ROOT}`);
  console.log(`세로 프로토  http://localhost:${PORT}/share-arrowhead/proto/vertical.html`);
  console.log(`라이브      http://localhost:${PORT}/share-arrowhead/index.html`);
});
