/**
 * MODELO B — "Aventureiro de argila"
 *
 * Independent procedural sculpt, not a recolor or deformation of WarriorModel.
 * No texture maps, painted patterns, armor plates, metallic shaders, sprites or GLB.
 *
 * Geometry is sculpted from multi-ring lofts, custom tapered sweeps, face wedges,
 * capsule joints and physical fabric folds. Everything uses ONE matte clay
 * material so geometry, normals and silhouette are the only visual details.
 *
 * Local feet at y=0. Forward +Z. Rig hierarchy stays editable.
 */
import * as THREE from 'three';

const PI=Math.PI, TAU=PI*2;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const ease=(value)=>value*value*(3-2*value);
const vec=(v)=>new THREE.Vector3(...v);
function group(parent,name,p=[0,0,0]){
  const o=new THREE.Group();o.name=name;o.position.set(...p);parent.add(o);return o;
}
function mesh(parent,name,geo,mat,p=[0,0,0]){
  const o=new THREE.Mesh(geo,mat);
  o.name=name;o.position.set(...p);parent.add(o);return o;
}
function ellipse(parent,name,mat,pos,scale,segments=20){
  const o=mesh(parent,name,new THREE.SphereGeometry(1,segments,Math.round(segments*.7)),mat,pos);
  o.scale.set(...scale);return o;
}
/**
 * Anatomical surface from horizontal elliptical cross sections.
 * row = [y, radiusX, radiusZ, offsetX=0, offsetZ=0].
 * Tiny radii close the ends with natural smooth normals.
 */
