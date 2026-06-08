# 🚀 Memory Chase Turbo

> Um jogo *shoot 'em up* (atire em tudo!) de visão vertical, desenvolvido com **Phaser 3** e **TypeScript**, empacotável como aplicativo de desktop com **Electron**.

Este repositório foi preparado como **estudo de caso para estudantes**: todo o código-fonte está
densamente comentado, explicando *o que* cada função faz e *por que* as operações mais
complexas (física, perseguição, magnetismo, persistência) foram feitas daquela forma.

---

## 📖 Sumário

1. [A História do Jogo](#-a-história-do-jogo)
2. [Como Jogar](#-como-jogar)
3. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
4. [Como Executar o Projeto](#-como-executar-o-projeto)
5. [Estrutura de Pastas](#-estrutura-de-pastas)
6. [Arquitetura: Como o Jogo Funciona](#-arquitetura-como-o-jogo-funciona)
7. [Conceitos-Chave Explicados](#-conceitos-chave-explicados)
8. [Sistemas de Jogo em Detalhe](#-sistemas-de-jogo-em-detalhe)
9. [Roteiro de Leitura do Código (para estudantes)](#-roteiro-de-leitura-do-código-para-estudantes)
10. [Créditos](#-créditos)

---

## 🌌 A História do Jogo

Com a explosão do uso de **Inteligência Artificial** pelas grandes corporações, a especulação
sobre componentes de hardware atingiu o pico. Gigantes da tecnologia passaram a esgotar os
estoques mundiais de **memória RAM** para alimentar seus servidores de IA, prejudicando os
consumidores comuns.

O protagonista combate essas megacorporações pilotando seu **Fiat Uno voador** num futuro
distópico, caçando memórias (as moedas do jogo) e destruindo as naves inimigas das empresas.

---

## 🎮 Como Jogar

| Ação | Tecla |
|------|-------|
| Mover | `← ↑ → ↓` (setas) ou `W A S D` |
| Atirar | `Espaço` |
| Pausar | `Esc` |

**Objetivo:** sobreviva o máximo possível, destrua inimigos, desvie de tiros e colete moedas
(memórias). Os pontos ganhos vão para sua **carteira** e podem ser gastos na **Loja de Upgrades**
entre as partidas. A dificuldade aumenta com o tempo!

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Papel no projeto |
|------------|------------------|
| **[Phaser 3](https://phaser.io/)** | Motor de jogos 2D (renderização, física *arcade*, áudio, cenas, *tweens*) |
| **TypeScript** | Linguagem principal — JavaScript com tipagem estática |
| **[Vite](https://vitejs.dev/)** | Servidor de desenvolvimento e empacotador (*bundler*) ultrarrápido |
| **[Electron](https://www.electronjs.org/)** | Transforma o jogo web num app de desktop (Windows/Linux) |
| **electron-builder** | Gera os instaláveis (`.AppImage` no Linux, `.exe` portátil no Windows) |
| **localStorage** | Persistência do progresso do jogador (save) no navegador |

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- **Node.js** 18+ e **npm** instalados.

### Passo a passo

```bash
# 1. Instalar as dependências
npm install

# 2. Rodar em modo de desenvolvimento (abre no navegador, com recarga automática)
npm run dev
#    → acesse http://localhost:3000

# 3. Gerar a versão de produção (pasta dist/)
npm run build

# 4. Pré-visualizar o build de produção no navegador
npm run preview
```

### Rodando como aplicativo de desktop (Electron)

```bash
# Rodar no Electron (requer um build prévio em dist/)
npm run build
npm run electron

# Gerar o instalável/executável de desktop (saída na pasta release/)
npm run app:dist
```

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite (porta 3000) |
| `npm run build` | Compila e empacota em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run electron` | Abre o jogo numa janela Electron |
| `npm run dist` | Empacota o app de desktop com electron-builder |
| `npm run app:dist` | `build` + empacotamento de desktop em sequência |

---

## 📁 Estrutura de Pastas

```
Memory Chase Turbo/
├── index.html              # Página hospedeira (carrega o jogo no navegador)
├── package.json            # Dependências e scripts npm
├── tsconfig.json           # Configuração do compilador TypeScript
├── vite.config.js          # Configuração do Vite (build/dev server)
│
├── electron/
│   └── main.cjs            # Processo principal do Electron (janela de desktop)
│
├── public/assets/          # Recursos estáticos (imagens, sprites, sons, música)
│   ├── spritesheet.png     # Folha de sprites (jogador, inimigos, itens)
│   ├── sfx/                # Efeitos sonoros
│   └── musicas/            # Música de fundo
│
└── src/                    # CÓDIGO-FONTE (TypeScript)
    ├── main.ts             # 🟢 Ponto de entrada: cria o jogo Phaser
    │
    ├── scenes/             # As "telas" do jogo (cada uma é uma Scene)
    │   ├── BootScene.ts        # Carrega os assets e gera texturas de balas
    │   ├── MenuScene.ts        # Menu principal, modais (Extra/Opções/Sobre)
    │   ├── GameScene.ts        # ⭐ A partida em si (a cena mais importante)
    │   ├── UpgradeScene.ts     # Loja de upgrades (gasta pontos)
    │   └── WeaponSelectScene.ts# Seleção de arma
    │
    ├── entities/           # Os "objetos" do jogo (sprites com física)
    │   ├── Player.ts           # ⭐ O jogador: movimento, tiro, poderes, dano
    │   ├── Coin.ts             # Moeda coletável
    │   ├── ShieldItem.ts       # Power-up de escudo
    │   ├── TimeWarpItem.ts     # Power-up de Espaço-Tempo (x5 pontos)
    │   └── Enemies/
    │       ├── Enemy.ts        # Classe ABSTRATA base de todos os inimigos
    │       ├── WalkerEnemy.ts  # Inimigo básico (só desce)
    │       ├── ShooterEnemy.ts # Inimigo que atira no jogador
    │       └── ChaserEnemy.ts  # ⭐ Inimigo perseguidor "kamikaze"
    │
    ├── effects/
    │   └── ExplosionEffect.ts  # Explosões e ondas de choque (visual + física)
    │
    └── utils/              # Utilitários e sistemas transversais
        ├── constants.ts        # Constantes de balanceamento
        ├── SaveData.ts         # ⭐ Persistência + economia dos upgrades
        ├── AudioManager.ts     # Gerenciador central de som/música
        └── WeaponSystem.ts     # Catálogo de armas e suas lógicas de tiro
```

> ⭐ = arquivos mais ricos/complexos, ótimos para estudo aprofundado.

---

## 🏗 Arquitetura: Como o Jogo Funciona

O jogo é organizado em torno do conceito de **Cenas (Scenes)** do Phaser. Cada cena é uma tela
independente, e o jogo transita entre elas:

```
        ┌────────────┐
        │ BootScene  │  Carrega imagens, sons e cria texturas das balas
        └─────┬──────┘
              │ (assets prontos)
              ▼
        ┌────────────┐      ┌──────────────────────┐
        │ MenuScene  │◄────►│ WeaponSelectScene     │  Escolher arma
        │ (hub)      │◄────►│ UpgradeScene          │  Comprar upgrades
        └─────┬──────┘      └──────────────────────┘
              │ "Iniciar Jogo"
              ▼
        ┌────────────┐
        │ GameScene  │  A partida: física, inimigos, colisões, pontuação
        └─────┬──────┘
              │ Game Over → soma pontos à carteira → salva
              ▼
        (volta ao Menu ou reinicia)
```

O **progresso persistente** (pontos, upgrades, arma escolhida) é o fio que conecta tudo: é
gravado no `localStorage` por `SaveData.ts` e lido pelas cenas para configurar a partida.

### Ciclo de vida de uma cena Phaser

Toda cena segue o mesmo ritmo, usado intensamente na `GameScene`:

| Método | Quando roda | Para quê |
|--------|-------------|----------|
| `init()` | Antes de tudo (e em cada reinício) | Resetar variáveis de estado |
| `preload()` | Após o init | Carregar assets (usado na BootScene) |
| `create()` | Uma vez, após carregar | Montar o mundo: entidades, colisões, HUD |
| `update()` | ~60 vezes por segundo | Mover/atualizar tudo, frame a frame |
| `shutdown()` | Ao sair da cena | Limpeza (parar timers, música, eventos) |

---

## 🧠 Conceitos-Chave Explicados

Estes são os conceitos que mais se repetem no código. Entendê-los destrava a leitura do projeto.

### 1. Herança e Classes Abstratas (os Inimigos)
`Enemy.ts` é uma **classe abstrata**: define o que TODO inimigo tem (vida, velocidade, dano),
mas obriga cada filho a implementar seu próprio `updateBehavior()`. É o padrão **Template Method**:
a base dá a estrutura, as subclasses preenchem os detalhes.
→ `WalkerEnemy` (só desce), `ShooterEnemy` (atira), `ChaserEnemy` (persegue e explode).

### 2. Grupos de Física
Em vez de gerenciar cada bala/inimigo individualmente, o Phaser os agrupa
(`physics.add.group()`). Grupos tornam a detecção de colisão eficiente e permitem operar sobre
todos os membros de uma vez.

### 3. Overlap vs. Collider
- **`overlap`** → apenas DETECTA a sobreposição (ex.: jogador encosta na moeda → coletar).
- **`collider`** → detecta E RESOLVE fisicamente (ex.: jogador bate na parede → é bloqueado).

### 4. Tweens (animações interpoladas)
Um *tween* anima uma propriedade suavemente entre dois valores ao longo do tempo (ex.: uma
explosão que cresce e some). Ao terminar (`onComplete`), o objeto é destruído para não acumular
lixo. Vê-se isso em todos os efeitos visuais.

### 5. Vetores, Ângulos e Trigonometria
Boa parte da "inteligência" do jogo é geometria:
- `Math.hypot(dx, dy)` → distância entre dois pontos (Pitágoras).
- `Math.atan2(dy, dx)` → ângulo da direção de um ponto a outro.
- `Math.cos(ângulo)` / `Math.sin(ângulo)` → de volta a um vetor velocidade.

Esse trio aparece no magnetismo, nos tiros mirados, na perseguição do Chaser e nos empurrões
das explosões.

### 6. `setData()` nas balas
As balas carregam "etiquetas" via `setData('explosive', true)` / `setData('homing', true)`. A
GameScene lê essas etiquetas para decidir o comportamento no impacto, sem precisar de subclasses
diferentes de bala.

---

## 🎯 Sistemas de Jogo em Detalhe

### Sistema de Armas (`WeaponSystem.ts`)
Cada arma é um objeto que carrega seus atributos **e** sua própria função `shoot()` (padrão
*Strategy*). O jogador só chama `weapon.shoot(...)` — a arma faz o resto.

| Arma | Comportamento | Recarga |
|------|---------------|---------|
| 🔫 Padrão | Tiro reto **explosivo** no impacto | 250 ms |
| 💥 Cônica | 3 tiros em leque (-15°, 0°, +15°) | 400 ms |
| 🧲 Magnética | Bala **teleguiada** que persegue inimigos | 600 ms |

### Sistema de Upgrades (`SaveData.ts` + `UpgradeScene.ts`)
A economia (custos e benefícios) fica toda em `SaveData.ts`. Diferentes curvas de preço ensinam
balanceamento:
- **Vidas** → crescimento *super-linear* (`preço^1.8`), com teto.
- **Magnetismo** → crescimento *exponencial* (`500 × 3^nível`).
- **Escudo / Espaço-Tempo** → tabelas fixas de preço/benefício.

### Power-ups
- 🛡️ **Escudo**: reflete balas inimigas e bloqueia dano por um tempo.
- ⏰ **Espaço-Tempo**: multiplica **x5** todos os pontos ganhos enquanto ativo.

Ambos surgem por **sorteio de chance** atrelado ao nível comprado, e descem em **ziguezague**.

### Dificuldade Progressiva (`GameScene.increaseDifficulty`)
A cada 60 s, o intervalo entre o surgimento de inimigos cai 5% (com um piso de 400 ms),
deixando o jogo gradualmente mais intenso.

### Inimigo Perseguidor (`ChaserEnemy.ts`) — o mais complexo
Máquina de estados de duas fases: **patrulha** (desce reto) → ao detectar o jogador, **trava a
mira** na posição atual dele e **mergulha em linha reta**. Crucialmente, ele *não corrige* o
rumo depois — isso dá ao jogador a chance de desviar. Ao morrer, **explode com dano em área**,
podendo causar reações em cadeia com outros inimigos.

---

## 📚 Roteiro de Leitura do Código (para estudantes)

Sugestão de ordem para estudar o projeto, do mais simples ao mais complexo:

1. **`src/main.ts`** — veja como um jogo Phaser é configurado e iniciado.
2. **`src/utils/constants.ts`** — entenda o que é "balanceamento".
3. **`src/scenes/BootScene.ts`** — carregamento de assets e geração de texturas em runtime.
4. **`src/entities/Coin.ts`** — o sprite com física mais simples possível.
5. **`src/entities/Enemies/Enemy.ts`** → `WalkerEnemy` → `ShooterEnemy` — herança em ação.
6. **`src/utils/WeaponSystem.ts`** — o padrão *Strategy* e a trigonometria do tiro cônico.
7. **`src/effects/ExplosionEffect.ts`** — tweens e física de empurrão (shockwave).
8. **`src/entities/Enemies/ChaserEnemy.ts`** — máquina de estados e dano em área.
9. **`src/entities/Player.ts`** — movimento, mira, poderes e o sistema de dano/invencibilidade.
10. **`src/utils/SaveData.ts`** — persistência e as curvas de economia.
11. **`src/scenes/GameScene.ts`** — o grande maestro que amarra tudo. Deixe por último.

> 💡 Dica: para ver as "caixas de colisão" enquanto estuda a física, mude `debug: false` para
> `debug: true` em `src/main.ts` (dentro de `physics.arcade`).

---

## 👤 Créditos

- **Desenvolvedor:** Luiz Henrique Oliveira de Freitas
- **Ano:** 2026 · **Versão:** 1.0.0
- **Feito com:** Phaser 3 + TypeScript + Electron

---

<p align="center"><em>Projeto documentado como estudo de caso educacional. 🎓</em></p>
