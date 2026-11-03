# ✧ Crônicas do Éter — Sobreviventes

RPG para navegador com primeiro modo estilo **survivors**: hordas crescentes, ataques automáticos, experiência, melhorias e vitória aos oito minutos. Três classes: **Guardião**, **Arcanista** e **Andarilho**.

**Todo o mundo e toda a arte são gerados em JavaScript/Canvas 2D.** Não há imagens, modelos ou spritesheets externos. Não há dependências de jogo no runtime.

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

## Versão anterior

A versão React/TypeScript e os PNG antigos permanecem no histórico Git e na branch principal até a nova versão ser mesclada. Os arquivos antigos são excluídos na reconstrução, mas não são necessários para este modo.

## Próximas etapas

Criar editor de armas, artes procedurais e biomas; equipamentos/inventário e atributos persistentes; mais chefes, classes e objetivos; segundo modo RPG de exploração e missões. Melhorar a performance de centenas de inimigos com spatial hash e cache de terreno.
