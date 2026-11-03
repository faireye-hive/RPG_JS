import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('FBX studio is in Vite bundle and supports raw Pages imports',()=>{
  const config=fs.readFileSync('vite.config.js','utf8');
  assert.ok(config.includes("mixamo: resolve(process.cwd(), 'mixamo-reference-studio.html')"));
  const html=fs.readFileSync('mixamo-reference-studio.html','utf8');
  assert.ok(html.includes('type="importmap"'));
  assert.ok(html.indexOf('type="importmap"')<html.indexOf('type="module"'));
  assert.ok(html.includes('src/studio/MixamoReferenceStudio.js'));
  for(const name of ['maria','kachujin'])
    assert.ok(html.includes('id="file-'+name+'"'));
  const js=fs.readFileSync('src/studio/MixamoReferenceStudio.js','utf8');
  for(const keyword of ['FBXLoader','GLTFLoader','arrayBuffer','SkeletonHelper','isSkinnedMesh','o.material=clay'])
    assert.ok(js.includes(keyword),keyword);
  assert.ok(!js.includes('fetch('),'local models should not be uploaded');
});

test('legacy FBX 6100 requires GLB conversion before browser import',()=>{
  const html=fs.readFileSync('mixamo-reference-studio.html','utf8');
  assert.ok(html.includes('FBX 6100'));
  assert.ok(html.includes('character_sem_texturas.glb'));
  assert.ok(html.includes('character2_sem_texturas.glb'));
});
