# Вставка картинок от GPT в игру в двойном качестве (@2x).
#   python3 -I tools/import_art.py <папка с распакованными png> [--size 64x48] [--out sprites]
#
# Для каждого файла name.png ищет старую картинку sprites/<группа>/name.png и делает sprites/<группа>/name@2x.png:
#  - убирает фон: сплошной маджента #FF00FF (если картинка без прозрачности);
#  - вырезает рисунок по краям и вписывает туда, где рисунок у старой картинки, но в 2 раза крупнее
#    (так новый блок/герой встаёт ровно на место старого, ничего в коде не двигается);
#  - уменьшает качественно (LANCZOS с учётом прозрачности), а не NEAREST — так не появляется «шум»;
#  - края делает чёткими (прозрачность 0 или 100%), как в пиксель-арте.
# Для новых имён, которых ещё нет в игре, нужен --size ШИРИНАxВЫСОТА (логический размер, например 64x48)
# и группа: --group props. Картинку тогда вписываем целиком, ногами по центру низа.
# Лучше всего присылать от GPT ОРИГИНАЛЫ (крупные, без уменьшения): тогда деталей хватит на @2x.
import glob, os, sys
from PIL import Image

args = sys.argv[1:]
def opt(name, default=None):
    if name in args:
        i = args.index(name); v = args[i + 1]; del args[i:i + 2]; return v
    return default
SIZE = opt('--size'); GROUP = opt('--group'); OUT = opt('--out', 'sprites')
src_dir = args[0]
F = 2  # во сколько раз детальнее

def key_magenta(im):
    im = im.convert('RGBA'); px = im.load(); w, h = im.size
    if any(px[x, y][3] < 250 for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]):
        return im                                     # уже с прозрачностью
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 150 and b > 150 and g < 110 and abs(r - b) < 90:     # маджента и её оттенки по краям
                px[x, y] = (0, 0, 0, 0)
    return im

def bbox(im):
    return im.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()

def fit(src, box_w, box_h):
    """src (уже обрезан) → ровно box_w×box_h; если пропорции сильно разные — вписать, не растягивая."""
    sw, sh = src.size
    if abs((sw / sh) / (box_w / box_h) - 1) < 0.08:
        tw, th = box_w, box_h
    else:
        k = min(box_w / sw, box_h / sh); tw, th = max(1, round(sw * k)), max(1, round(sh * k))
    out = src.convert('RGBa').resize((tw, th), Image.LANCZOS).convert('RGBA')
    a = out.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
    out.putalpha(a); px = out.load()
    for y in range(th):
        for x in range(tw):
            if px[x, y][3] == 0: px[x, y] = (0, 0, 0, 0)
    return out, tw, th

# --- блоки земли: ромб строго по сетке движка, бока ровно на высоту уровня, без контура на верхней грани ---
# геометрия в @2x: верх ромба (64,4), левый/правый угол y=38, низ ромба y=72, бок 20 px (LH=10 × 2)
BW, TOPV, RH, SIDE = 128, 4, 68, 20
def block_fit(art):
    a = art.convert('RGBa').resize((BW, max(1, round(art.size[1] * BW / art.size[0]))), Image.LANCZOS).convert('RGBA')
    a.putalpha(a.getchannel('A').point(lambda v: 255 if v >= 128 else 0))
    src = a.load(); w, h = a.size
    out = Image.new('RGBA', (BW, 96), (0, 0, 0, 0)); dst = out.load()
    ytop = min((y for x in range(w) for y in range(h) if src[x, y][3]), default=0)
    def first(x): return next((y for y in range(h) if src[x, y][3]), None)
    side_ys = [v for v in (first(x) for x in (0, 1, 2, w - 3, w - 2, w - 1)) if v is not None]
    yl = sum(side_ys) / len(side_ys) if side_ys else ytop + RH / 2        # левый/правый угол ромба в исходнике
    ky = RH / max(1.0, 2 * (yl - ytop))                                  # ромб у GPT бывает чуть площе — растянуть верх до сетки
    for x in range(w):
        col = [y for y in range(h) if src[x, y][3]]
        if not col: continue
        dx = abs(x + 0.5 - 64) / 64
        yf_dst = TOPV + RH / 2 + RH / 2 * (1 - dx)                       # нижний край ромба на сетке
        yf_src = ytop + (yf_dst - TOPV) / ky
        bot = col[-1] + 1; L = max(1.0, bot - yf_src)
        for ty in range(TOPV, min(96, int(round(yf_dst)) + SIDE)):
            if ty < yf_dst: sy = int(ytop + (ty + 0.5 - TOPV) / ky)        # верхняя грань
            else: sy = int(yf_src + (ty + 0.5 - yf_dst) * L / SIDE)         # бок — ровно на высоту уровня
            if 0 <= sy < h and src[x, sy][3]: dst[x, ty] = src[x, sy]
    # убрать тёмный контур по краю верхней грани (на карте из него получалась «сетка»)
    lum = lambda p: p[0] * .3 + p[1] * .59 + p[2] * .11
    for y in range(96):
        for x in range(BW):
            p = dst[x, y]
            if not p[3]: continue
            e = RH / 2 * (1 - abs(x + 0.5 - 64) / 64) - abs(y + 0.5 - (TOPV + RH / 2))   # до края ромба по вертикали
            if -3 < e < 0 and y < TOPV + RH / 2:
                dst[x, y] = (0, 0, 0, 0); continue                 # контур снаружи задних краёв — убрать
            if (0 <= e < 1.5) or (0 <= e < 3.5 and lum(p) < 75):   # самый край — всегда, чуть глубже — если тёмный
                step = 1 if y < TOPV + RH / 2 else -1              # внутрь ромба
                for d in (4, 5, 6, 8):
                    q = dst[x, min(95, max(0, y + step * d))]
                    if q[3] and lum(q) >= 75: dst[x, y] = q; break
    return out

