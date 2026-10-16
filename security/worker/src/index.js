// Сервер Isle of Legends (Cloudflare Worker, бесплатно, без карты).
//  POST /auth   — проверяет подпись Telegram (initData) и выдаёт пропуск в Firebase (custom token) на uid "utg<id>";
//                 админам (ADMIN_IDS) в пропуск добавляется admin:true — только с ним правила базы дают менять мир.
//  POST /bot    — вебхук Telegram-бота: /start и /play отвечают кнопкой «Играть».
//  POST /invoice  — счёт в Telegram Stars на пакет кристаллов (цена берётся только отсюда, не из игры).
//  POST /exchange — обмен кристаллов на золото: сервер списывает кристаллы с кошелька.
//                 Оплату бот принимает в /bot: pre_checkout_query (проверка) → successful_payment (зачисление, один раз на платёж).
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

// ---- доступ к базе от имени сервера (сервисный аккаунт; правила базы на него не действуют) ----
let gTok = null;
async function googleToken(sa, now = Date.now()) {
  if (gTok && gTok.exp > now + 60000) return gTok.t;
  const iat = Math.floor(now / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: sa.client_email, aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600,
    scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email" }));
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const jwt = head + "." + body + "." + b64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(head + "." + body)));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt });
  const j = await r.json(); if (!j.access_token) throw new Error("google token");
  gTok = { t: j.access_token, exp: now + (j.expires_in || 3600) * 1000 }; return gTok.t;
}
async function rtdb(env, path, method = "GET", body, headers = {}) {
  const t = await googleToken(JSON.parse(env.FIREBASE_SA));
  return fetch(`${env.DB_URL.replace(/\/$/, "")}/${path}.json`, { method, headers: { Authorization: "Bearer " + t, ...headers },
    body: body === undefined ? undefined : JSON.stringify(body) });
}
const walletPath = (env, tgId) => `w/${env.WORLD}/db/wallet/utg${tgId}`;
// изменить кристаллы атомарно (ETag): delta<0 — списание, не уходит в минус. Возвращает новый счёт или null.
export async function walletAdd(env, tgId, delta) {
  for (let i = 0; i < 6; i++) {
    const g = await rtdb(env, walletPath(env, tgId), "GET", undefined, { "X-Firebase-ETag": "true" });
    const etag = g.headers.get("ETag"); const v = await g.json();
    let cr = 0; try { const d = v && typeof v.j === "string" ? JSON.parse(v.j) : null; cr = d && typeof d.cr === "number" ? Math.floor(d.cr) : 0; } catch (e) {}
    const nc = cr + delta; if (nc < 0) return null; if (nc > 2e9) return null;
    const p = await rtdb(env, walletPath(env, tgId), "PUT", { j: JSON.stringify({ cr: nc }) }, { "if-match": etag });
    if (p.ok) return nc;
    if (p.status !== 412) throw new Error("wallet " + p.status);
  }
  throw new Error("wallet busy");
}

// ---- пакеты кристаллов (цена в звёздах Telegram). Такой же список — в игре (js/ui/crystals.js) только для показа ----
export const PACKS = { p1: { cr: 50, st: 25 }, p2: { cr: 120, st: 50 }, p3: { cr: 260, st: 100 }, p4: { cr: 700, st: 250 }, p5: { cr: 1500, st: 500 }, p6: { cr: 3500, st: 1000 } };
const PACK_T = { ru: (n) => `${n} кристаллов`, pl: (n) => `${n} kryształów`, en: (n) => `${n} crystals` };
const PACK_D = { ru: "Кристаллы для Isle of Legends. Придут в игру сразу после оплаты.", pl: "Kryształy do Isle of Legends. Trafią do gry zaraz po zapłacie.", en: "Crystals for Isle of Legends, delivered right after payment." };
const PAID = { ru: (n, c) => `💎 +${n} кристаллов! Теперь у тебя ${c}.`, pl: (n, c) => `💎 +${n} kryształów! Masz teraz ${c}.`, en: (n, c) => `💎 +${n} crystals! You now have ${c}.` };
const SUPPORT = { ru: "Вопросы по оплате: напиши сюда, в этот чат, — ответим. Кристаллы приходят в игру сразу; если не пришли — пришли номер платежа.",
  pl: "Pytania o płatność: napisz tutaj, w tym czacie. Kryształy przychodzą od razu; jeśli nie — wyślij numer płatności.",
  en: "Payment questions: write here in this chat. Crystals arrive instantly; if not, send the payment ID." };
