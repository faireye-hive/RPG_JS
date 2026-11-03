/**
 * Guerreiro 3D procedural — Crônicas do Éter
 *
 * No meshes, textures, animations or character art are downloaded.
 * Small, deliberately stylized proportions and thin, optional armor.
 * 3D hierarchy: root -> hips -> legs / spine -> chest -> head / shoulders -> arms -> hands -> gear.
 * Units: feet y = 0, height ~2.6, forward is +Z, right is +X.
 */
import * as THREE from 'three';

const PALETTE=Object.freeze({
  outline:0x15252e, hair:0x302d37, hairLight:0x68505b,
  face:0xe4ae8e, ear:0xbd876f, shadow:0xb57b6e, highlight:0xffdac0,
  tunic:0x354e59, tunicLight:0x426874, leather:0x573e39, leatherLight:0x84604b,
  pants:0x26353e, boots:0x2a3038,
  metal:0x899ca4, metalLight:0xc0d0ca, metalDark:0x495f6a,
  gold:0xd6aa70, goldLight:0xf6dfaa, cape:0x7d344a, capeDark:0x4b283b,
  teal:0x58d9b7, tealDark:0x236b6b, eye:0x345b65, white:0xfff2d9,
});
const smooth=(a,b,t)=>a+(b-a)*t;
const damp=(current,target,speed,dt)=>smooth(current,target,1-Math.exp(-speed*dt));
export const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const angleDifference=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function yawFromFacing(angle){return Math.PI/2-angle;}

