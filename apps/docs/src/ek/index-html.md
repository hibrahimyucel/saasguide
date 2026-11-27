---
title: index.html
description: wwwwroot
outline:
  - 2
  - 3
status: published
tags:
  - rehber
  - ek
---


::: details index.html
```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>pr2cloud — Gateway & Alt Alan Adı Çözümleyici</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --success: #22c55e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .container {
      width: 100%;
      max-width: 680px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .brand span {
      color: var(--accent);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: rgba(34, 197, 94, 0.15);
      color: var(--success);
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .info-box {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }

    .info-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.35rem;
    }

    .info-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.95rem;
      color: var(--accent);
      word-break: break-all;
    }

    .notice {
      font-size: 0.875rem;
      color: var(--muted);
      line-height: 1.5;
      margin-bottom: 1.75rem;
      padding: 0.85rem 1rem;
      background: rgba(56, 189, 248, 0.08);
      border-left: 3px solid var(--accent);
      border-radius: 4px;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .service-link {
      display: block;
      text-decoration: none;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem;
      color: var(--text);
      transition: border-color 0.15s ease, transform 0.15s ease;
    }

    .service-link:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    .service-name {
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 0.2rem;
    }

    .service-sub {
      font-size: 0.75rem;
      color: var(--muted);
      font-family: monospace;
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="header">
      <div class="brand">πr² <span>cloud</span> Gateway</div>
      <div class="badge"><span class="dot"></span> TLS & Proxy Aktif</div>
    </header>

    <section class="info-grid">
      <div class="info-box">
        <div class="info-label">Çözümlenen Host</div>
        <div class="info-value" id="resolved-host">-</div>
      </div>
      <div class="info-box">
        <div class="info-label">Alt Alan Adı (Subdomain)</div>
        <div class="info-value" id="resolved-sub">-</div>
      </div>
      <div class="info-box">
        <div class="info-label">Protokol & Yol</div>
        <div class="info-value" id="resolved-path">-</div>
      </div>
    </section>

    <p class="notice" id="status-message">
      İstek Nginx Reverse Proxy tarafından başarıyla karşılandı.
    </p>

    <div class="section-title">Platform Servisleri</div>
    <nav class="links-grid" id="service-links"></nav>
  </main>

  <script>
    (function () {
      const host = window.location.hostname;
      const protocol = window.location.protocol.replace(":", "").toUpperCase();
      const path = window.location.pathname + window.location.search;

      // Alan adını parçalayarak subdomain ve kök domaini bul
      const parts = host.split(".");
      const isDuckDns = host.endsWith(".duckdns.org");
      const rootPartsCount = isDuckDns ? 3 : 2;
      const subdomain = parts.length > rootPartsCount
        ? parts.slice(0, parts.length - rootPartsCount).join(".")
        : "(kök alan adı)";
      const rootDomain = parts.slice(-rootPartsCount).join(".");

      document.getElementById("resolved-host").textContent = host;
      document.getElementById("resolved-sub").textContent = subdomain;
      document.getElementById("resolved-path").textContent = `${protocol} ${path}`;

      const statusEl = document.getElementById("status-message");
      if (subdomain === "main") {
        statusEl.textContent = "Ana Gateway (main.) giriş noktasındasınız. Tüm altyapı servislerine aşağıdan erişebilirsiniz.";
      } else {
        statusEl.textContent = `"${subdomain}" alt alan adı için özel bir servis tanımlı değil; istek varsayılan Wildcard Gateway tarafından çözümlendi.`;
      }

      // Kök domaini dinamik kullanarak servis bağlantılarını oluştur
      const services = [
        { name: "Ana Portal", sub: "main" },
        { name: "Dokümantasyon", sub: "docs" },
        { name: "Dev Önizleme", sub: "dev" },
        { name: "Git & Registry", sub: "gitea" }
      ];

      const nav = document.getElementById("service-links");
      services.forEach((svc) => {
        const a = document.createElement("a");
        a.className = "service-link";
        a.href = `https://${svc.sub}.${rootDomain}`;
        a.innerHTML = `
          <div class="service-name">${svc.name}</div>
          <div class="service-sub">${svc.sub}.*</div>
        `;
        nav.appendChild(a);
      });
    })();
  </script>
</body>
</html>
```
:::
