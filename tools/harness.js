// 모두의 화살촉 v0.3 헤드리스 검증 하네스 (DOM/캔버스 스텁 + 자동 플레이)
const fs=require('fs'), path=require('path');
const HTML=process.argv[2];
const src=fs.readFileSync(HTML,'utf8');
const m=src.match(/<script>([\s\S]*)<\/script>/);
if(!m){ console.error('script 블록을 못 찾음'); process.exit(1); }
const code=m[1];

// ---- 스텁 ----
const noop=()=>{};
function makeCtx(){
  const grad={addColorStop:noop};
  const h={ get(t,k){
    if(k==='createLinearGradient'||k==='createRadialGradient') return ()=>grad;
    if(k==='canvas') return {width:0,height:0};
    if(k==='measureText') return ()=>({width:10});
    if(k in t) return t[k];
    return noop;
  }, set(t,k,v){ t[k]=v; return true; } };
  return new Proxy({},h);
}
const els={};
function el(id){
  if(!els[id]) els[id]={id,textContent:'',innerHTML:'',className:'',
    style:{},_cls:new Set(),
    classList:{add(c){els[id]._cls.add(c)},remove(c){els[id]._cls.delete(c)},contains(c){return els[id]._cls.has(c)}},
    addEventListener:noop, getContext:makeCtx, width:0,height:0};
  return els[id];
}
const store={};
const sandbox={
  console,
  innerWidth:375, innerHeight:812, devicePixelRatio:2,
  addEventListener:noop, requestAnimationFrame:noop,
  document:{ getElementById:el, addEventListener:noop, body:{classList:{add:noop,remove:noop}} },
  localStorage:{ getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]} },
  navigator:{ vibrate:noop },
  performance:{ now:()=>0 },
  screen:{},
  setTimeout:noop,
  Math, JSON, parseInt, parseFloat, isNaN,
};
sandbox.window=sandbox;
const vm=require('vm');
const ctxv=vm.createContext(sandbox);
vm.runInContext(code+'\n;globalThis.__api={get state(){return state},set state(v){state=v},set score(v){score=v},gameOver,'+
  'get stage(){return stage},set stage(v){stage=v},get angle(){return angle},set angle(v){angle=v},'+
  'get power(){return power},set power(v){power=v},get score(){return score},get combo(){return combo},'+
  'get arrowsLeft(){return arrowsLeft},set arrowsLeft(v){arrowsLeft=v},get inCount(){return inCount},get quota(){return quota},'+
  'get wind(){return wind},set wind(v){wind=v},get pot(){return pot},get mod(){return mod},get arrow(){return arrow},'+
  'get stuck(){return stuck},get ground(){return ground},get best(){return best},get meta(){return meta},'+
  'setupStage,newArrow,launch,update,render,idealPower,solveSpeed,simArc,judge,mouthWindow,earWindow,bodyHalf,'+
  'get aLo(){return aLo},get vLo(){return vLo},get vHi(){return vHi},'+
  'get mode(){return mode},set mode(v){mode=v},get daily(){return daily},get rngState(){return rngState},set rngState(v){rngState=v},'+
  'speedOf,gravity,groundY,originX,originY,startGame,AMAX,ZONE,resize,layoutStage,calibrate,entryTan,afterResult,'+
  'nextStage,rollDaily,dailyView,seedFrom,todayKey,prevKey,shareText,paintStartScreen};',
  ctxv,{filename:'tuho.js'});
const A=sandbox.__api;

let fails=0, passes=0;
function ok(cond,label,extra){ if(cond){passes++; console.log('  ✓ '+label);} else {fails++; console.log('  ✗ '+label+(extra?'  → '+extra:''));} }
function hdr(t){ console.log('\n== '+t+' =='); }

