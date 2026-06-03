# Tutorial: Clone do Snake com React 🐍

> Baseado na mesma estrutura do tutorial oficial do React (Jogo da Velha):
> **componentes → estado → lógica pura → imutabilidade**
> https://react.dev/learn/tutorial-tic-tac-toe

---

## O que vamos construir

Um clone do clássico Snake rodando no navegador, feito com React puro (sem libs de jogo). A cobra se move numa grade, come comida, cresce e morre se bater na parede ou em si mesma.

**Conceitos aplicados (igual ao Jogo da Velha):**
- **Termo** → componentes bem definidos com responsabilidades claras
- **Contexto** → estado centralizado no componente pai
- **Conexão Dialed** → lógica do jogo separada da UI (funções puras)

---

## Passo 1 — Criando o projeto

```bash
npm create vite@latest snake-game -- --template react
cd snake-game
npm install
npm run dev
```

Limpe `App.jsx` e `App.css`. Estrutura de arquivos que vamos criar:

```
src/
  gameLogic.js   ← lógica pura (sem React)
  Snake.jsx      ← componente principal
  Cell.jsx       ← célula da grade
  App.jsx        ← entry point
```

---

## Passo 2 — Definindo os componentes (Termo)

Assim como no Jogo da Velha tínhamos `Square → Board → Game`, aqui teremos:

| Componente | Responsabilidade |
|---|---|
| `Cell` | Renderiza uma célula: vazia, cobra ou comida |
| `Board` | Renderiza a grade 20×20 usando `Cell` |
| `Snake` | Gerencia todo o estado do jogo (cobra, comida, direção, score) |

### Cell.jsx

```jsx
// O menor elemento visual — só recebe props, não tem estado
export function Cell({ type }) {
  const colors = {
    empty: '#0f172a',
    snake: '#22c55e',
    head:  '#4ade80',
    food:  '#f97316',
  };

  return (
    <div style={{
      width: 20,
      height: 20,
      backgroundColor: colors[type] ?? colors.empty,
      border: '1px solid #1e293b',
      borderRadius: type === 'food' ? '50%' : 2,
      transition: 'background-color 0.05s',
    }} />
  );
}
```

### Board.jsx (dentro de Snake.jsx)

```jsx
// Renderiza a grade, recebe o estado processado como prop
function Board({ grid }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 20px)' }}>
      {grid.map((cell, i) => (
        <Cell key={i} type={cell} />
      ))}
    </div>
  );
}
```

---

## Passo 3 — A lógica pura (Conexão Dialed)

Toda a lógica do jogo fica em `gameLogic.js` — **sem nenhum import do React**. Isso é o mesmo princípio do tutorial: funções puras que recebem estado e retornam novo estado.

```js
// gameLogic.js

export const COLS = 20;
export const ROWS = 20;
export const TICK_MS = 150; // velocidade

// Estado inicial
export function createInitialState() {
  return {
    snake: [{ x: 10, y: 10 }],  // array de posições
    dir: { x: 1, y: 0 },         // direção atual
    food: spawnFood([{ x: 10, y: 10 }]),
    score: 0,
    alive: true,
  };
}

// Gera comida em posição aleatória (fora da cobra)
export function spawnFood(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

// Avança um tick — retorna NOVO estado (imutabilidade!)
export function tick(state) {
  if (!state.alive) return state;

  const { snake, dir, food, score } = state;

  // Nova cabeça
  const head = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y,
  };

  // Colisão com parede
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    return { ...state, alive: false };
  }

  // Colisão com o próprio corpo
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    return { ...state, alive: false };
  }

  const ate = head.x === food.x && head.y === food.y;

  // Nova cobra: adiciona cabeça, remove cauda (a não ser que comeu)
  const newSnake = ate ? [head, ...snake] : [head, ...snake.slice(0, -1)];

  return {
    ...state,
    snake: newSnake,
    food: ate ? spawnFood(newSnake) : food,
    score: ate ? score + 10 : score,
  };
}

// Muda direção (ignora inversão direta — não pode voltar pra trás)
export function changeDir(current, next) {
  if (current.x + next.x === 0 && current.y + next.y === 0) return current;
  return next;
}

// Converte estado do jogo para grid linear (para renderizar)
export function buildGrid(snake, food) {
  const grid = Array(COLS * ROWS).fill('empty');

  food && (grid[food.y * COLS + food.x] = 'food');

  snake.forEach((s, i) => {
    grid[s.y * COLS + s.x] = i === 0 ? 'head' : 'snake';
  });

  return grid;
}
```

