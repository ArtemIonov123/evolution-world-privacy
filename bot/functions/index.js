// Сервер бота Isle of Legends: отвечает в Telegram (вебхук).
// Токен бота хранится в Secret Manager (секрет TELEGRAM_TOKEN), в коде его нет.
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const crypto = require("crypto");

const TELEGRAM_TOKEN = defineSecret("TELEGRAM_TOKEN");
const GAME_URL = "https://artemionov123.github.io/evolution-world-privacy/island/#world=Zndpq1U6xpOHMsiA1AP0";

// секрет вебхука выводим из токена: так Telegram доказывает, что запрос от него
const hookSecret = (token) => crypto.createHash("sha256").update("hook|" + token).digest("hex").slice(0, 48);

async function tg(token, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return r.json();
}

const TEXT = {
  ru: "⚔️ <b>Isle of Legends</b> — пиксельная RPG.\n\nОстрова и пещеры, волки, пауки и каменный голем, воин и друид, игра с друзьями в группе.\n\nЖми <b>«Играть»</b>!",
  pl: "⚔️ <b>Isle of Legends</b> — pikselowe RPG.\n\nWyspy i jaskinie, wilki, pająki i kamienny golem, wojownik i druid, gra z przyjaciółmi w drużynie.\n\nKliknij <b>„Graj”</b>!",
  en: "⚔️ <b>Isle of Legends</b> — a pixel-art RPG.\n\nIslands and caves, wolves, spiders and a stone golem, warrior and druid, play with friends in a party.\n\nTap <b>“Play”</b>!",
};
const BTN = { ru: "▶ Играть", pl: "▶ Graj", en: "▶ Play" };
const langOf = (code) => (/^(ru|uk|be|kk)/.test(code || "") ? "ru" : /^pl/.test(code || "") ? "pl" : "en");

exports.tgbot = onRequest({ region: "europe-west1", secrets: [TELEGRAM_TOKEN], maxInstances: 3 }, async (req, res) => {
  const token = TELEGRAM_TOKEN.value();
  // служебная настройка: GET ?setup=1 ставит вебхук и меню бота
  if (req.method === "GET") {
    if (req.query.setup === "1") {
      const url = `https://europe-west1-${process.env.GCLOUD_PROJECT || "island-6cbab"}.cloudfunctions.net/tgbot`;
      const a = await tg(token, "setWebhook", { url, secret_token: hookSecret(token), allowed_updates: ["message", "pre_checkout_query"] });
      const b = await tg(token, "setChatMenuButton", { menu_button: { type: "web_app", text: "Играть", web_app: { url: GAME_URL } } });
      const c = await tg(token, "setMyCommands", { commands: [{ command: "start", description: "Начать / Start" }, { command: "play", description: "Играть / Play" }] });
      res.json({ webhook: a.ok, menu: b.ok, commands: c.ok });
      return;
    }
    res.send("ok");
    return;
  }
  if (req.get("X-Telegram-Bot-Api-Secret-Token") !== hookSecret(token)) { res.status(403).send("no"); return; }
  const u = req.body || {};
  try {
    const m = u.message;
    if (m && m.text && /^\/(start|play)\b/.test(m.text)) {
      const L = langOf(m.from && m.from.language_code);
      await tg(token, "sendMessage", {
        chat_id: m.chat.id, text: TEXT[L], parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: BTN[L], web_app: { url: GAME_URL } }]] },
      });
    }
    // оплата звёздами — следующий шаг (pre_checkout_query / successful_payment)
    if (u.pre_checkout_query) await tg(token, "answerPreCheckoutQuery", { pre_checkout_query_id: u.pre_checkout_query.id, ok: false, error_message: "Скоро / Soon" });
  } catch (e) { console.error(e); }
  res.send("ok");
});