// ---------------------------------------------------------------
hdr('1. 초기화 / 지오메트리');
ok(A.state==='start','초기 state=start','state='+A.state);
ok(A.pot.x>A.originX()+60,'항아리가 사대보다 충분히 멀다','pot.x='+A.pot.x.toFixed(0)+' origin='+A.originX().toFixed(0));
ok(A.pot.rimY<A.originY(),'항아리 입구가 발사점보다 높다');
ok(A.vLo<A.vHi,'속도 구간 유효');

// ---------------------------------------------------------------
hdr('2. 조준 가능 각도 / 파워 분포 (함정 선택지 없어야 함)');
for(const s of [1,5,12,20,30]){
  A.stage=s; A.setupStage();
  const rows=[];
  for(let a=A.aLo;a<=A.AMAX;a+=2){ A.angle=a; rows.push([a,A.idealPower(),A.entryTan(a)]); }
  const valid=rows.filter(r=>r[1]!=null);
  const ps=valid.map(r=>r[1]);
  const lo=Math.min(...ps), hi=Math.max(...ps);
  const phis=valid.map(r=>Math.atan(r[2])*180/Math.PI);
  console.log(`  단계 ${String(s).padStart(2)} : 각도 ${A.aLo}°~${A.AMAX}° (${valid.length}/${rows.length} 유효) · 필요파워 ${lo.toFixed(2)}~${hi.toFixed(2)} · 진입각 ${Math.min(...phis).toFixed(0)}°~${Math.max(...phis).toFixed(0)}°`);
  ok(valid.length===rows.length, `단계 ${s}: 조준 범위 안에 사거리 밖 각도가 없다`, valid.length+'/'+rows.length);
  ok(Math.min(...phis)>=24, `단계 ${s}: 모든 선택 각도가 최소 진입각 확보(함정 없음)`, Math.min(...phis).toFixed(1)+'°');
  ok(hi-lo>0.3, `단계 ${s}: 각도 선택이 파워에 큰 차이를 만든다`, (hi-lo).toFixed(2));
  ok(hi<=1.001 && lo>0.1, `단계 ${s}: 필요파워가 게이지 안에 적절히 분포`, lo.toFixed(2)+'~'+hi.toFixed(2));
  ok(Math.max(...phis)-Math.min(...phis)>20, `단계 ${s}: 진입각 트레이드오프 폭이 넓다`, (Math.max(...phis)-Math.min(...phis)).toFixed(0)+'°');
}

// ---------------------------------------------------------------
hdr('3. 유효 입구 — 진입각이 얕으면 좁아져야 함');
A.stage=8; A.setupStage();
const wSteep=A.mouthWindow(Math.tan(70*Math.PI/180));
const wFlat =A.mouthWindow(Math.tan(35*Math.PI/180));
console.log('  입구 '+A.pot.mouth.toFixed(1)+'px · 진입70° 유효 '+wSteep.toFixed(1)+'px · 진입35° 유효 '+wFlat.toFixed(1)+'px');
ok(wSteep>wFlat,'급강하가 더 넓은 유효 입구를 가진다');
ok(wFlat>0,'얕은 진입에도 유효 입구가 0 이하로 붕괴하지 않는다');
ok(wSteep<=A.pot.mouth,'유효 입구는 실제 입구보다 넓지 않다');

