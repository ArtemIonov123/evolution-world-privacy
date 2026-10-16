# Собирает src/index.html (+ все @@include) в один game.html.
# Использование: python3 -I assemble.py src game.html
import os, sys
src, out = sys.argv[1], sys.argv[2]
res = []
for line in open(os.path.join(src, 'index.html'), encoding='utf-8').read().split('\n'):
    if line.startswith('@@include '):
        part = open(os.path.join(src, line[10:].strip()), encoding='utf-8').read()
        if part.endswith('\n'): part = part[:-1]
        res.append(part)
    else:
        res.append(line)
open(out, 'w', encoding='utf-8').write('\n'.join(res))
print(out, sum(len(x) + 1 for x in res) - 1, 'chars')
