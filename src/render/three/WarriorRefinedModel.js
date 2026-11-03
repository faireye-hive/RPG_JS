/**
 * MODELO C — refinamento anatômico do B, somente geometria de argila.
 *
 * Mantém a identidade do B (rosto, cabelo, roupas, silhueta esguia) e
 * substitui a estrutura de ombros, bíceps, cotovelos, pescoço e mãos.
 *
 * Sem textura / normal map / imagem / armadura / shader pintado.
 * Um único material cinza fosco e malhas com volume construídas por código.
 *
 * Rig: pelve -> coluna -> clavículas -> ombros -> cotovelos -> punhos
 *      -> palmas -> 5 dedos com 2 articulações cada;
 *      coluna -> cervicais inferiores -> pescoço superior -> cabeça.
 *
 * Importante: animação por juntas (rig hierárquico). Não há skinning contínuo
 * nas juntas; interseções sutis entre superfícies suavizadas ocultam a costura.
 */
import * as THREE from 'three';
import {WarriorSculptModel,sculptLoft,sculptSweep} from './WarriorSculptModel.js';

const PI=Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const blend=(v,target,sharpness,dt)=>v+(target-v)*(1-Math.exp(-sharpness*dt));
const g=(parent,name,x=0,y=0,z=0)=>{
  const node=new THREE.Group();node.name=name;node.position.set(x,y,z);
  parent.add(node);return node;
};
function loft(parent,name,mat,rings,segments=24){
  const o=new THREE.Mesh(sculptLoft(rings,segments),mat);
  o.name=name;parent.add(o);return o;
}
function sweep(parent,name,mat,pts,radii,res=22){
  const o=new THREE.Mesh(sculptSweep(pts,radii,res,10),mat);
  o.name=name;parent.add(o);return o;
}
function organicJoint(parent,name,mat,pos,size){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mat);
  mesh.name=name;mesh.position.set(...pos);mesh.scale.set(...size);
  parent.add(mesh);return mesh;
}
function clearOriginal(parent,names){
  const pool=new Set(names);
  for(const obj of [...parent.children]){
    if(obj.isMesh&&pool.has(obj.name)){
      parent.remove(obj);
      obj.geometry.dispose(); // replacement owns a fresh geometry
    }
  }
}
function finger(parent,mat,label,x,len,spread=0){
  const base=g(parent,label,x,-.150,.008);
  base.rotation.z=spread;
  const proximal=loft(base,label+'.falange1',mat,[
    [-len*.66,.011,.013,0,.003],
    [-len*.46,.016,.018,0,.001],
    [-len*.19,.019,.020,0,0],
    [.011,.018,.019,0,0]
  ],13);
  const distal=g(base,label+'.junta2',0,-len*.65,.003);
  organicJoint(distal,label+'.nó2',mat,[0,0,0],[.014,.016,.016]);
  loft(distal,label+'.falange2',mat,[
    [-len*.48,.004,.006,0,.012],
    [-len*.31,.014,.014,0,.007],
    [-len*.12,.015,.016,0,.001],
    [.010,.015,.015,0,0]
  ],12);
  return {base,distal,proximal};
}

