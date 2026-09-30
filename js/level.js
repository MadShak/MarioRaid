var MK = window.MK = window.MK || {};

MK.Terrain = class Terrain {
  constructor() {
    const C = MK.Const;
    this.rows       = [];
    this.bridges    = new Map();
    this.fuelSpots  = [];
    this.enemySpawns = [];

    // Centro do rio — o gerador move só o CENTRO, calculando left/right a partir dele
    this.riverCenter = C.COLS / 2;          // começa no centro exato
    this.riverWidth  = C.RIVER_START_WIDTH; // largura inicial (generosa)
    this.centerVel   = 0;                   // velocidade do meander (acumulada)

    this.islandActive = false;
    this.islandCol0   = 0;
    this.islandCol1   = 0;
    this.islandRowsLeft = 0;

    this.rowsSinceBridge = Math.floor(C.BRIDGE_EVERY_ROWS / 2);
    this.rowsSinceFuel   = 0;

    // Pré-gera as primeiras linhas com área aberta para o início do jogo
    this._generateOpeningRows();
    this.ensureRows(80);
  }

  // ── Área inicial: as primeiras N rows são totalmente abertas ──────────────
  _generateOpeningRows() {
    const C = MK.Const;
    // 40 rows de área aberta (≈ 1.5 telas de altura) antes de qualquer obstáculo
    for (let i = 0; i < C.RIVER_OPEN_ROWS; i++) {
      this.rows.push({
        ranges: [{ c0: C.RIVER_OPEN_C0, c1: C.RIVER_OPEN_C1 }],
        bridge: false,
      });
    }
    // Sincroniza o estado do gerador com o fim da área aberta
    this.riverCenter = (C.RIVER_OPEN_C0 + C.RIVER_OPEN_C1) / 2;
    this.riverWidth  = C.RIVER_OPEN_C1 - C.RIVER_OPEN_C0;
    this.rowsSinceBridge = Math.floor(C.BRIDGE_EVERY_ROWS / 2);
  }

  ensureRows(count) {
    while (this.rows.length < count) this._generateRow();
  }

  _generateRow() {
    const C = MK.Const;

    // ── 1. Move o CENTRO do rio com meander suave ─────────────────────────
    //    centerVel acumula inércia — cria curvas orgânicas, não zigue-zague
    this.centerVel += (Math.random() - 0.5) * C.RIVER_MEANDER_ACCEL;
    this.centerVel  = MK.clamp(this.centerVel, -C.RIVER_MEANDER_MAX_VEL, C.RIVER_MEANDER_MAX_VEL);
    this.riverCenter += this.centerVel;

    // ── 2. Varia a largura do rio levemente ───────────────────────────────
    this.riverWidth += (Math.random() - 0.5) * 0.4;
    this.riverWidth  = MK.clamp(this.riverWidth, C.MIN_RIVER_WIDTH, C.MAX_RIVER_WIDTH);

    // ── 3. Calcula left/right garantindo que fiquem dentro dos limites ────
    let half  = this.riverWidth / 2;
    // Garante que o centro + metade cabe dentro das colunas válidas [1, COLS-2]
    this.riverCenter = MK.clamp(this.riverCenter, 1 + half, C.COLS - 2 - half);

    let left  = Math.round(this.riverCenter - half);
    let right = Math.round(this.riverCenter + half);

    // Garante largura mínima absoluta após arredondamento
    if (right - left < C.MIN_RIVER_WIDTH) {
      right = left + C.MIN_RIVER_WIDTH;
    }
    // Garante limites de tela (deixa 1 col de margem em cada borda para vegetação)
    left  = MK.clamp(left,  1, C.COLS - C.MIN_RIVER_WIDTH - 2);
    right = MK.clamp(right, left + C.MIN_RIVER_WIDTH, C.COLS - 2);

    // Atualiza riverCenter com os valores finais (evita drift acumulado)
    this.riverCenter = (left + right) / 2;
    this.riverWidth  = right - left;

    // ── 4. Ilhas ──────────────────────────────────────────────────────────
    let ranges = [{ c0: left, c1: right }];

    if (this.islandActive) {
      this.islandRowsLeft--;

      // Canais: ao menos MIN_CANAL_W colunas de cada lado da ilha
      const mc  = C.MIN_CANAL_W;
      const lOk = (this.islandCol0 - 1) >= (left  + mc - 1); // canal esq tem ≥mc cols
      const rOk = (this.islandCol1 + 1) <= (right - mc + 1); // canal dir tem ≥mc cols

      if (lOk || rOk) {
        ranges = [];
        if (lOk) ranges.push({ c0: left,               c1: this.islandCol0 - 1 });
        if (rOk) ranges.push({ c0: this.islandCol1 + 1, c1: right              });
      }
      // Se nenhum canal válido, abandona a ilha imediatamente
      if (ranges.length === 0 || (!lOk && !rOk)) {
        ranges = [{ c0: left, c1: right }];
        this.islandActive   = false;
        this.islandRowsLeft = 0;
      }
      if (this.islandRowsLeft <= 0) this.islandActive = false;

    } else if (Math.random() < C.ISLAND_CHANCE) {
      // Ilha nasce se o rio tiver espaço para 2 canais + ilha
      const mc  = C.MIN_CANAL_W;
      const minW = mc + C.MIN_ISLAND_W + mc; // mínimo total
      if (right - left >= minW) {
        const maxIW  = Math.min(C.MAX_ISLAND_W, right - left - mc * 2);
        const iw     = MK.randInt(C.MIN_ISLAND_W, maxIW);
        const ic0    = MK.randInt(left + mc, right - iw - mc);
        if (ic0 + iw <= right - mc) {          // segurança extra
          this.islandCol0     = ic0;
          this.islandCol1     = ic0 + iw;
          this.islandActive   = true;
          this.islandRowsLeft = MK.randInt(C.ISLAND_MIN_ROWS, C.ISLAND_MAX_ROWS);
        }
      }
    }

    // ── 5. Pontes ─────────────────────────────────────────────────────────
    let bridge = false;
    this.rowsSinceBridge++;
    this.rowsSinceFuel++;

    if (!this.islandActive && this.rowsSinceBridge >= C.BRIDGE_EVERY_ROWS) {
      bridge = true;
      ranges = [{ c0: left, c1: right }];
      this.rowsSinceBridge = 0;
      this.bridges.set(this.rows.length, {
        hp: C.BRIDGE_HP, destroyed: false, c0: left, c1: right,
      });
    }

    // ── 6. Combustível ────────────────────────────────────────────────────
    if (!bridge && !this.islandActive
        && this.rowsSinceFuel >= C.FUEL_EVERY_ROWS && Math.random() < 0.7) {
      const col = MK.randInt(left + 1, right - 1);
      this.fuelSpots.push({ row: this.rows.length, col, taken: false });
      this.rowsSinceFuel = 0;
    }

    // ── 7. Inimigos ───────────────────────────────────────────────────────
    if (!bridge && !this.islandActive && Math.random() < C.ENEMY_CHANCE) {
      const col = MK.randInt(left + 1, right - 1);
      this.enemySpawns.push({
        row: this.rows.length, col,
        kind: Math.random() < 0.5 ? 'ship' : 'copter',
        spawned: false,
      });
    }

    // ── 8. Garantia final de conectividade com a row anterior ─────────────
    // Se o novo range não sobrepõe com o anterior, força sobreposição
    if (this.rows.length > 0) {
      const prev = this.rows[this.rows.length - 1].ranges;
      if (!this._overlaps(prev, ranges)) {
        // Move o range atual para cobrir o centro do range anterior
        const prevCenter = Math.round((prev[0].c0 + prev[0].c1) / 2);
        const w = right - left;
        left  = MK.clamp(prevCenter - Math.floor(w / 2), 1, C.COLS - w - 2);
        right = left + w;
        ranges = [{ c0: left, c1: right }];
        // Sincroniza o estado
        this.riverCenter = (left + right) / 2;
        this.riverWidth  = w;
        this.centerVel   = 0; // reseta inércia para evitar que o bug se repita
      }
    }

    this.rows.push({ ranges, bridge });
  }

  // Verifica se dois conjuntos de ranges se sobrepõem em alguma coluna
  _overlaps(rangesA, rangesB) {
    for (const a of rangesA) {
      for (const b of rangesB) {
        if (a.c0 <= b.c1 && a.c1 >= b.c0) return true;
      }
    }
    return false;
  }

  getRow(row) {
    if (row < 0) return { ranges: [{ c0: 0, c1: MK.Const.COLS - 1 }], bridge: false };
    this.ensureRows(row + MK.Const.MARGIN_ROWS);
    return this.rows[row];
  }

  isNavigable(row, col) {
    const data = this.getRow(row);
    return data.ranges.some((r) => col >= r.c0 && col <= r.c1);
  }

  bridgeAt(row) {
    return this.bridges.get(row) || null;
  }

  hitBridge(row, amount) {
    const b = this.bridges.get(row);
    if (!b || b.destroyed) return false;
    b.hp -= amount;
    if (b.hp <= 0) b.destroyed = true;
    return b.destroyed;
  }
};
