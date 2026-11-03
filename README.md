# ✧ Crônicas do Éter — Sobreviventes

RPG para navegador com primeiro modo estilo **survivors**: hordas crescentes, ataques automáticos, experiência, melhorias e vitória aos oito minutos. Três classes: **Guerreiro**, **Arcanista** e **Andarilho**.

**O mundo, inimigos e efeitos são desenhados em Canvas 2D.** O Guerreiro é um **modelo 3D procedural com animação hierárquica**, renderizado por Three.js em câmera ortográfica e composto na ordem por Y da cena 2D. Não há arquivos externos de personagens, spritesheets ou modelos pré-fabricados. Three.js é uma dependência JavaScript instalada pelo npm, empacotada localmente pelo Vite. Se WebGL falhar, o motor exibe o Guerreiro vetorial antigo.

Abra o [Ateliê 3D](warrior-studio.html) para girar o personagem em 360°, testar caminhada e ataque, trocar entre roupa e armadura leve e exportar PNG com fundo transparente.

## Instalação

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra http://localhost:3000 . Para validar e empacotar:

```bash
npm test
npm run build
npm run preview
```

## Jogabilidade

- **WASD/setas** para mover; ataques são automáticos.
- **Celular**: toque e arraste sobre o cenário para mover o joystick virtual.
- **ESC/P** pausa ou continua.
- **Cristais azuis** concedem experiência; ao subir de nível escolha um de três upgrades.
- **Objetivo**: sobreviver 8 minutos. Dois chefes aparecem durante a partida.
- **Recordes** ficam salvos no navegador via localStorage.
- O mundo é determinístico, com biomas como santuário, pradaria, bosque, ruínas e terras corrompidas.

