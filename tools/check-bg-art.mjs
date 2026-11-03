#!/usr/bin/env node
/**
 * 배경 에셋 검수기
 *   node tools/check-bg-art.mjs <sky.png> <clouds.png> <stars.png>
 *
 * 코드가 쓰는 방식에서 깨지는 조건만 본다.
 *   하늘  — 가로로 화면 폭까지 늘린다 → 모든 가로 행이 단색이어야 늘려도 안 뭉갠다
 *   구름  — 가로로 반복한다 → 좌우 끝이 맞아야 이음선이 없다. 투명 틈이 충분해야 벽이 안 된다
 *   별    — 가로·세로로 반복한다 → 네 변이 모두 맞아야 한다
 */
import fs from 'node:fs';
import { decodePNG } from './png.mjs';

let fails=0,warns=0;
const ok=(c,l,g)=>{ if(c)console.log('  ✓ '+l+(g?'  '+g:'')); else{fails++;console.log('  ✗ '+l+(g?'  '+g:''));} };
const warn=(c,l,g)=>{ if(c)console.log('  ✓ '+l+(g?'  '+g:'')); else{warns++;console.log('  ! '+l+(g?'  '+g:''));} };
const kb=f=>(fs.statSync(f).size/1024).toFixed(1)+'KB';

function sky(file){
  console.log('\n── 하늘  '+file+'  ('+kb(file)+') ──');
  const im=decodePNG(fs.readFileSync(file)),{w,h,ch,data}=im;
  console.log(`  ${w} × ${h}`);
  const px=(x,y)=>{const i=(y*w+x)*ch;return [data[i],data[i+1],data[i+2]];};
  // 행마다 단색인가 — 가로로 늘려 쓰므로 행 안에 변화가 있으면 뭉갠다
  let worstRow=0, rowAt=0;
  for(let y=0;y<h;y+=4){
    const a=px(0,y); let d=0;
    for(let x=1;x<w;x++){ const b=px(x,y); d=Math.max(d,Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2])); }
    if(d>worstRow){worstRow=d; rowAt=y;}
  }
  ok(worstRow<=6,'모든 가로 행이 단색 (가로로 늘려도 안전)', `최대 편차 ${worstRow} (y=${rowAt})`);
  // 위아래 색이 발주대로인가
  const bot=px(0,h-1), top=px(0,0);
  const hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
  // 밤하늘은 전체가 어두워 파랑 '절대값'도 낮다. 따뜻함은 R−B, 밝기는 휘도로 비교해야 한다.
  const warmth=c=>c[0]-c[2], lum=c=>0.299*c[0]+0.587*c[1]+0.114*c[2];
  console.log(`  아래 ${hex(bot)} 따뜻함 ${warmth(bot)} 밝기 ${lum(bot).toFixed(0)}`
            + `  →  위 ${hex(top)} 따뜻함 ${warmth(top)} 밝기 ${lum(top).toFixed(0)}`);
  ok(warmth(bot)>warmth(top),'아래가 더 따뜻하다 (노을 → 밤)');
  ok(lum(bot)>lum(top)*2,'위로 갈수록 어두워진다');
  // 띠(banding) — 연속한 샘플 간 급격한 점프가 없어야
  let jump=0, jAt=0;
  for(let y=1;y<h;y++){ const a=px(0,y-1),b=px(0,y);
    const d=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);
    if(d>jump){jump=d; jAt=y;} }
  warn(jump<=6,'세로 그라디언트에 띠가 없다', `최대 점프 ${jump} (y=${jAt})`);
}

function tile(file,label,bothAxes){
  console.log(`\n── ${label}  ${file}  (${kb(file)}) ──`);
  const im=decodePNG(fs.readFileSync(file)),{w,h,ch,data}=im;
  console.log(`  ${w} × ${h} · 알파 ${im.alpha?'있음':'없음'}`);
  ok(im.alpha,'알파 채널이 있다');
  const at=(x,y)=>{const i=(y*w+x)*ch;return [data[i],data[i+1],data[i+2],ch===4?data[i+3]:255];};
  const diff=(p,q)=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2])+Math.abs(p[3]-q[3]);
  // 좌우 이음: 마지막 열 다음에 첫 열이 온다
  let lr=0; for(let y=0;y<h;y++) lr+=diff(at(w-1,y),at(0,y));
  lr/=h;
  ok(lr<=12,'좌우 반복 경계가 맞는다', '평균 차이 '+lr.toFixed(1));
  if(bothAxes){
    let tb=0; for(let x=0;x<w;x++) tb+=diff(at(x,h-1),at(x,0));
    tb/=w;
    ok(tb<=12,'상하 반복 경계가 맞는다', '평균 차이 '+tb.toFixed(1));
  }
  // 투명 비율 — 벽처럼 꽉 차면 하늘이 안 보인다
  let opaque=0; for(let y=0;y<h;y+=2) for(let x=0;x<w;x+=2) if(at(x,y)[3]>128) opaque++;
  const frac=opaque/((h/2)*(w/2));
  console.log(`  불투명 비율 ${(frac*100).toFixed(1)}%`);
  if(label.includes('구름')) ok(frac<=0.5,'투명 틈이 절반 이상 (하늘이 비친다)', (100-frac*100).toFixed(0)+'% 투명');
  else ok(frac<=0.08,'별이 과하지 않다', (frac*100).toFixed(1)+'% 불투명');
}

const [,,skyF,cloudF,starF]=process.argv;
if(!skyF||!cloudF||!starF){ console.error('사용법: node tools/check-bg-art.mjs <sky> <clouds> <stars>'); process.exit(2); }
sky(skyF);
tile(cloudF,'구름 (가로 반복)',false);
tile(starF,'별 (가로·세로 반복)',true);
const total=[skyF,cloudF,starF].reduce((a,f)=>a+fs.statSync(f).size,0);
console.log(`\n합계 ${(total/1024).toFixed(1)}KB → base64 약 ${(total/1024*4/3).toFixed(1)}KB`);
warn(total/1024<=80,'인라인해도 부담 없는 크기', (total/1024).toFixed(1)+'KB');
console.log('='.repeat(54));
console.log(`필수 ${fails}건 실패 · 권장 ${warns}건 경고 → ${fails?'재작업 필요':'통과'}`);
process.exit(fails?1:0);