done = 0
# --- кадры одной анимации (hero_ne_0..3): одинаковый масштаб и одна точка опоры (ноги), иначе герой «пульсирует» ---
import re
FILES = sorted(glob.glob(os.path.join(src_dir, '*.png')))
KEYED = {os.path.basename(f)[:-4]: key_magenta(Image.open(f)) for f in FILES}
ANIM = {}
for n, im in KEYED.items():
    base = re.sub(r'_\d+$', '', n)
    if base != n and not n.startswith('block_'): ANIM.setdefault((base, im.size), []).append(n)
ANIM_OF = {}
for (base, size), names in ANIM.items():
    if len(names) < 2: continue
    olds = [glob.glob(os.path.join('sprites', '*', n + '.png')) for n in names]
    if not all(olds): continue
    tmpls = [Image.open(o[0]).convert('RGBA') for o in olds]
    if len({t.size for t in tmpls}) != 1: continue
    sbs = [bbox(KEYED[n]) for n in names]; tbs = [bbox(t) for t in tmpls]
    if not all(sbs) or not all(tbs): continue
    U = (min(b[0] for b in sbs), min(b[1] for b in sbs), max(b[2] for b in sbs), max(b[3] for b in sbs))
    T = (min(b[0] for b in tbs), min(b[1] for b in tbs), max(b[2] for b in tbs), max(b[3] for b in tbs))
    for n in names: ANIM_OF[n] = (U, T, tmpls[0].size, os.path.basename(os.path.dirname(olds[0][0])))

def anim_fit(im, U, T, size):
    W, H = size; uw, uh = U[2] - U[0], U[3] - U[1]
    tx, ty, tw, th = T[0] * F, T[1] * F, (T[2] - T[0]) * F, (T[3] - T[1]) * F
    k = min(tw / uw, th / uh); nw, nh = max(1, round(uw * k)), max(1, round(uh * k))
    a = im.crop(U).convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')
    a.putalpha(a.getchannel('A').point(lambda v: 255 if v >= 128 else 0)); px = a.load()
    for y in range(nh):
        for x in range(nw):
            if px[x, y][3] == 0: px[x, y] = (0, 0, 0, 0)
    c = Image.new('RGBA', (W * F, H * F), (0, 0, 0, 0))
    c.alpha_composite(a, (tx + (tw - nw) // 2, ty + th - nh))        # общий центр и ноги на одной линии
    return c

for f in FILES:
    name = os.path.basename(f)[:-4]
    old = glob.glob(os.path.join('sprites', '*', name + '.png'))
    im = KEYED[name]
    if name in ANIM_OF:
        U, T, size, group = ANIM_OF[name]; canvas = anim_fit(im, U, T, size)
        os.makedirs(os.path.join(OUT, group), exist_ok=True)
        dst = os.path.join(OUT, group, name + '@2x.png'); canvas.save(dst)
        print('OK anim ', dst, '%dx%d' % canvas.size, 'из', '%dx%d' % im.size); done += 1; continue
    sb = bbox(im)
    if not sb: print('ПУСТО   ', name); continue
    art = im.crop(sb)
    if old:
        group = os.path.basename(os.path.dirname(old[0])); tmpl = Image.open(old[0]).convert('RGBA')
        W, H = tmpl.size; tb = bbox(tmpl) or (0, 0, W, H)
        bx, by, bw, bh = tb[0] * F, tb[1] * F, (tb[2] - tb[0]) * F, (tb[3] - tb[1]) * F
    elif SIZE and GROUP:
        group = GROUP; W, H = map(int, SIZE.lower().split('x')); bx, by, bw, bh = 0, 0, W * F, H * F
    else:
        print('НЕТ МЕСТА', name, '— новое имя: укажи --size 64x48 --group props'); continue
    if name.startswith('block_') and (W, H) == (64, 48):
        canvas = block_fit(art)
    else:
        out, tw, th = fit(art, bw, bh)
        canvas = Image.new('RGBA', (W * F, H * F), (0, 0, 0, 0))
        canvas.alpha_composite(out, (bx + (bw - tw) // 2, by + bh - th))      # по центру, низом к низу места
    os.makedirs(os.path.join(OUT, group), exist_ok=True)
    dst = os.path.join(OUT, group, name + '@2x.png'); canvas.save(dst)
    low = ' (мало деталей: прислан %dx%d, нужно хотя бы %dx%d)' % (art.size + (bw, bh)) if art.size[0] < bw * 0.9 else ''
    print('OK      ', dst, '%dx%d' % canvas.size, 'из', '%dx%d' % im.size + low); done += 1
print('Готово:', done)