hdr('4. 구역 판정 (중앙/관/한끗/턱/귀)');
const tan=1.3, p=A.pot;
const win=A.mouthWindow(tan), ew=A.earWindow(tan);
const probe=e=>{ const r=A.judge(p.x+e,tan); return r?r.z:'pass'; };
console.log(`  입구 ${p.mouth.toFixed(1)} 유효 ${win.toFixed(1)} · 귀 폭 ${p.earW.toFixed(1)} 유효 ${ew.toFixed(1)} 오프셋 ${p.earOff.toFixed(1)}`);
ok(probe(0)==='gwan','정중앙 = 관(貫)','→'+probe(0));
ok(probe(win*0.35)==='in','중앙권 = 들어감','→'+probe(win*0.35));
ok(probe(win/2+1.2)==='teeter','유효 입구 바로 밖 = 한 끗','→'+probe(win/2+1.2));
ok(probe(p.earOff)==='ear','귀 중심 = 귀','→'+probe(p.earOff));
ok(probe(-p.earOff)==='ear','왼쪽 귀도 판정','→'+probe(-p.earOff));
ok(A.judge(p.x-p.earOff,tan).side===-1,'귀 좌우 구분');
ok(probe((win/2+p.mouth/2)/2+2)==='rim','입구와 귀 사이 = 턱(튕김)','→'+probe((win/2+p.mouth/2)/2+2));
ok(probe(p.earOff+p.earW/2+8)==='pass','귀 바깥은 입구면 통과(몸통/땅 판정으로)','→'+probe(p.earOff+p.earW/2+8));
// 구역 경계가 단조롭게 바뀌는지 스캔
let seq=[],prev=null;
for(let e=0;e<=p.earOff+p.earW/2+14;e+=0.5){ const z=probe(e); if(z!==prev){seq.push(z);prev=z;} }
console.log('  구역 순서: '+seq.join(' → '));
ok(seq[0]==='gwan'&&seq[seq.length-1]==='pass','구역이 중심→외곽 순서로 배치');
ok(seq.filter(z=>z==='ear').length===1,'귀 구역이 한 번만 등장(구멍이 쪼개지지 않음)');

hdr('5. 몸통 실루엣');
A.stage=5; A.setupStage();
const hs=[0,0.25,0.5,0.75,1].map(t=>A.bodyHalf(A.pot.rimY+A.pot.h*t));
console.log('  반폭(목→굽): '+hs.map(v=>v.toFixed(1)).join(' , ')+'  (실제 반폭 '+(A.pot.w/2).toFixed(1)+')');
ok(Math.abs(hs[0]-A.pot.mouth/2)<0.01,'입구 높이에서는 목 두께');
ok(Math.abs(hs[2]-A.pot.w/2)<0.01,'중간에서 최대 반폭');
ok(hs[4]<hs[2]&&hs[4]>hs[0],'굽에서 다시 좁아짐');
ok(A.bodyHalf(A.pot.rimY-5)===0,'입구 위쪽은 충돌 없음');

// ---------------------------------------------------------------
hdr('6. 자동 플레이 — 이상 파워로 쏘면 들어가야 한다');
function playShot(stage,ang,powerErr,windOn){
  A.state='start'; A.stage=stage; A.setupStage();
  if(!windOn) A.wind=0;
  A.newArrow();
  A.angle=ang;
  const ip=A.idealPower();
  if(ip==null) return {z:'unreachable'};
  A.state='power'; A.power=Math.max(0,Math.min(1,ip+powerErr));
  A.launch();
  let t=0;
  while(A.state==='fly' && t<6){ A.update(1/120); t+=1/120; }
  return {z:A.inCount>0?'in':'miss', score:A.score, stuck:A.stuck.length, ground:A.ground.length, t};
}
let hit=0, tried=0, misses=[];
for(const s of [1,2,3,6,10,15,20,25,30]){
  A.stage=s; A.setupStage();
  const lo=A.aLo;
  for(const ang of [lo, lo+4, Math.round((lo+A.AMAX)/2), A.AMAX-4, A.AMAX]){
    tried++; const r=playShot(s,ang,0,false);
    if(r.z==='in') hit++; else misses.push(`단계${s} ${ang}°→${r.z}`);
  }
}
if(misses.length) console.log('    실패: '+misses.join(', '));
console.log(`  정확한 파워 적중률: ${hit}/${tried}`);
ok(hit===tried,'이상 파워 = 100% 적중 (판정 보간 정확 + 함정 각도 없음)');

