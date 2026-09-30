var MK = window.MK = window.MK || {};

MK.Game = class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'menu';
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.step = 1 / 60;
  }

  get world() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
      colWidth: this.canvas.width / MK.Const.COLS,
      scrollDistance: this.scrollDistance,
    };
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.accumulator += dt;
    while (this.accumulator >= this.step) {
      this.update(this.step);
      this.accumulator -= this.step;
    }
    MK.Renderer.render(this.ctx, this.canvas, this);
    MK.Input.endFrame();
    requestAnimationFrame(this.loop.bind(this));
  }

  startGame() {
    this.score = 0;
    this.lives = MK.Const.LIVES;
    this.distance = 0;
    this.scrollDistance = 0;
    this.fuel = MK.Const.FUEL_MAX;
    this.terrain = new MK.Terrain();
    this.plane = new MK.Plane(this.world);
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.fuelDepots = [];
    this.explosions = [];
    this.state = 'playing';
    MK.Audio.play('start');
    MK.Audio.startEngine();
  }

  update(dt) {
    const input = MK.Input;

    if (this.state === 'menu') {
      if (input.wasPressed('start')) this.startGame();
      return;
    }
    if (this.state === 'gameover') {
      if (input.wasPressed('start')) this.state = 'menu';
      return;
    }
    if (this.state === 'paused') {
      if (input.wasPressed('pause')) this.state = 'playing';
      return;
    }
    if (input.wasPressed('pause')) {
      this.state = 'paused';
      return;
    }

    this.updatePlaying(dt);
  }

  updatePlaying(dt) {
    const C = MK.Const;
    const world = this.world;
    const diff = MK.getDifficulty(this.distance);

    let speed = C.BASE_SCROLL_SPEED * diff.scrollMultiplier;
    speed += this.plane.throttle > 0 ? this.plane.throttle * C.UP_BONUS : this.plane.throttle * C.DOWN_PENALTY;
    if (this.plane.boosting) speed *= C.RUN_MULTIPLIER;
    speed = Math.max(30, speed);

    this.scrollDistance += speed * dt;
    this.distance += speed * dt;
    this.score += speed * dt * C.SCORE_DISTANCE_RATE;
    MK.Audio.updateEngine(speed / (C.BASE_SCROLL_SPEED * C.RUN_MULTIPLIER));

    this.plane.update(dt, world);
    this.terrain.ensureRows(Math.floor(this.plane.currentRow(world)) + 40);

    if (MK.Input.isDown('shoot')) {
      const spawn = this.plane.tryShoot();
      if (spawn) {
        this.bullets.push(new MK.Bullet(spawn.x, spawn.y, -C.BULLET_SPEED, true));
        MK.Audio.play('shoot');
      }
    }

    this.spawnFromTerrain(world);
    this.updateEnemies(dt, world);
    this.updateBullets(dt, world);
    this.updateFuelDepots(world);
    this.updateExplosions(dt);

    this.fuel -= C.FUEL_DRAIN * (this.plane.boosting ? 1.6 : 1) * dt;
    if (this.fuel <= 0) {
      this.fuel = 0;
      this.crash();
      return;
    }

    this.checkTerrainCollision(world);
    if (this.plane.alive) this.checkEntityCollisions(world);
  }

  spawnFromTerrain(world) {
    const lookaheadRow = Math.floor(this.plane.currentRow(world)) + Math.ceil(world.height / MK.Const.ROW_H) + 2;

    for (const spawn of this.terrain.enemySpawns) {
      if (!spawn.spawned && spawn.row <= lookaheadRow) {
        spawn.spawned = true;
        this.enemies.push(new MK.Enemy(spawn, world));
      }
    }
    for (const spot of this.terrain.fuelSpots) {
      if (!spot.taken && !spot.spawned && spot.row <= lookaheadRow) {
        spot.spawned = true;
        this.fuelDepots.push(new MK.FuelDepot(spot, world));
      }
    }
  }

  updateEnemies(dt, world) {
    for (const e of this.enemies) {
      const bullet = e.update(dt, world, this.terrain);
      if (bullet) this.enemyBullets.push(bullet);
      const y = e.screenY(world);
      if (y > world.height + 60) e.dead = true;
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  updateBullets(dt, world) {
    for (const b of this.bullets) {
      b.update(dt);
      if (b.y < -20) b.dead = true;
    }
    for (const b of this.enemyBullets) {
      b.update(dt);
      if (b.y > world.height + 20) b.dead = true;
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
  }

  updateFuelDepots(world) {
    this.fuelDepots = this.fuelDepots.filter((f) => {
      if (f.taken) return false;
      return f.screenY(world) < world.height + 40;
    });
  }

  updateExplosions(dt) {
    for (const ex of this.explosions) ex.update(dt);
    this.explosions = this.explosions.filter((ex) => !ex.dead);
  }

  checkTerrainCollision(world) {
    if (this.plane.invulnerable > 0) return;

    const C = MK.Const;

    // Hitbox horizontal reduzida (margem de 5px de cada lado)
    const margin = 5;
    const colL = (this.plane.x + margin) / world.colWidth;
    const colR = (this.plane.x + this.plane.w - margin) / world.colWidth;

    // Testa o row do CENTRO do Mario apenas
    // (o gerador garante conectividade — não precisamos de multi-row)
    const rowCenter = Math.floor(this.plane.currentRow(world));

    let navigable = false;
    if (rowCenter < 0) {
      navigable = true;
    } else {
      const data = this.terrain.getRow(rowCenter);
      navigable = data.ranges.some((r) => colL >= r.c0 && colR <= r.c1 + 1);
    }

    if (!navigable) {
      this.crash();
      return;
    }

    const bridge = this.terrain.bridgeAt(rowCenter);
    if (bridge && !bridge.destroyed) {
      this.crash();
    }
  }

  checkEntityCollisions(world) {
    const p = this.plane;

    for (const b of this.bullets) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const ey = e.screenY(world);
        if (MK.aabb(b.x, b.y, b.w, b.h, e.x, ey, e.w, e.h)) {
          e.dead = true;
          b.dead = true;
          this.score += MK.Const.SCORE_KILL;
          this.explosions.push(new MK.Explosion(e.x + e.w / 2, ey + e.h / 2));
          MK.Audio.play('explosion');
        }
      }
      if (b.dead) continue;
      const bulletRow = Math.floor((world.height + world.scrollDistance - b.y) / MK.Const.ROW_H);
      const bridge = this.terrain.bridgeAt(bulletRow);
      if (bridge && !bridge.destroyed) {
        const destroyed = this.terrain.hitBridge(bulletRow, 1);
        b.dead = true;
        if (destroyed) {
          this.score += MK.Const.SCORE_BRIDGE;
          this.explosions.push(new MK.Explosion(b.x, b.y));
          MK.Audio.play('explosion');
        }
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.enemies = this.enemies.filter((e) => !e.dead);

    for (const f of this.fuelDepots) {
      if (f.taken) continue;
      const fy = f.screenY(world);
      if (MK.aabb(p.x, p.y, p.w, p.h, f.x, fy, f.w, f.h)) {
        f.taken = true;
        const spot = this.terrain.fuelSpots.find((s) => s.row === f.row && s.col === f.col);
        if (spot) spot.taken = true;
        this.fuel = Math.min(MK.Const.FUEL_MAX, this.fuel + MK.Const.FUEL_REFILL);
        this.score += MK.Const.SCORE_FUEL;
        MK.Audio.play('fuel');
      }
    }

    if (p.invulnerable > 0) return;

    for (const e of this.enemies) {
      const ey = e.screenY(world);
      if (MK.aabb(p.x, p.y, p.w, p.h, e.x, ey, e.w, e.h)) {
        e.dead = true;
        this.explosions.push(new MK.Explosion(e.x + e.w / 2, ey + e.h / 2));
        this.crash();
        return;
      }
    }

    for (const b of this.enemyBullets) {
      if (MK.aabb(p.x, p.y, p.w, p.h, b.x, b.y, b.w, b.h)) {
        b.dead = true;
        this.crash();
        return;
      }
    }
  }

  crash() {
    this.explosions.push(new MK.Explosion(this.plane.x + this.plane.w / 2, this.plane.y + this.plane.h / 2));
    MK.Audio.play('crash');
    this.plane.alive = false;
    this.loseLife();
  }

  loseLife() {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.state = 'gameover';
      MK.Audio.stopEngine();
      MK.Audio.play('gameover');
      return;
    }
    this.plane.reset(this.world);
    this.fuel = Math.max(this.fuel, MK.Const.FUEL_MAX * 0.5);
    this.enemyBullets = [];
  }
};

