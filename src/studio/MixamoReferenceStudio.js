import * as THREE from 'three';
// Loads local FBX or GLB in the browser. Uploaded content never leaves the device.
const $=id=>document.getElementById(id);
const canvas=$('view');
const stage={yaw:0,zoom:1,playing:true,auto:false,time:0,motion:'idle',
  joints:{neck:0,shoulder:0,elbow:0,wrist:0,fingers:0}};
const slots={maria:null,kachujin:null};
let scene,camera,renderer,clay,previous=0,drag=false,startX=0,frame=0;
const norm=name=>name.replace(/^mixamorig[:_]?/i,'');
function init(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff,0x5c7785,2));
  const sun=new THREE.DirectionalLight(0xffeddb,2.8);sun.position.set(-3,6,6);scene.add(sun);
  const rim=new THREE.DirectionalLight(0xcee9ef,.7);rim.position.set(4,2,-4);scene.add(rim);
  clay=new THREE.MeshStandardMaterial({color:0xbebcb6,roughness:1,metalness:0,side:THREE.DoubleSide});
  camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,100);
  camera.position.set(0,3.3,8.5);camera.lookAt(0,1.2,0);
  for(const key of ['maria','kachujin']){
    const input=$('file-'+key);
    input.addEventListener('change',()=>load(key,input.files?.[0]));
    const target=$('drop-'+key);
    target.addEventListener('dragover',e=>{e.preventDefault();target.classList.add('over')});
    target.addEventListener('dragleave',()=>target.classList.remove('over'));
    target.addEventListener('drop',e=>{
      e.preventDefault();target.classList.remove('over');load(key,e.dataTransfer?.files?.[0]);
    });
  }
  document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>{
    stage.motion=b.dataset.motion;
    document.querySelectorAll('[data-motion]').forEach(x=>x.classList.toggle('active',b===x));
  }));
  $('angle').addEventListener('change',e=>{
    const map={front:0,frontRight:Math.PI/4,right:Math.PI/2,
      backRight:3*Math.PI/4,back:Math.PI,backLeft:-3*Math.PI/4,
      left:-Math.PI/2,frontLeft:-Math.PI/4};
    if(map[e.target.value]!==undefined)stage.yaw=map[e.target.value];
  });
  $('zoom').addEventListener('input',e=>{
    stage.zoom=Number(e.target.value);$('zoom-label').textContent=stage.zoom.toFixed(1)+'×';resize();
  });
  $('auto').addEventListener('change',e=>stage.auto=e.target.checked);
  $('wire').addEventListener('change',e=>clay.wireframe=e.target.checked);
  $('bones').addEventListener('change',e=>{
    for(const v of Object.values(slots))if(v?.helper)v.helper.visible=e.target.checked;
  });
  $('pause').addEventListener('click',e=>{
    stage.playing=!stage.playing;e.target.textContent=stage.playing?'Ⅱ Pausar':'▶ Continuar';
  });
  document.querySelectorAll('[data-joint]').forEach(e=>e.addEventListener('input',()=>{
    stage.joints[e.dataset.joint]=Number(e.value);
    $('value-'+e.dataset.joint).textContent=Number(e.value).toFixed(2);
  }));
  $('save').addEventListener('click',()=>{
    renderer.render(scene,camera);
    const a=document.createElement('a');a.href=canvas.toDataURL('image/png');
    a.download='comparacao-mixamo-sem-texturas.png';a.click();
  });
  canvas.addEventListener('pointerdown',e=>{drag=true;startX=e.clientX;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{
    if(!drag)return;stage.yaw+=(e.clientX-startX)*.013;startX=e.clientX;$('angle').value='free';
  });
  canvas.addEventListener('pointerup',()=>drag=false);
  canvas.addEventListener('pointercancel',()=>drag=false);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();stage.zoom=THREE.MathUtils.clamp(stage.zoom+(e.deltaY<0?.1:-.1),.65,1.75);
    $('zoom').value=stage.zoom;$('zoom-label').textContent=stage.zoom.toFixed(1)+'×';resize();
  },{passive:false});
  window.addEventListener('resize',resize);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);for(const k of Object.keys(slots))unload(k);clay.dispose();renderer.dispose()},{once:true});
  resize();requestAnimationFrame(tick);
}
function resize(){
  if(!renderer)return;
  const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(w,h,false);
  const aspect=w/h;
  const sideBySide=!!(slots.maria&&slots.kachujin);
  const height=Math.max(3.3,(sideBySide?4.35:2.2)/aspect)/stage.zoom;
  camera.left=-height*aspect/2;camera.right=height*aspect/2;
  camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
}
function unload(key){
  const s=slots[key];if(!s)return;
  if(s.helper){scene.remove(s.helper);s.helper.geometry.dispose();s.helper.material.dispose()}
  scene.remove(s.root);
  const geos=new Set();
  s.root.traverse(o=>{if(o.geometry)geos.add(o.geometry)});
  geos.forEach(geo=>geo.dispose());
  slots[key]=null;
}
async function decode(file){
  const buf=await file.arrayBuffer();
  if(file.name.toLowerCase().endsWith('.fbx')){
    // Binary FBX 6100 from older Mixamo exports is incompatible with FBXLoader.
    // Fail explicitly rather than showing a generic error or a broken character.
    const sig=new TextDecoder('ascii').decode(new Uint8Array(buf,0,Math.min(18,buf.byteLength)));
    if(sig.startsWith('Kaydara FBX Binary')&&buf.byteLength>=27){
      const version=new DataView(buf).getUint32(23,true);
      if(version<6400)throw Error(
        'FBX '+version+' antigo: o Three.js exige FBX binário 6400+. Use o GLB sem texturas convertido nesta conversa.'
      );
    }
    const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js');
    return new FBXLoader().parse(buf,'');
  }
  if(file.name.toLowerCase().endsWith('.glb')){
    const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
    return (await new Promise((ok,fail)=>new GLTFLoader().parse(buf,'',ok,fail))).scene;
  }
  throw Error('Selecione um arquivo .fbx ou .glb');
}
async function load(key,file){
  if(!file)return;
  const label=$('status-'+key),input=$('file-'+key);
  label.textContent='Carregando '+file.name+'…';
  input.disabled=true;
  try{
    if(file.size>80*1024*1024)throw Error('Arquivo acima de 80 MB');
    const obj=await decode(file);
    // Keep the original Mixamo skinning, but discard painted materials.
    const previousMats=new Set();
    obj.traverse(o=>{
      if(o.isMesh){
        for(const mat of (Array.isArray(o.material)?o.material:[o.material]))if(mat)previousMats.add(mat);
        o.material=clay;
        if(o.isSkinnedMesh)o.frustumCulled=false;
      }
    });
    for(const mat of previousMats)if(mat!==clay)mat.dispose();
    unload(key);
    const box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3());
    if(!size.y||!Number.isFinite(size.y))throw Error('Malha sem dimensões válidas');
    const root=new THREE.Group(),holder=new THREE.Group();
    const scale=2.44/size.y,center=box.getCenter(new THREE.Vector3());
    obj.position.add(new THREE.Vector3(-center.x,-box.min.y,-center.z));
    holder.scale.setScalar(scale);
    holder.add(obj);root.add(holder);scene.add(root);
    const bones=new Map(),rest=new Map(),positions=new Map();
    obj.traverse(o=>{if(o.isBone){
      bones.set(norm(o.name),o);rest.set(o,o.quaternion.clone());positions.set(o,o.position.clone());
    }});
    const helper=new THREE.SkeletonHelper(obj);
    helper.visible=$('bones').checked;helper.material.depthTest=false;
    helper.material.transparent=true;helper.material.opacity=.85;scene.add(helper);
    slots[key]={root,obj,bones,rest,positions,helper};
    const polys=(function(){let n=0;obj.traverse(o=>{if(o.isMesh)n+=
      o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3});return n})();
    label.textContent=file.name;
    $('details-'+key).textContent=bones.size+' ossos • '+Math.round(polys).toLocaleString('pt-BR')+' triângulos';
    $('welcome').hidden=true;
    slots.maria?.root.position.set(slots.kachujin?-1.3:0,0,0);
    slots.kachujin?.root.position.set(slots.maria?1.3:0,0,0);
    resize();
  }catch(e){console.error(e);label.textContent='Erro: '+(e.message||e)}
  finally{input.disabled=false;}
}
function apply(s,t){
  for(const [b,q] of s.rest)b.quaternion.copy(q);
  for(const [b,p] of s.positions)b.position.copy(p);
  const bone=n=>s.bones.get(n);
  const spin=(n,axis,amount)=>{
    const b=bone(n);if(!b)return;
    const v=new THREE.Vector3(axis==='x'?1:0,axis==='y'?1:0,axis==='z'?1:0);
    b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(v,amount));
  };
  const walk=stage.motion==='walk'?1:0,wave=stage.motion==='wave'?1:0,s=Math.sin(t*7.5);
  const j=stage.joints;
  spin('Spine','x',.026*Math.sin(t*1.5)+walk*.04);
  spin('Spine1','z',walk*.025*s);
  spin('LeftUpLeg','x',walk*.4*s);spin('RightUpLeg','x',-walk*.4*s);
  spin('LeftLeg','x',walk*.45*Math.max(0,-s));
  spin('RightLeg','x',walk*.45*Math.max(0,s));
  spin('LeftArm','z',walk*.25*s);
  spin('RightArm','z',-walk*.25*s+wave*.9+j.shoulder*.9);
  spin('RightShoulder','z',wave*.12+j.shoulder*.18);
  spin('RightForeArm','z',-wave*.95-j.elbow*1.12);
  spin('RightHand','x',wave*.2*Math.sin(t*5)+j.wrist*.70);
  spin('Neck','x',j.neck*.48+.025*Math.sin(t));
  spin('Head','y',j.neck*.12+.035*Math.sin(t*.8));
  for(const f of ['Thumb','Index','Middle','Ring','Pinky'])
    for(let i=1;i<=3;i++)spin('RightHand'+f+i,'z',-j.fingers*.45-wave*.10*Math.sin(t*4+i));
  const hips=bone('Hips');
  if(hips)hips.position.y+=walk*.012*(1-Math.cos(t*15));
}
function tick(ms){
  const dt=Math.min(.05,Math.max(0,(ms-(previous||ms))/1000));previous=ms;
  if(stage.playing){stage.time+=dt;if(stage.auto){stage.yaw+=dt*.6;$('angle').value='free'}}
  for(const s of Object.values(slots)){
    if(!s)continue;
    if(stage.playing)apply(s,stage.time);
    s.root.rotation.y=stage.yaw;
  }
  renderer.render(scene,camera);frame=requestAnimationFrame(tick);
}
try{init()}catch(e){console.error(e);$('welcome').textContent='Erro ao inicializar WebGL: '+(e.message||e)}
