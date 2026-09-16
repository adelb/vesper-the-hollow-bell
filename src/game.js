import { CHAPTERS, HEIGHT, WIDTH, PROLOGUE, BOSS_DRAMA, ENTRANCES, ENEMY_CAST, NPCS } from './content.js';
import { ATTACKS, attackColor, parryableAttack, beamHits } from './attacks.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const EMPTY_INPUT = { down: () => false, take: () => false };

export class Game {
  constructor(save, settings, onEvent = () => {}) {
    this.save = save;
    this.settings = settings;
    this.onEvent = onEvent;
    this.mode = 'menu';
    this.time = 0;
    this.playtimeFraction = 0;
    this.camera = 0;
    this.shake = 0;
    this.loadChapter(save.chapter);
  }

  emit(type, data = {}) { this.onEvent({ type, ...data }); }
  persist() { this.emit('save', { save: this.save }); }
  get maxHp() { return 100 + this.save.vitality * 20; }
  get maxFlasks() { return this.settings.difficulty === 'pilgrim' ? 4 : 3; }
  get damage() { return 27 + this.save.blade * 7; }

  floorAt(x) {
    return this.level.platforms.find(p => p[1] >= 390 && x >= p[0] && x <= p[0] + p[2])?.[1] ?? 452;
  }

  loadChapter(index, checkpoint = this.save.checkpoint) {
    this.level = CHAPTERS[index];
    this.save.chapter = index;
    this.save.checkpoint = checkpoint;
    this.platforms = this.level.platforms.map(([x, y, w]) => ({ x, y, w, h: y >= 390 ? HEIGHT - y + 120 : 18 }));
    const x = this.level.lamps[checkpoint];
    this.player = {
      x, y: this.floorAt(x) - 48, w: 24, h: 48, vx: 0, vy: 0, facing: 1,
      hp: this.maxHp, stamina: 100, flasks: this.maxFlasks, grounded: true,
      coyote: 0.1, jumpBuffer: 0, invulnerable: 1, dash: 0, dashCooldown: 0,
      attack: 0, attackDuration: 0, attackKind: 'light', hit: new Set(),
      queued: null, combo: 0, comboWindow: 0, staminaDelay: 0, parry: 0,
      heal: 0, rally: 0, rallyTimer: 0, hurt: 0, step: 0, safeX: x,
      airDash: true, dashX: 1, dashY: 0, dashStrike: 0, plunge: false, landing: 0,
    };
    this.enemies = this.level.enemies.map(([enemyX, kind], id) => {
      const platform = this.platforms.find(p => p.y >= 390 && enemyX >= p.x && enemyX <= p.x + p.w);
      return {
        id: `enemy-${id}`, kind, species: ENEMY_CAST[index][kind], chapter: index, x: enemyX, y: this.floorAt(enemyX) - (kind === 'brute' ? 60 : 46),
        w: kind === 'brute' ? 34 : 26, h: kind === 'brute' ? 60 : 46,
        hp: (kind === 'brute' ? 115 : kind === 'acolyte' ? 60 : 70) + index * 8,
        maxHp: (kind === 'brute' ? 115 : kind === 'acolyte' ? 60 : 70) + index * 8,
        vx: 0, vy: 0, facing: -1, state: 'idle', timer: 0, stagger: 0, flash: 0,
        attackCount: 0, home: enemyX, patrolMin: (platform?.x ?? enemyX - 50) + 25,
        patrolMax: (platform ? platform.x + platform.w : enemyX + 50) - 55, reward: kind === 'brute' ? 45 : 28,
      };
    });
    const spec = this.level.boss, drama = BOSS_DRAMA[index], [bossWidth, bossHeight] = drama.body;
    this.boss = {
      ...spec, drama, id: 'boss', x: this.level.arena + 430, y: 452 - bossHeight,
      w: bossWidth, h: bossHeight,
      maxHp: spec.hp, hp: this.save.defeated.includes(index) ? 0 : spec.hp,
      vx: 0, vy: 0, facing: -1, state: 'idle', timer: 1, stagger: 0, flash: 0,
      attackCount: 0, phase: 1, active: false, isBoss: true, pattern: 'sweep',
    };
    this.projectiles = [];
    this.zones = [];
    this.particles = [];
    this.floaters = [];
    this.afterimages = [];
    this.rings = [];
    this.cinematic = null;
    this.dialogue = null;
    this.npc = { ...NPCS[index], y: this.floorAt(NPCS[index].x), chapter: index };
    this.camera = clamp(x - 250, 0, this.level.width - WIDTH);
    this.deathTimer = 0;
    this.bossCelebration = 0;
    this.hintTimer = 0;
    this.lastHint = '';
    this.visitedDistricts = new Set(this.level.districts.filter(d => x >= d.x).map(d => d.name));
  }

  start() {
    const first = !this.save.started;
    if (this.player.hp <= 0) this.loadChapter(this.save.chapter, this.save.checkpoint);
    this.save.started = true;
    this.mode = 'playing';
    this.persist();
    if (!this.save.prologueSeen) { this.beginPrologue(); return; }
    this.emit('chapter', { index: this.save.chapter, story: first });
  }

  beginPrologue(replay = false) {
    this.mode = 'cinematic';
    this.cinematic = { kind: 'prologue', index: 0, elapsed: 0, duration: PROLOGUE[0].duration, replay, suspended: false };
    this.emit('cinematic', { cinematic: this.cinematic });
  }

  beginBossCinematic(kind) {
    const p = this.player;
    p.vx = 0; p.attack = 0; p.queued = null; p.dash = 0; p.plunge = false;
    this.projectiles = []; this.zones = [];
    this.mode = 'cinematic';
    this.cinematic = { kind, elapsed: 0, duration: kind === 'mutation' ? 4.8 : this.save.introduced.includes(this.save.chapter) ? 4.2 : ENTRANCES[this.save.chapter].duration, stage: 0, suspended: false };
    if (kind === 'boss-intro') {
      p.x = this.level.arena + 225; p.y = this.floorAt(p.x) - p.h; p.vy = 0; p.grounded = true; p.facing = 1;
      this.save.introduced = [...new Set([...this.save.introduced, this.save.chapter])];
      this.persist();
    }
    this.boss.vx = 0; this.boss.vy = 0;
    this.boss.y = 452 - this.boss.h;
    this.boss.state = 'idle';
    this.camera = clamp(this.boss.x + this.boss.w / 2 - WIDTH * 0.5, 0, this.level.width - WIDTH * 0.75);
    this.emit('cinematic', { cinematic: this.cinematic, boss: this.boss });
    this.emit('sound', { name: kind === 'mutation' ? 'mutation' : 'boss-intro' });
  }

