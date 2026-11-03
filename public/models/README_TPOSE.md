# Guerreiro C em T-Pose para Mixamo

Arquivos gerados automaticamente pelo código original do Modelo C.

- guerreiro-c-tpose.obj — modelo estático em T-pose, 180 cm de altura.
- guerreiro-c-tpose.mtl — argila cinza, sem texturas.
- guerreiro-c-tpose.zip — OBJ + MTL + instruções.
- guerreiro-c-tpose-stats.json — estatísticas de geometria.

Para regenerar após alterar o Guerreiro C:
    npm install
    npm run export:model-c

O OBJ contém uma única entidade OBJ, mas a modelagem procedural ainda tem
superfícies não soldadas. O autorig Mixamo não é garantido.
A animação de parado do editor não é aplicada à T-pose.

Versão para teste de autorig: guerreiro-c-tpose-unificado.obj ou .zip;
o script Python scripts/unify-warrior-c-tpose.py une os volumes por voxelização.
Esse arquivo é uma malha única e fechada, mas perde parte dos detalhes finos.
