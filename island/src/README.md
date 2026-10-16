# Isle of Legends (Wyspa) — исходники

Изометрическая пиксельная RPG-песочница. Код пишет Claude, графику рисует ChatGPT.

Готовая игра: `../index.html` (GitHub Pages), мультиплеер через Firebase Realtime Database
(проект `island-6cbab`). Мир выбирается ключом в ссылке: `#world=...`.

## Что где

| Путь | Что это |
|---|---|
| `game/` | **Исходники игры, разбитые на модули** (css, html, js/core, world, mobs, combat, items, net, admin, ui, i18n). Порядок склейки — в `game/index.html`, описание каждого файла — в `game/README.md`. |
| `build/assemble.py` | Склеивает `game/` в один `game.html` (места `/*SPRITES*/` и `/*MAP*/` потом заполняет `build2.py`). |
| `build/m42h.json` | Карта острова 20×20 (уровни высот, лестницы, деревья, пруд, хижина, NPC). |
| `build/fb_adapter.js` | Адаптер Firebase: даёт игре `claude.use("room"/"db"/"user")` как на claude.ai, но поверх Realtime Database. |
| `sprites/<папка>/*.png` | Все картинки. Имя файла = имя спрайта в игре (`hero_se_0`, `wolf_dead`, `item_pelt`, `ui_bag` …). |
| `build/build2.py` | Встраивает спрайты и карту в `game.html`. |
| `build/asciify.py` | Делает файл чистым ASCII (чтобы не было «иероглифов» при любой кодировке). |
| `build/build_web.py` | Веб-версия: встраивает Firebase SDK, адаптер, номер сборки (для кнопки «Обновить»), манифест. |
| `tests/` | Сценарии Playwright: телефон, ночь, хижина, бой, мультиплеер (через `fake_rtdb.js`), окна RPG, сохранение. |

## Сборка

```bash
cd island/src/build
./build.sh                 # нужны python3 (Pillow не нужен) и npm
cp out/* ../../            # выкладка: index.html, version.json, manifest.webmanifest
```

`claude.html` — та же игра для артефакта на claude.ai (без Firebase, там сеть даёт сама платформа).

## Как добавить картинку

1. Положи PNG в нужную папку `sprites/…` с точным именем (например `sprites/items/item_bow.png`).
2. В коде (`game/js/...`) обращайся к ней как `img.item_bow` (для иконок предметов — через `ICON_SPRITE`).
3. Пересобери.

## Тесты

```bash
cd island/src/tests
npm i playwright@1.56.1
node phone.js "$PWD/../build/claude.html"     # одиночные: путь к собранному файлу
# мультиплеерные (web_test, mp_combat, save_test) ждут собранную веб-версию
# с адаптером на http://localhost:8765/index.html и подменяют Firebase через fake_rtdb.js
```
