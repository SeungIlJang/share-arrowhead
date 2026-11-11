// 스토어 스크린샷 수신기 — 브라우저에서 canvas.toDataURL 결과를 받아 PNG 로 저장한다.
//   node tools/shot-receiver.mjs [포트] [저장폴더]
// 브라우저 쪽: fetch('http://localhost:8899/save?name=shot1', {method:'POST', body:dataUrl})
//
// 캔버스를 파일로 빼는 다른 방법이 다 막혀 있어서 둔다 — 패널 스크린샷은 축소돼 돌아오고,
// data URL 은 수십만 자라 도구 결과로 못 들고 나온다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = +(process.argv[2] || 8899);
const dir = process.argv[3] || 'store-assets';
fs.mkdirSync(dir, { recursive: true });

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://x');
  if (req.method !== 'POST' || u.pathname !== '/save') { res.writeHead(404); return res.end('no'); }
  const name = (u.searchParams.get('name') || 'shot').replace(/[^A-Za-z0-9._-]/g, '');
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const m = /^data:image\/png;base64,/.exec(body);
    if (!m) { res.writeHead(400); return res.end('data URL 이 아니다'); }
    const buf = Buffer.from(body.slice(m[0].length), 'base64');
    const file = path.join(dir, name + '.png');
    fs.writeFileSync(file, buf);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    console.log(`저장 ${file}  ${w}x${h}  ${(buf.length / 1024).toFixed(1)} KB`);
    res.writeHead(200); res.end(`${w}x${h}`);
  });
}).listen(port, () => console.log('수신 대기 :' + port + ' → ' + path.resolve(dir)));
