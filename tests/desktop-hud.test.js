import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hudStats,minimapMarkers,MINIMAP_RADIUS} from '../src/ui/HudData.js';

function sample(){
  return {
    player:{classId:'guardian',hp:136,maxHp:140,level:2,
      armor:4,might:1.15,speed:226,xp:2,nextXp:56,x:150,y:-90},
    elapsed:15,kills:3,
    weapons:[{id:'blade',level:2,cooldown:.3},{id:'aura',level:1,cooldown:0}],
    enemies:[
      {x:150,y:-90,hp:8},{x:150+MINIMAP_RADIUS+1,y:-90,hp:8},
      {x:100,y:-60,hp:0},{x:170,y:-80,hp:100,boss:true}
    ],
    drops:[{x:170,y:-70,life:25,kind:'xp'},{x:190,y:-100,life:0,kind:'xp'}]
  };
}
test('HUD uses real combat stats and automatic weapon cooldowns',()=>{
 const s=hudStats(sample());
 assert.equal(s.name,'Guerreiro');
 assert.equal(s.hp,136);assert.equal(s.maxHp,140);
 assert.ok(s.hpPct>97&&s.hpPct<98);
 assert.equal(s.armor,4);assert.equal(s.mightPct,115);
 assert.equal(s.speed,226);assert.equal(s.level,2);
 assert.equal(s.elapsed,15);assert.equal(s.kills,3);
 assert.equal(s.xp,2);assert.equal(s.nextXp,56);
 assert.equal(s.weapons.length,2);
 assert.equal(s.weapons[0].name,'Lâmina solar');
 assert.ok(s.weapons[0].rechargePct>0&&s.weapons[0].rechargePct<=100);
 assert.equal(s.weapons[1].rechargePct,0);
 assert.equal('mana' in s,false);
 assert.equal('hunger' in s,false);
});
test('HUD clamps health and cooldown percentages safely',()=>{
 const g=sample();g.player.hp=-9;g.weapons[0].cooldown=999;
 assert.equal(hudStats(g).hpPct,0);
 assert.equal(hudStats(g).weapons[0].rechargePct,100);
});
test('minimap uses player-centered positions and filters far or dead enemies',()=>{
 const g=sample(),minimap=minimapMarkers(g);
 assert.equal(minimap.enemies.length,2);
 assert.deepEqual(minimap.enemies[0],{x:0,y:0,boss:false});
 assert.equal(minimap.enemies[1].boss,true);
 assert.equal(minimap.drops.length,1);
 assert.equal(minimap.sanctuary.x,-g.player.x/MINIMAP_RADIUS);
 const distant=sample();distant.player.x=MINIMAP_RADIUS*2;
 assert.equal(minimapMarkers(distant).sanctuary,null);
});
test('main page supplies genuine PC HUD and skill-only auto indicators',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const css=fs.readFileSync('src/hud.css','utf8');
 const ui=fs.readFileSync('src/ui/Interface.js','utf8');
 const world=fs.readFileSync('src/world/World.js','utf8');
 for(const id of ['hud','hero-name','hp-fill','hp-label','level-label','armor-label',
   'might-label','bottom-hp','bottom-armor','bottom-might','bottom-speed','time-label',
   'kills-label','xp-fill','xp-label','minimap','minimap-panel','weapon-list',
   'hud-info','hud-info-content','hud-skills-button','hud-map-button','hud-help-button',
   'sound-toggle','pause-button']){
   assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.ok(html.includes('./src/hud.css'));
 assert.ok(html.includes('AUTOMÁTICAS'));
 assert.ok(!html.includes('id="attack-button"'));
 assert.ok(!html.includes('id="skill-hotbar"'));
 assert.ok(css.includes('.hud-minimap'));
 assert.ok(css.includes('.weapon-chip'));
 assert.ok(ui.includes('renderMinimap(game)'));
 assert.ok(ui.includes('WEAPONS[w.id]'));
 assert.ok(ui.includes("setProperty('--cooldown'"));
 assert.ok(world.includes('drawBush('));
});