## Estrutura

Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). O motor, mundo, arte, dados e sistemas são módulos separados; é possível incluir novos modos RPG sem misturar tudo em um arquivo.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` gera e publica `dist/` quando mudanças chegam à `main`. Em **Settings → Pages → Build and deployment** selecione **GitHub Actions**. O Vite usa caminhos relativos.

## Hierarquia e proporções do Guerreiro

- Fonte 3D: `src/render/three/WarriorModel.js` — hierarquia nomeada (quadril, coluna, cabeça, ombros, cotovelos, mãos, quadris, joelhos e pés), geometria procedural, roupas e armadura leve.
- `src/render/three/WarriorStage.js`: câmera ortográfica, toon shading, iluminação, renderização com alpha e exportação de PNG.
- `src/render/three/WarriorSpriteRenderer.js`: renderiza o Guerreiro em uma textura WebGL pequena, composta com os inimigos na mesma camada Canvas 2D.
- `src/studio/WarriorStudio.js`: editor de visualização e teste de movimentos, múltiplas direções e arraste para girar.
- `src/render/characters/Warrior.js`: arte vetorial anterior mantida como fallback para navegadores sem WebGL.

## Versão anterior

A versão React/TypeScript e os PNG antigos permanecem no histórico Git e na branch principal até a nova versão ser mesclada. Os arquivos antigos são excluídos na reconstrução, mas não são necessários para este modo.

## Próximas etapas

Criar editor de armas, artes procedurais e biomas; equipamentos/inventário e atributos persistentes; mais chefes, classes e objetivos; segundo modo RPG de exploração e missões. Melhorar a performance de centenas de inimigos com spatial hash e cache de terreno.


## Comparação de personagens — Modelo A × Modelo B

A página [`warrior-compare.html`](warrior-compare.html) mantém o Guerreiro atual (Modelo A) e mostra uma **modelagem procedural completamente independente** (Modelo B). Os dois são vistos simultaneamente com o mesmo material cinza fosco e iluminação, sem texturas ou mapas. É possível inspecionar a silhueta frente, lado, três quartos e costas, caminhar, atacar, mostrar malha de triângulos, exibir articulações, salvar PNG transparente e baixar a geometria do Modelo B em OBJ. O jogo não foi alterado para utilizar o B antes da escolha visual.

- `src/render/three/WarriorSculptModel.js`: escultura orgânica original (superfícies loft de anatomia, cabeça com maxilar, perfil nasal, olhos e lábios esculpidos, cabelo em mechas volumétricas, túnica com dobras em malha e mãos com dedos). Hierarquia independente, sem equipamentos ou armaduras.
- `src/studio/WarriorCompare.js`: uma câmera ortográfica, um contexto WebGL e dois modelos exibidos no mesmo cenário neutro. Não cria um renderer por personagem.
- `tests/warrior-sculpt.test.js`: geometria, limites, materiais sem mapas, juntas e animações verificadas automaticamente.


### Modelo C — anatomia, pescoço e dedos

O **Modelo C** (`src/render/three/WarriorRefinedModel.js`) parte do desenho e da geometria do B, mas substitui seus componentes rígidos: deltoide com superfícies orgânicas assimétricas, clavículas com pivôs próprios, cotovelos que flexionam durante caminhada/ataque/gestos, duas vértebras cervicais articuladas e punhos, palmas e todos os dedos com juntas independentes (incluindo o polegar). A malha mantém um único material cinza fosco, sem imagens, armadura ou normal maps. No comparador `warrior-compare.html`, escolha **B+C** ou a vista individual C, teste o gesto **Acenar (C)** e ligue **Mostrar articulações**. O jogo não muda até escolhermos o modelo vencedor.

**Refinamento do cotovelo C:** entre braço e antebraço há uma malha `SkinnedMesh` com pesos suaves entre dois ossos, além de juntas anatômicas. A comparação usa material único cinza, e a seção **Ajustar juntas do Modelo C** oferece controles manuais individuais de pescoço, ombro, cotovelo, punho e dedos. O botão **Baixar Modelo C (.OBJ)** exporta somente a geometria (formato OBJ não preserva o rig animável).

## GitHub Pages: Vite e Three.js

A publicação recomendada é via GitHub Actions, no workflow `.github/workflows/pages.yml`: testes e Vite geram `dist/`, com a biblioteca Three.js embutida. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions** como Source. Se o Pages publicar diretamente a branch `main`, o navegador receberá fontes com `import 'three'` e poderá mostrar o erro `The specifier "three" was a bare specifier`. O sucesso do workflow não garante que a configuração Source use seu artefato.

Como compatibilidade para o modo branch-source, os três HTMLs contêm `<script type="importmap">` resolvendo `three` e `three/addons/` a partir do jsDelivr com versão fixa **0.180.0**. A versão compilada usa o bundle do Vite sem precisar do CDN. A versão que usa os arquivos brutos precisa da internet apenas para carregar a biblioteca, nunca para obter modelos, texturas ou arte pré-fabricada.


## Laboratório Mixamo (malhas rigadas e sem texturas)

O endereço mixamo-reference-studio.html permite abrir localmente os FBX originais ou GLB convertidos. Os arquivos NÃO são enviados ao site: o navegador lê File.arrayBuffer() e cria SkinnedMesh por FBXLoader / GLTFLoader do Three.js. O material visual é substituído por argila cinza (metalness:0, roughness:1), sem texturas.

O laboratório permite vistas frontal, perfil e costas; poses demonstrativas de caminhada e aceno; ajuste por articulação Mixamo (pescoço, ombro, cotovelo, punho e dedos); esqueleto visível, wireframe, zoom e PNG. As animações são experimentais e NÃO vêm dos FBX. Para resultado profissional, adicionar clipes Mixamo retargetados ou poses com keyframes.

Os arquivos enviados em 2026-11-03 eram FBX binários v6100 com deformadores Skin: character.fbx tinha 65 ossos, dois meshes (Maria e espada) e 14.646 triângulos; character2.fbx tinha 75 ossos, um mesh (Kachujin) e 12.610 triângulos depois da triangulação. As versões convertidas para GLB não possuem texturas. O jogo continua com o Modelo A. Os arquivos dos personagens NÃO são redistribuídos no GitHub sem verificar a licença.


### Compatibilidade dos dois arquivos enviados

FBXLoader do Three.js só suporta FBX binário >= 6400; os arquivos character.fbx e character2.fbx são FBX binário 6100 e precisam ser convertidos antes. As versões geradas nesta conversa são character_sem_texturas.glb (65 ossos, 2,3 MB) e character2_sem_texturas.glb (75 ossos, 1,4 MB). Ambas contêm um material cinza neutro e skins Mixamo com pesos normalizados e sem imagens; nenhuma animação pronta estava no arquivo.

O visualizador mostra um erro claro quando alguém tenta selecionar um FBX antigo 6100. FBX moderno 6400+ continua funcionando pelo FBXLoader.
