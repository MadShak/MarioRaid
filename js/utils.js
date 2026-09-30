var MK = window.MK = window.MK || {};

MK.Const = {
  COLS: 24,
  ROW_H: 32,
  CHUNK_ROWS: 20,
  MARGIN_ROWS: 6,

  // ── Rio ──────────────────────────────────────────────────────────────────
  MIN_RIVER_WIDTH:  9,   // mínimo de colunas navegáveis (≈384px — cabe o Mario+folga)
  MAX_RIVER_WIDTH: 17,   // máximo (rio largo)

  // Área inicial aberta — o Mario começa aqui sem risco de colisão
  RIVER_OPEN_ROWS: 45,   // quantas rows ficam completamente abertas no início
  RIVER_OPEN_C0:   2,    // coluna esquerda da área aberta
  RIVER_OPEN_C1:   21,   // coluna direita (22 colunas = quase toda a tela)

  // Largura inicial do rio ao sair da área aberta
  RIVER_START_WIDTH: 14,

  // Meander — controla a suavidade das curvas
  RIVER_MEANDER_ACCEL:   0.18,  // aceleração por row (baixo = curvas suaves)
  RIVER_MEANDER_MAX_VEL: 0.55,  // velocidade máxima de deslocamento lateral

  // ── Ilhas ─────────────────────────────────────────────────────────────────
  ISLAND_CHANCE:    0.025, // 2.5% de chance por row de nascer uma ilha
  ISLAND_MIN_ROWS:  5,
  ISLAND_MAX_ROWS:  10,
  MIN_ISLAND_W:     2,    // largura mínima da ilha em colunas
  MAX_ISLAND_W:     3,    // largura máxima
  MIN_CANAL_W:      4,    // canal lateral mínimo em colunas (≈170px — cabe o Mario)

  // ── Pontes e combustível ──────────────────────────────────────────────────
  BRIDGE_EVERY_ROWS: 140,
  FUEL_EVERY_ROWS:   55,
  ENEMY_CHANCE:      0.04,

  BASE_SCROLL_SPEED: 90,
  UP_BONUS: 80,
  DOWN_PENALTY: 55,
  RUN_MULTIPLIER: 1.6,
  LATERAL_SPEED: 260,

  PLANE_W: 38,
  PLANE_H: 44,
  PLANE_TOP: 0.5,
  PLANE_BOTTOM: 0.82,
  PLANE_VERTICAL_SPEED: 220,

  BULLET_SPEED: 520,
  BULLET_COOLDOWN: 0.2,
  ENEMY_BULLET_SPEED: 260,

  ENEMY_SPEED: 55,
  ENEMY_FIRE_INTERVAL: 1.8,

  FUEL_MAX: 100,
  FUEL_DRAIN: 3,
  FUEL_REFILL: 45,

  LIVES: 3,
  BRIDGE_HP: 3,

  SCORE_DISTANCE_RATE: 0.06,
  SCORE_KILL: 150,
  SCORE_FUEL: 50,
  SCORE_BRIDGE: 300,
  INVULNERABLE_TIME: 2.0,

  // Aliases semânticos para o Mario
  MARIO_W: 38,
  MARIO_H: 44,
};

MK.clamp = function (v, a, b) {
  return Math.max(a, Math.min(b, v));
};

MK.aabb = function (ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
};

MK.randInt = function (min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
};

