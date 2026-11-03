#!/usr/bin/env node
/**
 * 누각 기둥 / 층 발판 에셋 검수기
 *
 *   node tools/check-tower-art.mjs <tuho-tower-column.png> <tuho-tier.png>
 *
 * 조립에 직접 쓰이는 두 가지를 본다.
 *   기둥 — 세로로 이어붙였을 때 이음새가 보이지 않는가
 *   발판 — 윗면(게임 오브젝트가 서는 면)이 수평인가, 그 y 는 몇인가,
 *          왼쪽이 기둥에 붙도록 수직으로 잘렸는가, 윗면 위 구조물이 낮은가
 */
import fs from 'node:fs';
import { decodePNG } from './png.mjs';

let fails=0, warns=0;
const ok=(c,l,got)=>{ if(c) console.log('  ✓ '+l+(got?'  '+got:'')); else {fails++; console.log('  ✗ '+l+(got?'  '+got:''));} };
const warn=(c,l,got)=>{ if(c) console.log('  ✓ '+l+(got?'  '+got:'')); else {warns++; console.log('  ! '+l+(got?'  '+got:''));} };

// ───────── 기둥 ─────────
function checkColumn(file){
  console.log('\n── 누각 기둥  '+file+' ──');
  const im=decodePNG(fs.readFileSync(file)), {w,h,ch,data}=im;
  console.log(`  ${w} × ${h} · 알파 ${im.hasAlpha?'있음':'없음'}`);
  const row=y=>data.subarray(y*w*ch,(y+1)*w*ch);
  const diff=(a,b)=>{ let d=0; for(let i=0;i<a.length;i++) d+=Math.abs(a[i]-b[i]); return d/a.length; };

  // 세로 반복: 맨 윗줄과 맨 아랫줄이 같아야 이어붙인 자리가 안 보인다
  const seam=diff(row(0),row(h-1));
  ok(seam<3,'위아래 끝줄이 일치 (세로 이음새 없음)', '평균 차이 '+seam.toFixed(2));

  // 가장자리 띠가 '일정한 단면'인지 — 변화가 있으면 이어붙일 때 무늬가 튄다
  let topVar=0, botVar=0;
  for(let y=1;y<60;y++){ topVar=Math.max(topVar,diff(row(0),row(y))); botVar=Math.max(botVar,diff(row(h-1),row(h-1-y))); }
  warn(topVar<6,'위 60px 가 일정한 단면', '최대 차이 '+topVar.toFixed(2));
  warn(botVar<6,'아래 60px 가 일정한 단면', '최대 차이 '+botVar.toFixed(2));

  // 기둥이 위아래로 끊기지 않고 뚫고 나가는가
  const op=(x,y)=>data[(y*w+x)*ch+3];
  const opTop=Array.from({length:w},(_,x)=>op(x,0)>128).filter(Boolean).length;
  const opBot=Array.from({length:w},(_,x)=>op(x,h-1)>128).filter(Boolean).length;
  ok(opTop>0&&opBot>0,'기둥이 위·아래 가장자리까지 닿는다 (풀블리드)', `위 ${opTop}px / 아래 ${opBot}px`);
  ok(Math.abs(opTop-opBot)<=2,'위아래 단면 폭이 같다', `${opTop} vs ${opBot}`);

  // 좌우 대칭
  let asym=0;
  for(let y=0;y<h;y+=7) for(let x=0;x<w>>1;x++){
    const i=(y*w+x)*ch, j=(y*w+(w-1-x))*ch;
    asym+=Math.abs(data[i]-data[j])+Math.abs(data[i+1]-data[j+1])+Math.abs(data[i+2]-data[j+2]);
  }
  asym/=(h/7)*(w>>1)*3;
  warn(asym<8,'좌우 대칭', '평균 차이 '+asym.toFixed(2));
  return {w,h};
}