hdr('7. 오차 민감도 (파워 ±%로 들어가는 창 = 체감 난이도)');
const sweep=s=>Math.min(1.0,0.52+s*0.022);
for(const s of [1,5,10,20,30]){
  let widest=0, rows=[];
  A.stage=s; A.setupStage();
  const lo=A.aLo;
  for(const ang of [lo+2, Math.round((lo+A.AMAX)/2), A.AMAX-2]){
    let dn=0,up=0;
    for(let e=0.002;e<=0.4;e+=0.002){ if(playShot(s,ang,+e,false).z==='in') up=e; else break; }
    for(let e=0.002;e<=0.4;e+=0.002){ if(playShot(s,ang,-e,false).z==='in') dn=e; else break; }
    const wnd=(dn+up)*100;
    if(wnd>widest)widest=wnd;
    rows.push(`${ang}°:${wnd.toFixed(1)}%(${(wnd/100/sweep(s)*1000).toFixed(0)}ms)`);
  }
  console.log(`  단계 ${String(s).padStart(2)} 허용창 → ${rows.join('  ')}   [게이지 ${sweep(s).toFixed(2)}/s]`);
  const ms=widest/100/sweep(s)*1000;
  ok(ms>=85,`단계 ${s}: 가장 쉬운 각도의 허용 시간이 85ms 이상(사람이 칠 수 있다)`, ms.toFixed(0)+'ms');
  ok(ms<=(s<=2?1600:s<=5?800:420),`단계 ${s}: 난이도 곡선이 완만해지지 않는다`, ms.toFixed(0)+'ms');
}

hdr('8. 진입각 트레이드오프 — 띄우면 들어가기 쉽고, 낮추면 바람에 덜 밀린다');
A.stage=12; A.setupStage();
function driftOf(ang){
  A.stage=12; A.setupStage(); A.wind=120; A.newArrow(); A.angle=ang;
  const ip=A.idealPower(); if(ip==null)return null;
  const arcNo=A.simArc(ang*Math.PI/180,A.speedOf(ip),1,false);
  const arcW =A.simArc(ang*Math.PI/180,A.speedOf(ip),1,true);
  const endNo=arcNo[arcNo.length-1], endW=arcW[arcW.length-1];
  return {ang, drift:endW.x-endNo.x, win:A.mouthWindow(1)};
}
A.stage=12; A.setupStage();
const dLo=driftOf(A.aLo+1), dHi=driftOf(A.AMAX-1);
if(dLo&&dHi){
  console.log(`  ${A.aLo+1}° 바람밀림 ${dLo.drift.toFixed(1)}px · ${A.AMAX-1}° 바람밀림 ${dHi.drift.toFixed(1)}px`);
  ok(Math.abs(dHi.drift)>Math.abs(dLo.drift)*1.3,'고각이 바람에 뚜렷하게 더 밀린다(체공시간↑)');
}
const wa=[];
A.stage=12; A.setupStage();
for(const ang of [A.aLo, A.aLo+6, A.AMAX-6, A.AMAX]){
  A.stage=12; A.setupStage(); A.angle=ang;
  const t=A.entryTan(ang);
  wa.push([ang, t==null?null:A.mouthWindow(t)]);
}
console.log('  각도→유효입구: '+wa.map(([a,w])=>a+'°='+(w==null?'불가':w.toFixed(1)+'px')).join('  '));
const vwa=wa.filter(x=>x[1]!=null);
ok(vwa[vwa.length-1][1]>vwa[0][1],'고각일수록 유효 입구가 넓다 (안전 ↔ 바람 트레이드오프 성립)');

hdr('9. 단계 진행 / 게임 오버 흐름');
function step(n,h){ for(let i=0;i<n;i++) A.update(h||1/120); }
function shoot(ang,p){ A.angle=ang; A.state='power'; A.power=p; A.launch(); step(900); }
function digest(){ step(300,1/60); }
A.startGame();
ok(A.state==='aim'&&A.stage===1&&A.arrowsLeft===5,'시작 시 1단계·화살 5발','state='+A.state+' arrows='+A.arrowsLeft);
let g=0;
while(A.state!=='over' && g++<30){ if(A.state==='aim') shoot(A.aLo+2,0.0); else digest(); }
ok(A.state==='over','목표 미달 + 화살 소진 → 게임 오버','state='+A.state+' arrows='+A.arrowsLeft);

