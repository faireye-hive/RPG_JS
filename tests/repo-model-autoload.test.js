import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('public models folder exists and viewer auto-loads hosted GLB',()=>{
 const js=fs.readFileSync('src/studio/MixamoReferenceStudio.js','utf8');
 const html=fs.readFileSync('mixamo-reference-studio.html','utf8');
 for(const n of ['Maria_caminhando_sem_texturas.glb','Kachujin_caminhando_sem_texturas.glb']){
   assert.ok(js.includes(n),n);
 }
 assert.ok(js.includes("'./models/'+name"));
 assert.ok(js.includes("'./public/models/'+name"));
 assert.ok(js.includes("validGLBHeader(bytes)"));
 assert.ok(js.includes("autoLoadRepoModels()"));
 assert.ok(js.includes("fetch(relativeUrl"));
 assert.ok(html.includes('id="github-maria"'));
 assert.ok(html.includes('id="github-kachujin"'));
 assert.ok(fs.existsSync('public/models/README.md'));
});
