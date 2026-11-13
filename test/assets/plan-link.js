'use strict';
/* The report's plan button: the assessment shown in the report becomes the child's intervention plan in the app
   (../assets/therapy.js), on the same child as the games, and the plan page opens. The results go over in the app's
   hand-over format (docs/roadmap.md, item 5). Without the app's shared files (e.g. offline) the button stays hidden. */
(()=>{
 const T=globalThis.ArticulationTherapy,button=$('makePlan');
 if(!T||!SharedChildren){button.hidden=true;return;}
 APP_ICONS.plan=T.ICONS.plan;
 setButtonIcon(button,'plan','الخطة العلاجية');setButtonIcon($('confirmPlan'),'check','صنع الخطة');
 const POSITION={'أول الكلمة':'initial','وسط الكلمة':'medial','آخر الكلمة':'final'};
 /* One item as the hand-over has it: ok, omitted, distorted, added, the letter said instead, or null (not scored). */
 function said(probe){
  const r=trialFor(probe.id);
  if(r.status==='correct'||r.status==='dialect')return 'ok';
  if(r.status==='omission')return 'omitted';
  if(r.status==='distortion')return 'distorted';
  if(r.status==='addition')return 'added';
  if(r.status==='substitution'){const a=phoneme(r.actualIPA||r.actual);return a&&a.manner!=='vowel'&&[...a.letter].length===1?a.letter:'distorted';}
  return null;
 }
 function results(){
  const record=reportRecord();
  return withAssessment(record,()=>({v:1,source:'test',date:caseDate(record),assessment:record.id,child:{name:activeChild().name},
   sounds:SOUNDS.map(sound=>{const entry={letter:sound.letter,initial:null,medial:null,final:null};for(const p of sound.probes)if(POSITION[p.position])entry[POSITION[p.position]]=said(p);return entry;})}));
 }
 let pending=null;
 button.onclick=()=>{
  if(!activeChild()||!reportRecord())return;
  pending=results();
  const sounds=T.soundsOf(pending.sounds),patterns=T.patternsOf(pending.sounds);
  const shared=readCases().children.find(c=>c.id===cases.activeChild)?.sharedId,old=shared&&T.planOf(shared);
  $('planSounds').textContent=sounds.length?sounds.map(s=>s.letter).join(' '):'—';
  $('planPatterns').textContent=patterns.length?patterns.map(p=>p.name).join('، '):'لا يوجد نمط مشترك';
  $('planDescription').textContent=!sounds.length?'لا توجد أخطاء مصححة في هذا الفحص لتُبنى عليها خطة.':old?'تحل محل خطة الطفل الحالية. يبقى تقدّمه في الألعاب وأيام تدريبه.':'تبدأ الألعاب بأصوات الخطة، ويظهر تدريب اليوم في الصفحة الرئيسية.';
  $('confirmPlan').hidden=!sounds.length;
  openDialog($('planDialog'));
 };
 $('confirmPlan').onclick=()=>{
  if(!pending)return;
  if(typeof save==='function')save();
  linkShared(activeChild());
  const shared=readCases().children.find(c=>c.id===cases.activeChild)?.sharedId;
  if(!shared){$('planDescription').textContent='تعذّر ربط الطفل بحسابات التطبيق.';return;}
  try{T.create(shared,pending);}catch{$('planDescription').textContent='تعذّر صنع الخطة.';return;}
  location.href=T.url('plan/index.html');
 };
})();