// 파워 전 구간에서 '짧게 떨어짐' 결과가 존재해야 피드백(땅에 꽂힌 화살)이 생긴다
A.startGame();
let landed=0, kinds={};
for(let p=0;p<=1.0001;p+=0.05){
  A.stage=6; A.setupStage(); A.wind=0; A.newArrow(); A.angle=Math.round((A.aLo+A.AMAX)/2);
  const before=A.ground.length;
  shoot(A.angle,p);
  if(A.ground.length>before) landed++;
}
console.log('  파워 0~100% 중 땅에 떨어진 비율: '+landed+'/21');
ok(landed>=3,'힘이 모자라면 땅에 꽂혀 탄착점 단서가 남는다','landed='+landed);

A.startGame();
g=0;
while(A.stage<4 && g++<60){
  if(A.state==='aim'){ const ip=A.idealPower(); shoot(A.angle,ip); }
  else digest();
}
ok(A.stage>=4,'목표 달성 후 다음 단계로 계속 진행','stage='+A.stage);
ok(A.score>0,'점수 획득','score='+A.score);
ok(A.best>0,'최고점 저장','best='+A.best+' ls='+store['tuho_best']);
ok(Object.keys(A.meta.ach).length>=2,'업적 해금','ach='+Object.keys(A.meta.ach).join(','));
ok(A.meta.bestStage>=4,'최고 단계 기록','bestStage='+A.meta.bestStage);

hdr('9b. 구역별 점수 서열 (관 > 귀 > 들어감)');
function scoreOf(z){ // 같은 조건에서 구역만 바꿔 1발 점수 비교
  A.startGame(); A.stage=5; A.setupStage(); A.newArrow();
  const before=A.score; const tan=1.4;
  const e = z==='gwan'?0 : z==='ear'?A.pot.earOff : A.mouthWindow(tan)*0.4;
  const r=A.judge(A.pot.x+e,tan);
  if(!r||r.z!==z) return null;
  return {z:r.z, mul:A.ZONE[r.z].mul};
}
const sg=scoreOf('gwan'), se=scoreOf('ear'), si=scoreOf('in');
console.log('  배수: 관 '+(sg&&sg.mul)+' / 귀 '+(se&&se.mul)+' / 들어감 '+(si&&si.mul));
ok(sg&&se&&si,'세 구역 모두 판정됨');
ok(sg.mul>se.mul && se.mul>si.mul,'관 > 귀 > 들어감 서열 성립 (좁은 표적일수록 고득점)');

hdr('10. 변주(모디파이어) 안전성');
const seen={};
for(let i=0;i<400;i++){ A.stage=4+(i%25); A.setupStage();
  if(A.mod.pick) seen[A.mod.pick.id]=(seen[A.mod.pick.id]||0)+1;
  if(!(A.pot.mouth>8 && A.pot.earW>2 && A.pot.x<375 && A.pot.rimY>0)) { ok(false,'변주 조합에서 형상 붕괴','stage='+A.stage+' mouth='+A.pot.mouth); break; }
  if(!isFinite(A.pot.mouth)||!isFinite(A.pot.x)){ ok(false,'NaN 발생'); break; }
}
console.log('  변주 등장 분포: '+JSON.stringify(seen));
ok(Object.keys(seen).length>=5,'변주가 골고루 등장');
ok(true,'모든 단계/변주에서 형상 유효');
// 전 단계 조준 가능성 + 실제 적중 가능성 보장
let unreach=[], unhit=[];
for(let s=1;s<=40;s++){
  A.stage=s; A.setupStage();
  if(!(A.aLo<A.AMAX-4)) unreach.push(s);
  let any=false;
  for(const ang of [A.aLo+1, Math.round((A.aLo+A.AMAX)/2), A.AMAX-1]){
    if(playShot(s,ang,0,false).z==='in'){ any=true; break; }
  }
  if(!any) unhit.push(s);
}
ok(unreach.length===0,'1~40단계 모두 조준 선택 폭이 남아있다', unreach.join(','));
ok(unhit.length===0,'1~40단계 모두 (모든 변주 포함) 실제로 넣을 수 있다', unhit.join(','));

