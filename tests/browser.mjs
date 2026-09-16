import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.VESPER_URL || 'http://127.0.0.1:4173';
const output = path.resolve('test-results');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1060 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const watch = page => {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
};
watch(page);

try {
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle('Vesper — The Hollow Bell');
  await expect(page.locator('#begin-button')).toBeVisible();
  await page.waitForTimeout(1100);
  await page.screenshot({ path: path.join(output, '01-title-desktop.png'), fullPage: true });
  const pixels = await page.locator('#game').evaluate(canvas => {
    const data = canvas.getContext('2d').getImageData(0, 0, 960, 540).data;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 16) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    return colors.size;
  });
  assert.ok(pixels > 1000, `Expected richly rendered art, got ${pixels} colors`);

  await page.getByRole('button', { name: /How to play/ }).click();
  await expect(page.getByRole('heading', { name: 'Learn the hunt.' })).toBeVisible();
  assert.equal(await page.locator('.controls-table tbody tr').count(), 9);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-layer')).toBeHidden();
  await page.locator('[data-chapter="3"]').click();
  await expect(page.locator('#toast')).toContainText('Defeat');

  await page.locator('#begin-button').click();
  await expect(page.getByRole('heading', { name: 'The Gaslit Ward', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Carry the light' }).click();
  await expect(page.locator('#hud')).toBeVisible();
  const dev = await page.evaluate(() => !!window.__VESPER__);
  if (dev) {
    assert.equal(await page.evaluate(() => window.__VESPER__.audio.context.state), 'running');
    const startX = await page.evaluate(() => window.__VESPER__.game.player.x);
    await page.keyboard.down('d');
    await page.waitForTimeout(400);
    await page.keyboard.up('d');
    assert.ok(await page.evaluate(() => window.__VESPER__.game.player.x) > startX + 50);
    await page.keyboard.down('Space');
    await page.waitForTimeout(200);
    const height = await page.evaluate(() => window.__VESPER__.game.player.y);
    assert.ok(height < 340, `Jump did not rise: ${height}`);
    await page.keyboard.up('Space');
    await page.waitForTimeout(500);
    await page.keyboard.press('j');
    await page.waitForTimeout(80);
    assert.ok(await page.evaluate(() => window.__VESPER__.game.player.attack) > 0);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'A moment of silence.' })).toBeVisible();
    const pausedX = await page.evaluate(() => window.__VESPER__.game.player.x);
    await page.keyboard.press('d');
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.__VESPER__.game.player.x), pausedX);
    await page.locator('#modal').getByRole('button', { name: 'Settings', exact: true }).click();
    await page.locator('#setting-difficulty').selectOption('pilgrim');
    await page.locator('#setting-shake').uncheck();
    await page.getByRole('button', { name: 'Keep these settings' }).click();
    assert.equal(await page.evaluate(() => window.__VESPER__.game.settings.difficulty), 'pilgrim');
    assert.equal(await page.evaluate(() => window.__VESPER__.game.mode), 'playing');

    await page.evaluate(() => {
      const game = window.__VESPER__.game;
      game.player.x = 155; game.player.y = 404; game.player.grounded = true;
      game.player.vx = 0; game.player.vy = 0;
      game.save.echoes = 500;
    });
    await page.keyboard.press('e');
    await expect(page.getByRole('heading', { name: 'Keep a little morning.' })).toBeVisible();
    await page.locator('[data-upgrade="vitality"]').click();
    await page.locator('[data-upgrade="blade"]').click();
    assert.equal(await page.evaluate(() => window.__VESPER__.game.maxHp), 120);
    await page.getByRole('button', { name: 'Leave the lamp' }).click();

    await page.evaluate(() => {
      const game = window.__VESPER__.game;
      game.save.echoes = 77;
      game.player.safeX = 400;
      game.player.x = 400;
      game.player.invulnerable = 0;
      game.hurtPlayer(1000, null, false);
    });
    await expect(page.getByRole('heading', { name: 'The bell remembers.' })).toBeVisible({ timeout: 5000 });
    assert.equal(await page.evaluate(() => window.__VESPER__.game.save.echoes), 0);
    await page.getByRole('button', { name: 'Rise again' }).click();
    assert.equal(await page.evaluate(() => window.__VESPER__.game.mode), 'playing');
    await page.evaluate(() => {
      const game = window.__VESPER__.game;
      game.player.x = 400; game.player.y = 404;
      game.recoverEchoes();
    });
    assert.equal(await page.evaluate(() => window.__VESPER__.game.save.echoes), 77);

    for (let chapter = 0; chapter < 5; chapter++) {
      if (chapter > 0) {
        await expect(page.getByRole('button', { name: 'Carry the light' })).toBeVisible();
        await page.getByRole('button', { name: 'Carry the light' }).click();
      }
      await page.evaluate(() => {
        const g = window.__VESPER__.game;
        g.player.x = g.level.arena - 30; g.player.y = 404; g.player.vx = 0; g.player.vy = 0; g.player.invulnerable = 100;
      });
      await expect(page.locator('#boss-hud')).toBeVisible();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(output, `chapter-${chapter + 1}.png`), fullPage: true });
      await page.evaluate(() => {
        const g = window.__VESPER__.game;
        g.boss.hp = 1; g.boss.state = 'recover'; g.boss.timer = 20; g.boss.vx = 0;
        g.player.x = g.boss.x - 38; g.player.y = 404; g.player.facing = 1;
        g.player.stamina = 100; g.player.attack = 0; g.player.hurt = 0;
      });
      await page.keyboard.press('j');
      await page.waitForFunction(() => window.__VESPER__.game.boss.hp === 0);
      assert.equal(await page.evaluate(() => window.__VESPER__.game.save.defeated.includes(window.__VESPER__.game.save.chapter)), true);
      await page.evaluate(() => {
        const g = window.__VESPER__.game;
        g.player.x = g.level.width - 170; g.player.y = 404; g.player.vx = 0; g.player.vy = 0; g.player.grounded = true;
      });
      await page.keyboard.press('e');
    }
    await expect(page.getByRole('heading', { name: 'There is another way.' })).toBeVisible();
    await page.locator('[data-ending="dawn"]').click();
    await expect(page.getByRole('heading', { name: 'A little morning' })).toBeVisible();
    await page.getByRole('button', { name: 'Read your memories' }).click();
    await page.getByRole('button', { name: 'Close the archive' }).click();
    await expect(page.getByRole('heading', { name: 'A little morning' })).toBeVisible();
    await page.getByRole('button', { name: 'Return to Vesper' }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => window.__VESPER__.game.save.ending), 'dawn');
    assert.equal(await page.evaluate(() => window.__VESPER__.game.save.defeated.length), 5);
    assert.equal(await page.evaluate(() => window.__VESPER__.game.save.vitality), 1);
  } else {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: 'A moment of silence.' })).toBeVisible();
    await page.getByRole('button', { name: 'Return to title' }).click();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#begin-label')).toHaveText('Continue the pilgrimage');
    assert.equal(await page.evaluate(() => typeof window.__VESPER__), 'undefined');
  }

  const padContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await padContext.addInitScript(() => {
    window.testPad = { connected: true, axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })) };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [window.testPad] });
  });
  const padPage = await padContext.newPage();
  watch(padPage);
  await padPage.goto(baseURL, { waitUntil: 'networkidle' });
  const pressPad = async index => {
    await padPage.evaluate(i => { window.testPad.buttons[i].pressed = true; }, index);
    await padPage.waitForTimeout(90);
    await padPage.evaluate(i => { window.testPad.buttons[i].pressed = false; }, index);
    await padPage.waitForTimeout(90);
  };
  await pressPad(0);
  await expect(padPage.getByRole('button', { name: 'Carry the light' })).toBeVisible();
  await pressPad(0);
  await expect(padPage.locator('#modal-layer')).toBeHidden();
  await pressPad(9);
  await expect(padPage.getByRole('heading', { name: 'A moment of silence.' })).toBeVisible();
  await pressPad(1);
  await expect(padPage.locator('#modal-layer')).toBeHidden();
  await padContext.close();

  const corruptContext = await browser.newContext();
  await corruptContext.addInitScript(() => localStorage.setItem('vesper.save.v1', '{broken-save'));
  const corruptPage = await corruptContext.newPage();
  watch(corruptPage);
  await corruptPage.goto(baseURL, { waitUntil: 'networkidle' });
  await expect(corruptPage.locator('#toast')).toContainText('session-only');
  assert.equal(await corruptPage.evaluate(() => localStorage.getItem('vesper.save.v1')), '{broken-save');
  await corruptContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  watch(phone);
  await phone.goto(baseURL, { waitUntil: 'networkidle' });
  await phone.evaluate(() => document.fonts.ready);
  await phone.waitForTimeout(700);
  await phone.screenshot({ path: path.join(output, '02-title-mobile.png'), fullPage: true });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout overflows viewport');
  await phone.locator('#begin-button').tap();
  await phone.getByRole('button', { name: 'Carry the light' }).tap();
  await expect(phone.locator('#touch-controls')).toBeVisible();
  await phone.locator('[data-action="jump"]').tap();
  await phone.waitForTimeout(100);
  await phone.setViewportSize({ width: 844, height: 390 });
  await phone.waitForTimeout(350);
  await phone.screenshot({ path: path.join(output, '03-game-mobile-landscape.png'), fullPage: true });
  await expect(phone.locator('#game')).toBeVisible();
  await expect(phone.locator('#touch-controls')).toBeVisible();
  await phone.locator('#pause-button').tap();
  await expect(phone.getByRole('heading', { name: 'A moment of silence.' })).toBeVisible();
  await mobile.close();

  await page.bringToFront();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.locator('#sound-button').click();
  await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed', 'false');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#begin-button').click();
  await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed', 'false');

  assert.deepEqual(errors, [], `Browser errors:\n${errors.join('\n')}`);
  console.log(`Browser checks passed (${dev ? 'development: combat, all five gates, ending, persistence, audio, desktop and touch' : 'production: title, start, pause, persistence and touch'}).`);
  console.log(`Screenshots: ${output}`);
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
  console.error('Browser errors:', errors);
  throw error;
} finally {
  await browser.close();
}
