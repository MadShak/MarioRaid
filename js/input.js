var MK = window.MK = window.MK || {};

MK.Input = (function () {
  const keys    = new Set(); // ações atualmente pressionadas
  const pressed = new Set(); // ações pressionadas neste frame (wasPressed)

  // ── Mapeamento teclado ──────────────────────────────────────────────────
  const codeMap = {
    ArrowLeft:  'left',  KeyA:       'left',
    ArrowRight: 'right', KeyD:       'right',
    ArrowUp:    'up',    KeyW:       'up',
    ArrowDown:  'down',  KeyS:       'down',
    Space:      'shoot',
    Enter:      'start',
    Escape:     'pause', KeyP: 'pause',
    ShiftLeft:  'run',   ShiftRight: 'run',
  };

  window.addEventListener('keydown', (e) => {
    const action = codeMap[e.code];
    if (!action) return;
    if (['left','right','up','down','shoot'].includes(action)) e.preventDefault();
    if (!keys.has(action)) pressed.add(action);
    keys.add(action);
  });

  window.addEventListener('keyup', (e) => {
    const action = codeMap[e.code];
    if (action) keys.delete(action);
  });

  // ── Controles touch virtuais ────────────────────────────────────────────
  // Mapeamento botão-elemento → ação do jogo
  // Cada botão pode ser pressionado por múltiplos dedos simultâneos —
  // rastreamos quais touchIds pertencem a cada ação.
  const touchActionMap = new Map(); // touchId → action

  function getTouchAction(el) {
    // Sobe na DOM até achar o elemento com data-action
    let cur = el;
    while (cur && cur !== document.body) {
      if (cur.dataset && cur.dataset.action) return cur.dataset.action;
      cur = cur.parentElement;
    }
    return null;
  }

  function onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const action = getTouchAction(touch.target);
      if (!action) continue;
      touchActionMap.set(touch.identifier, action);
      if (!keys.has(action)) pressed.add(action);
      keys.add(action);
      // Feedback visual
      const btn = touch.target.closest('[data-action]');
      if (btn) btn.classList.add('pressed');
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const action = touchActionMap.get(touch.identifier);
      if (!action) continue;
      touchActionMap.delete(touch.identifier);
      // Só remove a ação se não houver outro dedo segurando o mesmo botão
      const stillHeld = [...touchActionMap.values()].includes(action);
      if (!stillHeld) keys.delete(action);
      // Remove feedback visual
      const btn = touch.target.closest('[data-action]');
      if (btn) btn.classList.remove('pressed');
    }
  }

  function onTouchMove(e) {
    // Impede scroll acidental durante o jogo
    e.preventDefault();

    // Suporte a "slide" entre botões do d-pad:
    // se o dedo deslizar para cima de outro botão, atualiza a ação
    for (const touch of e.changedTouches) {
      const oldAction = touchActionMap.get(touch.identifier);
      // Encontra o elemento sob o toque atual
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const newAction = el ? getTouchAction(el) : null;

      if (newAction === oldAction) continue;

      // Remove ação anterior
      if (oldAction) {
        touchActionMap.delete(touch.identifier);
        const stillHeld = [...touchActionMap.values()].includes(oldAction);
        if (!stillHeld) keys.delete(oldAction);
        const oldBtn = document.querySelector(`[data-action="${oldAction}"]`);
        if (oldBtn) oldBtn.classList.remove('pressed');
      }

      // Adiciona nova ação
      if (newAction) {
        touchActionMap.set(touch.identifier, newAction);
        if (!keys.has(newAction)) pressed.add(newAction);
        keys.add(newAction);
        const newBtn = document.querySelector(`[data-action="${newAction}"]`);
        if (newBtn) newBtn.classList.add('pressed');
      }
    }
  }

  // Registra eventos touch nos controles virtuais após o DOM carregar
  function initTouch() {
    const controls = document.getElementById('touch-controls');
    if (!controls) return;

    // Eventos nos botões individuais (passive:false para poder preventDefault)
    controls.addEventListener('touchstart', onTouchStart, { passive: false });
    controls.addEventListener('touchend',   onTouchEnd,   { passive: false });
    controls.addEventListener('touchcancel',onTouchEnd,   { passive: false });
    controls.addEventListener('touchmove',  onTouchMove,  { passive: false });
  }

  // Detecta se é dispositivo touch e expõe flag para main.js
  const isTouchDevice = () =>
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0);

  // Inicializa após DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTouch);
  } else {
    initTouch();
  }

  return {
    isDown(action)   { return keys.has(action);    },
    wasPressed(action){ return pressed.has(action); },
    endFrame()       { pressed.clear();             },
    isTouchDevice,
  };
})();
