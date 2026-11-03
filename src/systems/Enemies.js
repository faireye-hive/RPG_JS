import { ENEMIES } from '../data/enemies.js';
import { distanceSquared } from '../core/math.js';
let enemyId=0;
function randomType(t){
  const pool=['slime','slime','bat','slime','bat'];
  if(t>35)pool.push('skeleton','skeleton');
  if(t>135)pool.push('wraith','skeleton','bat');
  if(t>260)pool.push('wraith','wraith','skeleton');
  return pool[Math.floor(Math.random()*pool.length)];
}
export function spawnEnemy(g,type=randomType(g.elapsed)){
  const spec=ENEMIES[type],a=Math.random()*Math.PI*2;
  const radius=Math.max(g.width,g.height)*.7+100,scale=1+g.elapsed/310;
  g.enemies.push({
    id:++enemyId,type,boss:!!spec.boss,
    x:g.player.x+Math.cos(a)*radius,y:g.player.y+Math.sin(a)*radius,
    radius:spec.radius,hp:Math.ceil(spec.hp*scale),maxHp:Math.ceil(spec.hp*scale),
    speed:spec.speed*(1+g.elapsed/1300),damage:spec.damage+Math.floor(g.elapsed/95),
    xp:spec.xp,hit:0
  });
}
export function updateEnemies(g,dt){
  g.spawnTimer-=dt;
  const interval=Math.max(.19,1.1-g.elapsed/580);
  if(g.spawnTimer<=0){
    g.spawnTimer=interval;
    const count=g.elapsed>210?2:1;
    for(let i=0;i<count&&g.enemies.length<170;i++)spawnEnemy(g);
  }
  if(g.elapsed>=165&&!g.bossFlags.first){g.bossFlags.first=true;spawnEnemy(g,'colossus');}
  if(g.elapsed>=365&&!g.bossFlags.second){g.bossFlags.second=true;spawnEnemy(g,'colossus');}
  const p=g.player;
  for(const e of g.enemies){
    if(e.hp<=0)continue;
    const dx=p.x-e.x,dy=p.y-e.y,dist=Math.hypot(dx,dy)||1;
    e.x+=dx/dist*e.speed*dt;e.y+=dy/dist*e.speed*dt;
    if(e.hit>0)e.hit=Math.max(0,e.hit-dt);
    if(dist<(e.radius+p.radius)*.8&&p.inv<=0){
      const damage=Math.max(1,e.damage-p.armor);
      p.hp=Math.max(0,p.hp-damage);p.inv=.7;
      g.addText('-'+damage,p.x,p.y-55,'#ff8a9b');g.audio.play('hit');g.burst(p.x,p.y,'#ed9baa',7);
      if(p.hp<=0){g.finish(false);break;}
    }
  }
  const limit=(Math.max(g.width,g.height)*1.8+600)**2;
  g.enemies=g.enemies.filter(e=>e.hp>0&&(e.boss||distanceSquared(e,p)<limit));
}
