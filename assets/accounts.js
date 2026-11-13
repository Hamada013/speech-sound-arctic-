/* Account controls shared by the home page and every part of the app. The list itself is in children.js;
   deleting a child removes them, and their progress, from every part. */
((root)=>{
 const Children=root.ArticulationChildren||(typeof require!=='undefined'?require('./children.js'):null);
 const KEY=Children.KEY,AVATAR_KEY=Children.AVATAR_KEY;
 /* Simple outline faces of children, drawn here so they look the same on every device. Never platform emoji. */
 const FACE='<circle cx="12" cy="13.5" r="6.5"/><path d="M9.6 13.4h.01M14.4 13.4h.01M10.2 16.2q1.8 1.3 3.6 0"/>';
 const CAP_HAIR='M5.6 12.4C5.4 8 8.2 5.6 12 5.6s6.6 2.4 6.4 6.8c-2.6 0-5-1.2-6.4-3.2-1.4 2-3.8 3.2-6.4 3.2Z';
 const KIDS={
  boy:{
   b1:`<path d="${CAP_HAIR}"/>`,
   b2:'<path d="M5.7 11.6 6.2 7l2.3 1.4 1.2-3.6 2.3 2.6 2.3-2.6 1.2 3.6 2.3-1.4.5 4.6"/>',
   b3:'<path d="M5.6 12.6C5 8.2 7.8 5.6 12 5.6c3.8 0 6.6 2.4 6.4 6.6-3.6-.2-6.6-1.4-8.4-3.8-.8 1.8-2.4 3.4-4.4 4.2Z"/>',
   b4:'<path d="M5.4 11.4a6.6 6.6 0 0 1 13.2 0Zm13.2 0h3.2M12 4.8V3.6"/>'
  },
  girl:{
   g1:`<path d="${CAP_HAIR}"/><circle cx="4.4" cy="10.4" r="1.9"/><circle cx="19.6" cy="10.4" r="1.9"/>`,
   g2:'<path d="M5.5 13.5C5 8 7.8 5.6 12 5.6s7 2.4 6.5 7.9v6.5m-13-6.5V20m.4-9c3 0 5.2-1.6 6.1-3.8.9 2.2 3.1 3.8 6.1 3.8"/>',
   g3:`<path d="${CAP_HAIR}"/><path d="m16 5.4-2.6-1.8v3.6Zm0 0 2.6-1.8v3.6Z"/>`,
   g4:`<path d="${CAP_HAIR}"/><circle cx="12" cy="3.6" r="2"/>`
  }
 };
 const COLORS=[['#edf5fb','#487a9a'],['#edf6f0','#4e8869'],['#fbf3e8','#a47c40'],['#f4eff9','#8b70a6'],['#fcf0ed','#b07764'],['#eaf6f4','#4b8b83']];
 const kindOf=child=>child?.character==='girl'?'girl':'boy';
 const choicesFor=kind=>Object.keys(KIDS[kind]).flatMap(face=>COLORS.map((_,color)=>`${face}:${color}`));
 const valid=(value,kind)=>typeof value==='string'&&choicesFor(kind).includes(value);

 /* Gives each child a face and colour, kept from visit to visit, different from the others while there are enough. */
 function assignAvatars(storage,children,random=Math.random){
  let saved={},raw=null;
  try{raw=storage?.getItem(AVATAR_KEY);const record=JSON.parse(raw);if(record?.schema===2&&record.faces&&typeof record.faces==='object')saved=record.faces;}catch{}
  const kids=children.filter(child=>child?.id),assigned=new Map(),used=new Set();
  for(const child of kids){const face=saved[child.id];if(valid(face,kindOf(child))&&!used.has(face)){assigned.set(child.id,face);used.add(face);}}
  for(const child of kids.filter(child=>!assigned.has(child.id))){
   const all=choicesFor(kindOf(child)),free=all.filter(face=>!used.has(face)),pool=free.length?free:all,face=pool[Math.floor(random()*pool.length)];
   assigned.set(child.id,face);used.add(face);
  }
  const next=JSON.stringify({schema:2,faces:{...saved,...Object.fromEntries(assigned)}});
  if(raw!==next)try{storage?.setItem(AVATAR_KEY,next);}catch{}
  return assigned;
 }
 function remove(storage,targetId){
  let data;try{data=JSON.parse(storage.getItem(KEY));}catch{return false;}
  if(data?.schema!==1||!Array.isArray(data.children)||!data.children.some(child=>child.id===targetId))return false;
  data.deletedChildren={...data.deletedChildren,[targetId]:new Date().toISOString()};
  data.children=data.children.filter(child=>child.id!==targetId);if(data.active===targetId)data.active=null;
  try{storage.setItem(KEY,JSON.stringify(data));}catch{return false;}
  Children.forget(storage,targetId);
  return true;
 }
 const normalizeName=name=>String(name||'').normalize('NFKC').replace(/[ً-ٰٟـ]/g,'').replace(/[أإآٱ]/g,'ا').trim().toLocaleLowerCase();
 function orderedChildren(children,query='',sort='oldest'){
  const collator=new Intl.Collator('ar',{sensitivity:'base',numeric:true}),needle=normalizeName(query);
  const list=children.map((child,index)=>({...child,position:index})).filter(child=>normalizeName(child.name).includes(needle));
  return list.sort((a,b)=>sort==='alphabet'?collator.compare(a.name,b.name)||a.position-b.position:(sort==='newest'?-1:1)*(((Date.parse(a.created)||0)-(Date.parse(b.created)||0))||a.position-b.position));
 }
 if(typeof module!=='undefined')module.exports={remove,orderedChildren,assignAvatars,KIDS};
 if(!root.document)return;
 let dialog,openSort,sortSerial=0,avatars=new Map();
 let storage;try{storage=localStorage;}catch{}
 const glyph=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

 function drawFace(value,kind,size){
  const [face,color]=value.split(':'),circle=document.createElement('span');
  circle.className='suite-account-avatar'+(size?` suite-face-${size}`:'');circle.dataset.avatar=value;circle.setAttribute('aria-hidden','true');
  [circle.style.background,circle.style.color]=COLORS[Number(color)]||COLORS[0];
  circle.innerHTML=glyph(FACE+KIDS[kind][face]);
  return circle;
 }
 function avatar(child,size){
  if(!avatars.has(child.id))avatars=assignAvatars(storage,Children.list());
  return drawFace(avatars.get(child.id)||choicesFor(kindOf(child))[0],kindOf(child),size);
 }
 /* The boy and girl choice in the new-child form. */
 const kid=kind=>drawFace(kind==='girl'?'g1:4':'b1:0',kind==='girl'?'girl':'boy','pick');
 document.querySelectorAll('[data-kid]').forEach(node=>node.replaceChildren(kid(node.dataset.kid)));

 function sortControl(onChange){
  const choices=[['oldest','الأقدم أولًا','<path d="M5 4v15m-3-3 3 3 3-3M11 6h10M11 12h7M11 18h4"/>'],['newest','الأحدث أولًا','<path d="M5 20V5M2 8l3-3 3 3M11 6h4M11 12h7M11 18h10"/>'],['alphabet','حسب الأبجدية','<path d="M5 4v15m-3-3 3 3 3-3M13 4v5m-2 0h4m-2 6c-3 0-4 4-1 4h5m-2-6h.01"/>']];
  const wrap=document.createElement('div');wrap.className='suite-account-sort-wrap';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='suite-account-sort';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','ترتيب الحسابات: '+choices[0][1]);
  const label=document.createElement('span');label.textContent=choices[0][1];
  trigger.innerHTML=glyph('<path d="M4 6h16M4 12h11M4 18h6"/>');trigger.append(label);trigger.insertAdjacentHTML('beforeend',glyph('<path d="m7 10 5 5 5-5"/>'));
  const list=document.createElement('div');list.id='suite-account-sort-'+(++sortSerial);list.className='suite-account-sort-menu';list.setAttribute('role','listbox');list.setAttribute('aria-label','ترتيب الحسابات');list.hidden=true;trigger.setAttribute('aria-controls',list.id);
  let value='oldest';
  const close=(restore=false)=>{list.hidden=true;trigger.setAttribute('aria-expanded','false');if(openSort?.wrap===wrap)openSort=null;if(restore)trigger.focus();};
  const options=choices.map(([id,text,path])=>{
   const option=document.createElement('button');option.type='button';option.className='suite-account-sort-option';option.dataset.sortValue=id;option.setAttribute('role','option');option.setAttribute('aria-selected',String(id===value));option.tabIndex=-1;
   option.innerHTML=glyph(path);const name=document.createElement('span');name.textContent=text;option.append(name);option.insertAdjacentHTML('beforeend',glyph('<path d="m5 12 4 4L19 6"/>'));
   option.onclick=()=>{value=id;label.textContent=text;trigger.setAttribute('aria-label','ترتيب الحسابات: '+text);options.forEach(item=>item.setAttribute('aria-selected',String(item===option)));close(true);onChange(value);};list.append(option);return option;
  });
  const show=(focus=true)=>{
   openSort?.close();list.hidden=false;trigger.setAttribute('aria-expanded','true');openSort={wrap,close};
   // Open upwards when the surrounding modal has too little space below.
   list.classList.remove('suite-account-sort-above');const bounds=wrap.closest('dialog')?.getBoundingClientRect(),rect=list.getBoundingClientRect();
   if(rect.bottom>Math.min(root.innerHeight,bounds?.bottom||root.innerHeight)-12&&wrap.getBoundingClientRect().top-rect.height>(bounds?.top||0)+12)list.classList.add('suite-account-sort-above');
   if(focus)options.find(option=>option.dataset.sortValue===value).focus({preventScroll:true});
  };
  trigger.onclick=()=>list.hidden?show():close();
  trigger.onkeydown=event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();show();if(event.key==='Home')options[0].focus();if(event.key==='End')options.at(-1).focus();}};
  wrap.onkeydown=event=>{
   if(list.hidden)return;
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);}
   else if(event.key==='Tab')close();
   else if(event.target!==trigger&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
    event.preventDefault();const index=options.indexOf(document.activeElement),next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;options[next].focus();
   }
  };
  wrap.onfocusout=event=>{if(!wrap.contains(event.relatedTarget))close();};
  wrap.append(trigger,list);return wrap;
 }
 document.addEventListener('pointerdown',event=>{if(openSort&&!openSort.wrap.contains(event.target))openSort.close();});
 /* The accounts window is opened only after the parent check, so anyone there may delete a child, after confirming. */
 function request(child){
  if(!child)return;
  if(!dialog){dialog=document.createElement('dialog');dialog.id='delete-account-dialog';dialog.className='suite-dialog';dialog.setAttribute('aria-labelledby','delete-account-title');dialog.innerHTML='<h2 id="delete-account-title">حذف الحساب</h2><p data-delete-message></p><div class="suite-text-actions"><button type="button" data-delete-confirm>نعم، حذف الحساب</button><button type="button" data-delete-back>عودة</button></div><p role="alert"></p>';document.body.append(dialog);dialog.querySelector('[data-delete-back]').onclick=()=>dialog.close();}
  dialog.querySelector('[data-delete-message]').textContent=`هل أنت متأكد أنك تريد حذف حساب «${child.name}» وتقدّمه في كل أجزاء التطبيق على هذا الجهاز؟`;dialog.querySelector('[role=alert]').textContent='';
  dialog.querySelector('[data-delete-confirm]').onclick=()=>{let ok=false;try{ok=remove(localStorage,child.id);}catch{}if(ok){dialog.close();location.reload();}else dialog.querySelector('[role=alert]').textContent='تعذّر حذف الحساب. حاول مجددًا.';};
  dialog.showModal();dialog.querySelector('[data-delete-back]').focus();
 }
 function button(child){
  if(!child)return null;
  const b=document.createElement('button');b.type='button';b.className='suite-delete';b.dataset.deleteChild=child.id;
  b.innerHTML=glyph('<path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14M10 10v7m4-7v7"/>');
  b.setAttribute('aria-label','حذف حساب '+child.name);b.title='حذف حساب '+child.name;b.onclick=()=>request(child);return b;
 }
 function row(child,select,actions=[]){
  const item=document.createElement('div');item.className='suite-account-row';item.setAttribute('role','listitem');item.dataset.accountId=child.id;
  select.classList.add('suite-account-select');select.setAttribute('aria-label',child.name);select.setAttribute('aria-pressed',String(child.id===Children.active()?.id));
  const label=document.createElement('span');label.className='suite-account-name';label.textContent=child.name;select.replaceChildren(avatar(child),label);
  item.append(select);
  const tools=document.createElement('div');tools.className='suite-account-tools';tools.append(...actions);
  const remove=button(child);if(remove)tools.append(remove);
  if(tools.children.length)item.append(tools);return item;
 }
 function render(host,children,makeRow){
  openSort?.close();
  host.classList.remove('suite-account-list');host.classList.add('suite-account-browser');host.replaceChildren();
  host.removeAttribute('role');
  avatars=assignAvatars(storage,Children.list());
  const filters=document.createElement('div');filters.className='suite-account-filters';
  const search=document.createElement('input');search.type='search';search.className='suite-account-search';search.placeholder='ابحث بالاسم';search.setAttribute('aria-label','البحث عن حساب بالاسم');search.autocomplete='off';
  let sortValue='oldest';const sort=sortControl(value=>{sortValue=value;update();});
  filters.append(search,sort);host.append(filters);
  const grid=document.createElement('div');grid.className='suite-account-grid';grid.setAttribute('role','list');grid.setAttribute('aria-label','حسابات الأطفال');host.append(grid);
  const empty=document.createElement('p');empty.className='suite-account-empty';empty.setAttribute('role','status');host.append(empty);
  const update=()=>{const list=orderedChildren(children,search.value,sortValue);grid.replaceChildren(...list.map(makeRow));empty.textContent=list.length?'':search.value?'لا يوجد حساب بهذا الاسم.':'لا توجد حسابات أطفال بعد.';empty.hidden=!!list.length;};
  search.oninput=update;search.onkeydown=event=>{if(event.key==='Enter')event.preventDefault();};update();
 }
 root.addEventListener('storage',event=>{if(event.key!==KEY)return;try{const before=JSON.parse(event.oldValue||'null'),after=JSON.parse(event.newValue||'null');if(JSON.stringify(before?.deletedChildren)!==JSON.stringify(after?.deletedChildren))location.reload();}catch{}});
 root.SuiteAccounts={button,request,row,render,avatar,kid};
})(globalThis);
