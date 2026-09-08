(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const VERSION=3, KEY='rethinkMindStateV3';
const DEFAULT={version:VERSION,onboarded:false,settings:{sport:'general',goal:'pressure',duration:'normal'},scores:{Focus:58,Control:58,'Self-Talk':58,Imagery:58,Confidence:58,Resilience:58,Pressure:58},seen:{},history:[],custom:{cue:'NEXT'},blockStart:null};
let state=load(), currentSession=[], currentIndex=0, currentCheck={}, currentResults=[], timers=[], currentDrill=null, currentLibrarySkill='Focus';

function clone(x){return JSON.parse(JSON.stringify(x));}
function load(){try{let x=JSON.parse(localStorage.getItem(KEY)||'null');if(!x)return clone(DEFAULT);return {...clone(DEFAULT),...x,settings:{...DEFAULT.settings,...(x.settings||{})},scores:{...DEFAULT.scores,...(x.scores||{})}}}catch{return clone(DEFAULT)}}
function save(){state.version=VERSION;localStorage.setItem(KEY,JSON.stringify(state));}
function clearTimers(){timers.forEach(t=>{clearInterval(t);clearTimeout(t)});timers=[];}
function show(id){clearTimers();$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');if(id==='home')renderHome();if(id==='progress')renderProgress();if(id==='library')renderLibrary();if(id==='settings')renderSettings();}
function flash(kind='good'){let f=$('#feedbackFlash');f.className='feedback-flash '+kind;f.style.opacity='1';timers.push(setTimeout(()=>f.style.opacity='0',130));}
function ctx(){return MIND.CONTEXT[state.settings.sport]||MIND.CONTEXT.general;}
function interpolate(text){return text.replaceAll('{scene}',ctx().scene).replaceAll('{action}',ctx().action).replaceAll('{cue}',state.custom.cue||ctx().cue);}
function skillLevel(skill){let s=state.scores[skill]||50;return s<48?1:s<63?2:s<78?3:4;}
function weakest(){return [...MIND.SKILLS].sort((a,b)=>(state.scores[a]||0)-(state.scores[b]||0));}
function recentIds(n=14){return new Set(state.history.slice(-n).flatMap(h=>h.drills||[]));}
function pickDrill(skill, opts={}){
  let level=opts.level||skillLevel(skill), pool=MIND.DRILLS.filter(d=>d.skill===skill && d.level<=Math.min(4,level+1));
  if(opts.types) pool=pool.filter(d=>opts.types.includes(d.type));
  const recent=recentIds(); let fresh=pool.filter(d=>!recent.has(d.id)); if(fresh.length)pool=fresh;
  if(!pool.length) pool=MIND.DRILLS.filter(d=>d.skill===skill);
  return clone(pool[Math.floor(Math.random()*pool.length)]);
}
function sessionLength(){return state.settings.duration==='short'?6:state.settings.duration==='long'?9:7;}
function goalSkill(){return {pressure:'Pressure',focus:'Focus',confidence:'Confidence',reset:'Resilience'}[state.settings.goal]||'Pressure';}
function blockPhase(){if(!state.blockStart)return 1;let w=Math.floor((Date.now()-new Date(state.blockStart))/604800000)+1;return w<=2?1:w<=4?2:w<=6?3:4;}

function renderHome(){let w=weakest(), primary=w[0], secondary=goalSkill()===primary?w[1]:goalSkill();$('#focusLabel').textContent=`${MIND.SKILL_LABELS[primary]} + ${MIND.SKILL_LABELS[secondary]}`;$('#sessionMeta').textContent=`${state.settings.duration==='short'?'6–7':state.settings.duration==='long'?'11–13':'8–10'} MIN · ADAPTIVE SESSION`;}

function setupOnboarding(){
  $('#sportChoices').innerHTML=MIND.SPORTS.map(x=>`<button data-sport="${x.id}">${x.label}</button>`).join('');
  $('#goalChoices').innerHTML=MIND.GOALS.map(x=>`<button data-goal="${x.id}">${x.label}</button>`).join('');
  $('#durationChoices').innerHTML=[['short','6–7'],['normal','8–10'],['long','11–13']].map(x=>`<button data-duration="${x[0]}">${x[1]} MIN</button>`).join('');
  function mark(sel,val){$$(sel).forEach(b=>b.classList.toggle('on',b.dataset[sel.includes('sport')?'sport':sel.includes('goal')?'goal':'duration']===val));}
  mark('[data-sport]',state.settings.sport);mark('[data-goal]',state.settings.goal);mark('[data-duration]',state.settings.duration);
  $('#sportChoices').onclick=e=>{if(e.target.dataset.sport){state.settings.sport=e.target.dataset.sport;mark('[data-sport]',state.settings.sport)}};
  $('#goalChoices').onclick=e=>{if(e.target.dataset.goal){state.settings.goal=e.target.dataset.goal;mark('[data-goal]',state.settings.goal)}};
  $('#durationChoices').onclick=e=>{if(e.target.dataset.duration){state.settings.duration=e.target.dataset.duration;mark('[data-duration]',state.settings.duration)}};
}

function startCheck(){currentCheck={};const items=[['focus','Fokus'],['energy','Energie'],['stress','Anspannung'],['confidence','Selbstvertrauen'],['motivation','Motivation']];$('#checkItems').innerHTML=items.map(([k,l])=>`<div class="readiness-card"><div class="readiness-head"><b>${l}</b><span id="val-${k}">–</span></div><div class="rate-grid">${[1,2,3,4,5].map(n=>`<button data-rate="${k}" data-value="${n}">${n}</button>`).join('')}</div></div>`).join('');show('check');}
function handleRate(btn){let k=btn.dataset.rate,n=+btn.dataset.value;currentCheck[k]=n;btn.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===btn));$('#val-'+k).textContent=n;}

