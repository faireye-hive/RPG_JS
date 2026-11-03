/**
 * OBJ T-pose of the REAL procedural Warrior C geometry.
 *
 * Mixamo accepts OBJ (and ZIP with OBJ/MTL); this is a static mesh,
 * deliberately WITHOUT the editor skeleton or any previous idle animation.
 *
 * We bake group transforms and the small SkinnedMesh elbow into vertex data.
 * The export is one OBJ object (still containing several disconnected shells:
 * hair, clothes, facial details and the original C limb segments).
 * The result is useful for Mixamo experiments, not a guaranteed one-piece
 * manifold/autorig-ready character.
 */
import * as THREE from 'three';
import {WarriorRefinedModel} from '../render/three/WarriorRefinedModel.js';

const SCALE_CM=180;
const p3=v=>[v.x,v.y,v.z].map(n=>Object.is(n,-0)?'0':n.toFixed(5)).join(' ');
const safe=(s)=>String(s).replace(/[\r\n]/g,'').slice(0,100);

export function poseWarriorCT(model){
  // Original Warrior C arms hang downward along -Y. Rotation around local Z
  // turns each full hierarchical arm sideways from its shoulder socket.
  model.leftArm.rotation.set(0,0,-Math.PI/2);
  model.rightArm.rotation.set(0,0,Math.PI/2);
  model.leftElbow.rotation.set(0,0,0);
  model.rightElbow.rotation.set(0,0,0);
  model.leftHand.rotation.set(0,0,0);
  model.rightHand.rotation.set(0,0,0);
  // Keep forearms + fingers extended and legs distinguishably separated.
  model.leftLeg.rotation.set(0,0,-.055);
  model.rightLeg.rotation.set(0,0,.055);
  model.leftKnee.rotation.set(0,0,0);
  model.rightKnee.rotation.set(0,0,0);
  model.leftFoot.rotation.set(0,0,0);
  model.rightFoot.rotation.set(0,0,0);
  // Remove procedural idling entirely; leave the torso/head upright.
  model.spine.rotation.set(0,0,0);
  model.cervical.rotation.set(0,0,0);
  model.neck.rotation.set(0,0,0);
  model.head.rotation.set(0,0,0);
  for(const {elbow,bend} of model.cRig.elbowSkins)
    bend.rotation.copy(elbow.rotation);
  model.root.updateMatrixWorld(true);
  for(const {sleeve} of model.cRig.elbowSkins)sleeve.skeleton.update();
  return model;
}
/**
 * Build the full mesh as a single OBJ object. All geometry is baked in
 * world coordinates and centered at X=0/Z=0, feet on Y=0.
 * OBJ world scale is 180 units high to provide convenient centimeter units.
 *
 * @returns {{obj:string,mtl:string,stats:object}}
 */
export function buildWarriorCTposeOBJ(){
  const model=poseWarriorCT(new WarriorRefinedModel());
  const meshes=[];
  const allVertices=[];
  let min=new THREE.Vector3(Infinity,Infinity,Infinity);
  let max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);
  let meshesCount=0,bakedSkins=0,skippedFaces=0;
  try{
    model.root.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.geometry?.getAttribute('position'))return;
      const geometry=mesh.geometry;
      const positions=geometry.getAttribute('position');
      const vertices=[];
      for(let i=0;i<positions.count;i++){
        const v=new THREE.Vector3().fromBufferAttribute(positions,i);
        if(mesh.isSkinnedMesh)mesh.applyBoneTransform(i,v);
        v.applyMatrix4(mesh.matrixWorld);
        if(![v.x,v.y,v.z].every(Number.isFinite))
          throw Error('Non-finite vertex in '+mesh.name+' at index '+i);
        vertices.push(v);
        min.min(v);max.max(v);
      }
      const tris=[];
      const indices=geometry.getIndex();
      const count=indices?indices.count:positions.count;
      for(let i=0;i+2<count;i+=3){
        const a=indices?indices.getX(i):i;
        const b=indices?indices.getX(i+1):i+1;
        const c=indices?indices.getX(i+2):i+2;
        if(a>=vertices.length||b>=vertices.length||c>=vertices.length)
          throw Error('Bad triangle vertex index in '+mesh.name);
        const ab=vertices[b].clone().sub(vertices[a]);
        const ac=vertices[c].clone().sub(vertices[a]);
        if(ab.cross(ac).lengthSq()<1e-18){skippedFaces++;continue}
        tris.push([a,b,c]);
      }
      if(!tris.length)return;
      meshes.push({name:safe(mesh.name),vertices,tris});
      meshesCount++;
      if(mesh.isSkinnedMesh)bakedSkins++;
    });
    if(!meshes.length||!Number.isFinite(min.y)||max.y-min.y<1)
      throw Error('No exportable humanoid geometry');
    const height=max.y-min.y;
    const scale=SCALE_CM/height;
    const centerX=(max.x+min.x)/2,centerZ=(max.z+min.z)/2;
    const output=[
      '# Crônicas do Éter — Guerreiro C — T-pose procedural',
      '# Modelo original sem texturas; braços horizontais, dedos estendidos.',
      '# Geometry baked to centimeters; height: 180.0 cm, up: +Y, forward: +Z',
      '# All triangle faces belong to one OBJ object; materials are matte gray.',
      'mtllib guerreiro-c-tpose.mtl',
      'o Guerreiro_C_Tpose',
      'usemtl argila_c'
    ];
    let start=1;
    for(const mesh of meshes){
      output.push('# '+mesh.name+' '+mesh.tris.length+' faces');
      for(const v of mesh.vertices){
        output.push('v '+p3(new THREE.Vector3(
          (v.x-centerX)*scale,(v.y-min.y)*scale,(v.z-centerZ)*scale)));
      }
      for(const [a,b,c] of mesh.tris)
        output.push('f '+(a+start)+' '+(b+start)+' '+(c+start));
      start+=mesh.vertices.length;
    }
    const mtl=[
      '# Gray clay material, texture-free, for Mixamo automatic rigging',
      'newmtl argila_c','Ka 0.2 0.2 0.2',
      'Kd 0.7843 0.7804 0.7686','Ks 0.02 0.02 0.02','Ns 1',
      'd 1.0','illum 2',''
    ].join('\n');
    const stats={
      model:'C',pose:'T',height_cm:180,up:'Y',forward:'Z',
      meshes:meshesCount,vertices:start-1,faces:meshes.reduce((s,m)=>s+m.tris.length,0),
      skinnedMeshesBaked:bakedSkins,skippedDegenerateFaces:skippedFaces,
      boundingBoxCM:{min:[(min.x-centerX)*scale,0,(min.z-centerZ)*scale],
        max:[(max.x-centerX)*scale,SCALE_CM,(max.z-centerZ)*scale]},
      note:'One OBJ object with disconnected procedural shells; automatic rigging not guaranteed.'
    };
    return {obj:output.join('\n')+'\n',mtl,stats};
  }finally{model.dispose();}
}