export function sculptLoft(rows,segments=24){
  if(rows.length<2||segments<3)throw Error('Loft exige anéis suficientes.');
  const verts=[],faces=[],uv=[];
  for(let j=0;j<rows.length;j++){
    const [y,rx,rz,cx=0,cz=0]=rows[j];
    for(let i=0;i<segments;i++){
      const theta=TAU*i/segments;
      verts.push(cx+Math.cos(theta)*rx,y,cz+Math.sin(theta)*rz);
      uv.push(i/segments,j/(rows.length-1));
    }
  }
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<segments;i++){
    const a=j*segments+i,b=j*segments+(i+1)%segments,c=(j+1)*segments+i,d=(j+1)*segments+(i+1)%segments;
    faces.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(faces);g.computeVertexNormals();return g;
}
function loft(parent,name,mat,rows,n=24){
  return mesh(parent,name,sculptLoft(rows,n),mat);
}
/** Tapered 3D spline: sculpted strands/seams taper instead of looking cylindrical. */
export function sculptSweep(points,radii,segments=18,sides=9){
  if(points.length<2||radii.length!==points.length)throw Error('Curva inválida');
  const curve=new THREE.CatmullRomCurve3(points.map(vec),false,'centripetal');
  const frames=curve.computeFrenetFrames(segments,false);
  const verts=[],idx=[];
  for(let j=0;j<=segments;j++){
    const u=j/segments;
    const k=u*(radii.length-1),a=Math.floor(k),b=Math.min(radii.length-1,a+1);
    const radius=radii[a]+(radii[b]-radii[a])*(k-a);
    const p=curve.getPoint(u),normal=frames.normals[j],binormal=frames.binormals[j];
    for(let i=0;i<sides;i++){
      const angle=TAU*i/sides;
      const v=p.clone().addScaledVector(normal,radius*Math.cos(angle))
        .addScaledVector(binormal,radius*Math.sin(angle));
      verts.push(v.x,v.y,v.z);
    }
  }
  for(let j=0;j<segments;j++)for(let i=0;i<sides;i++){
    const a=j*sides+i,b=j*sides+(i+1)%sides,c=(j+1)*sides+i,d=(j+1)*sides+(i+1)%sides;
    idx.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(idx);g.computeVertexNormals();return g;
}
function sweep(parent,name,mat,points,radii,sections=18){
  return mesh(parent,name,sculptSweep(points,radii,sections),mat);
}
function tube(parent,name,mat,points,r=.008){
  return sweep(parent,name,mat,points,points.map(()=>r),Math.max(9,points.length*6));
}
/** Folded cloth panel with sculpted edges; fully 3D, no alpha cards. */
export function sculptPanel({topY=0,bottomY=-.4,topWidth=.16,bottomWidth=.25,
    z=.2,curve=.035,folds=3,rows=12,cols=14}={}){
  const verts=[],indices=[];
  for(let j=0;j<=rows;j++){
    const t=j/rows,w=topWidth+(bottomWidth-topWidth)*ease(t);
    const y=topY+(bottomY-topY)*t;
    for(let i=0;i<=cols;i++){
      const u=i/cols*2-1;
      const x=u*w;
      const wave=Math.cos(u*PI*folds)*curve*t*t;
      const d=z-.05*t+.035*u*u*t+wave;
      verts.push(x,y,d);
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}
function panel(parent,name,mat,options){
  const o=mesh(parent,name,sculptPanel(options),mat);
  // A double-sided single clay surface lets the rear folds show during turns.
  return o;
}
function cylinder(parent,name,mat,pos,r0,r1,height,sides=20){
  return mesh(parent,name,new THREE.CylinderGeometry(r0,r1,height,sides),mat,pos);
}
function bridge(parent,name,mat,a,b,r0,r1){
  const v0=vec(a),v1=vec(b),dif=v1.clone().sub(v0);
  const cylinderObj=cylinder(parent,name,mat,v0.clone().add(v1).multiplyScalar(.5).toArray(),
    r1,r0,dif.length(),12);
  cylinderObj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dif.normalize());
  return cylinderObj;
}
/** Low-poly but smooth vertex geometry for nose wedge, lips and folded collar. */
function wedge(parent,name,mat,vertices,faces){
  const p=[],norm=[],facesSorted=[];
  for(const f of faces){
    for(const i of f)p.push(...vertices[i]);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geo.computeVertexNormals();
  return mesh(parent,name,geo,mat);
}
export class WarriorSculptModel {
  constructor(){
    this.material=new THREE.MeshStandardMaterial({
      color:0xc8c7c4,metalness:0,roughness:1,side:THREE.DoubleSide
    });
    this.root=group(new THREE.Group(),'modelo-b.argila');
    this.pelvis=group(this.root,'quadril',[0,1.16,0]);
    this.spine=group(this.pelvis,'coluna',[0,.14,0]);
    this.neck=group(this.spine,'pescoço',[0,.79,0]);
    this.head=group(this.neck,'cabeça',[0,.18,0]);
    this.leftArm=group(this.spine,'ombro.esquerdo',[-.305,.63,0]);
    this.rightArm=group(this.spine,'ombro.direito',[.305,.63,0]);
    this.leftElbow=group(this.leftArm,'cotovelo.esquerdo',[0,-.425,0]);
    this.rightElbow=group(this.rightArm,'cotovelo.direito',[0,-.425,0]);
    this.leftHand=group(this.leftElbow,'pulso.esquerdo',[0,-.315,0]);
    this.rightHand=group(this.rightElbow,'pulso.direito',[0,-.315,0]);
    this.leftLeg=group(this.pelvis,'coxa.esquerda',[-.145,-.095,0]);
    this.rightLeg=group(this.pelvis,'coxa.direita',[.145,-.095,0]);
    this.leftKnee=group(this.leftLeg,'joelho.esquerdo',[0,-.46,0]);
    this.rightKnee=group(this.rightLeg,'joelho.direito',[0,-.46,0]);
    this.leftFoot=group(this.leftKnee,'tornozelo.esquerdo',[0,-.43,0]);
    this.rightFoot=group(this.rightKnee,'tornozelo.direito',[0,-.43,0]);
    this.nodes={
      pelvis:this.pelvis,spine:this.spine,neck:this.neck,head:this.head,
      'upperArm.L':this.leftArm,'lowerArm.L':this.leftElbow,'hand.L':this.leftHand,
      'upperArm.R':this.rightArm,'lowerArm.R':this.rightElbow,'hand.R':this.rightHand,
      'upperLeg.L':this.leftLeg,'lowerLeg.L':this.leftKnee,'foot.L':this.leftFoot,
      'upperLeg.R':this.rightLeg,'lowerLeg.R':this.rightKnee,'foot.R':this.rightFoot
    };
    this.buildBody();
    this.buildHead();
    this.buildHair();
    this.buildGarments();
    this.buildHands();
    this.phase=0;this.speed=0;this.yaw=0;
    this.root.rotation.y=0;
  }
  buildBody(){
    const m=this.material;
    // Narrow waist, sloped shoulders, slightly concave abdomen.
    // Unlike A, the shirt is one sculpted tunic rather than angular plates.
    loft(this.spine,'torso.orgânico',m,[
      [-.025,.215,.135],[.04,.247,.153],[.145,.232,.164],
      [.30,.238,.165],[.42,.275,.183],[.56,.298,.182],
      [.67,.246,.151],[.735,.14,.104],[.79,.090,.085]
    ],28);
    loft(this.pelvis,'quadril.vestimenta',m,[
      [-.24,.26,.162],[-.17,.245,.15],[-.055,.235,.16],[.09,.236,.158]
    ],26);
    loft(this.neck,'pescoço.anatômico',m,[
      [-.09,.067,.066],[-.02,.087,.077],[.08,.077,.073],[.145,.071,.069]
    ],20);
    for(const side of [-1,1]){
      const arm=side<0?this.leftArm:this.rightArm;
      const elbow=side<0?this.leftElbow:this.rightElbow;
      const leg=side<0?this.leftLeg:this.rightLeg;
      const knee=side<0?this.leftKnee:this.rightKnee;
      const foot=side<0?this.leftFoot:this.rightFoot;
      // Slim shoulder-to-elbow muscle taper; not capsules or bulky pauldrons.
      loft(arm,'manga.justaposta',m,[
        [-.45,.072,.079],[-.38,.100,.103],[-.255,.105,.111],
        [-.135,.131,.126],[-.012,.138,.133],[.036,.065,.07]
      ],22);
      loft(elbow,'antebraço.esculpido',m,[
        [-.335,.064,.069],[-.255,.079,.086],[-.145,.091,.1],[-.038,.083,.085],[.022,.071,.075]
      ],20);
      // Subtle elbow joint hidden inside sleeved anatomy.
      ellipse(elbow,'cotovelo.junta',m,[0,-.015,0],[.093,.105,.1],18);
      loft(leg,'coxa.tecido',m,[
        [-.485,.102,.115],[-.43,.115,.13],[-.34,.138,.149],
        [-.19,.146,.16],[-.08,.15,.156],[.07,.128,.134]
      ],24);
      ellipse(knee,'rotula',m,[0,0,.012],[.112,.11,.12],16);
      loft(knee,'panturrilha.tecido',m,[
        [-.43,.075,.09],[-.38,.090,.102],[-.29,.106,.115],
        [-.21,.111,.116],[-.085,.098,.111],[-.015,.095,.108]
      ],22);
      // Shoes with modeled heel, sole and anatomical toes.
      loft(foot,'cano.bota',m,[
        [-.095,.105,.122],[-.015,.117,.12],[.14,.117,.126],[.215,.106,.118]
      ],20);
      ellipse(foot,'pé.instep',m,[0,-.066,.075],[.119,.095,.183],22);
      ellipse(foot,'pé.frente',m,[0,-.081,.188],[.125,.07,.147],22);
      // Sole is a real extruded volume, not a painted seam.
      ellipse(foot,'sola.esculpida',m,[0,-.127,.115],[.134,.034,.235],22);
      sweep(foot,'borda.sola',m,[
        [-.113,-.126,.213],[-.104,-.129,.286],[0,-.13,.311],
        [.105,-.129,.286],[.115,-.126,.206]],[.01,.013,.014,.013,.01],18);
      for(let n=0;n<3;n++){
        tube(foot,'dobra.peito.pé.'+n,m,[
          [-.08,-.003+n*.04,.14],[0,.006+n*.04,.15],
          [.08,-.003+n*.04,.14]
        ],.006);
      }
    }
  }
  buildHead(){
    const m=this.material;
    // Face: profile evolves from jaw and chin to cheeks, temples and crown.
    // This is a bespoke head mesh, not the sphere from Model A.
    loft(this.head,'crânio.rostro.esculpido',m,[
      [-.297,.018,.030,0,.062],[-.267,.083,.087,0,.043],
      [-.220,.118,.126,0,.014],[-.157,.160,.164,0,.013],
      [-.074,.185,.174,0,.007],[.018,.193,.187,0,0],
      [.125,.190,.191,0,-.01],[.222,.157,.165,0,-.017],
      [.290,.12,.126,0,-.018],[.342,.01,.012,0,-.013]
    ],32);
    // Cheeks and jaw are deliberately restrained; the nose has a true profile.
    for(const sign of [-1,1]){
      ellipse(this.head,'orelha.externa',m,[sign*.185,-.042,-.014],[.050,.093,.045],18);
      ellipse(this.head,'prega.orelha',m,[sign*.222,-.056,.017],[.023,.058,.021],16);
      // Eye sockets as shallow geometry, not white discs or realistic glass eyes.
      ellipse(this.head,'base.órbita',m,[sign*.087,.016,.172],[.064,.039,.014],18);
      sweep(this.head,'pálpebra.superior',m,[
        [sign*.031,.033,.178],[sign*.08,.049,.186],
        [sign*.138,.032,.156]],[.012,.010,.006],14);
      sweep(this.head,'pálpebra.inferior',m,[
        [sign*.037,.001,.183],[sign*.088,-.008,.194],
        [sign*.138,.006,.166]],[.007,.008,.004],14);
      sweep(this.head,'sobrancelha',m,[
        [sign*.027,.084,.167],[sign*.087,.096,.177],
        [sign*.148,.073,.139]],[.014,.016,.005],15);
    }
    // Nose bridge = tapered loft oriented depth, followed by triangular tip.
    loft(this.head,'ponte.nariz',m,[
      [-.14,.025,.046,0,.208],[-.09,.033,.042,0,.21],
      [-.028,.020,.027,0,.183],[.042,.014,.017,0,.154]
    ],14);
    wedge(this.head,'ponta.nariz',m,[
      [-.033,-.13,.245],[.033,-.13,.245],
      [0,-.093,.265],[0,-.16,.202],[0,-.095,.202]
    ],[[0,1,2],[0,2,3],[1,3,2],[0,4,1]]);
    // Restrained mouth — 3D lips with subtle natural curve.
    sweep(this.head,'lábio.superior',m,[
      [-.05,-.193,.134],[-.024,-.186,.165],[0,-.189,.173],
      [.024,-.186,.165],[.05,-.193,.134]
    ],[.004,.011,.010,.011,.004],18);
    sweep(this.head,'lábio.inferior',m,[
      [-.038,-.207,.147],[0,-.217,.179],[.038,-.207,.147]
    ],[.004,.014,.004],16);
    ellipse(this.head,'queixo.orgânico',m,[0,-.245,.07],[.073,.048,.078],16);
    // Neck-to-chin silhouette preserved at side view.
  }
  buildHair(){
    const m=this.material;
    // Side-swept mid-length layered hair, substantially different from A.
    const cap=loft(this.head,'cabelo.volumetria.base',m,[
      [.09,.203,.198,0,-.01],[.16,.213,.211,0,-.016],
      [.26,.191,.188,0,-.020],[.34,.126,.135,0,-.021],
      [.397,.008,.011,0,-.016]
    ],30);
    // Sculpted swept strands with tapered organic flow.
    const strands=[
      [[-.16,.35,.03],[-.16,.23,.141],[-.12,.133,.202],[-.085,.043,.195]],
      [[-.11,.392,.044],[-.098,.27,.202],[-.036,.145,.229],[.013,.087,.203]],
      [[-.035,.39,.077],[.01,.289,.211],[.095,.189,.228],[.131,.125,.180]],
      [[.059,.387,.072],[.141,.290,.167],[.174,.173,.174],[.182,.085,.112]],
      [[.137,.354,-.005],[.204,.273,.065],[.215,.127,.085],[.207,-.025,.04]],
      [[-.18,.323,-.026],[-.21,.213,.062],[-.215,.066,.066],[-.205,-.105,.013]],
      [[-.15,.354,-.13],[-.203,.220,-.171],[-.216,.042,-.151],[-.17,-.235,-.128]],
      [[-.045,.389,-.16],[-.108,.253,-.193],[-.117,.055,-.196],[-.092,-.245,-.145]],
      [[.057,.376,-.154],[.07,.236,-.207],[.088,.04,-.201],[.092,-.25,-.145]],
      [[.148,.33,-.115],[.183,.201,-.151],[.198,.012,-.168],[.151,-.19,-.118]]
    ];
    strands.forEach((points,i)=>sweep(this.head,'cabelo.mechão.'+i,m,points,
      [i<4?.070:.062,.066,.044,.003],21));
    // Fine secondary strands build depth without using strand textures.
    for(let i=0;i<9;i++){
      const x=-.205+i*.049;
      const z=i%2===0?-.156:-.177;
      sweep(this.head,'cabelo.ponta.nuca.'+i,m,[
        [x*.78,.17,z],[x,.025,z-.015],[x*.95,-.19,z+.016]
      ],[.03,.027,.002],13);
    }
  }
  buildGarments(){
    const m=this.material;
    // Standing collar with a folded U silhouette, not metal ornamentation.
    const collar=loft(this.neck,'gola.levantada',m,[
      [-.132,.125,.113],[-.089,.132,.11],[.003,.11,.099],[.039,.078,.074]
    ],22);
    // Main asymmetrical tunic hem / overlapping sculpted cloth folds.
    panel(this.pelvis,'túnica.frontal.drapeado',m,{
      topY:.09,bottomY:-.34,topWidth:.205,bottomWidth:.26,z:.188,folds:3,curve:.022
    });
    const sideFlap=panel(this.pelvis,'túnica.painel.lateral',m,{
      topY:.07,bottomY:-.38,topWidth:.14,bottomWidth:.2,z:.20,folds:2,curve:.017
    });
    sideFlap.rotation.y=.65;sideFlap.position.x=.17;
    // Natural cloth wrinkles on chest, not painted details.
    const folds=[
      [[-.18,.49,.195],[-.11,.47,.21],[-.04,.42,.22]],
      [[.2,.48,.192],[.12,.42,.22],[.055,.37,.219]],
      [[-.18,.2,.163],[-.09,.19,.176],[.02,.16,.173]],
      [[.14,.2,.165],[.1,.12,.179],[.045,.08,.186]],
      [[-.14,.04,.178],[-.06,.005,.198],[.05,-.015,.185]]
    ];
    folds.forEach((p,i)=>tube(this.spine,'dobra.tecido.'+i,m,p,.009));
    // Cloth sash draped from left shoulder to right hip: very different silhouette.
    sweep(this.spine,'faixa.transversal',m,[
      [-.23,.63,.13],[-.16,.5,.195],[-.055,.34,.22],
      [.045,.17,.191],[.16,.035,.152]
    ],[.036,.043,.044,.04,.029],22);
    const loose=panel(this.pelvis,'faixa.solta',m,{
      topY:-.09,bottomY:-.52,topWidth:.086,bottomWidth:.14,z:.176,folds:2,curve:.018
    });
    loose.position.x=.16;loose.rotation.y=.38;
    cylinder(this.spine,'cinto.couro.esculpido',m,[0,.052,0],.25,.247,.068,26).scale.z=.76;
    ellipse(this.spine,'nó.cinto',m,[.135,.054,.191],[.045,.042,.028],14);
    for(const side of [-1,1]){
      const elbow=side<0?this.leftElbow:this.rightElbow;
      const foot=side<0?this.leftFoot:this.rightFoot;
      cylinder(elbow,'punho.camiseta',m,[0,-.29,0],.073,.071,.045,14);
      cylinder(foot,'borda.cano.bota',m,[0,.17,.0],.123,.11,.052,18);
    }
  }
  buildHands(){
    const m=this.material;
    for(const side of [-1,1]){
      const palm=side<0?this.leftHand:this.rightHand;
      loft(palm,'palma.anatômica',m,[
        [-.15,.048,.03],[-.11,.072,.039],[-.03,.08,.039],[.047,.062,.037]
      ],18);
      // Thumb angles away from the palm, creating recognizable side silhouettes.
      sweep(palm,'polegar',m,[
        [side*.064,-.012,.024],[side*.105,-.065,.052],
        [side*.1,-.12,.055]
      ],[.028,.027,.004],13);
      for(let f=0;f<4;f++){
        const x=-.047+f*.031;
        const len=.094-(f===0||f===3?.018:0);
        sweep(palm,'dedo.'+f,m,[
          [x,-.117,.008],[x*1.02,-.127-len*.55,.012],
          [x*1.03,-.125-len,.017]
        ],[.016,.013,.003],10);
      }
    }
  }
  getHierarchy(){return Object.keys(this.nodes).sort();}
  /** Same minimal interface as the existing model, independent skeleton. */
  update(actor={},time=0,dt=1/60,{yaw=null,instant=false}={}){
    const dtSafe=clamp(dt,0,.08);
    const speed=clamp(Math.hypot(actor.vx||0,actor.vy||0)/185,0,1);
    this.speed+= (speed-this.speed)*(1-Math.exp(-9*dtSafe));
    this.phase+=dtSafe*(3+8*this.speed);
    const angle=Number.isFinite(actor.facing)?actor.facing:PI/2;
    const target=yaw??(PI/2-angle);
    const diff=Math.atan2(Math.sin(target-this.yaw),Math.cos(target-this.yaw));
    this.yaw=instant?target:this.yaw+diff*(1-Math.exp(-12*dtSafe));
    this.root.rotation.y=this.yaw;
    const s=Math.sin(this.phase),w=this.speed;
    const active=clamp(1-Math.max(0,actor.attackPose||0)/.27,0,1);
    const attack=actor.attackPose>0?Math.sin(PI*active):0;
    this.pelvis.position.y=1.16+.016*w*Math.cos(2*this.phase);
    this.pelvis.rotation.y=.014*w*s;
    this.spine.rotation.x=.02*w+.015*Math.sin(time*2.6)-.12*attack;
    this.spine.rotation.z=-.024*w*s;
    this.head.rotation.y=.02*Math.sin(time*.8);
    this.head.rotation.z=-.028*w*s+.012*Math.sin(time*1.3);
    this.neck.rotation.x=-.02*w;
    this.leftLeg.rotation.x=.51*w*s;
    this.rightLeg.rotation.x=-.51*w*s;
    this.leftKnee.rotation.x=.55*w*Math.max(0,-s);
    this.rightKnee.rotation.x=.55*w*Math.max(0,s);
    this.leftFoot.rotation.x=-.46*this.leftLeg.rotation.x-.25*this.leftKnee.rotation.x;
    this.rightFoot.rotation.x=-.46*this.rightLeg.rotation.x-.25*this.rightKnee.rotation.x;
    this.leftArm.rotation.x=-.35*w*s;
    this.rightArm.rotation.x=.35*w*s-.9*attack;
    this.leftArm.rotation.z=-.085+.04*w*s;
    this.rightArm.rotation.z=.085-.43*attack;
    this.leftElbow.rotation.x=-.15;
    this.rightElbow.rotation.x=-.15-.65*attack;
    this.leftHand.rotation.z=-.02*w*s;
    this.rightHand.rotation.z=.02*w*s+.2*attack;
  }
  dispose(){
    const g=new Set();
    this.root.traverse(o=>{if(o.isMesh&&o.geometry)g.add(o.geometry);});
    g.forEach(geo=>geo.dispose());
    this.material.dispose();
  }
}
