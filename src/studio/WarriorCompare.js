/**
 * Comparison room — two completely different 3D geometries, one renderer.
 * Same neutral clay material, lights and orthographic camera for a fair vote.
 * Neither model changes the character selected inside the game.
 */
import * as THREE from 'three';
import { WarriorModel } from '../render/three/WarriorModel.js';
import { WarriorSculptModel } from '../render/three/WarriorSculptModel.js';
import { WarriorRefinedModel } from '../render/three/WarriorRefinedModel.js';

const $=id=>document.getElementById(id);
const canvas=$('comparison');
const state={view:'BC',motion:'idle',direction:0,zoom:1,paused:false,
  wire:false,joints:false,auto:false,drag:false,
  manualRig:{neck:0,shoulder:0,elbow:0,wrist:0,fingers:0}};
const actor={vx:0,vy:0,facing:Math.PI/2,attackPose:0,inv:0};
const dpr=()=>Math.min(window.devicePixelRatio||1,1.75);
let renderer,scene,camera,modelA,modelB,modelC,clayA,parts=[],jointMarkers=[];
let previousX=0,clock=0,last=0,frameHandle=0;
const directions={front:0,frontRight:Math.PI/4,right:Math.PI/2,
  backRight:3*Math.PI/4,back:Math.PI,backLeft:-3*Math.PI/4,
  left:-Math.PI/2,frontLeft:-Math.PI/4};

