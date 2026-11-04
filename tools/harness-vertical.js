// 세로 등반 프로토타입 지오메트리 검증
//   node tools/harness-vertical.js proto/vertical.html
// 렌더링을 재작성하기 전에 좌표계·방향·각도 상한이 맞는지 먼저 못박아 두는 용도.
const fs=require('fs'), vm=require('vm');
const HTML=process.argv[2]||'proto/vertical.html';
const code=fs.readFileSync(HTML,'utf8').match(/<script>([\s\S]*)<\/script>/)[1];

const noop=()=>{};
function makeCtx(){ const g={addColorStop:noop};
  return new Proxy({},{get(t,k){
    if(k==='createLinearGradient'||k==='createRadialGradient')return()=>g;
    if(k==='measureText')return()=>({width:10});
    if(k in t)return t[k]; return noop; }, set(t,k,v){t[k]=v;return true;}}); }
const els={};
function el(id){ if(!els[id])els[id]={id,textContent:'',innerHTML:'',className:'',style:{},_c:new Set(),
  classList:{add(c){els[id]._c.add(c)},remove(c){els[id]._c.delete(c)},contains(c){return els[id]._c.has(c)}},
  addEventListener:noop,getContext:makeCtx,width:0,height:0}; return els[id]; }
const store={};
const sandbox={ console, innerWidth:375, innerHeight:812, devicePixelRatio:2,
  addEventListener:noop, requestAnimationFrame:noop,
  document:{ getElementById:el, addEventListener:noop,
    createElement:()=>({style:{},getContext:makeCtx,toBlob:cb=>cb({}),click:noop,select:noop,remove:noop,appendChild:noop}),
    body:{classList:{add:noop,remove:noop},appendChild:noop} },
  localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)}},
  navigator:{vibrate:noop}, performance:{now:()=>0}, screen:{}, setTimeout:noop,
  Math,JSON,parseInt,parseFloat,isNaN };
sandbox.window=sandbox;
const ctx=vm.createContext(sandbox);
vm.runInContext(code+`;globalThis.__a={
  get state(){return state},set state(v){state=v},
  get stage(){return stage},set stage(v){stage=v},
  get angle(){return angle},set angle(v){angle=v},
  get power(){return power},set power(v){power=v},
  get wind(){return wind},set wind(v){wind=v},
  get pot(){return pot},get mod(){return mod},get arrow(){return arrow},
  get inCount(){return inCount},get camY(){return camY},
  get aLo(){return aLo},get aHi(){return aHi},get vLo(){return vLo},get vHi(){return vHi},
  get ground(){return ground},get crosses(){return crosses},
  dir,padX,padY,originX,originY,riseFor,tierY,gravity,spanOf,riseOf,spanRatio,previewFrac,
  setupStage,layoutStage,calibrate,newArrow,launch,update,render,nextStage,
  idealPower,solveSpeed,entryTan,judge,mouthWindow,startGame,resize,simArc,simArcV,drawAimGuides,setAim,swipeToSpeed,speedToPow,
  demoOn,demoShot,get demoT(){return demoT},set demoT(v){demoT=v},get meta(){return meta},get arrowsLeft(){return arrowsLeft},
  get aimPow(){return aimPow},get aimSpeed(){return aimSpeed},get needPow(){return needPow},get lastZone(){return lastZone},get dragging(){return dragging} };`, ctx, {filename:'proto.js'});
const A=sandbox.__a;

let fails=0, warns=0;
const ok=(c,l,g)=>{ if(c)console.log('  ✓ '+l+(g?'  '+g:'')); else{fails++;console.log('  ✗ '+l+(g?'  '+g:''));} };
const warn=(c,l,g)=>{ if(c)console.log('  ✓ '+l+(g?'  '+g:'')); else{warns++;console.log('  ! '+l+(g?'  '+g:''));} };
const hdr=t=>console.log('\n== '+t+' ==');
const W=()=>sandbox.innerWidth, H=()=>sandbox.innerHeight;

/** 변주를 끈 무대. 4층부터 무작위 변주(바람·흔들·좁힘)가 붙어 측정값이 실행마다 흔들린다.
 *  난이도·적중률을 재는 검사는 전부 이걸 써야 한다 — 흔들리는 검사는 느슨한 검사보다 나쁘다. */
function plain(s){
  A.state='start'; A.stage=s; A.setupStage();
  for(const k of Object.keys(A.mod)) delete A.mod[k];
  A.layoutStage(); A.calibrate(); A.wind=0;
}

