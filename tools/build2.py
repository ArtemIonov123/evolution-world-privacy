import base64, glob, json, os, sys
src, tpl, mp, out = sys.argv[1:5]
# name@2x.png / name@4x.png — та же картинка в 2 или 4 раза детальнее (рисуется в том же размере);
# если есть, заменяет name.png (берём самую детальную)
import re
files = sorted(glob.glob(os.path.join(src, '*', '*.png')))
hd = {}
for f in files:
    m = re.match(r'(.+)@(\d)x$', os.path.basename(f)[:-4])
    if m and int(m.group(2)) > hd.get(m.group(1), (0, ''))[0]: hd[m.group(1)] = (int(m.group(2)), f)
sp = {}
for f in files:
    k = os.path.basename(f)[:-4]
    if '@' in k or k in hd: continue
    sp[k] = 'data:image/png;base64,' + base64.b64encode(open(f,'rb').read()).decode()
for k, (n, f) in hd.items():
    sp[k] = 'data:image/png;base64,' + base64.b64encode(open(f,'rb').read()).decode()
hd = {k: n for k, (n, f) in sorted(hd.items())}
m = json.load(open(mp))
mjs = '{\n  "levels": [\n' + ',\n'.join('    "%s"' % r for r in m['levels']) + '\n  ],\n  "tops": [\n' + ',\n'.join('    "%s"' % r for r in m['tops']) + \
      '\n  ],\n  "stairs": ' + json.dumps(m['stairs']) + ',\n  "props": [\n' + \
      ',\n'.join('    ' + ','.join(json.dumps(p) for p in m['props'][i:i+6]) for i in range(0, len(m['props']), 6)) + \
      '\n  ],\n  "start": ' + json.dumps(m['start']) + ''.join(',\n  "%s": %s' % (k, json.dumps(m[k])) for k in ('hut','npc','merchant','stall','pier','zones') if k in m) + '\n}'
html = open(tpl, encoding='utf-8').read().replace('/*SPRITES*/', json.dumps(sp)).replace('/*SPRITES_HD*/{}', json.dumps(hd)).replace('/*MAP*/', mjs)
open(out, 'w', encoding='utf-8').write(html); print(len(html), 'bytes')
