# 🍄 Mario Raid

Um shooter vertical de rolagem contínua inspirado no clássico **River Raid** (Atari 2600), com tema do **Super Mario**. Você controla o Mario voando de capa por um rio gerado proceduralmente, destruindo inimigos e pontes, coletando combustível e sobrevivendo pelo maior tempo possível.

Feito em **JavaScript puro (vanilla)**, **HTML5 Canvas** e **Web Audio API** — sem frameworks, sem build, sem dependências e sem arquivos de áudio ou imagem externos.

---

## ✨ Destaques

- 🌊 **Rio procedural infinito** com curvas suaves (meandro com inércia), largura variável e ilhas.
- 🌉 **Pontes** que bloqueiam o caminho e precisam ser destruídas a tiros (3 acertos).
- ⛽ **Sistema de combustível**: o tanque drena continuamente; colete depósitos para reabastecer.
- 👾 **Inimigos** (navios e helicópteros) que patrulham e atiram.
- 🎚️ **Dificuldade progressiva** baseada na distância percorrida.
- 🔊 **Áudio 100% sintetizado** via Web Audio API (osciladores e ruído), incluindo som de motor dinâmico.
- 📱 **Suporte completo a mobile**: D-pad virtual, botões de ação, aviso de rotação e safe areas (iOS).
- 🖥️ **Tela cheia**, botão de mudo e canvas responsivo que preserva a proporção 16:9.
- ⏱️ **Game loop com passo fixo (60 Hz)** para física consistente em qualquer taxa de atualização.

---

## 🎮 Controles

### Teclado

| Ação | Teclas |
|---|---|
| Mover esquerda / direita | `←` `→` ou `A` `D` |
| Subir / descer (altitude) | `↑` `↓` ou `W` `S` |
| Disparar Fireball | `Espaço` (segure para rajada) |
| Turbo | `Shift` |
| Iniciar / reiniciar | `Enter` |
| Pausar / continuar | `Esc` ou `P` |
| Tela cheia | `F` |
| Ligar/desligar som | `M` |

### Touch (celular e tablet)

- **D-pad** à esquerda (▲ ◀ ▶ ▼) — suporta deslizar o dedo entre botões e multitoque.
- **🔥 Fireball** e **⚡ Turbo** à direita.
- **▶ START** para iniciar e reiniciar.
- Botões ⛶ (tela cheia) e 🔊 (mudo) no canto superior direito do canvas.

> Em smartphones em modo retrato é exibido um aviso para girar o dispositivo para paisagem.

---

## 🕹️ Como jogar

1. Pressione **Enter** (ou toque em **START**) no menu.
2. Mantenha o Mario dentro do rio — tocar a margem ou uma ilha é **colisão fatal**.
3. Atire nos inimigos (**+150**) e nas pontes (**+300**). Pontes intactas destroem o Mario ao contato.
4. Voe sobre os depósitos de combustível (**+50**, recupera 45 unidades).
5. Evite os tiros e o contato com inimigos.
6. Você tem **3 vidas**. Ao perder uma, renasce com **2 segundos de invulnerabilidade** e com pelo menos 50% de combustível.

### Mecânicas

| Mecânica | Detalhe |
|---|---|
| **Velocidade de rolagem** | Base de 90 px/s. `↑` acelera (+80), `↓` freia (−55), turbo multiplica por 1,6×. |
| **Combustível** | Máx. 100, consumo de 3/s (1,6× mais rápido com turbo). Chegou a zero = queda. |
| **Pontes** | Surgem a cada ~140 linhas do rio; têm 3 pontos de vida. |
| **Ilhas** | 2,5% de chance por linha; 2–3 colunas de largura, 5–10 linhas de comprimento, sempre com canais laterais largos o bastante para passar. |
| **Pontuação** | Distância (0,06 por unidade) + kills (150) + combustível (50) + pontes (300). |
| **Dificuldade** | A cada 3.500 unidades de distância a velocidade de rolagem aumenta 10%. |

---

## 🚀 Executando

O projeto usa scripts clássicos (não ES modules), então **basta abrir o `index.html` no navegador**. Para evitar restrições de alguns navegadores, recomenda-se um servidor estático local:

```bash
# Python
python3 -m http.server 8000

# ou Node
npx serve .
```

Depois acesse `http://localhost:8000`.

### Publicando no GitHub Pages

1. Envie o projeto para um repositório no GitHub.
2. Vá em **Settings → Pages**.
3. Em **Source**, escolha a branch `main` e a pasta `/ (root)`.
4. Salve. O jogo ficará disponível em `https://<seu-usuario>.github.io/<repositorio>/`.

---

## 📁 Estrutura do projeto

O `index.html` espera os arquivos nas pastas `css/` e `js/`:

```
mario-raid/
├── index.html
├── css/
│   └── style.css      # Layout responsivo, moldura, botões touch, fullscreen
└── js/
    ├── utils.js       # Constantes de balanceamento (MK.Const) e helpers (clamp, aabb, randInt)
    ├── audio.js       # Motor de áudio sintetizado (Web Audio API)
    ├── graph.js       # Utilitários de grafo/BFS para conectividade do rio
    ├── level.js       # Gerador procedural de terreno (MK.Terrain)
    ├── levels.js      # Curva de dificuldade (MK.getDifficulty)
    ├── input.js       # Teclado + controles touch virtuais (MK.Input)
    ├── entities.js    # Jogador, tiros, inimigos, combustível, explosões
    ├── renderer.js    # Renderização no canvas (MK.Renderer)
    ├── game.js        # Máquina de estados e loop principal (MK.Game)
    └── main.js        # Bootstrap: DOM, resize, fullscreen, mute, orientação
```

