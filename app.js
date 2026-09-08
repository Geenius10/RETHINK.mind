
"use strict";
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY="mentaledge.v8";
const todayKey=()=>{const d=new Date(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${d.getFullYear()}-${m}-${day}`};
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;

const defaults={
 profile:{sport:"Noch nicht gewählt",priorities:["Fokus","Selbstvertrauen"]},
 checks:[], preparations:[], reflections:[], sessions:[],
 customGoals:[], customCue:"Nächste Aktion.",
 weeklyPlan:null, dailyPlans:[], activeBlock:null, blockHistory:[]
};
let state=load();
let nav="today", modal=null, draft=null;

function cloneDefaults(){return JSON.parse(JSON.stringify(defaults))}
function load(){
 try{
   const current=JSON.parse(localStorage.getItem(KEY)||"null");
   if(current){const base=cloneDefaults();return {...base,...current,profile:{...base.profile,...(current.profile||{})},dailyPlans:current.dailyPlans||[],activeBlock:current.activeBlock||null,blockHistory:current.blockHistory||[]}}
   const old=JSON.parse(localStorage.getItem("mentaledge.v6")||"null");
   if(old){const base=cloneDefaults();return {...base,...old,profile:{...base.profile,...(old.profile||{})},dailyPlans:[],activeBlock:null,blockHistory:[]}}
 }catch(e){console.warn("MentalEdge state reset",e)}
 return cloneDefaults()
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.remove("hidden");clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.add("hidden"),1800)}
function setProgress(n,d=1){$("#modalProgress").innerHTML=`<i style="width:${clamp((n/d)*100,0,100)}%"></i>`}
function openModal(name,data={}){modal={name,...data};$("#overlay").classList.remove("hidden");$("#tabbar").classList.add("hidden");renderModal()}
function closeModal(){modal=null;draft=null;$("#overlay").classList.add("hidden");$("#tabbar").classList.remove("hidden");$("#modalBody").innerHTML="";renderAll()}
function go(id){nav=id;$$(".view").forEach(v=>v.classList.toggle("active",v.id===id+"View"));$$("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));window.scrollTo(0,0);renderAll()}

const skills={
 focus:{name:"Fokus",icon:"🎯",desc:"Aufmerksamkeit auswählen, halten und zurückholen."},
 confidence:{name:"Selbstvertrauen",icon:"⚡",desc:"Eigene Kompetenz abrufen und Entscheidungen vertrauen."},
 composure:{name:"Ruhe & Druck",icon:"🔥",desc:"Aktivierung, Nervosität und Emotionen regulieren."},
 reset:{name:"Reset",icon:"↻",desc:"Nach Fehlern und Störungen wieder zur Aufgabe finden."},
 preparation:{name:"Vorbereitung",icon:"◌",desc:"Ziele, Routinen, Self-Talk und Visualisierung vorbereiten."}
};


const sportProfiles={
 "Fußball":{group:"team",label:"Fußball",action:"Ballaktion",start:"Anpfiff",goal:["Vor Ballannahme kurz orientieren","Nach Ballverlust sofort neu ordnen","Aktiv und klar kommunizieren","Bei der nächsten Ballaktion bleiben"]},
 "Basketball":{group:"team",label:"Basketball",action:"Ballbesitz",start:"Tip-off",goal:["Nach Turnover sofort zurück in die Defense","Vor Entscheidungen kurz scannen","Nach Fehlwurf Körpersprache halten","In jeder Possession klar kommunizieren"]},
 "Handball":{group:"team",label:"Handball",action:"Angriff / Abwehraktion",start:"Anwurf",goal:["Nach Fehlwurf sofort zurückschalten","Vor dem Abschluss klare Entscheidung treffen","In der Abwehr aktiv kommunizieren","Nach Fehlern bei der nächsten Aktion bleiben"]},
 "Volleyball":{group:"team",label:"Volleyball",action:"Ballwechsel",start:"Aufschlag",goal:["Nach Fehlern sofort für den nächsten Ball bereit sein","Vor jeder Annahme klar ausrichten","Aktiv kommunizieren","Körpersprache nach verlorenen Punkten stabil halten"]},
 "Hockey":{group:"team",label:"Hockey",action:"Spielaktion",start:"Bully",goal:["Nach Puckverlust sofort neu orientieren","Vor Puckannahme Raum scannen","Aktiv kommunizieren","Nach Fehlern nächste Aktion spielen"]},
 "Tennis / Racketsport":{group:"racket",label:"Tennis / Racketsport",action:"Ballwechsel",start:"erster Aufschlag",goal:["Vor jedem Punkt meine Routine nutzen","Nach Fehlern den nächsten Punkt neu starten","Beim Treffpunkt bleiben","Zwischen Punkten Körpersprache stabil halten"]},
 "Laufen / Ausdauer":{group:"endurance",label:"Laufen / Ausdauer",action:"Abschnitt",start:"Startsignal",goal:["Beim aktuellen Abschnitt bleiben","Tempo nach Körpergefühl statt Ergebnisgedanken steuern","Bei schweren Phasen meinen Cue nutzen","Atmung und Rhythmus bewusst wahrnehmen"]},
 "Radsport":{group:"endurance",label:"Radsport",action:"Rennabschnitt",start:"Start",goal:["Beim aktuellen Rennabschnitt bleiben","Bei Belastung ruhig am Plan bleiben","Auf Tritt und Atmung zurückfokussieren","Nach Störungen schnell wieder Rhythmus finden"]},
 "Schwimmen":{group:"endurance",label:"Schwimmen",action:"Bahn / Abschnitt",start:"Startsignal",goal:["Auf Rhythmus und Technik-Cue bleiben","Nach einer schlechten Wende sofort neu ausrichten","Atmung kontrolliert halten","Nur den aktuellen Abschnitt schwimmen"]},
 "Kraftsport":{group:"strength",label:"Kraftsport",action:"Satz / Versuch",start:"erster Satz",goal:["Vor jedem Satz meine Setup-Routine nutzen","Nur auf meinen Technik-Cue fokussieren","Nach einem misslungenen Versuch neu aufbauen","Zwischen Sätzen ruhig beim Plan bleiben"]},
 "Kampfsport":{group:"combat",label:"Kampfsport",action:"Austausch",start:"Rundenbeginn",goal:["Nach einem Treffer sofort wieder in meine Aufgabe kommen","Distanz und Atmung bewusst halten","Auf Signale statt Emotionen reagieren","Zwischen Aktionen ruhig bleiben"]},
 "Turnen / Akrobatik":{group:"skill",label:"Turnen / Akrobatik",action:"Element / Folge",start:"erster Versuch",goal:["Vor jedem Versuch meine Routine durchlaufen","Auf einen Technik-Cue begrenzen","Nach Unsicherheit klar neu aufbauen","Landung / Abschluss bis zum Ende fokussieren"]},
 "Andere":{group:"generic",label:"dein Sport",action:"Aktion",start:"Beginn",goal:["Bei der aktuellen Aufgabe bleiben","Nach Fehlern direkt neu ausrichten","Klare Körpersprache halten","Meinen Cue konsequent nutzen"]},
 "Noch nicht gewählt":{group:"generic",label:"dein Sport",action:"Aktion",start:"Beginn",goal:["Bei der aktuellen Aufgabe bleiben","Nach Fehlern direkt neu ausrichten","Klare Körpersprache halten","Meinen Cue konsequent nutzen"]}
};
function sportContext(){return sportProfiles[state.profile.sport]||sportProfiles["Andere"]}

const sportExerciseText={
 team:{
  "focus-switch":["Du hörst einen lauten Kommentar direkt vor deiner nächsten Spielaktion.","Du denkst noch an den letzten Ballverlust.","Der Trainer ruft während einer schnellen Spielsituation etwas rein.","Du merkst Müdigkeit in einer intensiven Phase.","Ein Gegenspieler provoziert dich nach einer Aktion.","Kurz vor einer wichtigen Spielsituation steigt die Unruhe."],
  "confidence-talk":["Dir misslingt eine einfache Aktion.","Du bekommst den Ball in einer wichtigen Phase.","Zwei Aktionen hintereinander laufen schlecht.","Du merkst, dass du vorsichtiger wirst.","Das Spiel wird hektisch und laut.","Nach einem Rückschlag musst du sofort wieder mitspielen."],
  "reset-reps":["Du vergibst eine klare Chance.","Dir unterläuft ein technischer Fehler unter Gegnerdruck.","Du triffst eine schlechte Entscheidung im Spielaufbau.","Der Trainer kritisiert dich direkt nach einer Aktion.","In einer Druckphase passieren dir zwei Fehler hintereinander."],
  "imagery-senses":["Eine saubere Standardaktion mit Ball.","Eine schnelle Entscheidung unter Gegnerdruck.","Eine wichtige Aktion bei lauter Umgebung.","Eine schwierige Spielsituation, die du kontrolliert löst."],
  "imagery-adversity":["Ein früher Fehler im Spiel.","Eine Phase, in der der Gegner Druck macht.","Ein Moment starker Nervosität vor einer wichtigen Aktion.","Du verlierst kurz den Fokus und findest ihn wieder."]
 },
 racket:{
  "focus-switch":["Das Publikum bewegt sich vor deinem Aufschlag.","Du denkst noch an den letzten verlorenen Punkt.","Du ärgerst dich über eine Linienentscheidung.","Du merkst Müdigkeit in einem langen Ballwechsel.","Dein Gegner feiert einen Punkt sehr laut.","Vor einem wichtigen Aufschlag steigt die Unruhe."],
  "confidence-talk":["Du verschlägst einen einfachen Ball.","Du servierst bei einem wichtigen Punkt.","Zwei Punkte hintereinander gehen verloren.","Deine Vorhand fühlt sich kurz unsicher an.","Der Druck bei Breakball steigt.","Nach einem schwachen Spiel musst du neu starten."],
  "reset-reps":["Du verschlägst einen einfachen Return.","Du machst einen Doppelfehler.","Du wählst im Ballwechsel die falsche Option.","Du ärgerst dich über eine Entscheidung.","Du verlierst mehrere enge Punkte nacheinander."],
  "imagery-senses":["Ein sauberer erster Aufschlag.","Ein schneller Ballwechsel mit klarer Beinarbeit.","Ein wichtiger Punkt unter Druck.","Ein schwieriger Ball, den du kontrolliert zurückspielst."],
  "imagery-adversity":["Ein früher Doppelfehler.","Du liegst in einem Spiel zurück.","Ein Breakball gegen dich.","Du verlierst kurz den Rhythmus und findest ihn wieder."]
 },
 endurance:{
  "focus-switch":["Du bemerkst Zuschauer oder andere Athleten neben dir.","Du denkst an die bisherige Zeit statt an den aktuellen Abschnitt.","Ein Konkurrent zieht plötzlich vorbei.","Du spürst zunehmende Ermüdung.","Ein unangenehmer Gedanke über die Restdistanz taucht auf.","Kurz vor dem Start steigt die Unruhe."],
  "confidence-talk":["Ein Abschnitt fühlt sich schwerer an als geplant.","Du stehst kurz vor dem Start.","Zwei Zwischenabschnitte fühlen sich schlecht an.","Du zweifelst am geplanten Tempo.","Die Belastung steigt deutlich.","Nach einer schwierigen Phase musst du wieder Rhythmus finden."],
  "reset-reps":["Du startest einen Abschnitt zu schnell.","Dein Rhythmus bricht kurz weg.","Ein Konkurrent zieht vorbei und du reagierst hektisch.","Du ärgerst dich über eine Zwischenzeit.","Zwei harte Abschnitte folgen direkt aufeinander."],
  "imagery-senses":["Deinen kontrollierten Start.","Einen technisch sauberen Rhythmus bei höherem Tempo.","Eine schwere Rennphase mit ruhiger Atmung.","Den letzten anspruchsvollen Abschnitt mit klarem Fokus."],
  "imagery-adversity":["Der Start fühlt sich nicht perfekt an.","Ein Konkurrent zieht vorbei.","Eine Phase starker Ermüdung.","Du verlierst kurz deinen Rhythmus und baust ihn neu auf."]
 },
 strength:{
  "focus-switch":["Jemand spricht dich kurz vor deinem Satz an.","Du denkst noch an den letzten misslungenen Versuch.","Du beobachtest das Gewicht eines anderen Athleten.","Du merkst Müdigkeit vor einem schweren Satz.","Ein Zweifel an deinem Versuch taucht auf.","Kurz vor dem ersten schweren Satz steigt die Unruhe."],
  "confidence-talk":["Ein technisch einfacher Versuch misslingt.","Du stehst vor einem schweren Satz.","Zwei Versuche fühlen sich schlecht an.","Du zweifelst an deiner Technik.","Das Gewicht fühlt sich psychologisch groß an.","Nach einem Fehlversuch musst du neu aufbauen."],
  "reset-reps":["Ein Versuch misslingt.","Dein Setup ist technisch unsauber.","Du brichst einen Versuch ab.","Du erhältst direkte Kritik nach dem Satz.","Zwei schwere Versuche laufen nicht wie geplant."],
  "imagery-senses":["Ein sauberes Setup und eine kontrollierte Wiederholung.","Einen schweren Satz mit stabiler Technik.","Einen wichtigen Versuch unter Beobachtung.","Einen schwierigen Versuch, den du kontrolliert abschließt."],
  "imagery-adversity":["Ein früher Fehlversuch.","Das Gewicht fühlt sich unerwartet schwer an.","Du bist vor einem wichtigen Versuch stark angespannt.","Du verlierst kurz Vertrauen in die Technik und findest deinen Cue wieder."]
 },
 combat:{
  "focus-switch":["Das Publikum wird kurz vor der nächsten Aktion laut.","Du denkst noch an einen Treffer, den du kassiert hast.","Deine Ecke ruft mehrere Informationen gleichzeitig.","Du merkst Ermüdung in der Runde.","Der Gegner provoziert dich.","Kurz vor Rundenbeginn steigt die Unruhe."],
  "confidence-talk":["Du kassierst einen klaren Treffer.","Du gehst in eine wichtige Runde.","Zwei Aktionen hintereinander misslingen.","Du wirst defensiver als geplant.","Der Druck in der Schlussphase steigt.","Nach einer schwierigen Runde musst du neu starten."],
  "reset-reps":["Du kassierst einen Treffer.","Eine Technik misslingt.","Du gehst unnötig in einen ungünstigen Austausch.","Deine Ecke kritisiert eine Entscheidung.","Mehrere Aktionen hintereinander laufen schlecht."],
  "imagery-senses":["Eine saubere Standardkombination.","Einen schnellen Austausch mit klarer Distanz.","Eine Druckphase mit ruhiger Wahrnehmung.","Eine schwierige Situation, aus der du kontrolliert herauskommst."],
  "imagery-adversity":["Du kassierst früh einen Treffer.","Der Gegner macht starken Druck.","Vor einer entscheidenden Runde steigt Nervosität.","Du verlierst kurz Distanzgefühl und findest es wieder."]
 },
 skill:{},generic:{}
};
function localizeSportText(txt){
 const sport=state.profile.sport;
 const replacements={
  "Basketball":{"Ballverlust":"Turnover","Spielaktion":"Possession","klare Chance":"offenen Wurf","Ballannahme":"Ballannahme"},
  "Handball":{"Ballverlust":"Ballverlust","klare Chance":"freie Wurfchance","Spielaktion":"Angriffs- oder Abwehraktion"},
  "Volleyball":{"Ballverlust":"verlorenen Ballwechsel","klare Chance":"gute Angriffschance","Spielaktion":"Ballwechsel","Ballannahme":"Annahme"},
  "Hockey":{"Ballverlust":"Puckverlust","klare Chance":"Torchance","Spielaktion":"Puckaktion","Ballannahme":"Puckannahme"}
 }[sport]||{};
 let out=String(txt);Object.entries(replacements).forEach(([a,b])=>out=out.split(a).join(b));return out;
}
function getExercise(id){
 const base=exercises.find(e=>e.id===id); if(!base)return null;
 const ex=JSON.parse(JSON.stringify(base)), ctx=sportContext(), map=sportExerciseText[ctx.group]||{};
 const t=map[id];
 if(t){if(ex.situations)ex.situations=t;if(ex.rounds)ex.rounds=ex.rounds.map((r,i)=>[t[i]||r[0],r[1],r[2]])}
 if(ex.situations)ex.situations=ex.situations.map(localizeSportText);
 if(ex.rounds)ex.rounds=Array.isArray(ex.rounds)?ex.rounds.map(r=>Array.isArray(r)?[localizeSportText(r[0]),r[1],r[2]]:r):ex.rounds;
 if(ex.items)ex.items=ex.items.map(r=>[localizeSportText(r[0]),r[1]]);
 if(ex.prompts)ex.prompts=ex.prompts.map(localizeSportText);
 return ex;
}

const evidence={
 selftalk:{title:"Self-Talk",summary:"Eine Meta-Analyse mit 32 Studien und 62 Effektgrößen berichtete insgesamt einen moderaten positiven Effekt von Self-Talk-Interventionen; Training der Strategie war dabei relevant.",ref:"Hatzigeorgiadis et al. (2011), Perspectives on Psychological Science",url:"https://pubmed.ncbi.nlm.nih.gov/26167788/"},
 imagery:{title:"Imagery",summary:"Eine Meta-Analyse von 86 Studien mit 3.593 Athleten berichtete positive Effekte von Imagery-Praxis; die Autoren betonen regelmäßige Praxis und weisen auf Unterschiede zwischen Studien hin.",ref:"Liu et al. (2025), Behavioral Sciences",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC12109254/"},
 routines:{title:"Pre-Performance-Routinen",summary:"Eine Meta-Analyse mit 112 Effektgrößen fand positive Effekte von Pre-Performance-Routinen unter niedrigen und erhöhten Druckbedingungen.",ref:"Rupprecht, Tran & Gröpel (2021)",url:"https://www.tandfonline.com/doi/full/10.1080/1750984X.2021.1944271"},
 mindfulness:{title:"Mindfulness & Akzeptanz",summary:"Reviews berichten vielversprechende Effekte auf sportrelevante psychologische Faktoren, gleichzeitig bestehen Heterogenität und Bedarf an hochwertigen Studien.",ref:"Bühlmayer et al. (2017); Bühlmayer/aktuelle Reviews",url:"https://pubmed.ncbi.nlm.nih.gov/28664327/"},
 pst:{title:"Psychological Skills Training",summary:"Eine neuere systematische Review fand positive Signale für multimodales Mentaltraining, Mindfulness/Acceptance und Imagery. Sensitivitätsanalysen zeigen jedoch, dass die Evidenz nicht in allen Auswertungen stabil ist.",ref:"Reinebo et al. (2024), Sports Medicine",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC10933186/"}
};

const exercises=[
{id:"focus-switch",skill:"focus",title:"Fokus zurückholen",minutes:4,evidence:"mindfulness",desc:"6 Wiederholungen: von Ablenkung zurück zur nächsten relevanten Information.",kind:"quiz",
 rounds:[
  ["Publikum wird laut. Was ist jetzt relevant?",["Publikum","Nächste Aufgabe","Was andere denken"],1],
  ["Du denkst an die letzte Aktion.",["Letzte Aktion analysieren","Nächste Aufgabe","Ergebnis"],1],
  ["Der Trainer ruft etwas.",["Emotion des Tons","Konkrete Information","Bewertung deiner Person"],1],
  ["Du merkst Müdigkeit.",["Katastrophisieren","Körper wahrnehmen + Aufgabe wählen","Gedanken wegdrücken"],1],
  ["Ein Gegner provoziert.",["Provokation beantworten","Auf eigene Aufgabe zurück","Beweisen, dass du stärker bist"],1],
  ["Kurz vor Start.",["Alles gleichzeitig kontrollieren","Ein klarer Cue","Ausgang vorstellen"],1]
 ]},
{id:"focus-filter",skill:"focus",title:"Ablenkungen filtern",minutes:4,evidence:"mindfulness",desc:"8 schnelle Entscheidungen: relevant oder nicht relevant?",kind:"binary",
 items:[
  ["Dein Atemrhythmus vor dem Start",true],["Ein Kommentar aus dem Publikum",false],["Die nächste technische Aufgabe",true],["Was der Gegner wohl denkt",false],
  ["Ein konkretes Trainer-Signal",true],["Der Fehler von vor fünf Minuten",false],["Deine Körperspannung",true],["Der mögliche Endstand",false]
 ]},
{id:"confidence-talk",skill:"confidence",title:"Dein innerer Coach",minutes:5,evidence:"selftalk",desc:"Deinen funktionalen Satz unter sechs Drucksituationen jeweils 3× laut aussprechen.",kind:"speak",
 situations:["Ein einfacher Fehler passiert.","Du bist kurz vor einer wichtigen Aktion.","Zwei Dinge laufen hintereinander nicht.","Du merkst Selbstzweifel.","Der Druck steigt deutlich.","Du musst nach einem Rückschlag neu anfangen."]},
{id:"confidence-evidence",skill:"confidence",title:"Selbstvertrauen abrufen",minutes:4,evidence:"selftalk",desc:"Kompetenzerfahrungen mehrfach abrufen – ohne positives Wunschdenken.",kind:"evidence",
 prompts:["Eine Situation, in der du unter Druck ruhig geblieben bist.","Eine Einheit, in der du dich sichtbar verbessert hast.","Ein Moment, in dem du nach einem Fehler zurückkamst.","Eine Situation, in der Vorbereitung dir Sicherheit gab."]},
{id:"pressure-reg",skill:"composure",title:"Anspannung steuern",minutes:5,evidence:"pst",desc:"Körperspannung wahrnehmen und 5 Regulation-Reps ausführen.",kind:"breath",
 rounds:["Kiefer & Gesicht","Schultern & Hände","Atmung","Beine & Rumpf","Gesamtkörper"]},
{id:"pressure-reframe",skill:"composure",title:"Mit Druck umgehen",minutes:4,evidence:"pst",desc:"6 Wiederholungen: Druckgedanken in funktionale Handlungsorientierung übersetzen.",kind:"quiz",
 rounds:[
  ["„Ich bin zu nervös.“",["Ich muss ruhig werden.","Mein Körper stellt Energie bereit – ich wähle die nächste Aufgabe.","Das darf nicht sein."],1],
  ["„Alle erwarten etwas von mir.“",["Ich kontrolliere meine nächste Handlung.","Ich muss Erwartungen erfüllen.","Ich darf niemanden enttäuschen."],0],
  ["„Das ist zu wichtig.“",["Dann darf nichts schiefgehen.","Wichtigkeit akzeptieren, Ziel klein machen.","Besser nicht daran denken."],1],
  ["„Mein Herz schlägt schnell.“",["Gefahr.","Aktivierung wahrnehmen, Cue setzen.","Ich verliere Kontrolle."],1],
  ["„Ich muss heute beweisen, dass ich gut bin.“",["Ergebnis erzwingen.","Ziel zeigen, den ich trainiert habe.","Mehr Risiko nehmen."],1],
  ["„Was wenn es nicht läuft?“",["Szenario verhindern.","Auf kontrollierbare Reaktion vorbereiten.","Nicht vorstellen."],1]
 ]},
{id:"reset-reps",skill:"reset",title:"Nach Fehlern resetten",minutes:5,evidence:"routines",desc:"5 simulierte Fehler: lösen → Information → nächste Aktion.",kind:"reset",
 situations:["Du verpasst eine klare Gelegenheit.","Dir passiert ein technischer Fehler.","Du triffst eine schlechte Entscheidung.","Du wirst direkt nach einem Fehler kritisiert.","In einer Druckphase passieren zwei Fehler nacheinander."]},
{id:"reset-next",skill:"reset",title:"Nächste Aktion",minutes:4,evidence:"routines",desc:"Nach 6 Rückschlägen sofort eine kontrollierbare nächste Aktion wählen.",kind:"quiz",
 rounds:[
  ["Fehlentscheidung.",["Warum?","Nächste Position / Aufgabe","Ergebnis korrigieren"],1],
  ["Ungünstige Entscheidung des Schiedsrichters.",["Diskutieren","Körpersprache + nächste Aufgabe","Gedanken festhalten"],1],
  ["Gegner gelingt etwas starkes.",["Vergleichen","Eigene nächste Aktion","Tempo verlieren"],1],
  ["Eigene Technik bricht kurz weg.",["Selbstkritik","Ein technischer Cue","Alles ändern"],1],
  ["Trainer reagiert emotional.",["Ton bewerten","Information filtern","Rechtfertigen"],1],
  ["Wichtige Aktion misslingt.",["Sofort Ergebnis ausgleichen","Reset + nächste kontrollierbare Aktion","Risiko erzwingen"],1]
 ]},
{id:"thoughts-control",skill:"reset",title:"Gedanken sortieren",minutes:4,evidence:"mindfulness",desc:"8 Gedanken sortieren: kontrollierbar oder nicht – dann Handlung wählen.",kind:"control",
 items:[
  ["Wie gut der Gegner heute ist",false],["Meine Vorbereitung heute",true],["Was andere über mich denken",false],["Meine nächste Entscheidung",true],
  ["Der Ausgang des Wettkampfs",false],["Meine Körpersprache",true],["Eine vergangene Fehlentscheidung",false],["Wie konsequent ich meinen Cue nutze",true]
 ]},
{id:"thoughts-story",skill:"reset",title:"Fakt oder Kopfkino",minutes:4,evidence:"mindfulness",desc:"6 Wiederholungen: Beobachtung von Interpretation trennen.",kind:"fact",
 items:[
  ["„Ich habe zwei Aktionen verloren.“","fact"],["„Heute wird bestimmt alles schlecht.“","story"],["„Mein Herz schlägt schneller.“","fact"],
  ["„Die anderen merken, dass ich unsicher bin.“","story"],["„Ich bin gerade angespannt.“","fact"],["„Wenn ich jetzt Fehler mache, war alles umsonst.“","story"]
 ]},
{id:"imagery-senses",skill:"preparation",title:"Klar visualisieren",minutes:6,evidence:"imagery",desc:"4 mentale Wiederholungen mit Bild, Geräusch, Körpergefühl und Echtzeit.",kind:"imagery",
 situations:["Eine saubere, einfache Standardaktion.","Eine Aktion bei höherem Tempo.","Eine Situation mit Druck von außen.","Eine schwierige Situation, die du kontrolliert löst."]},
{id:"imagery-adversity",skill:"preparation",title:"Schwierige Situationen vorwegnehmen",minutes:6,evidence:"imagery",desc:"4 Wiederholungen: Schwierigkeit vorstellen und eine funktionale Reaktion mental durchspielen.",kind:"imagery2",
 situations:["Ein früher Fehler.","Ein Rückstand / ungünstiger Verlauf ohne Ergebnisfokus.","Ein Moment starker Nervosität.","Eine Phase, in der du kurz den Fokus verlierst."]},
{id:"routine-reps",skill:"preparation",title:"Start-Routine Reps",minutes:5,evidence:"routines",desc:"5 Wiederholungen: immer denselben kurzen Ablauf vor einer wichtigen Aktion oder dem Start trainieren.",kind:"routine",
 rounds:5}
];

const targetLibrary={
 focus:{
  team:["Nach einer Ablenkung richte ich mich sofort auf meine nächste relevante Aufgabe aus.","Nächste Aktion."],
  racket:["Zwischen den Punkten richte ich meine Aufmerksamkeit bewusst auf den nächsten Punkt.","Dieser Punkt."],
  endurance:["Wenn Gedanken abschweifen, kehre ich zu Rhythmus und aktuellem Abschnitt zurück.","Dieser Abschnitt."],
  strength:["Vor jedem Arbeitssatz fokussiere ich Setup und erste Bewegung.","Setup."],
  combat:["Nach Unterbrechungen richte ich mich wieder auf Distanz und nächste Aufgabe aus.","Distanz."],
  generic:["Nach Ablenkungen richte ich mich sofort auf die nächste relevante Aufgabe aus.","Nächste Aktion."]},
 confidence:{
  team:["Nach einer unsicheren Aktion treffe ich die nächste Entscheidung wieder aktiv.","Klar entscheiden."],
  racket:["Nach einem unsicheren Schlag spiele ich den nächsten Ball wieder entschlossen.","Durchziehen."],
  endurance:["In schwierigen Phasen bleibe ich bei meinem geplanten Tempo und meiner Aufgabe.","Mein Tempo."],
  strength:["Vor einem schweren Versuch vertraue ich meinem trainierten Ablauf und committe mich.","Commit."],
  combat:["Nach einer verlorenen Aktion bleibe ich aktiv und entscheide wieder klar.","Entschlossen."],
  generic:["Nach Unsicherheit treffe ich die nächste Entscheidung wieder aktiv.","Klar entscheiden."]},
 composure:{
  team:["Wenn Druck steigt, löse ich bewusst Spannung und richte mich auf die Aufgabe.","Ruhig & klar."],
  racket:["Zwischen Punkten löse ich Griff und Schultern und starte ruhig neu.","Locker greifen."],
  endurance:["Wenn Belastung steigt, halte ich Atmung, Schultern und Rhythmus funktional.","Locker & lang."],
  strength:["Vor schweren Sätzen baue ich Spannung kontrolliert statt hektisch auf.","Atmen. Setzen."],
  combat:["Unter Druck halte ich meine Wahrnehmung offen und vermeide hektische Aktionen.","Ruhige Augen."],
  generic:["Wenn Druck steigt, löse ich Spannung und richte mich auf die Aufgabe.","Ruhig & klar."]},
 reset:{
  team:["Nach einer misslungenen Aktion nehme ich höchstens eine Information mit und gehe zur nächsten Aufgabe.","Eine Info. Weiter."],
  racket:["Nach einem Fehler löse ich den letzten Punkt und richte mich auf den nächsten aus.","Nächster Punkt."],
  endurance:["Nach einer schlechten Phase akzeptiere ich sie und nehme meinen Rhythmus neu auf.","Rhythmus neu."],
  strength:["Nach einem Fehlversuch nehme ich eine technische Information mit und baue neu auf.","Neu aufbauen."],
  combat:["Nach einer verlorenen Aktion stelle ich Distanz und Aufgabe wieder her.","Distanz zurück."],
  generic:["Nach einem Fehler nehme ich eine Information mit und gehe zur nächsten Aufgabe.","Eine Info. Weiter."]},
 preparation:{
  team:["Vor wichtigen Aktionen nutze ich denselben kurzen Startablauf und eine klare erste Aufgabe.","Klar starten."],
  racket:["Vor jedem Punkt nutze ich dieselbe kurze Routine aus Ziel, Ausrichtung und Start.","Routine. Ziel. Los."],
  endurance:["Ich beginne kontrolliert und orientiere mich an meinem geplanten Rhythmus.","Mein Tempo."],
  strength:["Vor jedem Arbeitssatz nutze ich denselben Ablauf aus Setup, Spannung und Start.","Setup. Brace. Go."],
  combat:["Vor dem Start richte ich Distanz, Haltung und erste Aufgabe klar aus.","Distanz zuerst."],
  generic:["Vor wichtigen Aktionen nutze ich denselben kurzen Startablauf.","Klar starten."]}
};
function targetForSkill(skill){const g=sportContext().group, fam=["team","racket","endurance","strength","combat"].includes(g)?g:"generic";return (targetLibrary[skill]||targetLibrary.focus)[fam]}
function chooseBlockSkill(){
 const recent=state.reflections.slice(-8), scores={focus:0,confidence:0,composure:0,reset:0,preparation:0};
 const map={focus:"focus",confidence:"confidence",outside:"focus",thoughts:"focus",pressure:"composure",emotion:"composure",body:"composure",mistake:"reset",doubt:"confidence",hesitation:"confidence",rush:"preparation",forgot:"preparation",changed:"preparation"};
 recent.forEach(r=>{const s=map[r.issue];if(s)scores[s]+=r.transferRating===1?2:1});
 const preferred=(state.profile.priorities||[])[0], pm={Fokus:"focus",Selbstvertrauen:"confidence",Druck:"composure",Fehler:"reset",Vorbereitung:"preparation"};
 if(Math.max(...Object.values(scores))===0)return pm[preferred]||"focus";
 return Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
}
function currentBlock(){
 if(state.activeBlock)return state.activeBlock;
 const skill=chooseBlockSkill(), pair=targetForSkill(skill);
 state.activeBlock={id:"b"+Date.now(),skill,goal:pair[0],cue:pair[1],stage:1,started:todayKey(),readyForNewGoal:false};save();return state.activeBlock;
}
function reviewsForBlock(b){return state.reflections.filter(r=>r.blockId===b.id)}
function sessionsForBlock(b){return state.sessions.filter(s=>s.blockId===b.id)}
function blockProgress(b){const rs=reviewsForBlock(b);return {sessions:sessionsForBlock(b).length,transfers:rs.length,consistent:rs.filter(r=>r.transferRating===3).length}}
function blockExercise(b){const es=exercises.filter(e=>e.skill===b.skill);if(!es.length)return exercises[0];return es[Math.min(es.length-1,Math.max(0,(b.stage||1)-1))]}
function stageName(n){return ["","GRUNDLAGE","UNTER ABLENKUNG","SPORTNAHER TRANSFER"][n]||"STABILISIEREN"}
function evaluateBlock(b){const rs=reviewsForBlock(b).slice(-3);if(rs.length<2)return;const good=rs.filter(r=>r.transferRating===3).length,bad=rs.filter(r=>r.transferRating===1).length;if(good>=2){if((b.stage||1)<3)b.stage++;else if(reviewsForBlock(b).filter(r=>r.transferRating===3).length>=3)b.readyForNewGoal=true}else if(bad>=2)b.stage=Math.max(1,(b.stage||1)-1)}
function startNewBlock(){const old=currentBlock();state.blockHistory.push({...old,ended:todayKey()});const skill=chooseBlockSkill(),pair=targetForSkill(skill);state.activeBlock={id:"b"+Date.now(),skill,goal:pair[0],cue:pair[1],stage:1,started:todayKey(),readyForNewGoal:false};save()}
function todayBlockSession(){const b=currentBlock();return state.sessions.find(s=>s.blockId===b.id&&s.day===todayKey()&&s.origin==="daily")}
function reviewTrendSummary(b){const rs=reviewsForBlock(b).slice(-8);if(rs.length<3)return "";const issues={};rs.forEach(r=>{if(r.issue&&r.issue!=="none")issues[r.issue]=(issues[r.issue]||0)+1});const top=Object.entries(issues).sort((a,b)=>b[1]-a[1])[0];if(top&&top[1]>=2)return `Wiederkehrendes Muster: ${issueLabel(top[0])} war ${top[1]}× der Hauptstörfaktor.`;const avg=rs.reduce((s,r)=>s+r.transferRating,0)/rs.length;return avg>=2.6?"Dein Ziel wird über mehrere Einheiten zunehmend stabil umgesetzt.":"Wir sammeln weiter echte Transfers, bevor MentalEdge ein Muster behauptet."}
function issueLabel(i){return ({outside:"äußere Ablenkung",thoughts:"abschweifende Gedanken",emotion:"Frust / Ärger",pressure:"Druck / Nervosität",doubt:"Selbstzweifel",mistake:"am Fehler festgehalten",hesitation:"Zögern",rush:"Hektik",body:"Körperspannung",forgot:"Routine vergessen",changed:"vom Ablauf abgewichen"})[i]||i}

function last(arr,n=1){return arr.slice(-n)}
function todayCheck(){return state.checks.find(x=>x.day===todayKey())}
function todayPrep(){return [...state.preparations].reverse().find(x=>!x.reviewed)}
function sessionCount(skill){return state.sessions.filter(x=>x.skill===skill).length}
function skillReps(skill){return state.sessions.filter(x=>x.skill===skill).reduce((a,b)=>a+(b.reps||0),0)}
function recommendation(){
 const recent=last(state.reflections,8);
 const counts={focus:0,confidence:0,composure:0,reset:0,preparation:0};
 const issueSkill={focus:"focus",confidence:"confidence",pressure:"composure",reset:"reset",thoughts:"reset",emotion:"composure",motivation:"preparation"};
 recent.forEach(r=>{const sk=issueSkill[r.issue||r.limiter];if(sk)counts[sk]++});
 const c=todayCheck();
 if(c){if(c.tension===3)counts.composure+=2;if(c.head===3)counts.focus+=1;if(c.energy===3)counts.preparation+=1}
 let skill=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
 if(Math.max(...Object.values(counts))<2){
   const map={Fokus:"focus",Selbstvertrauen:"confidence",Druck:"composure",Fehler:"reset",Vorbereitung:"preparation",Grübeln:"reset",Visualisierung:"preparation"};
   skill=(state.profile.priorities||[]).map(x=>map[x]).filter(Boolean)[0]||"focus";
 }
 const candidates=exercises.filter(e=>e.skill===skill);
 const scored=candidates.map(e=>{const hist=state.sessions.filter(x=>x.exercise===e.id);const helpful=hist.filter(x=>x.feedback==="helpful").length;return {e,score:hist.length>=2?helpful/hist.length:0.55-hist.length*.02}}).sort((a,b)=>b.score-a.score);
 return scored[0]?.e||exercises[0];
}
function dailyPlanForToday(){return state.dailyPlans.find(x=>x.day===todayKey())}
function ensureDailyPlan(){
 if(!todayCheck())return null;
 let p=dailyPlanForToday();if(p)return p;
 const rec=recommendation();p={day:todayKey(),exerciseId:rec.id,completed:false,completedAt:null};state.dailyPlans.push(p);save();return p;
}
function todayRecommendedDone(){return !!dailyPlanForToday()?.completed}
function dailyExercise(){const p=dailyPlanForToday();return p?getExercise(p.exerciseId):null}


function renderToday(){
 if(state.profile.sport==="Noch nicht gewählt"){
   $("#todayContent").innerHTML=`<div class="hero"><span class="eyebrow">MENTALEDGE</span><h1>Welchen Sport trainierst du?</h1><p>Damit Ziel, Cue und mentale Übungen zu deinem Sport passen.</p><button class="primary full" data-action="edit-sport" style="margin-top:16px">SPORT WÄHLEN →</button></div>`;return
 }
 const b=currentBlock(),p=blockProgress(b),c=todayCheck(),daily=todayBlockSession(),prep=todayPrep(),trend=reviewTrendSummary(b),ex=blockExercise(b);
 const block=`<div class="hero coach-hero"><span class="eyebrow">AKTUELLER SCHWERPUNKT · ${stageName(b.stage||1)}</span><h1>${skills[b.skill].name}</h1><div class="target-box"><small>ZIEL</small><strong>${esc(b.goal)}</strong></div><div class="cue-focus"><small>DEIN CUE</small><b>${esc(b.cue)}</b></div><div class="mastery-row"><span>${p.sessions} Mental-Sessions</span><span>${p.transfers} Transfers</span><span>${p.consistent}× konsequent</span></div>${trend?`<div class="trend-insight"><small>MUSTER</small><p>${trend}</p></div>`:""}</div>`;
 let action="";
 if(!c){
   action=`<div class="card today-step"><span class="eyebrow">NEUER TAG · FRISCHER CHECK</span><h2>Wie ist dein Zustand heute?</h2><p>Der gestrige Check wird nicht übernommen. Dein bestehendes Ziel bleibt trotzdem bestehen.</p><button class="primary full" data-action="daily-check">CHECK-IN STARTEN →</button></div>`;
 }else if(!daily){
   action=`<div class="reco-card"><span class="eyebrow">HEUTE · ${stageName(b.stage||1)}</span><h2>${ex.title}</h2><div class="reco-meta">${ex.minutes} Min · ${exerciseRepLabel(ex)}</div><div class="why">${sportWhy(ex)}</div><div class="mini-cue">Cue · <b>${esc(b.cue)}</b></div><button class="primary full" data-action="start-exercise" data-id="${ex.id}" data-origin="daily">SESSION STARTEN →</button></div>`;
 }else if(!prep){
   action=`<div class="card today-step"><span class="eyebrow">MENTALTRAINING HEUTE ✓</span><h2>Jetzt im Sport anwenden.</h2><p>Nimm genau dieses Ziel und den Cue mit. Während der Einheit brauchst du die App nicht.</p><div class="button-row"><button class="secondary" data-action="mark-sport" data-context="training">TRAINING</button><button class="secondary" data-action="mark-sport" data-context="match">WETTKAMPF</button></div></div>`;
 }else{
   action=`<div class="card today-step"><span class="eyebrow">${prep.context==="match"?"WETTKAMPF":"TRAINING"} · ZIEL AKTIV</span><h3>${esc(b.goal)}</h3><div class="mini-cue">Cue · <b>${esc(b.cue)}</b></div><p>Nach deiner Einheit kurz zurückkommen.</p><button class="primary full" data-action="start-reflection" data-context="${prep.context}">${prep.context==="match"?"WETTKAMPF":"TRAINING"} AUSWERTEN →</button></div>`;
 }
 $("#todayContent").innerHTML=block+action+(b.readyForNewGoal?`<div class="card"><span class="eyebrow">SCHWERPUNKT STABIL</span><h3>Bereit für den nächsten Schwerpunkt.</h3><p>Erst ein neuer Check startet den nächsten Block.</p>${c?`<button class="secondary full" data-action="new-block">NEUES ZIEL FESTLEGEN →</button>`:""}</div>`:"")+`<div class="section-row"><h2>Diese Woche</h2></div>${renderWeekCard()}`;
}
function sportWhy(ex){
 const ctx=sportContext();
 const base=recommendWhy(ex.skill);
 const examples={team:"auf schnelle Spielsituationen, Gegnerdruck und die nächste Aktion",racket:"auf Punkte, Aufschlag/Return und den Neustart zwischen Ballwechseln",endurance:"auf Rhythmus, Belastungsphasen und den aktuellen Abschnitt",strength:"auf Setup, schwere Versuche und den nächsten Satz",combat:"auf Distanz, Austausch und den nächsten klaren Handlungsreiz",skill:"auf Vorbereitung, Technik-Cue und die nächste Ausführung",generic:"auf typische Situationen in deinem Sport"};
 return `${base} Die Beispiele beziehen sich ${examples[ctx.group]||examples.generic}.`;
}

function exerciseRepLabel(ex){
 if(ex.kind==="speak")return "18 laute Reps";
 if(ex.rounds)return `${Array.isArray(ex.rounds)?ex.rounds.length:ex.rounds} Reps`;
 if(ex.items)return `${ex.items.length} Reps`;
 if(ex.situations)return `${ex.situations.length} Reps`;
 if(ex.prompts)return `${ex.prompts.length} Reps`;
 return "mehrere Reps";
}
function renderDoneRecommendation(rec){
 const p=dailyPlanForToday(), s=state.sessions.find(x=>x.date===p?.completedAt)||[...state.sessions].reverse().find(x=>x.exercise===rec?.id&&x.date.slice(0,10)===todayKey()&&x.origin==="daily");
 return `<div class="card"><span class="eyebrow">TAGESZIEL ✓</span><h2>${rec?.title||"Mentaltraining"} abgeschlossen</h2><div class="score-box"><div><small>REPS</small><b>${s?.reps||0}</b></div><div><small>SKILL</small><b>${rec?skills[rec.skill].name:"–"}</b></div></div><p>Für heute ist deine geplante Mental-Session erledigt.</p></div>`;
}
function recommendWhy(skill){
 const map={
  focus:"Du trainierst, Aufmerksamkeit bewusst zurück zur relevanten Aufgabe zu lenken.",
  confidence:"Du trainierst abrufbare Kompetenz, klare Entscheidungen und funktionale Selbstgespräche.",
  composure:"Du trainierst, Aktivierung und Emotionen wahrzunehmen und handlungsfähig zu regulieren.",
  reset:"Du trainierst, nach Fehlern, störenden Gedanken oder Rückschlägen schneller neu auszurichten.",
  preparation:"Du trainierst Ziele, Routinen und mentale Vorstellungen vor der sportlichen Situation."
 };return map[skill]
}
function renderWeekCard(){
 const since=Date.now()-7*86400000, ss=state.sessions.filter(s=>new Date(s.date).getTime()>=since);
 const reps=ss.reduce((a,b)=>a+(b.reps||0),0), reviews=state.reflections.filter(r=>new Date(r.date).getTime()>=since).length;
 return `<div class="card"><div class="score-box"><div><small>MENTAL-SESSIONS</small><b>${ss.length}</b></div><div><small>REPS</small><b>${reps}</b></div><div><small>REFLEXIONEN</small><b>${reviews}</b></div></div><p class="micro">Fortschritt entsteht über regelmäßige Sessions, Wiederholungen und kurze Reviews.</p></div>`;
}

function renderPractice(){
 const b=state.profile.sport!=="Noch nicht gewählt"?currentBlock():null,c=todayCheck(),daily=b?todayBlockSession():null,rec=b?blockExercise(b):null;
 $("#practiceSummary").innerHTML=!b?`<div class="card"><h3>Erst Sport wählen</h3><p>Danach kann MentalEdge deine Übungen sportnah einordnen.</p></div>`:!c?`<div class="card"><span class="eyebrow">AKTUELLER SCHWERPUNKT</span><h3>${skills[b.skill].name}</h3><p>${esc(b.goal)}</p><div class="mini-cue">${esc(b.cue)}</div></div>`:daily?`<div class="card"><span class="eyebrow">HEUTE ERLEDIGT ✓</span><h3>${rec.title}</h3><p>Weitere Übungen sind freiwillig.</p></div>`:`<div class="reco-card"><span class="eyebrow">HEUTIGE SESSION</span><h2>${rec.title}</h2><div class="why">${sportWhy(rec)}</div><button class="primary full" data-action="start-exercise" data-id="${rec.id}" data-origin="daily">SESSION STARTEN →</button></div>`;
 $("#skillGrid").innerHTML=Object.entries(skills).map(([id,sk])=>{const reps=skillReps(id),sessions=sessionCount(id),pct=Math.min(100,reps/60*100);return `<button class="skill-card" data-action="open-skill" data-skill="${id}"><span class="icon">${sk.icon}</span><h3>${sk.name}</h3><p>${sk.desc}</p><div class="skill-meter"><i style="width:${pct}%"></i></div><small>${sessions} Sessions · ${reps} Reps</small></button>`}).join("");
}
function renderReflect(){
 const pending=todayPrep(),b=state.profile.sport!=="Noch nicht gewählt"?currentBlock():null;
 let top=pending&&b?`<div class="card"><span class="eyebrow">${pending.context==="match"?"WETTKAMPF":"TRAINING"} · OFFEN</span><h3>${esc(b.goal)}</h3><div class="mini-cue">${esc(b.cue)}</div><button class="primary full" data-action="start-reflection" data-context="${pending.context}">JETZT AUSWERTEN →</button></div>`:`<div class="card"><span class="eyebrow">AUSWERTUNG</span><h3>Nur nach echtem Training oder Wettkampf.</h3><p>Die Vorbereitung startet auf Heute. Hier sammelst du nur Transfer und Muster.</p></div>`;
 $("#insightPanel").innerHTML=top+renderInsights();
 $("#trendPanel").innerHTML=renderTrends();
}
function renderInsights(){
 const b=state.profile.sport!=="Noch nicht gewählt"?currentBlock():null;if(!b)return "";
 const rs=reviewsForBlock(b);
 if(rs.length<3)return `<div class="card"><span class="eyebrow">PERSÖNLICHE INSIGHTS</span><h3>Noch Daten sammeln</h3><p>Nach mindestens drei echten Transfers zeigt MentalEdge vorsichtige Muster.</p></div>`;
 const text=reviewTrendSummary(b);return `<div class="card"><span class="eyebrow">AKTUELLER BLOCK · ${rs.length} TRANSFERS</span><h3>${text||"Noch kein klares Muster."}</h3><p class="micro">Beobachtung aus deinen eigenen Einträgen, kein Leistungsdiagnostik-Score.</p></div>`;
}
function renderTrends(){
 const b=state.profile.sport!=="Noch nicht gewählt"?currentBlock():null;if(!b)return `<div class="card"><p>Noch kein Schwerpunkt aktiv.</p></div>`;
 const rs=reviewsForBlock(b),p=blockProgress(b),avgTransfer=rs.length?avg(rs.map(r=>r.transferRating)):null;
 return `<div class="card"><div class="score-box"><div><small>MENTAL-SESSIONS</small><b>${p.sessions}</b></div><div><small>TRANSFERS</small><b>${p.transfers}</b></div><div><small>KONSEQUENT</small><b>${p.consistent}</b></div></div><p class="micro">${avgTransfer?`Durchschnittliche Zielumsetzung: ${avgTransfer.toFixed(1)}/3. `:""}Entscheidend ist die Entwicklung über mehrere Einheiten, nicht ein einzelner Wert.</p></div>`;
}

function renderProfile(){
 $("#profileContent").innerHTML=`
 <div class="card">
   <div class="profile-row"><label>SPORTART</label><strong>${esc(state.profile.sport)}</strong><button class="text-btn" data-action="edit-sport">Ändern →</button></div>
   <div class="profile-row"><label>MENTALE SCHWERPUNKTE</label><strong>${esc((state.profile.priorities||[]).join(" · "))}</strong><button class="text-btn" data-action="edit-priorities">Ändern →</button></div>
   <div class="profile-row"><label>PERSÖNLICHER CUE</label><strong>${esc(state.customCue||"Nächste Aktion.")}</strong><button class="text-btn" data-action="edit-cue">Ändern →</button></div>
 </div>
 <div class="card"><span class="eyebrow">SCIENCE</span><h3>Evidence Center</h3><p>Was hinter den Übungen steckt – inklusive Grenzen der Evidenz.</p><button class="secondary full" data-action="open-evidence">WISSENSCHAFT ANSEHEN →</button></div>
 <div class="card"><span class="eyebrow">DATEN</span><p>Alle Daten bleiben lokal in diesem Browser.</p><button class="secondary full" data-action="export-data">DATEN EXPORTIEREN</button></div>
 <div class="notice">Hinweise zu Einsatzbereich, Datenschutz und professioneller Unterstützung findest du im Evidence Center.</div>`;
}

function renderAll(){renderToday();renderPractice();renderReflect();renderProfile()}
function renderModal(){
 if(!modal)return;
 const body=$("#modalBody");body.className="modal-body";
 if(modal.name==="daily")renderDaily(body);
 if(modal.name==="reflection")renderReflectionModal(body);
 if(modal.name==="skill")renderSkill(body);
 if(modal.name==="exercise")renderExercise(body);
 if(modal.name==="evidence")renderEvidence(body);
 if(modal.name==="journal")renderJournal(body);
 if(modal.name==="sport")renderSport(body);
 if(modal.name==="priorities")renderPriorities(body);
 if(modal.name==="cue")renderCue(body);
}

function renderDaily(body){
 const steps=[
  ["body","Wie fühlt sich dein Körper an?","",["frisch","normal","schwer"]],
  ["energy","Wie ist deine Energie?","",["voll","okay","leer"]],
  ["head","Wie ist dein Kopf?","",["ruhig","beschäftigt","voll"]],
  ["tension","Wie passend ist deine Aktivierung?","",["passend","etwas daneben","deutlich daneben"]]
 ];
 if(!draft)draft={step:0,data:{}};
 const s=steps[draft.step];setProgress(draft.step+1,steps.length);
 body.innerHTML=`<span class="eyebrow">DAILY CHECK · ${draft.step+1}/${steps.length}</span><h1 class="modal-title">${s[1]}</h1>${s[2]?`<p class="modal-sub">${s[2]}</p>`:""}<div class="choices">${s[3].map((x,i)=>`<button class="choice" data-action="daily-value" data-value="${i+1}">${x}</button>`).join("")}</div>`;
}
function renderReflectionModal(body){
 if(!draft)return;const b=currentBlock(),match=draft.context==="match",needsDeep=draft.transferRating<3&&draft.issue&&draft.issue!=="none";
 const steps=match?(needsDeep?["goal","pressure","issue","deep","finish"]:["goal","pressure","issue","finish"]):(needsDeep?["goal","issue","deep","finish"]:["goal","issue","finish"]),step=steps[draft.step];setProgress(draft.step+1,steps.length);
 if(step==="goal")body.innerHTML=`<span class="eyebrow">${match?"WETTKAMPF":"TRAINING"} · AUSWERTEN</span><h1 class="modal-title">Wie konsequent hast du dein Ziel umgesetzt?</h1><div class="review-target"><small>ZIEL</small><p>${esc(b.goal)}</p><small>CUE · ${esc(b.cue)}</small></div><div class="choices">${[[1,"selten"],[2,"teilweise"],[3,"konsequent"]].map(x=>`<button class="choice" data-action="review-goal" data-value="${x[0]}">${x[1]}</button>`).join("")}</div>`;
 else if(step==="pressure")body.innerHTML=scalePage("WETTKAMPF · KONTEXT","Wie viel Druck hast du wahrgenommen?","Nur Kontext – keine Leistungsnote.","pressure");
 else if(step==="issue"){const opts=issueOptions(b.skill);body.innerHTML=`<span class="eyebrow">KURZ EINORDNEN</span><h1 class="modal-title">Was hat die Umsetzung am ehesten gestört?</h1><p class="modal-sub">Wähle nur den wichtigsten Punkt.</p><div class="choices">${opts.map(x=>`<button class="choice" data-action="review-issue" data-value="${x[0]}">${x[1]}</button>`).join("")}</div>`}
 else if(step==="deep"){const q=adaptiveQuestion(b.skill,draft.issue);if(!q){draft.step++;return renderReflectionModal(body)}body.innerHTML=`<span class="eyebrow">1 ZUSATZFRAGE</span><h1 class="modal-title">${q[0]}</h1><div class="choices">${q[1].map((x,i)=>`<button class="choice" data-action="review-deep" data-value="${i}">${x}</button>`).join("")}</div>`}
 else {const saved=state.reflections.find(r=>r.date===draft.savedDate),rec=saved?.optionalExerciseId?getExercise(saved.optionalExerciseId):null;body.innerHTML=`<span class="eyebrow">GESPEICHERT ✓</span><h1 class="modal-title">${draft.transferRating===3?"Ziel konsequent umgesetzt.":draft.transferRating===2?"Teilweise umgesetzt.":"Transfer heute schwierig."}</h1><div class="card"><small>WAS MENTALLEDGE MITNIMMT</small><p>${draft.transferRating===3?"Der Schwerpunkt wird weiter stabilisiert.":`Der Schwerpunkt bleibt aktiv. Hauptthema: ${issueLabel(draft.issue)}.`}</p></div>${rec?`<div class="card"><span class="eyebrow">OPTIONAL · AUS DIESER AUSWERTUNG</span><h3>${rec.title}</h3><p>${sportWhy(rec)}</p><button class="secondary full" data-action="finish-reflection-and-practice" data-id="${rec.id}" data-ref="${saved.date}">OPTIONAL ÜBEN →</button></div>`:""}<div class="modal-footer"><button class="primary full" data-action="close-modal">FERTIG</button></div>`}
}
function saveReflectionFromDraft(){
 if(draft.savedDate)return;const bl=currentBlock(),opt=(draft.transferRating<3||draft.issue!=="none")?exerciseForIssue(draft.issue):null;
 const rec={date:new Date().toISOString(),day:todayKey(),context:draft.context,blockId:bl.id,skill:bl.skill,goal:bl.goal,cue:bl.cue,transferRating:draft.transferRating,pressure:draft.context==="match"?draft.pressure:null,issue:draft.issue||"none",deepAnswer:draft.deepAnswer||null,optionalExerciseId:opt?.id||null,optionalDone:false};
 state.reflections.push(rec);draft.savedDate=rec.date;const p=state.preparations.find(x=>x.date===draft.prep?.date);if(p)p.reviewed=true;evaluateBlock(bl);save();renderAll();
}
function exerciseForIssue(i){
 const map={focus:"focus",confidence:"confidence",pressure:"composure",reset:"reset",thoughts:"reset",emotion:"composure",motivation:"preparation"};
 if(!map[i])return null;
 return exercises.find(e=>e.skill===map[i]);
}
function scalePage(kicker,title,sub,key){
 return `<span class="eyebrow">${kicker}</span><h1 class="modal-title">${title}</h1><p class="modal-sub">${sub}</p><div class="scale">${[1,2,3,4,5].map(n=>`<button data-action="reflection-value" data-key="${key}" data-value="${n}">${n}</button>`).join("")}</div><div class="scale-labels"><span>niedrig</span><span>hoch</span></div>`;
}

function renderSkill(body){
 const s=skills[modal.skill], es=exercises.filter(e=>e.skill===modal.skill);
 setProgress(1,1);
 body.innerHTML=`<span class="eyebrow">${s.icon} ${sportContext().label.toUpperCase()} · MENTAL SKILL</span><h1 class="modal-title">${s.name}</h1><p class="modal-sub">${s.desc}</p><div class="card"><span class="eyebrow">DEIN TRAINING</span><h3>${sessionCount(modal.skill)} Sessions · ${skillReps(modal.skill)} Reps</h3></div>${es.map(e=>`<button class="exercise-row" data-action="start-exercise" data-id="${e.id}"><b>${e.title}</b><span>${e.desc}</span><small>${e.minutes} Min →</small></button>`).join("")}`;
}
function exerciseInstruction(ex){
 const map={
  quiz:"Lies jede Sportsituation. Entscheide dich einmal klar für die funktionalste Reaktion. Danach kommt sofort die nächste Wiederholung.",
  binary:"Ordne jede Information schnell als relevant oder irrelevant für deine nächste sportliche Aufgabe ein.",
  speak:"Stell dir jede Situation kurz vor. Sprich deinen persönlichen Cue dreimal hörbar aus und bestätige jede Wiederholung per Tap.",
  evidence:"Ruf vier echte Situationen aus deiner Sporterfahrung ab und ordne jeweils zu, was du selbst dazu beigetragen hast.",
  breath:"Scanne fünf Körperbereiche. Pro Bereich drei bewusste Ausatmungen mit aktivem Lösen der Spannung.",
  reset:"Bearbeite fünf typische Sportfehler. Jeder Rep besteht aus Lösen, einer Information und einer klaren nächsten Aktion.",
  control:"Entscheide bei acht Gedanken schnell: direkt beeinflussbar oder nicht. Ziel ist schnelleres Umschalten auf Handlungen.",
  fact:"Trenne sechs Aussagen in Beobachtung oder Interpretation. Das trainiert Abstand zu automatischen Gedanken.",
  imagery:"Führe vier mentale Wiederholungen mit Bild, Geräusch, Körpergefühl und realistischem Timing durch.",
  imagery2:"Stell dir vier schwierige Sportsituationen vor und probe jeweils bewusst eine gute Reaktion darauf.",
  routine:"Trainiere dieselbe kurze Start-Routine fünfmal hintereinander, damit sie vor wichtigen Aktionen leichter abrufbar wird."
 };return map[ex.kind]||"Führe mehrere klare Wiederholungen aus."
}


const cueLibrary={
 team:{
  focus:["Nächste Aktion","Scannen. Entscheiden.","Ball & Raum","Jetzt verteidigen"],
  confidence:["Klar entscheiden","Mutig spielen","Erster Gedanke","Ich bin bereit"],
  composure:["Locker bleiben","Ruhig & klar","Ausatmen. Weiter.","Tempo im Kopf"],
  reset:["Neu.","Weiter.","Nächster Ball","Eine Info. Weiter."],
  preparation:["Erster Kontakt","Klar starten","Mein Plan","Einfach beginnen"]
 },
 racket:{
  focus:["Dieser Punkt","Ball früh sehen","Beine zuerst","Ziel & Ball"],
  confidence:["Durchziehen","Klar schlagen","Meinem Schlag vertrauen","Aktiv bleiben"],
  composure:["Locker greifen","Lang ausatmen","Ruhig zwischen Punkten","Tempo raus"],
  reset:["Nächster Punkt","Neu.","Lösen. Ausrichten.","Eine Info."],
  preparation:["Routine. Ziel. Los.","Erster Ball","Klarer Start","Mein Muster"]
 },
 endurance:{
  focus:["Dieser Abschnitt","Rhythmus","Technik jetzt","Bis zur nächsten Marke"],
  confidence:["Mein Tempo","Ich kann das halten","Stark & ruhig","Weiter arbeiten"],
  composure:["Locker & lang","Atmung finden","Schultern lösen","Ruhig drücken"],
  reset:["Rhythmus neu","Weiter.","Nächste Marke","Zurück zur Technik"],
  preparation:["Kontrolliert starten","Mein Tempo","Geduldig","Plan fahren"]
 },
 strength:{
  focus:["Setup","Spannung","Eine Wiederholung","Position halten"],
  confidence:["Commit","Explosiv","Ich kenne den Lift","Durchziehen"],
  composure:["Atmen. Setzen.","Locker bis zum Setup","Ruhig aufbauen","Kontrolle"],
  reset:["Neu aufbauen","Eine Info","Nächster Versuch","Reset"],
  preparation:["Setup. Brace. Go.","Position zuerst","Mein Ablauf","Sauber starten"]
 },
 combat:{
  focus:["Distanz","Hände & Hüfte","Nächste Aktion","Sehen. Reagieren."],
  confidence:["Entschlossen","Mein Timing","Aktiv bleiben","Commit"],
  composure:["Locker sehen","Atmen","Ruhige Augen","Nicht hetzen"],
  reset:["Neu.","Distanz zurück","Nächster Austausch","Eine Info."],
  preparation:["Distanz zuerst","Mein Rhythmus","Klar starten","Erste Aufgabe"]
 },
 general:{
  focus:["Nächste Aktion","Jetzt","Aufgabe","Sehen. Entscheiden."],
  confidence:["Klar entscheiden","Ich bin bereit","Commit","Meinem Training vertrauen"],
  composure:["Ruhig & klar","Ausatmen","Locker","Tempo im Kopf"],
  reset:["Neu.","Weiter.","Eine Info. Weiter.","Nächste Aktion"],
  preparation:["Mein Plan","Klar starten","Erste Aufgabe","Routine. Los."]
 }
};
function cueOptions(skill){
 const f=typeof sportFamily==="function"?sportFamily(state.profile.sport||""):"general";
 return cueLibrary[f]?.[skill]||cueLibrary.general[skill]||cueLibrary.general.focus;
}
function cuePurpose(skill){
 const p={
  focus:"Ein Fokus-Cue lenkt den Kopf auf etwas, das du jetzt tun kannst.",
  confidence:"Ein Confidence-Cue soll keine Magie behaupten. Er erinnert dich an eine hilfreiche Haltung oder Entscheidung.",
  composure:"Ein Ruhe-Cue koppelt ein kurzes Wort an eine konkrete Regulationshandlung.",
  reset:"Ein Reset-Cue beendet nicht den Gedanken – er markiert den Wechsel zurück zur nächsten Aufgabe.",
  preparation:"Ein Start-Cue erinnert dich an den ersten Schritt deines Ablaufs."
 };return p[skill]||p.focus;
}
function cuePicker(skill,selected){
 const opts=cueOptions(skill);
 return `<div class="card cue-card"><span class="eyebrow">CUE-VORSCHLÄGE</span><p>${cuePurpose(skill)}</p><div class="pill-grid">${opts.map(c=>`<button class="pill ${selected===c?"selected":""}" data-action="pick-cue" data-value="${esc(c)}">${esc(c)}</button>`).join("")}</div><small>Du musst keinen Cue erfinden. Kurz, glaubwürdig und handlungsnah reicht.</small></div>`;
}

function exercisePlain(ex){
 const map={
  "focus-switch":["Du übst, deine Aufmerksamkeit nach einer Ablenkung wieder auf die nächste wichtige Aufgabe zu richten.","ABLENKUNG → RELEVANT → NÄCHSTE AKTION"],
  "focus-filter":["Du entscheidest schnell, was für deine aktuelle sportliche Aufgabe wichtig ist und was du loslassen kannst.","SIGNAL → FILTERN → FOKUS"],
  "confidence-talk":["Du sprichst deinen persönlichen Satz in mehreren Drucksituationen laut aus, damit er leichter abrufbar wird.","SITUATION → CUE LAUT → HANDELN"],
  "confidence-evidence":["Du rufst echte Situationen ab, in denen du etwas gut gelöst hast, und verknüpfst sie mit deinem eigenen Beitrag.","ERFAHRUNG → EIGENER BEITRAG → VERTRAUEN"],
  "pressure-reg":["Du bemerkst Körperspannung und übst mehrmals, sie gezielt zu verändern.","WAHRNEHMEN → AUSATMEN → LÖSEN"],
  "pressure-reframe":["Du übst, Druck nicht wegzudenken, sondern deine Aufmerksamkeit auf eine kontrollierbare Handlung zu richten.","DRUCK → EINORDNEN → AUFGABE"],
  "reset-reps":["Du trainierst nach simulierten Fehlern immer denselben kurzen Ablauf: lösen, eine Information mitnehmen, weiter.","FEHLER → LÖSEN → INFO → WEITER"],
  "reset-next":["Du übst, nach einer Störung sofort eine konkrete nächste Aktion auszuwählen.","STÖRUNG → RESET → NÄCHSTE AKTION"],
  "thoughts-control":["Du trennst kontrollierbare von nicht kontrollierbaren Gedanken und wechselst zurück zu einer Handlung.","GEDANKE → KONTROLLE? → HANDLUNG"],
  "thoughts-story":["Du lernst, eine direkte Beobachtung von einer Interpretation deines Kopfes zu unterscheiden.","BEOBACHTUNG → PRÜFEN → EINORDNEN"],
  "imagery-senses":["Du stellst eine sportliche Aktion mehrfach mit Umgebung, Geräusch, Körpergefühl und Bewegung in Echtzeit vor.","SEHEN → HÖREN → FÜHLEN → AUSFÜHREN"],
  "imagery-adversity":["Du stellst eine schwierige sportliche Situation vor und probst mental eine funktionale Reaktion.","SCHWIERIGKEIT → REAKTION → WEITER"]
 };return map[ex.id]||[ex.desc,"VERSTEHEN → ÜBEN → WIEDERHOLEN"];
}
function sportExample(ex){
 const sport=state.profile.sport||"deinem Sport",f=typeof sportFamily==="function"?sportFamily(sport):"general";
 const x={
  team:{"focus-switch":"Nach Ballverlust, Fehlpass oder Unterbrechung: zurück auf Raum, Mitspieler und nächste Aufgabe.","confidence-talk":"Nach einer misslungenen Aktion oder vor einer wichtigen Spielsituation deinen Cue laut trainieren.","reset-reps":"Fehlpass, verlorener Zweikampf oder Kritik – danach denselben Reset-Ablauf üben.","imagery-senses":"Eine typische Spielsituation in deinem Tempo und aus deiner Perspektive durchspielen."},
  racket:{"focus-switch":"Nach einem Punkt: den letzten Ballwechsel lösen und auf Aufschlag, Return und nächsten Punkt richten.","reset-reps":"Nach Doppelfehler oder leichtem Fehler: lösen, Information, nächster Punkt.","imagery-senses":"Aufschlag, Return oder Ballwechsel aus deiner echten Perspektive visualisieren."},
  strength:{"focus-switch":"Vor einem Satz: auf Setup, Spannung und den ersten Bewegungsabschnitt fokussieren.","reset-reps":"Nach einem Fehlversuch: lösen, eine technische Information mitnehmen, nächsten Versuch vorbereiten.","imagery-senses":"Setup, Spannung, Bewegung und Abschluss eines schweren Versuchs in Echtzeit vorstellen."},
  endurance:{"focus-switch":"Wenn Gedanken abschweifen: zurück zu Rhythmus, Technik und aktuellem Abschnitt.","reset-reps":"Nach einer schlechten Phase: akzeptieren, eine Information wählen, Rhythmus neu aufnehmen.","imagery-senses":"Einen anspruchsvollen Abschnitt mit Tempo, Atmung und Körpergefühl mental durchlaufen."},
  combat:{"focus-switch":"Nach Treffer oder Unterbrechung: zurück zu Distanz, Haltung und nächster Aufgabe.","reset-reps":"Nach einer verlorenen Aktion: lösen, Information aufnehmen, wieder in die eigene Aufgabe kommen.","imagery-senses":"Eine typische Angriffs-/Verteidigungssituation in realem Tempo vorstellen."}
 };return (x[f]&&x[f][ex.id])||`Übertrage die Wiederholung auf eine typische Situation aus ${sport}.`;
}

function sportScene(ex){
 const f=typeof sportFamily==="function"?sportFamily(state.profile.sport||""):"general";
 const label={team:"SPIELFELD",racket:"COURT",endurance:"STRECKE",strength:"SETUP",combat:"AKTIONSRAUM",general:"SPORTSITUATION"}[f];
 const nodes={
  "focus-switch":["ABLENKUNG","AUFGABE","AKTION"],
  "reset-reps":["FEHLER","INFO","WEITER"],
  "confidence-talk":["DRUCK","CUE","AKTION"],
  "pressure-reg":["SPANNUNG","ATEM","LÖSEN"],
  "imagery-senses":["SZENE","KÖRPER","AKTION"]
 }[ex.id]||["SITUATION","ENTSCHEIDUNG","AKTION"];
 return `<div class="sport-scene"><div class="scene-label">${label}</div>${nodes.map((n,i)=>`<div class="scene-node n${i+1}"><span>${n}</span></div>`).join("")}<svg viewBox="0 0 320 120" aria-hidden="true"><path d="M65 62 C120 18, 190 105, 258 58" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5 6"/><path d="M250 50 L265 58 L251 68" fill="none" stroke="currentColor" stroke-width="2"/></svg></div>`;
}

function visualStrip(text){const parts=text.split("→");return `<div class="visual-strip">${parts.map((x,i)=>`<span>${esc(x.trim())}</span>${i<parts.length-1?`<b>→</b>`:""}`).join("")}</div>`;}

function renderExercise(body){
 const ex=getExercise(modal.id);
 if(!draft)draft={phase:"intro",round:0,reps:0,correct:0,total:0,feedback:null,cue:state.customCue||"Nächste Aktion.",substep:0,selected:[]};
 if(draft.phase==="intro"){
  setProgress(0,1);const plain=exercisePlain(ex),total=exerciseRepLabel(ex);
  body.innerHTML=`<span class="eyebrow">${skills[ex.skill].icon} ${skills[ex.skill].name.toUpperCase()}</span><h1 class="modal-title">${ex.title}</h1><p class="modal-sub">${plain[0]}</p>${sportScene(ex)}${visualStrip(plain[1])}${["focus","confidence","composure","reset","preparation"].includes(ex.skill)?cuePicker(ex.skill,draft.cue||state.customCue||cueOptions(ex.skill)[0]):""}<div class="card"><span class="eyebrow">BEISPIEL AUS DEINEM SPORT</span><p>${sportExample(ex)}</p></div><div class="card"><span class="eyebrow">SO GEHT'S</span><h3>${total}</h3><p>Bearbeite jede Situation nacheinander. Lies kurz, führe die Aufgabe wirklich aus und bestätige erst danach den Rep.</p></div><div class="modal-footer"><button class="primary full" data-action="exercise-begin">LOS GEHT'S →</button><button class="text-btn" data-action="exercise-evidence">Warum diese Übung?</button></div>`;return
 }
 if(draft.phase==="feedback"){renderExerciseFeedback(body,ex);return}
 if(ex.kind==="quiz")renderQuizExercise(body,ex);
 if(ex.kind==="binary")renderBinaryExercise(body,ex);
 if(ex.kind==="speak")renderSpeakExercise(body,ex);
 if(ex.kind==="evidence")renderEvidenceRecall(body,ex);
 if(ex.kind==="breath")renderBreathExercise(body,ex);
 if(ex.kind==="reset")renderResetExercise(body,ex);
 if(ex.kind==="control")renderControlExercise(body,ex);
 if(ex.kind==="fact")renderFactExercise(body,ex);
 if(ex.kind==="imagery")renderImageryExercise(body,ex,false);
 if(ex.kind==="imagery2")renderImageryExercise(body,ex,true);
 if(ex.kind==="routine")renderRoutineExercise(body,ex);
}
function prog(ex,total){setProgress(draft.round+1,total)}
function finishExercise(ex,reps){draft.reps=reps??draft.reps;draft.phase="feedback";renderExercise($("#modalBody"))}
function renderQuizExercise(body,ex){
 prog(ex,ex.rounds.length);const r=ex.rounds[draft.round];
 body.innerHTML=`<span class="round-count">REP ${draft.round+1} / ${ex.rounds.length}</span><div class="round-card"><h2>${r[0]}</h2><p>Wähle die Antwort, die dich am klarsten zurück in eine kontrollierbare Handlung bringt.</p></div><div class="choices">${r[1].map((x,i)=>`<button class="choice" data-action="quiz-answer" data-index="${i}">${x}</button>`).join("")}</div>`;
}
function renderBinaryExercise(body,ex){
 prog(ex,ex.items.length);const r=ex.items[draft.round];
 body.innerHTML=`<span class="round-count">REP ${draft.round+1} / ${ex.items.length}</span><div class="round-card"><h2>${r[0]}</h2><p>Ist diese Information für deine unmittelbare Aufgabe relevant?</p></div><div class="button-row"><button class="secondary" data-action="binary-answer" data-value="false">IRRELEVANT</button><button class="primary" data-action="binary-answer" data-value="true">RELEVANT</button></div>`;
}
function renderSpeakExercise(body,ex){
 prog(ex,ex.situations.length);const sit=ex.situations[draft.round], rep=draft.substep||0;
 body.innerHTML=`<span class="round-count">SITUATION ${draft.round+1} / ${ex.situations.length}</span><div class="round-card"><h2>${sit}</h2><p>Stell dir die Situation kurz vor. Dann sprich deinen Cue hörbar aus – nicht nur im Kopf.</p><div class="cue">„${esc(draft.cue)}“</div><div class="rep-track">${[0,1,2].map(i=>`<i class="rep-dot ${i<rep?"done":""}"></i>`).join("")}</div><button class="speak" data-action="speak-rep">LAUT GESAGT · ${rep}/3</button></div><button class="text-btn" data-action="edit-cue-in-exercise">Cue ändern</button>`;
}
function renderEvidenceRecall(body,ex){
 prog(ex,ex.prompts.length);const p=ex.prompts[draft.round];
 body.innerHTML=`<span class="round-count">RECALL ${draft.round+1} / ${ex.prompts.length}</span><div class="round-card"><h2>${p}</h2><p>Ruf den Moment konkret ab: Ort, Körpergefühl, was du selbst getan hast. Kein Wunschdenken – eine echte Erfahrung.</p></div><div class="choices">${["Vorbereitung","Mut","Technik","Geduld","Entscheidung","Einsatz"].map(x=>`<button class="choice" data-action="evidence-choice">${x}</button>`).join("")}</div>`;
}
function renderBreathExercise(body,ex){
 prog(ex,ex.rounds.length);const area=ex.rounds[draft.round], rep=draft.substep||0;
 body.innerHTML=`<span class="round-count">REGULATION ${draft.round+1} / ${ex.rounds.length}</span><div class="round-card"><h2>${area}</h2><p>Wahrnehmen → ausatmen → Spannung bewusst reduzieren. Drei kontrollierte Wiederholungen.</p><div class="breath-orb">${rep<3?"AUSATMEN":"FERTIG"}</div><div class="rep-track">${[0,1,2].map(i=>`<i class="rep-dot ${i<rep?"done":""}"></i>`).join("")}</div><button class="primary full" data-action="breath-rep">${rep<3?"ATEMZUG + LÖSEN":"NÄCHSTER BEREICH →"}</button></div>`;
}
function renderResetExercise(body,ex){
 prog(ex,ex.situations.length);const sit=ex.situations[draft.round], ss=draft.substep||0;
 const labels=[
  ["1 · RELEASE","Einmal lang ausatmen. Schultern/Hände lösen.","GELÖST"],
  ["2 · INFO","Nur eine Information mitnehmen. Keine Selbstbewertung.","INFO KLAR"],
  ["3 · NEXT","Eine kontrollierbare nächste Aktion wählen.","NÄCHSTE AKTION KLAR"]
 ];
 const x=labels[ss];
 body.innerHTML=`<span class="round-count">RESET ${draft.round+1} / ${ex.situations.length}</span><div class="round-card"><h2>${sit}</h2><span class="eyebrow">${x[0]}</span><p>${x[1]}</p>${ss===2?`<div class="cue">„${esc(state.customCue||"Nächste Aktion.")}“</div>`:""}<button class="primary full" data-action="reset-step">${x[2]} →</button></div>`;
}
function renderControlExercise(body,ex){
 prog(ex,ex.items.length);const r=ex.items[draft.round],ctx=sportContext();
 if(draft.awaitShift){
  body.innerHTML=`<span class="round-count">SHIFT ${draft.round+1} / ${ex.items.length}</span><div class="round-card"><h2>Zurück zu dem, was du steuern kannst.</h2><p>Wähle jetzt bewusst deinen nächsten Fokus.</p></div><div class="choices"><button class="choice" data-action="control-shift">Nächste ${ctx.action}</button><button class="choice" data-action="control-shift">Körpersprache & Atmung</button><button class="choice" data-action="control-shift">Mein Cue: „${esc(state.customCue||"Nächste Aktion.")}"</button></div>`;return
 }
 body.innerHTML=`<span class="round-count">REP ${draft.round+1} / ${ex.items.length}</span><div class="round-card"><h2>${r[0]}</h2><p>Kannst du das direkt beeinflussen?</p></div><div class="button-row"><button class="secondary" data-action="control-answer" data-value="false">NEIN</button><button class="primary" data-action="control-answer" data-value="true">JA</button></div>`;
}
function renderFactExercise(body,ex){
 prog(ex,ex.items.length);const r=ex.items[draft.round];
 body.innerHTML=`<span class="round-count">REP ${draft.round+1} / ${ex.items.length}</span><div class="round-card"><h2>${r[0]}</h2><p>Ist das eine direkte Beobachtung oder eine Geschichte/Interpretation deines Kopfes?</p></div><div class="button-row"><button class="secondary" data-action="fact-answer" data-value="story">STORY</button><button class="primary" data-action="fact-answer" data-value="fact">FAKT</button></div>`;
}
function renderImageryExercise(body,ex,adversity){
 prog(ex,ex.situations.length);const sit=ex.situations[draft.round], ss=draft.substep||0;
 const steps=adversity?["Situation deutlich vorstellen","Schwierigkeit wirklich zulassen","Funktionale Reaktion in Echtzeit sehen","Körpergefühl + Cue hinzufügen"]:["Bild möglichst konkret","Geräusche / Umgebung ergänzen","Körpergefühl hinzufügen","Bewegung in Echtzeit durchspielen"];
 body.innerHTML=`<span class="round-count">MENTAL REP ${draft.round+1} / ${ex.situations.length}</span><div class="round-card"><h2>${sit}</h2><span class="eyebrow">SCHRITT ${ss+1}/4</span><p>${steps[ss]}</p><button class="primary full" data-action="imagery-step">GEMACHT →</button></div>`;
}
function renderRoutineExercise(body,ex){
 const ctx=sportContext(), total=ex.rounds||5, r=draft.round||0, ss=draft.substep||0;
 prog(ex,total);const steps=[`Stand / Ausgangsposition für ${ctx.action} einnehmen`,`Einmal bewusst ausatmen`,`Blick auf den wichtigsten Reiz richten`,`Cue „${esc(state.customCue||"Nächste Aktion.")}" hörbar sagen`,`Aktion im Kopf klar starten`];
 body.innerHTML=`<span class="round-count">ROUTINE ${r+1} / ${total}</span><div class="round-card"><h2>${steps[ss]}</h2><p>Wiederhole den Ablauf jedes Mal in derselben Reihenfolge. Ziel ist ein stabiler, abrufbarer Start.</p><button class="primary full" data-action="routine-step">GEMACHT →</button></div>`;
}
function renderExerciseFeedback(body,ex){
 setProgress(1,1);
 let result="";
 if(draft.total) result=`<div class="card"><span class="eyebrow">ÜBUNGSERGEBNIS</span><h3>${draft.correct}/${draft.total} klare Entscheidungen</h3><p>Du hast ${draft.total} Situationen bearbeitet und ${draft.correct} davon passend eingeordnet.</p></div>`;
 else if(ex.kind==="speak") result=`<div class="card"><span class="eyebrow">ÜBUNGSERGEBNIS</span><h3>${draft.reps} laute Wiederholungen</h3><p>Dein Cue „${esc(draft.cue)}“ wurde unter ${ex.situations.length} unterschiedlichen Situationen wiederholt.</p></div>`;
 else result=`<div class="card"><span class="eyebrow">ÜBUNGSERGEBNIS</span><h3>${draft.reps} vollständige Reps</h3><p>Du hast den Ablauf ${draft.reps}× vollständig trainiert.</p></div>`;
 body.innerHTML=`<div class="complete-mark">✓</div><span class="eyebrow">SESSION GESCHAFFT</span><h1 class="modal-title">${ex.title}</h1>${result}<div class="card"><span class="eyebrow">WAS DU TRAINIERT HAST</span><p>${exercisePlain(ex)[0]}</p><p class="transfer"><b>Transfer:</b> Im Sport nutzt du den Ablauf als kurze Erinnerung – nicht als Bewertung deiner Leistung.</p><div class="skill-meter"><i style="width:${Math.min(100,(skillReps(ex.skill)+draft.reps)/60*100)}%"></i></div><small>${skillReps(ex.skill)+draft.reps} Reps in ${skills[ex.skill].name}</small></div><h3>Wie passend war die Übung für dich?</h3><div class="choices"><button class="choice" data-action="exercise-feedback" data-value="helpful">Hilfreich</button><button class="choice" data-action="exercise-feedback" data-value="neutral">Neutral</button><button class="choice" data-action="exercise-feedback" data-value="notfit">Nicht passend</button></div>`;
}

function renderEvidence(body){
 setProgress(1,1);
 body.innerHTML=`<span class="eyebrow">MENTALEDGE SCIENCE</span><h1 class="modal-title">Evidenz, ohne Marketing-Tricks.</h1><p class="modal-sub">MentalEdge ist evidenzinformiert. Forschung zeigt vielversprechende Effekte verschiedener sportpsychologischer Interventionen, aber nicht jede Methode wirkt bei jedem Athleten gleich und die Studienqualität ist unterschiedlich.</p>${Object.values(evidence).map(e=>`<div class="evidence-card"><b>${e.title}</b><p>${e.summary}</p><a href="${e.url}" target="_blank" rel="noopener">${e.ref} ↗</a></div>`).join("")}<div class="notice">Wir formulieren persönliche Muster als Beobachtungen aus deinen eigenen Einträgen. MentalEdge behauptet daraus keine Ursache und stellt keine psychologische Diagnose.</div>`;
}
function renderJournal(body){
 setProgress(1,1);
 const rs=[...state.reflections].reverse();
 body.innerHTML=`<span class="eyebrow">JOURNAL</span><h1 class="modal-title">Deine Reflexionen</h1><p class="modal-sub">Archiv – nicht Mittelpunkt der App.</p>${rs.length?rs.map(r=>`<div class="journal-item"><b>${r.context==="match"?"Wettkampf":"Training"} · ${new Date(r.date).toLocaleDateString("de-DE")}</b><small>Fokus ${r.presence}/5 · ${r.context==="match"?`Druck ${r.pressure||"–"}/5 · Confidence ${r.confidence||"–"}/5 · Reset ${r.reset||"–"}/5`:`Belastung ${r.load||"–"}/5`}</small>${r.goals?.length?`<p>${r.goals.map((g,i)=>`${esc(g)}: ${(r.goalRatings||[])[i]||"–"}/3`).join("<br>")}</p>`:""}</div>`).join(""):`<div class="card"><p>Noch keine Einträge.</p></div>`}`;
}
function renderSport(body){
 const opts=["Fußball","Basketball","Handball","Volleyball","Hockey","Tennis / Racketsport","Laufen / Ausdauer","Radsport","Schwimmen","Kraftsport","Kampfsport","Turnen / Akrobatik","Andere"];
 setProgress(1,1);body.innerHTML=`<span class="eyebrow">SPORTART</span><h1 class="modal-title">Was ist dein Sport?</h1><p class="modal-sub">Die Kernübungen bleiben sportartenübergreifend.</p><div class="choices">${opts.map(x=>`<button class="choice" data-action="choose-sport" data-value="${x}">${x}</button>`).join("")}</div>`;
}
function renderPriorities(body){
 if(!draft)draft={values:[...(state.profile.priorities||[])]};
 const opts=["Fokus","Selbstvertrauen","Druck","Fehler","Vorbereitung"];
 setProgress(1,1);body.innerHTML=`<span class="eyebrow">SCHWERPUNKTE</span><h1 class="modal-title">Woran willst du arbeiten?</h1><p class="modal-sub">Wähle bis zu drei Bereiche.</p><div class="pill-grid">${opts.map(x=>`<button class="pill ${draft.values.includes(x)?"selected":""}" data-action="toggle-priority" data-value="${x}">${x}</button>`).join("")}</div><div class="modal-footer"><button class="primary full" data-action="save-priorities">SPEICHERN</button></div>`;
}
function renderCue(body){
 setProgress(1,1);body.innerHTML=`<span class="eyebrow">PERSÖNLICHER CUE</span><h1 class="modal-title">Kurz. Funktional. Abrufbar.</h1><p class="modal-sub">Nur hier ist Text sinnvoll: dein Satz wird später in echten Wiederholungen verwendet.</p><input class="optional-input" id="cueInput" maxlength="60" value="${esc(state.customCue||"")}"><div class="modal-footer"><button class="primary full" data-action="save-cue">SPEICHERN</button></div>`;
}

// Central event delegation: one listener for every button/action.
document.addEventListener("click",e=>{
 const b=e.target.closest("button,[data-nav],a"); if(!b)return;
 if(b.dataset.nav){go(b.dataset.nav);return}
 const a=b.dataset.action;if(!a)return;
 if(a==="home"){go("today");return}
 if(a==="close-modal"){closeModal();return}
 if(a==="daily-check"){if(todayCheck())return toast("Daily Check für heute bereits erledigt");draft=null;openModal("daily");return}
 if(a==="daily-value"){
   const keys=["body","energy","head","tension"],k=keys[draft.step];draft.data[k]=+b.dataset.value;draft.step++;
   if(draft.step>=keys.length){const entry={day:todayKey(),date:new Date().toISOString(),...draft.data};state.checks.push(entry);save();ensureDailyPlan();toast("Check gespeichert");closeModal()}else renderModal();return
 }
 if(a==="mark-sport"){
   const bl=currentBlock(),context=b.dataset.context;if(todayPrep())return toast("Heute ist bereits eine Sporteinheit offen");
   state.preparations.push({day:todayKey(),date:new Date().toISOString(),context,goals:[bl.goal],cue:bl.cue,blockId:bl.id,reviewed:false});save();renderAll();return
 }
 if(a==="start-reflection-exercise"){draft=null;openModal("exercise",{id:b.dataset.id,origin:"reflection",reflectionDate:b.dataset.ref});return}
 if(a==="start-reflection"){
   const context=b.dataset.context,prep=[...state.preparations].reverse().find(x=>x.day===todayKey()&&!x.reviewed&&x.context===context);if(!prep)return toast("Keine offene Einheit");
   draft={step:0,context,prep,transferRating:null,pressure:null,issue:null,deepAnswer:null,savedDate:null};openModal("reflection");return
 }
 if(a==="review-goal"){draft.transferRating=+b.dataset.value;draft.step++;renderModal();return}
 if(a==="reflection-value"&&b.dataset.key==="pressure"){draft.pressure=+b.dataset.value;draft.step++;renderModal();return}
 if(a==="review-issue"){
   draft.issue=b.dataset.value;const deep=draft.transferRating<3&&draft.issue!=="none"&&adaptiveQuestion(currentBlock().skill,draft.issue);if(!deep){saveReflectionFromDraft();draft.step++}else draft.step++;renderModal();return
 }
 if(a==="review-deep"){
   const q=adaptiveQuestion(currentBlock().skill,draft.issue),i=+b.dataset.value;draft.deepAnswer=q?.[1]?.[i]||null;saveReflectionFromDraft();draft.step++;renderModal();return
 }
 if(a==="finish-reflection-and-practice"){
   const id=b.dataset.id,ref=b.dataset.ref;draft=null;modal={name:"exercise",id,origin:"reflection",reflectionDate:ref};renderModal();return
 }
 if(a==="new-block"){startNewBlock();renderAll();toast("Neuer Schwerpunkt gestartet");return}
 if(a==="open-skill"){draft=null;openModal("skill",{skill:b.dataset.skill});return}
 if(a==="start-exercise"){draft=null;openModal("exercise",{id:b.dataset.id,origin:b.dataset.origin||"library"});return}
 if(a==="pick-cue"){
   draft.cue=b.dataset.value;state.customCue=draft.cue;save();renderModal();return
 }
 if(a==="exercise-begin"){draft.phase="run";renderModal();return}
 if(a==="exercise-evidence"){const ex=getExercise(modal.id),ev=evidence[ex.evidence];alert(ev.title+"\n\n"+ev.summary+"\n\n"+ev.ref);return}
 if(a==="quiz-answer"){
   const ex=getExercise(modal.id),r=ex.rounds[draft.round];draft.total++;if(+b.dataset.index===r[2])draft.correct++;draft.reps++;draft.round++;if(draft.round>=ex.rounds.length)finishExercise(ex);else renderModal();return
 }
 if(a==="binary-answer"){
   const ex=getExercise(modal.id),r=ex.items[draft.round];draft.total++;if((b.dataset.value==="true")===r[1])draft.correct++;draft.reps++;draft.round++;if(draft.round>=ex.items.length)finishExercise(ex);else renderModal();return
 }
 if(a==="speak-rep"){
   const ex=getExercise(modal.id);draft.substep=(draft.substep||0)+1;draft.reps++;
   if(draft.substep>=3){draft.substep=0;draft.round++;if(draft.round>=ex.situations.length)return finishExercise(ex)}renderModal();return
 }
 if(a==="edit-cue-in-exercise"){const v=prompt("Dein kurzer Cue:",draft.cue);if(v&&v.trim()){draft.cue=v.trim().slice(0,60);state.customCue=draft.cue;save();renderModal()}return}
 if(a==="evidence-choice"){
   const ex=getExercise(modal.id);draft.reps++;draft.round++;if(draft.round>=ex.prompts.length)finishExercise(ex);else renderModal();return
 }
 if(a==="breath-rep"){
   const ex=getExercise(modal.id);
   if((draft.substep||0)<3){draft.substep=(draft.substep||0)+1;draft.reps++;renderModal()}
   else{draft.substep=0;draft.round++;if(draft.round>=ex.rounds.length)finishExercise(ex);else renderModal()}return
 }
 if(a==="reset-step"){
   const ex=getExercise(modal.id);draft.substep=(draft.substep||0)+1;
   if(draft.substep>=3){draft.substep=0;draft.round++;draft.reps++;if(draft.round>=ex.situations.length)return finishExercise(ex)}renderModal();return
 }
 if(a==="control-answer"){
   const ex=getExercise(modal.id),r=ex.items[draft.round],answer=b.dataset.value==="true";draft.total++;if(answer===r[1])draft.correct++;
   if(r[1]===false){draft.awaitShift=true;renderModal();return}
   draft.reps++;draft.round++;if(draft.round>=ex.items.length)finishExercise(ex);else renderModal();return
 }
 if(a==="control-shift"){
   const ex=getExercise(modal.id);draft.awaitShift=false;draft.reps++;draft.round++;if(draft.round>=ex.items.length)finishExercise(ex);else renderModal();return
 }
 if(a==="fact-answer"){
   const ex=getExercise(modal.id),r=ex.items[draft.round];draft.total++;if(b.dataset.value===r[1])draft.correct++;draft.reps++;draft.round++;if(draft.round>=ex.items.length)finishExercise(ex);else renderModal();return
 }
 if(a==="imagery-step"){
   const ex=getExercise(modal.id);draft.substep=(draft.substep||0)+1;
   if(draft.substep>=4){draft.substep=0;draft.round++;draft.reps++;if(draft.round>=ex.situations.length)return finishExercise(ex)}renderModal();return
 }
 if(a==="routine-step"){
   const ex=getExercise(modal.id);draft.substep=(draft.substep||0)+1;
   if(draft.substep>=5){draft.substep=0;draft.round++;draft.reps++;if(draft.round>=ex.rounds)return finishExercise(ex)}renderModal();return
 }
 if(a==="exercise-feedback"){
   const ex=getExercise(modal.id), now=new Date().toISOString(), origin=modal.origin||"library";
   state.sessions.push({date:now,day:todayKey(),exercise:ex.id,skill:ex.skill,reps:draft.reps,feedback:b.dataset.value,correct:draft.correct,total:draft.total,origin,blockId:origin==="daily"?currentBlock().id:null});
   if(origin==="reflection"&&modal.reflectionDate){const r=state.reflections.find(x=>x.date===modal.reflectionDate);if(r)r.optionalDone=true}
   save();toast("Session gespeichert");const back=origin==="reflection"?"reflect":nav;closeModal();if(origin==="reflection")go("reflect");return
 }
 if(a==="open-evidence"){draft=null;openModal("evidence");return}
 if(a==="show-journal"){draft=null;openModal("journal");return}
 if(a==="edit-sport"){draft=null;openModal("sport");return}
 if(a==="choose-sport"){state.profile.sport=b.dataset.value;save();closeModal();return}
 if(a==="edit-priorities"){draft=null;openModal("priorities");return}
 if(a==="toggle-priority"){const v=b.dataset.value;if(draft.values.includes(v))draft.values=draft.values.filter(x=>x!==v);else if(draft.values.length<3)draft.values.push(v);else toast("Maximal drei Schwerpunkte");renderModal();return}
 if(a==="save-priorities"){state.profile.priorities=[...draft.values];save();closeModal();return}
 if(a==="edit-cue"){draft=null;openModal("cue");return}
 if(a==="save-cue"){const v=$("#cueInput").value.trim();if(!v)return toast("Kurzen Cue eingeben");state.customCue=v.slice(0,60);save();closeModal();return}
 if(a==="export-data"){
   const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a2=document.createElement("a");a2.href=url;a2.download="MentalEdge-Daten.json";a2.click();URL.revokeObjectURL(url);toast("Export erstellt");return
 }
});
renderAll();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
