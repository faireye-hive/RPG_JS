import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {USER_IDLE_FRAMES} from '../src/studio/WarriorCUserIdle.js';
import {createStarterProject} from '../src/studio/WarriorAnimationData.js';
import {buildWarriorCTposeOBJ} from '../src/studio/WarriorCTposeExport.js';
test('Preserves the user-provided five-frame idle preset',()=>{
 const idle=createStarterProject().clips.find(c=>c.id==='idle');
 assert.equal(idle.duration,2);
 assert.equal(idle.keyframes.length,5);
 assert.deepEqual(idle.keyframes.map(f=>f.time),[0,.5,1,1.533,2]);
 assert.equal(idle.keyframes[2].pose['cervical.lower'][1],28.087);
 assert.deepEqual(idle.keyframes.map(f=>f.pose),USER_IDLE_FRAMES.map(f=>f[1]));
});
test('Exports true Warrior C geometry in a neutral T-pose',()=>{
 const {obj,mtl,stats}=buildWarriorCTposeOBJ();
 assert.equal(stats.pose,'T');assert.equal(stats.height_cm,180);
 assert.ok(stats.faces>1000&&stats.vertices>1000);
 assert.ok(obj.includes('o Guerreiro_C_Tpose'));
 assert.equal(obj.split('\n').filter(x=>x.startsWith('v ')).length,stats.vertices);
 assert.equal(obj.split('\n').filter(x=>x.startsWith('f ')).length,stats.faces);
 assert.ok(mtl.includes('newmtl argila_c'));
 const html=fs.readFileSync('warrior-animation-studio.html','utf8');
 assert.ok(html.includes('id="export-tpose-obj"'));
 assert.ok(html.includes('guerreiro-c-tpose-unificado.zip'));
 const js=fs.readFileSync('src/studio/WarriorAnimationStudio.js','utf8');
 assert.ok(js.includes('buildWarriorCTposeOBJ'));
});
