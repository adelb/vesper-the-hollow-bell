import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.VESPER_URL || 'http://127.0.0.1:4173';
const output = path.resolve('test-results');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1060 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const watch = page => {
  page.on('pageerror', error => errors.push(error.stack || error.message));
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
  assert.equal(await page.locator('.controls-table tbody tr').count(), 10);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-layer')).toBeHidden();
  await page.locator('[data-chapter="3"]').click();
  await expect(page.locator('#toast')).toContainText('Defeat');

  await page.locator('#begin-button').click();
  await expect(page.locator('#cinematic-overlay')).toBeVisible();
  await expect(page.locator('#cinematic-title')).toHaveText('Before the long night');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(output, '04-prologue.png'), fullPage: true });
  await page.locator('#cinematic-next').click();
  await expect(page.locator('#cinematic-title')).toHaveText('A beautiful mistake');
  await page.locator('#cinematic-next').click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(output, '05-mara-prologue.png'), fullPage: true });
  await page.locator('#cinematic-next').click();
  await expect(page.locator('#cinematic-title')).toHaveText('The hundredth bell');
  await page.waitForTimeout(650);
  await page.screenshot({ path: path.join(output, '06-hundredth-bell.png'), fullPage: true });
  await page.locator('#cinematic-next').click();
  await expect(page.locator('#cinematic-title')).toHaveText('Carry a little morning');
  await page.locator('#cinematic-next').click();
  await expect(page.getByRole('heading', { name: 'The Gaslit Ward', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Carry the light' }).click();
  await expect(page.locator('#hud')).toBeVisible();
  const dev = await page.evaluate(() => !!window.__VESPER__);
  if (dev) {
    assert.equal(await page.evaluate(() => window.__VESPER__.audio.context.state), 'running');
    await page.evaluate(() => { window.__VESPER__.game.mode = 'paused'; });
    const bestiary = await page.evaluate(async () => {
      const { drawEnemy, drawBoss } = await import('/src/actors.js');
      const { ATTACKS } = await import('/src/attacks.js');
      const { freshSave } = await import('/src/storage.js');
      const { CHAPTERS, ENEMY_CAST, BOSS_DRAMA } = await import('/src/content.js');
      const { game: live, renderer } = window.__VESPER__;
      const canvas = document.createElement('canvas'), c = canvas.getContext('2d');
      canvas.width = 1500; canvas.height = 870;
      c.fillStyle = '#0d1a23'; c.fillRect(0, 0, canvas.width, canvas.height);
      const make = chapter => new live.constructor({ ...freshSave(), chapter, unlocked: 4, prologueSeen: true }, { ...live.settings });
      const heading = (text, x, y, size = 17) => { c.fillStyle = '#dac598'; c.font = `${size}px Georgia`; c.textAlign = 'center'; c.fillText(text, x, y); };
      for (let chapter = 0; chapter < 5; chapter++) {
        const g = make(chapter);
        heading(CHAPTERS[chapter].name, chapter * 300 + 150, 25, 16);
        for (const [row, kind] of ['husk', 'acolyte', 'brute'].entries()) {
          const enemy = { ...g.enemies.find(e => e.kind === kind), x: 0, y: 0, facing: 1 };
          enemy.pattern = enemy.species.patterns[0]; enemy.state = 'windup'; enemy.windupDuration = ATTACKS[enemy.pattern].windup; enemy.timer = enemy.windupDuration * 0.45;
          c.save(); c.translate(chapter * 300 + 140, row * 275 + 220); c.scale(2.3, 2.3); c.translate(-enemy.w / 2, -enemy.h);
          drawEnemy(c, enemy, 6); c.restore();
          heading(enemy.species.name, chapter * 300 + 150, row * 275 + 246);
          heading(ATTACKS[enemy.pattern].name, chapter * 300 + 150, row * 275 + 266, 12);
        }
      }
      const enemies = canvas.toDataURL();
      canvas.width = 1700; canvas.height = 940;
      c.fillStyle = '#101b24'; c.fillRect(0, 0, canvas.width, canvas.height);
      for (let chapter = 0; chapter < 5; chapter++) for (let phase = 1; phase <= 2; phase++) {
        const g = make(chapter), e = g.boss;
        if (phase === 2) g.mutateBoss();
        e.facing = 1; e.pattern = phase === 1 ? e.drama.opening[0] : e.drama.patterns[0];
        e.state = 'windup'; e.windupDuration = ATTACKS[e.pattern].windup; e.timer = e.windupDuration * 0.45;
        c.save(); c.translate(chapter * 340 + 170, (phase - 1) * 460 + 365); c.scale(1.35, 1.35); c.translate(-e.x - e.w / 2, -e.y - e.h);
        drawBoss(c, e, 6); c.restore();
        heading(phase === 1 ? e.name : e.drama.mutation, chapter * 340 + 170, (phase - 1) * 460 + 405, 18);
        heading(phase === 1 ? 'FALLEN GUARDIAN' : 'SECOND AWAKENING', chapter * 340 + 170, (phase - 1) * 460 + 432, 11);
      }
      const bosses = canvas.toDataURL(), impacts = {}, scenes = {};
      canvas.width = 960; canvas.height = 540;
      const r = new renderer.constructor(canvas, { ...live.settings, shake: false });
      for (let chapter = 0; chapter < 5; chapter++) {
        const g = make(chapter); g.mode = 'playing';
        for (const [index, memory] of g.level.memories.entries()) {
          g.player.x = memory.x - 90; g.player.y = memory.y - g.player.h; g.camera = memory.x - 480;
          r.render(g, 6);
          scenes[`extended-route-${chapter + 1}-${index + 1}`] = canvas.toDataURL();
        }
        g.boss.active = true; g.beginBossCinematic('boss-intro');
        for (const [index, progress] of [0.14, 0.4, 0.7].entries()) {
          g.cinematic.elapsed = g.cinematic.duration * progress;
          r.render(g, g.cinematic.elapsed);
          scenes[`entrance-stage-${chapter + 1}-${index + 1}`] = canvas.toDataURL();
        }
      }
      let rendered = 0;
      for (const [pattern, a] of Object.entries(ATTACKS)) {
        let chapter = ENEMY_CAST.findIndex(cast => Object.values(cast).some(s => s.patterns.includes(pattern)));
        const ordinary = chapter >= 0;
        if (!ordinary) chapter = BOSS_DRAMA.findIndex(b => [...b.opening, ...b.patterns].includes(pattern));
        const g = make(chapter), e = ordinary ? g.enemies.find(e => e.species.patterns.includes(pattern)) : g.boss;
        g.mode = 'playing';
        if (!ordinary) { e.active = true; if (!e.drama.opening.includes(pattern)) g.mutateBoss(); }
        g.player.x = e.x - 130; g.player.invulnerable = 100; g.camera = Math.max(0, e.x - 550);
        e.facing = -1; e.pattern = pattern; e.state = 'windup'; e.timer = a.windup; e.windupDuration = a.windup; e.targetX = g.player.x; e.targetY = g.player.y + 24;
        g.prepareSignature(e);
        for (let frame = 0; frame < Math.ceil((a.windup + a.duration + 0.3) * 60); frame++) {
          g.time += 1 / 60; g.updateEnemy(e, 1 / 60); g.updateProjectiles(1 / 60); g.updateEffects(1 / 60);
          if (frame % 20 === 0) { r.render(g, g.time); rendered++; }
          if (!ordinary && frame === Math.floor((a.windup + 0.2) * 60)) { r.render(g, g.time); impacts[pattern] = canvas.toDataURL(); }
        }
      }
      return { enemies, bosses, impacts, scenes, rendered };
    });
    assert.ok(bestiary.rendered > 250);
    for (const [name, data] of Object.entries({ 'enemy-bestiary': bestiary.enemies, 'guardian-bestiary': bestiary.bosses, ...bestiary.impacts, ...bestiary.scenes })) {
      await writeFile(path.join(output, `${name}.png`), Buffer.from(data.split(',')[1], 'base64'));
    }
    const visualMetrics = await page.evaluate(() => {
      const { renderer } = window.__VESPER__, original = { ...renderer.settings };
      renderer.settings.particles = false;
      const compare = (a, b) => {
        let changed = 0;
        for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) changed++;
        return changed;
      };
      const frame = (chapter, time) => { renderer.background(chapter, 0, time); return renderer.ctx.getImageData(0, 0, 960, 540).data; };
      const animated = [0, 1, 2, 3, 4].map(i => compare(frame(i, 10), frame(i, 14)));
      renderer.settings.reducedMotion = true;
      const reduced = compare(frame(3, 10), frame(3, 14));
      Object.assign(renderer.settings, original);
      return { animated, reduced };
    });
    assert.ok(visualMetrics.animated.every(n => n > 1000), `World animation is too static: ${JSON.stringify(visualMetrics)}`);
    assert.equal(visualMetrics.reduced, 0, 'Reduced-motion mode should freeze background animation');

    const instrumentMetrics = await page.evaluate(async () => {
      const Audio = window.__VESPER__.audio.constructor;
      const metrics = [];
      for (const instrument of ['felt', 'harp', 'choir', 'glass', 'strings', 'organ', 'cello']) {
        const engine = new Audio({ sound: true, music: 1, effects: 1 }, message => { throw new Error(message); });
        const c = new OfflineAudioContext(1, 44100 * 2, 44100);
        engine.context = c; engine.score = c.createGain(); engine.score.connect(c.destination);
        engine.noiseBuffer = c.createBuffer(1, 44100, 44100);
        const noise = engine.noiseBuffer.getChannelData(0);
        for (let i = 0; i < noise.length; i++) noise[i] = Math.sin(i * 31.37) * 0.5;
        engine.instrument(instrument, 62, 0.05, 1.6, 0.12);
        const data = (await c.startRendering()).getChannelData(0);
        let squares = 0, crossings = 0, peak = 0;
        for (let i = 1; i < data.length; i++) { squares += data[i] * data[i]; peak = Math.max(peak, Math.abs(data[i])); if (data[i] >= 0 && data[i - 1] < 0) crossings++; }
        metrics.push({ instrument, rms: Math.sqrt(squares / data.length), crossings, peak });
      }
      return metrics;
    });
    assert.ok(instrumentMetrics.every(m => m.rms > 0.005 && m.peak < 1), `Silent or clipped instruments: ${JSON.stringify(instrumentMetrics)}`);
    assert.equal(new Set(instrumentMetrics.map(m => `${m.rms.toFixed(4)}:${m.crossings}`)).size, 7);
    const scoreMetrics = await page.evaluate(async () => {
      const { SCORES, scoreBeat } = await import('/src/audio.js');
      const metrics = [], Audio = window.__VESPER__.audio.constructor;
      for (let chapter = 0; chapter < 5; chapter++) for (let phase = 0; phase < 3; phase++) {
        const score = SCORES[chapter], step = 30 / (score.tempo * (phase === 2 ? 1.72 : phase === 1 ? 1.45 : 1));
        const count = score.meter * 8, c = new OfflineAudioContext(1, Math.ceil(22050 * ((count + 12) * step + 0.1)), 22050);
        const engine = new Audio({ sound: true, music: 1, effects: 1 }, message => { throw new Error(message); });
        engine.context = c; engine.boss = phase > 0; engine.phase = phase || 1; engine.chapter = chapter;
        engine.score = c.createGain(); engine.score.connect(c.destination);
        engine.noiseBuffer = c.createBuffer(1, 22050, 22050);
        const noise = engine.noiseBuffer.getChannelData(0);
        for (let i = 0; i < noise.length; i++) noise[i] = Math.sin(i * 31.37) * 0.5;
        for (let beat = 0; beat < count; beat++) engine.perform(scoreBeat(chapter, beat, phase > 0, phase || 1), 0.05 + beat * step, step);
        const data = (await c.startRendering()).getChannelData(0);
        let squares = 0, peak = 0, crossings = 0;
        for (let i = 1; i < data.length; i++) { squares += data[i] ** 2; peak = Math.max(peak, Math.abs(data[i])); if (data[i] >= 0 && data[i - 1] < 0) crossings++; }
        metrics.push({ chapter, phase, rms: Math.sqrt(squares / data.length), peak, crossings });
      }
      return metrics;
    });
    assert.ok(scoreMetrics.every(m => m.rms > 0.008 && m.peak < 0.95), `Silent or clipped scores: ${JSON.stringify(scoreMetrics)}`);
    assert.equal(new Set(scoreMetrics.map(m => `${m.rms.toFixed(4)}:${m.crossings}`)).size, 15);
    const explorationLoudness = scoreMetrics.filter(m => m.phase === 0).map(m => m.rms);
    assert.ok(Math.max(...explorationLoudness) / Math.min(...explorationLoudness) < 2.5, 'District music levels should remain balanced');
    await writeFile(path.join(output, 'score-metrics.json'), JSON.stringify(scoreMetrics, null, 2));
    await page.evaluate(() => {
      const g = window.__VESPER__.game, memory = g.level.memories[0];
      g.mode = 'playing'; g.player.x = memory.x - 12; g.player.y = memory.y - 48; g.player.grounded = true; g.camera = memory.x - 480;
    });
    await page.keyboard.press('e');
    await expect(page.getByRole('heading', { name: 'The last lamp on the roof' })).toBeVisible();
    await page.getByRole('button', { name: 'Remember', exact: false }).click();
    await page.locator('.masthead [data-open="journal"]').click();
    await expect(page.getByRole('heading', { name: 'The last lamp on the roof' })).toBeVisible();
    await page.getByRole('button', { name: 'Close the archive' }).click();
    await page.evaluate(() => { const g = window.__VESPER__.game; g.loadChapter(0, 0); g.mode = 'playing'; });
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

    await page.evaluate(() => {
      const g = window.__VESPER__.game;
      g.player.x = 220; g.player.y = 404; g.player.vx = 0; g.player.vy = 0; g.player.grounded = true;
      g.player.stamina = 100; g.player.dashCooldown = 0; g.player.invulnerable = 100;
    });
    await page.keyboard.down('d');
    await page.keyboard.down('Shift');
    await page.waitForTimeout(40);
    await page.keyboard.press('j');
    await page.waitForTimeout(80);
    assert.equal(await page.evaluate(() => window.__VESPER__.game.player.attackKind), 'wakecut');
    await page.screenshot({ path: path.join(output, '07-wakecut.png'), fullPage: true });
    await page.keyboard.up('Shift'); await page.keyboard.up('d');
    await page.waitForTimeout(450);
    await page.evaluate(() => { const p = window.__VESPER__.game.player; p.x = 220; p.y = 404; p.vx = 0; p.vy = 0; p.grounded = true; p.stamina = 100; p.attack = 0; p.airDash = true; });
    await page.keyboard.down('Space');
    await page.waitForTimeout(150);
    await page.keyboard.down('w');
    await page.keyboard.down('Shift');
    await page.waitForTimeout(75);
    assert.equal(await page.evaluate(() => window.__VESPER__.game.player.dashY), -1);
    await page.screenshot({ path: path.join(output, '08-air-step.png'), fullPage: true });
    await page.keyboard.up('Shift'); await page.keyboard.up('w'); await page.keyboard.up('Space');
    await page.waitForTimeout(190);
    await page.keyboard.press('k');
    await page.waitForTimeout(75);
    assert.equal(await page.evaluate(() => window.__VESPER__.game.player.plunge), true);
    await page.screenshot({ path: path.join(output, '09-bellfall.png'), fullPage: true });
    await page.waitForFunction(() => window.__VESPER__.game.player.grounded);
    await page.screenshot({ path: path.join(output, '10-bellfall-impact.png'), fullPage: true });

    for (let chapter = 0; chapter < 5; chapter++) {
      if (chapter > 0) {
        await expect(page.getByRole('button', { name: 'Carry the light' })).toBeVisible();
        await page.getByRole('button', { name: 'Carry the light' }).click();
      }
      await page.evaluate(() => {
        const g = window.__VESPER__.game;
        g.player.x = g.npc.x - 35; g.player.y = g.npc.y - g.player.h; g.player.vx = 0; g.player.vy = 0; g.player.grounded = true; g.player.invulnerable = 100;
        g.camera = 0;
      });
      const survivorPixels = await page.evaluate(() => {
        const { game: g, renderer: r } = window.__VESPER__, x = g.npc.x;
        const frame = () => { r.render(g, 12); return r.ctx.getImageData(x - g.camera - 20, g.npc.y - 80, 40, 80).data; };
        const visible = frame();
        g.npc.x = -1000;
        const absent = frame();
        g.npc.x = x;
        r.render(g, 12);
        let changed = 0;
        for (let i = 0; i < visible.length; i += 4) if (visible[i] !== absent[i] || visible[i + 1] !== absent[i + 1] || visible[i + 2] !== absent[i + 2]) changed++;
        return changed;
      });
      assert.ok(survivorPixels > 250, `Chapter ${chapter + 1}: survivor sprite missing before the boss (${survivorPixels} pixels)`);
      await page.keyboard.press('e');
      await expect(page.locator('#dialogue-overlay')).toBeVisible();
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(output, `survivor-${chapter + 1}.png`), fullPage: true });
      if (chapter === 0) {
        await page.locator('.masthead [data-open="controls"]').click();
        await page.getByRole('button', { name: 'Accessibility & difficulty' }).click();
        await page.getByRole('button', { name: 'Keep these settings' }).click();
        assert.equal(await page.evaluate(() => window.__VESPER__.audio.paused), true, 'Closing settings must preserve conversation music ducking');
      }
      for (let i = 0; i < 3; i++) await page.locator('[data-dialogue-next]').click();
      await expect(page.locator('[data-dialogue-choice="0"]')).toBeVisible();
      await page.locator('[data-dialogue-choice="0"]').click();
      for (let i = 0; i < 2; i++) await page.locator('[data-dialogue-next]').click();
      await page.locator('[data-dialogue-leave]').click();
      assert.equal(await page.evaluate(() => window.__VESPER__.game.save.talked.includes(window.__VESPER__.game.save.chapter)), true);
      await page.evaluate(() => {
        const g = window.__VESPER__.game;
        g.player.x = g.level.arena - 30; g.player.y = 404; g.player.vx = 0; g.player.vy = 0; g.player.invulnerable = 100;
      });
      await expect(page.locator('#cinematic-overlay')).toHaveClass(/boss-scene/);
      await expect(page.locator('#cinematic-overlay')).toBeVisible();
      await page.waitForFunction(() => {
        const shot = window.__VESPER__.game.cinematic;
        return shot?.kind === 'boss-intro' && shot.elapsed / shot.duration >= 0.69;
      });
      await expect(page.locator('#cinematic-title')).toHaveCSS('opacity', '1');
      await page.screenshot({ path: path.join(output, `guardian-intro-${chapter + 1}.png`), fullPage: true });
      await page.locator('#cinematic-next').click();
      await expect(page.locator('#boss-hud')).toBeVisible();
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(output, `chapter-${chapter + 1}.png`), fullPage: true });
      await page.evaluate(() => {
        const g = window.__VESPER__.game;
        g.boss.hp = g.boss.maxHp * 0.5 + 1; g.boss.state = 'recover'; g.boss.timer = 20; g.boss.vx = 0;
        g.player.x = g.boss.x - 38; g.player.y = 404; g.player.facing = 1;
        g.player.stamina = 100; g.player.attack = 0; g.player.hurt = 0;
      });
      await page.keyboard.press('j');
      await expect(page.locator('#cinematic-overlay')).toHaveClass(/mutation-scene/);
      await page.waitForFunction(() => window.__VESPER__.game.boss.phase === 2);
      await page.screenshot({ path: path.join(output, `guardian-mutation-${chapter + 1}.png`), fullPage: true });
      const mutatedName = await page.evaluate(() => window.__VESPER__.game.boss.drama.mutation);
      await expect(page.locator('#cinematic-title')).toHaveText(mutatedName);
      await page.locator('#cinematic-next').click();
      await expect(page.locator('#boss-name')).toHaveText(mutatedName);
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
  await expect(padPage.locator('#cinematic-overlay')).toBeVisible();
  await pressPad(1);
  await expect(padPage.getByRole('button', { name: 'Carry the light' })).toBeVisible();
  await pressPad(0);
  await expect(padPage.locator('#modal-layer')).toBeHidden();
  await pressPad(9);
  await expect(padPage.getByRole('heading', { name: 'A moment of silence.' })).toBeVisible();
  await pressPad(1);
  await expect(padPage.locator('#modal-layer')).toBeHidden();
  if (dev) {
    await padPage.evaluate(() => { const g = window.__VESPER__.game; g.player.x = g.level.arena - 30; });
    await expect(padPage.locator('#cinematic-overlay')).toBeVisible();
    await padPage.locator('.masthead [data-open="chapters"]').click();
    await padPage.locator('[data-travel="0"]').click();
    await expect(padPage.getByRole('button', { name: 'Carry the light' })).toBeVisible();
    assert.equal(await padPage.evaluate(() => window.__VESPER__.game.cinematic), null);
    assert.equal(await padPage.evaluate(() => window.__VESPER__.audio.cinematic), false, 'Travel must release cinematic music ducking');
  }
  await padContext.close();

  const corruptContext = await browser.newContext();
  await corruptContext.addInitScript(() => localStorage.setItem('vesper.save.v1', '{broken-save'));
  const corruptPage = await corruptContext.newPage();
  watch(corruptPage);
  await corruptPage.goto(baseURL, { waitUntil: 'networkidle' });
  await expect(corruptPage.locator('#toast')).toContainText('session-only');
  assert.equal(await corruptPage.evaluate(() => localStorage.getItem('vesper.save.v1')), '{broken-save');
  await corruptContext.close();

  const legacyContext = await browser.newContext();
  await legacyContext.addInitScript(() => localStorage.setItem('vesper.save.v1', JSON.stringify({ version: 1, chapter: 3, unlocked: 3, checkpoint: 1, echoes: 321, vitality: 2, blade: 3, defeated: [0, 1, 2], notes: [1], deaths: 8, bloodstain: null, ending: null, started: true, playtime: 913 })));
  const legacyPage = await legacyContext.newPage();
  watch(legacyPage);
  await legacyPage.goto(baseURL, { waitUntil: 'networkidle' });
  await legacyPage.locator('#begin-button').click();
  await expect(legacyPage.locator('#cinematic-overlay')).toBeVisible();
  await legacyPage.locator('#cinematic-skip').click();
  await expect(legacyPage.getByRole('heading', { name: 'The Astral Spire', exact: true })).toBeVisible();
  await legacyPage.getByRole('button', { name: 'Carry the light' }).click();
  await expect(legacyPage.locator('#health-value')).toHaveText('140 / 140');
  const restored = await legacyPage.evaluate(() => JSON.parse(localStorage.getItem('vesper.save.v1')));
  assert.equal(restored.blade, 3); assert.equal(restored.echoes, 321); assert.deepEqual(restored.defeated, [0, 1, 2]); assert.equal(restored.prologueSeen, true);
  await legacyContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  watch(phone);
  await phone.goto(baseURL, { waitUntil: 'networkidle' });
  await phone.evaluate(() => document.fonts.ready);
  await phone.waitForTimeout(700);
  await phone.screenshot({ path: path.join(output, '02-title-mobile.png'), fullPage: true });
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout overflows viewport');
  await phone.locator('#begin-button').tap();
  await expect(phone.locator('#cinematic-overlay')).toBeVisible();
  await phone.screenshot({ path: path.join(output, '11-prologue-mobile.png'), fullPage: true });
  await phone.locator('#cinematic-skip').tap();
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
  if (dev) {
    await phone.setViewportSize({ width: 390, height: 844 });
    await phone.getByRole('button', { name: 'Return to the hunt' }).tap();
    await expect(phone.locator('#modal-layer')).toBeHidden();
    for (let chapter = 0; chapter < 5; chapter++) {
      await phone.evaluate(index => {
        const g = window.__VESPER__.game;
        g.save.unlocked = 4; g.loadChapter(index, 3); g.mode = 'playing'; g.boss.active = true;
        g.beginBossCinematic('boss-intro'); g.cinematic.elapsed = g.cinematic.duration * 0.72; g.cinematic.suspended = true;
      }, chapter);
      await expect(phone.locator('#cinematic-overlay')).toBeVisible();
      await expect(phone.locator('#cinematic-title')).toHaveCSS('opacity', '1');
      assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await phone.screenshot({ path: path.join(output, `guardian-mobile-${chapter + 1}.png`), fullPage: true });
      await phone.locator('#cinematic-skip').tap();
      await expect(phone.locator('#boss-hud')).toBeVisible();
    }
  }
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
