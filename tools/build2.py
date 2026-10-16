import base64, glob, json, os, sys
src, tpl, mp, out = sys.argv[1:5]
sp = {os.path.basename(f)[:-4]: 'data:image/png;base64,' + base64.b64encode(open(f,'rb').read()).decode()
      for f in sorted(glob.glob(os.path.join(src, '*', '*.png')))}
m = json.load(open(mp))
mjs = '{\n  "levels": [\n' + ',\n'.join('    "%s"' % r for r in m['levels']) + '\n  ],\n  "tops": [\n' + ',\n'.join('    "%s"' % r for r in m['tops']) + \
      '\n  ],\n  "stairs": ' + json.dumps(m['stairs']) + ',\n  "props": [\n' + \
      ',\n'.join('    ' + ','.join(json.dumps(p) for p in m['props'][i:i+6]) for i in range(0, len(m['props']), 6)) + \
      '\n  ],\n  "start": ' + json.dumps(m['start']) + ''.join(',\n  "%s": %s' % (k, json.dumps(m[k])) for k in ('hut','npc','merchant','stall','pier','zones') if k in m) + '\n}'
html = open(tpl, encoding='utf-8').read().replace('/*SPRITES*/', json.dumps(sp)).replace('/*MAP*/', mjs)
open(out, 'w', encoding='utf-8').write(html); print(len(html), 'bytes')
