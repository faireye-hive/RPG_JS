import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {WarriorModel,loftGeometry,yawFromFacing,angleDifference} from '../src/render/three/WarriorModel.js';

test('loft procedural gera malha 3D com vértices e normais finitos',()=>{
  const geometry=loftGeometry([[0,.2,.12],[1,.15,.10],[1.3,.1,.08]],12);
  const pos=geometry.getAttribute('position');
  assert.equal(pos.count,36);assert.ok(geometry.getIndex().count>0);
  for(const v of pos.array)assert.ok(Number.isFinite(v));
  geometry.dispose();
});
test('hierarquia de articulações independente de armadura e equipamento',()=>{
  const m=new WarriorModel();
  const names=m.getHierarchy();
  for(const name of ['pelvis','head','spine','upperArm.L','lowerArm.R','hand.R',
    'upperLeg.L','lowerLeg.L','foot.R'])assert.ok(names.includes(name),name);
  assert.ok(names.length>=14);
  assert.ok(m.armorPieces.visible);assert.ok(m.shield.visible);assert.ok(m.weapon.visible);
  m.setArmor('cloth');m.setEquipment({sword:false,shield:false});
  assert.ok(!m.armorPieces.visible&&!m.weapon.visible&&!m.shield.visible);
  m.setArmor('light');m.setEquipment({sword:true,shield:true});
  assert.ok(m.armorPieces.visible&&m.weapon.visible&&m.shield.visible);
  m.dispose();
});
test('o Guerreiro é esguio e mantém o pé perto do chão',()=>{
  const m=new WarriorModel();
  m.update({vx:0,vy:0,facing:Math.PI/2},0,1/60,{instant:true});
  const box=new THREE.Box3().setFromObject(m.root);
  const size=box.getSize(new THREE.Vector3());
  assert.ok(size.y<3.1&&size.y>2.3,JSON.stringify(size));
  assert.ok(size.x<1.65,JSON.stringify(size));
  assert.ok(box.min.y>-.25&&box.min.y<.23,String(box.min.y));
  m.dispose();
});
test('gira em 360 graus e atualiza passos, joelhos, braços e ataque',()=>{
  const m=new WarriorModel();
  for(const facing of [0,Math.PI/4,Math.PI/2,Math.PI,Math.PI*1.75]){
    m.update({vx:200,vy:100,facing,attackPose:.13},1,.05,{instant:true});
    assert.ok(Math.abs(angleDifference(m.root.rotation.y,yawFromFacing(facing)))<1e-8);
    assert.ok(m.leftLeg.rotation.x!==0&&m.rightLeg.rotation.x!==0);
    assert.ok(m.rightArm.rotation.z<.1);
  }
  assert.ok(Number.isFinite(m.phase));
  m.dispose();
});
