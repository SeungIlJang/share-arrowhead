#!/usr/bin/env node
/**
 * 당겨서 쏘기 UI 에셋 검수기
 *   node tools/check-ui-art.mjs <pull-ring.png> <reticle.png> <hand-drag.png>
 *
 * 코드가 쓰는 방식에서 깨지는 조건만 본다.
 *   당김 링 — 궁사 위에 깐다 → 중앙이 비어야 궁사를 안 가린다. 회전 대칭이어야 한다
 *   조준 표식 — 28px 로 줄여 쓴다 → 그 크기에서 보여야 하고 가운데가 뚫려야 표적이 보인다
 *   안내 손가락 — 알파와 내용만 확인
 */
import fs from 'node:fs';
import { readPNG } from './png.mjs';

let fails=0,warns=0;
const ok=(c,l,g)=>{ if(c)console.log('  ✓ '+l+(g?'  '+g:'')); else{fails++;console.log('  ✗ '+l+(g?'  '+g:''));} };
const warn=(c,l,g)=>{ if(c)console.log('  ✓ '+l+(g?'  '+g:'')); else{warns++;console.log('  ! '+l+(g?'  '+g:''));} };
const kb=f=>(fs.statSync(f).size/1024).toFixed(1)+'KB';
const load=readPNG;   // 4비트 팔레트 PNG 도 8비트 RGBA 로 정규화해 돌려준다

function ring(file){
  console.log('\n── 당김 링  '+file+'  ('+kb(file)+') ──');
  const im=load(file),{w,h}=im; console.log(`  ${w} × ${h} · 알파 ${im.alpha?'있음':'없음'}`);
  ok(im.alpha,'알파 채널');
  const cx=(w-1)/2, cy=(h-1)/2, R=Math.min(w,h)/2;
  // 중앙이 비어 있는 반경 — 궁사가 가려지면 안 된다
  let clear=0;
  for(let r=1;r<R;r++){
    let any=false;
    for(let t=0;t<64;t++){ const a=t/64*Math.PI*2;
      if(im.A(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r))>40){any=true;break;} }
    if(any) break; clear=r;
  }
  console.log(`  중앙 투명 반경 ${clear}px (전체 반경의 ${(clear/R*100).toFixed(0)}%)`);
  ok(clear/R>=0.28,'중앙이 충분히 비어 궁사를 가리지 않는다',(clear/R*100).toFixed(0)+'%');
  // 회전 대칭 — 링을 어느 각도에서 봐도 같아야 채움 애니메이션이 자연스럽다
  const prof=r=>{ let n=0; for(let t=0;t<180;t++){ const a=t/180*Math.PI*2;
    if(im.A(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r))>40)n++; } return n/180; };
  let worst=0;
  for(let r=Math.round(clear+4); r<R-2; r+=6){
    const q=[0,1,2,3].map(k=>{ let n=0; for(let t=0;t<45;t++){ const a=(k*45+t)/180*Math.PI*2;
      if(im.A(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r))>40)n++; } return n/45; });
    worst=Math.max(worst, Math.max(...q)-Math.min(...q));
  }
  warn(worst<=0.25,'4분면이 고르다 (회전 대칭)','최대 차이 '+(worst*100).toFixed(0)+'%');
}

function reticle(file){
  console.log('\n── 조준 표식  '+file+'  ('+kb(file)+') ──');
  const im=load(file),{w,h}=im; console.log(`  ${w} × ${h} · 알파 ${im.alpha?'있음':'없음'}`);
  ok(im.alpha,'알파 채널');
  const cx=(w-1)/2, cy=(h-1)/2, R=Math.min(w,h)/2;
  // 가운데가 뚫려 표적이 보여야 한다 (정중앙 점은 허용)
  let mid=0, n=0;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const d=Math.hypot(x-cx,y-cy);
    if(d>R*0.15 && d<R*0.5){ n++; if(im.A(x,y)>128) mid++; }
  }
  ok(mid/n<0.12,'가운데가 비어 표적이 보인다',(mid/n*100).toFixed(1)+'% 채움');
  // 28px 로 줄였을 때 남는가 — 박스 평균으로 다운샘플
  const S=28, step=w/S; let vis=0;
  for(let j=0;j<S;j++) for(let i=0;i<S;i++){
    let a=0,c=0;
    for(let y=Math.floor(j*step);y<Math.floor((j+1)*step);y++)
      for(let x=Math.floor(i*step);x<Math.floor((i+1)*step);x++){ a+=im.A(x,y); c++; }
    if(c&&a/c>60) vis++;
  }
  console.log(`  28px 축소 시 보이는 칸 ${vis}/${S*S}`);
  ok(vis>=24,'28px 에서도 형태가 남는다',vis+'칸');
}

function hand(file){
  console.log('\n── 당기기 안내  '+file+'  ('+kb(file)+') ──');
  const im=load(file),{w,h}=im; console.log(`  ${w} × ${h} · 알파 ${im.alpha?'있음':'없음'}`);
  ok(im.alpha,'알파 채널');
  let op=0; for(let y=0;y<h;y+=2) for(let x=0;x<w;x+=2) if(im.A(x,y)>128) op++;
  const frac=op/((h/2)*(w/2));
  console.log(`  불투명 ${(frac*100).toFixed(1)}%`);
  ok(frac>0.01 && frac<0.45,'내용이 있고 화면을 덮지 않는다',(frac*100).toFixed(1)+'%');
}

const [,,a,b,c]=process.argv;
if(!a||!b||!c){ console.error('사용법: node tools/check-ui-art.mjs <ring> <reticle> <hand>'); process.exit(2); }
ring(a); reticle(b); hand(c);
const total=[a,b,c].reduce((s,f)=>s+fs.statSync(f).size,0);
console.log(`\n합계 ${(total/1024).toFixed(1)}KB`);
console.log('='.repeat(52));
console.log(`필수 ${fails}건 실패 · 권장 ${warns}건 경고 → ${fails?'재작업 필요':'통과'}`);
process.exit(fails?1:0);
