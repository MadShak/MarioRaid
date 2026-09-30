var MK = window.MK = window.MK || {};

// O jogador agora é o Super Mario com capa voando.
// A classe mantém o nome interno "Plane" por compatibilidade com game.js,
// mas semanticamente representa o Mario.
MK.Plane = class Mario {
  constructor(world) {
    const C = MK.Const;
    this.w = C.PLANE_W;
    this.h = C.PLANE_H;
    this.x = world.width / 2 - this.w / 2;
    this.y = world.height * C.PLANE_BOTTOM;
    this.alive = true;
    this.invulnerable = 0;
    this.shootCooldown = 0;
    this.bankTilt = 0;
    this.throttle = 0;
    this.boosting = false;
  }

  reset(world) {
    const C = MK.Const;
    this.x = world.width / 2 - this.w / 2;
    this.y = world.height * C.PLANE_BOTTOM;
    this.alive = true;
    this.invulnerable = C.INVULNERABLE_TIME;
    this.shootCooldown = 0;
  }

  currentRow(world) {
    const C = MK.Const;
    const centerY = this.y + this.h / 2;
    return (world.height + world.scrollDistance - centerY) / C.ROW_H;
  }

  update(dt, world) {
    const C = MK.Const;
    const input = MK.Input;
    if (this.invulnerable > 0) this.invulnerable -= dt;

    let vx = 0;
    if (input.isDown('left')) vx -= C.LATERAL_SPEED;
    if (input.isDown('right')) vx += C.LATERAL_SPEED;
    this.bankTilt += ((vx / C.LATERAL_SPEED) - this.bankTilt) * Math.min(1, dt * 8);
    this.x = MK.clamp(this.x + vx * dt, 0, world.width - this.w);

    let vy = 0;
    if (input.isDown('up')) vy -= C.PLANE_VERTICAL_SPEED;
    if (input.isDown('down')) vy += C.PLANE_VERTICAL_SPEED;
    const top = world.height * C.PLANE_TOP;
    const bottom = world.height * C.PLANE_BOTTOM;
    this.y = MK.clamp(this.y + vy * dt, top, bottom);

    this.throttle = (input.isDown('up') ? 1 : 0) - (input.isDown('down') ? 1 : 0);
    this.boosting = input.isDown('run');

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
  }

  tryShoot() {
    if (this.shootCooldown > 0) return null;
    this.shootCooldown = MK.Const.BULLET_COOLDOWN;
    return { x: this.x + this.w / 2 - 2, y: this.y };
  }
};

MK.Bullet = class Bullet {
  constructor(x, y, vy, friendly) {
    this.x = x;
    this.y = y;
    this.w = 4;
    this.h = 12;
    this.vy = vy;
    this.friendly = friendly;
    this.dead = false;
  }

  update(dt) {
    this.y += this.vy * dt;
  }
};

MK.Enemy = class Enemy {
  constructor(spawn, world) {
    const C = MK.Const;
    this.kind = spawn.kind;
    this.worldRow = spawn.row;
    this.col = spawn.col;
    this.w = this.kind === 'copter' ? 30 : 34;
    this.h = this.kind === 'copter' ? 22 : 20;
    this.colWidth = world.width / C.COLS;
    this.x = spawn.col * this.colWidth - this.w / 2;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.fireTimer = C.ENEMY_FIRE_INTERVAL * (0.5 + Math.random());
    this.dead = false;
    this.hp = 1;
  }

  screenY(world) {
    const C = MK.Const;
    return world.height - this.worldRow * C.ROW_H + world.scrollDistance - this.h / 2;
  }

  update(dt, world, terrain) {
    const C = MK.Const;
    const row = terrain.getRow(this.worldRow);
    const range = row.ranges[0] || { c0: 0, c1: C.COLS - 1 };
    const minX = range.c0 * this.colWidth;
    const maxX = range.c1 * this.colWidth - this.w;

    this.x += this.dir * C.ENEMY_SPEED * dt;
    if (this.x < minX) { this.x = minX; this.dir = 1; }
    if (this.x > maxX) { this.x = maxX; this.dir = -1; }

    this.fireTimer -= dt;
    let firedBullet = null;
    if (this.fireTimer <= 0) {
      this.fireTimer = C.ENEMY_FIRE_INTERVAL * (0.7 + Math.random() * 0.6);
      const y = this.screenY(world);
      if (y > 0 && y < world.height * 0.85) {
        firedBullet = new MK.Bullet(this.x + this.w / 2 - 2, y + this.h, C.ENEMY_BULLET_SPEED, false);
      }
    }
    return firedBullet;
  }
};

MK.FuelDepot = class FuelDepot {
  constructor(spot, world) {
    this.row = spot.row;
    this.col = spot.col;
    this.taken = false;
    this.w = 26;
    this.h = 18;
    this.colWidth = world.width / MK.Const.COLS;
    this.x = spot.col * this.colWidth - this.w / 2;
  }

  screenY(world) {
    return world.height - this.row * MK.Const.ROW_H + world.scrollDistance - this.h / 2;
  }
};

MK.Explosion = class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.age = 0;
    this.duration = 0.5;
    this.dead = false;
  }

  update(dt) {
    this.age += dt;
    if (this.age >= this.duration) this.dead = true;
  }
};