function buildAdaptiveSession(){
  ['focus','energy','stress','confidence','motivation'].forEach(k=>{if(!currentCheck[k])currentCheck[k]=3});
  let len=sessionLength(), w=weakest(), g=goalSkill(), list=[];
  const controlTypes=currentCheck.stress>=4?['breath','doubleinhale','bodyscan']:currentCheck.energy<=2?['activate','fastcalm']:null;
  list.push(pickDrill('Control',{types:controlTypes}));
  list.push(pickDrill('Focus'));
  list.push(pickDrill(w[0]));
  if(g!==w[0] && g!=='Control' && g!=='Focus')list.push(pickDrill(g));
  let phase=blockPhase();
  list.push(pickDrill('Self-Talk'));
  list.push(pickDrill('Imagery'));
  if(phase===1){ list.push(pickDrill('Resilience')); list.push(pickDrill('Pressure',{level:1})); }
  if(phase===2){ list.push(pickDrill('Resilience',{level:2})); list.push(pickDrill('Pressure',{level:2})); }
  if(phase===3){ list.push(pickDrill('Pressure',{level:3})); list.push(pickDrill('Resilience',{level:3})); }
  if(phase===4){ list.push(pickDrill('Pressure',{level:4})); list.push(pickDrill(w[1]||'Resilience',{level:4})); }
  if(currentCheck.confidence<=2)list.splice(4,0,pickDrill('Confidence'));
  // de-duplicate and trim/extend
  let seen=new Set();list=list.filter(d=>!seen.has(d.id)&&(seen.add(d.id),true));
  while(list.length<len){let sk=MIND.SKILLS[Math.floor(Math.random()*MIND.SKILLS.length)],d=pickDrill(sk);if(!seen.has(d.id)){list.push(d);seen.add(d.id)}}
  currentSession=list.slice(0,len);currentIndex=0;currentResults=[];show('train');renderCurrent();
}
function quickSession(kind){
  currentCheck={focus:3,energy:3,stress:3,confidence:3,motivation:3};
  currentSession=kind==='reset'?[pickDrill('Control',{types:['breath','doubleinhale','bodyscan']}),pickDrill('Resilience')]:[pickDrill('Control',{types:['activate','breath']}),pickDrill('Imagery',{level:2}),pickDrill('Focus',{level:2})];
  currentIndex=0;currentResults=[];show('train');renderCurrent();
}
function freeDrill(id){let d=MIND.DRILLS.find(x=>x.id===id);if(!d)return;currentSession=[clone(d)];currentIndex=0;currentResults=[];currentCheck={focus:3,energy:3,stress:3,confidence:3,motivation:3};show('train');renderCurrent();}

