/**
 * Interactive studio for the exact same procedural 3D character used in game.
 * The two canvases are composited by CSS: an existing 2D world underneath
 * a transparent Three.js/WebGL stage. Fallback uses the old vector illustration.
 */
import { World } from '../world/World.js';
import { drawWarrior } from '../render/characters/Warrior.js';

const $=id=>document.getElementById(id);
const world=new World(173);
const backgroundCanvas=$('stage'),c=backgroundCanvas.getContext('2d');
const heroCanvas=$('hero-3d');
const state={motion:'idle',yaw:0,scale:1.1,background:'world',
  gear:'full',armor:'light',paused:false,dragging:false};
const actor={vx:0,vy:0,facing:Math.PI/2,inv:0,attackPose:0};
let stage=null,width=1,height=1,dpr=1,t=0,last=0,fallback=false;
const dirs={front:0,'front-right':Math.PI/4,right:Math.PI/2,
  'back-right':3*Math.PI/4,back:Math.PI,'back-left':-3*Math.PI/4,
  left:-Math.PI/2,'front-left':-Math.PI/4};
const safeText=(selector,text)=>{const e=$(selector);if(e)e.textContent=text;};
function resize(){
  const r=backgroundCanvas.getBoundingClientRect();
  width=Math.max(1,r.width);height=Math.max(1,r.height);
  dpr=Math.min(1.5,window.devicePixelRatio||1);
  backgroundCanvas.width=Math.round(width*dpr);
  backgroundCanvas.height=Math.round(height*dpr);
  if(stage)stage.resize(Math.round(width*dpr),Math.round(height*dpr));
}
function paintWorld(){
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);
  if(state.background==='world'){
    world.draw(c,-width*.5,-height*.8,width,height,t);
    c.fillStyle='#0a192451';c.fillRect(0,0,width,height);
  }else{
    c.fillStyle=state.background==='light'?'#becfc0':'#172934';
    c.fillRect(0,0,width,height);
    c.strokeStyle=state.background==='light'?'#587c7130':'#b0dccc15';
    for(let x=0;x<width;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,height);c.stroke();}
    for(let y=0;y<height;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(width,y);c.stroke();}
  }
  const r=c.createRadialGradient(width/2,height*.54,5,width/2,height*.55,Math.max(width,height)*.52);
  r.addColorStop(0,'#b3f6d929');r.addColorStop(1,'#05131800');
  c.fillStyle=r;c.fillRect(0,0,width,height);
  c.fillStyle='#08171d70';c.beginPath();
  c.ellipse(width/2,height*.805,56*state.scale,13*state.scale,0,0,Math.PI*2);c.fill();
}
function tick(now){
  const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
  if(!state.paused)t+=dt;
  actor.vx=state.motion==='walk'?180:0;
  actor.vy=state.motion==='walk'?35:0;
  actor.facing=Math.PI/2;
  const swing=t%1.03;
  actor.attackPose=state.motion==='attack'&&swing<.27?.27-swing:0;
  paintWorld();
  if(stage){
    try{
      stage.setZoom(state.scale);
      stage.render(actor,t,state.paused?0:dt,{yaw:state.yaw,instant:true});
    }catch(e){console.warn('Prévia 3D indisponível:',e);stage.dispose();stage=null;fallback=true;heroCanvas.hidden=true;}
  }
  if(fallback){
    // The studio can still export the previous vector variant on older devices.
    const facingBack=Math.abs(Math.abs(state.yaw)-Math.PI)<Math.PI/3;
    const scale=Math.min(2.5,Math.max(.3,height/280)*state.scale);
    drawWarrior(c,actor,width/2,height*.8,t,
      {face:facingBack?'back':'front',scale,equipment:state.gear==='full'?'full':'unarmed'});
  }
  requestAnimationFrame(tick);
}
function active(selector,key,value){
  document.querySelectorAll(selector).forEach(b=>b.classList.toggle('active',b.dataset[key]===value));
}
function orientation(angle){
  state.yaw=angle;
  const v=Object.entries(dirs).find(([,a])=>Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)))<.03);
  $('view').value=v?v[0]:'free';
}
document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>{
  state.motion=b.dataset.motion;active('[data-motion]','motion',state.motion);
}));
document.querySelectorAll('[data-gear]').forEach(b=>b.addEventListener('click',()=>{
  state.gear=b.dataset.gear;active('[data-gear]','gear',state.gear);
  stage?.setEquipment({sword:state.gear==='full'});
}));
$('view').addEventListener('change',e=>{
  if(e.target.value!=='free')orientation(dirs[e.target.value]??0);
});
$('armor').addEventListener('change',e=>{
  state.armor=e.target.value;stage?.setArmor(state.armor);
});
$('background').addEventListener('change',e=>state.background=e.target.value);
$('zoom').addEventListener('input',e=>{
  state.scale=Number(e.target.value);safeText('zoom-label',state.scale.toFixed(1)+'×');
});
$('freeze').addEventListener('click',()=>{
  state.paused=!state.paused;
  $('freeze').textContent=state.paused?'▶ Retomar':'Ⅱ Pausar';
  $('freeze').classList.toggle('active',state.paused);
});
$('reset').addEventListener('click',()=>{
  Object.assign(state,{motion:'idle',yaw:0,scale:1.1,background:'world',
    gear:'full',armor:'light',paused:false,dragging:false});
  t=0;$('view').value='front';$('armor').value='light';
  $('zoom').value='1.1';safeText('zoom-label','1.1×');
  $('background').value='world';$('freeze').textContent='Ⅱ Pausar';
  $('freeze').classList.remove('active');active('[data-motion]','motion','idle');
  active('[data-gear]','gear','full');
  stage?.setArmor('light');stage?.setEquipment({sword:true,shield:true});
});
$('export').addEventListener('click',()=>{
  let url='';
  if(stage)url=stage.exportPNG({faceYaw:state.yaw,width:1100,height:1100,actor,seconds:t});
  else {
    const exported=document.createElement('canvas');
    exported.width=950;exported.height=1024;
    drawWarrior(exported.getContext('2d'),actor,475,860,t,{
      face:Math.abs(state.yaw)>Math.PI*.75?'back':'front',scale:4.35,
      equipment:state.gear==='full'?'full':'unarmed',shadow:false
    });
    url=exported.toDataURL('image/png');
  }
  const link=document.createElement('a');
  link.href=url;link.download='guerreiro-procedural-3d.png';link.click();
});
let previousX=0;
heroCanvas.addEventListener('pointerdown',e=>{
  if(!stage)return;
  heroCanvas.setPointerCapture(e.pointerId);
  state.dragging=true;previousX=e.clientX;
});
heroCanvas.addEventListener('pointermove',e=>{
  if(!state.dragging)return;
  const dx=e.clientX-previousX;previousX=e.clientX;
  orientation(state.yaw+dx*.012);
});
const stop=()=>{state.dragging=false;};
heroCanvas.addEventListener('pointerup',stop);
heroCanvas.addEventListener('pointercancel',stop);
heroCanvas.addEventListener('wheel',e=>{
  if(!stage)return;e.preventDefault();
  state.scale=Math.max(.5,Math.min(2.3,state.scale+(e.deltaY<0?.1:-.1)));
  $('zoom').value=state.scale.toFixed(1);
  safeText('zoom-label',state.scale.toFixed(1)+'×');
},{passive:false});
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{last=0;});
(async()=>{
  try{
    const {WarriorStage}=await import('../render/three/WarriorStage.js');
    stage=new WarriorStage({canvas:heroCanvas,width:256,height:256,studio:true});
    stage.setZoom(state.scale);stage.setArmor(state.armor);
    stage.setEquipment({sword:true,shield:true});
    heroCanvas.hidden=false;
    resize();
    safeText('studio-status','THREE.JS · PERSONAGEM 3D');
  }catch(error){
    console.warn('WebGL 3D não disponível. Modo vetorial ativado.',error);
    fallback=true;heroCanvas.hidden=true;
    safeText('studio-status','MODO VETORIAL · WEBGL INDISPONÍVEL');
  }
})();
resize();requestAnimationFrame(tick);
