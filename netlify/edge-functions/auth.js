const PASSWORD    = "fnj2026";
const COOKIE_NAME = "fnj_auth";
const COOKIE_VAL  = "fnj_2026_authorized";

export default async function handler(req, context) {
  const url = new URL(req.url);

  // ── 認証Cookie チェック ──
  const cookieStr = req.headers.get("cookie") || "";
  const isAuth = cookieStr
    .split(";")
    .map(c => c.trim())
    .some(c => c === `${COOKIE_NAME}=${COOKIE_VAL}`);

  // 認証済み → ルートは fnj-proposal.html にリダイレクト、それ以外はそのまま通す
  if (isAuth) {
    if (url.pathname === "/" || url.pathname === "") {
      return Response.redirect(new URL("/fnj-proposal.html", url.origin), 302);
    }
    return context.next();
  }

  // ── POST: パスワード送信を処理 ──
  if (req.method === "POST") {
    let submitted = "";
    try {
      const body = await req.text();
      submitted = new URLSearchParams(body).get("pw") || "";
    } catch (_) {}

    if (submitted === PASSWORD) {
      // 正解 → Cookie をセットしてリダイレクト
      const dest = (url.pathname === "/" || url.pathname === "")
        ? "/fnj-proposal.html"
        : url.pathname;
      return new Response(null, {
        status: 302,
        headers: {
          "Location": dest,
          "Set-Cookie": [
            `${COOKIE_NAME}=${COOKIE_VAL}`,
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Strict",
            "Max-Age=86400",   // 24時間
          ].join("; "),
        },
      });
    }

    // 不正解 → エラー表示
    return new Response(passwordHTML(true), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ── GET: パスワード画面を表示 ──
  return new Response(passwordHTML(false), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function passwordHTML(error) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>アクセス認証 — FNJ 提案書</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0c1e4a 0%, #0f2d6e 50%, #1a4fa0 100%);
  font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', 'Yu Gothic', sans-serif;
  padding: 1rem;
}
.card {
  background: #fff;
  border-radius: 20px;
  padding: 3rem 2.5rem 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  text-align: center;
}
.lock {
  width: 68px; height: 68px;
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.9rem;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 24px rgba(29, 78, 216, 0.3);
}
h1 { font-size: 1.15rem; font-weight: 800; color: #0f2557; margin-bottom: 0.6rem; }
.desc { font-size: 0.85rem; color: #64748b; line-height: 1.7; margin-bottom: 1.75rem; }
.err {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
label {
  display: block;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 0.4rem;
  letter-spacing: 0.02em;
}
input[type="password"] {
  width: 100%;
  padding: 0.78rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1.05rem;
  letter-spacing: 0.18em;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  margin-bottom: 1rem;
}
input[type="password"]:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,0.1); }
button {
  width: 100%;
  padding: 0.88rem;
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(29, 78, 216, 0.3);
  letter-spacing: 0.02em;
}
button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(29, 78, 216, 0.4); }
.note { font-size: 0.74rem; color: #94a3b8; margin-top: 1.5rem; line-height: 1.6; }
</style>
</head>
<body>
<div class="card">
  <div class="lock">🔐</div>
  <h1>提案書へのアクセス認証</h1>
  <p class="desc">
    この資料は関係者限定です。<br>
    担当者よりお伝えしたパスワードをご入力ください。
  </p>
  ${error ? '<div class="err">⚠ パスワードが正しくありません。再度お試しください。</div>' : ""}
  <form method="POST">
    <label for="pw">パスワード</label>
    <input type="password" id="pw" name="pw" placeholder="••••••••" autofocus required>
    <button type="submit">認証して資料を表示 →</button>
  </form>
  <p class="note">株式会社○○ 提供資料 — 無断転載・転送禁止</p>
</div>
</body>
</html>`;
}