A ordem de carregamento dos `<script>` no `index.html` é importante, pois todos os módulos compartilham o namespace global `MK`.

---

## 🧱 Arquitetura

Todos os módulos são registrados no namespace global **`window.MK`** (padrão IIFE / classes), o que permite manter o projeto sem bundler.

### `MK.Game` (`game.js`)
- Máquina de estados: `menu` → `playing` ⇄ `paused` → `gameover` → `menu`.
- **Passo fixo de 1/60 s** com acumulador; `dt` é limitado a 50 ms para evitar "espiral da morte" após troca de aba.
- Ordem de cada atualização: velocidade de rolagem → jogador → geração de terreno → tiros → spawn → inimigos → projéteis → combustível → explosões → colisões.
- Colisão com terreno usa hitbox horizontal reduzida (margem de 5 px) e testa a linha do centro do Mario.

### `MK.Terrain` (`level.js`)
Gera o rio **linha a linha, sob demanda** (`ensureRows`). Cada linha contém uma lista de `ranges` navegáveis (`c0`…`c1`) em uma grade de 24 colunas × 32 px.

1. **Centro do rio** com velocidade acumulada → curvas orgânicas, não zigue-zague.
2. **Largura** variando suavemente entre 9 e 17 colunas.
3. **Ilhas** divididas em dois canais com largura mínima garantida.
4. **Pontes**, **depósitos de combustível** e **spawns de inimigos** posicionados dentro do rio.
5. **Garantia de conectividade**: se uma linha não se sobrepõe à anterior, ela é realinhada — o rio sempre tem passagem.
6. As primeiras **45 linhas** são uma área totalmente aberta para o início seguro.

### `MK.Input` (`input.js`)
- Abstrai teclado e toque em **ações** (`left`, `right`, `up`, `down`, `shoot`, `run`, `start`, `pause`).
- `isDown(action)` para estado contínuo e `wasPressed(action)` para eventos de um único frame.
- Touch com rastreamento por `identifier`, permitindo múltiplos dedos e deslizar entre botões.

### `MK.Audio` (`audio.js`)
- Efeitos: `shoot`, `explosion`, `crash`, `fuel`, `bridge`, `start`, `gameover`, `hit`.
- Motor contínuo (dente de serra + sub-oscilador com filtro passa-baixa) cuja frequência acompanha a velocidade.
- O `AudioContext` é desbloqueado no primeiro gesto do usuário (exigência de iOS/Chrome).

### Grafo (`graph.js`)
Funções auxiliares (`buildRiverGraph`, `bfsPath`, `isChunkConnected`) que modelam os trechos do rio como grafo e verificam conectividade com BFS. Disponíveis para validação/depuração do gerador.

---

## ⚙️ Personalização

Quase todo o balanceamento está em **`js/utils.js` → `MK.Const`**. Alguns exemplos:

| Constante | Efeito |
|---|---|
| `MIN_RIVER_WIDTH` / `MAX_RIVER_WIDTH` | Largura do rio (em colunas) |
| `RIVER_MEANDER_ACCEL` / `RIVER_MEANDER_MAX_VEL` | Suavidade e intensidade das curvas |
| `ISLAND_CHANCE` | Frequência de ilhas |
| `BRIDGE_EVERY_ROWS`, `BRIDGE_HP` | Distância e resistência das pontes |
| `FUEL_EVERY_ROWS`, `FUEL_DRAIN`, `FUEL_REFILL` | Economia de combustível |
| `ENEMY_CHANCE`, `ENEMY_SPEED`, `ENEMY_FIRE_INTERVAL` | Densidade e agressividade dos inimigos |
| `BASE_SCROLL_SPEED`, `RUN_MULTIPLIER` | Ritmo do jogo |
| `LIVES`, `INVULNERABLE_TIME` | Vidas e proteção após renascer |

A curva de dificuldade fica em `js/levels.js`.

---

## 🌐 Compatibilidade

- Navegadores modernos com suporte a Canvas 2D e Web Audio (Chrome, Edge, Firefox, Safari).
- Desktop, tablets e smartphones (Android e iOS, incluindo suporte a *safe areas* e modo PWA-like via meta tags).
- A API de tela cheia usa prefixos `webkit`/`moz` quando necessário.

---

## 🗺️ Ideias para o futuro

- [ ] Persistir o recorde (high score) com `localStorage`.
- [ ] Usar o multiplicador `enemyMultiplier` (já calculado em `levels.js`) para escalar a densidade de inimigos.
- [ ] Novos inimigos e power-ups (estrela, cogumelo, flor de fogo).
- [ ] Chefes ao fim de cada fase.
- [ ] Música de fundo sintetizada.
- [ ] Modo PWA com *service worker* para jogar offline.
- [ ] Testes automatizados do gerador de terreno usando `graph.js`.

## 📄 Licença

[MIT](https://choosealicense.com/licenses/mit/)).