// payload счёта: "<tgId>|<pack>" — проверяем, что пакет и сумма совпадают
export function checkPay(payload, fromId, currency, amount) {
  const m = /^(\d{3,15})\|(p\d)$/.exec(String(payload || "")); if (!m) return null;
  const pk = PACKS[m[2]]; if (!pk || m[1] !== String(fromId) || currency !== "XTR" || amount !== pk.st) return null;
  return { tg: m[1], id: m[2], ...pk };
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
    if (url.pathname === "/invoice" || url.pathname === "/exchange") {
      const h = cors(req, env);
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
      if (req.method !== "POST") return json({ error: "method" }, 405, h);
      let b = {}; try { b = JSON.parse(await req.text()); } catch (e) {}
      const u = await verifyInitData(b.init, env.TELEGRAM_TOKEN);
      if (!u) return json({ error: "bad_init_data" }, 401, h);
      if (url.pathname === "/invoice") {
        const pk = PACKS[b.pack]; if (!pk) return json({ error: "pack" }, 400, h);
        const L = langOf(b.lang);
        const r = await tg(env.TELEGRAM_TOKEN, "createInvoiceLink", { title: PACK_T[L](pk.cr), description: PACK_D[L], payload: `${u.id}|${b.pack}`,
          provider_token: "", currency: "XTR", prices: [{ label: PACK_T[L](pk.cr), amount: pk.st }] });
        if (!r.ok) return json({ error: "tg" }, 502, h);
        return json({ link: r.result }, 200, h);
      }
      const n = Math.floor(+b.n); if (!(n >= 1 && n <= 1e6)) return json({ error: "n" }, 400, h);
      try { const cr = await walletAdd(env, u.id, -n); if (cr === null) return json({ error: "no_crystals" }, 409, h); return json({ ok: true, cr, n }, 200, h); }
      catch (e) { console.error(e); return json({ error: "db" }, 502, h); }
    }
    if (url.pathname === "/setup" && req.method === "GET") {
      if (url.searchParams.get("key") !== (await hookSecret(env.TELEGRAM_TOKEN))) return json({ error: "no" }, 403);
      const hook = url.origin + "/bot";
      const a = await tg(env.TELEGRAM_TOKEN, "setWebhook", { url: hook, secret_token: await hookSecret(env.TELEGRAM_TOKEN), allowed_updates: ["message", "pre_checkout_query"] });
      const b = await tg(env.TELEGRAM_TOKEN, "setChatMenuButton", { menu_button: { type: "web_app", text: "Играть", web_app: { url: env.GAME_URL } } });
      const c = await tg(env.TELEGRAM_TOKEN, "setMyCommands", { commands: [{ command: "start", description: "Начать / Start" }, { command: "play", description: "Играть / Play" }, { command: "paysupport", description: "Помощь с оплатой / Payment help" }] });
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
        if (m && m.text && /^\/paysupport\b/.test(m.text))
          await tg(env.TELEGRAM_TOKEN, "sendMessage", { chat_id: m.chat.id, text: SUPPORT[langOf(m.from && m.from.language_code)] });
        // оплата звёздами: 1) проверка перед списанием
        const q = u.pre_checkout_query;
        if (q) { const ok = !!checkPay(q.invoice_payload, q.from && q.from.id, q.currency, q.total_amount);
          await tg(env.TELEGRAM_TOKEN, "answerPreCheckoutQuery", ok ? { pre_checkout_query_id: q.id, ok: true } : { pre_checkout_query_id: q.id, ok: false, error_message: "Пакет не найден / Pack not found" }); }
        // 2) деньги пришли — зачисляем кристаллы ровно один раз на платёж
        const sp = m && m.successful_payment;
        if (sp) {
          const pk = checkPay(sp.invoice_payload, m.from && m.from.id, sp.currency, sp.total_amount);
          const cid = String(sp.telegram_payment_charge_id || "").replace(/[.$#\[\]\/]/g, "_").slice(0, 120);
          if (pk && cid) {
            const rec = `pay/${cid}`;
            const c = await rtdb(env, rec, "PUT", { tg: pk.tg, p: pk.id, cr: pk.cr, st: pk.st, t: Date.now(), done: false }, { "if-match": "null_etag" });
            let fresh = c.ok;
            if (!fresh) { if (c.status !== 412) throw new Error("pay rec " + c.status); const old = await (await rtdb(env, rec)).json(); fresh = old && old.done === false; }
            if (fresh) {
              const cr = await walletAdd(env, pk.tg, pk.cr);
              await rtdb(env, rec + "/done", "PUT", true);
              await tg(env.TELEGRAM_TOKEN, "sendMessage", { chat_id: m.chat.id, text: PAID[langOf(m.from && m.from.language_code)](pk.cr, cr) });
            }
          }
        }
      } catch (e) { console.error(e); if (u.message && u.message.successful_payment) return new Response("retry", { status: 500 }); }
      return new Response("ok");
    }
    return new Response("Isle of Legends server", { status: 200 });
  },
};
