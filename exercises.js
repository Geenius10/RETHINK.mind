window.MIND = window.MIND || {};

MIND.SKILLS = ['Focus','Control','Self-Talk','Imagery','Confidence','Resilience','Pressure'];
MIND.SKILL_LABELS = {
  Focus:'FOCUS', Control:'CONTROL', 'Self-Talk':'SELF-TALK', Imagery:'IMAGERY',
  Confidence:'CONFIDENCE', Resilience:'RESILIENCE', Pressure:'PRESSURE'
};
MIND.SPORTS = [
  {id:'general',label:'Allgemein'}, {id:'team',label:'Teamsport'}, {id:'strength',label:'Kraft / Gym'},
  {id:'endurance',label:'Ausdauer'}, {id:'racket',label:'Rückschlag'}, {id:'combat',label:'Kampfsport'}
];
MIND.GOALS = [
  {id:'pressure',label:'Unter Druck liefern'}, {id:'focus',label:'Konstanter Fokus'},
  {id:'confidence',label:'Selbstvertrauen'}, {id:'reset',label:'Fehler schneller abhaken'}
];

MIND.CONTEXT = {
  general:{scene:'entscheidenden Leistungssituation',action:'nächsten klaren Handlung',cue:'NEXT'},
  team:{scene:'engen Phase eines Spiels',action:'nächsten sauberen Aktion mit Ball oder Gegner',cue:'NEXT PLAY'},
  strength:{scene:'schweren Arbeitssatz',action:'sauberen Setup und die nächste Wiederholung',cue:'SET'},
  endurance:{scene:'harten Abschnitt eines Rennens oder Intervalls',action:'Rhythmus, Technik und nächsten Abschnitt',cue:'RHYTHM'},
  racket:{scene:'engen Spielstand',action:'nächsten Ball, Treffpunkt und Zielzone',cue:'NEXT BALL'},
  combat:{scene:'intensiven Schlagabtausch',action:'Distanz, Atmung und nächste klare Aktion',cue:'RESET'}
};

