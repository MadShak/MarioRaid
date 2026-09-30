window.addEventListener('DOMContentLoaded', () => {
  const canvas       = document.getElementById('game');
  const app          = document.getElementById('app');
  const fullscreenBtn= document.getElementById('fullscreen-btn');
  const muteBtn      = document.getElementById('mute-btn');
  const touchControls= document.getElementById('touch-controls');
  const rotateNotice = document.getElementById('rotate-notice');

  // ── Detecta touch e configura layout ────────────────────────────────
  const isTouch = MK.Input.isTouchDevice();
  if (isTouch) {
    touchControls.classList.add('active');
    app.classList.add('has-touch-controls');
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = 'none';
  }

  // ── Fullscreen ────────────────────────────────────────────────────────
  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function toggleFullscreen() {
    if (!isFullscreen()) {
      // Em iOS o fullscreen é só no elemento; em Android usa o app inteiro
      const target = app;
      const req = target.requestFullscreen
               || target.webkitRequestFullscreen
               || target.mozRequestFullScreen;
      if (req) req.call(target);
    } else {
      const exit = document.exitFullscreen
                || document.webkitExitFullscreen
                || document.mozCancelFullScreen;
      if (exit) exit.call(document);
    }
  }

  // ── Mudo ──────────────────────────────────────────────────────────────
  function toggleMute() {
    MK.Audio.unlock();
    MK.Audio.setMuted(!MK.Audio.isMuted());
    muteBtn.textContent = MK.Audio.isMuted() ? '🔇' : '🔊';
  }

  // ── Redimensiona o canvas mantendo a proporção ──────────────────────
  // A lógica correta: mede o espaço REAL disponível dentro do #app,
  // já descontando padding, hint e controles touch.
  const CANVAS_W = canvas.width;   // 1024
  const CANVAS_H = canvas.height;  // 576

  function resizeCanvas() {
    const fullscreen = isFullscreen();

    if (fullscreen) {
      const scaleFs = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
      canvas.style.width  = `${Math.floor(CANVAS_W * scaleFs)}px`;
      canvas.style.height = `${Math.floor(CANVAS_H * scaleFs)}px`;
      return;
    }

    // clientWidth/Height do #app já desconta o padding — é o espaço útil real
    const appW = app.clientWidth;
    const appH = app.clientHeight;

    // Desconta o #hint se estiver visível (só desktop)
    const hint = document.getElementById('hint');
    const hintH = (hint && hint.offsetParent !== null) ? (hint.offsetHeight + 6) : 0;

    // Desconta os controles touch se ativos (fixed, mas precisamos reservar espaço)
    const ctrlH = (isTouch && touchControls)
      ? (touchControls.offsetHeight || 152)
      : 0;

    const shadowSpread = 24;
    const availW = appW - shadowSpread * 2;
    const availH = appH - hintH - ctrlH - shadowSpread * 2;

    const scale = Math.max(0.1, Math.min(availW / CANVAS_W, availH / CANVAS_H));

    canvas.style.width  = `${Math.floor(CANVAS_W * scale)}px`;
    canvas.style.height = `${Math.floor(CANVAS_H * scale)}px`;
  }

  // ── Orientação em mobile ──────────────────────────────────────────────
  function checkOrientation() {
    if (!isTouch) return;
    // Considera "portrait" se a altura for maior que a largura
    const portrait = window.innerHeight > window.innerWidth;
    if (rotateNotice) {
      rotateNotice.style.display = portrait ? 'flex' : 'none';
    }
  }

  // ── Eventos ───────────────────────────────────────────────────────────
  fullscreenBtn.addEventListener('click', () => {
    MK.Audio.unlock();
    toggleFullscreen();
  });
  muteBtn.addEventListener('click', toggleMute);

  // Teclado — atalhos desktop
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF') toggleFullscreen();
    if (e.code === 'KeyM') toggleMute();
  });

  // Desbloqueio do AudioContext em touch (iOS exige gesto do usuário)
  document.addEventListener('touchstart', () => MK.Audio.unlock(), { once: true, passive: true });
  document.addEventListener('touchend',   () => MK.Audio.unlock(), { once: true, passive: true });

  // Resize e fullscreen change
  window.addEventListener('resize',           () => { resizeCanvas(); checkOrientation(); });
  window.addEventListener('orientationchange',() => { resizeCanvas(); checkOrientation(); });
  document.addEventListener('fullscreenchange',       resizeCanvas);
  document.addEventListener('webkitfullscreenchange', resizeCanvas);

  // Estado inicial — aguarda um frame para o DOM calcular offsetHeight dos controles
  resizeCanvas();
  checkOrientation();
  // Segundo resize após layout calculado (garante medição correta de ctrlHeight)
  requestAnimationFrame(() => { resizeCanvas(); });

  // ── Inicia o jogo ─────────────────────────────────────────────────────
  const game = new MK.Game(canvas);
  game.start();
});
