/**
 * Keyframe and JSON workflow for the procedural Warrior C skeleton editor.
 * All model changes live in animation offsets; the game is not modified.
 */
import {WarriorRigViewport} from './WarriorRigViewport.js';
import {EDITOR_STORAGE_KEY,createStarterProject,createClip,parseProject,
  exportProject,putFrame,removeFrame,nearestFrame,sampleClip,clonePose
} from './WarriorAnimationData.js';
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rounded=n=>Number(n.toFixed(3));
let project=createStarterProject();
let editor={time:0,playing:false,speed:1,autoKey:true,selected:'upperArm.R',
  pose:{},dirty:false,clipboard:null};
let viewer=null,prev=0,raf=0,toastTimer=0;
const selectedClip=()=>project.clips.find(x=>x.id===project.activeClip)||project.clips[0];
function label(name){
 const labels={
  pelvis:'Quadril',spine:'Coluna','cervical.lower':'Base do pescoço',
  'cervical.upper':'Pescoço superior',head:'Cabeça',
  'clavicle.L':'Clavícula esquerda','clavicle.R':'Clavícula direita',
  'upperArm.L':'Ombro esquerdo','upperArm.R':'Ombro direito',
  'lowerArm.L':'Cotovelo esquerdo','lowerArm.R':'Cotovelo direito',
  'hand.L':'Punho esquerdo','hand.R':'Punho direito',
  'palm.L':'Palma esquerda','palm.R':'Palma direita',
  'upperLeg.L':'Coxa esquerda','upperLeg.R':'Coxa direita',
  'lowerLeg.L':'Joelho esquerdo','lowerLeg.R':'Joelho direito',
  'foot.L':'Pé esquerdo','foot.R':'Pé direito'
 };
 if(labels[name])return labels[name];
 const finger=name.match(/^finger\.([LR])\.(\d)\.(base|tip)$/);
 if(finger)return 'Dedo '+(Number(finger[2])+1)+' '+(finger[3]==='base'?'base':'ponta');
 if(name.includes('thumb.'))return 'Polegar '+(name.endsWith('.base')?'base':'ponta');
 return name;
}
function groupOf(name){
 if(name==='pelvis'||name==='spine'||name==='head'||name.startsWith('cervical'))return 'CORPO E PESCOÇO';
 if(name.startsWith('finger.')||name.startsWith('thumb.'))
  return name.includes('.L.')?'DEDOS ESQUERDOS':'DEDOS DIREITOS';
 if(name.endsWith('.L'))return name.includes('Leg')||name.startsWith('foot.')?'PERNA ESQUERDA':'BRAÇO ESQUERDO';
 if(name.endsWith('.R'))return name.includes('Leg')||name.startsWith('foot.')?'PERNA DIREITA':'BRAÇO DIREITO';
 return 'OUTRAS JUNTAS';
}
function message(text,error=false){
 const node=$('message');node.textContent=text;
 node.classList.toggle('error',error);node.classList.add('visible');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),3700);
}
function store(){
 try{
  localStorage.setItem(EDITOR_STORAGE_KEY,JSON.stringify({
   project,editor:{time:editor.time,selected:editor.selected,
    draft:editor.dirty?editor.pose:null}
  }));
  $('save-state').textContent='✓ SALVO LOCALMENTE';
 }catch(error){$('save-state').textContent='⚠ SEM SALVAMENTO AUTOMÁTICO'}
}
function restore(){
 try{
  const stored=JSON.parse(localStorage.getItem(EDITOR_STORAGE_KEY)||'null');
  if(!stored)return;
  project=parseProject(stored.project||stored);
  editor.time=clamp(Number(stored.editor?.time)||0,0,selectedClip().duration);
  editor.selected=stored.editor?.selected||editor.selected;
  editor.dirty=Boolean(stored.editor?.draft);
  editor.pose=clonePose(stored.editor?.draft||sampleClip(selectedClip(),editor.time));
 }catch(error){
  console.warn('Animação salva inválida:',error);
  project=createStarterProject();
 }
}
function currentTime(){return editor.time}
function snap(t){
 const clip=selectedClip(),value=clamp(Number(t)||0,0,clip.duration);
 if(value>=clip.duration-.009)return clip.duration;
 return rounded(Math.round(value*clip.fps)/clip.fps);
}
function paintPose(pose){editor.pose=clonePose(pose);viewer.setPose(editor.pose)}
function stop(){
 if(!editor.playing)return;
 editor.playing=false;$('play').textContent='▶ Reproduzir';
 $('play').classList.remove('is-playing');
}
function scrub(t,playback=false){
 editor.time=playback?clamp(t,0,selectedClip().duration):snap(t);
 editor.dirty=false;paintPose(sampleClip(selectedClip(),editor.time));
 updateTime();syncAxis();
 if(!playback)store();
}
function onViewChange(pose){
 stop();
 editor.pose=clonePose(pose);editor.dirty=true;
 updateTime();syncAxis();store();
}
function onViewDone(){
 if(editor.dirty&&editor.autoKey)record(false);
}
function chooseBone(name){
 editor.selected=name;
 $('selected-name').textContent=label(name);
 $('selected-code').textContent=name;
 syncAxis();
 document.querySelectorAll('[data-bone]').forEach(b=>
  b.classList.toggle('selected',b.dataset.bone===name));
 store();
}
function fillBoneList(){
 const container=$('bone-list');
 container.replaceChildren();
 const search=$('bone-search').value.trim().toLowerCase();
 const groups=new Map();
 for(const name of viewer.bones.keys()){
  if(search&&!label(name).toLowerCase().includes(search)&&!name.toLowerCase().includes(search))
   continue;
  const cat=groupOf(name);
  if(!groups.has(cat))groups.set(cat,[]);
  groups.get(cat).push(name);
 }
 const priorities=['CORPO E PESCOÇO','BRAÇO ESQUERDO','BRAÇO DIREITO',
  'PERNA ESQUERDA','PERNA DIREITA','DEDOS ESQUERDOS','DEDOS DIREITOS','OUTRAS JUNTAS'];
 for(const group of priorities){
  const names=groups.get(group);
  if(!names?.length)continue;
  const section=document.createElement('section');section.className='bone-group';
  const h=document.createElement('h3');h.textContent=group;section.appendChild(h);
  for(const name of names){
   const b=document.createElement('button');b.type='button';b.dataset.bone=name;
   b.className='bone';b.textContent=label(name);b.title=name;
   b.addEventListener('click',()=>viewer.select(name));
   section.appendChild(b);
  }
  container.appendChild(section);
 }
 chooseBone(editor.selected);
 $('bone-total').textContent=viewer.bones.size+' JUNTAS';
}
function syncAxis(){
 for(const [index,axis] of ['x','y','z'].entries()){
  const value=editor.pose[editor.selected]?.[index]||0;
  $('axis-'+axis).value=clamp(value,-180,180);
  $('number-'+axis).value=Number(value.toFixed(1));
 }
}
function changeAxis(axis,n){
 if(!viewer.bones.has(editor.selected))return;
 stop();
 const pose=clonePose(editor.pose);
 const values=pose[editor.selected]||[0,0,0];
 values['xyz'.indexOf(axis)]=clamp(Number(n)||0,-180,180);
 pose[editor.selected]=values;
 paintPose(pose);
 editor.dirty=true;
 if(editor.autoKey)record(false);
 else {updateTime();store()}
}
function updateTime(){
 const c=selectedClip();
 $('time-label').textContent=editor.time.toFixed(2)+' / '+c.duration.toFixed(2)+'s';
 $('timeline').value=editor.time;
 $('playhead').style.left=100*editor.time/c.duration+'%';
 const frame=nearestFrame(c,editor.time,.017);
 $('key-state').textContent=editor.dirty?'◉ NÃO GRAVADO':frame?'◆ QUADRO SALVO':'◇ INTERPOLAÇÃO';
 $('key-state').classList.toggle('dirty',editor.dirty);
 $('frame-count').textContent=c.keyframes.length+' QUADROS-CHAVE';
}
function refreshTimeline(){
 const lane=$('keyframe-lane');lane.replaceChildren();
 const c=selectedClip();
 for(const key of c.keyframes){
  const b=document.createElement('button');b.className='key-dot';
  b.type='button';b.style.left=100*key.time/c.duration+'%';
  b.title='Ir para '+key.time.toFixed(2)+'s';
  b.setAttribute('aria-label',b.title);
  b.addEventListener('click',()=>{stop();scrub(key.time)});
  lane.appendChild(b);
 }
 updateTime();
}
function record(notify=true){
 putFrame(selectedClip(),snap(editor.time),viewer.getPose());
 editor.dirty=false;refreshTimeline();store();
 if(notify)message('✓ Quadro gravado em '+editor.time.toFixed(2)+'s.');
}
function deleteKey(){
 if(removeFrame(selectedClip(),snap(editor.time),.018)){
  scrub(editor.time);refreshTimeline();store();message('Quadro removido.');
 }else message('Nenhum quadro neste momento.',true);
}
function refreshClips(){
 const select=$('clip-select');select.replaceChildren();
 for(const c of project.clips){
  const op=document.createElement('option');op.value=c.id;op.textContent=c.name;
  select.appendChild(op);
 }
 const c=selectedClip();select.value=c.id;
 $('clip-name').value=c.name;
 $('project-name').value=project.projectName;
 $('clip-length').value=c.duration;
 $('clip-loop').checked=c.loop;
 $('timeline').max=c.duration;
 $('clip-length-text').textContent=c.duration.toFixed(2)+'s';
 refreshTimeline();
}
function chooseClip(id){
 stop();project.activeClip=id;editor.time=0;editor.dirty=false;
 scrub(0);refreshClips();store();
}
function makeClip(){
 if(project.clips.length>=32){message('Máximo de 32 animações.',true);return}
 const name=prompt('Nome da animação:','Minha animação');
 if(name===null)return;
 const clip=createClip(name,1);
 putFrame(clip,0,{});putFrame(clip,1,{});
 project.clips.push(clip);chooseClip(clip.id);
 message('Animação criada. Edite um osso e use a linha do tempo.');
}
function copyClip(){
 if(project.clips.length>=32){message('Máximo de 32 animações.',true);return}
 const clone=JSON.parse(JSON.stringify(selectedClip()));
 clone.id='clip-'+Math.random().toString(36).slice(2,10);
 clone.name=clone.name+' (cópia)';
 project.clips.push(clone);chooseClip(clone.id);
}
function dropClip(){
 if(project.clips.length<2){message('Mantenha pelo menos uma animação.',true);return}
 if(!confirm('Excluir '+selectedClip().name+'?'))return;
 const id=selectedClip().id;
 project.clips=project.clips.filter(c=>c.id!==id);
 chooseClip(project.clips[0].id);
}
function setDuration(seconds){
 const c=selectedClip(),newTime=rounded(clamp(Number(seconds)||1,.15,30));
 const discarded=c.keyframes.filter(f=>f.time>newTime).length;
 if(discarded&&!confirm('Remover '+discarded+' quadros fora da nova duração?')){
  $('clip-length').value=c.duration;return;
 }
 c.duration=newTime;c.keyframes=c.keyframes.filter(f=>f.time<=newTime);
 editor.time=Math.min(editor.time,newTime);
 refreshClips();scrub(editor.time);store();
}
function exportJSON(){
 const blob=new Blob([exportProject(project)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download='guerreiro-c-animacoes-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),7000);
 message('✓ JSON exportado com '+project.clips.length+' animações. Você pode me enviar esse arquivo.');
}
async function importJSON(file){
 if(!file)return;
 if(file.size>4*1024*1024){message('Arquivo JSON maior que 4 MB.',true);return}
 try{
  const candidate=parseProject(await file.text());
  if(!confirm('Importar '+candidate.clips.length+' animações e substituir as atuais?'))return;
  stop();project=candidate;editor.time=0;editor.dirty=false;
  scrub(0);refreshClips();store();
  message('✓ Animações importadas com sucesso.');
 }catch(error){message('JSON inválido: '+error.message,true)}
 finally{$('import-json').value=''}
}
function copyPose(){editor.clipboard=clonePose(viewer.getPose());message('Pose copiada.')}
function pastePose(){
 if(!editor.clipboard){message('Copie uma pose primeiro.',true);return}
 stop();paintPose(editor.clipboard);editor.dirty=true;
 if(editor.autoKey)record(false);
 else {store();updateTime()}
 message('Pose aplicada.');
}
function mirrorPose(){
 stop();
 const pose=clonePose(viewer.getPose());
 const copy=clonePose(pose);
 for(const [name,degrees] of Object.entries(pose)){
  const destination=name.includes('.L')?name.replace('.L','.R'):
    name.includes('.R')?name.replace('.R','.L'):null;
  if(destination&&viewer.bones.has(destination))
   copy[destination]=[degrees[0],-degrees[1],-degrees[2]];
 }
 paintPose(copy);editor.dirty=true;
 if(editor.autoKey)record(false);else{store();updateTime()}
 message('Pose copiada de um lado para o outro.');
}
function resetPose(){
 stop();paintPose({});editor.dirty=true;
 if(editor.autoKey)record(false);else{store();updateTime()}
 message('Pose neutra aplicada.');
}
function playPause(){
 if(editor.playing){stop();return}
 if(!selectedClip().loop&&editor.time>=selectedClip().duration)scrub(0);
 editor.playing=true;$('play').textContent='Ⅱ Pausar';
 $('play').classList.add('is-playing');
}
function wire(){
 $('bone-search').addEventListener('input',fillBoneList);
 $('show-skeleton').addEventListener('change',e=>viewer.toggleSkeleton(e.target.checked));
 $('reset-camera').addEventListener('click',()=>viewer.resetCamera());
 for(const axis of ['x','y','z']){
  $('axis-'+axis).addEventListener('input',e=>changeAxis(axis,e.target.value));
  $('number-'+axis).addEventListener('change',e=>changeAxis(axis,e.target.value));
 }
 $('auto-key').addEventListener('change',e=>{
  editor.autoKey=e.target.checked;
  message(editor.autoKey?'Autogravação ativada.':'Gravação manual ativada.');
 });
 $('pose-zero').addEventListener('click',resetPose);
 $('pose-mirror').addEventListener('click',mirrorPose);
 $('pose-copy').addEventListener('click',copyPose);
 $('pose-paste').addEventListener('click',pastePose);
 $('timeline').addEventListener('input',e=>{stop();scrub(Number(e.target.value))});
 $('record').addEventListener('click',()=>record());
 $('delete-key').addEventListener('click',deleteKey);
 $('play').addEventListener('click',playPause);
 $('speed').addEventListener('input',e=>{
  editor.speed=clamp(Number(e.target.value)||1,.25,2);
  $('speed-label').textContent=editor.speed.toFixed(1)+'×';
 });
 $('clip-select').addEventListener('change',e=>chooseClip(e.target.value));
 $('new-clip').addEventListener('click',makeClip);
 $('duplicate-clip').addEventListener('click',copyClip);
 $('delete-clip').addEventListener('click',dropClip);
 $('clip-name').addEventListener('change',e=>{
  selectedClip().name=String(e.target.value||'Animação').trim().slice(0,80)||'Animação';
  refreshClips();store();
 });
 $('project-name').addEventListener('change',e=>{
  project.projectName=String(e.target.value||'Animações do Guerreiro C').trim().slice(0,80);
  refreshClips();store();
 });
 $('clip-length').addEventListener('change',e=>setDuration(e.target.value));
 $('clip-loop').addEventListener('change',e=>{selectedClip().loop=e.target.checked;store()});
 $('export-json').addEventListener('click',exportJSON);
 $('import-json').addEventListener('change',e=>importJSON(e.target.files?.[0]));
 $('screenshot').addEventListener('click',()=>{
  const a=document.createElement('a');a.href=viewer.screenshot();
  a.download='guerreiro-c-pose.png';a.click();
 });
 $('restore-presets').addEventListener('click',()=>{
  if(!confirm('Restaurar as 4 animações de exemplo, substituindo o projeto?'))return;
  project=createStarterProject();editor.time=0;editor.dirty=false;
  scrub(0);refreshClips();store();message('Exemplos restaurados.');
 });
 document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if(e.code==='Space'){e.preventDefault();playPause()}
  else if(e.key.toLowerCase()==='k'){e.preventDefault();record()}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){
   e.preventDefault();exportJSON();
  }
 });
}
function tick(ms){
 const dt=clamp((ms-(prev||ms))/1000,0,.05);prev=ms;
 if(editor.playing){
  const clip=selectedClip(),next=editor.time+dt*editor.speed;
  if(next>=clip.duration&&!clip.loop){scrub(clip.duration,true);stop()}
  else scrub(clip.loop?next%clip.duration:next,true);
 }
 raf=requestAnimationFrame(tick);
}
function init(){
 restore();
 viewer=new WarriorRigViewport($('studio-canvas'),{
  onSelect:chooseBone,
  onChange:onViewChange,
  onDone:()=>{if(editor.dirty&&editor.autoKey)record(false)}
 });
 editor.pose=Object.keys(editor.pose).length?editor.pose:sampleClip(selectedClip(),editor.time);
 viewer.setPose(editor.pose);
 const unfinished=editor.dirty?clonePose(editor.pose):null;
 if(!viewer.bones.has(editor.selected))editor.selected='upperArm.R';
 wire();fillBoneList();refreshClips();viewer.select(editor.selected);
 if(unfinished){
  editor.pose=unfinished;
  viewer.setPose(unfinished);
  editor.dirty=true;
  updateTime();syncAxis();
 }else{
  scrub(editor.time);
 }
 $('auto-key').checked=editor.autoKey;
 $('show-skeleton').checked=true;
 store();
 raf=requestAnimationFrame(tick);
 window.addEventListener('pagehide',()=>{
  cancelAnimationFrame(raf);viewer.dispose();
 },{once:true});
}
try{init()}catch(error){
 console.error('Animation studio error:',error);
 $('fatal').textContent='Não foi possível carregar o editor: '+(error.message||error);
 $('fatal').hidden=false;
}