function configure(){
  scene=new THREE.Scene();
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,
    preserveDrawingBuffer:true,premultipliedAlpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(dpr());
  renderer.setClearColor(0,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;

  // Clay lighting: neutral, no painted texture or environment maps.
  scene.add(new THREE.HemisphereLight(0xffffff,0x77818b,2));
  const key=new THREE.DirectionalLight(0xfff7e9,3.0);
  key.position.set(-3.5,5,7);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc8e4ee,1.35);
  fill.position.set(4,3,-3);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffffff,.55);
  rim.position.set(1,6,-6);scene.add(rim);

  camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,40);
  camera.position.set(0,3.24,9.4);
  camera.lookAt(0,1.34,0);
  modelA=new WarriorModel({armor:'cloth',sword:false,shield:false});
  modelB=new WarriorSculptModel();
  modelC=new WarriorRefinedModel();
  // Critical: the original mesh stays intact. Only the comparison stage
  // swaps its material for a single matte clay material.
  clayA=new THREE.MeshStandardMaterial({
    color:0xc8c7c4,roughness:1,metalness:0,side:THREE.DoubleSide
  });
  modelA.root.traverse(obj=>{
    if(obj.isMesh)obj.material=clayA;
  });
  scene.add(modelA.root,modelB.root,modelC.root);
  parts=[modelA,modelB,modelC];
  for(const mod of parts){
    const markers=new THREE.Group();mod.root.add(markers);
    markers.visible=false;
    const nodeData=mod.nodes||{};
    for(const [name,node] of Object.entries(nodeData)){
      const dot=new THREE.Mesh(
        new THREE.SphereGeometry(.023,8,6),
        new THREE.MeshBasicMaterial({color:0x3ba3a5,depthTest:false})
      );
      dot.name='articulação.'+name;
      markers.add(dot);
      jointMarkers.push({model:mod,markers,node,dot});
    }
  }
  applyLayout();resize();
}
function applyLayout(){
  if(!modelA||!modelB||!modelC)return;
  const view=state.view;
  modelA.root.visible=view==='ABC'||view==='A';
  modelB.root.visible=view==='ABC'||view==='BC'||view==='B';
  modelC.root.visible=view==='ABC'||view==='BC'||view==='C';
  // The centerline and eye height match across all three silhouettes.
  modelA.root.position.x=view==='ABC'?-1.55:0;
  modelB.root.position.x=view==='ABC'?0:(view==='BC'?-.94:0);
  modelC.root.position.x=view==='ABC'?1.55:(view==='BC'?.94:0);
  for(const id of ['a','b','c']){
    const model={a:modelA,b:modelB,c:modelC}[id];
    $('label-'+id).hidden=!model.root.visible;
  }
  $('labels').classList.toggle('solo',view==='A'||view==='B'||view==='C');
  document.querySelectorAll('[data-model]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.model===view);
    btn.setAttribute('aria-pressed',String(btn.dataset.model===view));
  });
  resize();
}
function resize(){
  if(!renderer)return;
  const rect=canvas.getBoundingClientRect();
  const width=Math.max(1,Math.floor(rect.width));
  const height=Math.max(1,Math.floor(rect.height));
  renderer.setPixelRatio(dpr());
  renderer.setSize(width,height,false);
  const aspect=width/height;
  // Side-by-side stays visible even on portrait phones. No stretching.
  const minWidth=state.view==='ABC'?5.02:state.view==='BC'?3.28:1.55;
  const h=Math.max(3.42,minWidth/aspect)/state.zoom;
  camera.left=-h*aspect/2;camera.right=h*aspect/2;
  camera.top=h/2;camera.bottom=-h/2;
  camera.updateProjectionMatrix();
}
function refreshMaterials(){
  clayA.wireframe=state.wire;
  modelB.material.wireframe=state.wire;
  modelC.material.wireframe=state.wire;
}
function rotation(angle){
  state.direction=angle;
  const found=Object.entries(directions).find(([,v])=>
    Math.abs(Math.atan2(Math.sin(angle-v),Math.cos(angle-v)))<.028);
  $('direction').value=found?.[0]??'free';
}
function render(now){
  const dt=Math.min(.055,Math.max(0,(now-(last||now))/1000));
  last=now;
  if(!state.paused){
    clock+=dt;
    if(state.auto)rotation(state.direction+dt*.55);
  }
  actor.vx=state.motion==='walk'?180:0;
  actor.vy=state.motion==='walk'?30:0;
  actor.demoGesture=state.motion==='gesture'?1:0;
  actor.manualRig=state.manualRig;
  const swing=clock%1.15;
  actor.attackPose=state.motion==='attack'&&swing<.27?.27-swing:0;
  for(const mod of parts){
    if(mod.root.visible)mod.update(actor,clock,state.paused?0:dt,
      {yaw:state.direction,instant:true});
  }
  // Draw joint markers in each independent skeleton's local space.
  if(state.joints){
    for(const {model,markers,node,dot} of jointMarkers){
      if(!model.root.visible)continue;
      model.root.updateMatrixWorld(true);
      const worldPos=node.getWorldPosition(new THREE.Vector3());
      dot.position.copy(markers.worldToLocal(worldPos));
      markers.visible=true;
    }
  }else for(const {markers} of jointMarkers)markers.visible=false;
  renderer.render(scene,camera);
  frameHandle=requestAnimationFrame(render);
}
function selectMotion(motion){
  state.motion=motion;
  document.querySelectorAll('[data-motion]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.motion===motion);
  });
}
function saveBlob(blob,filename){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),10_000);
}
function saveImage(){
  if(!renderer)return;
  renderer.render(scene,camera);
  const a=document.createElement('a');
  a.href=canvas.toDataURL('image/png');
  a.download='comparacao-guerreiro-modelos-3d-sem-textura.png';
  document.body.appendChild(a);a.click();a.remove();
}
async function saveOBJ(which='C'){
  const btn=$(which==='B'?'export-obj-b':'export-obj-c');
  const label=btn.textContent;
  btn.disabled=true;btn.textContent='PREPARANDO OBJ...';
  try{
    const {OBJExporter}=await import('three/addons/exporters/OBJExporter.js');
    const source=which==='B'?modelB:modelC;
    const clone=source.root.clone(true);
    // Restore neutral local origin when exporting a posed rig.
    clone.position.set(0,0,0);
    clone.updateMatrixWorld(true);
    const data=new OBJExporter().parse(clone);
    saveBlob(new Blob([data],{type:'text/plain;charset=utf-8'}),
      'guerreiro-modelo-'+which.toLowerCase()+'-sem-textura.obj');
  }catch(error){
    console.error(error);$('status').textContent='Não foi possível exportar OBJ.';
  }finally{btn.disabled=false;btn.textContent=label;}
}
function hookup(){
  document.querySelectorAll('[data-model]').forEach(btn=>btn.addEventListener('click',()=>{
    state.view=btn.dataset.model;applyLayout();
  }));
  document.querySelectorAll('[data-motion]').forEach(btn=>btn.addEventListener('click',()=>{
    selectMotion(btn.dataset.motion);
  }));
  $('direction').addEventListener('change',e=>{
    if(e.target.value!=='free')rotation(directions[e.target.value]??0);
  });
  $('zoom').addEventListener('input',e=>{
    state.zoom=Number(e.target.value);
    $('zoom-out').textContent=state.zoom.toFixed(1)+'×';resize();
  });
  $('wireframe').addEventListener('change',e=>{
    state.wire=e.target.checked;refreshMaterials();
  });
  $('bones').addEventListener('change',e=>state.joints=e.target.checked);
  $('spin').addEventListener('change',e=>state.auto=e.target.checked);
  document.querySelectorAll('[data-rig]').forEach(slider=>slider.addEventListener('input',()=>{
    const key=slider.dataset.rig;
    state.manualRig[key]=Number(slider.value);
    const output=document.getElementById('rig-'+key);
    if(output)output.textContent=Number(slider.value).toFixed(2);
  }));
  $('pause').addEventListener('click',e=>{
    state.paused=!state.paused;
    e.currentTarget.textContent=state.paused?'▶ Continuar':'Ⅱ Pausar';
  });
  $('export-png').addEventListener('click',saveImage);
  $('export-obj-b').addEventListener('click',()=>saveOBJ('B'));
  $('export-obj-c').addEventListener('click',()=>saveOBJ('C'));
  $('reset').addEventListener('click',()=>{
    Object.assign(state,{view:'BC',motion:'idle',direction:0,zoom:1,
      paused:false,wire:false,joints:false,auto:false,drag:false});
    state.manualRig={neck:0,shoulder:0,elbow:0,wrist:0,fingers:0};
    document.querySelectorAll('[data-rig]').forEach(slider=>{
      slider.value='0';document.getElementById('rig-'+slider.dataset.rig).textContent='0.00';
    });
    clock=0;$('direction').value='front';$('zoom').value='1';
    $('zoom-out').textContent='1.0×';
    $('wireframe').checked=false;$('bones').checked=false;$('spin').checked=false;
    $('pause').textContent='Ⅱ Pausar';
    selectMotion('idle');refreshMaterials();applyLayout();
  });
  canvas.addEventListener('pointerdown',e=>{
    state.drag=true;previousX=e.clientX;canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!state.drag)return;
    const dx=e.clientX-previousX;previousX=e.clientX;
    rotation(state.direction+dx*.011);
  });
  canvas.addEventListener('pointerup',()=>state.drag=false);
  canvas.addEventListener('pointercancel',()=>state.drag=false);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();state.zoom=clampZoom(state.zoom+(e.deltaY<0?.1:-.1));
    $('zoom').value=state.zoom;$('zoom-out').textContent=state.zoom.toFixed(1)+'×';
    resize();
  },{passive:false});
  window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>last=0);
  window.addEventListener('pagehide',()=>{
    cancelAnimationFrame(frameHandle);
    for(const marker of jointMarkers){
      marker.dot.geometry.dispose();marker.dot.material.dispose();
    }
    modelA?.dispose();modelB?.dispose();modelC?.dispose();clayA?.dispose();renderer?.dispose();
  },{once:true});
}
function clampZoom(v){return Math.max(.65,Math.min(1.8,Math.round(v*10)/10));}
try{
  configure();hookup();requestAnimationFrame(render);
}catch(error){
  console.error('Erro ao abrir a comparação 3D:',error);
  $('status').textContent='WebGL indisponível neste navegador. Experimente habilitar a aceleração gráfica.';
  $('error').hidden=false;
  canvas.hidden=true;
}
