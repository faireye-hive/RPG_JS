/**
 * Shared WebGL portrait/studio stage. One renderer per view, one procedural
 * character model, independent of the Canvas 2D game renderer.
 * No DOM/ WebGL context is created at module import time.
 */
import * as THREE from 'three';
import { WarriorModel } from './WarriorModel.js';

export class WarriorStage {
  constructor({canvas=null,width=192,height=232,studio=false}={}){
    this.studio=studio;
    this.canvas=canvas||document.createElement('canvas');
    this.renderer=new THREE.WebGLRenderer({
      canvas:this.canvas,alpha:true,antialias:true,premultipliedAlpha:false,
      preserveDrawingBuffer:true,powerPreference:'low-power'
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.NoToneMapping;
    this.renderer.shadowMap.enabled=false;
    this.scene=new THREE.Scene();
    const hemi=new THREE.HemisphereLight(0xe4f8f0,0x384457,2.05);
    this.scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffe9c8,2.4);
    key.position.set(-3,7,6);this.scene.add(key);
    const bounce=new THREE.DirectionalLight(0x9acac8,.75);
    bounce.position.set(4,3,-3);this.scene.add(bounce);
    this.model=new WarriorModel();
    this.scene.add(this.model.root);
    this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,60);
    this.camera.position.set(0,3.45,7.7);
    this.camera.lookAt(0,1.27,0);
    this.zoom=1;this.lastFrame=0;this.disposed=false;
    this.resize(width,height);
  }
  resize(width,height){
    if(this.disposed)return;
    this.width=Math.max(1,Math.floor(width));
    this.height=Math.max(1,Math.floor(height));
    this.renderer.setSize(this.width,this.height,false);
    this.reframe();
  }
  reframe(){
    const h=(this.studio?3.48:3.15)/Math.max(.45,this.zoom);
    const w=h*this.width/this.height;
    this.camera.left=-w/2;this.camera.right=w/2;
    this.camera.top=h/2;this.camera.bottom=-h/2;
    this.camera.updateProjectionMatrix();
  }
  setZoom(zoom){this.zoom=Math.max(.5,Math.min(2.4,zoom));this.reframe();}
  setArmor(mode){this.model.setArmor(mode);}
  setEquipment(options){this.model.setEquipment(options);}
  render(actor={},seconds=0,dt=1/60,options={}){
    if(this.disposed)return;
    this.model.update(actor,seconds,dt,options);
    this.renderer.render(this.scene,this.camera);
    this.lastFrame++;
  }
  /** Atlas-like compositing: 3D model is painted in exact 2D actor order. */
  paint(ctx,actor,x,y,seconds,dt){
    this.render(actor,seconds,dt);
    // Foot anchor y is near the bottom of the portrait, while allowing capes.
    const size=actor?.spriteScale??1;
    const width=126*size,height=146*size;
    ctx.drawImage(this.canvas,x-width/2,y-height*.91,width,height);
  }
  exportPNG({faceYaw=0,width=1100,height=1100,actor={},seconds=0}={}){
    const oldWidth=this.width,oldHeight=this.height,oldZoom=this.zoom;
    this.resize(width,height);this.setZoom(1);
    this.render(actor,seconds,0,{yaw:faceYaw,instant:true});
    const url=this.canvas.toDataURL('image/png');
    this.resize(oldWidth,oldHeight);this.setZoom(oldZoom);
    return url;
  }
  dispose(){
    if(this.disposed)return;
    this.model.dispose();this.scene.clear();
    this.renderer.dispose();this.renderer.forceContextLoss();
    this.disposed=true;
  }
}
