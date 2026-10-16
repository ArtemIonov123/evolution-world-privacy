"""Делает HTML чисто ASCII: вне <script> — HTML-сущности, внутри <script> — \\uXXXX."""
import re, sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
def js_esc(t):
    r = []
    for ch in t:
        o = ord(ch)
        if o < 128: r.append(ch)
        elif o <= 0xFFFF: r.append('\\u%04x' % o)
        else:
            o -= 0x10000; r.append('\\u%04x\\u%04x' % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF)))
    return ''.join(r)
def html_esc(t):
    return ''.join(ch if ord(ch) < 128 else '&#x%x;' % ord(ch) for ch in t)
parts = re.split(r'(<script>.*?</script>)', s, flags=re.S)
res = ''.join(js_esc(p) if p.startswith('<script>') else html_esc(p) for p in parts)
open(out, 'w', encoding='ascii').write(res)
print('non-ascii left:', sum(1 for ch in res if ord(ch) > 127), 'bytes', len(res))