function cuePills(d){
  const t=d.type;
  const map={
    gonogo:['● = TIP','○ / ▲ = NICHT','NÄCHSTER REIZ'], pressurego:['● = TIP','▲ = STOP','NACH FEHLER WEITER'], bounceback:['ERKENNEN','REAGIEREN','SOFORT RESET'],
    focusshift:['ENG','WEIT','BEWUSST WECHSELN'], quieteye:['FIXIEREN','AUSATMEN','DANN HANDELN'], moving:['BLICK','ZIEL','HAND'], dualcue:['GERADE = LINKS','UNGERADE = RECHTS','POSITION IGNORIEREN'],
    stroop:['FARBE','NICHT WORT','SCHNELL RESET'], peripheral:['MITTE FIXIEREN','RAND WAHRNEHMEN','ZÄHLEN'], switchrule:['REGEL HALTEN','SWITCH','SOFORT NEU'],
    breath:['4 S EIN','6 S AUS'], boxbreath:['4 S EIN','4 S HALTEN','4 S AUS','4 S HALTEN'], doubleinhale:['KURZ EIN','NACHATMEN','LANG AUS'], activate:['AKTIV EIN','KÖRPERSPANNUNG','AUS'], fastcalm:['AKTIVIEREN','UMSCHALTEN','LANG AUS'], breathpressure:['RHYTHMUS','STÖRUNG','RHYTHMUS HALTEN'], bodyscan:['STIRN','KIEFER','SCHULTERN','HÄNDE','BAUCH'],
    choice:['SITUATION','HANDLUNG','NICHT BEWERTUNG'], statechoice:['AUFGABE','ZUSTAND','PASSEND WÄHLEN'], textcue:['KURZ','KONKRET','KONTROLLIERBAR'], ifthen:['WENN','DANN','AUTOMATISIEREN'],
    evidence:['BELEG 1','BELEG 2','BELEG 3'], proofstack:['BELEG 1','BELEG 2','BELEG 3'], control:['KONTROLLIERBAR','NICHT KONTROLLIERBAR'], strength:['STÄRKE','VERHALTEN','HEUTE'], prepcheck:['PLAN','CUE','ERSTE AKTION'], protocol:['ATEM','CUE','AKTION'],
    imagery:['UMGEBUNG','KÖRPER','AKTION','LÖSUNG'], imagery3:['AKTION 1','AKTION 2','AKTION 3'], imageryerror:['FEHLER','RESET','NÄCHSTE AKTION'], imagerypressure:['DRUCK','ATEM','CUE','ENTSCHEIDUNG'], imageryslow:['ZEITLUPE','DETAIL','ECHTTEMPO'], imageryexternal:['AUSSEN','HALTUNG','ZURÜCK INS ICH'], imagerysense:['SEHEN','HÖREN','FÜHLEN'], imageryadversity:['STÖRUNG','REAKTION','WEITER'], bestrep:['SEHEN','FÜHLEN','HANDELN'],
    reset:['AUSATMEN','ORIENTIEREN','HANDELN'], reset3:['3 SEKUNDEN','NEXT','HANDELN'], disrupt:['STÖRUNG','NEU ORIENTIEREN','AUFGABE'], clutch:['AUSATMEN','SEHEN','ENTSCHEIDEN'], clockchoice:['REGEL','ENTSCHEIDEN','WEITER'], streak:['ROUTINE','ENTSCHEIDEN','RESET'], countdownchoice:['REGEL','ZEITDRUCK','WEITER'], lateswitch:['REGEL','SWITCH','ANPASSEN'], noise:['REGEL','STÖRUNG IGNORIEREN','ENTSCHEIDEN'], chaos:['ORIENTIEREN','REGEL','NÄCHSTE AKTION']
  };
  return map[t] || ['BREATHE','SEE','ACT'];
}
function pillsHTML(d){return `<div class="pill-row guide-pills">${cuePills(d).map(x=>`<span class="pill">${x}</span>`).join('')}</div>`;}
function baseHTML(d,withInstruction=false){return `<div class="skill">${MIND.SKILL_LABELS[d.skill]} · ${currentIndex+1}/${currentSession.length}</div><h3>${d.title}</h3>${withInstruction?`<p class="instruction">${interpolate(d.instruction)}</p>${pillsHTML(d)}`:''}`;}
function nextReady(){ $('#nextExercise').classList.remove('hidden'); }
function countdown(sec,onTick){let remain=sec;const el=$('#timer');if(el)el.textContent=remain;let i=setInterval(()=>{remain--;if(el)el.textContent=Math.max(0,remain);if(onTick)onTick(remain);if(remain<=0){clearInterval(i);nextReady();}},1000);timers.push(i);}
function record(metric={}){currentResults[currentIndex]={skill:currentDrill.skill,id:currentDrill.id,...metric};}