  advanceCinematic(skip = false) {
    const scene = this.cinematic;
    if (this.mode !== 'cinematic' || !scene) return false;
    if (scene.kind === 'prologue' && !skip && scene.index < PROLOGUE.length - 1) {
      scene.index++; scene.elapsed = 0; scene.duration = PROLOGUE[scene.index].duration;
      this.emit('cinematic', { cinematic: scene });
      return true;
    }
    if (scene.kind === 'mutation') this.mutateBoss();
    this.cinematic = null;
    this.player.invulnerable = Math.max(this.player.invulnerable, 1.15);
    if (scene.kind === 'prologue') {
      this.save.prologueSeen = true;
      this.mode = scene.replay ? 'menu' : 'playing';
      this.persist();
      this.emit('cinematic-end', { kind: scene.kind });
      if (!scene.replay) this.emit('chapter', { index: this.save.chapter, story: true });
    } else {
      this.mode = 'playing';
      this.boss.stagger = 0; this.boss.state = 'idle'; this.boss.timer = 1;
      this.emit('cinematic-end', { kind: scene.kind });
      this.emit('boss', { boss: this.boss, phase: this.boss.phase });
    }
    return true;
  }

  mutateBoss() {
    const e = this.boss;
    if (e.phase === 2) return;
    const center = e.x + e.w / 2;
    [e.w, e.h] = e.drama.size;
    e.x = clamp(center - e.w / 2, this.level.arena + 15, this.level.width - e.w - 90);
    e.y = 452 - e.h;
    e.phase = 2; e.color = e.drama.color; e.attackCount = 0;
    this.rings.push({ x: center, y: e.y + e.h / 2, radius: 15, life: 1.3, color: e.color });
    this.burst(center, e.y + e.h / 2, e.color, 75, 260);
    this.shake = 14;
    this.emit('mutation', { boss: e });
  }

  beginDialogue() {
    const after = this.save.defeated.includes(this.save.chapter);
    this.dialogue = { npc: this.npc, lines: after ? this.npc.after : this.npc.intro, line: 0, stage: 'intro' };
    this.mode = 'dialogue';
    this.player.vx = 0; this.player.attack = 0; this.player.queued = null;
    this.player.dash = 0; this.player.dashStrike = 0; this.player.parry = 0; this.player.plunge = false;
    this.player.x = this.npc.x + (this.player.x <= this.npc.x ? -64 : 64);
    this.player.y = this.floorAt(this.player.x) - this.player.h;
    this.player.vy = 0; this.player.facing = this.player.x < this.npc.x ? 1 : -1;
    this.emit('dialogue', { dialogue: this.dialogue });
  }

  advanceDialogue(choice = null) {
    if (this.mode !== 'dialogue' || !this.dialogue) return false;
    const d = this.dialogue;
    if (choice === 'leave') {
      this.dialogue = null; this.mode = 'playing';
      this.player.invulnerable = Math.max(1, this.player.invulnerable);
      this.emit('dialogue-end');
      return true;
    }
    if (d.stage === 'choices') {
      if (!Number.isInteger(choice) || !d.npc.choices[choice]) return false;
      d.lines = d.npc.choices[choice].answer; d.line = 0; d.stage = 'answer';
    } else if (d.line + 1 < d.lines.length) d.line++;
    else {
      if (d.stage === 'intro' && !this.save.talked.includes(this.save.chapter)) {
        this.save.talked.push(this.save.chapter);
        this.save.echoes += d.npc.gift;
        this.persist();
        this.emit('hint', { text: `${d.npc.name} shared ${d.npc.gift} echoes. Their words are saved in the archive.` });
      }
      d.stage = 'choices';
    }
    this.emit('dialogue', { dialogue: d });
    return true;
  }

  enterChapter(index) {
    if (!Number.isInteger(index) || index < 0 || index > this.save.unlocked) return false;
    this.loadChapter(index, 0);
    this.mode = 'playing';
    this.persist();
    this.emit('chapter', { index, story: true });
    return true;
  }

  spend(amount) {
    if (this.player.stamina < amount) {
      if (this.hintTimer <= 0) { this.emit('hint', { text: 'Out of breath. Let your stamina recover.' }); this.hintTimer = 3; }
      return false;
    }
    this.player.stamina -= amount;
    this.player.staminaDelay = 0.55;
    return true;
  }

  beginAttack(kind) {
    const p = this.player;
    if (p.hurt > 0.12 || p.heal > 0 || p.parry > 0 || p.plunge || !this.spend(kind === 'heavy' ? 27 : 14)) return false;
    p.attackKind = p.dash > 0 && kind === 'light' ? 'wakecut' : kind === 'heavy' && !p.grounded ? 'plunge' : kind;
    if (p.attackKind === 'wakecut') {
      p.dashStrike = 0.4;
      this.rings.push({ x: p.x + 12, y: p.y + 24, radius: 8, life: 0.35, color: '#c8efe0' });
    } else if (p.attackKind === 'plunge') {
      p.plunge = true; p.dash = 0; p.vx *= 0.35; p.vy = 170;
      this.emit('sound', { name: 'plunge' });
    } else if (p.dash > 0) p.dash = 0;
    p.combo = kind === 'light' ? (p.comboWindow > 0 ? p.combo % 3 + 1 : 1) : 1;
    p.attackDuration = kind === 'heavy' ? 0.7 : p.combo === 3 ? 0.49 : 0.37;
    p.attack = p.attackDuration;
    p.hit.clear();
    p.comboWindow = 1;
    this.emit('sound', { name: p.attackKind === 'wakecut' ? 'wakecut' : kind === 'heavy' ? 'heavy' : 'swing' });
    return true;
  }

  physics(actor, dt) {
    const oldBottom = actor.y + actor.h;
    actor.vy += 1780 * dt;
    actor.x += actor.vx * dt;
    actor.y += actor.vy * dt;
    actor.grounded = false;
    if (actor.vy >= 0) {
      let landing = Infinity;
      for (const floor of this.platforms) {
        if (actor.x + actor.w > floor.x + 2 && actor.x < floor.x + floor.w - 2 && oldBottom <= floor.y + 3 && actor.y + actor.h >= floor.y) landing = Math.min(landing, floor.y);
      }
      if (landing !== Infinity) {
        actor.y = landing - actor.h;
        actor.vy = 0;
        actor.grounded = true;
      }
    }
  }

