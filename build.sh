#!/bin/bash
# Сборка игры в один файл: ./build.sh  →  game.html (открывается в браузере без интернета и без Telegram)
set -e
cd "$(dirname "$0")"
python3 -I tools/assemble.py src tmp_game.html >/dev/null
python3 -I tools/build2.py sprites tmp_game.html maps/island.json tmp_utf8.html >/dev/null
python3 -I tools/asciify.py tmp_utf8.html tmp_ascii.html >/dev/null
# локальная база в браузере + адаптер → работают админка и редактор (без интернета)
python3 -I -c "
s=open('tmp_ascii.html').read(); a=open('tools/fake_rtdb.js',encoding='utf-8').read()+'\n'+open('tools/local_adapter.js',encoding='utf-8').read(); i=s.index('<script>')
open('game.html','w',encoding='utf-8').write(s[:i]+'<script>'+a+'</script>'+s[i:])"
rm -f tmp_game.html tmp_utf8.html tmp_ascii.html
python3 -I -c "
import re;s=open('game.html').read();m=re.findall(r'<script>(.*?)</script>',s,re.S);open('/tmp/_chk.js','w').write(max(m,key=len))"
node --check /tmp/_chk.js
echo "OK: game.html $(wc -c < game.html) bytes"
