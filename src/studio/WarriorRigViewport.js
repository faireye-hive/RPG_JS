/**
 * 3D skeleton widget for the procedural Model C, with click-to-select joints
 * and native Three.js rotation handles. No textures or external 3D models.
 */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {WarriorRefinedModel} from '../render/three/WarriorRefinedModel.js';

const rad=Math.PI/180,deg=180/Math.PI;
const preferred=[
 'pelvis','spine','cervical.lower','cervical.upper','head',
 'clavicle.L','upperArm.L','lowerArm.L','hand.L','palm.L',
 'clavicle.R','upperArm.R','lowerArm.R','hand.R','palm.R',
 'upperLeg.L','lowerLeg.L','foot.L','upperLeg.R','lowerLeg.R','foot.R'
];
for(const side of ['L','R']){
 preferred.push('thumb.'+side+'.base','thumb.'+side+'.tip');
 for(let i=0;i<4;i++)preferred.push(
   'finger.'+side+'.'+i+'.base','finger.'+side+'.'+i+'.tip');
}
export class WarriorRigViewport{
 constructor(canvas,{onSelect=()=>{},onChange=()=>{},onDone=()=>{}}={}){
  this.canvas=canvas;this.onSelect=onSelect;this.onChange=onChange;
  this.onDone=onDone;this.showBones=true;this.selected=null;
  this.model=new WarriorRefinedModel();
  this.bones=new Map();this.rest=new Map();this.markers=[];
  this.scene=new THREE.Scene();
  this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,
   powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  this.renderer.setClearColor(0x0e1c27);
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.camera=new THREE.PerspectiveCamera(36,1,.05,60);
  this.orbit=new OrbitControls(this.camera,canvas);
  this.orbit.enableDamping=true;this.orbit.dampingFactor=.085;
  this.orbit.minDistance=2;this.orbit.maxDistance=12;
  this.orbit.maxPolarAngle=Math.PI*.84;
  this.resetCamera();
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x8293a1,2));
  const light=new THREE.DirectionalLight(0xfff1d9,3);
  light.position.set(-4,7,6);this.scene.add(light);
  const fill=new THREE.DirectionalLight(0xd4ecff,.85);
  fill.position.set(4,4,-5);this.scene.add(fill);
  const floor=new THREE.GridHelper(6,24,0x456774,0x2a444e);
  floor.position.y=-.015;this.scene.add(floor);
  this.scene.add(this.model.root);
  const seen=new Set();
  for(const name of preferred.concat(Object.keys(this.model.nodes))){
   const node=this.model.nodes[name];
   if(!node||seen.has(node))continue;
   seen.add(node);this.bones.set(name,node);
   this.rest.set(name,node.quaternion.clone());
  }
  this.gizmo=new TransformControls(this.camera,canvas);
  this.gizmo.setMode('rotate');this.gizmo.setSpace('local');
  this.gizmo.setSize(.75);
  this.scene.add(this.gizmo.getHelper());
  this.gizmo.addEventListener('dragging-changed',event=>{
   this.orbit.enabled=!event.value;
   if(!event.value)this.onDone();
  });
  this.gizmo.addEventListener('objectChange',()=>this.onChange(this.getPose()));
  this.makeSkeleton();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let start=null;
  this.onPointerDown=e=>start={x:e.clientX,y:e.clientY};
  this.onPointerUp=e=>{
   if(!start||!this.showBones||this.gizmo.dragging)return;
   if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>6)return;
   const r=canvas.getBoundingClientRect();
   pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
   raycaster.setFromCamera(pointer,this.camera);
   const found=raycaster.intersectObjects(this.markers,false);
   if(found.length)this.select(found[0].object.userData.boneName);
  };
  canvas.addEventListener('pointerdown',this.onPointerDown);
  canvas.addEventListener('pointerup',this.onPointerUp);
  this.onResize=()=>this.resize();
  window.addEventListener('resize',this.onResize);
  this.resize();
  this.lastFrame=0;this.raf=requestAnimationFrame(t=>this.draw(t));
 }
 resetCamera(){
  this.camera.position.set(0,2.8,6.0);
  this.orbit.target.set(0,1.2,0);
  this.orbit.update();
 }
 resize(){
  const w=Math.max(this.canvas.clientWidth,1),h=Math.max(this.canvas.clientHeight,1);
  this.renderer.setSize(w,h,false);this.camera.aspect=w/h;
  this.camera.updateProjectionMatrix();
 }
 makeSkeleton(){
  const nodeMap=new Map([...this.bones].map(([name,node])=>[node,name]));
  this.edges=[];
  for(const [name,node] of this.bones){
   const dot=new THREE.Mesh(new THREE.SphereGeometry(1,9,7),
     new THREE.MeshBasicMaterial({color:0x85dfcf,depthTest:false}));
   dot.name='joint.'+name;dot.userData.boneName=name;
   dot.renderOrder=4;this.scene.add(dot);this.markers.push(dot);
   let parent=node.parent;
   while(parent&&!nodeMap.has(parent))parent=parent.parent;
   if(parent)this.edges.push([node,this.bones.get(nodeMap.get(parent))]);
  }
  this.lines=new THREE.LineSegments(new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({color:0x78caba,transparent:true,opacity:.7,depthTest:false}));
  this.lines.geometry.setAttribute('position',
    new THREE.BufferAttribute(new Float32Array(this.edges.length*6),3));
  this.lines.renderOrder=3;this.scene.add(this.lines);
 }
 select(name){
  const node=this.bones.get(name);if(!node)return;
  this.selected=name;this.gizmo.attach(node);
  this.gizmo.visible=this.showBones;this.onSelect(name);
 }
 toggleSkeleton(visible){
  this.showBones=Boolean(visible);this.gizmo.visible=this.showBones&&!!this.selected;
  this.lines.visible=this.showBones;
  this.markers.forEach(m=>m.visible=this.showBones);
 }
 setPose(pose={}){
  const e=new THREE.Euler(),delta=new THREE.Quaternion();
  for(const [name,node] of this.bones){
   const degrees=pose[name]||[0,0,0];
   e.set(...degrees.map(v=>v*rad),'XYZ');
   delta.setFromEuler(e);
   node.quaternion.copy(this.rest.get(name)).multiply(delta);
  }
  this.syncSkin();
  this.model.root.updateMatrixWorld(true);
 }
 getPose(){
  const p={};
  for(const [name,node] of this.bones){
   const d=this.rest.get(name).clone().invert().multiply(node.quaternion);
   const e=new THREE.Euler().setFromQuaternion(d,'XYZ');
   const values=[e.x,e.y,e.z].map(v=>Math.round(v*deg*1000)/1000);
   if(values.some(v=>Math.abs(v)>.01))p[name]=values;
  }
  return p;
 }
 syncSkin(){
  for(const {elbow,bend} of this.model.cRig.elbowSkins)
   bend.rotation.copy(elbow.rotation);
 }
 draw(t){
  this.orbit.update();this.syncSkin();
  this.model.root.updateMatrixWorld(true);
  const v=new THREE.Vector3();
  for(const marker of this.markers){
   const selected=marker.userData.boneName===this.selected;
   marker.position.copy(this.bones.get(marker.userData.boneName).getWorldPosition(v));
   const small=/^(finger|thumb)\./.test(marker.userData.boneName);
   marker.scale.setScalar(selected?.045:small?.017:.026);
   marker.material.color.setHex(selected?0xffd184:0x85dfcf);
   marker.visible=this.showBones;
  }
  this.lines.visible=this.showBones;
  if(this.showBones){
   const attr=this.lines.geometry.getAttribute('position');
   let index=0;
   for(const [a,b] of this.edges){
    const p=a.getWorldPosition(new THREE.Vector3());
    const q=b.getWorldPosition(new THREE.Vector3());
    attr.setXYZ(index++,p.x,p.y,p.z);
    attr.setXYZ(index++,q.x,q.y,q.z);
   }
   attr.needsUpdate=true;
   this.lines.geometry.computeBoundingSphere();
  }
  this.renderer.render(this.scene,this.camera);
  this.raf=requestAnimationFrame(x=>this.draw(x));
 }
 screenshot(){
  this.renderer.render(this.scene,this.camera);
  return this.canvas.toDataURL('image/png');
 }
 dispose(){
  cancelAnimationFrame(this.raf);
  window.removeEventListener('resize',this.onResize);
  this.canvas.removeEventListener('pointerdown',this.onPointerDown);
  this.canvas.removeEventListener('pointerup',this.onPointerUp);
  this.orbit.dispose();this.gizmo.dispose();
  this.lines.geometry.dispose();this.lines.material.dispose();
  for(const m of this.markers){m.geometry.dispose();m.material.dispose()}
  this.model.dispose();this.renderer.dispose();
 }
}