  update(dt, input = EMPTY_INPUT) {
    dt = Math.min(dt, 1 / 30);
    this.time += dt;
    this.updateEffects(dt);
    if (this.mode === 'cinematic') {
      if (!this.cinematic.suspended) {
        this.cinematic.elapsed += dt;
        if (this.cinematic.kind === 'boss-intro') {
          const stage = this.cinematic.elapsed / this.cinematic.duration >= 0.56 ? 2 : this.cinematic.elapsed / this.cinematic.duration >= 0.24 ? 1 : 0;
          if (stage > this.cinematic.stage) {
            this.cinematic.stage = stage;
            this.emit('sound', { name: stage === 1 ? 'entrance-rise' : 'entrance-reveal' });
          }
        }
        if (this.cinematic.kind === 'mutation' && this.cinematic.elapsed >= 2.1) this.mutateBoss();
        if (this.cinematic.elapsed >= this.cinematic.duration) this.advanceCinematic();
      }
      return;
    }
    if (this.mode === 'dying') {
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) { this.mode = 'dead'; this.emit('death'); }
      return;
    }
    if (this.mode !== 'playing') return;
    this.playtimeFraction += dt;
    if (this.playtimeFraction >= 1) { this.save.playtime += Math.floor(this.playtimeFraction); this.playtimeFraction %= 1; }
    this.hintTimer -= dt;
    this.bossCelebration = Math.max(0, this.bossCelebration - dt);
    const p = this.player;
    for (const key of ['invulnerable', 'dash', 'dashCooldown', 'jumpBuffer', 'staminaDelay', 'parry', 'hurt', 'rallyTimer', 'comboWindow', 'dashStrike', 'landing']) p[key] = Math.max(0, p[key] - dt);
    if (p.rallyTimer <= 0) p.rally = Math.max(0, p.rally - 24 * dt);
    if (p.staminaDelay <= 0 && p.dash <= 0 && p.attack <= 0) p.stamina = Math.min(100, p.stamina + 39 * dt);
    if (p.grounded) { p.coyote = 0.11; p.airDash = true; }
    else p.coyote = Math.max(0, p.coyote - dt);

    const jumpPressed = input.take('jump'), upPressed = input.take('up');
    if (jumpPressed || upPressed && !['gamepad', 'touch'].includes(input.lastDevice)) p.jumpBuffer = 0.14;
    if (p.jumpBuffer > 0 && p.coyote > 0 && p.heal <= 0 && p.hurt <= 0 && !p.plunge) {
      if (p.dash > 0) { p.vx = p.dashX * 330; p.dash = 0; }
      p.vy = -670; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0;
      this.burst(p.x + 12, p.y + 48, '#9ca99c', 6, 50);
      this.emit('sound', { name: 'jump' });
    }
    if (!input.down('jump') && !input.down('up') && p.vy < -280 && p.dash <= 0) p.vy += 2000 * dt;
    const move = Number(input.down('right')) - Number(input.down('left'));
    if (move && p.dash <= 0 && p.attack <= 0 && p.hurt <= 0 && p.heal <= 0) p.facing = move;

    if (input.take('dash') && p.dashCooldown <= 0 && p.heal <= 0 && p.hurt <= 0 && !p.plunge && (p.grounded || p.airDash) && this.spend(23)) {
      p.dash = 0.24; p.dashCooldown = 0.45; p.invulnerable = 0.21; p.attack = 0; p.parry = 0; p.queued = null;
      if (move) p.facing = move;
      const vertical = Number(input.down('down')) - Number(input.down('up'));
      const dx = move || (vertical ? 0 : p.facing), dy = p.grounded && vertical > 0 ? 0 : vertical;
      const length = Math.hypot(dx, dy) || 1;
      p.dashX = (dx || !dy && p.facing) / length; p.dashY = dy / length;
      if (!p.grounded || dy < 0) p.airDash = false;
      this.rings.push({ x: p.x + 12, y: p.y + 25, radius: 10, life: 0.4, color: '#98d7c5' });
      this.emit('sound', { name: 'dodge' });
    }
    if (input.take('parry') && p.parry <= 0 && p.attack <= 0 && p.dash <= 0 && p.heal <= 0 && p.hurt <= 0 && this.spend(18)) {
      p.parry = 0.34;
      this.emit('sound', { name: 'parry-ready' });
    }
    for (const [action, kind] of [['attack', 'light'], ['heavy', 'heavy']]) {
      if (input.take(action)) {
        if (p.attack > 0) { if (p.attack < 0.23) p.queued = kind; }
        else this.beginAttack(kind);
      }
    }
    if (input.take('heal') && p.flasks > 0 && p.hp < this.maxHp && p.heal <= 0 && p.attack <= 0 && p.dash <= 0 && p.hurt <= 0) {
      p.heal = 0.72; p.flasks--;
      this.emit('sound', { name: 'heal' });
    }
    if (p.heal > 0) {
      p.heal -= dt;
      if (p.heal <= 0) {
        p.hp = Math.min(this.maxHp, p.hp + this.maxHp * 0.58);
        p.rally = 0;
        this.burst(p.x + 12, p.y + 24, '#e6c88c', 22, 70);
        this.floating(p.x, p.y - 12, 'MENDED', '#d2d6a8');
      }
    }