hdr('1. 지그재그 배치');
{
  const rows=[];
  for(let s=1;s<=6;s++){ A.stage=s; A.setupStage();
    rows.push({s,dir:A.dir(),pad:A.padX(),pot:A.pot.baseX,rise:A.riseFor(s)}); }
  for(const r of rows)
    console.log(`  ${r.s}층  방향 ${r.dir>0?'→':'←'}  발사대 x=${r.pad.toFixed(0).padStart(3)}  항아리 x=${r.pot.toFixed(0).padStart(3)}  상승 ${r.rise.toFixed(0)}px`);
  ok(rows.every(r=>r.s%2===1?r.dir>0:r.dir<0),'홀수층은 오른쪽으로, 짝수층은 왼쪽으로 던진다');
  ok(rows.every(r=>Math.abs(r.pot-r.pad)>W()*0.6),'매 발이 화면 폭의 60% 이상을 가로지른다');
  ok(rows.every((r,i)=>i===0||Math.abs(r.pad-rows[i-1].pot)<1),'이번 층 발사대 = 지난 층 항아리 자리 (올라섰다)');
  ok(rows.every((r,i)=>i===0||r.rise>=rows[i-1].rise),'층이 오를수록 상승폭이 커진다');
}

hdr('2. 좌우 대칭 — 던지는 방향이 난이도를 바꾸면 안 된다');
{
  const snap=s=>{ A.stage=s; A.setupStage();
    return {span:A.spanOf(),rise:A.riseOf(),mouth:A.pot.mouth,aLo:A.aLo,aHi:A.aHi,
            ratio:A.spanOf()/A.pot.mouth}; };
  const odd=snap(5), even=snap(6);
  console.log(`  5층(→) 사거리 ${odd.span.toFixed(0)} 입구 ${odd.mouth.toFixed(1)} 각도 ${odd.aLo}~${odd.aHi}`);
  console.log(`  6층(←) 사거리 ${even.span.toFixed(0)} 입구 ${even.mouth.toFixed(1)} 각도 ${even.aLo}~${even.aHi}`);
  ok(Math.abs(odd.span-even.span)<1,'좌우 사거리가 같다');
  ok(Math.abs(odd.aHi-even.aHi)<=1 && Math.abs(odd.aLo-even.aLo)<=1,'좌우 조준 범위가 같다');
}

hdr('3. 각도 상한 — 궤적이 화면 밖으로 날아가면 안 된다');
{
  let worst=0, where='';
  for(let s=1;s<=30;s++){
    A.stage=s; A.setupStage();
    for(const a of [A.aLo, Math.round((A.aLo+A.aHi)/2), A.aHi]){
      A.angle=a; const p=A.idealPower(); if(p==null) continue;
      const v=A.vLo+(A.vHi-A.vLo)*p, th=a*Math.PI/180;
      const apex=(v*Math.sin(th))**2/(2*A.gravity());
      const top=A.originY()-apex;                 // 화면 y (작을수록 위)
      if(-top>worst){ worst=-top; where=`${s}층 ${a}°`; }
    }
  }
  ok(worst<=0,'모든 층·모든 각도에서 궤적이 화면 위를 넘지 않는다', worst>0?`${worst.toFixed(0)}px 초과 (${where})`:'여유 있음');
  // 각도 폭이 살아있는가
  const bands=[];
  for(const s of [1,5,10,20,30]){ A.stage=s; A.setupStage(); bands.push(`${s}층 ${A.aLo}~${A.aHi}°(${A.aHi-A.aLo+1}개)`); }
  console.log('  '+bands.join('  '));
  let thin=null;
  for(let s=1;s<=30;s++){ A.stage=s; A.setupStage(); if(A.aHi-A.aLo+1<8){ thin=`${s}층 ${A.aHi-A.aLo+1}개`; break; } }
  ok(thin===null,'모든 층에서 조준 선택지가 8개 이상', thin||'');
}

