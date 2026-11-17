import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const origin = "http://127.0.0.1:4390";
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "consultant@example.invalid",
  role: "authenticated",
  app_metadata: { role: "consultant" },
  user_metadata: { full_name: "Konsultan BinaHub" },
  aud: "authenticated",
};
const tokenPart = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = `${tokenPart({ alg: "HS256", typ: "JWT" })}.${tokenPart({ sub: user.id, exp: 4102444800, role: "authenticated" })}.synthetic`;
const session = { access_token: accessToken, refresh_token: "synthetic", expires_at: 4102444800, expires_in: 86400, token_type: "bearer", user };
const catalog = JSON.parse(await readFile("src/app/konsultan/materials/tutorial/catalog/episodes.json", "utf8"));
const status = { membership: 200 };
const requests = [];
const server = createServer((request, response) => {
  requests.push({ method: request.method, path: request.url });
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "authorization, content-type, x-request-id");
  if (request.method === "OPTIONS") return response.writeHead(204).end();
  if (request.url === "/api/konsultan/session") {
    const code = request.headers.authorization === `Bearer ${accessToken}` ? status.membership : 401;
    response.writeHead(code);
    return response.end(JSON.stringify(code === 200
      ? { id: user.id, name: "Konsultan BinaHub", role: "consultant", isAdmin: false }
      : { error: "Synthetic session failure" }));
  }
  if (request.url === "/auth/v1/user") return response.end(JSON.stringify(user));
  response.writeHead(404).end("{}");
});
await new Promise((resolve) => server.listen(4389, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir("tmp/consultant-drive", { recursive: true });
try {
  const endpoint = `${origin}/konsultan/materials/tutorial/catalog`;
  assert.equal((await fetch(endpoint)).status, 401);
  for (const failure of [401, 403, 503]) {
    status.membership = failure;
    const denied = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
    assert.equal(denied.status, failure);
    assert.equal((await denied.text()).includes(catalog[0].drive.fileId), false);
  }
  status.membership = 200;
  const allowed = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  assert.equal(allowed.status, 200);
  assert.match(allowed.headers.get("cache-control"), /private.*no-store/);
  assert.deepEqual(await allowed.json(), catalog);
  assert.equal(new Set(catalog.map((item) => item.drive.fileId)).size, 29);

  for (const width of [1440, 1024, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), url: origin }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Keep UI regression checks deterministic. Live Drive playback is checked
    // separately against the real provider using the same preview URLs.
    await page.route("https://drive.google.com/file/d/**", (route) => route.fulfill({
      contentType: "text/html", body: "<!doctype html><title>Drive player fixture</title><p>Video preview</p>",
    }));
    const materials = await page.goto(origin + "/konsultan/materials");
    assert.equal(materials.status(), 200);
    assert(!materials.headers()["content-security-policy"].includes("drive.google.com"));
    try {
      await page.getByRole("heading", { name: "Materi konsultan" }).waitFor({ timeout: 15000 });
    } catch (error) {
      console.log('Rendered page', page.url(), (await page.locator('body').innerText()).slice(0, 900));
      console.log('Browser errors', errors);
      console.log('Fixture requests', requests.slice(-12));
      await page.screenshot({path:'tmp/consultant-drive/ui-error.png'});
      throw error;
    }
    assert.equal(await page.getByRole("link", { name: /Baca .* di web/ }).count(), 4);
    const tutorialNavigation = page.waitForEvent("response", (response) =>
      response.request().isNavigationRequest() && response.url() === origin + "/konsultan/materials/tutorial");
    await page.getByRole("link", { name: "Lihat video" }).click();
    const tutorialResponse = await tutorialNavigation;
    assert(tutorialResponse.headers()["content-security-policy"].includes("frame-src 'self' blob: https://drive.google.com/file/d/"));
    await page.locator("iframe[title^='Video F01']").waitFor();
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 21);
    assert.equal(await page.locator("iframe").count(), 1);
    assert.equal(await page.locator("iframe").getAttribute("src"), `https://drive.google.com/file/d/${catalog[0].drive.fileId}/preview`);

    await page.getByRole("group", { name: "Seri tutorial" }).getByRole("button", { name: "Alur kerja" }).click();
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 8);
    await page.getByRole("button", { name: /S06/ }).click();
    await page.getByRole("heading", { name: catalog.find((item) => item.id === "S06").title }).waitFor();
    const selected = catalog.find((item) => item.id === "S06");
    assert.equal(await page.locator("iframe").getAttribute("src"), `https://drive.google.com/file/d/${selected.drive.fileId}/preview`);
    assert.equal(await page.getByRole("link", { name: "Buka di Drive" }).getAttribute("href"), `https://drive.google.com/file/d/${selected.drive.fileId}/view`);
    assert.equal(await page.locator("iframe").count(), 1);

    const search = page.getByRole("searchbox", { name: "Cari episode" });
    await search.fill("S08");
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 1);
    await search.fill("tidak ada episode seperti ini");
    await page.getByRole("status", { name: "" }).filter({ hasText: "Tidak ada episode" }).waitFor();
    await search.fill("");
    await page.getByRole("button", { name: /S01/ }).click();
    if (width < 1100) {
      await page.waitForFunction(() => {
        const top = document.querySelector("section[aria-labelledby=tutorial-now-playing]").getBoundingClientRect().top;
        return top >= 50 && top < 150;
      });
      const playerTop = await page.locator("section[aria-labelledby=tutorial-now-playing]").evaluate((element) => element.getBoundingClientRect().top);
      assert(playerTop >= 50 && playerTop < 150, `Selected player not visible on ${width}px: ${playerTop}`);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `tmp/consultant-drive/library-${width}.png`, fullPage: width >= 1100 });
    assert.deepEqual(errors, []);
    await context.close();
  }
  assert(requests.every((request) => ["GET", "OPTIONS"].includes(request.method)));
  console.log("Verified private catalog access, 29 Drive links, document entry, scoped CSP, search, series, player replacement, and mobile layout at four widths.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
