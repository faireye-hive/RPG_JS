import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const htmlPaths=['index.html','warrior-studio.html','warrior-compare.html'];
const expected={
  three:'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
  'three/addons/':'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/'
};
test('all HTML entry points resolve native bare Three.js imports',()=>{
  for(const path of htmlPaths){
    const html=fs.readFileSync(path,'utf8');
    const opening='<script type="importmap">';
    const start=html.indexOf(opening);
    assert.ok(start>=0,'missing importmap: '+path);
    const end=html.indexOf('</script>',start);
    assert.ok(end>start,'invalid importmap end in '+path);
    const imports=JSON.parse(html.slice(start+opening.length,end)).imports;
    assert.deepEqual(imports,expected,'wrong importmap in '+path);
    assert.ok(start<html.indexOf('type="module"'),'importmap must be before native modules');
    assert.ok(start<html.indexOf('</head>'),'importmap must be inside head');
  }
});
test('native fallback uses the same version as package.json',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.equal(pkg.dependencies.three,'^0.180.0');
  assert.ok(expected.three.includes('three@0.180.0/'));
  assert.ok(expected['three/addons/'].includes('three@0.180.0/'));
});