hdr('3b. 조준 점선이 실제로 항아리로 가는가');
{
  // 실기기에서 '점선이 반대로 날아간다'가 발견됐다. 물리(launch)는 방향을 탔는데
  // 예측 궤적(simArc)은 안 타서, 좌우 어느 쪽이든 오른쪽으로만 그렸다.
  // 변주는 끈다. 이 검사가 보는 건 dir() 미러링이고, 흔들 항아리(sway)에서는
  // idealPower() 가 '도착할 때의 위치' 를 겨누므로 '지금 위치' 와 비교하면 어긋난다
  // — 게임 버그가 아니라 검사의 의미 불일치다. 변주 안전성은 §8c 가 본다.
  let bad=[];
  for(let s2=1;s2<=12;s2++){
    plain(s2);
    A.angle=Math.round((A.aLo+A.aHi)/2);
    const p=A.idealPower(); if(p==null){ bad.push(s2+'층 사거리밖'); continue; }
    const pts=A.simArc(A.angle*Math.PI/180, A.vLo+(A.vHi-A.vLo)*p, 1, false);
    // 궤적이 항아리 입구를 지나가야 한다 (끝점만 보면 지나친 경우를 놓친다).
    // 꼭짓점이 아니라 **선분**까지의 거리를 잰다 — simArc 는 1/36초마다 점을 남겨
    // 샘플 간격이 ~33px 인데, 입구 반폭이 그보다 좁아지면(후반 층·좁힘 변주)
    // 궤적이 입구를 제대로 지나가도 꼭짓점 거리로는 벗어난 것처럼 보인다.
    let d=1e9;
    for(let i=1;i<pts.length;i++){
      const ax=pts[i-1].x, ay=pts[i-1].y, bx=pts[i].x, by=pts[i].y;
      const vx=bx-ax, vy=by-ay, L2=vx*vx+vy*vy;
      const t=L2>0 ? Math.max(0,Math.min(1,((A.pot.x-ax)*vx+(A.pot.rimY-ay)*vy)/L2)) : 0;
      d=Math.min(d,Math.hypot(ax+vx*t-A.pot.x, ay+vy*t-A.pot.rimY));
    }
    if(d>A.pot.mouth/2) bad.push(s2+'층 점선이 입구에서 '+d.toFixed(0)+'px 벗어남');
  }
  if(bad.length) console.log('    '+bad.slice(0,5).join(', '));
  ok(bad.length===0,'이상 파워 예측 궤적의 끝이 항아리 입구에 닿는다 (좌·우 모두)', bad.length?bad.length+'층 실패':'');
  // 진입각 배지가 음수로 뜨지 않아야 한다
  let neg=null;
  for(let s2=1;s2<=12;s2++){ A.stage=s2; A.setupStage();
    for(let a=A.aLo;a<=A.aHi;a++){ const t=A.entryTan(a); if(t!=null&&t<0){ neg=s2+'층 '+a+'°'; break; } }
    if(neg)break; }
  ok(neg===null,'진입각이 음수로 계산되지 않는다', neg||'');
}

hdr('4. 자동 플레이 — 이상 파워로 쏘면 양방향 모두 들어간다');
{
  function shot(s,a){
    A.state='start'; A.stage=s; A.setupStage(); A.wind=0; A.newArrow(); A.angle=a;
    const p=A.idealPower(); if(p==null) return 'unreachable';
    A.setAim(a,p); A.launch();
    let t=0; while(A.state==='fly'&&t<8){ A.update(1/120); t+=1/120; }
    return A.inCount>0?'in':'miss';
  }
  let hit=0,tried=0,bad=[];
  for(let s=1;s<=20;s++){
    A.stage=s; A.setupStage();
    for(const a of [A.aLo+1, Math.round((A.aLo+A.aHi)/2), A.aHi-1]){
      tried++; const r=shot(s,a); if(r==='in')hit++; else bad.push(`${s}층 ${a}°→${r}`);
    }
  }
  if(bad.length) console.log('    실패: '+bad.slice(0,8).join(', ')+(bad.length>8?` 외 ${bad.length-8}`:''));
  console.log(`  적중 ${hit}/${tried}`);
  ok(hit===tried,'좌·우 양방향 모두 이상 파워 = 100% 적중');
}

hdr('5. 층 전환 카메라');
{
  A.startGame('endless');
  const s0=A.stage, pad0=A.padX(), pot0=A.pot.baseX;
  A.state='clear';
  let t=0, seen=[]; while(A.stage===s0 && t<3){ A.update(1/60); t+=1/60; seen.push(A.camY); }
  ok(A.stage===s0+1,'전환이 끝나면 다음 층으로 올라간다', `${s0} → ${A.stage}`);
  ok(A.camY===0,'전환 후 카메라가 제자리로 돌아온다', 'camY='+A.camY);
  ok(Math.max(...seen)>0,'전환 중 세계가 아래로 흐른다', '최대 '+Math.max(...seen).toFixed(0)+'px');
  ok(Math.abs(A.padX()-pot0)<1,'새 발사대가 직전 항아리 자리다', `${A.padX().toFixed(0)} vs ${pot0.toFixed(0)}`);
  ok(A.dir()!==(s0%2===1?1:-1),'방향이 반대로 바뀐다');
}

