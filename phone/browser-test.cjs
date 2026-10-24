"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = __dirname;
const hostedUrl = process.env.VOIDREIGN_BASE_URL;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8"
};
const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.resolve(root, "." + urlPath);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    res.end(data);
  });
});

(async () => {
  let browser;
  let page;
  let context;
  const failures = [];
  try {
    if (!hostedUrl) await new Promise(resolve => server.listen(4173, "0.0.0.0", resolve));
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true
    });
    page = await context.newPage();
    page.on("pageerror", error => failures.push("pageerror: " + error.message));
    page.on("console", message => {
      if (message.type() === "error") failures.push("console: " + message.text());
    });
    await page.goto(hostedUrl || "http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    assert.equal(await page.title(), "VOIDREIGN: Pocket Empire", "Game title should load");
    assert.equal(
      await page.locator("#galaxy-svg [data-map-system]").count(),
      200,
      "Galaxy chart should render every system"
    );
    assert.ok(
      await page.locator("#galaxy-svg").evaluate(el => el.getBoundingClientRect().height > 100),
      "Galaxy chart should have visible height"
    );

    for (const width of [320, 360, 390, 412]) {
      await page.setViewportSize({ width, height: 844 });
      const layout = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      }));
      assert.ok(
        layout.scrollWidth <= layout.innerWidth + 1,
        "No horizontal overflow at " + width + "px: " + JSON.stringify(layout)
      );
    }
    assert.ok((await page.locator(".command-deck").innerText()).toUpperCase().includes("THE SILENT CROWN"), "The original command deck should render");
    assert.ok((await page.locator("#story-chapters").innerText()).includes("Ghosts on the Chart"), "The campaign chronicle should render its opening objective");
    assert.ok(await page.locator("#systemdetail .planet-panel svg").count() === 1, "Selected system should have an original vector illustration");
    const installAssets = await page.evaluate(async () => {
      const response = await fetch(new URL("manifest.webmanifest", location.href));
      if (!response.ok) throw new Error("Manifest request failed: " + response.status);
      const manifest = await response.json();
      const icons = await Promise.all((manifest.icons || []).filter(icon => icon.type === "image/png").map(async icon => {
        const iconResponse = await fetch(new URL(icon.src, location.href));
        return { src: icon.src, status: iconResponse.status, type: iconResponse.headers.get("content-type") };
      }));
      return { manifestStatus: response.status, name: manifest.name, icons };
    });
    assert.equal(installAssets.name, "VOIDREIGN: Pocket Empire", "Install manifest should identify the game");
    assert.ok(installAssets.icons.some(icon => icon.src === "./icon-192.png" && icon.status === 200), "The 192px Android icon should be served successfully");
    assert.ok(installAssets.icons.some(icon => icon.src === "./icon-512.png" && icon.status === 200), "The 512px Android icon should be served successfully");
    await page.locator('[data-tab="empire"]').click();
    const factionCrests = await page.locator("#factions svg.faction-crest").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-faction")));
    assert.equal(factionCrests.length, 16, "Diplomacy should display an emblem for all 16 civilizations");
    assert.equal(new Set(factionCrests).size, 16, "Every rendered faction emblem should identify a unique civilization");
    await page.locator('[data-tab="map"]').click();
    console.log("PASS browser: command deck, chronicle, planet art, all 16 faction crests, PWA icons, 200 systems and 320/360/390/412px layouts");

    await page.locator('[data-tab="fleet"]').click();
    await page.locator('#battle-panel [data-action="fight"]').click();
    await page.locator('#battle-panel [data-battle-move="brace"]').waitFor({ state: "visible" });
    assert.match(await page.locator("#battle-panel").innerText(), /TACTICAL CONTACT/);
    await page.locator('#battle-panel [data-battle-move="brace"]').click();
    await page.waitForFunction(() => /ROUND 2/i.test(document.querySelector("#battle-panel")?.innerText || ""));
    await page.locator('#battle-panel [data-battle-move="retreat"]').click();
    assert.ok((await page.locator("#battle-panel").innerText()).toUpperCase().includes("DISENGAGED"));
    assert.ok(await page.locator("#ships .ship-art svg").count() >= 1, "Friendly ships should render hand-authored vector silhouettes");
    console.log("PASS browser: tactical encounter, brace round transition, retreat and vector ship art");

    await page.locator('[data-tab="companions"]').click();
    await page.locator('button[data-recruit="mara"]').click();
    await page.locator("#party").getByText(/Personal ambition/).waitFor({ state: "visible" });
    assert.ok((await page.locator("#party").innerText()).includes("Personal ambition"));
    await page.locator("#quicksave").click();
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("voidreign-pocket-v2")));
    assert.equal(persisted.companions.length, 1, "Quicksave should persist the recruited companion");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-tab="companions"]').click();
    const partyText = await page.locator("#party").innerText();
    assert.ok(/Mara/i.test(partyText), "Companion should survive a full browser reload");
    console.log("PASS browser: companion ambition UI, recruitment, quicksave and reload persistence");

    // A crafted import must be rejected before replacing the campaign or touching its save.
    await page.locator('[data-tab="ledger"]').click();
    const beforeUnsafeImport = await page.evaluate(() => localStorage.getItem("voidreign-pocket-v2"));
    const maliciousSave = JSON.parse(beforeUnsafeImport);
    maliciousSave.systems[0].name = '<img src=x onerror="alert(1)">';
    const [maliciousChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.locator('button[data-action="import"]').click()
    ]);
    await maliciousChooser.setFiles({
      name: "malicious-pocket-save.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(maliciousSave))
    });
    await page.waitForFunction(() => document.body.innerText.includes("Import failed: invalid, unsafe or oversized backup."));
    const afterUnsafeImport = await page.evaluate(() => JSON.parse(localStorage.getItem("voidreign-pocket-v2")));
    const beforeUnsafe = JSON.parse(beforeUnsafeImport);
    assert.equal(afterUnsafeImport.systems[0].name, beforeUnsafe.systems[0].name, "A malicious import must not change system data");
    assert.equal(afterUnsafeImport.systems.length, beforeUnsafe.systems.length, "The existing galaxy must be preserved");
    assert.equal(afterUnsafeImport.companions.length, beforeUnsafe.companions.length, "Existing companions must be preserved");
    assert.equal(afterUnsafeImport.companions[0]?.id, beforeUnsafe.companions[0]?.id, "The current retinue must not be replaced");
    assert.equal(afterUnsafeImport.credits, beforeUnsafe.credits, "A rejected import must preserve campaign currency");
    assert.equal(afterUnsafeImport.turn, beforeUnsafe.turn, "A rejected import must preserve campaign time");
    assert.equal(await page.locator('img[src="x"]').count(), 0, "Imported markup must not inject an image element");
    assert.equal(await page.locator("#galaxy-svg [data-map-system]").count(), 200, "The current campaign should remain playable after a rejected import");
    console.log("PASS browser: malicious save import rejected, core campaign preserved and markup not injected");

    const [validChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.locator('button[data-action="import"]').click()
    ]);
    await validChooser.setFiles({
      name: "valid-pocket-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(beforeUnsafeImport)
    });
    await page.waitForFunction(() => document.body.innerText.includes("Campaign backup imported and validated."));
    const afterValidImport = await page.evaluate(() => JSON.parse(localStorage.getItem("voidreign-pocket-v2")));
    assert.equal(afterValidImport.companions.length, beforeUnsafe.companions.length, "A valid backup should restore the saved retinue");
    assert.equal(afterValidImport.systems.length, 200, "A valid backup should restore all systems");
    assert.equal(afterValidImport.rep, beforeUnsafe.rep, "A valid backup should retain negative reputation as a valid state");
    console.log("PASS browser: valid backup import restores a campaign with negative reputation");


    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, { timeout: 6000 }).catch(() => {});
    const serviceWorker = await page.evaluate(async () => ({
      supported: "serviceWorker" in navigator,
      controller: !!navigator.serviceWorker?.controller,
      registration: !!(await navigator.serviceWorker?.getRegistration())
    }));
    assert.ok(serviceWorker.supported && serviceWorker.registration, "PWA should register a service worker on localhost or HTTPS");
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
    assert.equal(await page.title(), "VOIDREIGN: Pocket Empire", "Offline reload should show cached game shell");
    assert.equal(
      await page.locator("#galaxy-svg [data-map-system]").count(),
      200,
      "Offline launch should still render all systems"
    );
    await context.setOffline(false);
    console.log("PASS browser: service worker registration and offline reload");

    assert.deepEqual(failures, [], "Browser should not produce JavaScript errors or console errors");
    console.log("PASS browser: zero uncaught JavaScript or console errors");
  } catch (error) {
    console.error("BROWSER QA FAILED:", error.stack || error);
    if (page) {
      try {
        console.error("PAGE:", await page.url());
        console.error("TITLE:", await page.title());
        console.error("BODY:", (await page.locator("body").innerText()).slice(0, 3000));
      } catch {}
    }
    console.error("RECORDED ERRORS:", JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})();
