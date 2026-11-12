'use strict';
const $=id=>document.getElementById(id);
const KEY='sala-classroom-data-v1';
let authenticated=false, dirty=false;
let data={version:1,tags:[],classes:[],settings:{showHero:true,showStats:true,showSearch:true}}, selected=null, admin=false, editingClass=null, editingTag=null, installPrompt=null, workspace='classes';
const compare=(a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base',numeric:false});
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3500)}
function validLink(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)}catch{return false}}
function sanitizeTeacher(html){
 const template=document.createElement('template');template.innerHTML=String(html);
 const allowed=new Set(['B','STRONG','I','EM','U','P','BR','UL','OL','LI','DIV']);
 const blocked=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','TEMPLATE']);
 function clean(parent){const fragment=document.createDocumentFragment();for(const child of parent.childNodes){if(child.nodeType===3){fragment.append(document.createTextNode(child.textContent));continue}if(child.nodeType!==1||blocked.has(child.tagName))continue;const children=clean(child);if(allowed.has(child.tagName)){const el=document.createElement(child.tagName.toLowerCase());el.append(children);fragment.append(el)}else fragment.append(children)}return fragment}
 const output=document.createElement('div');output.append(clean(template.content));return output.textContent.trim()?output.innerHTML:'';
}
function validate(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.tags)||!Array.isArray(raw.classes))throw Error('JSON ត្រូវមាន version: 1, tags និង classes។');
 const ids=new Set(),names=new Set();
 const tags=raw.tags.map(t=>{if(!t||typeof t.id!=='string'||!t.id||ids.has(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.trim().length>50||names.has(t.name.trim().toLowerCase()))throw Error('ស្លាកមានទិន្នន័យមិនត្រឹមត្រូវ ឬស្ទួន។');ids.add(t.id);names.add(t.name.trim().toLowerCase());if(t.description!==undefined&&(typeof t.description!=='string'||t.description.length>500))throw Error('ការពិពណ៌នាស្លាកមិនត្រឹមត្រូវ។');return{id:t.id,name:t.name.trim(),description:t.description||''}});
 const classIds=new Set(),classNames=new Set();
 if(raw.classes.some(c=>c&&c.buttonName!==undefined&&(typeof c.buttonName!=='string'||c.buttonName.length>100)))throw Error('ឈ្មោះប៊ូតុងមិនត្រឹមត្រូវ។');
 if(raw.classes.some(c=>c&&c.teacherInfo!==undefined&&(typeof c.teacherInfo!=='string'||c.teacherInfo.length>50000)))throw Error('ព័ត៌មានគ្រូត្រូវជាអត្ថបទ និងតូចជាង 50,000 តួអក្សរ។');
 const classes=raw.classes.map(c=>{if(!c||typeof c.id!=='string'||!c.id||classIds.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.trim().length>100||classNames.has(c.name.trim().toLowerCase())||!validLink(c.link)||!Array.isArray(c.tags)||c.tags.some(t=>!ids.has(t)))throw Error('ថ្នាក់មានទិន្នន័យមិនត្រឹមត្រូវ ឈ្មោះស្ទួន ឬតំណមិនមែន HTTP ឬ HTTPS។');classIds.add(c.id);classNames.add(c.name.trim().toLowerCase());return{id:c.id,name:c.name.trim(),link:c.link,buttonName:c.buttonName?.trim()||'បើកថ្នាក់រៀន',teacherInfo:sanitizeTeacher(c.teacherInfo||''),tags:[...new Set(c.tags)]}});
 const settings=raw.settings??{};
 if(typeof settings!=='object'||Array.isArray(settings)||['showHero','showStats','showSearch'].some(key=>settings[key]!==undefined&&typeof settings[key]!=='boolean'))throw Error('ការកំណត់បង្ហាញមិនត្រឹមត្រូវ។');
 return{version:1,tags,classes,settings:{showHero:settings.showHero??true,showStats:settings.showStats??true,showSearch:settings.showSearch??true}};
}
function saveJson(){download(JSON.stringify({...data,classes:[...data.classes].sort(compare)},null,2)+'\n','data.json','application/json');dirty=false;render();toast('សូមពិនិត្យឯកសារ data.json ក្នុង Downloads។')}
function persist(){dirty=true;render();toast('មានការកែប្រែ។ សូមចុច Save Json Update Your change ដើម្បីរក្សាទុក JSON។')}
async function uploadToGithub(){
 if(!admin)throw Error('សូមចូលជា Admin ដើម្បីបង្ហោះទិន្នន័យ។');
 const token=$('githubToken').value.trim();
 if(!token)throw Error('សូមបញ្ចូល GitHub fine-grained token។');
 const endpoint='https://api.github.com/repos/damrongteacher/Akthipakdei2026-2027/contents/data.json';
 const headers={Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'};
 let read;
 try{read=await fetch(`${endpoint}?ref=main`,{headers})}catch{throw Error('មិនអាចភ្ជាប់ទៅ GitHub API បានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយប្រើគេហទំព័រ HTTPS ឬ localhost។')}
 let sha;
 if(read.ok){
  const file=await read.json();
  sha=file.sha;
 }else if(read.status!==404){
  const error=await read.json().catch(()=>({}));
  const hint=read.status===401?' សូមបង្កើត token ថ្មី ព្រោះ token ចាស់ដែលបានបង្ហាញគួរត្រូវបាន revoke។':read.status===403?' សូមពិនិត្យ token មាន Contents: Read and write និងបានកំណត់សិទ្ធិលើ repository ត្រឹមត្រូវ។':'';
  throw Error((error.message||`មិនអាចអាន data.json ពី GitHub បានទេ (HTTP ${read.status})។`)+hint);
 }
 const content=JSON.stringify({...data,classes:[...data.classes].sort(compare)},null,2)+'\n';
 const bytes=new TextEncoder().encode(content);
 let binary='';
 for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));
 const body={message:`Update data.json (${new Date().toLocaleString()})`,content:btoa(binary),branch:'main'};
 if(sha)body.sha=sha;
 let response;
 try{response=await fetch(endpoint,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch{throw Error('មិនអាចផ្ញើទិន្នន័យទៅ GitHub បានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយប្រើគេហទំព័រ HTTPS ឬ localhost។')}
 if(!response.ok){
  const error=await response.json().catch(()=>({}));
  const hint=response.status===401?' សូមបង្កើត fine-grained token ថ្មី ព្រោះ token ចាស់ដែលបានបង្ហាញគួរត្រូវបាន revoke។':response.status===403?' សូមពិនិត្យ token មាន Contents: Read and write និងបានកំណត់សិទ្ធិលើ repository ត្រឹមត្រូវ។':response.status===404?' មិនឃើញ repository ឬសិទ្ធិរបស់ token មិនអនុញ្ញាតឱ្យចូលប្រើទេ។':response.status===409||response.status===422?' សូមផ្ទុកទំព័រឡើងវិញ ហើយសាកល្បងម្ដងទៀត។':'';
  throw Error((error.message||`មិនអាចបង្ហោះ data.json ទៅ GitHub បានទេ (HTTP ${response.status})។`)+hint);
 }
 dirty=false;
 render();
 try{await fetch('https://api.github.com/repos/damrongteacher/Akthipakdei2026-2027/pages/builds',{method:'POST',headers})}catch{}
 $('githubToken').value='';
 $('githubUploadStatus').textContent='បានបង្ហោះ data.json ទៅ GitHub និងស្នើឱ្យ rebuild Pages។';
 toast('បានបង្ហោះ data.json ទៅ GitHub។');
}

function button(label,fn,cls=''){const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b}
function render(){
 $('headerSave').hidden=!admin||!dirty;
 $('logout').hidden=!authenticated;
 $('classCount').textContent=data.classes.length;$('tagCount').textContent=data.tags.length;
 if(selected&&!data.tags.some(t=>t.id===selected))selected=null;
 $('activeMenuTitle').textContent=workspace==='tags'?'Tags (ស្លាក)':workspace==='settings'?'Setting':workspace==='cards'?'Card':selected?data.tags.find(t=>t.id===selected).name:'បង្ហាញទាំងអស់';
 $('collectionIntro').hidden=workspace==='classes'&&!selected;
 $('collectionTitle').textContent=selected?data.tags.find(t=>t.id===selected).name:'ថ្នាក់រៀនទាំងអស់';
 $('allClasses').classList.toggle('active',!selected&&workspace==='classes');$('tags').replaceChildren();
 data.tags.forEach(t=>{const row=node('div','tag-row');const b=button('',()=>{selected=t.id;setWorkspace('classes')},'nav'+(selected===t.id?' active':''));b.append(node('span','tag-dot'),node('span','',t.name));row.append(b);$('tags').append(row)});
 const query=admin||data.settings.showSearch?$('search').value.trim().toLowerCase():'';const classes=data.classes.filter(c=>(!selected||c.tags.includes(selected))&&(c.name.toLowerCase().includes(query)||c.tags.some(id=>data.tags.find(t=>t.id===id)?.name.toLowerCase().includes(query)))).sort(compare);
 $('grid').replaceChildren();$('empty').hidden=classes.length>0;
 const groups=selected?[{name:null,classes}]:data.tags.map(t=>({name:t.name,classes:classes.filter(c=>c.tags.includes(t.id))}));
 if(!selected){const untagged=classes.filter(c=>!c.tags.length);if(untagged.length)groups.push({name:'មិនមានស្លាក',classes:untagged})}
 groups.filter(group=>group.classes.length).forEach(group=>{const section=node('section','class-group');if(group.name){const heading=node('div','group-heading');heading.append(node('h3','',group.name),node('span','',group.classes.length+' ថ្នាក់រៀន'));section.append(heading)}const grid=node('div','grid');group.classes.forEach(c=>grid.append(createClassCard(c)));section.append(grid);$('grid').append(section)});
 renderPresentation();
 renderTagManager();
}
function createClassCard(c){const card=node('article','card');const badges=node('div','badges admin-only');c.tags.forEach(id=>badges.append(node('span','badge',data.tags.find(t=>t.id===id).name)));const link=node('a','open-link',c.buttonName||'បើកថ្នាក់រៀន');link.href=c.link;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',(c.buttonName||'បើកថ្នាក់រៀន')+' — '+c.name);link.dataset.className=c.name;card.append(node('h3','',c.name),badges);if(c.teacherInfo){const info=node('div','teacher-info');info.innerHTML=sanitizeTeacher(c.teacherInfo);card.append(info)}card.append(link);const actions=node('div','card-actions admin-only');actions.append(button('✎ កែប្រែ',()=>openClass(c)),button('លុប',()=>{if(admin&&confirm('លុបថ្នាក់ '+c.name+'?')){data.classes=data.classes.filter(x=>x.id!==c.id);persist()}}));card.append(actions);return card;}
function renderPresentation(){
 const settings=data.settings||{showHero:true,showStats:true,showSearch:true};
 $('hero').hidden=admin?workspace!=='settings':!settings.showHero||selected!==null;$('stats').hidden=admin?workspace!=='settings':!settings.showStats;$('searchToolbar').hidden=!admin&&!settings.showSearch;
 $('showHero').checked=settings.showHero;$('showStats').checked=settings.showStats;$('showSearch').checked=settings.showSearch;
}
function updatePresentation(){if(!admin)return;data.settings={showHero:$('showHero').checked,showStats:$('showStats').checked,showSearch:$('showSearch').checked};persist()}
function openLogin(){
 $('loginForm').reset();$('loginError').textContent='';
 if(!$('loginDialog').open)$('loginDialog').showModal();
}
function validAdminCredentials(username,password){return username==='admin'&&password==='admin'}
function setMode(value){if(value&&!authenticated){openLogin();return}admin=value;document.body.classList.toggle('admin',value);document.querySelectorAll('.mode-button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===(value?'admin':'viewer'))));if(!value)setWorkspace('classes');else render()}
function setWorkspace(value){workspace=admin&&['tags','settings','cards'].includes(value)?value:'classes';
 $('classWorkspace').hidden=!['classes','cards'].includes(workspace);$('tagWorkspace').hidden=workspace!=='tags';$('settingsPanel').hidden=workspace!=='settings';
 for(const [id,page] of [['allClasses','classes'],['cardsWorkspace','cards'],['tagsWorkspace','tags'],['settingsWorkspace','settings']]){$(id).classList.toggle('active',workspace===page&&!(page==='classes'&&selected));$(id).setAttribute('aria-pressed',String(workspace===page))}render()}

function openClass(c=null){if(!admin)return;editingClass=c?.id||null;$('classForm').reset();$('formError').textContent='';$('dialogTitle').textContent=c?'កែប្រែថ្នាក់រៀន':'បង្កើតថ្នាក់រៀន';$('className').value=c?.name||'';$('classLink').value=c?.link||'';$('buttonName').value=c?.buttonName||'បើកថ្នាក់រៀន';$('teacherInfo').innerHTML=sanitizeTeacher(c?.teacherInfo||'');$('tagChoices').replaceChildren();data.tags.forEach(t=>{const label=node('label');const input=document.createElement('input');input.type='checkbox';input.value=t.id;input.checked=c?.tags.includes(t.id)||false;label.append(input,document.createTextNode(' '+t.name));$('tagChoices').append(label)});if(!data.tags.length)$('tagChoices').append(node('span','','មិនទាន់មានស្លាក។ សូមបង្កើតស្លាកនៅក្នុង WORKSPACE ស្លាក។'));$('classDialog').showModal()}
function openTag(t=null){if(!admin)return;editingTag=t?.id||null;$('tagDialogTitle').textContent=t?'កែប្រែស្លាក / ប្ដូរឈ្មោះ':'បង្កើត Tag';$('tagName').value=t?.name||'';$('tagDescription').value=t?.description||'';$('tagError').textContent='';if(!$('tagDialog').open)$('tagDialog').showModal()}
function moveTag(id,offset){
 if(!admin)return;
 const index=data.tags.findIndex(t=>t.id===id),target=index+offset;
 if(index<0||target<0||target>=data.tags.length)return;
 [data.tags[index],data.tags[target]]=[data.tags[target],data.tags[index]];
 persist();document.getElementById('tag-'+id+'-'+(offset<0?'up':'down'))?.focus();
}
function deleteTag(id){
 if(!admin)return;const tag=data.tags.find(t=>t.id===id);if(!tag||!confirm('លុបស្លាក '+tag.name+'? ថ្នាក់រៀននៅដដែល។'))return;
 data.tags=data.tags.filter(t=>t.id!==id);data.classes.forEach(c=>c.tags=c.tags.filter(t=>t!==id));persist();
}
function renderTagManager(){
 $('tagManager').replaceChildren();$('noTags').hidden=data.tags.length>0;
 data.tags.forEach((t,index)=>{const row=node('article','workspace-tag-row');
 const info=node('div','workspace-tag-info');info.append(node('h3','',t.name));if(t.description)info.append(node('p','',t.description));info.append(node('small','',data.classes.filter(c=>c.tags.includes(t.id)).length+' ថ្នាក់រៀន'));
 const actions=node('div','workspace-tag-actions');const up=button('↑',()=>moveTag(t.id,-1)),down=button('↓',()=>moveTag(t.id,1));up.id='tag-'+t.id+'-up';down.id='tag-'+t.id+'-down';up.disabled=index===0;down.disabled=index===data.tags.length-1;up.setAttribute('aria-label','ផ្លាស់ទី '+t.name+' ឡើង');down.setAttribute('aria-label','ផ្លាស់ទី '+t.name+' ចុះ');actions.append(up,down,button('កែប្រែ / ប្ដូរឈ្មោះ',()=>openTag(t)),button('លុប',()=>deleteTag(t.id),'danger'));
 row.append(node('span','tag-position',String(index+1).padStart(2,'0')),info,actions);$('tagManager').append(row)});
}
function download(content,name,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function published(){const response=await fetch('data.json?t='+Date.now(),{cache:'no-store'});if(!response.ok)throw Error('មិនអាចទាញយក data.json បានទេ។');return validate(await response.json())}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('[data-format]').forEach(b=>{
 b.addEventListener('mousedown',e=>e.preventDefault());
 b.addEventListener('click',()=>{if(!admin)return;$('teacherInfo').focus();document.execCommand(b.dataset.format,false,null)});
});
$('teacherInfo').addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData.getData('text/plain');document.execCommand('insertText',false,text)});
$('teacherInfo').addEventListener('drop',e=>e.preventDefault());
$('teacherInfo').addEventListener('keydown',e=>{if(e.key==='Enter')e.stopPropagation()});
$('teacherInfo').addEventListener('focus',()=>{try{document.execCommand('defaultParagraphSeparator',false,'p')}catch{}});
$('showHero').onchange=updatePresentation;$('showStats').onchange=updatePresentation;$('showSearch').onchange=updatePresentation;
document.querySelectorAll('.mode-button').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode==='admin')));$('logout').onclick=()=>{authenticated=false;setMode(false)};$('allClasses').onclick=()=>{selected=null;setWorkspace('classes')};$('search').oninput=render;$('addClass').onclick=()=>openClass();$('workspaceAddTag').onclick=()=>openTag();$('tagsWorkspace').onclick=()=>setWorkspace('tags');
$('loginForm').onsubmit=e=>{
 e.preventDefault();
 if(!validAdminCredentials($('loginUsername').value.trim(),$('loginPassword').value)){
  $('loginError').textContent='ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។';
  $('loginPassword').value='';$('loginPassword').focus();return;
 }
 authenticated=true;$('loginDialog').close();setMode(true);
};
$('loginDialog').addEventListener('close',()=>{$('loginForm').reset();$('loginError').textContent=''});
$('classForm').onsubmit=e=>{e.preventDefault();if(!admin)return;const name=$('className').value.trim(),link=$('classLink').value.trim();if(!name||data.classes.some(c=>c.id!==editingClass&&c.name.toLowerCase()===name.toLowerCase())){$('formError').textContent='សូមប្រើឈ្មោះថ្នាក់ដែលមិនស្ទួន។';return}if(!validLink(link)){$('formError').textContent='សូមបញ្ចូលតំណ HTTP ឬ HTTPS ដែលត្រឹមត្រូវ។';return}if($('teacherInfo').innerHTML.length>50000){$('formError').textContent='ព័ត៌មានគ្រូវែងពេក។ សូមកាត់បន្ថយអត្ថបទ។';return}const c={id:editingClass||crypto.randomUUID(),name,link,buttonName:$('buttonName').value.trim()||'បើកថ្នាក់រៀន',teacherInfo:sanitizeTeacher($('teacherInfo').innerHTML),tags:[...$('tagChoices').querySelectorAll('input:checked')].map(i=>i.value)};if(editingClass)data.classes=data.classes.map(x=>x.id===editingClass?c:x);else data.classes.push(c);$('classDialog').close();persist()};
$('tagForm').onsubmit=e=>{e.preventDefault();if(!admin)return;const name=$('tagName').value.trim();if(!name||data.tags.some(t=>t.id!==editingTag&&t.name.toLowerCase()===name.toLowerCase())){$('tagError').textContent='សូមប្រើឈ្មោះស្លាកដែលមិនស្ទួន។';return}const description=$('tagDescription').value.trim();if(editingTag)Object.assign(data.tags.find(t=>t.id===editingTag),{name,description});else data.tags.push({id:crypto.randomUUID(),name,description});$('tagDialog').close();persist()};
$('export').onclick=saveJson;$('headerSave').onclick=saveJson;
$('uploadGithub').onclick=async()=>{
 const uploadButton=$('uploadGithub');
 const status=$('githubUploadStatus');
 uploadButton.disabled=true;
 uploadButton.setAttribute('aria-busy','true');
 uploadButton.textContent='Uploading…';
 status.textContent='កំពុងបង្ហោះ data.json ទៅ GitHub…';
 try{await uploadToGithub()}catch(error){status.textContent=error.message;toast(error.message)}finally{uploadButton.disabled=false;uploadButton.removeAttribute('aria-busy');uploadButton.textContent='↑ Upload data.json to GitHub'}
};
$('cardsWorkspace').onclick=()=>{selected=null;setWorkspace('cards')};$('settingsWorkspace').onclick=()=>setWorkspace('settings');
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{const file=$('file').files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('ឯកសារត្រូវតូចជាង 2 MB។');const next=validate(JSON.parse(await file.text()));if(confirm('បើកទិន្នន័យពីឯកសារ JSON នេះ?')){data=next;selected=null;dirty=true;$('importStatus').textContent=`Imported from file: ${file.name} (current data may include later edits).`;render()}}catch(error){$('importStatus').textContent=`Import failed: ${error.message}`;toast(error.message)}finally{$('file').value=''}};
$('reset').onclick=async()=>{if(!confirm('អាន data.json ពីគេហទំព័រឡើងវិញ? សូមរក្សាទុក JSON ដែលបានកែប្រែជាមុន។'))return;try{const next=await published();data=next;selected=null;dirty=false;$('importStatus').textContent='No JSON file imported.';render();toast('បានទាញយកទិន្នន័យពីគេហទំព័រ។')}catch(error){toast(error.message)}};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});window.addEventListener('appinstalled',()=>{installPrompt=null;toast('បានដំឡើង App។')});
document.querySelectorAll('.install-button').forEach(button=>button.addEventListener('click',async()=>{if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null}else $('installDialog').showModal()}));
$('shortcut').onclick=()=>{const url=new URL('./',location.href);download('[InternetShortcut]\r\nURL='+url.href+'\r\n','Akthipakdei2026-2027.url','application/octet-stream')};
async function init(){
 // Remove drafts created by older versions; never load or write browser data.
 try{localStorage.removeItem(KEY)}catch{}
 try{data=await published();render()}catch(error){render();toast(error.message+' សូមបើកតាម web server ឬ GitHub Pages។')}
}
init();if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
