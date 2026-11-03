/**
 * 의존성 없는 PNG 디코더 — 검수기들이 공유한다.
 *
 * 비트심도 1/2/4/8, 컬러타입 0(그레이)·2(RGB)·3(팔레트)·4(그레이+알파)·6(RGBA),
 * 그리고 tRNS(팔레트·단색 투명)를 지원하고 **항상 8비트 RGBA 로 정규화**해 돌려준다.
 *
 * 왜 이렇게까지: Codex 가 평평한 아트를 4비트 팔레트로 내보내면 1~4KB 로 아주 작아진다.
 * 처음엔 8비트만 지원해 검수가 통째로 죽었다. 검수기마다 디코더를 복사해 두면
 * 같은 사고가 반복되므로 여기 하나로 모은다.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

const CHANNELS = { 0:1, 2:3, 3:1, 4:2, 6:4 };

export function decodePNG(buf){
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG이 아닙니다');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const depth = buf[24], color = buf[25], interlace = buf[28];
  if (interlace !== 0) throw new Error('인터레이스 PNG 미지원');
  const ch = CHANNELS[color];
  if (!ch) throw new Error('컬러타입 ' + color + ' 미지원');
  if (![1,2,4,8].includes(depth)) throw new Error('비트심도 ' + depth + ' 미지원');

  const idat = []; let plte = null, trns = null; let o = 8;
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o+4, o+8);
    const body = buf.subarray(o+8, o+8+len);
    if (type === 'IDAT') idat.push(body);
    else if (type === 'PLTE') plte = body;
    else if (type === 'tRNS') trns = body;
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));

  // 언필터 — 필터는 '바이트' 단위로 동작하므로 서브바이트 심도에서는 bpp=1 이다
  const bitsPerPx = depth * ch;
  const stride = Math.ceil(w * bitsPerPx / 8);
  const bpp = Math.max(1, Math.ceil(bitsPerPx / 8));
  const lines = Buffer.alloc(stride * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++], src = raw.subarray(p, p + stride); p += stride;
    const cur = lines.subarray(y*stride, (y+1)*stride);
    const prev = y ? lines.subarray((y-1)*stride, y*stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i-bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = (prev && i >= bpp) ? prev[i-bpp] : 0;
      let v = src[i];
      if (ft === 1) v += a; else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const pa = Math.abs(b-c), pb = Math.abs(a-c), pc = Math.abs(a+b-2*c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 255;
    }
  }

  // 샘플 추출 (서브바이트 포함)
  const max = (1 << depth) - 1;
  const sample = (y, idx) => {
    if (depth === 8) return lines[y*stride + idx];
    const bit = idx * depth, byte = lines[y*stride + (bit >> 3)];
    return (byte >> (8 - depth - (bit & 7))) & max;
  };

  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o4 = (y*w + x) * 4;
    if (color === 3) {
      const i = sample(y, x);
      out[o4]   = plte ? plte[i*3]   : 0;
      out[o4+1] = plte ? plte[i*3+1] : 0;
      out[o4+2] = plte ? plte[i*3+2] : 0;
      out[o4+3] = (trns && i < trns.length) ? trns[i] : 255;
    } else if (color === 0 || color === 4) {
      const g = Math.round(sample(y, x*ch) / max * 255);
      out[o4] = out[o4+1] = out[o4+2] = g;
      out[o4+3] = ch === 2 ? Math.round(sample(y, x*ch+1) / max * 255) : 255;
    } else {
      const s = i => Math.round(sample(y, x*ch + i) / max * 255);
      out[o4] = s(0); out[o4+1] = s(1); out[o4+2] = s(2);
      out[o4+3] = ch === 4 ? s(3) : 255;
    }
  }

  return {
    w, h, ch: 4, data: out,
    depth, color,
    alpha: color === 4 || color === 6 || (color === 3 && !!trns),
    /** 알파 */ A: (x,y) => out[(y*w + x)*4 + 3],
    /** [r,g,b] */ RGB: (x,y) => { const i=(y*w+x)*4; return [out[i],out[i+1],out[i+2]]; }
  };
}

export const readPNG = file => decodePNG(fs.readFileSync(file));