export class WarriorRefinedModel extends WarriorSculptModel {
  constructor(){
    super();
    this.root.name='modelo-c.escultura-anatômica';
    this.cRig={shoulders:[],wrists:[],fingers:[],thumbs:[],neck:null};
    this.poseGesture=0;
    this.refineNeck();
    this.refineArms();
    this.refineHands();
    this._baseWalk=0;
    // Same unpainted material inherited from B, no texture attachment.
    this.material.color.set(0xc8c7c4);
    this.material.roughness=1;
    this.material.metalness=0;
  }
  refineNeck(){
    const mat=this.material;
    // B used a single rigid neck + head. C adds two cervical pivots,
    // so the collar, neck anatomy and head can have separate rotations.
    clearOriginal(this.neck,['pescoço.anatômico']);
    const cervical=g(this.spine,'cervical.inferior',0,.72,0);
    cervical.add(this.neck);
    this.neck.position.set(0,.07,0);
    this.cervical=cervical;
    loft(this.neck,'pescoço.refinado',mat,[
      [-.115,.100,.086,0,.009],
      [-.060,.106,.089,0,.004],
      [0,.089,.082,0,0],
      [.065,.076,.071,0,.003],
      [.145,.078,.075,0,.004]
    ],22);
    // Fine anatomy: trapezius is continuous from shoulders to lower neck.
    // These sculpted wedges are on the spine, not painted shadows.
    for(const side of [-1,1]){
      loft(this.spine,'trapézio.'+(side<0?'esquerdo':'direito'),mat,[
        [.595,.052,.105,side*.195,-.04],
        [.66,.085,.11,side*.156,-.03],
        [.715,.073,.080,side*.113,-.025],
        [.759,.046,.057,side*.087,-.016]
      ],15);
      sweep(this.neck,'tendão.cervical.'+side,mat,[
        [side*.090,-.102,.028],
        [side*.085,-.043,.072],
        [side*.061,.059,.070],
        [side*.043,.126,.057]
      ],[.018,.019,.013,.003],18);
    }
    this.nodes['cervical.lower']=this.cervical;
    this.nodes['cervical.upper']=this.neck;
    this.cRig.neck=this.cervical;
  }
  refineArms(){
    const mat=this.material;
    for(const side of [-1,1]){
      const suffix=side<0?'L':'R';
      const upper=side<0?this.leftArm:this.rightArm;
      const elbow=side<0?this.leftElbow:this.rightElbow;
      clearOriginal(upper,['manga.justaposta']);
      clearOriginal(elbow,['antebraço.esculpido','cotovelo.junta']);
      // Pivot at inner clavicle, followed by real shoulder ball.
      // The arm remains exactly where B had it in world coordinates.
      const shoulder=g(this.spine,'clavícula.'+suffix,side*.15,.655,0);
      shoulder.add(upper);
      upper.position.set(side*.155,-.025,0);
      // A curved collarbone connecting chest to deltoid, narrow and short.
      sweep(shoulder,'clavícula.esculpida.'+suffix,mat,[
        [-side*.105,.018,.125],
        [-side*.055,.027,.117],
        [side*.044,.004,.079],
        [side*.121,-.023,.034]
      ],[.016,.024,.032,.006],20);
      // Deltoid is no longer a cylinder: bell shape merges into collar
      // and narrows toward the elbow, with shifted cross-section centers.
      loft(upper,'deltoide.anatômico.'+suffix,mat,[
        [-.454,.071,.081,0,.009],
        [-.397,.086,.100,side*.006,.010],
        [-.319,.099,.111,side*.010,.004],
        [-.237,.112,.116,side*.018,0],
        [-.173,.135,.125,side*.030,-.007],
        [-.103,.152,.135,side*.024,-.012],
        [-.031,.132,.117,side*.014,-.008],
        [.030,.075,.075,-side*.009,-.011],
        [.070,.009,.016,-side*.026,-.014]
      ],28);
      // A low-relief posterior triceps volume breaks the "tube" silhouette.
      loft(upper,'tríceps.'+suffix,mat,[
        [-.380,.035,.043,-side*.014,-.070],
        [-.302,.048,.050,-side*.015,-.072],
        [-.218,.050,.051,-side*.015,-.061],
        [-.131,.047,.039,side*.004,-.066],
        [-.065,.012,.018,side*.006,-.046]
      ],17);
      // Soft tissue around the elbow overlaps both upper and lower sections.
      organicJoint(elbow,'cotovelo.oval.'+suffix,mat,[0,-.010,-.008],
        [.080,.104,.088]);
      loft(elbow,'antebraço.volume.'+suffix,mat,[
        [-.350,.053,.060,0,.012],
        [-.302,.063,.071,0,.013],
        [-.245,.073,.082,side*.003,.023],
        [-.181,.089,.098,side*.007,.015],
        [-.115,.096,.107,side*.005,0],
        [-.049,.079,.094,0,-.010],
        [.025,.074,.077,0,-.010],
        [.062,.018,.021,0,-.008]
      ],24);
      // Subtle raised fabric folds make the anatomy read in clay.
      sweep(elbow,'costura.punho.'+suffix,mat,[
        [-.064,-.302,.04],[0,-.315,.072],
        [.064,-.302,.04]
      ],[.005,.006,.005],13);
      this.cRig.shoulders.push({side,shoulder,upper,elbow});
      this.nodes['clavicle.'+suffix]=shoulder;
      this.nodes['shoulder.'+suffix]=upper;
    }
  }
  refineHands(){
    const mat=this.material;
    for(const side of [-1,1]){
      const suffix=side<0?'L':'R';
      const wrist=side<0?this.leftHand:this.rightHand;
      // Remove B's rigid palm and welded fingers.
      for(const obj of [...wrist.children]){
        if(obj.isMesh){
          wrist.remove(obj);
          obj.geometry.dispose();
        }
      }
      // A palm joint separate from the wrist and five finger pivots.
      const palm=g(wrist,'palma.articulada.'+suffix,0,-.038,0);
      loft(palm,'palma.esculpida.'+suffix,mat,[
        [-.153,.049,.028,0,.010],
        [-.128,.067,.036,0,.004],
        [-.086,.071,.044,0,0],
        [-.029,.077,.043,0,0],
        [.039,.055,.034,0,-.002]
      ],22);
      const knuckles=[];
      for(let i=0;i<4;i++){
        const x=-.052+i*.034;
        const len=[.092,.105,.102,.082][i];
        const digit=finger(palm,mat,'dedo.'+suffix+'.'+i,x,len,(i-1.5)*.055);
        knuckles.push(digit);
        this.nodes['finger.'+suffix+'.'+i+'.base']=digit.base;
        this.nodes['finger.'+suffix+'.'+i+'.tip']=digit.distal;
      }
      // Thumb has its own saddle/base and distal hinge, not a static rod.
      const thumbRoot=g(palm,'polegar.base.'+suffix,side*.070,-.038,.027);
      thumbRoot.rotation.z=side*.36;
      sweep(thumbRoot,'polegar.metacarpo.'+suffix,mat,[
        [0,0,0],[side*.032,-.025,.035],[side*.052,-.059,.054]
      ],[.029,.025,.021],13);
      const thumbTip=g(thumbRoot,'polegar.dobra.'+suffix,side*.052,-.060,.054);
      loft(thumbTip,'polegar.falange.'+suffix,mat,[
        [-.075,.004,.005,side*.010,.012],
        [-.050,.019,.019,side*.008,.008],
        [-.025,.022,.021,0,0],
        [.012,.020,.020,0,0]
      ],14);
      this.nodes['thumb.'+suffix+'.base']=thumbRoot;
      this.nodes['thumb.'+suffix+'.tip']=thumbTip;
      this.nodes['palm.'+suffix]=palm;
      this.cRig.wrists.push({side,wrist,palm});
      this.cRig.fingers.push({side,knuckles});
      this.cRig.thumbs.push({side,thumbRoot,thumbTip});
    }
  }
  getHierarchy(){return Object.keys(this.nodes).sort();}
  update(actor={},time=0,dt=1/60,options={}){
    super.update(actor,time,dt,options);
    const step=clamp(dt,0,.08);
    const walk=this.speed;
    const cadence=Math.sin(this.phase);
    const attackPose=Math.max(0,actor.attackPose||0);
    const progress=attackPose>0?clamp(1-attackPose/.27,0,1):0;
    const attack=attackPose>0?Math.sin(PI*progress):0;
    // A separate gesture demonstrates articulation even with no weapon.
    const manual=actor.manualRig||{};
    const gestureTarget=clamp(actor.demoGesture||0,0,1);
    this.poseGesture=blend(this.poseGesture,gestureTarget,10,step);
    const gesture=this.poseGesture;
    const wave=Math.sin(time*7.0);
    // Two cervical bones + head: nod, lateral inclination and gaze direction.
    this.cervical.rotation.x=.024*Math.sin(time*1.7)-.040*walk+gesture*.08;
    this.cervical.rotation.y=.050*Math.sin(time*.9)+gesture*.12+clamp(manual.neck||0,-1,1)*.72;
    this.cervical.rotation.z=.017*Math.sin(time*1.1)-walk*cadence*.02;
    this.neck.rotation.x=.027*Math.sin(time*2.1)-gesture*.06;
    this.neck.rotation.y=.065*Math.sin(time*1.03)+gesture*.08;
    this.neck.rotation.z=.018*Math.cos(time*1.9);
    this.head.rotation.x=.022*Math.sin(time*2.0)-gesture*.055;
    this.head.rotation.y=.045*Math.sin(time*.94)+gesture*.06;
    this.head.rotation.z=.016*Math.sin(time*1.6)-walk*cadence*.025;
    for(const {side,shoulder,upper,elbow} of this.cRig.shoulders){
      const opposite=side<0?1:-1;
      const stepPhase=side<0?cadence:-cadence;
      const waving=side>0?gesture:0;
      // Clavicles rotate subtly together with the arms and upper chest.
      shoulder.rotation.x=.025*Math.sin(time*1.5)+.04*stepPhase*walk;
      shoulder.rotation.y=side*(.018+.035*walk*Math.sin(this.phase));
      shoulder.rotation.z=side*(.015+.025*Math.sin(time*1.8));
      // Deltoid remains attached to scapula rather than pivoting like a tube.
      upper.rotation.x=-stepPhase*.34*walk-.48*attack*(side>0?1:0)-waving*.24;
      upper.rotation.y=side*(.07+.08*walk);
      upper.rotation.z=side*(.17+.05*walk)-.35*attack*(side>0?1:0)+
        waving*1.06+(side>0?1.18*clamp(manual.shoulder||0,0,1):0);
      // Elbow bends naturally during walk, impact and raised-hand gesture.
      const walkFlex=Math.max(0,stepPhase)*walk*.20;
      elbow.rotation.x=-.16-walkFlex-(side>0?.78*attack:0)-waving*.95-
        (side>0?1.08*clamp(manual.elbow||0,0,1):0);
      elbow.rotation.y=side*.035;
      elbow.rotation.z=side*(.025+.02*walk);
    }
    for(const {side,wrist,palm} of this.cRig.wrists){
      const right=side>0;
      const raising=right?gesture:0;
      wrist.rotation.x=-.035-(right?.25*attack:0)+raising*.12+
        .075*walk*Math.sin(this.phase+(right?0:PI));
      wrist.rotation.y=side*(.055+.10*raising);
      wrist.rotation.z=side*.02+(right?.33*attack:0)+
        raising*.37*wave+(right?.75*clamp(manual.wrist||0,-1,1):0);
      // Palm can oppose the wrist, which was impossible in B.
      palm.rotation.x=.05+raising*.13+.08*Math.sin(time*1.3+side);
      palm.rotation.y=side*(.025+.11*raising);
      palm.rotation.z=-side*.035+raising*.18*wave;
    }
    for(const {side,knuckles} of this.cRig.fingers){
      const right=side>0;
      const grasp=clamp(.17+.5*attack*(right?1:0)+
        .22*walk+ .19*(right?gesture:0)*(.5+.5*Math.sin(time*5))+
        (right?clamp(manual.fingers||0,0,1):0),0,1);
      knuckles.forEach(({base,distal},i)=>{
        // Alternating finger motion prevents a rigid "paddle hand".
        const curl=clamp(grasp+.07*Math.sin(time*3.2+i*.9+side),0,1);
        base.rotation.x=-(.09+curl*.75);
        distal.rotation.x=-(.12+curl*.76);
        base.rotation.z=(i-1.5)*(.035+.03*(1-curl));
        distal.rotation.z=(i-1.5)*.012;
      });
    }
    for(const {side,thumbRoot,thumbTip} of this.cRig.thumbs){
      const pulse=.5+.5*Math.sin(time*2.5+side);
      const grip=.12+.58*attack*(side>0?1:0)+.17*walk+
        .17*gesture*pulse*(side>0?1:0);
      thumbRoot.rotation.x=-.10-grip*.54;
      thumbRoot.rotation.y=side*(.11+.14*grip);
      thumbRoot.rotation.z=side*(.36-.15*grip);
      thumbTip.rotation.x=-.12-.45*grip;
    }
  }
}
