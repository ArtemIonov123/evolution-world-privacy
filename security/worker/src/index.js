// Сервер Isle of Legends (Cloudflare Worker, бесплатно, без карты).
//  POST /auth   — проверяет подпись Telegram (initData) и выдаёт пропуск в Firebase (custom token) на uid "utg<id>";
//                 админам (ADMIN_IDS) в пропуск добавляется admin:true — только с ним правила базы дают менять мир.
//  POST /bot    — вебхук Telegram-бота: /start и /play отвечают кнопкой «Играть».
//  GET  /setup?key=…  — ставит вебхук, кнопку меню и команды (key выводится из токена бота).
// Секреты (wrangler secret): TELEGRAM_TOKEN, FIREBASE_SA (JSON сервисного аккаунта). Переменные — в wrangler.toml.

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const b64url = (data) => {
  const bytes = typeof data === "string" ? enc.encode(data) : new Uint8Array(data);
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(msg));
}
async function sha256hex(s) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }

// ---- подпись Telegram Mini App: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app ----
export async function verifyInitData(initData, botToken, maxAgeSec = 86400, now = Date.now()) {
  if (typeof initData !== "string" || initData.length > 4096) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get("hash"); if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  p.delete("hash");
  const check = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = await hmac("WebAppData", botToken);
  const calc = hex(await hmac(secret, check));
  if (calc.length !== hash.length) return null;
  let diff = 0; for (let i = 0; i < calc.length; i++) diff |= calc.charCodeAt(i) ^ hash.charCodeAt(i);
  if (diff !== 0) return null;
  const authDate = +p.get("auth_date") || 0;
  if (!authDate || now / 1000 - authDate > maxAgeSec) return null;
  let user = null; try { user = JSON.parse(p.get("user") || "null"); } catch (e) { return null; }
  if (!user || !/^\d{3,15}$/.test(String(user.id))) return null;
  return { id: String(user.id), first: String(user.first_name || ""), username: String(user.username || "") };
}

// ---- пропуск Firebase (custom token), подписанный ключом сервисного аккаунта ----
function pemToDer(pem) {
  const b = atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
  const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer;
}
export async function firebaseCustomToken(sa, uid, claims, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({
    iss: sa.client_email, sub: sa.client_email, iat, exp: iat + 3600, uid, claims,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
  }));
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(head + "." + body));
  return head + "." + body + "." + b64url(sig);
}

// ---- бот ----
const TEXT = {
  ru: "⚔️ <b>Isle of Legends</b> — пиксельная RPG.\n\nОстрова и пещеры, волки, пауки и боссы, воин и друид, игра с друзьями в группе.\n\nЖми <b>«Играть»</b>!",
  pl: "⚔️ <b>Isle of Legends</b> — pikselowe RPG.\n\nWyspy i jaskinie, wilki, pająki i bossowie, wojownik i druid, gra z przyjaciółmi w drużynie.\n\nKliknij <b>„Graj”</b>!",
  en: "⚔️ <b>Isle of Legends</b> — a pixel-art RPG.\n\nIslands and caves, wolves, spiders and bosses, warrior and druid, play with friends in a party.\n\nTap <b>“Play”</b>!",
};
const BTN = { ru: "▶ Играть", pl: "▶ Graj", en: "▶ Play" };
const langOf = (c) => (/^(ru|uk|be|kk)/.test(c || "") ? "ru" : /^pl/.test(c || "") ? "pl" : "en");
const tg = (token, method, body) => fetch(`https://api.telegram.org/bot${token}/${method}`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
const hookSecret = async (token) => (await sha256hex("hook|" + token)).slice(0, 48);

function cors(req, env) {
  const o = req.headers.get("Origin") || "";
  const ok = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allow = ok.includes(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) ? o : ok[0] || "";
  return { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
}
const json = (obj, status = 200, h = {}) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...h } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/auth") {
      const h = cors(req, env);
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
      if (req.method !== "POST") return json({ error: "method" }, 405, h);
      const initData = await req.text();
      const u = await verifyInitData(initData, env.TELEGRAM_TOKEN);
      if (!u) return json({ error: "bad_init_data" }, 401, h);
      const admins = (env.ADMIN_IDS || "").split(",").map((s) => s.trim());
      const admin = admins.includes(u.id);
      const sa = JSON.parse(env.FIREBASE_SA);
      const token = await firebaseCustomToken(sa, "utg" + u.id, admin ? { admin: true, tg: u.id } : { tg: u.id });
      return json({ token, uid: "utg" + u.id, admin }, 200, h);
    }
    if (url.pathname === "/setup" && req.method === "GET") {
      if (url.searchParams.get("key") !== (await hookSecret(env.TELEGRAM_TOKEN))) return json({ error: "no" }, 403);
      const hook = url.origin + "/bot";
      const a = await tg(env.TELEGRAM_TOKEN, "setWebhook", { url: hook, secret_token: await hookSecret(env.TELEGRAM_TOKEN), allowed_updates: ["message", "pre_checkout_query"] });
      const b = await tg(env.TELEGRAM_TOKEN, "setChatMenuButton", { menu_button: { type: "web_app", text: "Играть", web_app: { url: env.GAME_URL } } });
      const c = await tg(env.TELEGRAM_TOKEN, "setMyCommands", { commands: [{ command: "start", description: "Начать / Start" }, { command: "play", description: "Играть / Play" }] });
      return json({ webhook: a.ok, menu: b.ok, commands: c.ok });
    }
    if (url.pathname === "/bot" && req.method === "POST") {
      if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== (await hookSecret(env.TELEGRAM_TOKEN))) return new Response("no", { status: 403 });
      const u = await req.json().catch(() => ({}));
      try {
        const m = u.message;
        if (m && m.text && /^\/(start|play)\b/.test(m.text)) {
          const L = langOf(m.from && m.from.language_code);
          await tg(env.TELEGRAM_TOKEN, "sendMessage", { chat_id: m.chat.id, text: TEXT[L], parse_mode: "HTML",
            reply_markup: { inline_keyboard: [[{ text: BTN[L], web_app: { url: env.GAME_URL } }]] } });
        }
        // оплата звёздами — следующий шаг
        if (u.pre_checkout_query) await tg(env.TELEGRAM_TOKEN, "answerPreCheckoutQuery", { pre_checkout_query_id: u.pre_checkout_query.id, ok: false, error_message: "Скоро / Soon" });
      } catch (e) { console.error(e); }
      return new Response("ok");
    }
    return new Response("Isle of Legends server", { status: 200 });
  },
};