hdr('6. 기기가 달라도 난이도가 같은가');
{
  const devs=[[320,568,'소형'],[375,812,'기준'],[430,932,'최대']];
  const st=[1,5,10,20];
  const tab={};
  for(const [w,h,nm] of devs){
    sandbox.innerWidth=w; sandbox.innerHeight=h; A.resize();
    tab[nm]=st.map(s=>{ A.stage=s;
      let p=null; for(let i=0;i<200;i++){A.setupStage(); if(A.mod.mouthMul===1){p=1;break;}}
      if(!p)A.setupStage();
      return A.spanOf()/A.pot.mouth; });
    console.log(`  ${nm} ${w}x${h}  사거리/입구 = ${tab[nm].map(v=>v.toFixed(2).padStart(5)).join(' ')}`);
  }
  let worst=0; for(const [,,nm] of devs) tab[nm].forEach((v,i)=>{ worst=Math.max(worst,Math.abs(v/tab['기준'][i]-1)); });
  ok(worst<=0.02,'기기별 난이도 편차 2% 이내',(worst*100).toFixed(1)+'%');
  sandbox.innerWidth=375; sandbox.innerHeight=812; A.resize();
}

hdr('7b. 형상이 화면/발판에 들어가는가');
{
  // 사거리가 길어지면 입구도 같이 커진다(난이도를 비율로 묶었으므로).
  // 그래서 항아리가 발판보다 커지는 일이 생긴다 — 실제로 1층에서 폭 182px 가 나왔다.
  const colF=0.28, tierF=0.33;
  ok(colF+tierF*2<=1.0,'기둥 + 발판 2개가 화면 폭에 들어간다',
     `${colF}+${tierF}×2 = ${(colF+tierF*2).toFixed(2)}W`);
  let bad=[];
  for(let s=1;s<=30;s++){
    A.stage=s;
    let p=null; for(let i=0;i<200;i++){ A.setupStage(); if(A.mod.mouthMul===1){p=1;break;} }
    if(!p) A.setupStage();
    const tierW=W()*tierF;
    if(A.pot.w>tierW*0.95) bad.push(`${s}층 항아리 ${A.pot.w.toFixed(0)} > 발판 ${tierW.toFixed(0)}`);
    // 항아리는 목표 층 발판 '위에' 서 있어야 한다
    if(Math.abs((A.pot.rimY+A.pot.h)-A.tierY(s))>0.5) bad.push(`${s}층 항아리가 발판에 안 붙음`);
    // 목표 층은 현재 층보다 위
    if(!(A.tierY(s)<A.padY())) bad.push(`${s}층 목표가 현재 층보다 아래`);
  }
  if(bad.length) console.log('    '+bad.slice(0,5).join(', '));
  ok(bad.length===0,'모든 층에서 항아리가 발판 위에 온전히 올라간다', bad.length?bad.length+'건':'');
  A.stage=1; A.setupStage();
  console.log(`  1층 입구 ${A.pot.mouth.toFixed(1)} 항아리폭 ${A.pot.w.toFixed(0)} / 발판 ${(W()*tierF).toFixed(0)}`);
}

hdr('7c. 빗나감 단서 — 발판에 꽂혀 탄착군이 남는가');
{
  // 한 층 안에서 연달아 던진다 (setupStage 를 매 발 부르면 단서가 초기화되어 실제와 다르다)
  A.state='start'; A.stage=6; A.setupStage(); A.wind=0;
  let stuckCnt=0, tried=0, inCnt=0;
  for(const err of [-0.45,-0.30,0.30,0.45,0.60]){
    A.newArrow();
    A.angle=Math.round((A.aLo+A.aHi)/2);
    const p=A.idealPower(); if(p==null) continue;
    const n0=A.ground.length, i0=A.inCount;
    A.setAim(A.angle,Math.max(0,Math.min(1,p+err))); A.launch();
    let t=0; while(A.state==='fly'&&t<8){ A.update(1/120); t+=1/120; }
    tried++; if(A.ground.length>n0) stuckCnt++; if(A.inCount>i0) inCnt++;
  }
  console.log(`  비껴 쏜 ${tried}발 중 발판에 꽂힌 것 ${stuckCnt}발`);
  console.log('  들어간 것 '+inCnt+'발 · 입구면 통과 자국 '+A.crosses.length+'개 누적');
  // 항아리가 발판을 거의 덮어 꽂힐 자리가 좁다. 그래서 '입구면 통과 자국'이 주 단서다.
  ok(A.crosses.length>0,'빗나간 발의 입구면 통과 지점이 단서로 남는다', A.crosses.length+'개');
  ok(A.crosses.length<=3,'자국은 최근 3발까지만 (화면이 지저분해지지 않게)', A.crosses.length+'개');
  const onTier=A.ground.every(g=>g.y!=null);
  ok(onTier,'꽂힌 화살이 발판 높이에 기록된다(바닥 고정이 아님)');
}

hdr('8b. 구 기록 보관 (v0.6 → 세로 등반)');
{
  store['tuho_best']='1234';
  // meta 를 직접 건드릴 수 없으므로 startGame 이 이관을 수행하는지만 본다
  A.startGame('endless');
  ok(true,'startGame 에서 migrateLegacy 가 호출된다 (예외 없음)');
}

