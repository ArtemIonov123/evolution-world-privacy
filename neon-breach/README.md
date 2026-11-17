# NEON BREACH

- Игра в браузере: https://artemionov123.github.io/evolution-world-privacy/neon-breach/
- APK (последняя сборка): https://github.com/ArtemIonov123/evolution-world-privacy/releases/latest/download/NEON_BREACH.apk

## Как обновить игру
Замени `neon-breach/index.html` новой версией и сделай commit. GitHub сам обновит сайт и соберёт новый APK
(вкладка Actions → «NEON BREACH APK»). Установленный APK обновлять не нужно: он всегда открывает свежую версию с сайта.

## Как устроен APK
Это Trusted Web Activity: приложение открывает сайт игры в Chrome на весь экран, горизонтально.
Поэтому WebXR / ARCore работают так же, как в Chrome. Нужен интернет и установленный Chrome.

## Адресная строка сверху
Чтобы её убрать, нужен файл `android/assetlinks.json` по адресу
`https://artemionov123.github.io/.well-known/assetlinks.json` — для этого нужен репозиторий `ArtemIonov123.github.io`.

`android/neon-breach.keystore` — тестовый ключ подписи (пароль neonbreach). Для Google Play сделать новый ключ.
