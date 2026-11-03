import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {WarriorSculptModel} from '../src/render/three/WarriorSculptModel.js';
import {WarriorRefinedModel} from '../src/render/three/WarriorRefinedModel.js';

function allMeshes(root){
  const meshes=[];root.traverse(obj=>{if(obj.isMesh)meshes.push(obj);});return meshes;
}
test('C inherits visual identity of B but replaces tube-like shoulder and rigid palms',()=>{
  const b=new WarriorSculptModel(),c=new WarriorRefinedModel();
  assert.ok(c instanceof WarriorSculptModel);
  assert.ok(allMeshes(c.root).length>allMeshes(b.root).length);
  for(const arm of [c.leftArm,c.rightArm])
    assert.ok(arm.children.some(o=>o.name.startsWith('deltoide.anatômico')),'no sculpted shoulder');
  for(const arm of [c.leftArm,c.rightArm])
    assert.ok(!arm.children.some(o=>o.name==='manga.justaposta'),'old upper arm tube still present');
  for(const hand of [c.leftHand,c.rightHand])
    assert.ok(!hand.children.some(o=>o.name==='palma.anatômica'),'old fixed palm still present');
  assert.equal(c.root.name,'modelo-c.escultura-anatômica');
  b.dispose();c.dispose();
});
test('C uses a uniform matte material without textures or metal',()=>{
  const c=new WarriorRefinedModel(),mesh=allMeshes(c.root);
  assert.ok(mesh.length>=85,String(mesh.length));
  for(const part of mesh){
    assert.equal(part.material,c.material,part.name);
    for(const map of ['map','normalMap','bumpMap','roughnessMap','metalnessMap'])
      assert.equal(part.material[map],null,part.name+': '+map);
  }
  assert.equal(c.material.metalness,0);
  assert.equal(c.material.roughness,1);
  assert.equal(c.material.color.getHex(),0xc8c7c4);
  c.dispose();
});
test('hierarchical clavicle, cervical pivots, wrists and 10 hinged fingers',()=>{
  const c=new WarriorRefinedModel(),names=c.getHierarchy();
  for(const key of ['clavicle.L','clavicle.R','cervical.lower','cervical.upper',
    'palm.L','palm.R','finger.L.0.base','finger.L.0.tip','finger.R.3.base',
    'finger.R.3.tip','thumb.L.tip','thumb.R.base'])assert.ok(names.includes(key),key);
  assert.equal(c.cRig.shoulders.length,2);
  assert.equal(c.cRig.wrists.length,2);
  assert.equal(c.cRig.fingers.reduce((n,g)=>n+g.knuckles.length,0),8);
  assert.equal(c.cRig.thumbs.length,2);
  assert.equal(c.neck.parent,c.cervical);
  assert.equal(c.cervical.parent,c.spine);
  c.dispose();
});
test('gesture moves shoulder, elbow, hand, fingers and neck independently',()=>{
  const c=new WarriorRefinedModel();
  const actor={vx:0,vy:0,facing:Math.PI/2,attackPose:0,demoGesture:1};
  for(let i=0;i<20;i++)c.update(actor,i/25,.05,{yaw:Math.PI/2,instant:true});
  const shoulder=c.cRig.shoulders.find(o=>o.side>0);
  const wrist=c.cRig.wrists.find(o=>o.side>0);
  const finger=c.cRig.fingers.find(o=>o.side>0).knuckles[1];
  assert.ok(shoulder.upper.rotation.z>.5, 'shoulder should raise the arm');
  assert.ok(shoulder.elbow.rotation.x<-.6,'elbow should bend during wave');
  assert.ok(Math.abs(wrist.wrist.rotation.z)>.04,'wrist should move');
  assert.ok(Math.abs(wrist.palm.rotation.x)>.04,'palm should move separately');
  assert.ok(finger.base.rotation.x<-.1,'proximal phalanx must bend');
  assert.ok(finger.distal.rotation.x<-.1,'distal phalanx must bend');
  assert.ok(Math.abs(c.cervical.rotation.y)>.03,'lower neck should rotate');
  assert.ok(Math.abs(c.neck.rotation.y)>.03,'upper neck should rotate');
  assert.ok(Math.abs(c.head.rotation.y)>.03,'head should rotate independently');
  assert.ok(Math.abs(c.root.rotation.y-Math.PI/2)<1e-8);
  c.dispose();
});
test('walking and attack preserve plausible slim footprint and finite transforms',()=>{
  const c=new WarriorRefinedModel();
  for(let j=0;j<12;j++)c.update({
    vx:180,vy:20,facing:j*Math.PI/6,attackPose:j%3===0?.135:0
  },j*.21,.04,{instant:true});
  const bounds=new THREE.Box3().setFromObject(c.root);
  const size=bounds.getSize(new THREE.Vector3());
  assert.ok(size.y>2.1&&size.y<3.2,JSON.stringify(size));
  assert.ok(size.x>0.5&&size.x<1.8,JSON.stringify(size));
  c.root.traverse(o=>{
    for(const value of [...o.position.toArray(),...o.rotation.toArray().slice(0,3)])
      assert.ok(Number.isFinite(value),o.name);
  });
  c.dispose();
});

test('painel manual C altera somente articulações solicitadas e mantém a geometria',()=>{
  const c=new WarriorRefinedModel(),actor={
    vx:0,vy:0,facing:Math.PI/2,attackPose:0,demoGesture:0,
    manualRig:{neck:.6,shoulder:.8,elbow:.7,wrist:-.5,fingers:.9}
  };
  c.update(actor,0,1/60,{instant:true});
  const rightShoulder=c.cRig.shoulders.find(v=>v.side===1);
  const rightWrist=c.cRig.wrists.find(v=>v.side===1);
  const rightFinger=c.cRig.fingers.find(v=>v.side===1).knuckles[0];
  assert.ok(rightShoulder.upper.rotation.z>1);
  assert.ok(rightShoulder.elbow.rotation.x<-.8);
  assert.ok(rightWrist.wrist.rotation.z<-.25);
  assert.ok(rightFinger.base.rotation.x<-.6);
  assert.ok(c.cervical.rotation.y>.35);
  assert.ok(Math.abs(c.cRig.shoulders.find(v=>v.side===-1).upper.rotation.z)<.4);
  c.dispose();
});
