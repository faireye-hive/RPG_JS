import { hash2, smoothNoise } from '../core/math.js';

// Mundo infinito e determinístico: a mesma seed e as mesmas coordenadas
// produzem sempre os mesmos biomas e detalhes, sem armazenar tiles.
export const TILE_SIZE = 96;
export class World {
  constructor(seed = 173) { this.seed = seed; }
  biomeAt(tx, ty) {
    const dist = Math.hypot(tx, ty);
    const noise = smoothNoise(tx / 12, ty / 12, this.seed) * .67 + smoothNoise(tx / 31, ty / 31, this.seed + 11) * .33;
    if (dist < 6) return 'sanctuary';
    if (dist > 15 && noise > .63) return 'ruins';
    if (dist > 11 && noise < .39) return 'blight';
    if (noise > .54) return 'grove';
    return 'meadow';
  }
  tileAt(tx, ty) {
    const kind = this.biomeAt(tx, ty);
    return { kind, noise: hash2(tx, ty, this.seed + 77), detail: hash2(tx, ty, this.seed + 177) };
  }
  draw(ctx, camX, camY, width, height, time) {
    const fromX = Math.floor(camX / TILE_SIZE) - 1;
    const fromY = Math.floor(camY / TILE_SIZE) - 1;
    const toX = Math.ceil((camX + width) / TILE_SIZE) + 1;
    const toY = Math.ceil((camY + height) / TILE_SIZE) + 1;
    const colors = {
      sanctuary: ['#22483b','#29523e','#2d5742'],
      meadow: ['#1a4035','#22503a','#29573d'],
      grove: ['#173b34','#1d4636','#24513a'],
      ruins: ['#303f3a','#38483c','#3d4a3d'],
      blight: ['#252d37','#2b3441','#323a48']
    };
    for (let ty = fromY; ty <= toY; ty++) for (let tx = fromX; tx <= toX; tx++) {
      const {kind, noise, detail} = this.tileAt(tx, ty);
      const x = tx * TILE_SIZE - camX, y = ty * TILE_SIZE - camY;
      const v = Math.min(2, Math.floor(noise * 3));
      ctx.fillStyle = colors[kind][v];
      ctx.fillRect(Math.round(x), Math.round(y), TILE_SIZE + 1, TILE_SIZE + 1);
      ctx.save(); ctx.translate(x, y);
      const r = (i) => hash2(tx * 7 + i * 13, ty * 11 - i * 17, this.seed + i);
      // Gravetos e ervas procedurais.
      for (let i = 0; i < 7; i++) {
        const px = r(i + 10) * 90 + 3, py = r(i + 25) * 88 + 4;
        ctx.strokeStyle = kind === 'blight' ? '#6b6b8299' : kind === 'ruins' ? '#85957d55' : '#73a26c88';
        ctx.lineWidth = 1 + r(i + 40) * .7;
        ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px - 3, py - 4); ctx.moveTo(px, py + 3); ctx.lineTo(px + 4, py - 2); ctx.stroke();
      }
      // Layered undergrowth gives the forest some life without visual clutter.
      if (kind === 'grove' && detail > .76) this.drawTree(ctx, 48 + (r(4) - .5) * 45, 47 + (r(8) - .5) * 45, .7 + noise * .45);
      else if (kind === 'grove' && detail > .65) this.drawBush(ctx, 25 + r(4)*48, 40+r(8)*28, .65+noise*.45);
      else if (kind === 'ruins' && detail > .72) this.drawRuin(ctx, 45 + r(6)*15, 45+r(7)*15);
      else if (kind === 'blight' && detail > .75) this.drawCrystal(ctx, 42+r(4)*15, 45+r(8)*15);
      else if (detail > .89) this.drawStone(ctx, 40+r(6)*28, 48+r(8)*25);
      else if (detail > .63 && kind !== 'ruins') this.drawFlowers(ctx, 20+r(4)*56, 20+r(8)*56, kind);
      ctx.restore();
    }
    // O ponto inicial é um santuário reconhecível, construído em código.
    const ox = -camX, oy = -camY;
    if (ox > -170 && oy > -170 && ox < width+170 && oy < height+170) this.drawSanctuary(ctx, ox, oy, time);
  }
  drawTree(ctx, x, y, scale) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle='#060f17aa';ctx.beginPath();ctx.ellipse(3,13,35,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#533d32';ctx.fillRect(-5,-24,10,34);ctx.fillStyle='#7c5840';ctx.fillRect(-2,-20,3,22);
    const foliage=[[-18,-34,22],[14,-39,24],[-3,-52,27],[8,-24,20]];
    foliage.forEach(([a,b,r],i)=>{ctx.fillStyle=['#183f38','#285749','#24644e','#2e7056'][i];ctx.beginPath();ctx.arc(a,b,r,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='#8bc477a6';ctx.beginPath();ctx.ellipse(-12,-53,10,4,-.6,0,Math.PI*2);ctx.fill();
    // Small leaf clusters add highlights without texture downloads.
    for(const [px,py,sz] of [[-26,-44,5],[-14,-60,6],[5,-63,6],[22,-41,5],[8,-29,4]]){
      ctx.fillStyle='#83bb7388';
      ctx.beginPath();ctx.ellipse(px,py,sz,sz*.58,-.3,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  drawBush(ctx,x,y,scale) {
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle='#06191577';ctx.beginPath();ctx.ellipse(1,9,24,8,0,0,Math.PI*2);ctx.fill();
    for(const [px,py,r,color] of [
      [-13,0,13,'#1d513b'],[3,-6,17,'#276749'],[16,2,11,'#316f4a'],
      [-5,-14,12,'#377b50']]){
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fill();
    }
    for(const [px,py] of [[-8,-14],[7,-17],[20,-2]]){
      ctx.fillStyle='#93bf7888';ctx.beginPath();ctx.ellipse(px,py,5,2.7,-.35,0,Math.PI*2);ctx.fill();
    }
    if(scale>.9){
      ctx.fillStyle='#d7766466';
      for(const [px,py] of [[-12,-5],[9,3]]){ctx.beginPath();ctx.arc(px,py,2.2,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
  }
  drawRuin(ctx,x,y) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#070d16aa';ctx.beginPath();ctx.ellipse(0,8,30,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#7a807d';ctx.fillRect(-16,-13,13,20);ctx.fillStyle='#929993';ctx.fillRect(-18,-15,17,5);
    ctx.fillStyle='#4b5a54';ctx.fillRect(5,-7,17,15);ctx.fillStyle='#a2a99f';ctx.fillRect(3,-9,20,4);
    ctx.strokeStyle='#303d3a';ctx.beginPath();ctx.moveTo(-9,-11);ctx.lineTo(-6,-3);ctx.lineTo(-10,3);ctx.stroke();ctx.restore();
  }
  drawCrystal(ctx,x,y) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#080b19a8';ctx.beginPath();ctx.ellipse(0,6,23,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#786bb0';ctx.beginPath();ctx.moveTo(-8,2);ctx.lineTo(-3,-24);ctx.lineTo(10,-30);ctx.lineTo(13,1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#bcb0ea';ctx.beginPath();ctx.moveTo(-3,-24);ctx.lineTo(10,-30);ctx.lineTo(2,2);ctx.closePath();ctx.fill();ctx.restore();
  }
  drawStone(ctx,x,y) {
    ctx.save();ctx.translate(x,y);ctx.fillStyle='#0a1119aa';ctx.beginPath();ctx.ellipse(2,8,23,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#62746e';ctx.beginPath();ctx.moveTo(-17,6);ctx.lineTo(-11,-8);ctx.lineTo(8,-12);ctx.lineTo(18,1);ctx.lineTo(13,8);ctx.closePath();ctx.fill();
    ctx.fillStyle='#8c9d91';ctx.beginPath();ctx.moveTo(-11,-8);ctx.lineTo(8,-12);ctx.lineTo(2,0);ctx.lineTo(-15,3);ctx.closePath();ctx.fill();ctx.restore();
  }
  drawFlowers(ctx,x,y,kind) {
    ctx.save();ctx.translate(x,y);
    for(let i=0;i<4;i++){const a=i*Math.PI*.5;ctx.fillStyle=kind==='blight'?'#9a87c2':'#dbc48b';ctx.beginPath();ctx.arc(Math.cos(a)*6,Math.sin(a)*6,3,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#f3e2a4';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff5c9a0';ctx.beginPath();ctx.arc(-.7,-.7,1.2,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  drawSanctuary(ctx,x,y,time) {
    ctx.save();ctx.translate(x,y);ctx.strokeStyle='#90c4a966';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(0,0,112,0,Math.PI*2);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#d8bc8088';
    ctx.beginPath();ctx.arc(0,0,95,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.save();ctx.translate(Math.cos(a)*100,Math.sin(a)*100);ctx.rotate(a+Math.PI/2);ctx.strokeRect(-5,-8,10,16);ctx.restore();}
    const glow=.4+Math.sin(time*2)*.2;ctx.fillStyle='rgba(143,221,182,'+glow+')';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}
