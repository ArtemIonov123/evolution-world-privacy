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

done = 0
for f in sorted(glob.glob(os.path.join(src_dir, '*.png'))):
    name = os.path.basename(f)[:-4]
    old = glob.glob(os.path.join('sprites', '*', name + '.png'))
    im = key_magenta(Image.open(f))
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
    out, tw, th = fit(art, bw, bh)
    canvas = Image.new('RGBA', (W * F, H * F), (0, 0, 0, 0))
    canvas.alpha_composite(out, (bx + (bw - tw) // 2, by + bh - th))      # по центру, низом к низу места
    os.makedirs(os.path.join(OUT, group), exist_ok=True)
    dst = os.path.join(OUT, group, name + '@2x.png'); canvas.save(dst)
    low = ' (мало деталей: прислан %dx%d, нужно хотя бы %dx%d)' % (art.size + (bw, bh)) if art.size[0] < bw * 0.9 else ''
    print('OK      ', dst, '%dx%d' % canvas.size, 'из', '%dx%d' % im.size + low); done += 1
print('Готово:', done)
