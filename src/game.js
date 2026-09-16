import { CHAPTERS, HEIGHT, WIDTH } from './content.js';

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
    const x = checkpoint ? this.level.checkpoint : 155;
    this.player = {
      x, y: this.floorAt(x) - 48, w: 24, h: 48, vx: 0, vy: 0, facing: 1,
      hp: this.maxHp, stamina: 100, flasks: this.maxFlasks, grounded: true,
      coyote: 0.1, jumpBuffer: 0, invulnerable: 1, dash: 0, dashCooldown: 0,
      attack: 0, attackDuration: 0, attackKind: 'light', hit: new Set(),
      queued: null, combo: 0, comboWindow: 0, staminaDelay: 0, parry: 0,
      heal: 0, rally: 0, rallyTimer: 0, hurt: 0, step: 0, safeX: x,
    };
    this.enemies = this.level.enemies.map(([enemyX, kind], id) => {
      const platform = this.platforms.find(p => p.y >= 390 && enemyX >= p.x && enemyX <= p.x + p.w);
      return {
        id: `enemy-${id}`, kind, x: enemyX, y: this.floorAt(enemyX) - (kind === 'brute' ? 60 : 46),
        w: kind === 'brute' ? 34 : 26, h: kind === 'brute' ? 60 : 46,
        hp: (kind === 'brute' ? 115 : kind === 'acolyte' ? 60 : 70) + index * 8,
        maxHp: (kind === 'brute' ? 115 : kind === 'acolyte' ? 60 : 70) + index * 8,
        vx: 0, vy: 0, facing: -1, state: 'idle', timer: 0, stagger: 0, flash: 0,
        attackCount: 0, home: enemyX, patrolMin: (platform?.x ?? enemyX - 50) + 25,
        patrolMax: (platform ? platform.x + platform.w : enemyX + 50) - 55, reward: kind === 'brute' ? 45 : 28,
      };
    });
    const spec = this.level.boss;
    this.boss = {
      ...spec, id: 'boss', x: this.level.arena + 430, y: 452 - (spec.kind === 'widow' ? 82 : 98),
      w: spec.kind === 'widow' ? 84 : 58, h: spec.kind === 'widow' ? 82 : 98,
      maxHp: spec.hp, hp: this.save.defeated.includes(index) ? 0 : spec.hp,
      vx: 0, vy: 0, facing: -1, state: 'idle', timer: 1, stagger: 0, flash: 0,
      attackCount: 0, phase: 1, active: false, isBoss: true, pattern: 'sweep',
    };
    this.projectiles = [];
    this.zones = [];
    this.particles = [];
    this.floaters = [];
    this.afterimages = [];
    this.camera = clamp(x - 250, 0, this.level.width - WIDTH);
    this.deathTimer = 0;
    this.bossCelebration = 0;
    this.hintTimer = 0;
    this.lastHint = '';
  }

  start() {
    const first = !this.save.started;
    this.save.started = true;
    this.mode = 'playing';
    this.persist();
    this.emit('chapter', { index: this.save.chapter, story: first });
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
    if (p.hurt > 0.12 || p.heal > 0 || p.parry > 0 || p.dash > 0 || !this.spend(kind === 'heavy' ? 27 : 14)) return false;
    p.attackKind = kind;
    p.combo = kind === 'light' ? (p.comboWindow > 0 ? p.combo % 3 + 1 : 1) : 1;
    p.attackDuration = kind === 'heavy' ? 0.7 : p.combo === 3 ? 0.49 : 0.37;
    p.attack = p.attackDuration;
    p.hit.clear();
    p.comboWindow = 1;
    this.emit('sound', { name: kind === 'heavy' ? 'heavy' : 'swing' });
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
    for (const key of ['invulnerable', 'dash', 'dashCooldown', 'jumpBuffer', 'staminaDelay', 'parry', 'hurt', 'rallyTimer', 'comboWindow']) p[key] = Math.max(0, p[key] - dt);
    if (p.rallyTimer <= 0) p.rally = Math.max(0, p.rally - 24 * dt);
    if (p.staminaDelay <= 0 && p.dash <= 0 && p.attack <= 0) p.stamina = Math.min(100, p.stamina + 39 * dt);
    if (p.grounded) p.coyote = 0.11;
    else p.coyote = Math.max(0, p.coyote - dt);

    if (input.take('jump')) p.jumpBuffer = 0.14;
    if (p.jumpBuffer > 0 && p.coyote > 0 && p.heal <= 0 && p.hurt <= 0 && p.dash <= 0) {
      p.vy = -670; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0;
      this.burst(p.x + 12, p.y + 48, '#9ca99c', 6, 50);
      this.emit('sound', { name: 'jump' });
    }
    if (!input.down('jump') && p.vy < -280) p.vy += 2000 * dt;
    const move = Number(input.down('right')) - Number(input.down('left'));
    if (move && p.dash <= 0 && p.attack <= 0 && p.hurt <= 0 && p.heal <= 0) p.facing = move;

    if (input.take('dash') && p.dashCooldown <= 0 && p.heal <= 0 && p.hurt <= 0 && this.spend(23)) {
      p.dash = 0.24; p.dashCooldown = 0.45; p.invulnerable = 0.21; p.attack = 0; p.parry = 0; p.queued = null;
      if (move) p.facing = move;
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
      p.vx = p.facing * 565;
      p.vy *= 0.8;
      if (Math.floor(this.time * 55) % 2 === 0) this.afterimages.push({ x: p.x, y: p.y, facing: p.facing, life: 0.22 });
    } else if (p.hurt <= 0) {
      const speed = p.heal > 0 ? 45 : p.attack > 0 ? 94 : p.parry > 0 ? 80 : 220;
      p.vx += (move * speed - p.vx) * Math.min(1, dt * (p.grounded ? 20 : 10));
    } else p.vx *= Math.max(0, 1 - dt * 6);
    this.physics(p, dt);
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
      if (active) this.strike();
      if (p.attack <= 0 && p.queued) { const next = p.queued; p.queued = null; this.beginAttack(next); }
    }
    for (const hazard of this.level.hazards) {
      if (overlaps(p, { x: hazard[0], y: hazard[1] + 8, w: hazard[2], h: 18 })) this.hurtPlayer(18, null, false);
    }
    if (!this.boss.active && this.boss.hp > 0 && p.x > this.level.arena - 50) {
      this.boss.active = true;
      this.emit('boss', { boss: this.boss });
    }
    for (const enemy of this.enemies) this.updateEnemy(enemy, dt);
    if (this.boss.active && this.boss.hp > 0) this.updateEnemy(this.boss, dt);
    this.updateProjectiles(dt);
    this.recoverEchoes();
    if (input.take('interact')) this.interact();
    const targetCamera = clamp(p.x - WIDTH * 0.37 + p.facing * 45, 0, this.level.width - WIDTH);
    this.camera += (targetCamera - this.camera) * (1 - Math.exp(-dt * 5));
  }

  strike() {
    const p = this.player;
    const range = p.attackKind === 'heavy' ? 112 : 83;
    const box = { x: p.facing > 0 ? p.x + 8 : p.x + 16 - range, y: p.y - 8, w: range, h: 68 };
    for (const enemy of [...this.enemies, this.boss]) {
      if (enemy.hp <= 0 || p.hit.has(enemy.id) || (enemy.isBoss && !enemy.active) || !overlaps(box, enemy)) continue;
      p.hit.add(enemy.id);
      const critical = enemy.stagger > 0.6;
      const amount = Math.round(this.damage * (p.attackKind === 'heavy' ? 1.85 : p.combo === 3 ? 1.35 : 1) * (critical ? 2.2 : 1));
      enemy.hp = Math.max(0, enemy.hp - amount);
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
    if (!e.isBoss && distance > 650) return;
    if (e.isBoss && e.hp < e.maxHp * 0.5 && e.phase === 1) {
      e.phase = 2; e.stagger = 0.9; e.state = 'idle'; e.timer = 0.6;
      this.burst(e.x + e.w / 2, e.y + e.h / 2, e.color, 38, 190);
      this.emit('hint', { text: `${e.name.toUpperCase()} — the nightmare deepens.` });
      this.emit('sound', { name: 'phase' });
    }
    if (e.stagger > 0) {
      e.vx *= Math.max(0, 1 - dt * 10);
      this.physics(e, dt);
      return;
    }
    e.timer -= dt;
    const speed = e.isBoss ? (e.kind === 'widow' ? 115 : 86) * (e.phase === 2 ? 1.2 : 1) : e.kind === 'brute' ? 49 : 72;
    if (e.state === 'idle') {
      e.facing = dx >= 0 ? 1 : -1;
      const ranged = ['acolyte', 'cantor', 'astronomer'].includes(e.kind);
      const trigger = ranged ? 440 : e.isBoss ? 240 : e.kind === 'brute' ? 93 : 67;
      if (distance < trigger && Math.abs(p.y + p.h - e.y - e.h) < 180 && e.timer <= 0) {
        e.state = 'windup'; e.vx = 0; e.attackCount++;
        e.pattern = this.patternFor(e);
        e.timer = this.windupFor(e);
        e.windupDuration = e.timer;
        e.targetX = p.x;
        e.didHit = false;
        this.emit('sound', { name: 'tell' });
        if (e.pattern === 'meteor') {
          for (let i = 0; i < (e.phase === 2 ? 4 : 3); i++) this.zones.push({ x: clamp(p.x - 90 + i * 105, this.level.arena, this.level.width - 80), y: 452, radius: 43, timer: e.timer + 0.18 + i * 0.12, life: 0.4, fired: false, owner: e });
        }
      } else e.vx = distance > (ranged ? 300 : 55) ? e.facing * speed : 0;
    } else if (e.state === 'windup') {
      e.vx = 0;
      if (e.timer <= 0) {
        e.state = 'strike';
        e.timer = ['charge', 'leap'].includes(e.pattern) ? 0.68 : 0.28;
        if (e.pattern === 'charge') e.vx = e.facing * (e.isBoss ? 415 : 220);
        if (e.pattern === 'leap') { e.vx = clamp((e.targetX - e.x) * 1.45, -360, 360); e.vy = -610; }
        if (['bolt', 'song', 'nova'].includes(e.pattern)) {
          const angle = Math.atan2(p.y + 20 - (e.y + 32), dx);
          const count = e.pattern === 'bolt' ? 1 : e.phase === 2 ? 5 : 3;
          for (let i = 0; i < count; i++) this.shoot(e, angle + (i - (count - 1) / 2) * 0.23, e.isBoss ? 230 : 190);
          if (e.pattern === 'song' || e.pattern === 'nova') this.projectiles.push({ x: e.x + e.w / 2, y: 434, vx: e.facing * 220, vy: 0, w: 27, h: 18, life: 5, damage: 24, owner: e, wave: true });
        }
        this.emit('sound', { name: e.isBoss ? 'boss-strike' : 'swing' });
      }
    } else if (e.state === 'strike') {
      if (!e.didHit && ['sweep', 'charge', 'leap'].includes(e.pattern)) {
        const reach = e.isBoss ? (e.pattern === 'sweep' ? 108 : 28) : e.kind === 'brute' ? 61 : 37;
        const hitbox = { x: e.facing > 0 ? e.x : e.x - reach, y: e.y + 6, w: e.w + reach, h: e.h - 4 };
        if (overlaps(hitbox, p)) {
          e.didHit = true;
          this.hurtPlayer(e.isBoss ? (e.phase === 2 ? 32 : 26) : e.kind === 'brute' ? 27 : 17, e, e.pattern !== 'leap');
        }
      }
      if (e.timer <= 0) {
        e.state = 'recover'; e.timer = e.isBoss ? (e.phase === 2 ? 0.85 : 1.12) : 0.95; e.vx = 0;
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

  patternFor(e) {
    const n = e.attackCount;
    if (e.kind === 'acolyte') return 'bolt';
    if (e.kind === 'warden') return n % 3 === 0 ? 'charge' : 'sweep';
    if (e.kind === 'widow') return n % 2 === 0 ? 'leap' : e.phase === 2 && n % 3 === 0 ? 'nova' : 'sweep';
    if (e.kind === 'cantor') return n % 3 === 0 ? 'sweep' : 'song';
    if (e.kind === 'astronomer') return n % 2 === 0 ? 'meteor' : 'nova';
    if (e.kind === 'heart') return ['sweep', 'charge', 'nova', 'leap'][n % 4];
    return 'sweep';
  }

  windupFor(e) {
    const duration = e.pattern === 'meteor' ? 1.15 : e.pattern === 'leap' ? 0.95 : e.pattern === 'charge' ? 1 : e.isBoss ? 0.8 : e.kind === 'brute' ? 0.95 : 0.65;
    return duration * (e.phase === 2 ? 0.84 : 1);
  }

  shoot(e, angle, speed) {
    this.projectiles.push({ x: e.x + e.w / 2, y: e.y + 32, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w: 11, h: 11, life: 5, damage: e.isBoss ? 22 : 15, owner: e, wave: false, parryable: e.pattern !== 'nova' });
  }

  updateProjectiles(dt) {
    for (const bolt of this.projectiles) {
      bolt.x += bolt.vx * dt; bolt.y += bolt.vy * dt; bolt.life -= dt;
      if (bolt.life > 0 && overlaps(bolt, this.player)) {
        this.hurtPlayer(bolt.damage, bolt.owner, !bolt.wave && bolt.parryable !== false);
        bolt.life = 0;
        this.burst(bolt.x, bolt.y, '#aecfc4', 8, 100);
      }
    }
    this.projectiles = this.projectiles.filter(b => b.life > 0 && b.y < 650 && b.x > 0 && b.x < this.level.width);
    for (const zone of this.zones) {
      zone.timer -= dt;
      if (zone.timer <= 0 && !zone.fired) {
        zone.fired = true;
        this.burst(zone.x, zone.y - 30, '#cab2df', 22, 180);
        this.shake = 5;
        this.emit('sound', { name: 'heavy' });
        if (Math.abs(this.player.x + 12 - zone.x) < zone.radius + 12 && this.player.y + this.player.h > zone.y - 100) this.hurtPlayer(30, zone.owner, false);
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
    p.invulnerable = 0.8; p.hurt = 0.3; p.attack = 0; p.queued = null; p.heal = 0; p.parry = 0;
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
    p.vx = 0; p.vy = 0; p.dash = 0;
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
    for (const [index, x] of [155, this.level.checkpoint].entries()) if (Math.abs(p.x - x) < 62 && p.y + p.h > 390) return { kind: 'checkpoint', index, text: index ? 'Rest at the wayward lamp' : 'Rest at the lamplighter’s refuge' };
    if (Math.abs(p.x - this.level.noteX) < 48 && p.y + p.h > 380 && !this.save.notes.includes(this.save.chapter)) return { kind: 'note', text: 'Read the forgotten letter' };
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
    } else if (interaction.kind === 'note') {
      this.save.notes = [...new Set([...this.save.notes, this.save.chapter])];
      this.mode = 'lore';
      this.persist();
      this.emit('lore', { note: this.level.note });
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
  }
}