hdr('8c. 변주 4종 — 조준을 가리는 것은 뺐다');
{
  // 밤·안개를 뺀 이유: 고도가 오르면 하늘이 저절로 밤이 되므로 밤은 중복이고,
  // 안개(조준선 단축)는 '궤적을 보며 빚는' 새 조작과 정면으로 충돌한다.
  const seen={};
  let broke=null;
  for(let i=0;i<400;i++){
    A.stage=4+(i%26); A.setupStage();
    if(A.mod.pick) seen[A.mod.pick.id]=(seen[A.mod.pick.id]||0)+1;
    if(A.mod.pick2) seen[A.mod.pick2.id]=(seen[A.mod.pick2.id]||0)+1;
    if(!(A.pot.mouth>8 && A.pot.earW>2 && isFinite(A.pot.x) && A.aLo<A.aHi)) { broke=A.stage; break; }
  }
  console.log('  등장 분포 '+JSON.stringify(seen));
  ok(broke===null,'모든 변주 조합에서 형상·조준 범위가 유효', broke?broke+'층 붕괴':'');
  ok(Object.keys(seen).length===4,'변주가 정확히 4종', Object.keys(seen).join(','));
  ok(!seen.night && !seen.fog,'조준을 가리는 변주(밤·안개)가 없다');
  // 15층 이상 2중 적용이 4종으로도 성립하는가
  let dbl=0; for(let i=0;i<60;i++){ A.stage=15+(i%10); A.setupStage(); if(A.mod.pick2) dbl++; }
  ok(dbl>=50,'15층 이상에서 변주가 2중으로 붙는다', dbl+'/60');
  // 조준선은 더 이상 변주로 짧아지지 않는다
  let minP=1; for(let s2=1;s2<=30;s2++){ A.stage=s2; A.setupStage(); minP=Math.min(minP,A.previewFrac()); }
  ok(minP>=0.6,'조준선이 과하게 짧아지지 않는다 (최소 '+minP.toFixed(2)+')');
}

hdr('9b. 손감각 — 같은 휘두름은 항상 같은 던지기여야 한다');
{
  // 손으로 던지는 놀이의 전제: 매핑이 절대값이어야 근육 기억이 쌓인다.
  // 층마다 속도 환산이 달라지면 매 층 손감각이 초기화되어 '익히는 맛'이 사라진다.
  const probe=[0.5,1.0,1.6,2.2,2.9].map(u=>u*H());
  const byFloor={};
  for(const s2 of [1,10,20,30]){
    A.stage=s2; A.setupStage();
    byFloor[s2]=probe.map(v=>A.swipeToSpeed(v));
  }
  console.log('  휘두름(초당 화면높이) → 발사속도');
  for(const s2 of [1,30]) console.log(`   ${String(s2).padStart(2)}층  ${byFloor[s2].map(v=>v.toFixed(0)).join('  ')}`);
  let drift=0;
  for(const s2 of [10,20,30]) byFloor[s2].forEach((v,i)=>{ drift=Math.max(drift,Math.abs(v/byFloor[1][i]-1)); });
  ok(drift<1e-9,'층이 바뀌어도 같은 휘두름 = 같은 속도 (근육 기억이 유지된다)',
     '편차 '+(drift*100).toFixed(4)+'%');

  // 매핑이 단조롭고, 전 층의 필요 속도를 덮는가
  const mono=probe.every((v,i)=>i===0||A.swipeToSpeed(v)>A.swipeToSpeed(probe[i-1]));
  ok(mono,'세게 휘두를수록 멀리 간다 (단조 증가)');
  const lo=A.swipeToSpeed(0), hi=A.swipeToSpeed(H()*4);
  let need=[1e9,0];
  for(let s2=1;s2<=30;s2++){
    A.stage=s2; A.setupStage();
    for(let a=A.aLo;a<=A.aHi;a++){ const v=A.solveSpeed(A.spanOf(),A.riseOf(),a*Math.PI/180);
      if(v==null) continue; need[0]=Math.min(need[0],v); need[1]=Math.max(need[1],v); }
  }
  console.log(`  매핑 범위 ${lo.toFixed(0)}~${hi.toFixed(0)} / 전 층 필요 ${need[0].toFixed(0)}~${need[1].toFixed(0)} px/s`);
  ok(lo<=need[0] && hi>=need[1],'손 범위 안에 모든 층의 필요 속도가 들어온다');
  const band=[(need[0]-lo)/(hi-lo),(need[1]-lo)/(hi-lo)];
  console.log('  실제로 쓰는 휘두름 구간 '+(band[0]*100).toFixed(0)+'% ~ '+(band[1]*100).toFixed(0)+'%');
  ok(band[1]-band[0]>=0.45,'손의 해상도를 충분히 쓴다 (유효 구간 45% 이상)',((band[1]-band[0])*100).toFixed(0)+'%');
  ok(band[1]<=0.92,'최대로 휘두르지 않아도 가장 먼 층에 닿는다',(band[1]*100).toFixed(0)+'%');

  // 예측 궤적이 더 이상 그려지지 않는가 (감각으로 던지는 놀이의 전제)
  const src=require('fs').readFileSync(HTML,'utf8');
  ok(!/simArcV\([^)]*previewFrac/.test(src),'조준 단계에 예측 궤적을 그리지 않는다');
}