    if (p.dash > 0) {
      p.vx = p.dashX * 565;
      p.vy = p.dashY * 565 - 1780 * dt;
      if (Math.floor(this.time * 60) % 2 === 0) this.afterimages.push({ x: p.x, y: p.y, facing: p.facing, dashX: p.dashX, dashY: p.dashY, attackKind: p.attackKind, life: 0.32 });
    } else if (p.plunge) {
      p.vy = Math.min(1050, p.vy + 2500 * dt);
      p.vx *= 0.9;
      p.attack = 0.35;
    } else if (p.hurt <= 0) {
      const speed = p.heal > 0 ? 45 : p.attack > 0 ? 94 : p.parry > 0 ? 80 : 220;
      p.vx += (move * speed - p.vx) * Math.min(1, dt * (p.grounded ? 20 : 10));
    } else p.vx *= Math.max(0, 1 - dt * 6);
    const wasGrounded = p.grounded;
    this.physics(p, dt);
    if (p.y < 25) { p.y = 25; p.vy = Math.max(0, p.vy); p.dash = 0; }
    if (!wasGrounded && p.grounded) {
      p.airDash = true; p.landing = 0.2;
      if (p.plunge) {
        p.plunge = false; p.attackKind = 'bellfall'; p.attack = 0.25; p.attackDuration = 0.25; p.hit.clear();
        this.strike();
        this.shake = 9;
        this.rings.push({ x: p.x + 12, y: p.y + 46, radius: 10, life: 0.6, color: '#e6d7aa' });
        this.burst(p.x + 12, p.y + 47, '#d1c5a7', 30, 210);
        this.emit('sound', { name: 'bellfall' });
      }
    }
    p.x = clamp(p.x, this.boss.active && this.boss.hp > 0 ? this.level.arena - 45 : 0, this.level.width - p.w - 18);
    if (p.grounded && p.x > 25 && this.platforms.some(f => f.y >= 390 && p.x > f.x + 25 && p.x + p.w < f.x + f.w - 25)) p.safeX = p.x;
    if (p.grounded && Math.abs(p.vx) > 60) {
      p.step += dt * Math.abs(p.vx) / 42;
      if (p.step >= 1) { p.step = 0; this.emit('sound', { name: 'step' }); }
    }
    if (p.y > HEIGHT + 80) this.fall();
    if (this.mode !== 'playing') return;

