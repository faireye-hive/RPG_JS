#!/usr/bin/env node
/** Produce actual 3D export files from procedural WarriorRefinedModel. */
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {buildWarriorCTposeOBJ} from '../src/studio/WarriorCTposeExport.js';

const dir=resolve('public/models');
mkdirSync(dir,{recursive:true});
const exported=buildWarriorCTposeOBJ();
if(exported.stats.faces<1000||exported.stats.vertices<1000)
  throw Error('OBJ export is unexpectedly small');
const obj=join(dir,'guerreiro-c-tpose.obj');
const mtl=join(dir,'guerreiro-c-tpose.mtl');
const info=join(dir,'guerreiro-c-tpose-LEIA-ME.txt');
const statsFile=join(dir,'guerreiro-c-tpose-stats.json');
const zip=join(dir,'guerreiro-c-tpose.zip');
writeFileSync(obj,exported.obj);
writeFileSync(mtl,exported.mtl);
writeFileSync(statsFile,JSON.stringify(exported.stats,null,2)+'\n');
writeFileSync(info,[
 'CRONICAS DO ETER — MODELO C EM T-POSE (OBJ)',
 '',
 'Modelo gerado diretamente de WarriorRefinedModel.js.',
 'Formato: OBJ com MTL cinza fosco, sem texturas.',
 'Altura: 180 unidades (centimetros). Eixo vertical: +Y. Frente: +Z.',
 'A animacao de parado enviada em JSON foi mantida separada.',
 'Este OBJ possui varias superficies nao soldadas; o Mixamo pode precisar',
 'de refinamentos na topologia antes de conseguir gerar um rig valido.',
 '',
 'Como usar: envie este ZIP ou OBJ em Upload Character no Mixamo.',
 'Marque punhos, cotovelos, joelhos e virilha.',
 ''
].join('\n'));
const py='import os,sys,zipfile\n'+
 'd=sys.argv[1]\n'+
 'names=["guerreiro-c-tpose.obj","guerreiro-c-tpose.mtl","guerreiro-c-tpose-LEIA-ME.txt"]\n'+
 'with zipfile.ZipFile(os.path.join(d,"guerreiro-c-tpose.zip"),"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:\n'+
 '    for name in names:z.write(os.path.join(d,name),arcname=name)\n'+
 'with zipfile.ZipFile(os.path.join(d,"guerreiro-c-tpose.zip")) as z:\n'+
 '    assert all(z.getinfo(name).file_size>20 for name in names)\n';
execFileSync('python3',['-c',py,dir]);
console.log(JSON.stringify({objKB:Math.round(statSync(obj).size/1024),
 zipKB:Math.round(statSync(zip).size/1024),stats:exported.stats},null,2));