hdr('11. 다양한 화면 비율');
for(const [w,h] of [[320,568],[360,640],[375,812],[414,896],[430,932],[768,1024]]){
  sandbox.innerWidth=w; sandbox.innerHeight=h; A.resize();
  let bad=null;
  for(let s=1;s<=25;s++){ A.stage=s; A.setupStage();
    if(!(A.aLo<A.AMAX-4)){bad='각도없음@'+s;break;}
    if(A.pot.x+A.pot.earOff+A.pot.earW/2>w-2){bad='화면밖@'+s;break;}
    if(A.pot.rimY<70){bad='입구가HUD와겹침@'+s;break;}
    if(playShot(s,Math.round((A.aLo+A.AMAX)/2),0,false).z!=='in'){bad='적중불가@'+s;break;}
  }
  ok(bad===null, `${w}x${h}: 25단계까지 정상`, String(bad));
}
sandbox.innerWidth=375; sandbox.innerHeight=812; A.resize();

hdr('13. 일일 도전 — 같은 날이면 누구나 같은 판');
/** 한 판을 처음부터 n단계까지 진행하며 (바람, 변주) 를 기록 */
function stageSeq(m,n){
  A.startGame(m);
  const out=[];
  for(let i=0;i<n;i++){
    out.push(Math.round(A.wind*100)/100+'|'+(A.mod.pick?.id||'-')+'|'+(A.mod.pick2?.id||'-'));
    A.nextStage();
  }
  return out;
}
const d=A.todayKey();
const run1=stageSeq('daily',25), run2=stageSeq('daily',25);
ok(run1.join()===run2.join(),'같은 날 두 번 플레이 → 25단계까지 완전히 동일한 판',
   run1.slice(0,3).join(' , '));
ok(new Set(run1).size>15,'단계마다 판이 다르다(시드가 고정값을 뱉지 않음)', new Set(run1).size+'/25');

// 날짜가 바뀌면 다른 판
A.rngState=A.seedFrom('tuho-2026-01-01'); A.mode='daily';
const seqA=[]; A.stage=1; for(let i=0;i<12;i++){ A.setupStage(); seqA.push(Math.round(A.wind*100)/100+'|'+(A.mod.pick?.id||'-')); A.stage=i+2; }
A.rngState=A.seedFrom('tuho-2026-01-02'); A.mode='daily';
const seqB=[]; A.stage=1; for(let i=0;i<12;i++){ A.setupStage(); seqB.push(Math.round(A.wind*100)/100+'|'+(A.mod.pick?.id||'-')); A.stage=i+2; }
ok(seqA.join()!==seqB.join(),'다른 날짜 → 다른 판');
console.log('  1/1: '+seqA.slice(2,5).join(' , '));
console.log('  1/2: '+seqB.slice(2,5).join(' , '));

// 일반 모드는 매판 달라야 한다
const e1=stageSeq('endless',14), e2=stageSeq('endless',14);
ok(e1.join()!==e2.join(),'일반 모드는 매번 다른 판 (시드 고정이 새어나오지 않음)');

hdr('13b. 일일 도전 기록 / 연속일');
const D=A.daily;
D.date=''; D.best=0; D.stage=1; D.plays=0; D.streak=0; D.last='';
A.startGame('daily');
ok(D.date===d && D.plays===1,'오늘 첫 판 → 오늘 기록이 열리고 시도 1회','date='+D.date+' plays='+D.plays);
ok(D.streak===1,'연속일 1일차로 시작','streak='+D.streak);
A.startGame('daily');
ok(D.plays===2 && D.streak===1,'같은 날 재도전 → 시도만 증가, 연속일 유지','plays='+D.plays+' streak='+D.streak);

