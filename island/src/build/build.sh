#!/usr/bin/env bash
# Сборка игры «Wyspa» из исходников.
#   claude.html     — версия для claude.ai (артефакт)
#   out/index.html  — версия для GitHub Pages (Firebase) + version.json + manifest.webmanifest
set -e
cd "$(dirname "$0")"
[ -d node_modules/firebase ] || npm i --no-save --silent firebase@10.12.2
python3 build2.py ../sprites game.html m42h.json tmp_utf8.html
python3 asciify.py tmp_utf8.html claude.html
mkdir -p out
python3 build_web.py claude.html out node_modules/firebase
python3 asciify.py out/web_utf.html out/index.html
rm -f out/web_utf.html tmp_utf8.html
echo "Готово: claude.html и out/ (скопируй out/* в папку island/ репозитория)"
