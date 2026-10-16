#!/usr/bin/env bash
# Сборка игры «Isle of Legends» из модулей ../game (см. ../game/README.md).
#   claude.html     — версия для claude.ai (артефакт)
#   out/index.html  — версия для GitHub Pages / Telegram (Firebase) + version.json + manifest.webmanifest
set -e
cd "$(dirname "$0")"
[ -d node_modules/firebase ] || npm i --no-save --silent firebase@10.12.2
python3 -I assemble.py ../game game.html
python3 -I build2.py ../sprites game.html m42h.json tmp_utf8.html
python3 -I asciify.py tmp_utf8.html claude.html
mkdir -p out
python3 -I build_web.py claude.html out node_modules/firebase
python3 -I asciify.py out/web_utf.html out/index.html
rm -f out/web_utf.html tmp_utf8.html game.html
echo "Готово: claude.html и out/ (скопируй out/* в папку island/ репозитория)"
