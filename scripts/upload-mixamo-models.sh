#!/usr/bin/env bash
# Envia os dois GLB com animação Walking para o GitHub Pages.
# Execução: bash scripts/upload-mixamo-models.sh ~/Downloads/Modelos_Mixamo_Caminhando.zip
# Alternativa: bash scripts/upload-mixamo-models.sh /caminho/Maria_caminhando_sem_texturas.glb /caminho/Kachujin_caminhando_sem_texturas.glb
set -euo pipefail
repo="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo" || ! -d "$repo/.git" ]]; then
  echo 'ERRO: execute dentro do clone Git do projeto RPG_JS.' >&2; exit 1
fi
cd "$repo"
branch="$(git branch --show-current)"
if [[ "$branch" != 'main' ]]; then
  echo "ERRO: branch atual é '$branch'. Execute git switch main antes." >&2; exit 1
fi
if [[ $# != 1 && $# != 2 ]]; then
  echo 'Uso: bash scripts/upload-mixamo-models.sh Modelos_Mixamo_Caminhando.zip' >&2
  echo '  ou: bash scripts/upload-mixamo-models.sh Maria_caminhando_sem_texturas.glb Kachujin_caminhando_sem_texturas.glb' >&2
  exit 1
fi
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT
names=(Maria_caminhando_sem_texturas.glb Kachujin_caminhando_sem_texturas.glb)
if [[ $# == 1 ]]; then
  command -v unzip >/dev/null || { echo 'Instale o unzip para extrair o pacote.' >&2; exit 1; }
  for name in "${names[@]}"; do
    unzip -p "$1" "$name" > "$tmpdir/$name" || { echo "Não encontrou $name dentro do ZIP" >&2; exit 1; }
  done
else
  cp -- "$1" "$tmpdir/${names[0]}"
  cp -- "$2" "$tmpdir/${names[1]}"
fi
mkdir -p public/models
for name in "${names[@]}"; do
  file="$tmpdir/$name"
  if [[ "$(head -c 4 "$file")" != 'glTF' ]]; then
    echo "ERRO: $name não é um GLB binário válido." >&2; exit 1
  fi
  bytes="$(stat -c%s "$file")"
  if (( bytes < 100 || bytes > 100000000 )); then
    echo "ERRO: tamanho inválido de $name ($bytes bytes)." >&2; exit 1
  fi
  cp -- "$file" "public/models/$name"
  printf '✓ %s (%s bytes)\n' "$name" "$bytes"
done
git add -- public/models/Maria_caminhando_sem_texturas.glb public/models/Kachujin_caminhando_sem_texturas.glb
if git diff --cached --quiet -- public/models/Maria_caminhando_sem_texturas.glb public/models/Kachujin_caminhando_sem_texturas.glb; then
  echo 'Os dois modelos já estão no Git, sem alterações.'
  exit 0
fi
git commit -m "assets: add Maria and Kachujin Mixamo Walking GLBs" -- public/models/Maria_caminhando_sem_texturas.glb public/models/Kachujin_caminhando_sem_texturas.glb
git push origin main
echo 'Modelos enviados! Confira o GitHub Actions e abra o laboratório Mixamo.'
