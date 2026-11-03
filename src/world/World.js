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
      sanctuary: ['#223c38','#25423d','#284640'],
      meadow: ['#1c3430','#203a33','#233e35'],
      grove: ['#192f2c','#1c352f','#223b32'],
      ruins: ['#2e3434','#333a38','#383d3b'],
      blight: ['#292d37','#2d3040','#323645']
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
        ctx.strokeStyle = kind === 'blight' ? '#52536288' : kind === 'ruins' ? '#69716e44' : '#69907a66';
        ctx.lineWidth = 1 + r(i + 40) * .7;
        ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px - 3, py - 4); ctx.moveTo(px, py + 3); ctx.lineTo(px + 4, py - 2); ctx.stroke();
      }
      if (kind === 'grove' && detail > .76) this.drawTree(ctx, 48 + (r(4) - .5) * 45, 47 + (r(8) - .5) * 45, .7 + noise * .45);
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
    ctx.fillStyle='#7aaa7199';ctx.beginPath();ctx.ellipse(-12,-53,10,4,-.6,0,Math.PI*2);ctx.fill();ctx.restore();
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
    ctx.fillStyle='#d6eea4';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();ctx.restore();
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