function renderCurrent(){
  clearTimers(); currentDrill=currentSession[currentIndex]; $('#sessionProgress').style.width=(currentIndex/currentSession.length*100)+'%'; $('#nextExercise').classList.add('hidden');
  const d=currentDrill, st=$('#exerciseStage');
  st.innerHTML=baseHTML(d,true)+`<div class="prestart"><span>BEREIT</span><strong id="preCount">5</strong><small>Dann startet die Übung</small></div>`;
  let n=5; let i=setInterval(()=>{n--;let c=$('#preCount');if(c)c.textContent=n>0?n:'GO';if(n<=0){clearInterval(i);renderDrillActual(d)}},1000);timers.push(i);
}
function renderDrillActual(d){
  clearTimers(); $('#nextExercise').classList.add('hidden'); const b=baseHTML(d,false), type=d.type;
  if(['breath','activate','doubleinhale','boxbreath','fastcalm','breathpressure'].includes(type))return renderBreath(d,b,type);
  if(type==='bodyscan')return renderTimedPills(d,b,['STIRN','KIEFER','SCHULTERN','HÄNDE','BAUCH']);
  if(['gonogo','pressurego','bounceback'].includes(type))return renderGoNoGo(d,b,type);
  if(type==='moving')return renderMoving(d,b);
  if(type==='focusshift'||type==='quieteye')return renderFocusShift(d,b,type);
  if(['dualcue','clockchoice','streak','countdownchoice'].includes(type))return renderBinary(d,b,type);
  if(['stroop','lateswitch','switchrule','noise','chaos'].includes(type))return renderConflict(d,b,type);
  if(type==='peripheral')return renderPeripheral(d,b);
  if(['choice','statechoice'].includes(type))return renderChoice(d,b);
  if(['textcue','ifthen','evidence','control','strength','proofstack','prepcheck','protocol'].includes(type))return renderText(d,b,type);
  if(type.startsWith('imagery')||type==='bestrep')return renderImagery(d,b,type);
  if(type==='reset'||type==='reset3')return renderReset(d,b,type);
  if(type==='disrupt')return renderDisrupt(d,b);
  if(type==='clutch')return renderClutch(d,b);
  return renderTimedPills(d,b,cuePills(d));
}

