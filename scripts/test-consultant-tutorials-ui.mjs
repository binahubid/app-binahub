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
const catalog = [["F", "fitur", 21], ["S", "sop", 8]].flatMap(([prefix, series, count]) =>
  Array.from({ length: count }, (_, index) => ({
    id: prefix + String(index + 1).padStart(2, "0"), series,
    title: `Tutorial ${prefix}${String(index + 1).padStart(2, "0")}`, description: "Episode sintetis untuk pengujian navigasi.",
    duration: "0:04", drive: { fileId: `synthetic-file-0000000000-${prefix}${index + 1}` },
  })),
);
const videoBytes = await readFile("tools/fixtures/tutorial-test.mp4");
for (const episode of catalog) {
  episode.versions = {
    en: {
      title: "English episode " + episode.id,
      duration: "0:04",
      drive: { fileId: "synthetic-english-000000000-" + episode.id },
    },
  };
  if (episode.series === "sop") {
    episode.versions.mobile = {
      duration: "0:05",
      drive: { fileId: "synthetic-mobile-000000000-" + episode.id },
    };
  }
}
const status = { membership: 200 };
const requests = [];
const server = createServer((request, response) => {
  requests.push({ method: request.method, path: request.url });
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "authorization, content-type, x-request-id");
  if (request.method === "OPTIONS") return response.writeHead(204).end();
  if (request.url === "/api/konsultan/session" || request.url === "/api/konsultan/materials/catalog") {
    const code = request.headers.authorization === `Bearer ${accessToken}` ? status.membership : 401;
    response.writeHead(code);
    return response.end(JSON.stringify(code === 200
      ? request.url.endsWith("/catalog") ? catalog : { id: user.id, name: "Konsultan BinaHub", role: "consultant", isAdmin: false }
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
  const sanitized = await allowed.json();
  assert.deepEqual(sanitized.map(({ id }) => id), catalog.map(({ id }) => id));
  assert.doesNotMatch(JSON.stringify(sanitized), /"(?:drive|fileId|resourceKey)":/);
  assert.equal(new Set(catalog.map((item) => item.drive.fileId)).size, 29);

  for (const width of [1440, 1024, 390, 320]) {
    const context = await browser.newContext({ bypassCSP: true, viewport: { width, height: 900 } });
    await context.addCookies([{ name: "sb-127-auth-token", value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"), url: origin }]);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // Use a valid synthetic MP4 so native controls and playback are exercised.
    // The authenticated media route and real Drive ranges are checked separately.
    await page.route(origin + "/konsultan/materials/tutorial/media/**", (route) => route.fulfill({
      contentType: "video/mp4", body: videoBytes,
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
    assert.equal(await page.getByRole("link", { name: /Baca .* di web/ }).count(), 2);
    await page.getByRole("link", { name: /^Persiapan meeting/ }).click();
    await page.getByRole("heading", { name: "Tutorial S03" }).waitFor();
    assert.equal(await page.locator("video").getAttribute("src"), "/konsultan/materials/tutorial/media/S03");
    await page.goBack();
    await page.getByRole("link", { name: "Lihat video" }).click();
    await page.waitForURL(origin + "/konsultan/materials/tutorial");
    const player = page.locator("video");
    await player.waitFor();
    await player.evaluate((video) => video.play());
    await page.waitForFunction(() => document.querySelector("video").currentTime > 0.1);
    assert(await player.evaluate((video) => video.controls && video.playsInline && video.videoWidth === 640));
    assert.equal(await player.evaluate((video) => getComputedStyle(video).objectFit), "contain");
    const frame = await player.boundingBox();
    assert(Math.abs(frame.width / frame.height - 16 / 9) < 0.01);
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 21);
    assert.equal(await page.locator("iframe").count(), 0);
    assert.equal(await player.getAttribute("src"), "/konsultan/materials/tutorial/media/F01");

    await page.getByRole("group", { name: "Seri tutorial" }).getByRole("button", { name: "Alur kerja" }).click();
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 8);
    await page.getByRole("button", { name: /S06/ }).click();
    await page.getByRole("heading", { name: catalog.find((item) => item.id === "S06").title }).waitFor();
    assert.equal(await player.getAttribute("src"), "/konsultan/materials/tutorial/media/S06");
    assert.equal(await page.getByRole("link", { name: "Buka di Drive" }).count(), 0);
    assert.equal(await page.locator("video").count(), 1);

    const search = page.getByRole("searchbox", { name: "Cari episode" });
    await search.fill("S08");
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 1);
    await search.fill("tidak ada episode seperti ini");
    await page.getByRole("status", { name: "" }).filter({ hasText: "Tidak ada episode" }).waitFor();
    await search.fill("");
    await page.getByRole("button", { name: /S01/ }).click();
    if (width < 1100) {
      await page.waitForFunction(() => {
        const player = document.querySelector("section[aria-labelledby=tutorial-now-playing]");
        const { top, bottom } = player.querySelector("video").getBoundingClientRect();
        const bar = document.querySelector("header");
        const visibleTop = bar && getComputedStyle(bar).position === "sticky" ? bar.getBoundingClientRect().bottom : 0;
        return player === document.activeElement && top >= visibleTop - 1 && top < visibleTop + 150 && bottom <= innerHeight;
      });
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const version = page.getByRole("combobox", { name: "Versi video" });
    await version.selectOption("en");
    await page.getByRole("heading", { name: "English episode S01" }).waitFor();
    assert.equal(await player.getAttribute("src"), "/konsultan/materials/tutorial/media/S01?version=en");
    assert.equal(await page.getByRole("link", { name: "Buka di Drive" }).count(), 0);
    await page.getByRole("button", { name: "Fitur portal" }).click();
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 21);
    await page.getByRole("button", { name: /English episode F02/ }).click();
    assert.equal(await player.getAttribute("src"), "/konsultan/materials/tutorial/media/F02?version=en");
    await version.selectOption("mobile");
    await page.getByRole("heading", { name: "Tutorial S01" }).waitFor();
    assert.equal(await player.getAttribute("src"), "/konsultan/materials/tutorial/media/S01?version=mobile");
    assert.equal(await page.getByRole("link", { name: "Buka di Drive" }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Fitur portal" }).count(), 0);
    assert.equal(await page.locator("section[aria-labelledby=tutorial-playlist] li").count(), 8);
    const portrait = await player.boundingBox();
    assert(Math.abs(portrait.width / portrait.height - 9 / 16) < 0.01);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `tmp/consultant-drive/library-${width}.png`, fullPage: width >= 1100 });
    assert.deepEqual(errors, []);
    await context.close();
  }
  assert(requests.every((request) => ["GET", "OPTIONS"].includes(request.method)));
  console.log("Verified private catalog access, native playback, all three video versions, series, search, and portrait layout at four viewport widths.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