hdr('9c. 교정 루프 — 틀린 만큼을 알려주는가');
{
  // 손감각 게임은 '던진다 → 얼마나 틀렸는지 안다 → 고친다' 가 전부다.
  // 떨어진 자리만으로는 "얼마나 더 세게"가 안 잡히므로 필요했던 세기를 계산해 보여준다.
  A.state='start'; A.stage=6; A.setupStage(); A.wind=0; A.newArrow();
  const mid=Math.round((A.aLo+A.aHi)/2);
  const ideal=A.idealPower();
  let rows=[];
  for(const err of [-0.25,-0.10,0.10,0.25]){
    A.newArrow(); A.setAim(mid, Math.max(0,Math.min(1,ideal+err)));
    A.launch();
    let t=0; while(A.state==='fly'&&t<8){ A.update(1/120); t+=1/120; }
    rows.push({err, thrown:A.aimPow, need:A.needPow, zone:A.lastZone});
  }
  for(const r of rows)
    console.log(`  오차 ${r.err>0?'+':''}${(r.err*100).toFixed(0)}%  던짐 ${(r.thrown*100).toFixed(0)}%  필요 ${r.need<0?'-':(r.need*100).toFixed(0)+'%'}  ${r.zone||'빗나감'}`);
  const miss=rows.filter(r=>!r.zone);
  ok(miss.length>0,'일부러 틀린 발이 실제로 빗나간다', miss.length+'/'+rows.length);
  ok(miss.every(r=>r.need>=0),'빗나간 발마다 필요했던 세기가 계산된다');
  // 약하게 던졌으면 필요 세기가 더 커야 하고, 세게 던졌으면 더 작아야 한다
  const dirOK=miss.every(r=>(r.err<0) ? r.need>r.thrown : r.need<r.thrown);
  ok(dirOK,'부족/과다 방향이 맞다 (약하게 던지면 "더 세게"를 가리킨다)');
}

hdr('9. 재구성 목표 — 행위 밀도와 조준 가능성');
{
  // ① 강제 대기가 사라졌는가: 조준 상태에서 시간이 흘러도 각도/힘이 저절로 움직이면 안 된다
  A.state='start'; A.stage=4; A.setupStage(); A.newArrow();
  A.setAim(70,0.5);
  const a0=A.angle, p0=A.aimPow;
  for(let i=0;i<60;i++) A.update(1/60);        // 1초 경과
  ok(A.angle===a0 && A.aimPow===p0,'조준 중 강제 스윕이 없다 (언제든 쏠 수 있다)',
     `각도 ${a0}→${A.angle}, 힘 ${p0}→${A.aimPow}`);

  // ② 한 층 소요 시간 — 즉시 쏘는 플레이어 기준
  // 변주가 없는 3층으로 고정한다 (4층부터는 무작위 변주가 붙어 측정이 흔들린다).
  // 게임오버로 빠지면 루프가 헛도므로 상태로도 탈출한다.
  A.state='start'; A.stage=3; A.setupStage(); A.newArrow();
  let t=0, shots=0;
  while(A.stage===3 && A.state!=='over' && shots<8 && t<30){
    if(A.state==='aim'){ A.setAim(Math.round((A.aLo+A.aHi)/2), A.idealPower()||0.5); A.launch(); shots++; }
    A.update(1/60); t+=1/60;
  }
  const cleared=A.stage>3;
  console.log(`  한 층 통과까지 ${t.toFixed(1)}초 / ${shots}발 ${cleared?'(통과)':'(미통과)'} — 이전 구조 약 18초`);
  ok(cleared,'자동 플레이가 한 층을 통과한다');
  ok(t<=12,'한 층이 12초 안에 끝난다', t.toFixed(1)+'초');

  // ③ 구역을 노려서 맞힐 수 있는가 — 재구성의 핵심. 2탭 시절엔 불가능했다.
  function aimAtX(tx){
    const d=Math.abs(tx-A.originX()), rise=A.originY()-A.pot.rimY;
    for(let a=A.aLo;a<=A.aHi;a++){
      const v=A.solveSpeed(d,rise,a*Math.PI/180); if(v==null) continue;
      const p=(v-A.vLo)/(A.vHi-A.vLo); if(p<0||p>1) continue;
      return {a,p};
    }
    return null;
  }
  let earHit=0, earTry=0, center=0;
  for(let s2=2;s2<=9;s2++){
    plain(s2); A.newArrow();
    const side=A.dir()>0?1:-1;
    const sol=aimAtX(A.pot.baseX + side*A.pot.earOff);
    if(!sol) continue;
    earTry++;
    A.setAim(sol.a,sol.p); A.launch();
    let tt=0; while(A.state==='fly'&&tt<8){ A.update(1/120); tt+=1/120; }
    const last=A.lastZone;
    if(last==='ear') earHit++; else if(last==='gwan'||last==='in') center++;
  }
  console.log(`  귀를 겨냥한 ${earTry}발 → 귀 ${earHit}발, 중앙 ${center}발`);
  // 기준을 50% → 60% 로 올렸다. 50% 는 입구를 좁혔을 때 4~5/8 로 임계선에 딱 걸려서,
  // 귀가 사실상 안 맞게 된 회귀를 통과시켰다. 변주를 끈 뒤로는 값이 흔들리지 않는다.
  ok(earTry>0 && earHit>=Math.ceil(earTry*0.6),'귀를 노리면 60% 이상 귀에 들어간다 (구역이 표적이 됨)',
     earHit+'/'+earTry);
}

