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
