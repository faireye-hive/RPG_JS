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


### Walking.fbx — caminhada Mixamo integrada

O arquivo `Walking.fbx` fornecido pelo usuário é um FBX ASCII 7700 contendo a animação Mixamo `mixamo.com`: 65 ossos, 315 curvas de animação, 30 quadros (30 FPS) e duração original de 0,967 s. Foi convertido e incorporado diretamente à versão GLB sem texturas de cada personagem. Cada GLB exportado possui **1 animação Walking em ciclo de 1 segundo**, 53 canais ativos (52 rotações de ossos + translação vertical do quadril), sem deslocamento horizontal da raiz e sem imagem de textura. O arquivo enviado do usuário e os novos GLB não são redistribuídos no repositório.

O laboratório de FBX/GLB utiliza `GLTFLoader.parse(...)` para recuperar também `asset.animations`, escolhe o clipe Walking e reproduz com `THREE.AnimationMixer` e `LoopRepeat` no botão **Caminhar (Mixamo)**. Modelos sem animações embutidas continuam usando a pose experimental anterior. Há controle de velocidade da animação (0,25× a 2×), pausa, zoom e esqueleto. A animação é importada diretamente do FBX do usuário, sem subir o arquivo ao site.


### Publicar os GLB no GitHub Pages

O usuário autorizou hospedar os modelos no repositório. Coloque **os dois arquivos binários de caminhada** em `public/models/`, usando exatamente os nomes `Maria_caminhando_sem_texturas.glb` e `Kachujin_caminhando_sem_texturas.glb`. O Vite copia automaticamente `public/models/` para `dist/models/`. Em publicação direta da branch (sem Vite), os arquivos ficam no caminho `public/models/`. O laboratório `mixamo-reference-studio.html` procura os dois caminhos, valida o cabeçalho GLB e inicia os modelos automaticamente; também exibe botões de recarga e mantém o carregamento local como alternativa.

**Importante:** não comitar um arquivo de texto renomeado para `.glb` nem um ponteiro LFS sem configurar a distribuição. Os arquivos precisam estar no Git e ser acessíveis por HTTP como bytes GLB genuínos. São pequenos (cerca de 2,35 MB e 1,46 MB), muito abaixo do limite normal de 100 MB por arquivo do GitHub. A biblioteca contém animações Mixamo e não precisa de texturas.


## Editor de Animações do Modelo C

Abra warrior-animation-studio.html para editar diretamente o Modelo C procedural (nenhum FBX, GLB ou textura externa). Clique nos pontos verdes do esqueleto ou selecione uma junta na lista. Use o gizmo tridimensional para girar ou os controles X/Y/Z em graus. Marque poses em diferentes tempos usando o botão Salvar pose ou a autogravação. A linha do tempo interpola os quadros e reproduz os clipes em loop, quando marcado. Comece com quatro exemplos editáveis: Parado, Caminhar, Acenar e Ataque. Crie, duplique, renomeie, espelhe poses, copie e cole poses e ajuste a duração. O projeto fica salvo automaticamente no localStorage do navegador e pode ser restaurado com Importar JSON. O botão EXPORTAR ANIMAÇÕES JSON produz um arquivo contendo todos os clipes e os quadros; envie esse arquivo no chat para eu analisar e continuar desenvolvendo as animações. O esquema é cronicas-do-eter/warrior-c-animation-project, versão 1, model C. Cada pose é um objeto {nomeDoOsso:[x,y,z]}, onde x/y/z são rotações Euler XYZ em graus, relativas à pose-base da geometria C. É um editor independente: não ativa essas animações no jogo até decidirmos integrá-las.