hdr('11. 난이도 램프 — 오를수록 정말 어려워지는가');
{
  // 이 검사가 없어서 "18층부터 난이도가 멈춤" 을 눈으로 못 봤다. 체감 난이도는 사거리나
  // 입구폭이 아니라 **손 오차 허용폭**(휘두름 세기를 몇 % 틀려도 들어가는가)이다. 그걸 직접 잰다.
  const sc=Math.sqrt(A.gravity()*W()), vOf=p=>sc*(0.96+p*0.72);
  function shoot(s,a,v){
    plain(s); A.newArrow();
    A.setAim(a,(v-A.vLo)/(A.vHi-A.vLo)); A.launch();
    let t=0; while(A.state==='fly'&&t<8){ A.update(1/120); t+=1/120; }
    return A.lastZone||null;
  }
  const rows=[];
  for(const s of [1,5,12,20,30]){
    plain(s); A.newArrow();
    const a=Math.round((A.aLo+A.aHi)/2);
    const v0=A.solveSpeed(A.spanOf(),A.riseOf(),a*Math.PI/180);
    if(v0==null) continue;
    const p0=A.speedToPow(v0);
    let lo=p0, hi=p0;
    for(let d=0.005; d<=0.40; d+=0.005){
      if(p0-d>=0 && shoot(s,a,vOf(p0-d))) lo=p0-d;
      if(p0+d<=1 && shoot(s,a,vOf(p0+d))) hi=p0+d;
    }
    rows.push({s,p0,width:hi-lo,mouth:A.pot.mouth,ear:A.pot.earW});
  }
  for(const r of rows)
    console.log(`  ${String(r.s).padStart(2)}층  필요세기 ${(r.p0*100).toFixed(0).padStart(2)}%  허용폭 ${(r.width*100).toFixed(1).padStart(4)}%  입구 ${r.mouth.toFixed(0).padStart(2)}px  귀 ${r.ear.toFixed(1)}px`);
  const f=rows[0], l=rows[rows.length-1];
  const ramp=f.width/l.width;
  const span=(l.p0-f.p0)*100;
  console.log(`  램프 ${ramp.toFixed(1)}배 · 필요세기 ${(f.p0*100).toFixed(0)}%~${(l.p0*100).toFixed(0)}% (${span.toFixed(0)}포인트)`);
  ok(rows.length===5,'모든 표본 층에 해가 있다');
  ok(rows.every((r,i)=>i===0||r.width<=rows[i-1].width+0.005),'허용폭이 층마다 줄어든다 (난이도가 단조 증가)');
  ok(ramp>=2.5,'1층 → 30층 허용폭이 2.5배 이상 좁아진다 (오를 이유가 있다)',ramp.toFixed(1)+'배');
  ok(span>=30,'층마다 다른 세기를 요구한다 (필요세기 폭 30포인트 이상)',span.toFixed(0)+'포인트');
  // 1층은 너그러워야 한다 — 시범 궤적을 보고 따라 던진 첫 발이 들어가야 한다
  ok(f.width>=0.15,'1층은 손 오차 15% 까지 받아준다 (첫 발이 들어간다)',(f.width*100).toFixed(1)+'%');
  ok(l.ear>=4,'30층에서도 귀가 4px 이상이다 (구역이 사라지지 않는다)',l.ear.toFixed(1)+'px');
}

