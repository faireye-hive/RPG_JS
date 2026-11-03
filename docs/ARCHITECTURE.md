# Crônicas do Éter — planejamento técnico

## Objetivo

A mesma base deve sustentar um roguelite de sobrevivência e, futuramente, um RPG de exploração, missões, NPCs e equipamentos. Separar os **dados** (o que uma arma faz), **sistemas** (regras), **mundo** (geração), **artes** (formas Canvas) e **interface** (DOM). O Vite é usado somente para desenvolvimento e build.

```text
RPG_JS/
├── .github/workflows/
│   ├── ci.yml               # testes e build de pull requests
│   └── pages.yml            # deploy na main
├── index.html               # Canvas e menus
├── src/
│   ├── main.js              # bootstrap
│   ├── styles.css           # tema responsivo
│   ├── audio/Audio.js       # efeitos Web Audio
│   ├── core/
│   │   ├── Input.js         # teclado e joystick de toque
│   │   └── math.js          # funções puras, hash, ruído
│   ├── data/
│   │   ├── classes.js       # classes e atributos iniciais
│   │   ├── enemies.js       # catálogo de inimigos
│   │   ├── weapons.js       # catálogo de armas
│   │   └── upgrades.js      # catálogo de atributos evolutivos
│   ├── engine/Game.js       # estado, loop e transições
│   ├── render/
│   │   ├── Art.js           # personagens, inimigos, itens, efeitos
│   │   └── Renderer.js      # câmera, camada e ordem por Y
│   ├── storage/Profile.js   # perfil/recordes versionados
│   ├── systems/
│   │   ├── Combat.js        # ataques, projéteis e impactos
│   │   ├── Enemies.js       # ondas e IA de perseguição
│   │   └── Progression.js   # XP, loot e escolhas
│   ├── ui/Interface.js      # HUD e menus
│   └── world/World.js       # biomas e cenário procedural
└── tests/world.test.js      # testes de lógica sem browser
```

## Mundo

`World.tileAt(x,y)` calcula a célula a partir de uma **seed** e coordenadas globais. Não salvamos arrays infinitos de tiles. `World.draw` limita renderização ao viewport. Bosque, prados, santuário, ruínas e corrupção usam ruído suave e distância ao centro. Árvores, cristais, pedras, flores e ruínas são vetores desenhados por código. **Objetos decorativos não bloqueiam movimento** nesta primeira versão, para evitar problemas de navegação até termos sistema de colisões.

Para mapas complexos, ampliar com `world/chunks/`: 12×12 tiles por chunk, cache LRU, transições biome e modificações persistentes por coordenadas. Todo novo gerador deve aceitar seed, ser determinístico e ter custo limitado.

## Loop

`Game.frame` fornece `dt` limitado a 50 ms e chama update e render. `Game.step` atualiza input, inimigos, combate, progressão, efeitos e HUD. `Renderer` não modifica a simulação. HUD DOM atualiza no máximo ~9 vezes/segundo. O jogo pausa quando a aba fica oculta, em upgrades e manualmente.

## Expansão por modos

Ao criar o segundo modo, extrair as regras específicas de `engine/Game.js` para `modes/survivors/SurvivorsMode.js`. Criar `modes/adventure/AdventureMode.js` com a mesma interface (start/update/render/save). Input, arte, biomas, catálogo de itens e perfil são compartilhados. Uma classe não deve importar menus DOM para tomar decisões de jogo; comunicação ocorre por eventos/estado.

## Contratos futuros

- **`entities/`**: factories e componentes para personagens complexos.
- **`ai/`**: máquinas de estado e comportamento de chefes.
- **`physics/`**: spatial hash para golpes/colisões em centenas de inimigos.
- **`render/generators/`**: artes procedurais parametrizadas, paletas e animações.
- **`editor/`**: editor visual com exportação de presets JSON para arte, mapas, efeitos e inimigos.
- **`save/`**: campanhas persistidas com schemaVersion, migrações e saves separados por modo.

## Persistência e desempenho

A chave `cronicas_eter_profile_v1` registra **apenas recordes**; partidas em andamento não são retomáveis. Evitar incluir Canvas, Sets de projéteis ou objetos cíclicos em JSON. Metas futuras: >=30 FPS mobile e 60 FPS desktop, desenho em chunks pré-renderizados e consultas espaciais em vez de iterar sobre todos os inimigos.

## Validação

`npm test` testa determinismo e evolução, `npm run build` testa bundle. Testar manualmente Android/desktop, HUD, joystick, pausa, cartas de upgrade, chefes, encerramento, troca de classe, visibilidade da aba e 8 minutos de jogo.

## Direção visual

