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
