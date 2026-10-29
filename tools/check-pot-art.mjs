#!/usr/bin/env node
/**
 * 항아리 아트 치수 검증기
 *
 *   node tools/check-pot-art.mjs <항아리.png>
 *
 * 투명 배경 PNG(RGBA)를 픽셀 단위로 실측해, 게임 판정 좌표와 직결된 비율이
 * 발주 규격 안에 들어오는지 확인한다. 생성 직후 바로 돌려 보고 통과할 때까지 재생성할 것.
 *
 * 규격 (design/pot-spec.svg 와 동일):
 *   귀 구멍 폭      = 입구 폭 × 0.30
 *   귀 중심 오프셋   = 입구 폭 × 0.75
 *   귀 외곽         = 입구 폭 × 0.90
 *   입구 타원 세로반경 = 입구 폭 × 0.18   (정투상 — 위에서 내려다보면 안 됨)
 *   굽 폭           = 몸통 폭 × 0.60
 *   입구/몸통 폭     = 0.45 ~ 0.56
 *   귀 림과 입구 림의 y 차이 = 0            (판정면이 하나의 수평선이므로)
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

// ---------- 최소 PNG 디코더 (8bit, 인터레이스 없음) ----------
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG이 아닙니다');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const depth = buf[24], color = buf[25], interlace = buf[28];
  if (depth !== 8) throw new Error(`비트심도 ${depth} 미지원 (8만)`);
  if (interlace !== 0) throw new Error('인터레이스 PNG 미지원');
  const ch = { 0: 1, 2: 3, 4: 2, 6: 4 }[color];
  if (!ch) throw new Error(`컬러타입 ${color} 미지원`);

  const idat = [];
  let o = 8;
  while (o < buf.length) {
    const len = buf.readUInt32BE(o);
    const type = buf.toString('ascii', o + 4, o + 8);
    if (type === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len));
    if (type === 'IEND') break;
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));

  const stride = w * ch;
  const out = Buffer.alloc(stride * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++];
    const line = raw.subarray(p, p + stride); p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev ? prev[i] : 0;
      const c = (prev && i >= ch) ? prev[i - ch] : 0;
      let v = line[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 255;
    }
  }
  return { w, h, ch, data: out, hasAlpha: color === 6 || color === 4 };
}

// ---------- 측정 ----------
const file = process.argv[2];
if (!file) { console.error('사용법: node tools/check-pot-art.mjs <항아리.png>'); process.exit(2); }
const img = decodePNG(fs.readFileSync(file));
const { w, h, ch, data } = img;
const A = (x, y) => ch === 4 ? data[(y * w + x) * ch + 3] : 255;
const L = (x, y) => { const i = (y * w + x) * ch; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };

const OPAQUE = 128;
let fails = 0, warns = 0;
const line = s => console.log(s);
function check(ok, label, got, want) {
  if (ok) line(`  ✓ ${label}  ${got}`);
  else { fails++; line(`  ✗ ${label}  측정 ${got}  /  규격 ${want}`); }
}
function warn(ok, label, got, want) {
  if (ok) line(`  ✓ ${label}  ${got}`);
  else { warns++; line(`  ! ${label}  측정 ${got}  /  권장 ${want}`); }
}

// 실루엣 바운딩 박스
let minX = w, maxX = -1, minY = h, maxY = -1;
const rowSpan = new Array(h).fill(null);
for (let y = 0; y < h; y++) {
  let a = -1, b = -1;
  for (let x = 0; x < w; x++) if (A(x, y) >= OPAQUE) { if (a < 0) a = x; b = x; }
  if (a >= 0) {
    rowSpan[y] = [a, b];
    if (y < minY) minY = y; maxY = y;
    if (a < minX) minX = a; if (b > maxX) maxX = b;
  }
}
if (maxX < 0) { console.error('불투명 픽셀이 없습니다 — 배경이 투명한 PNG가 맞습니까?'); process.exit(2); }

const silW = maxX - minX + 1, silH = maxY - minY + 1;
const cx = (minX + maxX) / 2;

// 어두운 구멍 검출: 상단 45% 영역.
// 구멍 내부는 음영보다 훨씬 어둡다(실측: 구멍 L≈15, 음영 L≈50, 몸통 L≈83).
// 중앙값의 45% 를 임계로 쓰면 음영을 구멍으로 오인하지 않는다.
const topLim = minY + Math.round(silH * 0.45);
const vals = [];
for (let y = minY; y <= topLim; y++) for (let x = minX; x <= maxX; x++)
  if (A(x, y) >= OPAQUE) vals.push(L(x, y));
vals.sort((a, b) => a - b);
const median = vals[Math.floor(vals.length * 0.5)] || 128;
const darkT = Math.max(8, median * 0.45);

const darkMask = new Uint8Array(w * h);
for (let y = minY; y <= topLim; y++) for (let x = minX; x <= maxX; x++)
  if (A(x, y) >= OPAQUE && L(x, y) < darkT) darkMask[y * w + x] = 1;

// 연결 성분(4-이웃, 반복 스택)
const seen = new Uint8Array(w * h), blobs = [];
for (let y = minY; y <= topLim; y++) for (let x = minX; x <= maxX; x++) {
  const i0 = y * w + x;
  if (!darkMask[i0] || seen[i0]) continue;
  const st = [i0]; seen[i0] = 1;
  let x0 = x, x1 = x, y0 = y, y1 = y, cnt = 0;
  while (st.length) {
    const i = st.pop(), px = i % w, py = (i - px) / w;
    cnt++;
    if (px < x0) x0 = px; if (px > x1) x1 = px;
    if (py < y0) y0 = py; if (py > y1) y1 = py;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = px + dx, ny = py + dy;
      if (nx < minX || nx > maxX || ny < minY || ny > topLim) continue;
      const j = ny * w + nx;
      if (darkMask[j] && !seen[j]) { seen[j] = 1; st.push(j); }
    }
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  // 구멍은 "위에서 살짝 내려다본 타원" = 세로보다 가로가 길다.
  // 원통 측면 음영은 세로로 길쭉하므로 이 조건에서 걸러진다.
  if (cnt > silW * silH * 0.0004 && bw >= bh * 1.3)
    blobs.push({ x0, x1, y0, y1, cnt, cx: (x0 + x1) / 2, w: bw, h: bh });
}
blobs.sort((a, b) => b.cnt - a.cnt);

line(`\n파일   ${file}`);
line(`이미지 ${w} × ${h}  ·  알파 ${img.hasAlpha ? '있음' : '없음'}`);
line(`실루엣 ${silW} × ${silH}  (x ${minX}~${maxX}, y ${minY}~${maxY})\n`);

line('── 구멍 검출 ──');
if (blobs.length < 3) {
  fails++;
  line(`  ✗ 열린 구멍이 ${blobs.length}개만 검출됨 — 입구 1 + 귀 2 = 3개가 "검은 공동"으로 보여야 합니다`);
} else {
  const three = blobs.slice(0, 3).sort((a, b) => a.cx - b.cx);
  const [earL, mouth, earR] = [three[0], three[1], three[2]];
  // 가운데가 가장 큰 것이 입구
  const mid = three.reduce((m, b) => b.cnt > m.cnt ? b : m, three[0]);
  const ears = three.filter(b => b !== mid).sort((a, b) => a.cx - b.cx);
  const M = mid, EL = ears[0], ER = ears[1];

  line(`  입구   폭 ${M.w}  높이 ${M.h}  중심x ${M.cx.toFixed(1)}  림y ${M.y0}`);
  line(`  왼귀   폭 ${EL.w}  높이 ${EL.h}  중심x ${EL.cx.toFixed(1)}  림y ${EL.y0}`);
  line(`  오른귀 폭 ${ER.w}  높이 ${ER.h}  중심x ${ER.cx.toFixed(1)}  림y ${ER.y0}`);

  const mw = M.w;
  const earW = (EL.w + ER.w) / 2;
  const offL = Math.abs(M.cx - EL.cx), offR = Math.abs(ER.cx - M.cx);
  const off = (offL + offR) / 2;
  const outer = off + earW / 2;
  const rimDy = Math.max(Math.abs(EL.y0 - M.y0), Math.abs(ER.y0 - M.y0));
  // 규격의 "세로반경 = 폭 × 0.18" 은 전체 높이/폭으로 바꾸면 0.36.
  // 단, 여기서 재는 것은 림 바깥선이 아니라 '검은 공동'이라 실제 렌더에서는
  // 립에 가려 조금 더 납작하게 측정된다 → 허용 폭을 넓게 둔다.
  const ellipse = M.h / mw;

  line('\n── 판정 직결 비율 (필수) ──');
  const r = v => v.toFixed(3);
  check(Math.abs(earW / mw - 0.30) <= 0.04, '귀 구멍 폭 / 입구 폭', r(earW / mw), '0.30 ±0.04');
  check(Math.abs(off / mw - 0.75) <= 0.05, '귀 중심 오프셋 / 입구 폭', r(off / mw), '0.75 ±0.05');
  check(Math.abs(outer / mw - 0.90) <= 0.06, '귀 외곽 / 입구 폭', r(outer / mw), '0.90 ±0.06');
  check(rimDy <= Math.max(3, mw * 0.03), '귀 림 y − 입구 림 y', `${rimDy}px`, `0px (허용 ${Math.round(Math.max(3, mw * 0.03))}px)`);
  check(Math.abs(offL - offR) <= mw * 0.04, '좌우 귀 대칭', `${Math.abs(offL - offR).toFixed(1)}px 차이`, `≤ ${(mw * 0.04).toFixed(1)}px`);

  line('\n── 형태 (권장) ──');
  warn(Math.abs(ellipse - 0.36) <= 0.15, '입구 공동 세로/가로 (원근)', r(ellipse), '0.36 ±0.15 — 위에서 내려다보지 말 것');
  warn(mw / silW >= 0.40 && mw / silW <= 0.60, '입구 폭 / 전체 폭', r(mw / silW), '0.40~0.60');
}

// 몸통/굽
let bodyMaxW = 0, bodyMaxY = 0;
for (let y = minY; y <= maxY; y++) if (rowSpan[y]) {
  const ww = rowSpan[y][1] - rowSpan[y][0] + 1;
  if (ww > bodyMaxW) { bodyMaxW = ww; bodyMaxY = y; }
}
const footY = maxY - Math.round(silH * 0.02);
const footW = rowSpan[footY] ? rowSpan[footY][1] - rowSpan[footY][0] + 1 : 0;

line('\n── 몸통 / 굽 ──');
line(`  최대 폭 ${bodyMaxW}px  (y=${bodyMaxY}, 위에서 ${((bodyMaxY - minY) / silH * 100).toFixed(0)}% 지점)`);
warn(Math.abs(footW / bodyMaxW - 0.60) <= 0.10, '굽 폭 / 몸통 최대 폭', (footW / bodyMaxW).toFixed(3), '0.60 ±0.10');
warn(Math.abs((bodyMaxY - minY) / silH - 0.5) <= 0.15, '최대 폭 위치', ((bodyMaxY - minY) / silH).toFixed(3), '0.50 ±0.15');

// 투명 배경 / 헤일로
let edgeOpaque = 0;
for (let x = 0; x < w; x++) { if (A(x, 0) >= OPAQUE) edgeOpaque++; if (A(x, h - 1) >= OPAQUE) edgeOpaque++; }
for (let y = 0; y < h; y++) { if (A(0, y) >= OPAQUE) edgeOpaque++; if (A(w - 1, y) >= OPAQUE) edgeOpaque++; }
line('\n── 배경 ──');
check(img.hasAlpha, '알파 채널', img.hasAlpha ? '있음' : '없음', 'RGBA 필수');
check(edgeOpaque === 0, '가장자리 투명', `불투명 ${edgeOpaque}px`, '0px');

// 축소 가독성: 1x 로 줄였을 때 귀 구멍이 몇 px 인지
if (blobs.length >= 3) {
  const three = blobs.slice(0, 3).sort((a, b) => a.cx - b.cx);
  const mid = three.reduce((m, b) => b.cnt > m.cnt ? b : m, three[0]);
  const ears = three.filter(b => b !== mid);
  const earW = (ears[0].w + ears[1].w) / 2;
  const scale = 102 / silW;                 // 게임 내 1단계 항아리 폭 102px
  line('\n── 1x 축소 가독성 (게임 내 실제 크기) ──');
  line(`  전체 폭 102px 로 축소 시 → 귀 구멍 ${(earW * scale).toFixed(1)}px, 입구 ${(mid.w * scale).toFixed(1)}px`);
  warn(earW * scale >= 4, '귀 구멍이 1x에서 보이는가', `${(earW * scale).toFixed(1)}px`, '≥ 4px');
}

line(`\n${'='.repeat(52)}`);
line(fails === 0 ? `필수 ${fails}건 실패 · 권장 ${warns}건 경고 → 통과` : `필수 ${fails}건 실패 · 권장 ${warns}건 경고 → 재생성 필요`);
process.exit(fails ? 1 : 0);