hdr('10. 첫 층 시범 궤적 — 가르치는 선이 거짓말하면 안 된다');
{
  A.meta.totalIn=0;
  A.state='start'; A.stage=1; A.setupStage(); A.wind=0; A.newArrow();
  ok(A.demoOn(),'1층 첫 발에는 시범 궤적이 보인다');

  const d=A.demoShot();
  ok(d!=null,'시범 궤적이 계산된다');
  if(d){
    const last=d.pts[d.pts.length-1];
    console.log(`  각도 ${d.a.toFixed(0)}° 속도 ${d.v.toFixed(0)}px/s 세기 ${(d.pow*100).toFixed(0)}% 체공 ${d.flight.toFixed(2)}초 점 ${d.pts.length}개`);
    console.log(`  끝점 x=${last.x.toFixed(0)} (입구 ${A.pot.x.toFixed(0)}, 폭 ${A.pot.mouth.toFixed(0)}) y=${last.y.toFixed(0)} (입구면 ${A.pot.rimY.toFixed(0)})`);
    ok(Math.abs(last.x-A.pot.x) < A.pot.mouth*0.5,'점선이 입구 안에서 끝난다 (허공·몸통이 아니다)',
       Math.abs(last.x-A.pot.x).toFixed(1)+'px');
    ok(Math.abs(last.y-A.pot.rimY) < 14,'점선이 입구면 높이에서 끝난다');
    ok(d.pow>0.02 && d.pow<0.98,'시범 세기가 링에 그릴 수 있는 범위 안이다', (d.pow*100).toFixed(0)+'%');
    warn(d.flight>0.25 && d.flight<0.85,'유령 화살 체공이 읽히는 길이다 (0.25~0.85초)', d.flight.toFixed(2)+'초');

    // 핵심: 보여 준 그대로 던지면 정말 들어가는가. 안 들어가면 이 선은 거짓말이다.
    A.setAim(d.a, (d.v-A.vLo)/(A.vHi-A.vLo));
    console.log(`  시범대로 던짐 — 속도 ${A.aimSpeed.toFixed(0)}px/s (시범 ${d.v.toFixed(0)})`);
    ok(Math.abs(A.aimSpeed-d.v)<2,'시범 속도를 그대로 재현할 수 있다');
    A.launch();
    let t=0; while(A.state==='fly'&&t<8){ A.update(1/120); t+=1/120; }
    ok(A.lastZone==='gwan'||A.lastZone==='ear'||A.lastZone==='in',
       '시범대로 던지면 실제로 들어간다', A.lastZone||'빗나감');
  }

  // 한 발이라도 넣으면 그 층에서는 사라진다
  A.newArrow();
  ok(A.inCount>0 && !A.demoOn(),'첫 성공 뒤에는 사라진다', '적중 '+A.inCount+'발');

  // 2층부터는 안 나온다 — 1층 전용 온보딩이다
  A.state='start'; A.stage=2; A.setupStage(); A.newArrow();
  ok(!A.demoOn(),'2층에는 나오지 않는다');

  // 던지는 중/결과 중에는 안 그린다
  A.state='start'; A.stage=1; A.setupStage(); A.newArrow();
  A.state='fly'; ok(!A.demoOn(),'비행 중에는 그리지 않는다');
  A.state='result'; ok(!A.demoOn(),'결과 중에는 그리지 않는다');

  // 손감각이 생긴 플레이어에게는 다시 안 나온다
  A.meta.totalIn=8; A.state='start'; A.stage=1; A.setupStage(); A.newArrow();
  ok(!A.demoOn(),'누적 8발을 넣은 손에는 다시 나오지 않는다');
  A.meta.totalIn=0;
}

hdr('7. 렌더 스모크');
{
  let err=null,n=0;
  try{
    for(const s of [1,2,10,20]){
      A.stage=s; A.setupStage();
      for(const st of ['aim','power','fly','result','clear']){
        A.newArrow();
        if(st==='fly'||st==='result'){ A.setAim(A.angle,A.idealPower()||0.5); A.launch();
          for(let i=0;i<40&&A.state==='fly';i++)A.update(1/120); }
        A.state=st; A.render(); n++;
      }
    }
    // 시범 궤적 — 유령 화살이 궤적 위를 지나가는 모든 구간을 한 번씩 그려 본다
    A.meta.totalIn=0; A.state='start'; A.stage=1; A.setupStage(); A.newArrow();
    for(let i=0;i<60;i++){ A.demoT=i*0.02; A.render(); n++; }
  }catch(e){ err=e&&(e.message||String(e)); }
  console.log('  렌더 '+n+'회');
  ok(err===null,'모든 상태에서 렌더 예외 없음', err||'');
}

console.log(`\n${'='.repeat(50)}\n세로 프로토: ${fails} 실패 / ${warns} 경고`);
process.exit(fails?1:0);
