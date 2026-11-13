'use strict';
/* The test's home: a hero, then for the open child a card with a ring of the items recorded and three big tiles
   (continue, new assessment, reports). When the app's child has no test yet, one big tile starts their test.
   It decorates the existing buttons, so the rest of the test keeps using the same ids. */
(()=>{
 const tile=(id,icon,label,sub='')=>{const b=$(id);b.classList.remove('icon-button');b.innerHTML=`<span class="tile-icon">${appIcon(icon)}</span><span class="tile-text"><b>${label}</b>${sub?`<small>${sub}</small>`:''}</span>`;};
 function ring(done,total){
  const C=2*Math.PI*42,share=total?done/total:0;
  $('homeRing').innerHTML=`<circle cx="50" cy="50" r="42" class="ring-track"/><circle cx="50" cy="50" r="42" class="ring-fill" stroke-dasharray="${(C*share).toFixed(1)} ${C.toFixed(1)}"${share?'':' opacity="0"'}/><text x="50" y="47" text-anchor="middle" class="ring-num">${done}</text><text x="50" y="66" text-anchor="middle" class="ring-of">من ${total}</text>`;
 }
 function decorate(){
  const child=activeChild(),shared=globalThis.ArticulationChildren?.active?.();
  if(child){const a=aggregate(),date=caseDate(activeAssessment());ring(a.recorded,allProbes.length);
   tile('continueAssessment','next',a.recorded?'متابعة الفحص':'ابدأ الفحص',a.recorded?`${allProbes.length-a.recorded} بندًا متبقيًا`:'٨٤ كلمة');
   tile('homeNewAssessment','plus','فحص جديد','بعد فترة تدريب');tile('homeReports','report','التقارير',date);$('homeProgress').textContent=`فحص ${date} · بنود مسجّلة`;}
  /* The app's child, not tested yet: one tap makes their test record (linked by the shared id). */
  const other=!!shared&&(!child||(child.sharedId!==shared.id&&globalThis.ArticulationChildren.sameName(child.name)!==globalThis.ArticulationChildren.sameName(shared.name)));
  const known=other&&cases.children.find(c=>c.sharedId===shared.id||globalThis.ArticulationChildren.sameName(c.name)===globalThis.ArticulationChildren.sameName(shared.name));
  $('startShared').hidden=!other;
  if(other)tile('startSharedButton',known?'next':'plus',known?`فتح فحص ${shared.name}`:`ابدأ فحص ${shared.name}`,known?'آخر فحص محفوظ':'حساب جديد في الاختبار');
  $('startSharedButton').dataset.known=known?known.id:'';
 }
 $('startSharedButton').onclick=()=>{
  const shared=globalThis.ArticulationChildren?.active?.();if(!shared)return;
  const known=$('startSharedButton').dataset.known;
  if(known?selectCase(known):createChild(shared.name))showPage(known?'home':'details');
 };
 const base=refreshHome;
 refreshHome=function(){base();decorate();};
 decorate();
})();
