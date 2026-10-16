# Генератор стартовой карты «Пустошь» (по образцу mockups/style_mockup_1.png).
#   python3 -I tools/gen_wasteland.py maps/wasteland.json
# Карту потом можно править в редакторе игры (✎); этот скрипт — только начальная раскладка.
import json, random, sys

W = D = 26
rnd = random.Random(7)
L = [[2] * W for _ in range(D)]          # высота клетки
T = [["g"] * W for _ in range(D)]        # верх клетки
props, stairs = [], {}

def rect(x0, y0, x1, y1, lev=None, top=None):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 0 <= x < W and 0 <= y < D:
                if lev is not None: L[y][x] = lev
                if top is not None: T[y][x] = top

# --- края карты: рваный обрыв в пустоту
for y in range(D):
    for x in range(W):
        e = min(x, y, W - 1 - x, D - 1 - y)
        if e == 0 and rnd.random() < 0.55: L[y][x] = 0
        if e == 1 and rnd.random() < 0.08: L[y][x] = 0
for (x, y) in [(0, 0), (1, 0), (0, 1), (W - 1, 0), (W - 2, 0), (W - 1, 1), (0, D - 1), (1, D - 1), (0, D - 2), (W - 1, D - 1), (W - 2, D - 1), (W - 1, D - 2)]:
    L[y][x] = 0
# убрать одинокие клетки на краю (висят в воздухе)
for y in range(D):
    for x in range(W):
        if min(x, y, W - 1 - x, D - 1 - y) == 0 and L[y][x]:
            nb = sum(1 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                     if 0 <= x + dx < W and 0 <= y + dy < D and L[y + dy][x + dx] and min(x + dx, y + dy, W - 1 - x - dx, D - 1 - y - dy) == 0)
            if nb == 0: L[y][x] = 0

# --- пятна земли: сухая трава, вариант, грязь, песок, пепел
for _ in range(70):
    x, y = rnd.randrange(W), rnd.randrange(D)
    T[y][x] = rnd.choice("GGGeennd")

# --- руины на северо-западе: высокая бетонная площадка
rect(1, 1, 8, 7, 4, "c")
rect(1, 1, 3, 3, 5, "c")                  # обломок стены повыше
for (x, y) in [(4, 2), (6, 5), (2, 6), (7, 3), (5, 6)]: T[y][x] = "r"
rect(3, 8, 8, 8, 3, "r")                  # ступень щебня к площадке
stairs["5,9"] = "R"                        # с дороги на щебень (подъём к y-1)
L[9][5] = 2; T[9][5] = "s"

# --- северо-восток: площадка из сухой земли повыше, тут бродят псы
rect(15, 1, 24, 8, 3, None)
rect(18, 2, 23, 5, 4, None)
stairs["17,9"] = "R"; stairs["20,6"] = "R"

# --- трасса: асфальт вдоль x (y=11..12) и съезд вдоль y (x=9..10)
rect(1, 11, 24, 12, 2, "s")
rect(9, 13, 10, 24, 2, "s")
rect(9, 9, 10, 10, 2, "s")

# --- ядовитый канал вдоль y (x=17..19), через него мост из ржавых листов
rect(16, 14, 20, 25, 1, "v")
rect(17, 14, 19, 25, 1, "w")
for y in range(14, 26):
    for x in (15, 21):
        if 0 <= x < W and L[y][x]: T[y][x] = "c"        # бетонные бортики
rect(16, 11, 20, 12, 2, "p")                            # мост — трасса над каналом
rect(16, 13, 20, 13, 2, "c")
# сток: лужа ядовитой жижи у трубы
rect(14, 18, 14, 20, 2, "m")

# --- лагерь на юго-западе: песок и бетонная площадка у хижины
rect(2, 14, 8, 22, 2, "n")
rect(3, 19, 6, 22, 2, "c")
for (x, y) in [(2, 16), (7, 21), (4, 15)]: T[y][x] = "e"
hut = [4, 20]           # хижина 2x2 (4..5, 20..21) — сюда возвращаешься после обморока
npc = [7, 18]           # Старый сталкер
merchant = [5, 15]      # Барахольщик за прилавком
stall = [6, 15, "stall_left"]
start = [8, 17]