function breathPattern(type){
  if(type==='boxbreath')return [{label:'EIN',sec:4,scale:1.28},{label:'HALTEN',sec:4,scale:1.28},{label:'AUS',sec:4,scale:1},{label:'HALTEN',sec:4,scale:1}];
  if(type==='doubleinhale')return [{label:'EIN',sec:1.2,scale:1.20},{label:'NACHATMEN',sec:.8,scale:1.30},{label:'LANG AUS',sec:6,scale:1}];
  if(type==='activate')return [{label:'AKTIV EIN',sec:3,scale:1.28},{label:'AUS',sec:2,scale:1}];
  if(type==='fastcalm')return [{label:'AKTIV EIN',sec:2,scale:1.23},{label:'LANG AUS',sec:6,scale:1}];
  return [{label:'EIN',sec:4,scale:1.28},{label:'AUS',sec:6,scale:1}];
}
function renderBreath(d,b,type){
  const pattern=breathPattern(type);
  $('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div class="breath-orb" id="orb"><strong id="phase">BEREIT</strong></div><div id="timer" class="timer">${d.duration}</div>${type==='breathpressure'?'<div class="microstat" id="noiseText">Störung ignorieren</div>':''}`;
  let stopped=false, step=0;
  function runPhase(){
    if(stopped)return; const orb=$('#orb'), ph=$('#phase'); if(!orb||!ph)return;
    const x=pattern[step%pattern.length]; ph.textContent=x.label;
    orb.style.transition=`transform ${x.sec}s ease-in-out`; requestAnimationFrame(()=>orb.style.transform=`scale(${x.scale})`);
    if(type==='breathpressure'&&Math.random()<.45){let nt=$('#noiseText');if(nt)nt.textContent=['SCORE!','SCHNELLER!','FEHLER!','ZEIT!'][Math.floor(Math.random()*4)];flash('warn')}
    step++; let t=setTimeout(runPhase,x.sec*1000);timers.push(t);
  }
  runPhase(); let remain=d.duration; const ti=setInterval(()=>{remain--;let t=$('#timer');if(t)t.textContent=Math.max(0,remain);if(remain<=0){stopped=true;clearInterval(ti);clearTimers();record({quality:.75});nextReady();}},1000);timers.push(ti);
}
function renderTimedPills(d,b,pills){$('#exerciseStage').innerHTML=b+`<div class="pill-row">${pills.map(x=>`<span class="pill">${x}</span>`).join('')}</div><div id="timer" class="timer">${d.duration}</div>`;countdown(d.duration);record({quality:0.7});}
function renderGoNoGo(d,b,type){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<button id="stimulus" class="stimulus">–</button><div id="timer" class="timer">${d.duration}</div><div id="microstat" class="microstat">0 richtig · 0 Fehler</div>`;let remain=d.duration,correct=0,errors=0,current=null,start=0,delay=type==='pressurego'?850:type==='bounceback'?900:1100;function update(){let m=$('#microstat');if(m)m.textContent=`${correct} richtig · ${errors} Fehler`;}function spawn(){if(remain<=0)return;let arr=type==='bounceback'?['●','●','▲','✕']:['●','○','▲'];current=arr[Math.floor(Math.random()*arr.length)];let s=$('#stimulus');if(!s)return;s.textContent=current;start=performance.now();let t=setTimeout(()=>{if(current==='●'){errors++;flash('bad')}current=null;if(s)s.textContent='–';update();if(type==='pressurego')delay=Math.max(390,delay-16);spawn();},delay);timers.push(t)}$('#stimulus').onclick=()=>{let ok=current==='●';if(ok){correct++;flash('good')}else{errors++;flash('bad')}current=null;$('#stimulus').textContent='–';update();};spawn();let i=setInterval(()=>{remain--;$('#timer').textContent=Math.max(0,remain);if(remain<=0){clearInterval(i);clearTimers();$('#stimulus').disabled=true;record({correct,errors,quality:correct/(correct+errors+1)});nextReady();}},1000);timers.push(i);}
function renderMoving(d,b){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div id="field" class="field"></div><div id="timer" class="timer">${d.duration}</div><div id="microstat" class="microstat">0 Treffer</div>`;let hits=0;function spawn(){let f=$('#field');if(!f)return;f.innerHTML='';let x=document.createElement('button');x.className='target-dot';x.textContent='•';x.style.left=(4+Math.random()*88)+'%';x.style.top=(5+Math.random()*80)+'%';x.onclick=()=>{hits++;flash('good');$('#microstat').textContent=hits+' Treffer';spawn()};f.appendChild(x)}spawn();countdown(d.duration,remain=>{if(remain<=0){record({hits,quality:Math.min(1,hits/20)})}});}
function renderFocusShift(d,b,type){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div class="stimulus">•</div><div id="timer" class="timer">${d.duration}</div><div id="mode" class="microstat">${type==='quieteye'?'BLICK RUHIG':'ENG: nur Punkt'}</div>`;let c=0;let i=setInterval(()=>{c++;if(type==='focusshift')$('#mode').textContent=c%2?'WEIT: gesamtes Sichtfeld':'ENG: nur Punkt';},4000);timers.push(i);countdown(d.duration);record({quality:0.75});}
function renderBinary(d,b,type){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div id="stimulus" class="stimulus">–</div><div class="dual-buttons"><button id="leftBtn">LINKS</button><button id="rightBtn">RECHTS</button></div><div id="timer" class="timer">${d.duration}</div><div id="microstat" class="microstat">Score 0</div>`;let answer=0,score=0,streak=0;function spawn(){let n=1+Math.floor(Math.random()*9);$('#stimulus').textContent=n;answer=n%2===0?0:1;}function choose(a){let ok=a===answer;flash(ok?'good':'bad');if(type==='streak'){streak=ok?streak+1:0;score=Math.max(score,streak);$('#microstat').textContent=`Beste Serie ${score} · aktuell ${streak}`}else{score+=ok?1:-1;$('#microstat').textContent='Score '+score}spawn()}$('#leftBtn').onclick=()=>choose(0);$('#rightBtn').onclick=()=>choose(1);spawn();countdown(d.duration,remain=>{if(remain<=0)record({score,quality:Math.max(0.2,Math.min(1,(score+10)/20))})});}
function renderConflict(d,b,type){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div id="ruleBox" class="microstat">${type==='stroop'?'FARBE zählt':'Aktuelle Regel'}</div><div id="stimulus" class="stimulus">–</div><div class="choice-list"><button id="aBtn">LINKS</button><button id="bBtn">RECHTS</button></div><div id="timer" class="timer">${d.duration}</div><div id="microstat" class="microstat">Score 0</div>`;let score=0,answer=0,flip=false;function spawn(){if(type==='stroop'){let pairs=[['ROT',0,'#ff6d7c'],['BLAU',1,'#84a9ff'],['BLAU',0,'#ff6d7c'],['ROT',1,'#84a9ff']],p=pairs[Math.floor(Math.random()*pairs.length)];$('#stimulus').textContent=p[0];$('#stimulus').style.color=p[2];answer=p[1];$('#aBtn').textContent='ROT';$('#bBtn').textContent='BLAU';}else{answer=Math.random()<.5?0:1;if(flip)answer=1-answer;$('#stimulus').textContent=answer===0?'L':'R';$('#aBtn').textContent='LINKS';$('#bBtn').textContent='RECHTS';if((type==='lateswitch'||type==='switchrule'||type==='chaos')&&Math.random()<.18){flip=!flip;$('#ruleBox').textContent='SWITCH — Regel umgedreht';flash('warn')}if(type==='noise')$('#ruleBox').textContent=['GEWINNEN!','FEHLER!','SCHNELL!','Nur Regel zählt'][Math.floor(Math.random()*4)];}}function choose(a){let ok=a===answer;score+=ok?1:-1;flash(ok?'good':'bad');$('#microstat').textContent='Score '+score;spawn()}$('#aBtn').onclick=()=>choose(0);$('#bBtn').onclick=()=>choose(1);spawn();countdown(d.duration,remain=>{if(remain<=0)record({score,quality:Math.max(.2,Math.min(1,(score+12)/24))})});}
function renderPeripheral(d,b){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div id="field" class="field"><div class="stimulus" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70px">•</div></div><div id="timer" class="timer">${d.duration}</div><div id="microstat" class="microstat">Impulse zählen</div>`;let shown=0;function pulse(){let f=$('#field');if(!f)return;let dot=document.createElement('div');dot.className='target-dot';dot.style.width='18px';dot.style.height='18px';dot.style.left=(Math.random()<.5?4:92)+'%';dot.style.top=(8+Math.random()*78)+'%';f.appendChild(dot);shown++;timers.push(setTimeout(()=>dot.remove(),450));}let i=setInterval(()=>{if(Math.random()<.65)pulse()},1300);timers.push(i);countdown(d.duration,remain=>{if(remain<=0){$('#microstat').textContent=`Es waren ${shown} Impulse`;record({quality:.7})}});}
function renderChoice(d,b){let options=d.options||['Zu ruhig werden','Passende Aktivierung wählen','Maximal hochfahren','Gefühl ignorieren'],good=d.good||[1];$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div class="choice-list">${options.map((x,i)=>`<button data-opt="${i}">${x}</button>`).join('')}</div>`;$$('[data-opt]').forEach(btn=>btn.onclick=()=>{let ok=good.includes(+btn.dataset.opt);flash(ok?'good':'bad');$$('[data-opt]').forEach(x=>x.disabled=true);btn.classList.add(ok?'selected-good':'selected-bad');record({quality:ok?1:.35});timers.push(setTimeout(nextReady,320));});}
function renderText(d,b,type){let placeholder=type==='evidence'||type==='proofstack'?'1. …\n2. …\n3. …':type==='ifthen'?'Wenn ich einen Fehler mache, dann …':'Kurz und konkret …';$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<textarea id="entry" class="text-entry" placeholder="${placeholder}"></textarea>`;$('#entry').addEventListener('input',()=>{if(type==='textcue'&&$('#entry').value.trim())state.custom.cue=$('#entry').value.trim().split(/\s+/).slice(0,3).join(' ');record({quality:$('#entry').value.trim().length>4?.85:.55});save();});nextReady();}
function renderImagery(d,b,type){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div id="timer" class="timer">${d.duration}</div>`;countdown(d.duration);record({quality:.75});}
function renderReset(d,b,type){$('#exerciseStage').innerHTML=b+`<div class="breath-orb static-cue"><strong>${state.custom.cue||ctx().cue}</strong></div>`+pillsHTML(d)+`<div id="timer" class="timer">${d.duration}</div>`;countdown(d.duration);record({quality:.8});}
function renderDisrupt(d,b){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div class="stimulus">●</div><div id="timer" class="timer">${d.duration}</div><div id="microstat" class="microstat">Aufgabe halten</div>`;let i=setInterval(()=>{let m=$('#microstat');if(m){m.textContent=['STÖRUNG → zurück','BLICK NEU SETZEN','NEXT ACTION','AUSATMEN → AUFGABE'][Math.floor(Math.random()*4)];flash('warn')}},5000);timers.push(i);countdown(d.duration);record({quality:.75});}
function renderClutch(d,b){$('#exerciseStage').innerHTML=b+pillsHTML(d)+`<div id="field" class="field" style="height:160px"></div><div id="microstat" class="microstat">0 / 5</div>`;let round=0,correct=0;function spawn(){let f=$('#field');f.innerHTML='';let dot=document.createElement('button');dot.className='target-dot';let left=Math.random()<.5;dot.style.left=left?'20%':'75%';dot.style.top='42%';dot.onclick=()=>{correct++;round++;flash('good');$('#microstat').textContent=`${round} / 5`;if(round>=5){record({correct,quality:correct/5});nextReady()}else timers.push(setTimeout(spawn,700))};f.appendChild(dot)}spawn();}

function nextExercise(){clearTimers();if(!currentResults[currentIndex])record({quality:.65});currentIndex++;if(currentIndex>=currentSession.length){prepareReflection();show('reflect');return;}renderCurrent();}
function quit(){clearTimers();currentSession=[];show('home');}
function prepareReflection(){let primary=weakest()[0];$('#transferTask').textContent=MIND.TRANSFER_TASKS[primary];}
function updateScore(skill,quality,selfAdj=0){let old=state.scores[skill]||50,target=35+quality*55+selfAdj;state.scores[skill]=Math.round(Math.max(20,Math.min(95,old*.86+target*.14)));}
function finishSession(){let f=+$('#reflectFocus').value,c=+$('#reflectControl').value,r=+$('#reflectReal').value;currentResults.forEach(x=>updateScore(x.skill,x.quality??.65));updateScore('Focus',.55+(f-1)*.1);updateScore('Control',.55+(c-1)*.1);let duration=currentSession.reduce((a,d)=>a+(d.duration||35),0);let entry={date:new Date().toISOString(),drills:currentSession.map(x=>x.id),skills:[...new Set(currentSession.map(x=>x.skill))],readiness:currentCheck,reflection:{focus:f,control:c,realism:r},results:currentResults,duration};state.history.push(entry);if(state.history.length>180)state.history.shift();if(!state.blockStart)state.blockStart=entry.date;save();currentSession=[];show('home');}

function renderProgress(){
  $('#skillBars').innerHTML=MIND.SKILLS.map(s=>`<div class="skill-line"><div class="skill-line-head"><b>${MIND.SKILL_LABELS[s]}</b><span>${Math.round(state.scores[s])}</span></div><div class="bar"><div class="fill" style="width:${state.scores[s]}%"></div></div></div>`).join('');
  let now=new Date(),week=state.history.filter(h=>(now-new Date(h.date))<7*864e5),minutes=Math.round(week.reduce((a,h)=>a+(h.duration||0),0)/60),streak=calcStreak(),total=state.history.length;
  $('#summaryStats').innerHTML=`<div class="statbox"><b>${week.length}</b><span>SESSIONS / 7 TAGE</span></div><div class="statbox"><b>${minutes}</b><span>MINUTEN</span></div><div class="statbox"><b>${streak}</b><span>STREAK</span></div>`;
  let dates=new Set(state.history.map(h=>new Date(h.date).toDateString()));$('#calendarRow').innerHTML=Array.from({length:14},(_,i)=>{let d=new Date();d.setDate(d.getDate()-(13-i));return `<div class="calday ${dates.has(d.toDateString())?'done':''}">${d.getDate()}</div>`}).join('');
  let age=state.blockStart?Math.max(1,Math.floor((Date.now()-new Date(state.blockStart))/604800000)+1):1,phase=age<=2?['BLOCK 1 · AWARENESS','Regulation, Fokus und persönliche Cues stabil aufbauen.']:age<=4?['BLOCK 2 · STABILITY','Skills bei Fehlern und wechselnder Belastung zuverlässig halten.']:age<=6?['BLOCK 3 · PRESSURE','Entscheidung, Fokus und Reset unter zunehmendem Druck verbinden.']:['BLOCK 4 · TRANSFER','Weniger App, mehr Übertragung in echte Leistungssituationen.'];$('#blockTitle').textContent=phase[0];$('#blockText').textContent=phase[1];
  let last=state.history.at(-1);$('#lastSession').innerHTML=last?`<strong>${new Date(last.date).toLocaleDateString('de-DE')}</strong><p class="muted">${last.skills.map(s=>MIND.SKILL_LABELS[s]).join(' · ')}<br>Realitätsnähe ${last.reflection?.realism||'-'}/5</p>`:'<p class="muted">Noch keine Session abgeschlossen.</p>';
}
function calcStreak(){let dates=[...new Set(state.history.map(h=>new Date(h.date).toDateString()))];let n=0,d=new Date();for(let i=0;i<365;i++){if(dates.includes(d.toDateString()))n++;else if(i>0)break;d.setDate(d.getDate()-1)}return n;}

function renderLibrary(){
  $('#skillTabs').innerHTML=MIND.SKILLS.map(s=>`<button data-skilltab="${s}" class="${s===currentLibrarySkill?'on':''}">${MIND.SKILL_LABELS[s]}</button>`).join('');
  let list=MIND.DRILLS.filter(d=>d.skill===currentLibrarySkill);$('#libraryList').innerHTML=list.map(d=>`<div class="drill-card"><div><h4>${d.title}</h4><p>${d.summary} · Level ${d.level}</p></div><button data-free="${d.id}">START</button></div>`).join('');
}
function renderSettings(){
  $('#settingSport').innerHTML=MIND.SPORTS.map(x=>`<option value="${x.id}">${x.label}</option>`).join('');$('#settingGoal').innerHTML=MIND.GOALS.map(x=>`<option value="${x.id}">${x.label}</option>`).join('');$('#settingSport').value=state.settings.sport;$('#settingGoal').value=state.settings.goal;$('#settingDuration').value=state.settings.duration;
}
function exportData(){let blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='RETHINK-MIND-data.json';a.click();URL.revokeObjectURL(a.href);}
function importData(file){let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x.settings||!x.scores)throw new Error();state={...clone(DEFAULT),...x,settings:{...DEFAULT.settings,...x.settings},scores:{...DEFAULT.scores,...x.scores}};save();renderSettings();flash('good')}catch{alert('Die Datei ist keine gültige RETHINK. MIND Sicherung.')}};r.readAsText(file);}
function resetData(){if(confirm('Alle lokalen Trainingsdaten wirklich löschen?')){localStorage.removeItem(KEY);state=clone(DEFAULT);setupOnboarding();show('onboarding')}}

