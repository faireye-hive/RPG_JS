#!/usr/bin/env python3
"""
Generate a single watertight, voxel-unioned alternative to Model C's original
127-piece OBJ (for experimentation with Mixamo automatic rigging).

Requires: pip install numpy scipy scikit-image trimesh
The true procedural OBJ is still provided alongside this remeshed version.
"""
from __future__ import annotations
from pathlib import Path
import json
import zipfile

import numpy as np
import trimesh
from scipy import ndimage as ndi
from skimage import measure

ROOT=Path(__file__).resolve().parents[1] / "public" / "models"
SOURCE=ROOT / "guerreiro-c-tpose.obj"
PITCH=1.2

def main():
    raw=trimesh.load(SOURCE, force="mesh", process=False)
    if len(raw.faces)<1000:
        raise ValueError("Invalid source OBJ, too few triangles")
    # 1.2 cm voxel surface, filled solids, close tiny cracks from the many
    # procedural shells. This does change fine details; keep the raw OBJ too.
    voxel=raw.voxelized(PITCH, method="subdivide").fill()
    occupied=np.asarray(voxel.matrix,dtype=bool)
    occupied=ndi.binary_closing(
        occupied,structure=ndi.generate_binary_structure(3,1),iterations=1)
    if not np.any(occupied):
        raise ValueError("Voxel merge is empty")
    filled=np.pad(occupied.astype(np.uint8), 2)
    vertices, faces, _, _=measure.marching_cubes(filled, level=0.5)
    vertices=trimesh.transformations.transform_points(vertices-2,voxel.transform)
    mesh=trimesh.Trimesh(vertices=vertices,faces=faces,process=True)
    trimesh.smoothing.filter_laplacian(
        mesh,lamb=0.25,iterations=2,volume_constraint=False)
    # Keep the primary connected humanoid, not small floating decorative bits.
    parts=mesh.split(only_watertight=False)
    body=max(parts,key=lambda x:len(x.faces))
    if len(body.faces)<5000 or not body.is_watertight:
        raise ValueError("Failed to generate connected watertight humanoid")
    mins,maxs=body.bounds
    height=maxs[1]-mins[1]
    scale=180/height
    center=np.array([(mins[0]+maxs[0])/2,mins[1],(mins[2]+maxs[2])/2])
    body.vertices=(body.vertices-center)*scale
    if body.volume<0:
        body.invert()
    assert body.is_watertight
    obj=ROOT/"guerreiro-c-tpose-unificado.obj"
    material=ROOT/"guerreiro-c-tpose-unificado.mtl"
    info=ROOT/"guerreiro-c-tpose-unificado-LEIA-ME.txt"
    stats_file=ROOT/"guerreiro-c-tpose-unificado-stats.json"
    bundle=ROOT/"guerreiro-c-tpose-unificado.zip"
    content=(
        "mtllib guerreiro-c-tpose-unificado.mtl\n"
        "o Guerreiro_C_TPose_Unificado\n"
        "usemtl argila_c\n"
        +body.export(file_type="obj",include_normals=False,include_color=False)
    )
    obj.write_text(content,encoding="utf-8")
    material.write_text(
        "newmtl argila_c\nKa 0.2 0.2 0.2\nKd 0.78 0.78 0.77\n"
        "Ks 0.01 0.01 0.01\nNs 1\nd 1\nillum 2\n",encoding="utf-8")
    info.write_text(
        "MODELO C PROCEDURAL - T-POSE UNIFICADO\n\n"
        "Malha recomposta por voxelizacao da escultura original do modelo C.\n"
        "Tem menos detalhes finos do que o OBJ original, mas uma unica\n"
        "superficie fechada, sem fragmentos soltos. Nao possui esqueleto.\n"
        "O autorig do Mixamo ainda precisa ser testado.\n"
        "Escala 180cm, vertical +Y, frente +Z.\n",encoding="utf-8")
    stats={
      "original":"WarriorRefinedModel.js","pose":"T","voxel_pitch_cm":PITCH,
      "vertices":len(body.vertices),"faces":len(body.faces),
      "connected_components":len(body.split()),
      "watertight":bool(body.is_watertight),
      "height_cm":float(np.ptp(body.bounds[:,1])),
      "bounds_cm":body.bounds.tolist()
    }
    stats_file.write_text(json.dumps(stats,indent=2)+"\n",encoding="utf-8")
    with zipfile.ZipFile(bundle,"w",zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for path in [obj,material,info]:
            z.write(path,path.name)
    print(json.dumps(stats,indent=2))

if __name__=="__main__":
    main()
