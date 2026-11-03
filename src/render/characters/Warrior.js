/**
 * GUERREIRO / GUARDIÃO — character art v2
 * Illustrated entirely with Canvas 2D primitives: no raster assets, no SVG,
 * no web fonts, and no image downloads. The feet are at local y = 0.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{vx?:number,vy?:number,facing?:number,inv?:number,attackPose?:number}} hero
 * @param {number} x - foot-anchor x in screen pixels
 * @param {number} y - foot-anchor y in screen pixels
 * @param {number} time - animation time in seconds
 * @param {{scale?:number,shadow?:boolean,lighting?:boolean,face?:'front'|'back'|'auto',equipment?:'full'|'unarmed'}} options
 */
const TAU = Math.PI * 2;
const C = Object.freeze({
  ink: '#0d1824', deep: '#122832', obsidian: '#192e39',
  steelDark: '#304450', steelMid: '#879da8', steelLight: '#f1f5df',
  goldDark: '#805a30', gold: '#d9ac62', goldLight: '#fff0b6',
  cloth: '#822f46', clothDark: '#391d35', clothHighlight: '#d45e60',
  emerald: '#58dfba', rune: '#c2fff4', skin: '#d9a385', hair: '#28333a',
});
function grad(ctx, x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}
function metal(ctx, x1 = -25, x2 = 25, y = -60) {
  return grad(ctx, x1, y, x2, y, [
    [0, '#21323c'], [.13, '#4b6171'], [.32, '#b9c9c8'],
    [.46, '#e8ecdd'], [.60, '#91a9ad'], [.82, '#526873'], [1, '#273847'],
  ]);
}
function darkSteel(ctx, x1 = -20, x2 = 20, y = -60) {
  return grad(ctx, x1, y, x2, y, [
    [0, '#13232f'], [.18, '#314856'], [.43, '#708994'],
    [.58, '#526b76'], [1, '#142733'],
  ]);
}
function gold(ctx, x1 = -20, x2 = 20, y = -60) {
  return grad(ctx, x1, y, x2, y, [
    [0, '#654223'], [.18, '#ad7b40'], [.4, '#f6e0a0'],
    [.61, '#c89d55'], [.82, '#e7bb72'], [1, '#6a472d'],
  ]);
}
function cloth(ctx, x1=-30, x2=35, y=-60) {
  return grad(ctx,x1,y,x2,y,[
    [0,'#22182d'],[.18,'#532841'],[.36,'#af4354'],
    [.51,'#853348'],[.77,'#56283c'],[1,'#201d32'],
  ]);
}
function skin(ctx, x1=-10, x2=12, y=-120) {
  return grad(ctx,x1,y,x2,y,[
    [0,'#79554e'],[.22,'#bb8269'],[.47,'#f7cfaa'],
    [.71,'#d8a182'],[1,'#8b5c54'],
  ]);
}
function region(ctx, commands, fill, outline = null, width = 1.3) {
  ctx.beginPath();
  for (const cmd of commands) {
    if (cmd[0] === 'M') ctx.moveTo(cmd[1],cmd[2]);
    else if (cmd[0] === 'L') ctx.lineTo(cmd[1],cmd[2]);
    else if (cmd[0] === 'Q') ctx.quadraticCurveTo(...cmd.slice(1));
    else if (cmd[0] === 'C') ctx.bezierCurveTo(...cmd.slice(1));
    else if (cmd[0] === 'Z') ctx.closePath();
  }
  if (fill) { ctx.fillStyle=fill;ctx.fill(); }
  if (outline) { ctx.lineWidth=width;ctx.strokeStyle=outline;ctx.stroke(); }
}
function polygon(ctx, points, color, outline=null, width=1.1) {
  region(ctx,[['M',...points[0]],...points.slice(1).map(p=>['L',...p]),['Z']],color,outline,width);
}
function trace(ctx, points, color, width=1, alpha=1) {
  ctx.save();ctx.globalAlpha*=alpha;
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.stroke();
  ctx.restore();
}
function ellipse(ctx,x,y,rx,ry,fill,edge=null,angle=0,width=1) {
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,TAU);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(edge){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}
}
function circle(ctx,x,y,r,fill,edge=null,width=1){
  ellipse(ctx,x,y,r,r,fill,edge,0,width);
}
function gem(ctx,x,y,r=5,energy=1) {
  const glow = ctx.createRadialGradient(x,y,0,x,y,r*2.8);
  glow.addColorStop(0,'rgba(166,255,233,'+(energy*.53)+')');
  glow.addColorStop(.43,'rgba(64,205,172,'+(energy*.15)+')');
  glow.addColorStop(1,'rgba(70,191,168,0)');
  circle(ctx,x,y,r*2.8,glow);
  polygon(ctx,[[x,y-r],[x+r*.8,y],[x,y+r],[x-r*.8,y]],'#206b70','#c7f0c6',.75);
  polygon(ctx,[[x,y-r],[x+r*.8,y],[x,y]],'#bfffee');
  polygon(ctx,[[x-r*.8,y],[x,y],[x,y+r]],'#3ea99e');
  trace(ctx,[[x,y-r*.8],[x,y+r*.75]],'#f5ffdc',.8,.75);
}
function rivet(ctx,x,y,r=2) {
  circle(ctx,x,y,r,C.ink);
  circle(ctx,x-.3,y-.5,r*.67,'#e5cf98');
  circle(ctx,x-.7,y-1,r*.28,'#fffae5');
}
function sparkle(ctx,x,y,r,alpha=1){
  ctx.save();ctx.globalAlpha*=alpha;
  trace(ctx,[[x-r,y],[x+r,y]],'#fff7cc',1.2);
  trace(ctx,[[x,y-r*1.5],[x,y+r*1.5]],'#d4fff1',1);
  circle(ctx,x,y,1,'#fff');
  ctx.restore();
}
function armorBand(ctx,y,left,right){
  polygon(ctx,[[left,y],[right,y],[right-2,y+5],[left+2,y+5]],gold(ctx,left,right,y),C.ink,1.1);
  trace(ctx,[[left+3,y+1],[right-3,y+1]],'#ffefd0',.7,.8);
}
function rune(ctx,x,y,s=1) {
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  trace(ctx,[[0,-8],[5,-3],[0,3],[-5,-3],[0,-8]],C.rune,1.5,.75);
  trace(ctx,[[0,-7],[0,9],[-3,5],[3,5]],'#81e6cd',1.25,.95);
  circle(ctx,0,-3,1.8,'#fff6ca');
  ctx.restore();
}
function shadow(ctx,amount=1){
  const halo=ctx.createRadialGradient(0,4,4,0,4,68);
  halo.addColorStop(0,'rgba(4,12,23,'+(.6*amount)+')');
  halo.addColorStop(.55,'rgba(4,12,23,'+(.32*amount)+')');
  halo.addColorStop(1,'rgba(4,12,23,0)');
  ellipse(ctx,0,4,67,21,halo);
}
function cape(ctx,t,walk){
  const wind=Math.sin(t*2.4)*2 + Math.sin(t*11)*walk*3;
  const flap=Math.sin(t*3.1+1.4)*6 + walk*3;
  // Primary burgundy mantle with asymmetrical split, hems, seam and lining.
  region(ctx,[
    ['M',-28,-106],['C',-46,-98,-48,-73,-51,-43],
    ['C',-58,-10,-58+wind,4,-73+wind,17],
    ['Q',-45,10],['Q',-29+flap,21],['Q',-9,12],
    ['Q',7,21],['Q',26+flap,17],['C',45,9,47,-13,43,-50],
    ['C',40,-75,45,-100,27,-109],['Q',-2,-118],['Z']
  ],cloth(ctx,-64,52),C.ink,3);
  region(ctx,[
    ['M',-35,-102],['C',-51,-68,-35,-25,-49,8],
    ['Q',-44+wind,10],['Q',-28+flap,19],['C',-37,-19,-27,-73,-19,-99],['Z']
  ],grad(ctx,-50,-90,-15,8,[[0,'#d26b6d'],[.4,'#782d45'],[1,'#4a263e']]));
  region(ctx,[
    ['M',18,-105],['C',38,-76,31,-20,27+flap,15],
    ['Q',47+wind,7],['Q',41,-60],['Q',35,-100],['Z']
  ],'#61253e');
  trace(ctx,[[-44,-86],[-39,-49],[-48,-12],[-53,4]],'#f098819a',1.15);
  trace(ctx,[[36,-89],[29,-56],[37,-13],[35,8]],'#da76787a',1.1);
  trace(ctx,[[-17,-86],[-22,-24],[-26,8]],'#351d32',2);
  // Hem stitch marks remain stable in animation.
  for(let i=0;i<7;i++){
    let yy=-45+i*8;
    trace(ctx,[[-47-(i*.45),yy],[-43-(i*.45),yy+1.5]],'#e3b484',.8,.58);
  }
}
function lowerArmor(ctx,t,walk){
  const stride=Math.sin(t*11)*walk;
  const left=stride*6,right=-stride*6;
  // Greaves + articulated knees, with rim and structural panels.
  for(const side of [-1,1]){
    const x=side*15;
    const shift=side===-1?left:right;
    ctx.save();ctx.translate(x+shift*.38,0);
    // Leather undersuit.
    region(ctx,[['M',-10,-47],['L',10,-47],['L',8,-5],['L',-9,-4],['Z']],
      '#1a2932',C.ink,1.7);
    // Thigh plates.
    region(ctx,[['M',-12,-44],['Q',0,-49],['Q',12,-44],['L',10,-23],
      ['Q',2,-19],['L',-10,-23],['Z']],darkSteel(ctx,-13,15),C.ink,1.8);
    trace(ctx,[[-7,-41],[-5,-27],[0,-24]],'#b2c4ba',1.4,.7);
    armorBand(ctx,-42,-9,10);
    // Knee articulated, curved golden rim.
    region(ctx,[['M',-12,-22],['Q',0,-30],['Q',13,-22],['L',10,-14],
      ['Q',0,-9],['L',-11,-14],['Z']],metal(ctx,-14,14),C.ink,2);
    region(ctx,[['M',-9,-21],['Q',1,-27],['Q',10,-21]],null,'#f6df9a',1.7);
    rivet(ctx,-8,-17,1.6);rivet(ctx,8,-17,1.6);
    // Long greave with faceted metal.
    region(ctx,[['M',-10,-13],['Q',1,-17],['Q',11,-13],['L',12,2],
      ['Q',2,9],['L',-10,3],['Z']],metal(ctx,-12,12),C.ink,2);
    polygon(ctx,[[-4,-13],[3,-13],[5,2],[-2,5]],'#d7e2d1','#56727a',.7);
    trace(ctx,[[-9,-9],[-8,1],[0,6]],'#eeead5',1,.85);
    // Sabatons point forward, taper down toward foot-anchor.
    region(ctx,[['M',-10,1],['L',12,1],['Q',16,6],['L',16+side*2,15],
      ['Q',-1,21],['L',-15,15],['Z']],darkSteel(ctx,-15,17),C.ink,2);
    region(ctx,[['M',-12,12],['Q',2,16],['L',15,11]],null,'#e5d4a0',1.3);
    for(let k=0;k<3;k++)trace(ctx,[[-9+k*8,12],[-8+k*8,16]],'#405969',.9);
    ctx.restore();
  }
  // Mail skirt, hip plates and leather strips.
  region(ctx,[['M',-27,-51],['L',27,-51],['L',27,-31],
    ['Q',17,-24],['L',9,-32],['L',0,-25],['L',-9,-32],['Q',-17,-24],['L',-27,-31],['Z']],
    '#243844',C.ink,2);
  for(let yy=-45;yy<-28;yy+=5){
    for(let xx=-20;xx<23;xx+=7){
      ellipse(ctx,xx+(Math.floor(yy/5)%2)*3,yy,3,2,null,'#9facaa75',0,.8);
    }
  }
  for(const side of [-1,1]){
    ctx.save();ctx.scale(side,1);
    polygon(ctx,[[12,-48],[29,-46],[32,-28],[18,-19],[10,-32]],
      metal(ctx,9,32),C.ink,2);
    trace(ctx,[[17,-43],[26,-42],[27,-31],[19,-25]],'#e7bf80',1.2);
    rivet(ctx,22,-39,2);
    ctx.restore();
  }
  polygon(ctx,[[-11,-48],[11,-48],[9,-23],[0,-14],[-9,-23]],
    metal(ctx,-12,12),C.ink,1.8);
  trace(ctx,[[0,-42],[0,-20]],'#efdcad',1.4);
  polygon(ctx,[[0,-32],[4,-27],[0,-23],[-4,-27]],'#947845','#e7ce8e',.7);
}
function torso(ctx,t){
  // Layered brigandine below metal upper body.
  region(ctx,[['M',-29,-103],['C',-33,-87,-27,-56,-24,-47],
    ['Q',0,-38],['Q',24,-47],['C',27,-62,34,-87,29,-103],['Z']],
    darkSteel(ctx,-32,34),C.ink,3);
  for(let k=0;k<4;k++) {
    const y=-68+k*6;
    region(ctx,[['M',-23,y],['Q',0,y+6],['Q',23,y]],null,'#d8c28f',1);
  }
  // Main articulated cuirass. Left and right beveled breastplate, sharper central axis.
  region(ctx,[
    ['M',-28,-105],['Q',-16,-115],['L',0,-108],['L',15,-115],['Q',30,-105],
    ['L',28,-73],['Q',21,-56],['L',0,-49],['Q',-23,-57],['L',-29,-75],['Z']],
    metal(ctx,-31,30,-80),C.ink,3);
  region(ctx,[['M',-27,-100],['Q',-18,-109],['L',-1,-104],['L',-3,-77],
    ['Q',-16,-75],['L',-25,-83],['Z']],
    grad(ctx,-28,-99,0,-77,[[0,'#e6eee0'],[.35,'#91abb0'],[.7,'#3e5564'],[1,'#263a47']]),
    '#516672',1.2);
  region(ctx,[['M',3,-104],['L',16,-109],['Q',28,-102],['L',25,-84],
    ['L',15,-76],['L',2,-77],['Z']],
    grad(ctx,2,-105,26,-79,[[0,'#bfd2cf'],[.4,'#536c77'],[.75,'#9facac'],[1,'#1c303e']]),
    '#304450',1.3);
  region(ctx,[['M',-24,-81],['Q',-12,-74],['L',-1,-76],['L',-2,-55],
    ['Q',-15,-60],['L',-21,-68],['Z']],
    '#4e6570aa');
  region(ctx,[['M',3,-76],['Q',14,-75],['L',25,-82],['L',21,-67],
    ['L',4,-55],['Z']], '#415d6ba8');
  trace(ctx,[[-23,-100],[-18,-103],[-6,-98]],'#fff5d9',1.2,.9);
  trace(ctx,[[22,-102],[25,-93],[23,-82]],'#d5f0ee',1.5,.83);
  trace(ctx,[[0,-105],[0,-60]],'#172a37',2.8);
  trace(ctx,[[1,-103],[1,-60]],'#fff0c2',1.25,.85);
  // Lion-shaped angular center chest emblem with rays.
  polygon(ctx,[[0,-100],[9,-93],[8,-82],[0,-73],[-8,-82],[-9,-93]],
    gold(ctx,-9,9,-86),C.ink,2);
  polygon(ctx,[[0,-96],[5,-89],[3,-83],[0,-80],[-3,-83],[-5,-89]],
    '#205b5a','#f9d791',1);
  gem(ctx,0,-88,3.4,.85);
  for(const side of [-1,1]){
    ctx.save();ctx.scale(side,1);
    trace(ctx,[[13,-97],[21,-93],[18,-83],[11,-80]],'#f4d89a',1.15,.9);
    polygon(ctx,[[15,-92],[18,-89],[14,-85],[11,-88]],'#a17a45');
    for(let i=0;i<3;i++){
      trace(ctx,[[9+i*4,-66-i],[11+i*4,-63-i]],'#f2e7c4',.9,.7);
    }
    ctx.restore();
  }
  // Straps and locked upper belt.
  region(ctx,[['M',-26,-55],['Q',0,-50],['Q',26,-55],
    ['L',25,-47],['Q',0,-42],['L',-25,-47],['Z']],
    '#483831',C.ink,2);
  trace(ctx,[[-22,-53],[22,-53]],'#b7834c',2);
  polygon(ctx,[[-9,-55],[9,-55],[12,-45],[0,-39],[-12,-45]],
    gold(ctx,-13,13),C.ink,2);
  polygon(ctx,[[0,-53],[6,-48],[0,-43],[-6,-48]],'#32575b','#fff0bb',1);
  circle(ctx,0,-48,2.2,'#f8e9a7');
  rivet(ctx,-21,-50,2);rivet(ctx,21,-50,2);
}
function neckAndCollar(ctx,back){
  region(ctx,[['M',-12,-114],['L',12,-114],['L',13,-96],['L',-13,-96],['Z']],
    darkSteel(ctx,-12,13),C.ink,1.8);
  // Slotted, segmented gorget.
  for(let i=0;i<3;i++){
    region(ctx,[['M',-14+i,-111+i*5],['Q',0,-107+i*5],
      ['Q',14-i,-111+i*5]],null,i===1?'#f0dcaf':'#aebfbc',1.4);
  }
  if(back) {
    polygon(ctx,[[-10,-116],[10,-116],[8,-97],[-8,-97]],
      '#465863',C.ink,1.4);
  }
}
function pauldron(ctx,side,t,walk){
  ctx.save();ctx.scale(side,1);
  const bob=Math.sin(t*11+side)*walk*1.3;
  ctx.translate(0,bob);
  // Shoulder leather and chain mail below the shell.
  region(ctx,[['M',23,-105],['Q',36,-105],['Q',43,-86],
    ['L',42,-72],['L',29,-70],['L',23,-83],['Z']],
    '#253846',C.ink,2.4);
  for(let i=0;i<3;i++){
    trace(ctx,[[32+i*3,-81],[36+i*2,-72]],'#c6c9b0',1,.55);
  }
  // Winged cast steel shoulder guard.
  region(ctx,[['M',16,-111],['Q',34,-123],['Q',46,-110],
    ['L',54,-90],['Q',43,-84],['L',39,-80],['Q',33,-90],['L',22,-86],
    ['L',12,-94],['Z']],metal(ctx,14,55,-98),C.ink,3);
  region(ctx,[['M',20,-111],['Q',35,-120],['Q',44,-108],
    ['L',49,-94],['L',40,-97],['Q',34,-109],['L',25,-100],['Z']],
    grad(ctx,18,-110,48,-91,[[0,'#fbf8dd'],[.4,'#a0b7b6'],[1,'#354c5e']]));
  region(ctx,[['M',39,-111],['Q',47,-119],['L',51,-124],
    ['L',52,-109],['Q',57,-103],['L',54,-95],['Z']],
    gold(ctx,40,55),C.ink,1.7);
  // Three engravings and golden lamellar edge.
  region(ctx,[['M',14,-94],['Q',33,-89],['Q',50,-92]],null,'#e9cb8b',2.5);
  region(ctx,[['M',23,-107],['Q',33,-112],['Q',40,-101]],null,'#f5db98',1);
  rivet(ctx,27,-99,2.3);rivet(ctx,43,-94,2);
  // Upper arm plate underneath shoulder (arm visible near shield/sword).
  region(ctx,[['M',32,-81],['L',44,-82],['Q',49,-69],
    ['L',43,-59],['L',34,-59],['Z']],darkSteel(ctx,32,49),C.ink,2);
  polygon(ctx,[[34,-80],[42,-79],[44,-64],[40,-62],[35,-68]],'#b3c3beaa');
  armorBand(ctx,-62,34,45);
  ctx.restore();
}
function hand(ctx,x,y,side=1){
  ctx.save();ctx.translate(x,y);ctx.scale(side,1);
  region(ctx,[['M',-7,-7],['L',6,-7],['L',9,0],['L',7,9],
    ['L',-4,10],['L',-9,4],['Z']],metal(ctx,-9,10),C.ink,1.7);
  polygon(ctx,[[-4,-6],[4,-6],[6,1],[0,4],[-6,1]],'#a1b4b4','#667f80',.7);
  armorBand(ctx,-6,-7,7);rivet(ctx,0,2,1.5);
  for(let i=0;i<3;i++)trace(ctx,[[-4+i*4,5],[-2+i*4,8]],'#3d555f',.85);
  ctx.restore();
}
function leftArm(ctx,t,walk){
  const s=Math.sin(t*11)*walk*2;
  region(ctx,[['M',-37,-75],['Q',-45,-67],['Q',-47,-49],
    ['L',-39,-42],['L',-30,-50],['Q',-33,-65],['Z']],
    darkSteel(ctx,-48,-29),C.ink,2.5);
  region(ctx,[['M',-44,-62],['Q',-50,-54],['L',-45,-42],
    ['L',-36,-42],['L',-35,-56],['Z']],metal(ctx,-48,-34),C.ink,1.7);
  trace(ctx,[[-43,-58],[-45,-47]],'#ffe6a3',1.2);
  hand(ctx,-41+s,-43,-1);
}
function drawShield(ctx,t,walk){
  const drift=Math.sin(t*11+1)*walk*1.7;
  ctx.save();ctx.translate(-49+drift,-56);ctx.rotate(-.10+Math.sin(t*2)*.017);
  // Rear attachment ring and back edge.
  ellipse(ctx,0,5,29,45,'#0e1a25','#947144',2);
  region(ctx,[['M',0,-43],['C',16,-44,28,-38,30,-24],
    ['L',29,5],['Q',25,30],['L',0,47],
    ['Q',-29,28],['L',-30,5],['L',-30,-24],
    ['C',-28,-38,-16,-44,0,-43],['Z']],
    grad(ctx,-28,-22,30,30,[[0,'#202f3b'],[.20,'#a17b43'],[.34,'#efd49b'],[.49,'#556b72'],[.75,'#253c48'],[1,'#bd8d51']]),
    '#0b1b26',3.8);
  region(ctx,[['M',0,-36],['Q',19,-36],['L',23,-23],['L',22,6],
    ['Q',19,27],['L',0,39],['Q',-23,26],['L',-22,5],['L',-22,-23],
    ['Q',-18,-37],['Z']],
    grad(ctx,-21,-30,24,27,[[0,'#344956'],[.23,'#8ea8aa'],[.46,'#243947'],[.68,'#3f5961'],[1,'#0e2836']]),
    '#e2ba76',2);
  // Polished radial faces, distinct inner facets.
  polygon(ctx,[[0,-34],[18,-27],[12,17],[0,35]],'#b6c3ba19','#a4c8b430',.7);
  polygon(ctx,[[0,-34],[-18,-27],[-12,17],[0,35]],'#020e1833');
  trace(ctx,[[0,-35],[0,35]],'#f2dc9b',1.2,.9);
  trace(ctx,[[-19,-22],[-15,10],[0,32]],'#ddf1dc',1.1,.8);
  trace(ctx,[[19,-22],[15,10],[0,32]],'#101e29',1.8);
  // Central heraldic sigil etched into the metal.
  polygon(ctx,[[0,-27],[13,-18],[13,8],[0,23],[-13,8],[-13,-18]],
    grad(ctx,-10,-20,15,17,[[0,'#a9804d'],[.36,'#f1dba3'],[.65,'#a07744'],[1,'#573a28']]),
    '#2f2a27',1.8);
  polygon(ctx,[[0,-22],[9,-15],[8,5],[0,15],[-8,5],[-9,-15]],'#1f454e','#f0d290',1.2);
  region(ctx,[['M',-6,-10],['L',0,-17],['L',6,-10],['L',3,-1],
    ['L',0,9],['L',-3,-1],['Z']],gold(ctx,-6,6),C.ink,1);
  gem(ctx,0,-6,5,1);
  for(const side of [-1,1]) {
    ctx.save();ctx.scale(side,1);
    trace(ctx,[[3,-21],[11,-13],[8,0]],'#d6f4dd',.8,.75);
    for(let i=0;i<4;i++)rivet(ctx,26-i*.75,-25+i*14,1.6);
    ctx.restore();
  }
  rivet(ctx,0,-39,2.4);rivet(ctx,0,42,2.3);
  // Small specular glint follows the light, without using images.
  sparkle(ctx,-17,-24,3,.7);
  ctx.restore();
}
function sword(ctx,time,attack,walk){
  const bob=Math.sin(time*11)*walk*.055;
  // Shoulder pivot and swing: blade is independently transformable.
  ctx.save();ctx.translate(34,-86);
  const attackPhase=attack>0?1-attack:0;
  const strike=attack>0?Math.sin(attackPhase*Math.PI)*1.15:0;
  ctx.rotate(-.1+bob+strike);
  // Articulated forearm with bright light-catching plate.
  region(ctx,[['M',-5,-1],['Q',5,-5],['L',14,13],
    ['Q',22,23],['L',17,33],['L',7,31],['Q',4,15],['L',-3,10],['Z']],
    darkSteel(ctx,-5,22),C.ink,2.3);
  region(ctx,[['M',4,9],['L',14,13],['L',19,28],
    ['L',12,30],['Z']],metal(ctx,3,21),C.ink,1.5);
  region(ctx,[['M',8,12],['L',16,23]],null,'#e6d8af',1.2);
  rivet(ctx,12,15,1.6);
  // Sword grip in the hand, up-and-away from body.
  ctx.translate(15,26);
  ctx.rotate(.28+Math.sin(time*2.5)*.035);
  // Blade silhouette, fuller, cutting edges and tip.
  region(ctx,[['M',-5,-12],['L',-7,-93],['L',0,-115],['L',7,-93],
    ['L',5,-12],['Z']],
    grad(ctx,-8,-64,8,-64,[
      [0,'#425e6c'],[.17,'#eefcf4'],[.35,'#829da8'],
      [.52,'#d0e6e7'],[.78,'#faffeb'],[1,'#415d68'],
    ]),C.ink,2.3);
  polygon(ctx,[[-4,-91],[0,-109],[0,-16],[-2,-22]],'#e3fff1a6');
  polygon(ctx,[[0,-109],[5,-92],[3,-22],[0,-16]],'#7698a7ad');
  trace(ctx,[[0,-101],[0,-23]],'#2b5966',1.3,.85);
  trace(ctx,[[-5,-89],[-3,-21]],'#f9fff5',1.1);
  trace(ctx,[[5,-87],[4,-21]],'#fff5ca',.85,.85);
  // Etched runic fragments, self-contained vector glyphs.
  for(let i=0;i<5;i++){
    const yy=-79+i*11;
    trace(ctx,[[-2,yy],[1,yy+3],[-1,yy+6]],'#83f2d9',.8,.83);
    trace(ctx,[[1,yy],[3,yy+2]],'#d2fff1',.6,.85);
  }
  // Elaborate quillons and central crossguard.
  region(ctx,[['M',-25,-11],['Q',-20,-17],['L',-16,-13],
    ['Q',0,-8],['L',16,-13],['L',20,-17],['L',25,-11],
    ['Q',18,-1],['L',12,-5],['L',4,-3],['L',-4,-3],
    ['L',-12,-5],['Q',-18,-1],['Z']],
    gold(ctx,-24,25),C.ink,2.2);
  trace(ctx,[[-21,-11],[-16,-8],[-8,-9],[8,-9],[17,-8],[21,-11]],'#fff8cf',1.6);
  region(ctx,[['M',-3,-5],['L',3,-5],['L',4,21],['L',-4,21],['Z']],
    grad(ctx,-4,0,4,0,[[0,'#342a28'],[.25,'#aa8053'],[.5,'#332b29'],[.75,'#d5ae6c'],[1,'#2c2930']]),C.ink,1.5);
  for(let yy=0;yy<18;yy+=5)trace(ctx,[[-3,yy],[3,yy+4]],'#f0d69f',1.2,.85);
  circle(ctx,0,23,6,gold(ctx,-6,6),C.ink,1.5);
  gem(ctx,0,-8,5.4,1);
  sparkle(ctx,-2,-90,5,.7+.25*Math.sin(time*2.5));
  hand(ctx,0,14,1);
  ctx.restore();
}
function head(ctx,time,back=false) {
  // Necks, neck guard, haircut, open-faced knight helm with plated crest.
  neckAndCollar(ctx,back);
  if(back){
    // Rear gorget, braided plume and rear helm are a genuine separate silhouette.
    region(ctx,[['M',-17,-125],['Q',-19,-149],['Q',0,-154],
      ['Q',19,-149],['L',17,-125],['Q',0,-117],['Z']],
      metal(ctx,-20,20,-136),C.ink,2.6);
    for(let i=0;i<4;i++){
      trace(ctx,[[-12,-128-i*5],[12,-128-i*5]],'#e2e7d3',1,.8);
    }
    region(ctx,[['M',-8,-150],['Q',0,-160],['L',7,-150],
      ['Q',5,-138],['L',0,-133],['Q',-5,-138],['Z']],
      gold(ctx,-9,8),C.ink,1.6);
    return;
  }
  // Cheek and visible skin; a nose, lips and individually placed eye shapes.
  region(ctx,[['M',-15,-138],['Q',-15,-147],['Q',0,-154],
    ['Q',17,-148],['L',15,-126],['Q',11,-116],['L',0,-110],
    ['Q',-10,-116],['L',-16,-128],['Z']],
    skin(ctx,-17,18),C.ink,2.1);
  // Warm inner cheek and shadow anatomy.
  region(ctx,[['M',-13,-134],['Q',-7,-127],['L',-4,-117],
    ['Q',-12,-121],['Z']],'#a77364a3');
  region(ctx,[['M',9,-127],['Q',14,-132],['L',12,-121],
    ['L',4,-114],['Z']],'#d68d7890');
  trace(ctx,[[-11,-133],[-8,-135],[-3,-134]],'#3f3139',1.9);
  trace(ctx,[[3,-134],[8,-135],[12,-132]],'#3f3139',1.9);
  // Eyes with whites, deep outline, iris and glint.
  ellipse(ctx,-7,-130,4.6,2,'#e8dfca','#4d4642',.03,.85);
  ellipse(ctx,7,-130,4.6,2,'#e8dfca','#4d4642',-.03,.85);
  circle(ctx,-6,-130,2.1,'#358b81');circle(ctx,7.2,-130,2.1,'#358b81');
  circle(ctx,-6,-130,1.15,'#132c32');circle(ctx,7.2,-130,1.15,'#132c32');
  circle(ctx,-6.8,-131,0.75,'#f7ffef');circle(ctx,6.4,-131,0.75,'#f7ffef');
  // Profiled nose, side highlight, subtle asymmetric scar and expression.
  region(ctx,[['M',1,-131],['Q',-1,-123],['L',2,-122],['L',4,-124]],
    null,'#9b5e57',1.1);
  trace(ctx,[[-3,-119],[1,-117],[5,-120]],'#7e4a49',1.2);
  trace(ctx,[[10,-125],[13,-121]],'#f3d7b7',.9,.7);
  trace(ctx,[[-13,-124],[-9,-121]],'#f8c3aa',.8);
  // Layered hair, individual swept strands under helmet.
  region(ctx,[['M',-18,-143],['Q',-21,-160],['Q',-7,-164],
    ['Q',10,-170],['Q',20,-155],['L',17,-135],
    ['Q',13,-150],['L',4,-145],['Q',-9,-138],['L',-18,-137],['Z']],
    grad(ctx,-19,-150,20,-140,[
      [0,'#16212d'],[.35,'#334652'],[.63,'#6d6661'],[.82,'#1b2935'],[1,'#121e2a']
    ]),C.ink,1.6);
  region(ctx,[['M',-12,-153],['Q',-3,-164],['Q',12,-157],
    ['Q',6,-149],['L',-2,-147],['Z']],'#87908a7d');
  region(ctx,[['M',-7,-151],['Q',-13,-145],['Q',-9,-133],
    ['Q',-3,-143],['Q',5,-146],['Z']],'#2e3e49');
  for(let i=0;i<5;i++){
    trace(ctx,[[-13+i*5,-153],[(-10+i*4),-142+(i%2)*3]],i%2?'#87928d':'#566b72',.85,.72);
  }
  // Crested head guard above hair, split polished metal forehead plate.
  region(ctx,[['M',-18,-150],['Q',-12,-165],['Q',0,-168],
    ['Q',14,-163],['L',19,-150],['L',16,-142],
    ['Q',6,-148],['L',-4,-143],['L',-16,-142],['Z']],
    darkSteel(ctx,-20,20,-155),C.ink,2.3);
  region(ctx,[['M',-18,-150],['Q',0,-157],['Q',18,-150],
    ['L',18,-144],['Q',0,-150],['L',-18,-144],['Z']],
    gold(ctx,-19,19,-149),C.ink,1.7);
  trace(ctx,[[-14,-154],[-4,-156],[4,-156],[13,-154]],'#f8eacc',1.1);
  region(ctx,[['M',-4,-162],['L',0,-174],['L',4,-162],['L',7,-147],
    ['L',0,-141],['L',-7,-147],['Z']],
    gold(ctx,-6,7,-162),C.ink,2);
  polygon(ctx,[[0,-169],[4,-153],[0,-149],[-4,-153]],'#2b5660','#f8dba0',.8);
  gem(ctx,0,-156,3.5,.8);
  // Decorative side fins, slightly different on both sides.
  for(const side of [-1,1]){
    ctx.save();ctx.scale(side,1);
    region(ctx,[['M',17,-152],['Q',28,-162],['L',34,-159],
      ['L',27,-150],['L',22,-139],['L',16,-138],['Z']],
      gold(ctx,15,34,-147),C.ink,2);
    polygon(ctx,[[20,-151],[28,-157],[24,-146],[20,-143]],'#eff5d1a0');
    rivet(ctx,20,-146,1.5);
    ctx.restore();
  }
  // Subtle breath animate independently of main walk.
  circle(ctx,0,-142,1,'#f5d4b4c0');
}
function underArms(ctx,t,walk){
  leftArm(ctx,t,walk);
  pauldron(ctx,-1,t,walk);pauldron(ctx,1,t,walk);
}
function backSilhouette(ctx){
  // Dark, geometric engraved backplate with a readable silhouette at tiny scale.
  region(ctx,[['M',-26,-106],['Q',0,-119],['Q',27,-106],
    ['L',25,-57],['Q',0,-44],['L',-25,-57],['Z']],
    metal(ctx,-29,28,-82),C.ink,2.8);
  polygon(ctx,[[0,-108],[18,-98],[19,-68],[0,-55],[-19,-68],[-18,-98]],
    darkSteel(ctx,-19,19),C.ink,1.7);
  trace(ctx,[[-13,-96],[0,-103],[13,-96],[14,-72],[0,-61],[-14,-72],[-13,-96]],
    '#e1c58d',1.4);
  rune(ctx,0,-86,1.4);
  armorBand(ctx,-55,-25,25);
}
export function drawWarrior(ctx,hero,x,y,time=0,options={}){
  const scale = Number.isFinite(options.scale) ? options.scale : .85;
  const t=Number.isFinite(time)?time:0;
  const vx=hero?.vx||0,vy=hero?.vy||0;
  const walk=Math.min(1,Math.hypot(vx,vy)/110);
  const facing=Number.isFinite(hero?.facing)?hero.facing:0;
  const mirror=(Math.abs(vx)>8?vx:Math.cos(facing))<0?-1:1;
  const back=options.face==='back'||(options.face!=='front'&&
    options.face!=='back'&&walk>.14&&vy< -35&&Math.abs(vy)>Math.abs(vx)*.5);
  const attack=Math.max(0,Math.min(1,(hero?.attackPose||0)/.27));
  ctx.save();ctx.translate(x,y);
  // Shadow and aura deliberately do not mirror to avoid directional artifacts.
  if(options.shadow!==false) {
    const fade=hero?.inv>0?.7:1;
    shadow(ctx,fade);
  }
  ctx.scale(scale*mirror,scale);
  const bob=walk*Math.abs(Math.sin(t*11))*2;
  ctx.translate(0,-bob);
  if(hero?.inv>0)ctx.globalAlpha*=.72+.15*Math.sin(t*33);
  // Outer outline is rendered naturally by each stroked procedural shape.
  cape(ctx,t,walk);
  lowerArmor(ctx,t,walk);
  if(back){
    backSilhouette(ctx);
    underArms(ctx,t,walk);
    head(ctx,t,true);
  }else{
    torso(ctx,t);
    underArms(ctx,t,walk);
    head(ctx,t,false);
  }
  drawShield(ctx,t,walk);
  if(options.equipment!=='unarmed')sword(ctx,t,attack,walk);
  else hand(ctx,38,-59,1);
  // The tiny gem sparkles only as a subtle accent in battle, never a full-body glow.
  if(options.lighting!==false){
    const alpha=.25+.16*Math.sin(t*3.1);
    sparkle(ctx,0,-87,2.2,alpha);
  }
  ctx.restore();
}
