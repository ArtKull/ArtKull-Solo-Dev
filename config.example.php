<?php
// Скопируйте этот файл в config.php на сервере и заполните реальными значениями.
// config.php НЕ коммитится (см. .gitignore) и закрыт .htaccess.

// 1) Токен бота от @BotFather (/newbot)
const BOT_TOKEN = 'PASTE_BOT_TOKEN_HERE';
// 2) chat_id получателя: https://api.telegram.org/bot<TOKEN>/getUpdates → message.chat.id
//    (или напишите @userinfobot). Для группы id отрицательный, бота сделать админом.
const CHAT_ID = 'PASTE_CHAT_ID_HERE';
// 3) true — заявки не уходят в Telegram, а пишутся в error_log (для локальной проверки)
const DRY_RUN = true;
// 4) Ограничение частоты
const RATE_MAX = 5;
const RATE_WINDOW = 600;
// 5) При желании — свой каталог для счётчиков rate-limit (вне web-root):
// const RATE_DIR = '/path/outside/webroot/artkull-rate';
