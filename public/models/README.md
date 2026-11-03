# Modelos GLB publicados no GitHub Pages

Esta pasta recebe os **arquivos binários** que foram preparados no chat para o laboratório Mixamo.

Suba estes dois arquivos diretamente para este diretório, usando GitHub → Add file → Upload files:

- `Maria_caminhando_sem_texturas.glb` (aprox. 2,3 MB)
- `Kachujin_caminhando_sem_texturas.glb` (aprox. 1,4 MB)

O Vite copia automaticamente os arquivos daqui para `dist/models/`. No GitHub Pages configurado para publicar a branch sem build, a página tem fallback para `public/models/`.

Não substitua GLBs binários por arquivos de texto ou ponteiros Git LFS sem distribuição configurada.

Após adicionar os dois arquivos na branch main, o laboratório
`mixamo-reference-studio.html` os carrega automaticamente.

Você também pode enviar os dois arquivos com o script Linux do próprio repositório:

```bash
bash scripts/upload-mixamo-models.sh ~/Downloads/Modelos_Mixamo_Caminhando.zip
```

O script confere o cabeçalho GLB, copia os arquivos, cria o commit na main e publica com `git push origin main`, usando sua autenticação Git local. Sem tokens expostos no chat.