MIND.DRILLS = [
// FOCUS
{id:'f1',skill:'Focus',title:'Target / Ignore',type:'gonogo',level:1,duration:45,summary:'Zielreize erkennen, irrelevante Reize ignorieren.',instruction:'Tippe nur bei ●. ○ und ▲ ignorieren. Ein Fehler ist sofort vorbei – der nächste Reiz zählt.'},
{id:'f2',skill:'Focus',title:'Narrow / Wide',type:'focusshift',level:1,duration:44,summary:'Aufmerksamkeitsbreite bewusst steuern.',instruction:'Wechsle zwischen einem einzigen Punkt und dem gesamten Sichtfeld. Nicht anstrengen – bewusst umschalten.'},
{id:'f3',skill:'Focus',title:'Moving Target',type:'moving',level:2,duration:45,summary:'Blick zuerst, Handlung danach.',instruction:'Tippe den Zielpunkt. Nach jedem Treffer wechselt seine Position. Erst Blick setzen, dann Hand bewegen.'},
{id:'f4',skill:'Focus',title:'Odd / Even',type:'dualcue',level:2,duration:45,summary:'Regel halten und Position ignorieren.',instruction:'Gerade Zahl = LINKS. Ungerade Zahl = RECHTS. Die Position der Zahl ist bedeutungslos.'},
{id:'f5',skill:'Focus',title:'Color Conflict',type:'stroop',level:3,duration:50,summary:'Dominante Reaktion hemmen.',instruction:'Reagiere auf die FARBE, nicht auf das geschriebene Wort.'},
{id:'f6',skill:'Focus',title:'Peripheral Count',type:'peripheral',level:2,duration:45,summary:'Zentral fixieren und peripher wahrnehmen.',instruction:'Blick auf der Mitte halten. Zähle nur die kurzen Lichtimpulse am Rand.'},
{id:'f7',skill:'Focus',title:'Quiet Eye',type:'quieteye',level:1,duration:40,summary:'Blick vor der Handlung stabilisieren.',instruction:'Fixiere den Punkt ruhig. Atme aus. Stelle dir vor, dass erst nach der stabilen Fixation die Handlung beginnt.'},
{id:'f8',skill:'Focus',title:'Attention Switch',type:'switchrule',level:4,duration:52,summary:'Regelwechsel unter laufender Aufgabe.',instruction:'Halte die aktuelle Regel. Bei SWITCH wechselst du sofort, ohne die vorherige Entscheidung weiterzuverarbeiten.'},
// CONTROL
{id:'c1',skill:'Control',title:'4 → 6 Downshift',type:'breath',level:1,duration:55,summary:'Aktivierung kontrolliert senken.',instruction:'4 Sekunden ein, 6 Sekunden aus. Beim Ausatmen Kiefer, Schultern und Hände lösen.'},
{id:'c2',skill:'Control',title:'Physiological Reset',type:'doubleinhale',level:1,duration:45,summary:'Kurzer Reset bei hoher Anspannung.',instruction:'Zwei kurze Einatmungen durch die Nase, danach eine lange Ausatmung. Dann normal weiteratmen.'},
{id:'c3',skill:'Control',title:'Activation Ladder',type:'activate',level:1,duration:42,summary:'Energie vor Leistung erhöhen.',instruction:'Aufrichten, Blick anheben, aktiv einatmen. Mit jedem Zyklus etwas mehr Körperspannung und Wachheit.'},
{id:'c4',skill:'Control',title:'Tension Scan',type:'bodyscan',level:1,duration:48,summary:'Unnötige Spannung erkennen und lösen.',instruction:'Scanne Stirn, Kiefer, Schultern, Hände und Bauch. Löse nur unnötige Spannung.'},
{id:'c5',skill:'Control',title:'Box Control',type:'boxbreath',level:2,duration:48,summary:'Rhythmus und Atemkontrolle.',instruction:'4 ein – 4 halten – 4 aus – 4 halten. Ruhig und ohne Luftnot.'},
{id:'c6',skill:'Control',title:'Fast → Calm',type:'fastcalm',level:3,duration:50,summary:'Von Aktivierung schnell in Kontrolle wechseln.',instruction:'Kurze Aktivierungsphase, dann sofort in langen Ausatem und ruhigen Blick wechseln.'},
{id:'c7',skill:'Control',title:'Pre-Start State',type:'statechoice',level:2,duration:0,summary:'Passenden Aktivierungszustand wählen.',instruction:'Wähle für die Situation nicht „ruhig“ oder „heiß“, sondern den Zustand, der die nächste Aufgabe unterstützt.'},
{id:'c8',skill:'Control',title:'Pressure Breathing',type:'breathpressure',level:4,duration:52,summary:'Atmung trotz Störung stabil halten.',instruction:'Halte deinen Atemrhythmus, obwohl visuelle Störungen auftauchen. Nicht gegen die Störung kämpfen.'},
// SELF TALK
{id:'s1',skill:'Self-Talk',title:'Functional Voice',type:'choice',level:1,duration:0,summary:'Bewertung durch Handlung ersetzen.',instruction:'Zwei schlechte Aktionen hintereinander. Welche innere Anweisung bringt dich am besten zurück?',options:['Das darf nicht nochmal passieren.','NEXT. Nächste Aktion.','Ich muss jetzt perfekt sein.','Atmen. Sehen. Handeln.'],good:[1,3]},
{id:'s2',skill:'Self-Talk',title:'Instruction > Judgment',type:'choice',level:1,duration:0,summary:'Konkrete Instruktion statt Selbsturteil.',instruction:'Du merkst: „Heute läuft gar nichts.“ Welche Antwort ist funktional?',options:['Reiß dich zusammen.','Blick hoch. Nächste Aufgabe sauber.','Warum klappt das nicht?','Ich muss positiver denken.'],good:[1]},
{id:'s3',skill:'Self-Talk',title:'Cue Builder',type:'textcue',level:2,duration:0,summary:'Kurzen persönlichen Cue entwickeln.',instruction:'Formuliere maximal drei Wörter: körperlich, konkret, kontrollierbar.'},
{id:'s4',skill:'Self-Talk',title:'Outcome Trap',type:'choice',level:2,duration:0,summary:'Vom Ergebnis zur Handlung zurückkehren.',instruction:'Kurz vor einer entscheidenden Aktion. Welcher Satz hält dich bei der Aufgabe?',options:['Ich muss gewinnen.','Ruhig. Sehen. Entscheiden.','Bloß keinen Fehler.','Alle schauen gerade auf mich.'],good:[1]},
{id:'s5',skill:'Self-Talk',title:'If → Then',type:'ifthen',level:2,duration:0,summary:'Reset im Voraus automatisieren.',instruction:'Vervollständige deinen Plan: „Wenn ich einen Fehler mache, dann …“'},
{id:'s6',skill:'Self-Talk',title:'Technical Cue',type:'textcue',level:2,duration:0,summary:'Technik mit einem Cue vereinfachen.',instruction:'Wähle genau einen technischen Cue für deine nächste reale Leistung. Keine Checkliste.'},
{id:'s7',skill:'Self-Talk',title:'Pressure Language',type:'choice',level:3,duration:0,summary:'Sprache unter Druck handlungsorientiert halten.',instruction:'Es wird eng und du merkst Anspannung. Welche Sprache hilft?',options:['Nicht nervös werden.','Atmen. Blick. Erste klare Aktion.','Ich darf jetzt nicht versagen.','Ich bin der Beste.'],good:[1]},
{id:'s8',skill:'Self-Talk',title:'Reset Script',type:'textcue',level:4,duration:0,summary:'Persönliche Reset-Sequenz verdichten.',instruction:'Baue deinen Reset in maximal 5 Wörter: Atem + Cue + nächste Aktion.'},
// IMAGERY
{id:'i1',skill:'Imagery',title:'See · Feel · Solve',type:'imagery',level:1,duration:58,summary:'Realistische Leistungsszene simulieren.',instruction:'Umgebung → Körpergefühl → schwierige Aktion → kontrollierte Lösung.'},
{id:'i2',skill:'Imagery',title:'First 3 Actions',type:'imagery3',level:1,duration:48,summary:'Nur den Start präzise vorbereiten.',instruction:'Visualisiere die ersten drei Aktionen deiner kommenden Leistung. Realistisch, nicht perfekt.'},
{id:'i3',skill:'Imagery',title:'Error Recovery',type:'imageryerror',level:2,duration:54,summary:'Fehler plus gute Reaktion trainieren.',instruction:'Stell dir bewusst einen Fehler vor. Dann Ausatmen, Blick neu setzen und nächste Aktion sauber ausführen.'},
{id:'i4',skill:'Imagery',title:'Pressure Scene',type:'imagerypressure',level:3,duration:58,summary:'Druck im Kopf erhöhen, Verhalten stabil halten.',instruction:'Lärm, Konsequenz und Zeitdruck steigen. Atmung, Cue und Entscheidung bleiben kontrolliert.'},
{id:'i5',skill:'Imagery',title:'Slow Motion',type:'imageryslow',level:2,duration:50,summary:'Entscheidende Bewegung detailreich durchgehen.',instruction:'Spiele eine zentrale Aktion einmal in Zeitlupe und danach einmal in realem Tempo durch.'},
{id:'i6',skill:'Imagery',title:'External View',type:'imageryexternal',level:2,duration:48,summary:'Außenperspektive gezielt einsetzen.',instruction:'Sieh dich kurz von außen: Haltung, Raum, Timing. Wechsel dann zurück in deine eigene Perspektive.'},
{id:'i7',skill:'Imagery',title:'Sensory Layering',type:'imagerysense',level:3,duration:55,summary:'Bild um Geräusch und Körpergefühl ergänzen.',instruction:'Füge nacheinander Sehen, Hören und Körpergefühl hinzu. Die Handlung bleibt dieselbe.'},
{id:'i8',skill:'Imagery',title:'Adversity Rehearsal',type:'imageryadversity',level:4,duration:62,summary:'Unperfekte Verläufe mental vorbereiten.',instruction:'Simuliere einen ungünstigen Verlauf und trainiere deine Antwort – nicht das perfekte Ergebnis.'},
// CONFIDENCE
{id:'cf1',skill:'Confidence',title:'Evidence, Not Hype',type:'evidence',level:1,duration:0,summary:'Selbstvertrauen auf reale Belege stützen.',instruction:'Nenne drei konkrete Belege aus Training oder Wettkampf, die Kompetenz zeigen.'},
{id:'cf2',skill:'Confidence',title:'Best Rep Recall',type:'bestrep',level:1,duration:44,summary:'Beste reale Aktion abrufen.',instruction:'Rufe eine starke reale Aktion ab: Was hast du gesehen, gefühlt und getan?'},
{id:'cf3',skill:'Confidence',title:'Control Inventory',type:'control',level:1,duration:0,summary:'Kontrollierbares vom Rest trennen.',instruction:'Schreibe drei Dinge auf, die du heute wirklich kontrollierst.'},
{id:'cf4',skill:'Confidence',title:'Strength → Action',type:'strength',level:2,duration:0,summary:'Stärke in Verhalten übersetzen.',instruction:'Wähle eine Stärke und formuliere, wie man sie heute konkret sehen würde.'},
{id:'cf5',skill:'Confidence',title:'Proof Stack',type:'proofstack',level:2,duration:0,summary:'Belege nach Relevanz ordnen.',instruction:'Ein aktueller Beleg, ein schwieriger Beleg, ein wiederholter Beleg. Keine allgemeinen Komplimente.'},
{id:'cf6',skill:'Confidence',title:'Uncertainty Tolerance',type:'choice',level:3,duration:0,summary:'Sicherheit nicht mit Gewissheit verwechseln.',instruction:'Du weißt nicht, ob du heute deine Bestleistung abrufst. Welche Haltung ist tragfähig?',options:['Dann kann ich nicht selbstbewusst sein.','Ich brauche keine Garantie, nur eine klare nächste Aufgabe.','Ich sage mir einfach, dass ich sicher gewinne.','Ich vermeide Risiken.'],good:[1]},
{id:'cf7',skill:'Confidence',title:'Preparation Check',type:'prepcheck',level:2,duration:0,summary:'Vertrauen aus Vorbereitung ableiten.',instruction:'Was hast du vorbereitet? Was ist noch offen? Was ist für heute gut genug vorbereitet?'},
{id:'cf8',skill:'Confidence',title:'Identity Off',type:'choice',level:4,duration:0,summary:'Leistung nicht mit Selbstwert vermischen.',instruction:'Eine schlechte Leistung droht. Welche Aussage trennt Ergebnis und nächste Handlung?',options:['Dann bin ich einfach nicht gut genug.','Das Ergebnis bewertet die Leistung, nicht meinen Wert. Jetzt Aufgabe lösen.','Ich muss allen beweisen, wer ich bin.','Ich darf nicht schlecht aussehen.'],good:[1]},
// RESILIENCE
{id:'r1',skill:'Resilience',title:'Reset Under Error',type:'reset',level:1,duration:38,summary:'Schnelle Rückkehr nach Fehlern.',instruction:'Fehler → langer Ausatem → Cue → Blick auf nächsten relevanten Reiz.'},
{id:'r2',skill:'Resilience',title:'3-Second Rule',type:'reset3',level:1,duration:42,summary:'Fehler kurz auswerten, dann schließen.',instruction:'Drei Sekunden Information. Danach: Was ist die nächste Aufgabe?'},
{id:'r3',skill:'Resilience',title:'Adversity Reframe',type:'choice',level:2,duration:0,summary:'Handlungsfähigkeit unter ungünstigen Bedingungen.',instruction:'Schlechter Start, Frust steigt. Welche Interpretation hält dich handlungsfähig?',options:['Heute ist einfach nicht mein Tag.','Information. Was ist jetzt beeinflussbar?','Ich darf keinen weiteren Fehler machen.','Es muss sofort wieder laufen.'],good:[1]},
{id:'r4',skill:'Resilience',title:'Disruption Drill',type:'disrupt',level:2,duration:46,summary:'Nach Unterbrechung wieder orientieren.',instruction:'Die Aufgabe wird mehrfach unterbrochen. Nicht gegen die Störung kämpfen – neu orientieren und weiter.'},
{id:'r5',skill:'Resilience',title:'Bad Start Protocol',type:'protocol',level:2,duration:0,summary:'Plan für einen schlechten Start.',instruction:'Baue drei Schritte: Zustand regulieren → Information wählen → nächste Aktion.'},
{id:'r6',skill:'Resilience',title:'Controllables Only',type:'choice',level:3,duration:0,summary:'Frust auf beeinflussbare Faktoren zurückführen.',instruction:'Entscheidung gegen dich, äußere Umstände nerven. Worauf gehst du zurück?',options:['Auf die Ungerechtigkeit.','Auf Atmung, Position und nächste Entscheidung.','Auf das Endergebnis.','Auf das Verhalten der anderen.'],good:[1]},
{id:'r7',skill:'Resilience',title:'Bounce Back',type:'bounceback',level:3,duration:50,summary:'Fehlerreiz und direkte Folgeaktion koppeln.',instruction:'Nach jedem roten Fehlerreiz folgt sofort ein neuer Zielreiz. Die Reaktion danach zählt doppelt.'},
{id:'r8',skill:'Resilience',title:'Chaos Reset',type:'chaos',level:4,duration:54,summary:'Reset unter wechselnden Störungen.',instruction:'Regelwechsel, Störreiz, Fehler. Dein Ablauf bleibt: ausatmen → orientieren → handeln.'},
// PRESSURE
{id:'p1',skill:'Pressure',title:'Go / No-Go Pressure',type:'pressurego',level:1,duration:48,summary:'Impulskontrolle bei steigendem Tempo.',instruction:'● = reagieren. ▲ = nicht reagieren. Tempo steigt. Fehler bekommen keine Denkpause.'},
{id:'p2',skill:'Pressure',title:'Choice Under Clock',type:'clockchoice',level:2,duration:48,summary:'Regel unter Zeitdruck halten.',instruction:'Gerade = LINKS. Ungerade = RECHTS. Entscheide schnell, Regel bleibt stabil.'},
{id:'p3',skill:'Pressure',title:'Late Switch',type:'lateswitch',level:3,duration:50,summary:'Regelwechsel spät erkennen.',instruction:'Blau = LINKS, Rot = RECHTS. Bei SWITCH dreht sich die Regel um.'},
{id:'p4',skill:'Pressure',title:'Consequence Streak',type:'streak',level:2,duration:46,summary:'Konsequenz ohne Übervorsicht.',instruction:'Baue fünf richtige Entscheidungen in Folge. Fehler setzt nur die Serie zurück – nicht deinen Rhythmus.'},
{id:'p5',skill:'Pressure',title:'Countdown Decision',type:'countdownchoice',level:2,duration:50,summary:'Entscheidung nahe einer Deadline.',instruction:'Entscheide nach Regel, bevor der Ring abläuft. Zu früh raten bringt nichts.'},
{id:'p6',skill:'Pressure',title:'Noise + Task',type:'noise',level:3,duration:48,summary:'Relevantes trotz Störinformation halten.',instruction:'Ignoriere wechselnde Störwörter. Nur die eigentliche Entscheidungsregel zählt.'},
{id:'p7',skill:'Pressure',title:'Clutch Five',type:'clutch',level:3,duration:0,summary:'Fünf bewusste Entscheidungen mit Score.',instruction:'Fünf Entscheidungen. Vor jeder: ein Ausatem. Dann entscheiden. Qualität vor Hektik.'},
{id:'p8',skill:'Pressure',title:'Chaos Round',type:'chaos',level:4,duration:55,summary:'Mehrere Anforderungen unter Druck verbinden.',instruction:'Regel, Tempo und Störung ändern sich. Nicht alles kontrollieren – jeweils nur die aktuelle Regel.'}
];

MIND.TRANSFER_TASKS = {
  Focus:'Wähle vor dem Training EINEN relevanten Fokus-Cue und kehre nach Ablenkung bewusst dorthin zurück.',
  Control:'Nutze einmal vor Belastung und einmal nach hoher Aktivierung bewusst deinen Atem, um den Zustand zu steuern.',
  'Self-Talk':'Ersetze heute mindestens einen bewertenden Gedanken durch eine konkrete nächste Handlungsanweisung.',
  Imagery:'Spiele vor der realen Leistung die ersten drei Aktionen einmal kurz und realistisch mental durch.',
  Confidence:'Rufe vor der Leistung einen konkreten Kompetenzbeleg ab und leite daraus eine klare Handlung ab.',
  Resilience:'Nach einem deutlichen Fehler: Ausatmen → persönlicher Cue → nächste Aktion.',
  Pressure:'Wenn es eng wird: keine Ergebnisrechnung. Ein Ausatem, ein Cue, eine Entscheidung.'
};
