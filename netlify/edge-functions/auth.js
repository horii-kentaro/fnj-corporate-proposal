// ================================================================
// Netlify Edge Function: Dual-password auth gate
//
//  クライアント用  → パスワード: fnj2026    (fnj-proposal.html / fnj-hearing.html)
//  管理者用       → パスワード: tera_admin  (?view=admin)
//
// 管理者Cookie は クライアントページへのアクセスも兼ねる
// ================================================================

const PASSWORDS = {
  client: "fnj2026",
  admin:  "tera_admin",
};

const COOKIES = {
  client: { name: "fnj_client_auth", value: "fnj_client_ok_2026" },
  admin:  { name: "fnj_admin_auth",  value: "fnj_admin_ok_tera"  },
};

export default async function handler(req, context) {
  const url = new URL(req.url);

  // ?view=admin のリクエストは管理者パスワードで保護
  const isAdminReq = url.searchParams.get("view") === "admin";

  // Cookie パース
  const cookieStr     = req.headers.get("cookie") || "";
  const hasCookie     = (name, value) =>
    cookieStr.split(";").map(c => c.trim()).some(c => c === `${name}=${value}`);

  const hasClientAuth = hasCookie(COOKIES.client.name, COOKIES.client.value);
  const hasAdminAuth  = hasCookie(COOKIES.admin.name,  COOKIES.admin.value);

  // 管理者認証済みはすべてのパスに通す
  // クライアント認証済みは非管理者パスのみ通す
  const canAccess = isAdminReq ? hasAdminAuth : (hasClientAuth || hasAdminAuth);

  if (canAccess) {
    // ルートへのアクセスはトップページにリダイレクト
    if (url.pathname === "/" || url.pathname === "") {
      return Response.redirect(new URL("/fnj-proposal.html", url.origin), 302);
    }
    return context.next();
  }

  // ── POST: パスワード送信処理 ──
  if (req.method === "POST") {
    let submitted = "";
    try {
      const body = await req.text();
      submitted  = new URLSearchParams(body).get("pw") || "";
    } catch (_) {}

    const expectedPw = isAdminReq ? PASSWORDS.admin : PASSWORDS.client;
    const cookie     = isAdminReq ? COOKIES.admin    : COOKIES.client;

    if (submitted === expectedPw) {
      // 正解 → Cookie をセットして元のURLにリダイレクト（クエリ文字列ごと）
      const dest = (url.pathname === "/" || url.pathname === "")
        ? new URL("/fnj-proposal.html", url.origin).href
        : url.href;  // ?view=admin を含む完全URL

      return new Response(null, {
        status: 302,
        headers: {
          "Location": dest,
          "Set-Cookie": [
            `${cookie.name}=${cookie.value}`,
            "Path=/",
            "HttpOnly",
            "Secure",
            "SameSite=Strict",
            "Max-Age=86400",  // 24時間
          ].join("; "),
        },
      });
    }

    // 不正解
    return new Response(passwordHTML(true, isAdminReq), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ── GET: パスワード入力画面を表示 ──
  return new Response(passwordHTML(false, isAdminReq), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ================================================================
// パスワード入力画面 HTML
// ================================================================
function passwordHTML(isError, isAdmin) {
  const title = isAdmin
    ? "管理者ログイン"
    : "提案書へのアクセス認証";
  const desc = isAdmin
    ? "この画面はテラ担当者専用です。<br>管理者パスワードをご入力ください。"
    : "この資料は関係者限定です。<br>担当者よりお伝えしたパスワードをご入力ください。";
  const icon = isAdmin ? "🔑" : "🔐";
  const badge = isAdmin ? "管理者専用" : "関係者限定";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — FNJ</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #0c1e4a 0%, #0f2d6e 55%, #1a4fa0 100%);
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
.lock-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}
.lock {
  width: 68px; height: 68px;
  background: ${isAdmin
    ? 'linear-gradient(135deg, #1e1b4b, #4338ca)'
    : 'linear-gradient(135deg, #1d4ed8, #0ea5e9)'};
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.9rem;
  box-shadow: 0 8px 24px ${isAdmin ? 'rgba(67,56,202,0.35)' : 'rgba(29,78,216,0.3)'};
}
.badge {
  position: absolute;
  top: -6px; right: -8px;
  background: ${isAdmin ? '#4f46e5' : '#2563eb'};
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.18rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
h1 { font-size: 1.2rem; font-weight: 800; color: #0f2557; margin-bottom: 0.6rem; }
.desc { font-size: 0.85rem; color: #64748b; line-height: 1.75; margin-bottom: 1.75rem; }
.err {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.7rem 1rem;
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
  padding: 0.8rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1.05rem;
  letter-spacing: 0.2em;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  margin-bottom: 1rem;
}
input[type="password"]:focus {
  border-color: ${isAdmin ? '#4f46e5' : '#1d4ed8'};
  box-shadow: 0 0 0 3px ${isAdmin ? 'rgba(79,70,229,0.12)' : 'rgba(29,78,216,0.1)'};
}
button {
  width: 100%;
  padding: 0.9rem;
  background: ${isAdmin
    ? 'linear-gradient(135deg, #1e1b4b, #4338ca)'
    : 'linear-gradient(135deg, #1d4ed8, #0ea5e9)'};
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 16px ${isAdmin ? 'rgba(67,56,202,0.3)' : 'rgba(29,78,216,0.3)'};
  letter-spacing: 0.02em;
}
button:hover { transform: translateY(-2px); box-shadow: 0 8px 24px ${isAdmin ? 'rgba(67,56,202,0.4)' : 'rgba(29,78,216,0.4)'}; }
.note { font-size: 0.74rem; color: #94a3b8; margin-top: 1.5rem; line-height: 1.6; }
</style>
</head>
<body>
<div class="card">
  <div class="lock-wrap">
    <div class="lock">${icon}</div>
    <div class="badge">${badge}</div>
  </div>
  <h1>${title}</h1>
  <p class="desc">${desc}</p>
  ${isError ? '<div class="err">⚠ パスワードが正しくありません。再度お試しください。</div>' : ""}
  <form method="POST">
    <label for="pw">パスワード</label>
    <input type="password" id="pw" name="pw" placeholder="••••••••" autofocus required>
    <button type="submit">${isAdmin ? '🔑 管理画面へ' : '認証して資料を表示 →'}</button>
  </form>
  <p class="note">株式会社○○ 提供資料 — 無断転載・転送禁止</p>
</div>
</body>
</html>`;
}