Fantasia noturna verde-petróleo, dourado, azul rúnico. Toda arte é gerada por comandos Canvas e isolada com `ctx.save/restore`. Sem bibliotecas gráficas ou spritesheets externos.

## Guerreiro procedural de alta definição

A arte detalhada e o rig animado do Guerreiro (id interno `guardian`) ficam isolados em `src/render/characters/Warrior.js`, e são chamados por `drawPlayer` sem afetar a Arcanista e o Andarilho. O renderizador usa curvas quadráticas/cúbicas, metal com gradientes por faceta, escudo e espada com runas, rosto individualizado, capas com dobras e braços articulados. `attackPose` é acionado em `Combat.js` e decai no `Game.step`; não muda dano, alcance nem regras de colisão. Há uma página independente `warrior-studio.html` para ampliar, girar, animar e exportar PNG com alpha diretamente do desenho por código.

Ao criar novos personagens, implemente `drawCharacter(ctx, actor, x, y, time, options)` em `src/render/characters/`, com âncora no solo em `(x,y)`, estado isolado com `save/restore` e sem imagens externas. Para performance, mantenha alto detalhe somente em personagens heróicos e utilize versões com LOD simplificado para exércitos.


## Sistema atual: Guerreiro 3D procedural em mundo 2D

O herói `guardian` usa um modelo 3D próprio, sem GLB ou texturas. A geometria é gerada em `src/render/three/WarriorModel.js` por lofts, elipsoides, placas extrudadas e curvas; o corpo é esguio e a armadura é uma camada opcional, nunca uma geometria gigante. `WarriorModel.nodes` expõe a hierarquia nomeada de articulações. O sistema `update(actor,time,dt)` anima caminhada, joelhos, balanço dos braços, cabeça, capa deformável, direção de 360° e ataque.

`WarriorStage.js` cria iluminação com materiais toon e câmera ortográfica. Durante o jogo, `WarriorSpriteRenderer.js` renderiza somente um pequeno retrato WebGL RGBA por frame e `Renderer.js` compõe o resultado no mesmo Canvas 2D, na ordem por Y dos inimigos, mantendo a simulação intocada. A dependência `three` é compilada no Vite e carregada sob demanda; ao faltar WebGL ou o pacote, a arte vetorial anterior permanece como fallback.

No ateliê `warrior-studio.html`, o 3D é renderizado em um Canvas WebGL transparente acima do cenário 2D. O usuário pode arrastar para girar, escolher 8 direções, animações, equipamentos, nível de armadura e exportar PNG com transparência. Para desempenho mobile, nunca instanciar um contexto WebGL por inimigo; utilizar um renderer/actor e resolução reduzida. Para vários heróis, considerar atlas de poses, instâncias e cache por combinação de equipamento.


## Laboratório: novo Guerreiro B, somente modelagem

O código do Modelo A em `WarriorModel.js` fica intacto. O **Modelo B não é retexturização do A**: `WarriorSculptModel.js` constrói um personagem separado com geometria de lofts anatômicos, curvas em volume, nariz com perfil, cabelo comprido em mechas, tecido em dobras e mãos com dedos. A estrutura hierárquica animável é independente, com nomes de articulação, `update()`, `getHierarchy()` e `dispose()`. Um único material `MeshStandardMaterial` cinza fosco, sem mapas de textura, cobre toda a modelagem do B.

`warrior-compare.html` usa um único WebGL renderer para A e B, com câmera e iluminação iguais, e substitui apenas os materiais de A por cinza fosco para uma comparação visual imparcial. Permite vista lado a lado e individual, orientação por arraste, malha em wireframe, marcadores de juntas e exportação OBJ (apenas geometria) para Blender. O renderer no jogo segue exibindo A até haver escolha explícita do personagem preferido.


### Variante C — escultura anatômica do B

`src/render/three/WarriorRefinedModel.js` estende `WarriorSculptModel` e descarta/reconstrói apenas partes rígidas do B. Mantém rosto, cabelo e tecido do B; modela deltóides volumétricos com lofts irregulares, pivôs da clavícula, articulações de cotovelo e antebraço, dois níveis cervicais, palmas e falanges proximal/distal de todos os dedos e polegares. As peças permanecem em 1 material neutro. `update()` aplica movimento de ombros/cotovelos, torção dos punhos, flexão dos dedos e olhar/rotação cervical. `actor.demoGesture` (0 a 1) permite demonstrar o gesto de acenar exclusivamente no laboratório, sem mudar o combate. As juntas têm sobreposições geométricas: **não é skinning contínuo**; uma etapa futura poderia usar blend skinning para remover costuras extremas em ângulos grandes.