# --- юго-восток за каналом: пустырь, кости и остов машины
rect(22, 15, 24, 23, 2, None)
for (x, y) in [(22, 17), (23, 20), (24, 16)]: T[y][x] = "d"
# пепелище у руин
for (x, y) in [(11, 3), (12, 3), (12, 4), (11, 5), (13, 4)]: T[y][x] = "d"

def free(x, y):
    if not (0 <= x < W and 0 <= y < D) or not L[y][x]: return False
    if T[y][x] in "wv": return False
    if f"{x},{y}" in stairs: return False
    if [x, y] in (hut, [hut[0] + 1, hut[1]], [hut[0], hut[1] + 1], [hut[0] + 1, hut[1] + 1], npc, merchant, stall[:2], start): return False
    return not any(p[0] == x and p[1] == y for p in props)

def put(x, y, name):
    if free(x, y): props.append([x, y, name]); return True
    return False

# машины, шины, бетонные блоки вдоль трассы
for x, y, n in [(13, 10, "prop_car"), (22, 3, "prop_car"), (3, 24, "prop_car"), (23, 21, "prop_car"),
                (14, 10, "prop_tires"), (21, 4, "prop_tires"), (11, 23, "prop_tires"), (15, 16, "prop_tires"),
                (6, 10, "prop_barrier"), (7, 10, "prop_barrier"), (21, 10, "prop_barrier"), (22, 13, "prop_barrier"),
                (11, 14, "prop_barrier"), (20, 7, "prop_bones"), (23, 18, "prop_bones"), (12, 6, "prop_bones")]:
    put(x, y, n)
# бочки и ящики — у лагеря, у руин, у канала
for x, y, n in [(7, 15, "prop_barrel"), (7, 14, "prop_crate"), (3, 15, "prop_crate"), (2, 18, "prop_barrel"),
                (8, 2, "prop_barrel"), (8, 6, "prop_crate"), (14, 15, "prop_barrel"), (22, 22, "prop_barrel"),
                (8, 19, "prop_signpost"), (12, 13, "prop_signpost")]:
    put(x, y, n)
# забор вокруг лагеря
for y in range(14, 23): put(1, y, "fence_left")
for x in range(2, 8): put(x, 23, "fence_right")
# камни и обломки
for x, y, n in [(1, 6, "rock_big"), (6, 1, "rock_big"), (13, 2, "rock_big"), (24, 9, "rock_big"), (12, 20, "rock_big"),
                (3, 5, "rock_small"), (7, 4, "rock_small"), (16, 9, "rock_small"), (23, 14, "rock_small"), (13, 22, "rock_small"),
                (4, 4, "stone_slab"), (2, 2, "stone_slab"), (11, 16, "prop_log")]:
    put(x, y, n)
# сухие деревья (пока это старые деревья, перекрашенные кодом в сухие)
for x, y, n in [(12, 1, "tree_big"), (14, 5, "tree_small"), (16, 3, "tree_big"), (24, 6, "tree_small"), (2, 9, "tree_small"),
                (13, 18, "tree_big"), (12, 24, "tree_small"), (23, 24, "tree_big"), (8, 24, "tree_small"), (19, 1, "tree_small"),
                (5, 13, "tree_small"), (24, 12, "tree_small")]:
    put(x, y, n)
# сухая трава россыпью по земле
n = 0
while n < 46:
    x, y = rnd.randrange(W), rnd.randrange(D)
    if T[y][x] in "gGend" and put(x, y, rnd.choice(["grass_tuft", "grass_tuft", "grass_tuft_2", "bush"])): n += 1

assert all(L[y][x] for (x, y) in [start, npc, merchant, stall[:2], hut])
m = {"levels": ["".join(str(v) for v in r) for r in L],
     "tops": ["".join(T[y][x] if L[y][x] else "." for x in range(W)) for y in range(D)],
     "stairs": stairs, "props": props, "start": start, "hut": hut, "npc": npc,
     "merchant": merchant, "stall": stall, "pier": None}
json.dump(m, open(sys.argv[1], "w"), ensure_ascii=False)
print("\n".join(m["levels"])); print(); print("\n".join(m["tops"])); print(len(props), "props")
