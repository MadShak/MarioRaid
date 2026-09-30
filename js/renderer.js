var MK = window.MK = window.MK || {};

MK.Renderer = (function () {
  const FONT = '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
  const MONO = '"Consolas", "SF Mono", "Courier New", monospace';
  const MARIO_FONT = '"Arial Black", "Arial Bold", Gadget, sans-serif';

  // ── helpers ────────────────────────────────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function glowText(ctx, text, x, y, color, blur) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur || 12;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── CENÁRIO FOTORREALISTA ─────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // ── CÉU FOTORREALISTA ──────────────────────────────────────────────────────
  // Gradiente atmosférico real: azul profundo no zênite, neblina no horizonte
  function drawSky(ctx, canvas, tick) {
    const W = canvas.width;
    const H = canvas.height;
    // Gradiente atmosférico – scattering de Rayleigh simplificado
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0,    '#1a3a6e'); // zênite: azul profundo
    skyGrad.addColorStop(0.18, '#2255a0'); // céu alto
    skyGrad.addColorStop(0.42, '#3d7ac8'); // céu médio
    skyGrad.addColorStop(0.68, '#6ba8de'); // céu baixo
    skyGrad.addColorStop(0.88, '#a8cce8'); // horizonte: mais claro
    skyGrad.addColorStop(1,    '#c8dff0'); // neblina de horizonte
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Névoa/haze atmosférico horizontal no horizonte
    const hazeGrad = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.85);
    hazeGrad.addColorStop(0, 'rgba(210,230,248,0)');
    hazeGrad.addColorStop(1, 'rgba(220,238,252,0.28)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, H * 0.55, W, H * 0.3);

    // ── Sol realista ──────────────────────────────────────────────────────
    const sunX = W * 0.82;
    const sunY = H * 0.09;

    // Corona (halo mais externo, difuso)
    const corona = ctx.createRadialGradient(sunX, sunY, 28, sunX, sunY, 200);
    corona.addColorStop(0,   'rgba(255,240,180,0.22)');
    corona.addColorStop(0.3, 'rgba(255,220,120,0.10)');
    corona.addColorStop(1,   'rgba(255,200,80,0)');
    ctx.fillStyle = corona;
    ctx.fillRect(sunX - 200, sunY - 200, 400, 400);

    // Halo médio (glare fotográfico)
    const halo = ctx.createRadialGradient(sunX, sunY, 14, sunX, sunY, 90);
    halo.addColorStop(0,   'rgba(255,255,220,0.85)');
    halo.addColorStop(0.25,'rgba(255,240,160,0.55)');
    halo.addColorStop(0.6, 'rgba(255,220,100,0.18)');
    halo.addColorStop(1,   'rgba(255,200,60,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    // Disco solar
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,200,0.9)';
    ctx.shadowBlur = 30;
    const sunDisc = ctx.createRadialGradient(sunX - 4, sunY - 4, 0, sunX, sunY, 20);
    sunDisc.addColorStop(0,   '#fffde8');
    sunDisc.addColorStop(0.5, '#fff5b0');
    sunDisc.addColorStop(1,   '#fde060');
    ctx.fillStyle = sunDisc;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Raios de luz (god rays) sutis – linhas longas radiais
    ctx.save();
    ctx.globalAlpha = 0.04 + Math.sin(tick * 0.3) * 0.01;
    ctx.strokeStyle = '#fff8d0';
    ctx.lineWidth = 18;
    for (let ri = 0; ri < 8; ri++) {
      const angle = (ri / 8) * Math.PI * 2 + tick * 0.015;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 22, sunY + Math.sin(angle) * 22);
      ctx.lineTo(sunX + Math.cos(angle) * 320, sunY + Math.sin(angle) * 320);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Nuvens volumétricas fotorrealistas ──────────────────────────────
    // Camada 1 – nuvens grandes, alto contraste (cirros / cúmulos)
    const clouds1 = [
      { bx: 0.04, by: 0.08,  w: 180, h: 55,  speed: 10 },
      { bx: 0.32, by: 0.05,  w: 220, h: 65,  speed: 10 },
      { bx: 0.61, by: 0.10,  w: 160, h: 48,  speed: 10 },
      { bx: 0.88, by: 0.06,  w: 190, h: 58,  speed: 10 },
    ];
    for (const c of clouds1) {
      const cx2 = ((c.bx * W - (tick * c.speed) % W) + W * 1.2) % (W * 1.2) - c.w;
      drawRealisticCloud(ctx, cx2, c.by * H, c.w, c.h, 0.92, sunX, sunY);
    }
    // Camada 2 – nuvens menores, mais translúcidas, velocidade diferente
    const clouds2 = [
      { bx: 0.18, by: 0.17,  w: 110, h: 32,  speed: 6 },
      { bx: 0.45, by: 0.20,  w: 130, h: 38,  speed: 6 },
      { bx: 0.72, by: 0.15,  w: 95,  h: 28,  speed: 6 },
      { bx: 0.95, by: 0.22,  w: 120, h: 35,  speed: 6 },
    ];
    for (const c of clouds2) {
      const cx2 = ((c.bx * W - (tick * c.speed) % W) + W * 1.15) % (W * 1.15) - c.w;
      drawRealisticCloud(ctx, cx2, c.by * H, c.w, c.h, 0.65, sunX, sunY);
    }
  }

  // Nuvem volumétrica fotorrealista usando múltiplos radialGradients sobrepostos
  function drawRealisticCloud(ctx, x, y, w, h, opacity, sunX, sunY) {
    ctx.save();
    ctx.globalAlpha = opacity;

    // Determina se o sol está à esquerda ou direita para iluminação
    const lightFromLeft = sunX < x + w / 2;
    const litSide  = lightFromLeft ? x + w * 0.25 : x + w * 0.75;
    const darkSide = lightFromLeft ? x + w * 0.85 : x + w * 0.15;

    // Sombra inferior da nuvem (underside cinza azulado)
    const shadowGrad = ctx.createLinearGradient(x, y, x, y + h);
    shadowGrad.addColorStop(0,   'rgba(255,255,255,0)');
    shadowGrad.addColorStop(0.6, 'rgba(200,215,235,0.35)');
    shadowGrad.addColorStop(1,   'rgba(160,180,210,0.55)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.72, w * 0.46, h * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpo principal da nuvem — série de blobs brancos com profundidade
    const blobs = [
      { rx: 0.50, ry: 0.42, rw: 0.42, rh: 0.50, bright: 0.97 },
      { rx: 0.25, ry: 0.55, rw: 0.32, rh: 0.40, bright: 0.88 },
      { rx: 0.75, ry: 0.55, rw: 0.30, rh: 0.38, bright: 0.85 },
      { rx: 0.15, ry: 0.68, rw: 0.22, rh: 0.30, bright: 0.80 },
      { rx: 0.85, ry: 0.65, rw: 0.20, rh: 0.28, bright: 0.78 },
      { rx: 0.50, ry: 0.70, rw: 0.40, rh: 0.28, bright: 0.84 },
    ];
    for (const b of blobs) {
      const bx2 = x + b.rx * w;
      const by2 = y + b.ry * h;
      const bw2 = b.rw * w;
      const bh2 = b.rh * h;
      const v = Math.round(b.bright * 255);
      const radG = ctx.createRadialGradient(
        bx2 - bw2 * (lightFromLeft ? 0.2 : -0.2), by2 - bh2 * 0.3, 0,
        bx2, by2, Math.max(bw2, bh2)
      );
      radG.addColorStop(0,   `rgba(${v},${v},${v},0.95)`);
      radG.addColorStop(0.55,`rgba(${Math.round(v*0.9)},${Math.round(v*0.92)},${v},0.7)`);
      radG.addColorStop(1,   'rgba(200,215,235,0)');
      ctx.fillStyle = radG;
      ctx.beginPath();
      ctx.ellipse(bx2, by2, bw2, bh2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── TERRAIN ────────────────────────────────────────────────────────────────
  function colToPx(col, world) {
    return col * world.colWidth;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── TERRENO FOTORREALISTA ─────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // Semente pseudo-aleatória estável por linha+col (não usa Math.random())
  function seededVal(a, b, c) {
    const s = Math.sin(a * 127.1 + b * 311.7 + (c || 0) * 74.3) * 43758.5453;
    return s - Math.floor(s);
  }

  // ── MARGEM FOTORREALISTA ──────────────────────────────────────────────────
  // Camadas: terra úmida escura → vegetação rasteira → copa de árvores tropicais
  // + pedras, raízes, variação de cor orgânica
  function drawBank(ctx, x, y, w, h, row, tick) {
    if (w <= 0) return;
    ctx.save();

    // ── CLIP: nada do banco pode vazar para a água ─────────────────────
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // ── 1) Camada de terra úmida (base) ─────────────────────────────────
    const soilGrad = ctx.createLinearGradient(0, y, 0, y + h);
    soilGrad.addColorStop(0,    '#3a2a14');
    soilGrad.addColorStop(0.30, '#2e1f0c');
    soilGrad.addColorStop(0.65, '#1e1208');
    soilGrad.addColorStop(1,    '#120c04');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(x, y, w, h);

    // Textura de solo: manchas orgânicas escuras
    for (let ti = 0; ti < Math.ceil(w / 12); ti++) {
      const tx = x + seededVal(row, ti, 1) * w;
      const ty = y + h * (0.3 + seededVal(row, ti, 2) * 0.65);
      const tr = 2 + seededVal(row, ti, 3) * 5;
      ctx.fillStyle = `rgba(${10 + Math.floor(seededVal(row,ti,4)*20)},${8+Math.floor(seededVal(row,ti,5)*12)},2,0.45)`;
      ctx.beginPath();
      ctx.ellipse(tx, ty, tr * 1.6, tr * 0.6, seededVal(row,ti,6)*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }

    // ── 2) Faixa de lama/areia úmida na beira d'água ─────────────────────
    const mudGrad = ctx.createLinearGradient(0, y, 0, y + h * 0.2);
    mudGrad.addColorStop(0, 'rgba(100,75,40,0.85)');
    mudGrad.addColorStop(1, 'rgba(60,40,15,0)');
    ctx.fillStyle = mudGrad;
    ctx.fillRect(x, y, w, h * 0.22);

    // Linha de sedimento na beira (margem clara arenosa)
    ctx.fillStyle = 'rgba(160,130,75,0.6)';
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = 'rgba(190,155,90,0.35)';
    ctx.fillRect(x, y + 1, w, 1);

    // ── 3) Vegetação rasteira (entre a beira e as árvores) ────────────────
    const grassH = h * 0.38;
    const grassGrad = ctx.createLinearGradient(0, y + h * 0.15, 0, y + h * 0.55);
    grassGrad.addColorStop(0,   '#4a7a1e');
    grassGrad.addColorStop(0.4, '#3a6018');
    grassGrad.addColorStop(1,   '#2a4a10');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(x, y + h * 0.15, w, grassH);

    // Tufos de grama alta com variação de cor (realista)
    const tufts = Math.max(3, Math.floor(w / 8));
    for (let gi = 0; gi < tufts; gi++) {
      const gx = x + (gi / tufts) * w + seededVal(row, gi, 7) * (w / tufts) * 0.8;
      const gy = y + h * (0.12 + seededVal(row, gi, 8) * 0.18);
      const gh = h * (0.18 + seededVal(row, gi, 9) * 0.22);
      const gw = 1.2 + seededVal(row, gi, 10) * 2.2;
      // Variação de verde: alguns mais amarelados, outros mais escuros
      const greenVal = 80 + Math.floor(seededVal(row, gi, 11) * 70);
      const redVal   = 30 + Math.floor(seededVal(row, gi, 12) * 40);
      ctx.fillStyle = `rgb(${redVal},${greenVal},15)`;
      // Forma triangular de cada tufo de grama
      ctx.beginPath();
      ctx.moveTo(gx - gw, gy + gh);
      ctx.lineTo(gx, gy);
      ctx.lineTo(gx + gw, gy + gh);
      ctx.closePath();
      ctx.fill();
    }

    // ── 4) Pedras e rochas espalhadas ─────────────────────────────────────
    const rockCount = Math.max(1, Math.floor(w / 28));
    for (let ri2 = 0; ri2 < rockCount; ri2++) {
      const rv = seededVal(row * 3 + 1, ri2, 13);
      if (rv > 0.55) continue; // apenas ~45% das posições têm pedra
      const rx = x + (ri2 / rockCount) * w + seededVal(row, ri2, 14) * (w / rockCount) * 0.7;
      const ry = y + h * (0.25 + seededVal(row, ri2, 15) * 0.55);
      const rw = 4 + seededVal(row, ri2, 16) * 9;
      const rh = rw * (0.4 + seededVal(row, ri2, 17) * 0.35);
      drawRock(ctx, rx, ry, rw, rh, row, ri2);
    }

    // ── 5) Copa de árvores tropicais (camada mais próxima do jogador) ─────
    // Só se a margem for larga o suficiente
    if (w >= 22) {
      const treeCount = Math.max(1, Math.floor(w / 30));
      for (let ti2 = 0; ti2 < treeCount; ti2++) {
        const tv = seededVal(row * 7 + 3, ti2, 18);
        if (tv > 0.75) continue;
        const tx2 = x + (ti2 / treeCount) * w + seededVal(row, ti2, 19) * (w / treeCount) * 0.6;
        const ty2 = y + h * (0.28 + seededVal(row, ti2, 20) * 0.35);
        const treeR = 7 + seededVal(row, ti2, 21) * 11;
        if (tx2 - treeR < x || tx2 + treeR > x + w) continue;
        drawTropicalTreeTop(ctx, tx2, ty2, treeR, row, ti2, tick);
      }
    }

    // ── 6) Sombra projetada na água (borda direita ou esquerda do banco) ──
    // Já tratada no drawTerrain com gradientes laterais

    ctx.restore();
  }

  // Pedra fotorrealista: elipse com gradiente de iluminação zenital
  function drawRock(ctx, x, y, w, h, row, idx) {
    ctx.save();
    const litX = x - w * 0.25;
    const litY = y - h * 0.35;
    const rockGrad = ctx.createRadialGradient(litX, litY, 0, x, y, Math.max(w, h));
    // Variação de tonalidade: alguns acinzentados, outros com musgo esverdeado
    const mossy = seededVal(row, idx, 30) > 0.55;
    if (mossy) {
      rockGrad.addColorStop(0,   '#b0b890');
      rockGrad.addColorStop(0.4, '#8a9070');
      rockGrad.addColorStop(0.75,'#5a6040');
      rockGrad.addColorStop(1,   '#2e3020');
    } else {
      rockGrad.addColorStop(0,   '#d0cfc8');
      rockGrad.addColorStop(0.4, '#9e9c94');
      rockGrad.addColorStop(0.75,'#6a6860');
      rockGrad.addColorStop(1,   '#383630');
    }
    ctx.fillStyle = rockGrad;
    // Forma ligeiramente irregular (não perfeitamente oval)
    const angle = seededVal(row, idx, 31) * 0.8 - 0.4;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, angle, 0, Math.PI * 2);
    ctx.fill();
    // Destaque especular no topo esquerdo
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(x - w * 0.28, y - h * 0.3, w * 0.3, h * 0.22, angle - 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Sombra na base
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.1, y + h * 0.55, w * 0.7, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Copa de árvore tropical fotorrealista (vista de cima)
  // Camadas concêntricas de folhas com variação de luminosidade e sombra central
  function drawTropicalTreeTop(ctx, cx, cy, r, row, idx, tick) {
    ctx.save();
    // Sombra da copa projetada (ligeiramente deslocada para sudeste)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.25, cy + r * 0.2, r * 1.05, r * 0.7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Camada exterior de folhas (mais escura – sombreada pelas folhas de cima)
    const outerGrad = ctx.createRadialGradient(cx - r*0.2, cy - r*0.25, r*0.1, cx, cy, r);
    outerGrad.addColorStop(0,   '#3a7020');
    outerGrad.addColorStop(0.5, '#2a5818');
    outerGrad.addColorStop(1,   '#1a3a0c');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Camada intermediária (folhas iluminadas pelo sol)
    const midR = r * 0.72;
    const midGrad = ctx.createRadialGradient(cx - r*0.15, cy - r*0.2, 0, cx, cy, midR);
    midGrad.addColorStop(0,   '#6ab030');
    midGrad.addColorStop(0.45,'#4d8a20');
    midGrad.addColorStop(1,   '#2e5a10');
    ctx.fillStyle = midGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, midR, 0, Math.PI * 2);
    ctx.fill();

    // Folhas individuais na borda (polígonos irregulares)
    const leafCount = 6 + Math.floor(seededVal(row, idx, 40) * 4);
    for (let li = 0; li < leafCount; li++) {
      const la = (li / leafCount) * Math.PI * 2 + seededVal(row, idx + li, 41) * 0.5;
      const ld = r * (0.55 + seededVal(row, idx + li, 42) * 0.45);
      const lx = cx + Math.cos(la) * ld;
      const ly = cy + Math.sin(la) * ld;
      const lr = r * (0.15 + seededVal(row, idx + li, 43) * 0.22);
      // Verde variado: limão, floresta, oliva
      const greens = ['#6abf2a','#4a9018','#5aaa22','#3d7a14','#7ac832'];
      ctx.fillStyle = greens[li % greens.length];
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Topo brilhante da copa (reflexo solar)
    const topGrad = ctx.createRadialGradient(cx - r*0.18, cy - r*0.22, 0, cx - r*0.1, cy - r*0.1, r*0.38);
    topGrad.addColorStop(0,   'rgba(180,255,100,0.55)');
    topGrad.addColorStop(0.5, 'rgba(100,200,50,0.20)');
    topGrad.addColorStop(1,   'rgba(80,160,30,0)');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Tronco/centro escuro (buraco de sombra no centro da copa)
    const trunkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.28);
    trunkGrad.addColorStop(0,   'rgba(15,10,5,0.75)');
    trunkGrad.addColorStop(0.6, 'rgba(20,14,6,0.35)');
    trunkGrad.addColorStop(1,   'rgba(20,14,6,0)');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── RIO + MARGENS fotorrealistas ──────────────────────────────────────────
  function drawTerrain(ctx, canvas, world, terrain, tick) {
    const C = MK.Const;
    const rowH = C.ROW_H;
    const visRows = Math.ceil(canvas.height / rowH) + 2;
    const startRow = Math.floor(world.scrollDistance / rowH);
    const offsetY = world.scrollDistance % rowH;

    // ── Pré-renderiza toda a água de uma vez (1 fillRect largo) ──────────
    // para evitar criar centenas de gradientes pequenos — performance
    const waterFullGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    waterFullGrad.addColorStop(0,    '#1a5fa0');  // água mais profunda (topo)
    waterFullGrad.addColorStop(0.35, '#1e72b8');
    waterFullGrad.addColorStop(0.7,  '#2280c8');
    waterFullGrad.addColorStop(1,    '#1a6ab0');  // fundo
    ctx.fillStyle = waterFullGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── Padrão de caustics (reflexos de luz na água) ──────────────────────
    // Linhas onduladas brancas espalhadas simulando refração de luz
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#c8e8ff';
    ctx.lineWidth = 1.5;
    const causticRows = Math.ceil(canvas.height / 18);
    for (let ci = 0; ci < causticRows; ci++) {
      const cy2 = ci * 18 + ((tick * 28 + ci * 7) % 18);
      const phase = tick * 1.8 + ci * 0.55;
      ctx.beginPath();
      for (let cx2 = 0; cx2 <= canvas.width; cx2 += 6) {
        const wy = cy2 + Math.sin(phase + cx2 * 0.035) * 3.5
                      + Math.sin(phase * 0.7 + cx2 * 0.065) * 2;
        if (cx2 === 0) ctx.moveTo(cx2, wy);
        else           ctx.lineTo(cx2, wy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Reflexo do céu na água (gradiente vertical suave) ─────────────────
    const skyReflect = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
    skyReflect.addColorStop(0,   'rgba(100,160,220,0.18)');
    skyReflect.addColorStop(0.5, 'rgba(80,140,200,0.08)');
    skyReflect.addColorStop(1,   'rgba(60,120,180,0)');
    ctx.fillStyle = skyReflect;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

    // ── Render por linha ──────────────────────────────────────────────────
    for (let i = 0; i < visRows; i++) {
      const row = startRow + i;
      const y = canvas.height - (i + 1) * rowH + offsetY;
      const data = terrain.getRow(row);

      // Reflexo especular localizado (brilho solar na água)
      // Posicionado no centro-direita para combinar com o sol à direita
      const specX = canvas.width * 0.7 + Math.sin(tick * 0.9 + row * 0.18) * canvas.width * 0.12;
      const specW = 80 + Math.sin(tick * 1.4 + row * 0.25) * 30;
      const specAlpha = 0.06 + Math.sin(tick * 2.2 + row * 0.3) * 0.025;
      const specGrad = ctx.createLinearGradient(specX - specW, y, specX + specW, y);
      specGrad.addColorStop(0,   'rgba(255,255,255,0)');
      specGrad.addColorStop(0.5, `rgba(255,255,230,${specAlpha})`);
      specGrad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.fillStyle = specGrad;
      ctx.fillRect(specX - specW, y, specW * 2, rowH);

      // Ondas micro na superfície (linhas curtas paralelas)
      if (i % 2 === 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        ctx.lineWidth = 1;
        const wOff = Math.sin(tick * 1.6 + row * 0.38) * 2;
        ctx.beginPath();
        ctx.moveTo(0, y + rowH * 0.28 + wOff);
        ctx.lineTo(canvas.width, y + rowH * 0.28 + wOff + 1.5);
        ctx.stroke();
        ctx.restore();
      }

      // ── Margens / bancos ────────────────────────────────────────────────
      for (let ri = 0; ri < data.ranges.length; ri++) {
        const r = data.ranges[ri];

        // Margem esquerda
        if (r.c0 > 0) {
          const bw = colToPx(r.c0, world);
          drawBank(ctx, 0, y, bw, rowH, row, tick);
          // Sombra sutil na borda — apenas 8px, não engole o canal
          const shd = ctx.createLinearGradient(bw, y, bw + 8, y);
          shd.addColorStop(0, 'rgba(0,15,40,0.35)');
          shd.addColorStop(1, 'rgba(0,15,40,0)');
          ctx.fillStyle = shd;
          ctx.fillRect(bw, y, 8, rowH);
          drawWaterEdgeFoam(ctx, bw, y, rowH, true, row, tick);
        }

        // Margem direita
        if (r.c1 < C.COLS - 1) {
          const bx2 = colToPx(r.c1 + 1, world);
          const bw2 = canvas.width - bx2;
          drawBank(ctx, bx2, y, bw2, rowH, row + ri * 100, tick);
          // Sombra sutil na borda — apenas 8px
          const shd2 = ctx.createLinearGradient(bx2 - 8, y, bx2, y);
          shd2.addColorStop(0, 'rgba(0,15,40,0)');
          shd2.addColorStop(1, 'rgba(0,15,40,0.35)');
          ctx.fillStyle = shd2;
          ctx.fillRect(bx2 - 8, y, 8, rowH);
          drawWaterEdgeFoam(ctx, bx2, y, rowH, false, row + ri * 100, tick);
        }
      }

      // Ilhas (vários ranges)
      if (data.ranges.length > 1) {
        for (let ri = 0; ri < data.ranges.length - 1; ri++) {
          const end   = data.ranges[ri].c1;
          const start2 = data.ranges[ri + 1].c0;
          if (start2 > end + 1) {
            const ix = colToPx(end + 1, world);
            const iw = colToPx(start2 - end - 1, world);
            drawBank(ctx, ix, y, iw, rowH, row + ri * 50 + 200, tick);
            // Sombras dos dois lados da ilha — 8px
            const shdI1 = ctx.createLinearGradient(ix + iw, y, ix + iw + 8, y);
            shdI1.addColorStop(0, 'rgba(0,15,40,0.35)');
            shdI1.addColorStop(1, 'rgba(0,15,40,0)');
            ctx.fillStyle = shdI1;
            ctx.fillRect(ix + iw, y, 8, rowH);
            const shdI2 = ctx.createLinearGradient(ix - 8, y, ix, y);
            shdI2.addColorStop(0, 'rgba(0,15,40,0)');
            shdI2.addColorStop(1, 'rgba(0,15,40,0.35)');
            ctx.fillStyle = shdI2;
            ctx.fillRect(ix - 8, y, 8, rowH);
            drawWaterEdgeFoam(ctx, ix + iw, y, rowH, true, row + ri * 50 + 200, tick);
            drawWaterEdgeFoam(ctx, ix, y, rowH, false, row + ri * 50 + 200, tick);
          }
        }
      }
    }
  }

  // Espuma branca realista na borda entre água e margem
  function drawWaterEdgeFoam(ctx, edgeX, y, rowH, bankOnLeft, row, tick) {
    ctx.save();
    // Posição oscilante da espuma
    const foamOffset = Math.sin(tick * 2.4 + row * 0.6) * 1.8;
    const foamX = bankOnLeft ? edgeX + foamOffset : edgeX + foamOffset - 4;

    // Linha de espuma principal
    ctx.strokeStyle = 'rgba(220,240,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(foamX, y);
    ctx.lineTo(foamX, y + rowH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bolhas de espuma espalhadas
    const bubbleCount = 3;
    for (let bi = 0; bi < bubbleCount; bi++) {
      const bv = seededVal(row, bi, 50);
      const bx2 = foamX + (bv - 0.5) * 6;
      const by2 = y + bv * rowH;
      const br  = 0.8 + seededVal(row, bi, 51) * 1.6;
      ctx.fillStyle = `rgba(255,255,255,${0.25 + seededVal(row,bi,52)*0.35})`;
      ctx.beginPath();
      ctx.arc(bx2, by2, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── PONTE FOTORREALISTA (concreto + vigas metálicas) ─────────────────────
  // ══════════════════════════════════════════════════════════════════════════
  function drawBridges(ctx, canvas, world, terrain) {
    const C = MK.Const;
    const rowH = C.ROW_H;
    const visRows = Math.ceil(canvas.height / rowH) + 2;
    const startRow = Math.floor(world.scrollDistance / rowH);
    const offsetY = world.scrollDistance % rowH;

    for (let i = 0; i < visRows; i++) {
      const row = startRow + i;
      const bridge = terrain.bridgeAt(row);
      if (!bridge) continue;
      const y    = canvas.height - (i + 1) * rowH + offsetY;
      const left = colToPx(bridge.c0, world);
      const right= colToPx(bridge.c1 + 1, world);
      const span = right - left;

      if (bridge.destroyed) {
        drawBridgeRuins(ctx, left, right, y, rowH, row);
        continue;
      }

      const dmg = bridge.hp / C.BRIDGE_HP;  // 1 = intacta, 0 = destruída
      drawBridgeIntact(ctx, left, right, y, rowH, span, dmg);
    }
  }

  function drawBridgeIntact(ctx, left, right, y, rowH, span, dmg) {
    ctx.save();
    const deckY  = y + rowH * 0.18;   // topo do tabuleiro
    const deckH  = rowH * 0.48;        // altura do tabuleiro
    const railH  = rowH * 0.12;        // guarda-corpo
    const shadowH= rowH * 0.22;        // sombra na água abaixo

    // ── Sombra da ponte refletida na água ─────────────────────────────────
    const reflGrad = ctx.createLinearGradient(0, deckY + deckH, 0, deckY + deckH + shadowH);
    reflGrad.addColorStop(0,   'rgba(0,0,0,0.35)');
    reflGrad.addColorStop(0.6, 'rgba(0,0,0,0.12)');
    reflGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = reflGrad;
    ctx.fillRect(left, deckY + deckH, span, shadowH);

    // ── Pilares de concreto nas extremidades ─────────────────────────────
    for (const px of [left - 6, right - 10]) {
      const pillarGrad = ctx.createLinearGradient(px, deckY, px + 16, deckY);
      pillarGrad.addColorStop(0,   '#9a9590');
      pillarGrad.addColorStop(0.4, '#c8c2bc');
      pillarGrad.addColorStop(1,   '#7a7570');
      ctx.fillStyle = pillarGrad;
      ctx.fillRect(px, deckY, 16, deckH + 6);
      // Junta de dilatação
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px + 14, deckY, 2, deckH + 6);
    }

    // ── Tabuleiro principal (laje de concreto) ────────────────────────────
    const concreteColor = dmg < 0.6
      ? `rgb(${Math.round(180 - (1-dmg)*60)},${Math.round(140 - (1-dmg)*60)},${Math.round(100 - (1-dmg)*40)})`
      : '#c0bab4';

    const deckGrad = ctx.createLinearGradient(0, deckY, 0, deckY + deckH);
    deckGrad.addColorStop(0,   dmg < 0.6 ? '#b89878' : '#d4cec8');
    deckGrad.addColorStop(0.3, concreteColor);
    deckGrad.addColorStop(0.7, dmg < 0.6 ? '#8a6850' : '#a8a29c');
    deckGrad.addColorStop(1,   dmg < 0.6 ? '#6a4830' : '#888280');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(left, deckY, span, deckH);

    // Juntas transversais de concreto (linhas escuras periódicas)
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    const segW = 28;
    const segs = Math.floor(span / segW);
    for (let si = 1; si < segs; si++) {
      const sx = left + si * segW;
      ctx.beginPath();
      ctx.moveTo(sx, deckY);
      ctx.lineTo(sx, deckY + deckH);
      ctx.stroke();
    }

    // Faixa central de asfalto (marcação viária)
    ctx.fillStyle = dmg < 0.6 ? 'rgba(80,55,30,0.5)' : 'rgba(60,58,55,0.4)';
    ctx.fillRect(left, deckY + deckH * 0.35, span, deckH * 0.3);

    // Linha central tracejada branca
    if (dmg > 0.35) {
      ctx.strokeStyle = 'rgba(255,255,220,0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.moveTo(left + 8, deckY + deckH * 0.5);
      ctx.lineTo(right - 8, deckY + deckH * 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Marcas de dano (rachaduras)
    if (dmg < 1) {
      drawBridgeCracks(ctx, left, deckY, span, deckH, dmg);
    }

    // ── Vigas metálicas laterais (guarda-corpo) ───────────────────────────
    const railColor = dmg < 0.6 ? '#8a6840' : '#5a6068';
    // Barra superior
    const railGrad = ctx.createLinearGradient(0, deckY - railH, 0, deckY);
    railGrad.addColorStop(0,   dmg < 0.6 ? '#a07850' : '#7a8490');
    railGrad.addColorStop(0.5, railColor);
    railGrad.addColorStop(1,   dmg < 0.6 ? '#6a4820' : '#404850');
    ctx.fillStyle = railGrad;
    ctx.fillRect(left, deckY - railH, span, railH * 0.35);

    // Montantes verticais do guarda-corpo
    ctx.fillStyle = dmg < 0.6 ? '#7a5830' : '#485058';
    const postSpacing = 20;
    const numPosts = Math.floor(span / postSpacing);
    for (let pi = 0; pi <= numPosts; pi++) {
      const postX = left + pi * postSpacing - 1.5;
      if (postX < left || postX > right - 3) continue;
      ctx.fillRect(postX, deckY - railH, 3, railH);
    }

    // Linha de luz no topo do guarda-corpo (especular metálico)
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(left, deckY - railH, span, 1.5);

    // ── Brilho no topo do tabuleiro (especular de concreto molhado) ───────
    const glossGrad = ctx.createLinearGradient(left, deckY, right, deckY);
    glossGrad.addColorStop(0,     'rgba(255,255,255,0)');
    glossGrad.addColorStop(0.25,  'rgba(255,255,255,0.10)');
    glossGrad.addColorStop(0.5,   'rgba(255,255,255,0.18)');
    glossGrad.addColorStop(0.75,  'rgba(255,255,255,0.08)');
    glossGrad.addColorStop(1,     'rgba(255,255,255,0)');
    ctx.fillStyle = glossGrad;
    ctx.fillRect(left, deckY, span, deckH * 0.2);

    ctx.restore();
  }

  // Rachaduras progressivas no tabuleiro conforme o dano
  function drawBridgeCracks(ctx, left, deckY, span, deckH, dmg) {
    ctx.save();
    ctx.strokeStyle = `rgba(40,28,16,${0.5 + (1 - dmg) * 0.4})`;
    ctx.lineWidth = 1;
    const crackCount = Math.floor((1 - dmg) * 6) + 1;
    for (let ci = 0; ci < crackCount; ci++) {
      const cx2 = left + seededVal(ci, 0, 60) * span;
      const cy2 = deckY + seededVal(ci, 1, 60) * deckH;
      ctx.beginPath();
      ctx.moveTo(cx2, cy2);
      // Crack com 2-3 segmentos zigzag
      let px2 = cx2, py2 = cy2;
      const segments = 2 + Math.floor(seededVal(ci, 2, 60) * 2);
      for (let s = 0; s < segments; s++) {
        px2 += (seededVal(ci, s + 3, 60) - 0.5) * 16;
        py2 += (seededVal(ci, s + 6, 60) - 0.3) * 8;
        ctx.lineTo(px2, py2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Ruínas da ponte destruída: vigas dobradas, detritos na água
  function drawBridgeRuins(ctx, left, right, y, rowH, row) {
    ctx.save();
    const span = right - left;
    const deckY = y + rowH * 0.18;

    // Detritos de concreto caídos na água
    const debrisCount = 6 + Math.floor(seededVal(row, 99, 70) * 6);
    for (let di = 0; di < debrisCount; di++) {
      const dx = left + seededVal(row, di, 71) * span;
      const dy = deckY + seededVal(row, di, 72) * rowH * 0.6;
      const dw = 6 + seededVal(row, di, 73) * 18;
      const dh = 3 + seededVal(row, di, 74) * 6;
      const da = (seededVal(row, di, 75) - 0.5) * 1.2; // rotação
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(da);
      const dGrad = ctx.createLinearGradient(0, 0, 0, dh);
      dGrad.addColorStop(0, '#9a8878');
      dGrad.addColorStop(1, '#5a4838');
      ctx.fillStyle = dGrad;
      ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(-dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }

    // Tocos das vigas metálicas nas extremidades (dobrados)
    for (const side of [-1, 1]) {
      const sx = side === -1 ? left + 6 : right - 10;
      ctx.save();
      ctx.translate(sx, deckY + rowH * 0.15);
      ctx.rotate(side * 0.6);
      const beamGrad = ctx.createLinearGradient(0, 0, 8, 22);
      beamGrad.addColorStop(0, '#806858');
      beamGrad.addColorStop(1, '#3a2818');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(0, 0, 8, 22);
      // Borda metálica exposta
      ctx.strokeStyle = 'rgba(180,140,80,0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 8, 22);
      ctx.restore();
    }

    // Reflexo de destruição na água (mancha escura)
    const ruinRefl = ctx.createLinearGradient(left, deckY + rowH * 0.5, left, deckY + rowH);
    ruinRefl.addColorStop(0, 'rgba(30,15,5,0.35)');
    ruinRefl.addColorStop(1, 'rgba(30,15,5,0)');
    ctx.fillStyle = ruinRefl;
    ctx.fillRect(left, deckY + rowH * 0.5, span, rowH * 0.5);

    ctx.restore();
  }

  // ── FUEL DEPOTS → MOEDAS ───────────────────────────────────────────────────
  function drawFuelDepots(ctx, world, depots, tick) {
    for (const f of depots) {
      if (f.taken) continue;
      const y = f.screenY(world);
      const cx = f.x + f.w / 2;
      const cy = y + f.h / 2;

      // Animação de giro: escala X varia com seno (efeito moeda girando)
      const spinPhase = tick * 4 + f.col * 1.3;
      const scaleX = Math.abs(Math.cos(spinPhase));
      const coinW = f.w * 0.85 * scaleX;
      const coinH = f.h * 1.1;

      ctx.save();
      ctx.translate(cx, cy);

      // Glow dourado
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 14 + Math.sin(spinPhase * 2) * 6;

      // Corpo da moeda
      const coinGrad = ctx.createLinearGradient(-coinW / 2, 0, coinW / 2, 0);
      coinGrad.addColorStop(0,    '#c8860a');
      coinGrad.addColorStop(0.25, '#ffd700');
      coinGrad.addColorStop(0.5,  '#ffe55c');
      coinGrad.addColorStop(0.75, '#ffd700');
      coinGrad.addColorStop(1,    '#c8860a');
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(1, coinW / 2), coinH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Anel externo escuro
      ctx.strokeStyle = '#a06800';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Símbolo do Mario ($ ou ★ ou cifrão) no centro
      if (scaleX > 0.3) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#a06800';
        ctx.font = `bold ${coinH * 0.5}px ${MARIO_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);
      }

      ctx.restore();

      // Letras FUEL abaixo da moeda
      ctx.fillStyle = '#fff9a0';
      ctx.font = `bold 9px ${MONO}`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#c8a000';
      ctx.shadowBlur = 4;
      ctx.fillText('FUEL', cx, y + coinH + 4);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }
  }

  // ── INIMIGOS ────────────────────────────────────────────────────────────────
  // 'copter' → Lakitu montado em nuvem lançando Spinies
  // 'ship'   → Goomba navegando num barquinho
  function drawEnemy(ctx, e, world) {
    const y = e.screenY(world);
    const cx = e.x + e.w / 2;
    const cy = y + e.h / 2;

    if (e.kind === 'copter') {
      // ── Lakitu em nuvem ──────────────────────────────
      ctx.save();

      // Nuvem flutuante
      const cloudBob = Math.sin(performance.now() / 600 + e.col) * 2;
      const ncx = cx;
      const ncy = cy + cloudBob;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      // 3 círculos para formar a nuvem
      ctx.beginPath(); ctx.arc(ncx, ncy + 4, e.w * 0.27, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ncx - e.w * 0.25, ncy + 7, e.w * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ncx + e.w * 0.25, ncy + 7, e.w * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(ncx - e.w * 0.44, ncy + 6, e.w * 0.88, e.h * 0.38);

      // Lakitu (tartaruga com óculos sobre a nuvem)
      const lx = ncx;
      const ly = ncy - e.h * 0.05;

      // Casco verde
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#2d8c2d';
      ctx.beginPath();
      ctx.ellipse(lx, ly - 4, e.w * 0.23, e.h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a5c1a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Padrão do casco
      ctx.strokeStyle = '#1a5c1a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 10); ctx.lineTo(lx, ly + 2);
      ctx.moveTo(lx - 6, ly - 6); ctx.lineTo(lx + 6, ly - 6);
      ctx.stroke();

      // Rosto amarelo
      ctx.fillStyle = '#f5c842';
      ctx.beginPath();
      ctx.arc(lx, ly + 3, e.w * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Óculos (círculos brancos com centro preto)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(lx - 3, ly + 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(lx + 3, ly + 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(lx - 3, ly + 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(lx + 3, ly + 2, 1.5, 0, Math.PI * 2); ctx.fill();

      // Linha conectando os óculos
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(lx - 0, ly + 2); ctx.lineTo(lx + 0, ly + 2); ctx.stroke();

      // Indicador de alerta (vermelho piscando)
      const alertPulse = Math.sin(performance.now() / 200) > 0;
      if (alertPulse) {
        ctx.fillStyle = 'rgba(255,50,50,0.85)';
        ctx.beginPath();
        ctx.arc(lx + e.w * 0.26, ly - e.h * 0.3, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

    } else {
      // ── Goomba em barquinho ──────────────────────────
      ctx.save();
      const bobY = Math.sin(performance.now() / 700 + e.col * 0.7) * 1.5;

      // Casco do barco (hull)
      const hullGrad = ctx.createLinearGradient(0, y, 0, y + e.h);
      hullGrad.addColorStop(0, '#8B4513');
      hullGrad.addColorStop(0.6, '#5a2d0c');
      hullGrad.addColorStop(1, '#3a1a00');
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(e.x + 3, y + e.h * 0.55 + bobY);
      ctx.lineTo(e.x, y + e.h + bobY);
      ctx.lineTo(e.x + e.w, y + e.h + bobY);
      ctx.lineTo(e.x + e.w - 3, y + e.h * 0.55 + bobY);
      ctx.closePath();
      ctx.fill();

      // Borda do barco
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Reflexo na água (sombra escura)
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, y + e.h + bobY + 3, e.w * 0.45, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Goomba no barco
      const gx = cx;
      const gy = y + e.h * 0.28 + bobY;

      // Corpo marrom do Goomba
      ctx.fillStyle = '#a0522d';
      ctx.beginPath();
      ctx.ellipse(gx, gy, e.w * 0.32, e.h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5c2a00';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rosto do Goomba
      ctx.fillStyle = '#c8763a';
      ctx.beginPath();
      ctx.ellipse(gx, gy + e.h * 0.06, e.w * 0.28, e.h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sobrancelhas raivosas
      ctx.strokeStyle = '#2a1000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx - e.w * 0.22, gy - e.h * 0.07);
      ctx.lineTo(gx - e.w * 0.08, gy - e.h * 0.02);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + e.w * 0.22, gy - e.h * 0.07);
      ctx.lineTo(gx + e.w * 0.08, gy - e.h * 0.02);
      ctx.stroke();

      // Olhos
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(gx - e.w * 0.12, gy + e.h * 0.04, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + e.w * 0.12, gy + e.h * 0.04, 2.5, 0, Math.PI * 2); ctx.fill();

      // Dentes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx - e.w * 0.18, gy + e.h * 0.12, e.w * 0.14, e.h * 0.07);
      ctx.fillRect(gx + e.w * 0.04, gy + e.h * 0.12, e.w * 0.14, e.h * 0.07);

      // Pé
      ctx.fillStyle = '#5c2a00';
      ctx.beginPath();
      ctx.ellipse(gx - e.w * 0.18, gy + e.h * 0.28, e.w * 0.14, e.h * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(gx + e.w * 0.18, gy + e.h * 0.28, e.w * 0.14, e.h * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ── FIREBALL (substitui bullet) ─────────────────────────────────────────────
  function drawBullet(ctx, b) {
    ctx.save();
    if (b.friendly) {
      // ── Fireball do Mario ──────────────────────────
      const by = b.y + b.h / 2;
      const bx = b.x + b.w / 2;
      const t = (performance.now() / 120) % (Math.PI * 2);

      // Rastro de chama
      const trailGrad = ctx.createLinearGradient(bx, by, bx, by + b.h * 3.5);
      trailGrad.addColorStop(0, 'rgba(255,200,60,0.85)');
      trailGrad.addColorStop(0.4, 'rgba(255,100,0,0.5)');
      trailGrad.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by + b.h * 1.5, b.w * 0.7, b.h * 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo da fireball – círculo laranja pulsante
      const r = b.w * 0.9 + Math.sin(t) * 0.8;
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 12;
      const fbGrad = ctx.createRadialGradient(bx, by, 0, bx, by, r * 1.5);
      fbGrad.addColorStop(0,   '#ffffff');
      fbGrad.addColorStop(0.3, '#fff099');
      fbGrad.addColorStop(0.65,'#ff8800');
      fbGrad.addColorStop(1,   'rgba(255,80,0,0)');
      ctx.fillStyle = fbGrad;
      ctx.beginPath();
      ctx.arc(bx, by, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // ── Projétil inimigo: espinho do Lakitu (Spiny) ──
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      const spin = (performance.now() / 80) % (Math.PI * 2);

      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#cc2222';
      ctx.beginPath();
      ctx.arc(bx, by, b.w * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Espinhos girando
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 1.5;
      for (let si = 0; si < 4; si++) {
        const a = spin + (si / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(a) * b.w * 0.6, by + Math.sin(a) * b.w * 0.6);
        ctx.lineTo(bx + Math.cos(a) * b.w * 1.4, by + Math.sin(a) * b.w * 1.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── EXPLOSÃO: estrelas + cogumelo estilo Mario ──────────────────────────────
  function drawExplosion(ctx, ex) {
    const t = ex.age / ex.duration;
    const radius = 8 + t * 38;
    const alpha = 1 - t;

    ctx.save();

    // Flash central
    const fbGrad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, radius);
    fbGrad.addColorStop(0, `rgba(255,255,200,${alpha})`);
    fbGrad.addColorStop(0.3, `rgba(255,200,50,${alpha * 0.9})`);
    fbGrad.addColorStop(0.7, `rgba(255,100,0,${alpha * 0.6})`);
    fbGrad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = fbGrad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Anel de onda de choque
    ctx.strokeStyle = `rgba(255,220,80,${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Estrelas ★ voando para fora
    if (!ex.sparks) {
      ex.sparks = Array.from({ length: 8 }, (_, i) => ({
        angle: (i / 8) * Math.PI * 2 + Math.random() * 0.4,
        speed: 0.6 + Math.random() * 0.6,
        size:  4 + Math.random() * 5,
      }));
    }
    for (const sp of ex.sparks) {
      const dist = sp.speed * radius * 1.8;
      const sx = ex.x + Math.cos(sp.angle) * dist;
      const sy = ex.y + Math.sin(sp.angle) * dist;
      ctx.fillStyle = `rgba(255,240,80,${alpha})`;
      ctx.font = `${sp.size * (1 - t * 0.5)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', sx, sy);
    }

    // Partículas coloridas
    const colors = ['#ff4444','#ffcc00','#44ff44','#4488ff'];
    for (let ci = 0; ci < 6; ci++) {
      const a = (ci / 6) * Math.PI * 2 + t * 3;
      const d = radius * 1.2;
      const px = ex.x + Math.cos(a) * d;
      const py = ex.y + Math.sin(a) * d;
      ctx.fillStyle = colors[ci % colors.length].replace(')', `,${alpha})`).replace('#', 'rgba(').replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (m, r2, g, b) => `rgba(${parseInt(r2,16)},${parseInt(g,16)},${parseInt(b,16)}`);
      ctx.beginPath();
      ctx.arc(px, py, 3 * (1 - t), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── MARIO COM CAPA ──────────────────────────────────────────────────────────
  // Desenhado inteiramente em canvas 2D, vista de cima (River Raid), capa animada
  function drawMario(ctx, plane, tick) {
    if (plane.invulnerable > 0 && Math.floor(plane.invulnerable * 16) % 2 === 0) return;

    const pw = plane.w;   // 38
    const ph = plane.h;   // 44
    const cx = plane.x + pw / 2;
    const cy = plane.y + ph / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(plane.bankTilt * 0.28); // inclinação lateral suave

    // ── Sombra sob o Mario ────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, ph * 0.18, pw * 0.42, ph * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── CAPA (atrás do Mario, vista de cima) ──────────────────────────────
    // A capa flutua/ondula baseada no tilt e no throttle
    const capeFlap = Math.sin(tick * 6 + plane.bankTilt * 2) * 4;
    const capeSpread = plane.boosting ? pw * 1.5 : pw * 1.1 + Math.abs(plane.bankTilt) * pw * 0.4;
    const capeCurve = ph * 0.18 + plane.throttle * ph * 0.06 + capeFlap;

    ctx.save();
    // Capa: forma de semi-elipse ondulante amarela por baixo
    const capeGrad = ctx.createLinearGradient(-capeSpread / 2, -ph * 0.05, capeSpread / 2, ph * 0.35);
    capeGrad.addColorStop(0,   '#f5c842');
    capeGrad.addColorStop(0.4, '#ffd700');
    capeGrad.addColorStop(0.7, '#e6a800');
    capeGrad.addColorStop(1,   '#b37a00');
    ctx.fillStyle = capeGrad;
    ctx.shadowColor = 'rgba(200,140,0,0.5)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    // Âncora na parte superior (pescoço/ombros)
    ctx.moveTo(-pw * 0.28, -ph * 0.10);
    // Curva da asa esquerda da capa
    ctx.bezierCurveTo(
      -capeSpread / 2 - capeFlap, -ph * 0.05,
      -capeSpread / 2,             capeCurve,
      0,                           ph * 0.38 + capeFlap * 0.5
    );
    // Curva da asa direita da capa
    ctx.bezierCurveTo(
      capeSpread / 2,              capeCurve,
      capeSpread / 2 + capeFlap,  -ph * 0.05,
      pw * 0.28,                  -ph * 0.10
    );
    ctx.closePath();
    ctx.fill();

    // Borda inferior da capa (mais escura)
    ctx.strokeStyle = '#a07000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nervuras da capa
    ctx.strokeStyle = 'rgba(180,120,0,0.5)';
    ctx.lineWidth = 0.8;
    for (let ri = -1; ri <= 1; ri++) {
      ctx.beginPath();
      ctx.moveTo(ri * pw * 0.15, -ph * 0.08);
      ctx.quadraticCurveTo(ri * capeSpread * 0.35, capeCurve * 0.5, ri * capeSpread * 0.5, ph * 0.32);
      ctx.stroke();
    }
    ctx.restore();

    // ── CORPO DO MARIO ─────────────────────────────────────────────────────

    // Calças azuis (overalls) – vista de cima, forma oval
    const jeansGrad = ctx.createLinearGradient(-pw * 0.22, ph * 0.1, pw * 0.22, ph * 0.42);
    jeansGrad.addColorStop(0, '#1e4fa3');
    jeansGrad.addColorStop(0.5, '#2a69d4');
    jeansGrad.addColorStop(1, '#1a3e8f');
    ctx.fillStyle = jeansGrad;
    ctx.beginPath();
    ctx.ellipse(0, ph * 0.22, pw * 0.22, ph * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Suspensórios amarelos cruzando o tórax
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-pw * 0.1, ph * 0.1);
    ctx.lineTo(pw * 0.07, ph * 0.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pw * 0.1, ph * 0.1);
    ctx.lineTo(-pw * 0.07, ph * 0.24);
    ctx.stroke();

    // Camisa vermelha (torso) – oval central
    const torsoGrad = ctx.createLinearGradient(-pw * 0.2, -ph * 0.15, pw * 0.2, ph * 0.15);
    torsoGrad.addColorStop(0, '#e81010');
    torsoGrad.addColorStop(0.4, '#ff2e2e');
    torsoGrad.addColorStop(0.8, '#c00000');
    torsoGrad.addColorStop(1, '#900000');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.ellipse(0, ph * 0.05, pw * 0.18, ph * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Botões/emblema na camisa
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, ph * 0.00, pw * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2e2e';
    ctx.font = `bold ${pw * 0.10}px ${MARIO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 0, ph * 0.00);

    // Luvas brancas (mãos estendidas para os lados – vista de cima)
    ctx.fillStyle = '#f5f0e0';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 3;
    // Mão esquerda
    ctx.beginPath();
    ctx.ellipse(-pw * 0.30, ph * 0.08, pw * 0.10, pw * 0.08, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Mão direita
    ctx.beginPath();
    ctx.ellipse(pw * 0.30, ph * 0.08, pw * 0.10, pw * 0.08, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Sapatos marrons (pés, na parte inferior, vista de cima)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5c3010';
    ctx.beginPath();
    ctx.ellipse(-pw * 0.12, ph * 0.38, pw * 0.10, ph * 0.07, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pw * 0.12, ph * 0.38, pw * 0.10, ph * 0.07, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // ── CABEÇA DO MARIO ────────────────────────────────────────────────────

    // Rosto (skin tone)
    ctx.fillStyle = '#f5c08a';
    ctx.beginPath();
    ctx.ellipse(0, -ph * 0.18, pw * 0.17, ph * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bigode icônico
    ctx.fillStyle = '#4a2200';
    // Lado esquerdo
    ctx.beginPath();
    ctx.ellipse(-pw * 0.08, -ph * 0.12, pw * 0.09, ph * 0.04, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Lado direito
    ctx.beginPath();
    ctx.ellipse(pw * 0.08, -ph * 0.12, pw * 0.09, ph * 0.04, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Olhos (pequenos pontos escuros)
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.arc(-pw * 0.07, -ph * 0.22, pw * 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pw * 0.07, -ph * 0.22, pw * 0.03, 0, Math.PI * 2); ctx.fill();

    // ── BONÉ VERMELHO DO MARIO ─────────────────────────────────────────────
    // Aba da frente do boné
    const capGrad = ctx.createRadialGradient(0, -ph * 0.32, 1, 0, -ph * 0.32, pw * 0.22);
    capGrad.addColorStop(0, '#ff3333');
    capGrad.addColorStop(0.6, '#cc0000');
    capGrad.addColorStop(1, '#900000');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.ellipse(0, -ph * 0.32, pw * 0.22, ph * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Aba da viseira na frente (parte mais escura)
    ctx.fillStyle = '#990000';
    ctx.beginPath();
    ctx.ellipse(0, -ph * 0.27, pw * 0.20, ph * 0.055, 0, 0, Math.PI);
    ctx.fill();

    // Emblema "M" no boné
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${pw * 0.13}px ${MARIO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 0, -ph * 0.33);

    // Brilho no topo do boné
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-pw * 0.05, -ph * 0.37, pw * 0.07, ph * 0.04, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // ── EFEITOS DE VOO ─────────────────────────────────────────────────────

    // Rastro da capa quando acelerando (boost)
    if (plane.boosting) {
      ctx.save();
      const boostGrad = ctx.createLinearGradient(0, ph * 0.38, 0, ph * 0.7);
      boostGrad.addColorStop(0, 'rgba(255,220,50,0.7)');
      boostGrad.addColorStop(0.5, 'rgba(255,140,0,0.4)');
      boostGrad.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = boostGrad;
      const boostPulse = 1 + Math.sin(tick * 18) * 0.15;
      ctx.beginPath();
      ctx.moveTo(-pw * 0.18, ph * 0.36);
      ctx.lineTo(0, ph * 0.62 * boostPulse);
      ctx.lineTo(pw * 0.18, ph * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Estrelinhas piscantes ao redor (invulnerabilidade leve após respawn)
    if (plane.invulnerable > 0 && plane.invulnerable < 1.0) {
      const numStars = 4;
      for (let si = 0; si < numStars; si++) {
        const sa = tick * 5 + (si / numStars) * Math.PI * 2;
        const sd = pw * 0.7;
        const sx2 = Math.cos(sa) * sd;
        const sy2 = Math.sin(sa) * sd;
        ctx.fillStyle = `rgba(255,240,80,${plane.invulnerable})`;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', sx2, sy2);
      }
    }

    ctx.restore(); // restaura a rotação de bankTilt
  }

  // ── VINHETA ─────────────────────────────────────────────────────────────────
  function drawVignette(ctx, canvas) {
    const grad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height * 0.32,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.78
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,10,30,0.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── HUD – tema Mario ─────────────────────────────────────────────────────────
  function drawHud(ctx, canvas, game) {
    const barW = canvas.width;
    const barH = 50;

    // Fundo do HUD: bloco de tijolo Mario
    const hudGrad = ctx.createLinearGradient(0, 0, 0, barH);
    hudGrad.addColorStop(0, 'rgba(8,4,2,0.78)');
    hudGrad.addColorStop(1, 'rgba(20,10,4,0.88)');
    ctx.fillStyle = hudGrad;
    ctx.fillRect(0, 0, barW, barH);

    // Borda inferior dourada
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, barH); ctx.lineTo(barW, barH); ctx.stroke();
    ctx.strokeStyle = '#a07800';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, barH + 1); ctx.lineTo(barW, barH + 1); ctx.stroke();

    // SCORE
    ctx.font = `bold 17px ${MARIO_FONT}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f5c842';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 8;
    ctx.fillText(`★ ${Math.floor(game.score).toString().padStart(6, '0')}`, 14, 24);

    // DISTÂNCIA
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 6;
    ctx.font = `bold 14px ${MONO}`;
    ctx.fillText(`${Math.floor(game.distance / 10)}m`, 240, 24);
    ctx.shadowBlur = 0;

    // WORLD label
    const diff = MK.getDifficulty ? MK.getDifficulty(game.distance) : { level: 1 };
    ctx.fillStyle = '#aad4ff';
    ctx.font = `bold 11px ${MONO}`;
    ctx.fillText(`WORLD ${diff.level || 1}-1`, 350, 24);

    // FUEL BAR – barra de combustível estilo Mario (com ícone de moeda)
    const fuelX = 480;
    const fuelW = 170;
    const fuelH = 16;
    const fuelY = (barH - fuelH) / 2;

    // Label FUEL
    ctx.fillStyle = '#f5c842';
    ctx.shadowColor = '#ff8800';
    ctx.shadowBlur = 4;
    ctx.font = `bold 11px ${MARIO_FONT}`;
    ctx.fillText('⛽', fuelX - 18, fuelY + fuelH / 2);
    ctx.shadowBlur = 0;

    // Fundo da barra (cinza escuro)
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, fuelX, fuelY, fuelW, fuelH, 5);
    ctx.fill();

    // Preenchimento da barra
    const ratio = MK.clamp(game.fuel / MK.Const.FUEL_MAX, 0, 1);
    if (ratio > 0) {
      const fuelGrad = ctx.createLinearGradient(fuelX, 0, fuelX + fuelW, 0);
      fuelGrad.addColorStop(0, '#ff3b3b');
      fuelGrad.addColorStop(0.45, '#ffd23f');
      fuelGrad.addColorStop(1, '#39ff6a');
      ctx.fillStyle = fuelGrad;
      ctx.save();
      roundRect(ctx, fuelX, fuelY, fuelW * ratio, fuelH, 5);
      ctx.clip();
      ctx.fillRect(fuelX, fuelY, fuelW * ratio, fuelH);
      ctx.restore();
    }

    // Borda da barra
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1.5;
    roundRect(ctx, fuelX, fuelY, fuelW, fuelH, 5);
    ctx.stroke();

    // VIDAS – ícones de boné do Mario
    for (let i = 0; i < game.lives; i++) {
      const hx = barW - 26 - i * 30;
      const hy = barH / 2;
      drawMarioLifeIcon(ctx, hx, hy, 10);
    }
    // Label vidas
    ctx.fillStyle = '#ff6666';
    ctx.font = `bold 11px ${MARIO_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('×', barW - 26 - game.lives * 30 + 4, barH / 2 + 4);
    ctx.textAlign = 'left';
    ctx.fillText(`${game.lives}`, barW - 26 - game.lives * 30 + 10, barH / 2 + 4);
    ctx.textAlign = 'left';
  }

  // Ícone de vida: mini boné vermelho do Mario
  function drawMarioLifeIcon(ctx, x, y, r) {
    ctx.save();
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.1, r * 0.85, r * 0.55, 0, Math.PI, 0);
    ctx.fill();
    // aba da viseira
    ctx.fillStyle = '#aa0000';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.9, r * 0.3, 0, 0, Math.PI);
    ctx.fill();
    // letra M
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${r * 0.9}px ${MARIO_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', x, y - r * 0.25);
    ctx.restore();
  }

  // ── OVERLAY (menu / pausa / game over) ────────────────────────────────────
  function drawOverlay(ctx, w, h, title, subtitle, score) {
    // Overlay escurecido
    ctx.fillStyle = 'rgba(0,0,10,0.70)';
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.min(w * 0.75, 540);
    const panelH = Math.min(210, h * 0.80);
    const px = (w - panelW) / 2;
    const py = Math.max(12, (h - panelH) / 2);
    const r = 18;

    // Painel com bordas douradas estilo Mario
    ctx.save();
    // Sombra externa
    ctx.shadowColor = 'rgba(245,200,66,0.5)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#1a0a04';
    roundRect(ctx, px, py, panelW, panelH, r);
    ctx.fill();
    ctx.restore();

    // Borda externa dourada
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 4;
    roundRect(ctx, px, py, panelW, panelH, r);
    ctx.stroke();

    // Borda interna vermelha
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 2;
    roundRect(ctx, px + 6, py + 6, panelW - 12, panelH - 12, r - 3);
    ctx.stroke();

    // Decoração de estrelas nos cantos
    const starPositions = [
      [px + 18, py + 18], [px + panelW - 18, py + 18],
      [px + 18, py + panelH - 18], [px + panelW - 18, py + panelH - 18],
    ];
    ctx.fillStyle = '#f5c842';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [sx, sy] of starPositions) ctx.fillText('★', sx, sy);

    // Título
    ctx.textAlign = 'center';
    ctx.font = `900 ${Math.floor(panelH * 0.19)}px ${MARIO_FONT}`;
    ctx.fillStyle = '#f5c842';
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 16;
    ctx.fillText(title, w / 2, py + panelH * 0.35);
    ctx.shadowBlur = 0;

    // Score (se fornecido)
    if (score !== undefined) {
      ctx.font = `bold ${Math.floor(panelH * 0.10)}px ${MONO}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`PONTUAÇÃO: ${Math.floor(score).toString().padStart(6, '0')}`, w / 2, py + panelH * 0.56);
    }

    // Subtítulo
    ctx.fillStyle = '#ffe0bd';
    ctx.font = `600 ${Math.floor(panelH * 0.09)}px ${FONT}`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(subtitle, w / 2, py + panelH * (score !== undefined ? 0.76 : 0.68));
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  // ── RENDER PRINCIPAL ─────────────────────────────────────────────────────────
  return {
    render(ctx, canvas, game) {
      const tick = performance.now() / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawSky(ctx, canvas, tick);

      if (game.terrain) {
        const world = game.world;
        drawTerrain(ctx, canvas, world, game.terrain, tick);
        drawBridges(ctx, canvas, world, game.terrain);
        drawFuelDepots(ctx, world, game.fuelDepots, tick);
        for (const e of game.enemies) drawEnemy(ctx, e, world);
        for (const b of game.bullets) drawBullet(ctx, b);
        for (const b of game.enemyBullets) drawBullet(ctx, b);
        for (const ex of game.explosions) drawExplosion(ctx, ex);
        if (game.plane) drawMario(ctx, game.plane, tick);
        drawVignette(ctx, canvas);
        drawHud(ctx, canvas, game);
      }

      if (game.state === 'menu') {
        drawOverlay(ctx, canvas.width, canvas.height,
          'MARIO RAID',
          'Pressione ENTER para voar!');
      } else if (game.state === 'paused') {
        drawOverlay(ctx, canvas.width, canvas.height,
          'PAUSADO',
          'Pressione ESC para continuar');
      } else if (game.state === 'gameover') {
        drawOverlay(ctx, canvas.width, canvas.height,
          'GAME OVER',
          'Pressione ENTER para reiniciar',
          game.score);
      }

      if (game.state === 'menu') {
        drawMenuDecorations(ctx, canvas, tick);
      }
    },
  };

  // Decorações animadas na tela de menu
  function drawMenuDecorations(ctx, canvas, tick) {
    const coins = [
      { x: 0.15, y: 0.62 }, { x: 0.25, y: 0.55 }, { x: 0.35, y: 0.65 },
      { x: 0.65, y: 0.58 }, { x: 0.75, y: 0.68 }, { x: 0.85, y: 0.60 },
    ];
    for (const c of coins) {
      const cx2 = c.x * canvas.width;
      const cy2 = c.y * canvas.height + Math.sin(tick * 2.5 + c.x * 10) * 6;
      const spinPhase = tick * 3 + c.x * 5;
      const scaleX = Math.abs(Math.cos(spinPhase)) * 10 + 2;
      ctx.save();
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.ellipse(cx2, cy2, scaleX, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Mini Mario correndo na tela de menu
    const marioMenuX = canvas.width * 0.5 + Math.sin(tick * 0.4) * canvas.width * 0.25;
    const marioMenuY = canvas.height * 0.74;
    ctx.save();
    ctx.translate(marioMenuX, marioMenuY);
    // Corpo simples
    ctx.fillStyle = '#e81010';
    ctx.beginPath(); ctx.arc(0, -14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f5c08a';
    ctx.beginPath(); ctx.arc(0, -4, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e4fa3';
    ctx.fillRect(-8, 4, 16, 10);
    ctx.fillStyle = '#5c3010';
    ctx.fillRect(-9, 13, 7, 5);
    ctx.fillRect(2, 13, 7, 5);
    ctx.restore();
  }
})();
