import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {WarriorModel} from '../src/render/three/WarriorModel.js';
import {WarriorSculptModel,sculptLoft,sculptSweep,sculptPanel} from '../src/render/three/WarriorSculptModel.js';

test('Modelo B é uma geometria procedural nova, sem mapas de textura',()=>{
  const modelA=new WarriorModel({armor:'cloth',sword:false,shield:false});
  const modelB=new WarriorSculptModel();
  assert.notEqual(modelA.root,modelB.root);
  let firstGeometryA=null,firstGeometryB=null;
  modelA.root.traverse(o=>{if(o.isMesh&&!firstGeometryA)firstGeometryA=o.geometry;});
  modelB.root.traverse(o=>{if(o.isMesh&&!firstGeometryB)firstGeometryB=o.geometry;});
  assert.ok(firstGeometryA&&firstGeometryB);
  assert.notEqual(firstGeometryA,firstGeometryB);
  const meshes=[];
  modelB.root.traverse(obj=>{if(obj.isMesh)meshes.push(obj);});
  assert.ok(meshes.length>=50,'B deve conter detalhes 3D suficientes');
  assert.ok(meshes.every(m=>m.material===modelB.material));
  assert.equal(modelB.material.map,null);
  assert.equal(modelB.material.normalMap,null);
  assert.equal(modelB.material.bumpMap,null);
  assert.equal(modelB.material.metalness,0);
  assert.equal(modelB.material.roughness,1);
  assert.equal(modelB.weapon,undefined);
  assert.equal(modelB.shield,undefined);
  modelA.dispose();modelB.dispose();
});
test('Malhas orgânicas e curvas possuem vértices finitos',()=>{
  const geometries=[
    sculptLoft([[0,.08,.12],[.3,.12,.15],[.7,.16,.13]],16),
    sculptSweep([[0,0,0],[.07,.2,.1],[.19,.4,.1]],[.035,.025,.002],16,8),
    sculptPanel({rows:8,cols:10,folds:4})
  ];
  for(const geometry of geometries){
    const v=geometry.getAttribute('position');
    assert.ok(v.count>20);
    assert.ok(geometry.getIndex().count>30);
    for(const n of v.array)assert.ok(Number.isFinite(n));
    geometry.dispose();
  }
});
test('B mantém proporções humanas esguias e pés próximos do solo',()=>{
  const model=new WarriorSculptModel();
  const bounds=new THREE.Box3().setFromObject(model.root);
  const size=bounds.getSize(new THREE.Vector3());
  assert.ok(size.y>2.25&&size.y<3.05,JSON.stringify(size));
  assert.ok(size.x>0.6&&size.x<1.35,JSON.stringify(size));
  assert.ok(bounds.min.y>-.16&&bounds.min.y<.21,String(bounds.min.y));
  model.dispose();
});
test('Rig B movimenta braços, joelhos e gira sem trocar a geometria',()=>{
  const model=new WarriorSculptModel();
  const nodes=model.getHierarchy();
  for(const name of ['pelvis','spine','head','upperArm.L','lowerArm.R','hand.L',
    'upperLeg.R','lowerLeg.L','foot.R'])assert.ok(nodes.includes(name),name);
  const root=model.root;
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    model.update({vx:190,vy:20,attackPose:.13},1,.05,{yaw,instant:true});
    assert.equal(model.root,root);
    assert.ok(Math.abs(model.root.rotation.y-yaw)<1e-7);
    assert.ok(Math.abs(model.leftLeg.rotation.x)>0);
    assert.ok(Math.abs(model.rightArm.rotation.x)>0);
  }
  model.dispose();
});
