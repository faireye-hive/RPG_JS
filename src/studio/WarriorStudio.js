import { World } from '../world/World.js';
import { drawWarrior } from '../render/characters/Warrior.js';

const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d');
const world=new World(173);
const state={motion:'idle',face:'front',scale:2.4,background:'world',gear:'full',paused:false};
const player={vx:0,vy:0,facing:0,inv:0,attackPose:0};
let width=1,height=1,dpr=1,t=0,last=0;
function resize(){
  const bounds=canvas.getBoundingClientRect();
  width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);
  dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
  if(!state.paused)t+=dt;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  if(state.background==='world'){
    world.draw(ctx,-width*.5,-height*.79,width,height,t);
    ctx.fillStyle='#0a182747';ctx.fillRect(0,0,width,height);
  }else{
    ctx.fillStyle=state.background==='light'?'#b5cbbf':'#12252f';
    ctx.fillRect(0,0,width,height);
    ctx.strokeStyle=state.background==='light'?'#2e64572e':'#b3dbc31c';
    ctx.lineWidth=1;
    for(let x=0;x<width;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
    for(let y=0;y<height;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  }
  const glow=ctx.createRadialGradient(width*.5,height*.55,4,width*.5,height*.55,Math.max(width,height)*.57);
  glow.addColorStop(0,'#97f5d02a');glow.addColorStop(1,'#07151a00');
  ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
  player.vx=state.motion==='walk'?185:0;player.vy=state.motion==='walk'?45:0;
  player.facing=0;
  const strike=t%1.08;
  player.attackPose=state.motion==='attack'&&strike<.27?.27-strike:0;
  const scale=Math.max(.2,Math.min(state.scale,(height*.79-18)/181,(width*.47)/91));
  drawWarrior(ctx,player,width*.5,height*.79,t,{face:state.face,scale,equipment:state.gear});
  requestAnimationFrame(frame);
}
function active(selector,property,value){
  document.querySelectorAll(selector).forEach(b=>b.classList.toggle('active',b.dataset[property]===value));
}
document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>{
  state.motion=b.dataset.motion;active('[data-motion]','motion',state.motion);
}));
document.querySelectorAll('[data-gear]').forEach(b=>b.addEventListener('click',()=>{
  state.gear=b.dataset.gear;active('[data-gear]','gear',state.gear);
}));
$('view').addEventListener('change',e=>state.face=e.target.value);
$('background').addEventListener('change',e=>state.background=e.target.value);
$('zoom').addEventListener('input',e=>{
  state.scale=Number(e.target.value);$('zoom-label').value=state.scale.toFixed(1)+'×';
});
$('freeze').addEventListener('click',()=>{
  state.paused=!state.paused;
  $('freeze').textContent=state.paused?'▶ Retomar':'Ⅱ Pausar';
  $('freeze').classList.toggle('active',state.paused);
});
$('reset').addEventListener('click',()=>{
  Object.assign(state,{motion:'idle',face:'front',scale:2.4,background:'world',gear:'full',paused:false});
  t=0;$('view').value='front';$('zoom').value='2.4';$('zoom-label').value='2.4×';
  $('background').value='world';$('freeze').textContent='Ⅱ Pausar';$('freeze').classList.remove('active');
  active('[data-motion]','motion','idle');active('[data-gear]','gear','full');
});
$('export').addEventListener('click',()=>{
  const out=document.createElement('canvas');out.width=1000;out.height=1050;
  const c=out.getContext('2d');
  drawWarrior(c,player,500,880,t,{face:state.face,scale:4.5,shadow:false,equipment:state.gear});
  const link=document.createElement('a');
  link.download='guerreiro-procedural-eter.png';
  link.href=out.toDataURL('image/png');link.click();
});
window.addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{last=0;});
resize();requestAnimationFrame(frame);
