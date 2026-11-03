import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world/World.js';
import { hash2, normalize, formatTime } from '../src/core/math.js';
import { xpForLevel, createChoices, applyChoice } from '../src/systems/Progression.js';
import { WEAPONS } from '../src/data/weapons.js';

test('o mapa procedural é determinístico',()=>{
  const a=new World(173),b=new World(173);
  for(const [x,y] of [[0,0],[-200,500],[13,-9],[8192,-3000]]){
    assert.deepEqual(a.tileAt(x,y),b.tileAt(x,y));
  }
  assert.equal(a.biomeAt(0,0),'sanctuary');
  assert.ok(hash2(-31,7)>=0&&hash2(-31,7)<1);
});
test('vetor de movimento e relógio',()=>{
  const n=normalize(4,3);
  assert.ok(Math.abs(n.x-.8)<1e-10);
  assert.ok(Math.abs(n.y-.6)<1e-10);
  assert.deepEqual(normalize(0,0),{x:0,y:0});
  assert.equal(formatTime(123.9),'02:03');
});
test('XP e evolução de armas e atributos',()=>{
  assert.ok(xpForLevel(5)>xpForLevel(4));
  const g={player:{hp:80,maxHp:100,might:1,speed:200,magnet:70,armor:1},
    weapons:[{id:'blade',level:1,cooldown:0}],upgrades:{}};
  assert.equal(applyChoice(g,'weapon:blade'),true);
  assert.equal(g.weapons[0].level,2);
  assert.equal(applyChoice(g,'stat:vitality'),true);
  assert.equal(g.player.maxHp,125);assert.equal(g.player.hp,105);
  assert.equal(applyChoice(g,'weapon:aura'),true);
  assert.ok(g.weapons.some(w=>w.id==='aura'&&w.level===1));
  assert.equal(applyChoice(g,'weapon:inexistente'),false);
  assert.equal(createChoices(g).length,3);
  assert.ok(Object.keys(WEAPONS).length>=4);
});