/** Scene-only procedural materials. Quantized light prevents uncanny semi-realism. */
function materials(){
  const levels=new Uint8Array([70,120,185,255]);
  const gradient=new THREE.DataTexture(levels,4,1,THREE.RedFormat,THREE.UnsignedByteType);
  gradient.magFilter=THREE.NearestFilter;gradient.minFilter=THREE.NearestFilter;
  gradient.needsUpdate=true;
  const cache=new Map();
  const get=(color)=>{if(!cache.has(color))cache.set(color,new THREE.MeshToonMaterial({
    color,gradientMap:gradient,side:THREE.FrontSide
  }));return cache.get(color);};
  return {get,cache,gradient};
}
function g(parent,name,x=0,y=0,z=0){
  const group=new THREE.Group();group.name=name;group.position.set(x,y,z);parent.add(group);return group;
}
function mesh(parent,name,geometry,material,x=0,y=0,z=0){
  const obj=new THREE.Mesh(geometry,material);obj.name=name;
  obj.position.set(x,y,z);obj.castShadow=false;obj.receiveShadow=false;
  parent.add(obj);return obj;
}
function ell(parent,name,mat,p=[0,0,0],s=[1,1,1],w=16,h=12){
  const obj=mesh(parent,name,new THREE.SphereGeometry(1,w,h),mat,...p);
  obj.scale.set(...s);return obj;
}
function cylinder(parent,name,mat,p,top,bottom,height,seg=12){
  return mesh(parent,name,new THREE.CylinderGeometry(top,bottom,height,seg,1),mat,...p);
}
function box(parent,name,mat,p,dim,bev=.04){
  // Rounded boxes are smoother than a cuboid armor silhouette.
  const geo=new THREE.BoxGeometry(...dim);
  const obj=mesh(parent,name,geo,mat,...p);
  return obj;
}
function rod(parent,name,mat,a,b,r0,r1,segments=10){
  const v0=new THREE.Vector3(...a),v1=new THREE.Vector3(...b);
  const d=v1.clone().sub(v0);
  const obj=mesh(parent,name,new THREE.CylinderGeometry(r1,r0,d.length(),segments),mat,
    ...(v0.clone().add(v1).multiplyScalar(.5).toArray()));
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return obj;
}
/** Tapered rings generate anatomy without rigid box-style procedural characters. */
export function loftGeometry(rings,segments=18){
  if(rings.length<2||segments<3)throw Error('Loft requires two rings and three segments');
  const points=[],indices=[];
  for(const ring of rings){
    const [y,rx,rz,x=0,z=0]=ring;
    for(let i=0;i<segments;i++){
      const a=i*Math.PI*2/segments;
      points.push(x+Math.cos(a)*rx,y,z+Math.sin(a)*rz);
    }
  }
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){
    const a=j*segments+i,b=j*segments+(i+1)%segments,c=(j+1)*segments+i,d=(j+1)*segments+(i+1)%segments;
    indices.push(a,c,b,b,c,d);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function loft(parent,name,mat,rows,segments=18){
  return mesh(parent,name,loftGeometry(rows,segments),mat);
}
/** Flat extruded decorative plate; flat front is +Z. */
function plate(parent,name,mat,points,z,depth=.025){
  const shape=new THREE.Shape();
  shape.moveTo(...points[0]);
  for(const p of points.slice(1))shape.lineTo(...p);
  shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{
    depth,steps:1,bevelEnabled:true,bevelThickness:.007,bevelSize:.007,bevelSegments:1,
    curveSegments:4
  });
  return mesh(parent,name,geo,mat,0,0,z);
}
function stripe(parent,name,mat,points,r=.011){
  const curve=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));
  return mesh(parent,name,new THREE.TubeGeometry(curve,Math.max(4,points.length*3),r,5,false),mat);
}
/** One narrow flexible cloth strip; vertices updated from movement, never from physics. */
class Cape {
  constructor(parent,mat,shade,side){
    this.side=side;
    const across=5,along=10;
    const pos=new Float32Array((across+1)*(along+1)*3),uv=[];
    const faces=[];
    for(let i=0;i<=along;i++)for(let j=0;j<=across;j++)uv.push(j/across,i/along);
    for(let i=0;i<along;i++)for(let j=0;j<across;j++){
      const a=i*(across+1)+j,b=a+1,c=a+across+1,d=c+1;
      faces.push(a,b,c,b,d,c);
    }
    this.geometry=new THREE.BufferGeometry();
    this.geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));
    this.geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    this.geometry.setIndex(faces);
    this.material=mat.clone();this.material.side=THREE.DoubleSide;
    this.mesh=mesh(parent,side<0?'capa.esquerda':'capa.direita',this.geometry,this.material);
    this.rim=shade;
    this.update(0,0,0);
  }
  update(t,speed,turn){
    const attr=this.geometry.getAttribute('position'),cols=6;
    for(let i=0;i<=10;i++){
      const v=i/10,fall=v*v;
      for(let j=0;j<=5;j++){
        const u=j/5;
        const x=this.side*(.14+u*(.12+.08*v)) + Math.sin(t*2.5+u*2+v*3)*.018*fall;
        const y=1.98-v*(1.08+this.side*.035);
        const z=-.21-v*.105+fall*(.05*Math.sin(t*3+v*4)+.055*speed*Math.sin(t*9+v*5))+
          .045*turn*fall;
        attr.setXYZ(i*cols+j,x,y,z);
      }
    }
    attr.needsUpdate=true;
    this.geometry.computeVertexNormals();
  }
  dispose(){this.geometry.dispose();this.material.dispose();}
}
export class WarriorModel {
  constructor({armor='light',sword=true,shield=true}={}){
    this.materials=materials();
    const m=c=>this.materials.get(c);
    this.root=g(new THREE.Group(),'guerreiro.root');
    this.body=g(this.root,'corpo');
    this.hips=g(this.body,'quadril',0,1.17,0);
    this.spine=g(this.hips,'coluna',0,.13,0);
    this.chest=g(this.spine,'peito',0,.38,0);
    this.neck=g(this.spine,'pescoco',0,.74,0);
    this.head=g(this.neck,'cabeca',0,.18,0);
    this.leftArm=g(this.spine,'ombro.esquerdo',-.37,.62,0);
    this.rightArm=g(this.spine,'ombro.direito',.37,.62,0);
    this.leftElbow=g(this.leftArm,'cotovelo.esquerdo',0,-.43,0);
    this.rightElbow=g(this.rightArm,'cotovelo.direito',0,-.43,0);
    this.leftHand=g(this.leftElbow,'mao.esquerda',0,-.34,0);
    this.rightHand=g(this.rightElbow,'mao.direita',0,-.34,0);
    this.leftLeg=g(this.hips,'quadril.perna.esquerda',-.17,-.07,0);
    this.rightLeg=g(this.hips,'quadril.perna.direita',.17,-.07,0);
    this.leftKnee=g(this.leftLeg,'joelho.esquerdo',0,-.50,0);
    this.rightKnee=g(this.rightLeg,'joelho.direito',0,-.50,0);
    this.leftFoot=g(this.leftKnee,'tornozelo.esquerdo',0,-.44,0);
    this.rightFoot=g(this.rightKnee,'tornozelo.direito',0,-.44,0);
    this.nodes={
      'pelvis':this.hips,'spine':this.spine,'head':this.head,
      'upperArm.L':this.leftArm,'lowerArm.L':this.leftElbow,'hand.L':this.leftHand,
      'upperArm.R':this.rightArm,'lowerArm.R':this.rightElbow,'hand.R':this.rightHand,
      'upperLeg.L':this.leftLeg,'lowerLeg.L':this.leftKnee,'foot.L':this.leftFoot,
      'upperLeg.R':this.rightLeg,'lowerLeg.R':this.rightKnee,'foot.R':this.rightFoot
    };
    this.buildBody(m);
    this.buildHead(m);
    this.buildClothes(m);
    this.armorPieces=g(this.spine,'equipamento.armadura');
    this.buildArmor(m);
    this.weapon=g(this.rightHand,'equipamento.espada',0,-.025,.085);
    this.buildSword(m);
    this.shield=g(this.leftElbow,'equipamento.escudo',-.045,-.19,.16);
    this.buildShield(m);
    this.cape=[new Cape(this.root,m(PALETTE.cape),PALETTE.capeDark,-1),
               new Cape(this.root,m(PALETTE.cape),PALETTE.capeDark,1)];
    this.phase=0;this.speed=0;this.yaw=0;this.lastTime=0;
    this.setArmor(armor);this.setEquipment({sword,shield});
    this.root.rotation.y=0;
  }
  buildBody(m){
    // Slim stylized human shape: proportional shoulder width, no oversized torso.
    loft(this.hips,'tunica.baixo',m(PALETTE.tunic),[
      [-.18,.27,.17],[-.08,.30,.21],[.12,.29,.20],[.27,.26,.19]
    ],20);
    loft(this.spine,'tronco.tecido',m(PALETTE.tunic),[
      [.02,.25,.17],[.22,.28,.20],[.49,.35,.22],[.67,.29,.20],[.75,.15,.13]
    ],22);
    ell(this.neck,'pele.pescoco',m(PALETTE.face),[0,.015,0],[.105,.14,.105]);
    for(const sign of [-1,1]){
      const arm=sign<0?this.leftArm:this.rightArm;
      const elbow=sign<0?this.leftElbow:this.rightElbow;
      const hand=sign<0?this.leftHand:this.rightHand;
      const leg=sign<0?this.leftLeg:this.rightLeg;
      const knee=sign<0?this.leftKnee:this.rightKnee;
      const foot=sign<0?this.leftFoot:this.rightFoot;
      ell(arm,'braco.superior',m(PALETTE.tunic),[0,-.205,0],[.115,.264,.125]);
      ell(elbow,'braco.inferior',m(PALETTE.face),[0,-.17,0],[.09,.215,.097]);
      ell(hand,'mao',m(PALETTE.face),[0,-.04,.014],[.088,.114,.075]);
      ell(leg,'coxa.tecido',m(PALETTE.pants),[0,-.245,.0],[.145,.29,.16]);
      ell(knee,'joelho.tecido',m(PALETTE.pants),[0,0,.015],[.124,.14,.13]);
      ell(knee,'canela',m(PALETTE.pants),[0,-.21,.015],[.11,.27,.122]);
      ell(foot,'bota',m(PALETTE.boots),[0,-.004,.095],[.135,.145,.228]);
      box(foot,'sola',m(PALETTE.outline),[0,-.11,.12],[.29,.055,.38]);
      for(let i=0;i<3;i++){
        const boot=box(foot,'costura.bota',m(PALETTE.leatherLight),
          [0,-.07+i*.055,.267-i*.012],[.19,.015,.02]);
        boot.rotation.x=.15;
      }
    }
  }
  buildHead(m){
    const skin=m(PALETTE.face),hair=m(PALETTE.hair);
    // Large readable head without photorealistic texture or doll-like cheeks.
    const skull=ell(this.head,'rosto.base',skin,[0,0,0],[.249,.29,.221],24,18);
    ell(this.head,'queixo',skin,[0,-.155,.052],[.162,.125,.16],16,12);
    for(const sign of [-1,1]){
      ell(this.head,'orelha',m(PALETTE.ear),[sign*.244,-.037,0],[.056,.096,.057],12,10);
      ell(this.head,'interior.orelha',m(PALETTE.shadow),[sign*.294,-.04,.036],[.018,.044,.017],12,8);
      // Eyes on a curved face: profile naturally disappears when the model turns.
      ell(this.head,'esclerotica',m(PALETTE.white),[sign*.099,.014,.194],[.065,.041,.03],12,9);
      ell(this.head,'iris',m(PALETTE.eye),[sign*.094,.011,.224],[.029,.035,.009],12,8);
      ell(this.head,'pupila',m(PALETTE.outline),[sign*.093,.010,.232],[.016,.026,.005],12,8);
      ell(this.head,'brilho.olhos',m(PALETTE.white),[sign*.10,.024,.24],[.008,.009,.004],10,6);
      rod(this.head,'sobrancelha',m(PALETTE.hair),[sign*.056,.096,.204],[sign*.144,.102,.173],.011,.012,7);
    }
    ell(this.head,'nariz',m(PALETTE.highlight),[0,-.075,.237],[.033,.056,.048],10,8);
    ell(this.head,'sombra.labio',m(PALETTE.shadow),[0,-.16,.195],[.052,.008,.009],12,6);
    // Hair cap only top ~55% of head; sculpted tapering locks add silhouette.
    const cap=new THREE.SphereGeometry(1,24,10,0,2*Math.PI,0,Math.PI*.51);
    const hairCap=mesh(this.head,'cabelo.coroa',cap,hair,0,.084,-.007);
    hairCap.scale.set(.259,.291,.231);
    const locks=[
      [[-.2,.24,.05],[-.16,.11,.217],[-.14,.047,.233]],
      [[-.13,.28,.065],[-.12,.10,.244],[-.07,.041,.236]],
      [[-.02,.28,.071],[.01,.105,.246],[.06,.052,.228]],
      [[.10,.28,.049],[.10,.12,.234],[.14,.075,.191]],
      [[.20,.235,-.008],[.23,.093,.151],[.22,-.035,.098]],
      [[-.22,.22,-.011],[-.24,.082,.141],[-.225,-.045,.1]]
    ];
    locks.forEach((pts,i)=>{
      const a=new THREE.Vector3(...pts[0]),b=new THREE.Vector3(...pts[1]),c=new THREE.Vector3(...pts[2]);
      // Two tapered pieces build sharp anime-inspired locks, not realistic strands.
      rod(this.head,'cabelo.mechas.'+i,i%2?m(PALETTE.hairLight):hair,a.toArray(),b.toArray(),.053,.042,8);
      rod(this.head,'cabelo.ponta.'+i,hair,b.toArray(),c.toArray(),.042,.001,8);
    });
    // Short back locks make the rear angle readable.
    for(let i=0;i<7;i++){
      const theta=i/6*Math.PI;
      const x=Math.cos(theta)*.218;
      rod(this.head,'nuca.'+i,hair,[x,.065,-.158],[x*.92,-.19,-.151],.045,.012,7);
    }
  }
  buildClothes(m){
    // Narrow tabard and belt. Individual garment pieces are replaceable.
    plate(this.spine,'tabardo.frontal',m(PALETTE.tunicLight),
      [[-.195,.09],[.195,.09],[.11,-.3],[0,-.42],[-.11,-.3]],.191,.008);
    plate(this.spine,'friso.tabardo',m(PALETTE.gold),
      [[-.025,.04],[.025,.04],[.013,-.22],[0,-.32],[-.013,-.22]],.209,.004);
    const belt=cylinder(this.spine,'cinto',m(PALETTE.leather),[0,.115,0],.3,.3,.093,20);
    belt.scale.z=.73;
    box(this.spine,'fivela',m(PALETTE.gold),[0,.11,.228],[.095,.081,.032]);
    box(this.spine,'miolo.fivela',m(PALETTE.tealDark),[0,.11,.25],[.05,.041,.015]);
    for(const sign of [-1,1]){
      const arm=sign<0?this.leftArm:this.rightArm;
      cylinder(arm,'manga',m(PALETTE.leather),[0,-.18,0],.126,.13,.21,12);
      const elbow=sign<0?this.leftElbow:this.rightElbow;
      cylinder(elbow,'bracelete',m(PALETTE.leather),[0,-.145,0],.103,.101,.19,12);
      cylinder(elbow,'aro.punho',m(PALETTE.gold),[0,-.232,0],.108,.106,.024,12);
      const foot=sign<0?this.leftFoot:this.rightFoot;
      cylinder(foot,'punho.bota',m(PALETTE.leather),[0,.095,.025],.144,.14,.11,12);
    }
    stripe(this.spine,'costura.peito',m(PALETTE.gold),
      [[-.17,.57,.198],[-.1,.53,.228],[0,.51,.231],[.1,.53,.228],[.17,.57,.198]],.009);
  }
  buildArmor(m){
    // Modest protective plates; no swollen pauldrons or barrel-shaped torso.
    const steel=m(PALETTE.metal),edge=m(PALETTE.metalDark),gold=m(PALETTE.gold);
    const chest=g(this.armorPieces,'peitoral');
    plate(chest,'lamina.peito',steel,
      [[-.24,.56],[0,.63],[.24,.56],[.19,.31],[0,.25],[-.19,.31]],.236,.018);
    plate(chest,'sombra.friso',edge,
      [[-.22,.54],[0,.60],[.22,.54],[.17,.51],[0,.55],[-.17,.51]],.271,.008);
    plate(chest,'emblema',gold,
      [[0,.51],[.069,.45],[.053,.36],[0,.30],[-.053,.36],[-.069,.45]],.277,.009);
    ell(chest,'pedra.peito',m(PALETTE.teal),[0,.425,.297],[.027,.037,.015],12,9);
    stripe(chest,'filete.peito',m(PALETTE.goldLight),
      [[-.18,.37,.271],[-.08,.305,.28],[0,.28,.282],[.08,.305,.28],[.18,.37,.271]],.008);
    for(const sign of [-1,1]){
      const arm=sign<0?this.leftArm:this.rightArm;
      // Shoulder radius <= .20: tailored scale, not oversized armor.
      const shape=ell(arm,'ombreira',steel,[sign*.017,-.054,.016],[.173,.113,.176],15,12);
      shape.rotation.z=sign*.1;
      ell(arm,'arco.ombreira',edge,[sign*.035,-.095,.034],[.159,.045,.169],14,10);
      const knee=sign<0?this.leftKnee:this.rightKnee;
      ell(knee,'placa.joelho',edge,[0,-.016,.107],[.121,.091,.066],13,9);
      ell(knee,'placa.centro.joelho',steel,[0,-.028,.144],[.082,.048,.026],12,8);
      const elbow=sign<0?this.leftElbow:this.rightElbow;
      ell(elbow,'protege.braco',steel,[0,-.18,.103],[.088,.143,.035],12,9);
    }
  }
  buildSword(m){
    const metal=m(PALETTE.metalLight),bright=m(PALETTE.white),gold=m(PALETTE.gold);
    const w=this.weapon;
    // The blade is a lightweight 3D tapered prism, not a 2D sticker.
    cylinder(w,'empunhadura',m(PALETTE.leather),[0,-.085,0],.036,.042,.26,10);
    ell(w,'pomo',gold,[0,-.23,0],[.063,.06,.063],12,10);
    box(w,'guarda',gold,[0,.066,0],[.30,.047,.066]);
    for(const sign of [-1,1])
      ell(w,'quillon',gold,[sign*.15,.065,0],[.035,.055,.041],10,8);
    const blade=loft(w,'lamina',metal,[
      [.08,.037,.018],[.17,.053,.028],[.55,.043,.024],[.79,.027,.015],[.95,.002,.002]
    ],8);
    blade.rotation.y=Math.PI/8;
    stripe(w,'fio.reflexo',bright,[[.003,.16,.028],[.004,.50,.026],[.003,.8,.012]],.009);
    ell(w,'gema.guarda',m(PALETTE.teal),[0,.072,.047],[.038,.044,.016],11,9);
    // At rest the blade points down beside the leg.
    w.rotation.set(0,0,Math.PI);
  }
  buildShield(m){
    const group=this.shield;
    group.rotation.y=.2;
    const steel=m(PALETTE.metalDark),metal=m(PALETTE.metalLight),gold=m(PALETTE.gold);
    plate(group,'escudo.silhueta',steel,
      [[0,.34],[.205,.23],[.185,-.14],[0,-.34],[-.185,-.14],[-.205,.23]],.015,.065);
    plate(group,'escudo.face',m(PALETTE.tunicLight),
      [[0,.287],[.158,.18],[.143,-.118],[0,-.268],[-.143,-.118],[-.158,.18]],.095,.012);
    plate(group,'escudo.borda',gold,
      [[-.168,.20],[0,.29],[.168,.20],[.16,.16],[0,.248],[-.16,.16]],.108,.012);
    plate(group,'escudo.emblema',gold,
      [[0,.13],[.088,.045],[.07,-.068],[0,-.16],[-.07,-.068],[-.088,.045]],.126,.012);
    ell(group,'gema.escudo',m(PALETTE.teal),[0,.019,.153],[.035,.055,.019],12,9);
    for(const x of [-.17,.17])for(const y of [-.05,.15]){
      ell(group,'rebite',metal,[x,y,.119],[.014,.014,.012],8,6);
    }
  }
  setArmor(value){
    this.armor=value==='cloth'?'cloth':'light';
    this.armorPieces.visible=this.armor!=='cloth';
    // Chest remains slim in both variants; clothing never changes the skeleton dimensions.
  }
  setEquipment({sword,shield}={}){
    if(sword!==undefined)this.weapon.visible=Boolean(sword);
    if(shield!==undefined)this.shield.visible=Boolean(shield);
  }
  getHierarchy(){
    return Object.keys(this.nodes).sort();
  }
  /**
   * Pose update is time-based (not frame-based). Character local forward +Z.
   * When facing changes, the whole skeleton rotates smoothly in 3D.
   */
  update(actor={},time=0,dt=1/60,{yaw=null,instant=false}={}){
    const velocity=Math.hypot(actor.vx||0,actor.vy||0);
    const walk=clamp(velocity/185,0,1);
    const facing=Number.isFinite(actor.facing)?actor.facing:Math.PI/2;
    const target=yaw??yawFromFacing(facing);
    const safeDt=clamp(dt,0,.08);
    this.yaw=instant?target:this.yaw+angleDifference(this.yaw,target)*(1-Math.exp(-12*safeDt));
    this.root.rotation.y=this.yaw;
    this.speed=damp(this.speed,walk,11,safeDt);
    this.phase+=safeDt*(3.8+7*this.speed);
    const s=Math.sin(this.phase),s2=Math.sin(2*this.phase);
    const walking=this.speed,attack=Math.max(0,actor.attackPose||0);
    const strike=attack>0?clamp(1-attack/.27,0,1):0;
    const swing=attack>0?Math.sin(strike*Math.PI):0;
    this.hips.position.y=1.17+walking*.023*(1-Math.cos(this.phase*2));
    this.hips.rotation.y=.024*walking*s;
    this.spine.rotation.x=.035*walking+.018*Math.sin(time*2.6);
    this.spine.rotation.z=-.022*walking*s;
    this.neck.rotation.x=-.025*walking;
    this.head.rotation.z=.02*Math.sin(time*1.8)-.025*walking*s;
    this.leftLeg.rotation.x=walking*s*.48;
    this.rightLeg.rotation.x=-walking*s*.48;
    this.leftKnee.rotation.x=walking*Math.max(0,-s)*.5;
    this.rightKnee.rotation.x=walking*Math.max(0,s)*.5;
    this.leftFoot.rotation.x=-this.leftLeg.rotation.x*.45-this.leftKnee.rotation.x*.32;
    this.rightFoot.rotation.x=-this.rightLeg.rotation.x*.45-this.rightKnee.rotation.x*.32;
    this.leftArm.rotation.x=-walking*s*.32;
    this.rightArm.rotation.x=walking*s*.32-swing*.98;
    this.leftArm.rotation.z=-.095-walking*.05;
    this.rightArm.rotation.z=.085-swing*.67;
    this.leftElbow.rotation.x=-.12+walking*Math.max(0,-s)*.08;
    this.rightElbow.rotation.x=-.12-swing*.55;
    this.rightHand.rotation.x=swing*.3;
    this.weapon.rotation.z=Math.PI-swing*1.55;
    this.weapon.rotation.x=-.12-swing*.9;
    this.shield.rotation.y=.2+walking*.04*Math.sin(this.phase);
    for(const cape of this.cape)cape.update(time,walking,.2*Math.sin(this.phase));
  }
  dispose(){
    const geometries=new Set(),custom=new Set();
    this.root.traverse(obj=>{
      if(obj.geometry)geometries.add(obj.geometry);
    });
    geometries.forEach(geo=>geo.dispose());
    this.cape.forEach(c=>custom.add(c.material));
    custom.forEach(mat=>mat.dispose());
    this.materials.cache.forEach(mat=>mat.dispose());
    this.materials.gradient.dispose();
  }
}