---

## Passo 4 — O estado (Contexto)

O componente `Snake.jsx` é o "Game" do nosso jogo — centraliza todo o estado e passa para os filhos via props.

```jsx
// Snake.jsx
import { useState, useEffect, useCallback } from 'react';
import { createInitialState, tick, changeDir, buildGrid, TICK_MS } from './gameLogic';
import { Cell } from './Cell';

export function Snake() {
  const [state, setState] = useState(createInitialState);

  // Game loop com setInterval
  useEffect(() => {
    if (!state.alive) return;

    const id = setInterval(() => {
      setState(prev => tick(prev)); // imutável: tick retorna novo estado
    }, TICK_MS);

    return () => clearInterval(id); // cleanup
  }, [state.alive]);

  // Captura teclas — useCallback evita recriar a função toda re-render
  const handleKey = useCallback((e) => {
    const dirs = {
      ArrowUp:    { x: 0, y: -1 },
      ArrowDown:  { x: 0, y:  1 },
      ArrowLeft:  { x: -1, y: 0 },
      ArrowRight: { x:  1, y: 0 },
    };
    if (!dirs[e.key]) return;
    e.preventDefault();
    setState(prev => ({
      ...prev,
      dir: changeDir(prev.dir, dirs[e.key]),
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const grid = buildGrid(state.snake, state.food);
  const restart = () => setState(createInitialState());

  return (
    <div style={{ textAlign: 'center', padding: 24, background: '#020617', minHeight: '100vh', color: '#fff' }}>
      <h1>Snake 🐍</h1>
      <p>Score: {state.score}</p>

      <div style={{ display: 'inline-block', border: '2px solid #22c55e' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 20px)' }}>
          {grid.map((cell, i) => <Cell key={i} type={cell} />)}
        </div>
      </div>

      {!state.alive && (
        <div>
          <p>💀 Game Over! Score final: {state.score}</p>
          <button onClick={restart}>Jogar de novo</button>
        </div>
      )}

      <p style={{ color: '#64748b', fontSize: 12 }}>Use as setas do teclado para mover</p>
    </div>
  );
}
```

---

## Passo 5 — App.jsx

```jsx
// App.jsx
import { Snake } from './Snake';

export default function App() {
  return <Snake />;
}
```

---

## Conceitos aplicados (paralelo com o Jogo da Velha)

| Jogo da Velha | Snake |
|---|---|
| `Square` | `Cell` |
| `Board` | `Board` (grid 20×20) |
| `Game` | `Snake` (estado central) |
| `squares` array imutável | `snake` array imutável |
| `calculateWinner()` | `tick()`, `checkCollision()` |
| `history` para time travel | `createInitialState()` para restart |
| `onClick` handler | `onKeyDown` handler |

---

## Passo 6 — Subindo no Git

```bash
git init
git add .
git commit -m "feat: clone do Snake com React"

# Cria repo no GitHub e conecta:
git remote add origin https://github.com/seu-user/snake-game.git
git push -u origin main
```

### Deploy gratuito no Vercel

```bash
npm install -g vercel
vercel
# Segue o wizard — em 1 minuto seu jogo está online com link público!
```

---

## Resumo dos conceitos

- **Termo** → `Cell`, `Board`, `Snake` — cada um com responsabilidade única
- **Contexto** → estado em `Snake`: `snake[]`, `dir`, `food`, `score`, `alive`
- **Conexão Dialed** → `gameLogic.js` com `tick()`, `changeDir()`, `buildGrid()` — lógica pura sem React
- **Imutabilidade** → `tick()` sempre retorna `{ ...state, ... }` nunca muta o objeto
- **useEffect** → game loop e listener de teclado com cleanup
- **useCallback** → handler de teclado memoizado

> 💡 Desafio extra: implemente o histórico de scores com `localStorage`, ou adicione níveis de dificuldade aumentando o `TICK_MS`!
