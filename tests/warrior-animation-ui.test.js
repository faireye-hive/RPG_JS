import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('editor C faz parte do build Vite e preserva fallback importmap',()=>{
 const vite=fs.readFileSync('vite.config.js','utf8');
 assert.ok(vite.includes("animationStudio: resolve(process.cwd(), 'warrior-animation-studio.html')"));
 const html=fs.readFileSync('warrior-animation-studio.html','utf8');
 assert.ok(html.includes('type="importmap"'));
 assert.ok(html.indexOf('type="importmap"')<html.indexOf('type="module"'));
 for(const id of ['studio-canvas','bone-list','selected-name','axis-x','axis-y','axis-z',
  'number-x','number-y','number-z','timeline','record','delete-key',
  'play','export-json','import-json','clip-select','auto-key','keyframe-lane','playhead'])
  assert.ok(html.includes('id="'+id+'"'),id);
});
test('gizmo real do Modelo C e importação/exportação no controlador',()=>{
 const view=fs.readFileSync('src/studio/WarriorRigViewport.js','utf8');
 const studio=fs.readFileSync('src/studio/WarriorAnimationStudio.js','utf8');
 for(const s of ['new WarriorRefinedModel','new TransformControls','new OrbitControls',
  'model.cRig.elbowSkins'])assert.ok(view.includes(s),s);
 for(const s of ['putFrame','nearestFrame','exportProject','parseProject','localStorage'])
  assert.ok(studio.includes(s),s);
});
