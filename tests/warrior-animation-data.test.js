import test from 'node:test';
import assert from 'node:assert/strict';
import {ANIMATION_FORMAT,createStarterProject,createClip,parseProject,exportProject,
 putFrame,removeFrame,nearestFrame,shortestAngle,mixPoses,sampleClip
} from '../src/studio/WarriorAnimationData.js';
test('C possui quatro clipes iniciais e exportação JSON com roundtrip',()=>{
 const p=createStarterProject();
 assert.equal(p.format,ANIMATION_FORMAT);
 assert.deepEqual(p.clips.map(c=>c.id),['idle','walk','wave','attack']);
 assert.deepEqual(parseProject(exportProject(p)),p);
 for(const c of p.clips)assert.ok(c.keyframes.length>=3);
});
test('quadros são ordenados e substituídos sem duplicação',()=>{
 const c=createClip('Teste',2,'test');
 putFrame(c,1,{head:[5,0,0]});
 putFrame(c,0,{head:[0,0,0]});
 putFrame(c,1,{head:[20,0,0]});
 assert.deepEqual(c.keyframes.map(f=>f.time),[0,1]);
 assert.deepEqual(nearestFrame(c,1).pose.head,[20,0,0]);
 assert.equal(removeFrame(c,1),true);
 assert.equal(removeFrame(c,1),false);
});
test('interpolação angular usa arco curto e respeita loop',()=>{
 assert.equal(shortestAngle(170,-170,.5),180);
 const c=createClip('Teste',2,'test');
 putFrame(c,0,{head:[170,0,0]});
 putFrame(c,1,{head:[-170,0,0]});
 assert.deepEqual(sampleClip(c,.5).head,[180,0,0]);
 assert.deepEqual(sampleClip(c,2.5).head,[180,0,0]);
 assert.deepEqual(mixPoses({head:[0,0,0]},{head:[60,30,-30]},.5).head,[30,15,-15]);
});
test('clipe sem loop mantém a pose final',()=>{
 const c=createClip('Ataque',1,'attack');c.loop=false;
 putFrame(c,0,{head:[0,0,0]});putFrame(c,1,{head:[40,0,0]});
 const saved=JSON.stringify(c);
 assert.deepEqual(sampleClip(c,7).head,[40,0,0]);
 assert.equal(JSON.stringify(c),saved);
});
test('JSON malformado é rejeitado',()=>{
 assert.throws(()=>parseProject({format:'bad',version:1,model:'C',clips:[{}]}));
 const p=createStarterProject();
 p.clips[0].keyframes[0].time=999;
 assert.throws(()=>parseProject(p),/Tempo de quadro/);
});