// ───────── 발판 ─────────
function checkTier(file){
  console.log('\n── 층 발판  '+file+' ──');
  const im=decodePNG(fs.readFileSync(file)), {w,h,ch,data}=im;
  console.log(`  ${w} × ${h} · 알파 ${im.hasAlpha?'있음':'없음'}`);
  const op=(x,y)=>data[(y*w+x)*ch+3]>128;

  // 각 열의 최상단 불투명 y
  const top=[]; for(let x=0;x<w;x++){ let t=-1; for(let y=0;y<h;y++) if(op(x,y)){t=y;break;} top.push(t); }

  // 바닥면(게임 오브젝트가 서는 면) 찾기.
  // 주의: '가로로 길게 이어지는 면' 만으로는 난간 가로대를 바닥면으로 오인한다.
  // 실제 발판에서 난간 가로대는 5px 두께로 끊기고 그 아래 빈틈이 있는 반면,
  // 석재 바닥은 두껍게 이어진다. 그래서 '폭의 60% 이상이 20px 넘게 연속으로
  // 차 있는 첫 번째 띠'의 윗면을 바닥면으로 본다.
  const wide=y=>{ let n=0; for(let x=0;x<w;x++) if(op(x,y)) n++; return n; };
  const contentW=Math.max(...Array.from({length:h},(_,y)=>wide(y)));
  const THICK=20, MINW=contentW*0.6;
  let surf=-1;
  for(let y=0;y<h-THICK;y++){
    if(wide(y)<MINW) continue;
    let k=0; while(k<THICK && wide(y+k)>=MINW) k++;
    if(k>=THICK){ surf=y; break; }
  }
  if(surf<0){ const hist={}; for(const t of top) if(t>=0) hist[t]=(hist[t]||0)+1;
    surf=+Object.keys(hist).reduce((a,b)=>hist[b]>hist[a]?b:a); }
  const share=wide(surf)/contentW;
  console.log(`  바닥면 y = ${surf}  (열의 ${(share*100).toFixed(0)}% 가 공유)`);
  ok(share>0.45,'바닥면이 수평으로 길게 이어진다', (share*100).toFixed(0)+'%');

  // 바닥면이 실제로 평평한가 — 그 y 에서 좌우로 끊김 없이 이어지는지
  let run=0, best=0; for(let x=0;x<w;x++){ if(op(x,surf)){run++; best=Math.max(best,run);} else run=0; }
  ok(best>w*0.6,'바닥면이 끊기지 않고 이어진다', `최장 ${best}px / 폭 ${w}`);

  // 왼쪽이 수직으로 잘려 기둥에 붙는가. 몇 px 투명 여백은 코드에서 흡수할 수 있으므로
  // '정확히 x=0' 이 아니라 '여백이 작고, 그 지점부터 세로로 길게 차 있는가' 를 본다.
  let lx=-1; for(let x=0;x<w&&lx<0;x++) for(let y=0;y<h;y++) if(op(x,y)){lx=x;break;}
  let leftOp=0; if(lx>=0) for(let y=0;y<h;y++) if(op(lx,y)) leftOp++;
  ok(lx>=0&&lx<=8,'왼쪽 여백이 작다 (코드 오프셋으로 흡수 가능)', '여백 '+lx+'px');
  ok(leftOp>20,'왼쪽 절단면이 세로로 차 있다 (평평한 절단)', leftOp+'px');

  // 바닥면 위로 솟은 구조물(난간)의 높이 — 너무 높으면 서 있는 오브젝트를 가린다
  const above=top.filter(t=>t>=0&&t<surf);
  const rail=above.length?surf-Math.min(...above):0;
  warn(rail<=28,'바닥면 위 구조물이 낮다 (오브젝트를 가리지 않음)', rail+'px');
  console.log(`  난간이 차지하는 열 ${above.length}/${w} (${(above.length/w*100).toFixed(0)}%)`);

  // 바닥면이 끝나는 x — 그 뒤는 처마가 내려간다. 항아리·궁사는 이 구간 안에 세워야 한다.
  let sx=-1,ex=-1; for(let x=0;x<w;x++) if(op(x,surf)){ if(sx<0)sx=x; ex=x; }
  console.log(`  설 수 있는 구간 x = ${sx} ~ ${ex} (${ex-sx}px)`);
  // 1x 축소 시 — 게임 내 발판 돌출은 64~86px
  console.log(`  → 1x 축소(돌출 75px): 바닥면 y ≈ ${(surf*75/w).toFixed(1)}px, 난간 ${(rail*75/w).toFixed(1)}px`);
  return {w,h,surf,rail,lx,sx,ex};
}

const [,,colFile,tierFile]=process.argv;
if(!colFile||!tierFile){ console.error('사용법: node tools/check-tower-art.mjs <기둥.png> <발판.png>'); process.exit(2); }
checkColumn(colFile);
const t=checkTier(tierFile);
console.log('\n'+'='.repeat(56));
console.log(`필수 ${fails}건 실패 · 권장 ${warns}건 경고 → ${fails?'재작업 필요':'통과'}`);
if(!fails) console.log(`\n코드에 쓸 값
  발판 윗면    y = ${t.surf} / ${t.h}  (높이의 ${(t.surf/t.h*100).toFixed(1)}%)
  왼쪽 여백    ${t.lx}px  → 기둥에 붙일 때 이만큼 당겨 그린다
  설 수 있는 x ${t.sx} ~ ${t.ex} (폭의 ${(t.sx/t.w*100).toFixed(0)}%~${(t.ex/t.w*100).toFixed(0)}%)`);
process.exit(fails?1:0);
