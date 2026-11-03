import test from 'node:test';
import assert from 'node:assert/strict';
import { drawWarrior } from '../src/render/characters/Warrior.js';

function mock(){
  let depth=0,commands=0,strokes=0;
  const ctx=new Proxy({globalAlpha:1},{
    get(o,k){
      if(k in o)return o[k];
      if(k==='createLinearGradient'||k==='createRadialGradient')return(...v)=>{
        v.forEach(x=>assert.ok(Number.isFinite(x)));
        return {addColorStop(t,s){assert.ok(t>=0&&t<=1);assert.equal(typeof s,'string');}};
      };
      if(k==='save')return()=>{depth++;};
      if(k==='restore')return()=>{depth--;assert.ok(depth>=0);};
      return(...v)=>{
        const n={quadraticCurveTo:4,bezierCurveTo:6,moveTo:2,lineTo:2,translate:2,scale:2,rotate:1,ellipse:7,arc:5}[k];
        if(n)assert.equal(v.length,n,String(k));
        v.filter(x=>typeof x==='number').forEach(x=>assert.ok(Number.isFinite(x),String(k)));
        commands++;if(k==='stroke')strokes++;
      };
    },set(o,k,v){o[k]=v;return true;}
  });
  return {ctx,summary:()=>({depth,commands,strokes})};
}
test('Guerreiro procedural renderiza poses e vistas sem geometria inválida',()=>{
  const {ctx,summary}=mock();
  for(const p of [
    {vx:0,vy:0,facing:0},
    {vx:140,vy:20,facing:.2,attackPose:.14},
    {vx:-180,vy:-180,facing:-2,attackPose:.25,inv:.4}
  ])for(const face of ['front','back','auto'])drawWarrior(ctx,p,150,250,3.1,{face,scale:1.3});
  assert.equal(summary().depth,0);
  assert.ok(summary().commands>4000);
  assert.ok(summary().strokes>100);
});
test('Prévia transparente sem espada mantém estado Canvas',()=>{
  const {ctx,summary}=mock();
  drawWarrior(ctx,{vx:0,vy:0,facing:0},500,850,1,
    {scale:4.5,face:'front',shadow:false,lighting:false,equipment:'unarmed'});
  assert.equal(summary().depth,0);assert.ok(summary().commands>100);
});