// global events
addEventListener('click',e=>{
  let go=e.target.closest('[data-go]');if(go)show(go.dataset.go);
  let q=e.target.closest('[data-quick]');if(q)quickSession(q.dataset.quick);
  let r=e.target.closest('[data-rate]');if(r)handleRate(r);
  let tab=e.target.closest('[data-skilltab]');if(tab){currentLibrarySkill=tab.dataset.skilltab;renderLibrary();}
  let free=e.target.closest('[data-free]');if(free)freeDrill(free.dataset.free);
});
$('#startDaily').onclick=startCheck;$('#buildSession').onclick=buildAdaptiveSession;$('#nextExercise').onclick=nextExercise;$('#quitSession').onclick=quit;
$('#finishSession').onclick=finishSession;['Focus','Control','Real'].forEach(k=>{let inp=$('#reflect'+k),out=$('#reflect'+k+'Val');inp.oninput=()=>out.textContent=inp.value;});
$('#finishSetup').onclick=()=>{state.onboarded=true;state.blockStart=new Date().toISOString();save();show('home')};
$('#settingSport').onchange=e=>{state.settings.sport=e.target.value;save()};$('#settingGoal').onchange=e=>{state.settings.goal=e.target.value;save()};$('#settingDuration').onchange=e=>{state.settings.duration=e.target.value;save()};
$('#exportData').onclick=exportData;$('#importData').onclick=()=>$('#importFile').click();$('#importFile').onchange=e=>{if(e.target.files[0])importData(e.target.files[0])};$('#resetData').onclick=resetData;

setupOnboarding();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
show(state.onboarded?'home':'onboarding');
})();
