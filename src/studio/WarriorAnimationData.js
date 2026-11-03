import {USER_IDLE_FRAMES} from './WarriorCUserIdle.js';
/**
 * Editable keyframe project for Crônicas do Éter — procedural Warrior C.
 * Pure data model: runs in the browser or Node without WebGL.
 * Angles are relative to the model's rest pose, expressed in DEGREES (XYZ).
 * JSON can be exported, edited, re-imported and sent for development.
 */
export const ANIMATION_FORMAT='cronicas-do-eter/warrior-c-animation-project';
export const ANIMATION_VERSION=1;
export const EDITOR_STORAGE_KEY='cronicas-warrior-c-animation-studio-v1';
const MAX_CLIPS=32,MAX_FRAMES=600,MAX_BONES=120;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const round=(v,digits=4)=>Number(v.toFixed(digits));
const safeName=n=>String(n||'Animação').trim().slice(0,80)||'Animação';
const idOf=name=>String(name).toLowerCase().replace(/[^a-z0-9_-]/g,'-').slice(0,48)||'anim';
export const emptyPose=()=>Object.create(null);
function degrees(x){return round(clamp(Number(x)||0,-360,360),3);}
export function cleanPose(pose){
  const output={};
  if(!pose||typeof pose!=='object'||Array.isArray(pose))return output;
  for(const [key,value] of Object.entries(pose).slice(0,MAX_BONES)){
    if(!/^[a-zA-Z0-9._-]{1,72}$/.test(key))continue;
    if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))continue;
    output[key]=value.map(degrees);
  }
  return output;
}
export function clonePose(pose){return cleanPose(pose);}
export function createClip(name='Nova animação',duration=1,id){
  const title=safeName(name);
  return {id:id||idOf(title)+'-'+Math.random().toString(36).slice(2,7),
    name:title,duration:round(clamp(Number(duration)||1,.15,30),3),
    fps:30,loop:true,keyframes:[]};
}
export function putFrame(clip,time,pose){
  if(!clip||!Array.isArray(clip.keyframes))throw Error('Animação inválida');
  const t=round(clamp(Number(time)||0,0,clip.duration),4);
  const frame={time:t,pose:cleanPose(pose)};
  const found=clip.keyframes.findIndex(f=>Math.abs(f.time-t)<.0005);
  if(found>=0)clip.keyframes.splice(found,1,frame);
  else{
    if(clip.keyframes.length>=MAX_FRAMES)throw Error('Limite de quadros atingido');
    clip.keyframes.push(frame);
  }
  clip.keyframes.sort((a,b)=>a.time-b.time);
  return frame;
}
export function removeFrame(clip,time,tolerance=.03){
  const ix=clip.keyframes.findIndex(f=>Math.abs(f.time-time)<=tolerance);
  if(ix>=0){clip.keyframes.splice(ix,1);return true}
  return false;
}
export function nearestFrame(clip,time,tolerance=.03){
  return clip.keyframes.find(f=>Math.abs(f.time-time)<=tolerance)||null;
}
export function shortestAngle(a,b,alpha){
  const diff=((b-a+540)%360)-180;
  return round(a+diff*alpha,4);
}
export function mixPoses(a={},b={},ratio=0){
  const keys=new Set([...Object.keys(a),...Object.keys(b)]);
  const pose={};
  for(const name of keys){
    const from=a[name]||[0,0,0],to=b[name]||[0,0,0];
    pose[name]=[0,1,2].map(i=>shortestAngle(from[i]||0,to[i]||0,ratio));
  }
  return pose;
}
/** Returns evaluated pose, never mutates clip keyframes. */
export function sampleClip(clip,seconds){
  const keys=clip?.keyframes||[];
  if(!keys.length)return {};
  if(keys.length===1)return clonePose(keys[0].pose);
  const duration=Number(clip.duration)||1,loop=clip.loop!==false;
  const t=loop?((seconds%duration)+duration)%duration:clamp(seconds,0,duration);
  let left,right,fromTime,toTime;
  if(t<keys[0].time){
    if(!loop)return clonePose(keys[0].pose);
    left=keys.at(-1);right=keys[0];
    fromTime=left.time-duration;toTime=right.time;
  }else if(t>keys.at(-1).time){
    if(!loop)return clonePose(keys.at(-1).pose);
    left=keys.at(-1);right=keys[0];
    fromTime=left.time;toTime=right.time+duration;
  }else{
    for(let i=0;i<keys.length-1;i++){
      if(t>=keys[i].time&&t<=keys[i+1].time){
        left=keys[i];right=keys[i+1];break;
      }
    }
    if(!left)return clonePose(keys.at(-1).pose);
    fromTime=left.time;toTime=right.time;
  }
  const alpha=clamp((t-fromTime)/(toTime-fromTime||1),0,1);
  return mixPoses(left.pose,right.pose,alpha);
}
export function parseProject(raw){
  const value=typeof raw==='string'?JSON.parse(raw):raw;
  if(!value||value.format!==ANIMATION_FORMAT||value.version!==1||value.model!=='C')
    throw Error('JSON incompatível: esperado projeto de animação do Guerreiro C (versão 1).');
  if(!Array.isArray(value.clips)||!value.clips.length||value.clips.length>MAX_CLIPS)
    throw Error('O projeto deve conter de 1 a 32 animações.');
  const ids=new Set();
  const clips=value.clips.map((v,index)=>{
    if(!v||!Array.isArray(v.keyframes)||v.keyframes.length>MAX_FRAMES)
      throw Error('Quadros inválidos na animação '+(index+1));
    const clip=createClip(v.name,v.duration,String(v.id||'clip-'+index));
    if(ids.has(clip.id))throw Error('Identificadores de animação repetidos.');
    ids.add(clip.id);
    clip.loop=v.loop!==false;
    clip.fps=clamp(Math.round(Number(v.fps)||30),1,60);
    for(const f of v.keyframes){
      if(!f||!Number.isFinite(f.time)||f.time<0||f.time>clip.duration+.001)
        throw Error('Tempo de quadro inválido em '+clip.name);
      putFrame(clip,f.time,f.pose);
    }
    return clip;
  });
  const active=clips.some(c=>c.id===value.activeClip)?value.activeClip:clips[0].id;
  return {
    format:ANIMATION_FORMAT,version:ANIMATION_VERSION,model:'C',
    projectName:safeName(value.projectName||'Animações do Guerreiro C'),
    activeClip:active,clips
  };
}
function keyPose(pose){return cleanPose(pose)}
function poseSet(entries){return keyPose(Object.fromEntries(entries))}
function preset(id,name,duration,loop,frames){
  const c=createClip(name,duration,id);
  c.loop=loop;
  for(const [time,pose] of frames)putFrame(c,time,pose);
  return c;
}
export function createStarterProject(){
  // Names match WarriorRefinedModel.nodes (relative rotations, degrees).
  // Exact keyframes from the user's exported idle, not a regenerated guess.
  const idle=preset('idle','Parado / respiração',2,true,USER_IDLE_FRAMES);
  const walk=preset('walk','Caminhar',.8,true,[
    [0,poseSet([['upperLeg.L',[29,0,0]],['upperLeg.R',[-29,0,0]],['lowerLeg.R',[20,0,0]],['upperArm.L',[-23,0,0]],['upperArm.R',[23,0,0]],['spine',[2,0,0]]])],
    [.2,poseSet([['upperLeg.L',[0,0,0]],['upperLeg.R',[0,0,0]],['lowerLeg.L',[29,0,0]],['lowerLeg.R',[9,0,0]],['pelvis',[0,0,2]]])],
    [.4,poseSet([['upperLeg.L',[-29,0,0]],['upperLeg.R',[29,0,0]],['lowerLeg.L',[20,0,0]],['upperArm.L',[23,0,0]],['upperArm.R',[-23,0,0]],['spine',[2,0,0]]])],
    [.6,poseSet([['upperLeg.L',[0,0,0]],['upperLeg.R',[0,0,0]],['lowerLeg.R',[29,0,0]],['lowerLeg.L',[9,0,0]],['pelvis',[0,0,-2]]])],
    [.8,poseSet([['upperLeg.L',[29,0,0]],['upperLeg.R',[-29,0,0]],['lowerLeg.R',[20,0,0]],['upperArm.L',[-23,0,0]],['upperArm.R',[23,0,0]],['spine',[2,0,0]]])]
  ]);
  const wave=preset('wave','Acenar',1.6,true,[
    [0,{}],
    [.3,poseSet([['clavicle.R',[0,0,10]],['upperArm.R',[-10,0,68]],['lowerArm.R',[-35,0,15]],['hand.R',[0,0,12]],['cervical.upper',[0,8,0]]])],
    [.55,poseSet([['upperArm.R',[-10,0,72]],['lowerArm.R',[-48,0,18]],['hand.R',[0,0,-26]],['cervical.upper',[0,8,0]]])],
    [.8,poseSet([['upperArm.R',[-10,0,72]],['lowerArm.R',[-48,0,18]],['hand.R',[0,0,25]],['cervical.upper',[0,8,0]]])],
    [1.15,poseSet([['upperArm.R',[-10,0,72]],['lowerArm.R',[-38,0,18]],['hand.R',[0,0,-16]]])],
    [1.6,{}]
  ]);
  const attack=preset('attack','Ataque — teste',.85,false,[
    [0,{}],
    [.18,poseSet([['spine',[0,-8,0]],['upperArm.R',[-22,0,-30]],['lowerArm.R',[-58,0,0]],['upperArm.L',[6,0,-12]]])],
    [.4,poseSet([['spine',[-15,18,4]],['upperArm.R',[-80,0,35]],['lowerArm.R',[-30,0,0]],['upperArm.L',[14,0,-5]]])],
    [.63,poseSet([['spine',[-5,5,0]],['upperArm.R',[-27,0,10]],['lowerArm.R',[-18,0,0]]])],
    [.85,{}]
  ]);
  return {format:ANIMATION_FORMAT,version:ANIMATION_VERSION,model:'C',
    projectName:'Animações do Guerreiro C',activeClip:'idle',
    clips:[idle,walk,wave,attack]};
}
export function exportProject(project){
  return JSON.stringify(parseProject(project),null,2)+'\n';
}