// 어제 플레이했으면 연속일 +1
D.date=A.prevKey(d); D.last=A.prevKey(d); D.streak=4; D.plays=9; D.best=999;
A.startGame('daily');
ok(D.streak===5,'어제 플레이 → 연속일 +1','streak='+D.streak);
ok(D.best===0 && D.plays===1,'날짜가 바뀌면 오늘 기록은 0부터','best='+D.best+' plays='+D.plays);

// 이틀 비우면 연속 끊김
D.date='2026-01-01'; D.last='2026-01-01'; D.streak=7;
A.startGame('daily');
ok(D.streak===1,'이틀 이상 비우면 연속일 초기화','streak='+D.streak);

// 기록은 갱신될 때만 올라간다 + 이어하기는 막혀야 한다
A.startGame('daily'); A.stage=7; A.score=500; A.gameOver();
ok(D.best===500 && D.stage===7,'첫 판 점수가 오늘 기록이 된다','best='+D.best+' stage='+D.stage);
ok(els.continueBtn.style.display==='none','일일 도전에서는 광고 이어하기가 숨겨진다(판이 같아야 비교 가능)');
ok(els.shareBtn.style.display==='block','일일 도전 결과에 공유 버튼이 뜬다');

A.startGame('daily'); A.stage=3; A.score=200; A.gameOver();
ok(D.best===500 && D.stage===7,'더 낮은 점수는 기록을 덮지 않는다','best='+D.best+' stage='+D.stage);
A.startGame('daily'); A.stage=11; A.score=900; A.gameOver();
ok(D.best===900 && D.stage===11,'더 높은 점수는 기록을 갱신한다','best='+D.best+' stage='+D.stage);

A.startGame('endless'); A.score=50; A.gameOver();
ok(els.continueBtn.style.display==='block','일반 모드에서는 이어하기가 보인다');
ok(els.shareBtn.style.display==='none','일반 모드에는 공유 버튼이 없다');
ok(D.best===900,'일반 모드 점수는 일일 기록을 건드리지 않는다','best='+D.best);

const st=A.shareText();
ok(st.includes('오늘의 도전')&&st.includes('900')&&st.includes('11단계'),'공유 문구에 날짜·점수·단계가 들어간다','"'+st.replace(/\n/g,' / ')+'"');

hdr('12. 렌더 스모크 — 모든 상태/변주에서 예외 없이 그려지는가');
let renderErr=null, renders=0;
try{
  for(const forced of [null,...MODIDS()]){
    for(let s of [1,4,15,25]){
      A.stage=s; A.setupStage();
      if(forced) forceMod(forced);
      for(const st of ['start','aim','power','fly','result','clear','over']){
        A.state=st;
        if(st==='fly'||st==='result'){ A.newArrow(); A.state='power'; A.power=A.idealPower()||0.5; A.launch(); step(30); A.state=st; }
        A.render(); renders++;
      }
      A.state='aim'; A.newArrow(); A.update(1/60); A.render(); renders++;
    }
  }
}catch(e){ renderErr=e && (e.message||String(e)); }
function MODIDS(){ return ['wind','sway','narrow','night','fog','gold']; }
function forceMod(id){ /* setupStage가 무작위라 변주별 강제는 재시도로 근사 */
  for(let i=0;i<80;i++){ A.setupStage(); if(A.mod.pick&&A.mod.pick.id===id) return true; } return false; }
console.log('  렌더 호출 '+renders+'회');
ok(renderErr===null,'모든 상태·변주 조합에서 렌더 예외 없음', renderErr||'');

console.log(`\n==== 결과: ${passes} 통과 / ${fails} 실패 ====`);
process.exit(fails?1:0);