    if (p.attack > 0) {
      p.attack -= dt;
      const elapsed = p.attackDuration - p.attack;
      const active = p.attackKind === 'heavy' ? elapsed > 0.26 && elapsed < 0.49 : elapsed > 0.075 && elapsed < 0.26;
      if (active || p.plunge) this.strike();
      if (p.attack <= 0 && p.queued) { const next = p.queued; p.queued = null; this.beginAttack(next); }
    }
    for (const hazard of this.level.hazards) {
      if (overlaps(p, { x: hazard[0], y: hazard[1] + 8, w: hazard[2], h: 18 })) this.hurtPlayer(18, null, false);
    }
    if (!this.boss.active && this.boss.hp > 0 && p.x > this.level.arena - 50) {
      this.boss.active = true;
      this.beginBossCinematic('boss-intro');
      return;
    }
    for (const enemy of this.enemies) this.updateEnemy(enemy, dt);
    if (this.boss.active && this.boss.hp > 0) this.updateEnemy(this.boss, dt);
    if (this.mode !== 'playing') return;
    this.updateProjectiles(dt);
    this.recoverEchoes();
    for (const district of this.level.districts) if (p.x >= district.x && !this.visitedDistricts.has(district.name)) {
      this.visitedDistricts.add(district.name);
      this.emit('district', { district });
    }
    if (input.take('interact')) this.interact();
    const targetCamera = clamp(p.x - WIDTH * 0.37 + p.facing * 45, 0, this.level.width - WIDTH);
    this.camera += (targetCamera - this.camera) * (1 - Math.exp(-dt * 5));
  }

  strike() {
    const p = this.player;
    const range = p.attackKind === 'heavy' ? 112 : p.attackKind === 'wakecut' ? 130 : 83;
    const box = p.attackKind === 'bellfall' ? { x: p.x - 105, y: p.y - 8, w: 234, h: 80 } : p.attackKind === 'plunge' ? { x: p.x - 15, y: p.y + 22, w: 54, h: 56 } : { x: p.facing > 0 ? p.x + 8 : p.x + 16 - range, y: p.y - 8, w: range, h: 68 };
    for (const enemy of [...this.enemies, this.boss]) {
      if (enemy.hp <= 0 || p.hit.has(enemy.id) || (enemy.isBoss && (!enemy.active || this.mode === 'cinematic')) || !overlaps(box, enemy)) continue;
      p.hit.add(enemy.id);
      const critical = enemy.stagger > 0.6;
      const multipliers = { heavy: 1.85, wakecut: 1.55, plunge: 1.3, bellfall: 2.2 };
      const amount = Math.round(this.damage * (multipliers[p.attackKind] || (p.combo === 3 ? 1.35 : 1)) * (critical ? 2.2 : 1));
      enemy.hp = Math.max(enemy.isBoss && enemy.phase === 1 ? Math.min(enemy.hp, enemy.maxHp * 0.5) : 0, enemy.hp - amount);
      enemy.flash = 0.17;
      if (!enemy.isBoss && enemy.state !== 'strike') enemy.stagger = Math.max(enemy.stagger, p.attackKind === 'heavy' ? 0.7 : 0.23);
      if (critical) { enemy.stagger = 0.3; this.emit('hint', { text: 'RIPOSTE — a broken guard, a borrowed moment.' }); }
      if (!enemy.isBoss) enemy.x = clamp(enemy.x + p.facing * 10, enemy.patrolMin, enemy.patrolMax);
      const rally = Math.min(p.rally, amount * 0.4, this.maxHp - p.hp);
      p.hp += rally; p.rally -= rally;
      this.shake = p.attackKind === 'heavy' || critical ? 7 : 3;
      this.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.isBoss ? enemy.color : '#b47866', 14, 170);
      this.floating(enemy.x + enemy.w / 2, enemy.y - 10, String(amount), critical ? '#f4dfa6' : '#d9d5c0');
      this.emit('sound', { name: critical ? 'riposte' : 'hit' });
      if (enemy.hp <= 0) this.killEnemy(enemy);
    }
  }

  killEnemy(enemy) {
    this.save.echoes += enemy.reward;
    this.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#c9b77e', enemy.isBoss ? 70 : 22, enemy.isBoss ? 240 : 90);
    this.floating(enemy.x, enemy.y - 35, `+${enemy.reward} echoes`, '#d4bc80');
    if (enemy.isBoss) {
      enemy.active = false;
      this.save.defeated = [...new Set([...this.save.defeated, this.save.chapter])];
      this.save.unlocked = Math.max(this.save.unlocked, Math.min(4, this.save.chapter + 1));
      this.projectiles = []; this.zones = [];
      this.bossCelebration = 5;
      this.player.hp = this.maxHp;
      this.player.flasks = this.maxFlasks;
      this.shake = 12;
      this.persist();
      this.emit('victory', { boss: enemy, text: this.level.bossAfter });
      this.emit('sound', { name: 'victory' });
    }
  }

  updateEnemy(e, dt) {
    if (e.hp <= 0) return;
    e.flash = Math.max(0, e.flash - dt);
    e.stagger = Math.max(0, e.stagger - dt);
    const p = this.player;
    const dx = p.x + p.w / 2 - (e.x + e.w / 2);
    const distance = Math.abs(dx);
    if (!e.isBoss && distance > 650) {
      if (ATTACKS[e.pattern] && ['windup', 'strike'].includes(e.state)) {
        e.state = 'idle'; e.timer = 0.6; e.vx = 0;
        this.zones = this.zones.filter(z => z.owner !== e || !z.cancelWithOwner);
        this.projectiles = this.projectiles.filter(b => b.owner !== e || !b.orbit);
      }
      return;
    }
    if (e.isBoss && e.hp <= e.maxHp * 0.5 && e.phase === 1) {
      this.beginBossCinematic('mutation');
      return;
    }
    if (e.stagger > 0) {
      if (ATTACKS[e.pattern] && ['windup', 'strike'].includes(e.state)) { e.state = 'recover'; e.timer = 0.9; }
      e.vx *= Math.max(0, 1 - dt * 10);
      this.physics(e, dt);
      return;
    }
    e.timer -= dt;
    const speed = e.isBoss ? (e.kind === 'widow' ? 115 : 86) * (e.phase === 2 ? 1.2 : 1) : e.kind === 'brute' ? 49 : 72;
    if (e.state === 'idle') {
      e.facing = dx >= 0 ? 1 : -1;
      const ranged = ['acolyte', 'cantor', 'astronomer'].includes(e.kind);
      const next = this.patternFor(e, e.attackCount + 1), signature = ATTACKS[next];
      const trigger = e.isBoss ? signature?.kind === 'combo' || next === 'sweep' ? e.w / 2 + (signature?.reach || 108) + 70 : 460 : e.species.range;
      if (distance < trigger && Math.abs(p.y + p.h - e.y - e.h) < 180 && e.timer <= 0) {
        e.state = 'windup'; e.vx = 0; e.attackCount++;
        e.pattern = this.patternFor(e);
        e.timer = this.windupFor(e);
        e.windupDuration = e.timer;
        e.targetX = p.x; e.targetY = p.y + p.h / 2;
        e.didHit = false;
        this.emit('sound', { name: 'tell' });
        if (ATTACKS[e.pattern]) this.prepareSignature(e);
        else if (['meteor', 'roots'].includes(e.pattern)) {
          const count = e.isBoss ? e.phase === 2 ? 4 : 3 : 2;
          for (let i = 0; i < count; i++) {
            const x = clamp(p.x - 70 + i * 100, e.isBoss ? this.level.arena : e.patrolMin, e.isBoss ? this.level.width - 80 : e.patrolMax);
            this.zones.push({ x, y: this.floorAt(x), radius: e.pattern === 'roots' ? 32 : 43, timer: e.timer + 0.22 + i * 0.18, life: 0.45, fired: false, owner: e, kind: e.pattern });
          }
        } else if (e.pattern === 'blink') {
          this.burst(e.x, e.y + 20, e.species.trim, 15, 90);
          e.x = clamp(p.x - p.facing * 85, e.patrolMin, e.patrolMax);
          e.facing = p.x > e.x ? 1 : -1;
        }
      } else e.vx = distance > (ranged ? 300 : 55) ? e.facing * speed : 0;
    } else if (e.state === 'windup') {
      const attack = ATTACKS[e.pattern];
      e.vx = attack?.backstep && e.timer > e.windupDuration * 0.5 ? -e.facing * attack.backstep : 0;
      if (attack?.teleport && !e.teleported && e.timer <= e.windupDuration * 0.65) {
        this.burst(e.x + e.w / 2, e.y + e.h / 2, attackColor(e.pattern), 18, 110);
        e.x = e.teleportX; e.facing = e.targetX > e.x ? 1 : -1; e.teleported = true;
        this.burst(e.x + e.w / 2, e.y + e.h / 2, attackColor(e.pattern), 18, 110);
      }
      if (e.timer <= 0 && attack) {
        e.state = 'strike'; e.timer = attack.duration; e.attackStep = -1; e.vx = 0;
        this.updateSignature(e);
      } else if (e.timer <= 0) {
        e.state = 'strike';
        e.timer = ['charge', 'leap'].includes(e.pattern) ? 0.68 : 0.28;
        if (e.pattern === 'charge') e.vx = e.facing * (e.isBoss ? 415 : 220);
        if (e.pattern === 'leap') { e.vx = clamp((e.targetX - e.x) * 1.45, -360, 360); e.vy = -610; }
        if (['bolt', 'song', 'nova', 'spread', 'cinder', 'eclipse', 'rapture'].includes(e.pattern)) {
          const angle = Math.atan2(p.y + 20 - (e.y + e.h * 0.4), dx);
          const count = e.pattern === 'bolt' ? 1 : ['eclipse', 'rapture'].includes(e.pattern) ? 7 : e.phase === 2 ? 5 : 3;
          for (let i = 0; i < count; i++) this.shoot(e, angle + (i - (count - 1) / 2) * (e.pattern === 'eclipse' ? 0.38 : 0.23), e.isBoss ? 230 : 175);
          if (e.pattern === 'song' || e.pattern === 'nova') this.wave(e, e.facing);
        }
        if (e.pattern === 'tidal') { this.wave(e, -1); this.wave(e, 1); if (e.isBoss) { this.shoot(e, -Math.PI * 0.75, 160); this.shoot(e, -Math.PI * 0.25, 160); } }
        this.emit('sound', { name: e.isBoss ? 'boss-strike' : 'swing' });
      }
    } else if (e.state === 'strike') {
      const attack = ATTACKS[e.pattern];
      if (attack) this.updateSignature(e);
      else if (!e.didHit && ['sweep', 'charge', 'leap', 'blink'].includes(e.pattern)) {
        const reach = e.isBoss ? (e.pattern === 'sweep' ? 108 : 28) : e.kind === 'brute' ? 61 : 37;
        const hitbox = { x: e.facing > 0 ? e.x : e.x - reach, y: e.y + 6, w: e.w + reach, h: e.h - 4 };
        if (overlaps(hitbox, p)) {
          e.didHit = true;
          this.hurtPlayer(e.isBoss ? (e.phase === 2 ? 32 : 26) : e.kind === 'brute' ? 27 : 17, e, e.pattern !== 'leap');
        }
      }
      if (e.timer <= 0) {
        e.state = 'recover'; e.timer = attack?.recovery ?? (e.isBoss ? (e.phase === 2 ? 0.85 : 1.12) : 0.95); e.vx = 0;
        if (e.pattern === 'leap') { this.shake = 7; this.burst(e.x + e.w / 2, 445, e.color || '#adad89', 25, 180); }
      }
    } else if (e.state === 'recover') {
      e.vx = 0;
      if (e.timer <= 0) {
        e.state = 'idle'; e.timer = 0.22;
        if (e.kind === 'astronomer' && e.attackCount % 3 === 0) {
          this.burst(e.x, e.y + 30, e.color, 20, 130);
          e.x = p.x > this.level.arena + 370 ? this.level.arena + 90 : this.level.arena + 590;
          this.burst(e.x, e.y + 30, e.color, 20, 130);
        }
      }
    }
    this.physics(e, dt);
    if (e.isBoss) e.x = clamp(e.x, this.level.arena + 5, this.level.width - e.w - 80);
    else e.x = clamp(e.x, e.patrolMin, e.patrolMax);
    if (e.y > 600) { e.y = this.floorAt(e.x) - e.h; e.vy = 0; }
  }

  patternFor(e, count = e.attackCount) {
    const patterns = e.isBoss ? e.phase === 2 ? e.drama.patterns : e.drama.opening : e.species.patterns;
    return patterns[(count - 1) % patterns.length];
  }

  windupFor(e) {
    if (ATTACKS[e.pattern]) return ATTACKS[e.pattern].windup;
    const duration = ['meteor', 'roots', 'eclipse', 'rapture'].includes(e.pattern) ? 1.25 : e.pattern === 'leap' ? 0.95 : e.pattern === 'charge' ? 1 : e.isBoss ? 0.8 : e.kind === 'brute' ? 0.95 : 0.65;
    return duration * (e.phase === 2 ? 0.84 : 1);
  }

  shoot(e, angle, speed) {
    this.projectiles.push({ x: e.x + e.w / 2, y: e.y + e.h * 0.4, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: 11, h: 11, life: 5, damage: e.isBoss ? 22 : 15, owner: e, wave: false, parryable: parryableAttack(e.pattern), color: attackColor(e.pattern), curve: e.pattern === 'eclipse' ? 0.48 : e.pattern === 'rapture' ? -0.3 : 0 });
  }

  prepareSignature(e) {
    const a = ATTACKS[e.pattern], color = attackColor(e.pattern);
    const x = e.x + e.w / 2, y = e.y + e.h * 0.4;
    e.aimAngle = Math.atan2(e.targetY - y, e.targetX + 12 - x);
    e.attackStep = -1; e.teleported = false;
    e.teleportX = clamp(e.targetX - this.player.facing * 100, e.patrolMin ?? this.level.arena + 20, e.patrolMax ?? this.level.width - 150);
    if (a.kind === 'zones') {
      const min = e.isBoss ? this.level.arena + 20 : e.patrolMin, max = e.isBoss ? this.level.width - 100 : e.patrolMax;
      for (let i = 0; i < a.count; i++) {
        const position = a.alternating ? this.level.arena + 45 + i * a.spacing : e.targetX + (i - (a.count - 1) / 2) * a.spacing;
        const zoneX = clamp(position, min, max), order = a.alternating ? (i % 2 ? Math.ceil(a.count / 2) : 0) + Math.floor(i / 2) : i;
        this.zones.push({ x: zoneX, y: this.floorAt(zoneX), radius: a.radius, height: a.height, timer: e.windupDuration + 0.1 + order * a.interval, life: 0.4, fired: false, owner: e, kind: a.visual, color, damage: a.damage, cancelWithOwner: true });
      }
    } else if (a.kind === 'beam') {
      a.angles.forEach((offset, i) => {
        const angle = e.aimAngle + offset;
        this.zones.push({ x, y, endX: x + Math.cos(angle) * a.range, endY: y + Math.sin(angle) * a.range, width: a.width, timer: e.windupDuration + 0.08 + i * a.interval, life: 0.26, fired: false, owner: e, kind: 'beam', visual: a.visual, color, damage: a.damage, cancelWithOwner: true });
      });
    }
  }

  signatureBullet(e, angle, a) {
    return { x: e.x + e.w / 2, y: e.y + e.h * 0.4, vx: Math.cos(angle) * a.speed, vy: Math.sin(angle) * a.speed, w: ['anchor', 'cleaver', 'censer'].includes(a.visual) ? 22 : 12, h: 12, life: 5, age: 0, owner: e, damage: a.damage, color: attackColor(e.pattern), parryable: a.parryable, visual: a.visual, curve: a.curve || 0, gravity: a.gravity || 0, returning: a.returning, split: a.split, planting: a.planting };
  }

  updateSignature(e) {
    const a = ATTACKS[e.pattern], elapsed = a.duration - e.timer;
    const beats = a.beats || [0];
    while (e.attackStep + 1 < beats.length && elapsed >= beats[e.attackStep + 1]) {
      e.attackStep++; e.didHit = false;
      this.emit('sound', { name: `foe-${a.kind}` });
      if (a.kind === 'volley') {
        for (let i = 0; i < a.count; i++) {
          const angle = e.aimAngle + (i - (a.count - 1) / 2) * (a.spread || 0) - (a.planting ? e.facing * 0.55 : 0);
          this.projectiles.push(this.signatureBullet(e, angle, a));
        }
      } else if (a.kind === 'orbit') {
        for (let i = 0; i < a.count; i++) this.projectiles.push({ ...this.signatureBullet(e, 0, a), orbit: true, orbitAngle: i * Math.PI * 2 / a.count, orbitRadius: a.radius, release: 0.55 + i * a.interval });
      } else if (a.kind === 'waves' || a.shock && e.attackStep === beats.length - 1) {
        for (const direction of [-1, 1]) this.projectiles.push({ ...this.signatureBullet(e, 0, a), x: e.x + e.w / 2, y: this.floorAt(e.x) - 18, vx: direction * (a.speed || 200), vy: 0, w: 28, h: 20, wave: true, parryable: false, color: '#c2a4ec' });
      }
    }
    if (a.kind === 'combo') {
      const active = e.attackStep >= 0 && elapsed - beats[e.attackStep] < 0.2;
      e.vx = active ? e.facing * a.speed : 0;
      const hitbox = { x: e.facing > 0 ? e.x : e.x - a.reach, y: e.y + e.h * 0.25, w: e.w + a.reach, h: e.h * 0.75 };
      if (active && !e.didHit && overlaps(hitbox, this.player)) {
        e.didHit = true;
        this.hurtPlayer(a.damage, e, a.parryable);
      }
    }
  }

  wave(e, direction) {
    this.projectiles.push({ x: e.x + e.w / 2, y: this.floorAt(e.x) - 18, vx: direction * (e.isBoss ? 220 : 155), vy: 0, w: 27, h: 18, life: 4, damage: e.isBoss ? 24 : 16, owner: e, wave: true, color: e.color || e.species?.trim });
  }

  updateProjectiles(dt) {
    for (const bolt of [...this.projectiles]) {
      bolt.age = (bolt.age || 0) + dt;
      if (bolt.orbit) {
        if (bolt.owner.hp <= 0 || bolt.owner.stagger > 0) { bolt.life = 0; continue; }
        if (bolt.age < bolt.release) {
          const angle = bolt.orbitAngle + bolt.age * 2.4;
          bolt.x = bolt.owner.x + bolt.owner.w / 2 + Math.cos(angle) * bolt.orbitRadius;
          bolt.y = bolt.owner.y + bolt.owner.h * 0.4 + Math.sin(angle) * bolt.orbitRadius * 0.65;
          bolt.life -= dt;
          continue;
        }
        bolt.orbit = false;
        const speed = Math.hypot(bolt.vx, bolt.vy), angle = Math.atan2(this.player.y + 24 - bolt.y, this.player.x + 12 - bolt.x);
        bolt.vx = Math.cos(angle) * speed; bolt.vy = Math.sin(angle) * speed;
      }
      if (bolt.returning && bolt.age > bolt.returning) {
        const dx = bolt.owner.x + bolt.owner.w / 2 - bolt.x, dy = bolt.owner.y + bolt.owner.h * 0.4 - bolt.y, distance = Math.hypot(dx, dy);
        if (distance < 18 || bolt.owner.hp <= 0) { bolt.life = 0; continue; }
        bolt.vx = dx / distance * 285; bolt.vy = dy / distance * 285;
      }
      if (bolt.curve) {
        const angle = bolt.curve * dt, x = bolt.vx;
        bolt.vx = x * Math.cos(angle) - bolt.vy * Math.sin(angle);
        bolt.vy = x * Math.sin(angle) + bolt.vy * Math.cos(angle);
      }
      bolt.vy += (bolt.gravity || 0) * dt;
      bolt.x += bolt.vx * dt; bolt.y += bolt.vy * dt; bolt.life -= dt;
      if (bolt.split && bolt.age >= 0.75) {
        const angle = Math.atan2(bolt.vy, bolt.vx);
        for (let i = 0; i < bolt.split; i++) {
          const direction = angle + (i - (bolt.split - 1) / 2) * 0.5;
          this.projectiles.push({ ...bolt, vx: Math.cos(direction) * 205, vy: Math.sin(direction) * 205, split: 0, age: 0, w: 8, h: 8, life: 3, damage: Math.round(bolt.damage * 0.8), visual: 'shard' });
        }
        bolt.life = 0; this.burst(bolt.x, bolt.y, bolt.color, 9, 70);
      }
      if (bolt.planting && bolt.vy > 0 && bolt.y >= this.floorAt(bolt.x)) {
        const floor = this.platforms.find(f => f.y >= 390 && bolt.x >= f.x && bolt.x <= f.x + f.w);
        if (floor) this.zones.push({ x: bolt.x, y: floor.y, radius: 26, height: 72, timer: 0.9, life: 0.4, fired: false, owner: bolt.owner, kind: 'roots', color: '#c2a4ec', damage: 18 });
        bolt.life = 0;
      }
      if (bolt.life > 0 && overlaps(bolt, this.player)) {
        this.hurtPlayer(bolt.damage, bolt.owner, !bolt.wave && bolt.parryable !== false);
        bolt.life = 0;
        this.burst(bolt.x, bolt.y, '#aecfc4', 8, 100);
      }
    }
    this.projectiles = this.projectiles.filter(b => b.life > 0 && b.y < 650 && b.x > 0 && b.x < this.level.width);
    for (const zone of this.zones) {
      if (zone.cancelWithOwner && (zone.owner.hp <= 0 || zone.owner.stagger > 0)) { zone.life = 0; continue; }
      zone.timer -= dt;
      if (zone.timer <= 0 && !zone.fired) {
        zone.fired = true;
        this.burst(zone.x, zone.y - (zone.kind === 'beam' ? 0 : 30), zone.color || '#cab2df', 14, 150);
        this.shake = 5;
        this.emit('sound', { name: zone.kind === 'beam' ? 'foe-beam' : 'heavy' });
      }
      if (zone.fired && !zone.hit) {
        const hit = zone.kind === 'beam' ? beamHits(this.player, zone) : overlaps(this.player, { x: zone.x - zone.radius, y: zone.y - (zone.height || 100), w: zone.radius * 2, h: zone.height || 100 });
        if (hit) { zone.hit = true; this.hurtPlayer(zone.damage || 30, zone.owner, false); }
      }
      if (zone.fired) zone.life -= dt;
    }
    this.zones = this.zones.filter(z => z.life > 0);
  }

  hurtPlayer(amount, source, parryable) {
    const p = this.player;
    if (this.mode !== 'playing' || p.invulnerable > 0) return false;
    if (parryable && p.parry >= 0.07 && p.parry <= 0.28) {
      if (source?.hp > 0) { source.stagger = 2.1; source.state = 'recover'; source.timer = 0.9; source.vx = 0; }
      p.stamina = Math.min(100, p.stamina + 28);
      p.invulnerable = 0.35; p.parry = 0;
      this.shake = 6;
      this.burst(p.x + p.facing * 25, p.y + 20, '#faf0c3', 28, 220);
      this.floating(p.x, p.y - 25, 'GUARD BROKEN', '#f5df9e');
      this.emit('sound', { name: 'parry' });
      return false;
    }
    amount = Math.round(amount * (this.settings.difficulty === 'pilgrim' ? 0.62 : 1));
    p.hp = Math.max(0, p.hp - amount);
    p.rally = Math.min(this.maxHp - p.hp, p.rally + amount * 0.75);
    p.rallyTimer = 4;
    p.invulnerable = 0.8; p.hurt = 0.3; p.attack = 0; p.queued = null; p.heal = 0; p.parry = 0; p.plunge = false;
    p.vx = source ? (p.x < source.x ? -190 : 190) : -p.facing * 100;
    p.vy = -125;
    this.shake = 6;
    this.burst(p.x + 12, p.y + 20, '#b37165', 15, 150);
    this.emit('sound', { name: 'hurt' });
    if (p.hp <= 0) this.die();
    return true;
  }

  fall() {
    const p = this.player;
    p.invulnerable = 0;
    p.x = p.safeX;
    p.y = this.floorAt(p.safeX) - p.h;
    p.vx = 0; p.vy = 0; p.dash = 0; p.plunge = false; p.airDash = true;
    this.hurtPlayer(40, null, false);
    if (this.mode === 'playing') this.emit('hint', { text: 'The dark takes its due. Jump, then dodge to cross wider gaps.' });
  }

  die() {
    if (this.mode !== 'playing') return;
    const p = this.player;
    this.save.bloodstain = this.save.echoes > 0 ? { chapter: this.save.chapter, x: p.safeX, y: this.floorAt(p.safeX) - 22, amount: this.save.echoes } : null;
    this.save.echoes = 0;
    this.save.deaths++;
    this.mode = 'dying';
    this.deathTimer = 1.5;
    this.persist();
    this.emit('sound', { name: 'death' });
  }

  respawn() {
    this.loadChapter(this.save.chapter, this.save.checkpoint);
    this.mode = 'playing';
    this.emit('respawn');
  }

  recoverEchoes() {
    if (this.mode !== 'playing') return;
    const stain = this.save.bloodstain;
    if (stain && stain.chapter === this.save.chapter && Math.abs(this.player.x - stain.x) < 42 && Math.abs(this.player.y + 24 - stain.y) < 65) {
      this.save.echoes += stain.amount;
      this.save.bloodstain = null;
      this.burst(stain.x, stain.y, '#b4d4c2', 25, 120);
      this.emit('hint', { text: `${stain.amount} lost echoes reclaimed.` });
      this.emit('sound', { name: 'recover' });
      this.persist();
    }
  }

  get interaction() {
    const p = this.player;
    if (this.mode !== 'playing' || !p.grounded || this.boss.active) return null;
    for (const [index, x] of this.level.lamps.entries()) if (Math.abs(p.x - x) < 62 && p.y + p.h > 390) return { kind: 'checkpoint', index, text: index === 3 ? 'Rest before the guardian' : index ? 'Rest at the wayward lamp' : 'Rest at the lamplighter’s refuge' };
    if (Math.abs(p.x - this.npc.x) < 48 && p.y + p.h > 385) return { kind: 'npc', text: `Speak to ${this.npc.name}` };
    if (Math.abs(p.x - this.level.noteX) < 48 && p.y + p.h > 380 && !this.save.notes.includes(this.save.chapter)) return { kind: 'note', text: 'Read the forgotten letter' };
    const memory = this.level.memories.find(m => !this.save.memories.includes(m.id) && Math.abs(p.x + p.w / 2 - m.x) < 42 && Math.abs(p.y + p.h - m.y) < 12);
    if (memory) return { kind: 'memory', memory, text: 'Recover a sheltered memory' };
    if (p.x > this.level.width - 205 && this.boss.hp <= 0) return { kind: 'gate', text: this.save.chapter === 4 ? 'Speak to Mara' : 'Enter the next district' };
    return null;
  }

  interact() {
    const interaction = this.interaction;
    if (!interaction) return;
    if (interaction.kind === 'checkpoint') {
      this.save.checkpoint = interaction.index;
      const echoes = this.save.echoes;
      this.loadChapter(this.save.chapter, interaction.index);
      this.save.echoes = echoes;
      this.mode = 'rest';
      this.persist();
      this.emit('rest');
      this.emit('sound', { name: 'rest' });
    } else if (interaction.kind === 'npc') this.beginDialogue();
    else if (interaction.kind === 'note') {
      this.save.notes = [...new Set([...this.save.notes, this.save.chapter])];
      this.mode = 'lore';
      this.persist();
      this.emit('lore', { note: this.level.note });
    } else if (interaction.kind === 'memory') {
      const memory = interaction.memory;
      this.save.memories.push(memory.id);
      this.save.echoes += memory.reward;
      this.mode = 'lore';
      this.persist();
      this.emit('lore', { note: memory });
      this.emit('sound', { name: 'recover' });
    } else if (this.save.chapter < 4) {
      this.enterChapter(this.save.chapter + 1);
    } else {
      this.mode = 'ending';
      this.emit('ending-choice');
    }
  }

  upgrade(stat) {
    if (this.mode !== 'rest' || !['vitality', 'blade'].includes(stat)) return false;
    const cost = 80 * (this.save[stat] + 1);
    if (this.save[stat] >= 5 || this.save.echoes < cost) return false;
    this.save.echoes -= cost;
    this.save[stat]++;
    if (stat === 'vitality') this.player.hp = this.maxHp;
    this.persist();
    this.emit('sound', { name: 'upgrade' });
    return true;
  }

  finish(ending) {
    if (this.save.chapter !== 4 || this.boss.hp > 0 || !['dawn', 'keeper'].includes(ending)) return false;
    this.save.ending = ending;
    this.mode = 'ending';
    this.persist();
    this.emit('ending', { ending });
    return true;
  }

  burst(x, y, color, count, speed) {
    if (!this.settings.particles) return;
    for (let i = 0; i < count && this.particles.length < 260; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.2 + Math.random() * 0.8);
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 45, life: 0.3 + Math.random() * 0.5, color, size: Math.random() > 0.6 ? 3 : 2 });
    }
  }

  floating(x, y, text, color) { this.floaters.push({ x, y, text, color, life: 1.3 }); }
  updateEffects(dt) {
    this.shake = Math.max(0, this.shake - dt * 24);
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 230 * dt; p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const f of this.floaters) { f.y -= dt * 28; f.life -= dt; }
    this.floaters = this.floaters.filter(f => f.life > 0);
    for (const a of this.afterimages) a.life -= dt;
    this.afterimages = this.afterimages.filter(a => a.life > 0).slice(-20);
    for (const ring of this.rings) { ring.radius += 170 * dt; ring.life -= dt; }
    this.rings = this.rings.filter(ring => ring.life > 0);
  }
}
