import { useState, useEffect, useCallback, useRef } from "react";

// ─── GAME LOGIC (gameLogic.js) ────────────────────────────────────────────────
// Lógica pura separada da UI — sem nenhuma dependência do React

const COLS = 20;
const ROWS = 20;
const TICK_MS = 140;

function spawnFood(snake) {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function createInitialState() {
  const snake = [{ x: 10, y: 10 }];
  return { snake, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, food: spawnFood(snake), score: 0, alive: true, started: false };
}

function tick(state) {
  if (!state.alive || !state.started) return state;
  const { snake, nextDir, food, score } = state;
  const dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS)
    return { ...state, alive: false };
  if (snake.some((s) => s.x === head.x && s.y === head.y))
    return { ...state, alive: false };

  const ate = head.x === food.x && head.y === food.y;
  const newSnake = ate ? [head, ...snake] : [head, ...snake.slice(0, -1)];

  return {
    ...state,
    dir,
    snake: newSnake,
    food: ate ? spawnFood(newSnake) : food,
    score: ate ? score + 10 : score,
  };
}

function applyDir(current, next) {
  if (current.x + next.x === 0 && current.y + next.y === 0) return current;
  return next;
}

function buildGrid(snake, food) {
  const grid = Array(COLS * ROWS).fill(0); // 0=empty
  if (food) grid[food.y * COLS + food.x] = 3; // food
  snake.forEach((s, i) => { grid[s.y * COLS + s.x] = i === 0 ? 2 : 1; }); // 2=head,1=body
  return grid;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Cell({ type }) {
  const style = {
    width: "100%",
    height: "100%",
    borderRadius: type === 3 ? "50%" : type === 2 ? 3 : 2,
    background: type === 2 ? "#4ade80" : type === 1 ? "#16a34a" : type === 3 ? "#fb923c" : "transparent",
    boxShadow: type === 2 ? "0 0 8px #4ade8099" : type === 3 ? "0 0 6px #fb923c88" : "none",
    transition: "background 0.05s",
  };
  return <div style={style} />;
}

function ScoreBoard({ score, best }) {
  return (
    <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 16 }}>
      {[["SCORE", score], ["BEST", best]].map(([label, val]) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#4b5563", fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: label === "SCORE" ? "#4ade80" : "#f9fafb", lineHeight: 1 }}>
            {String(val).padStart(4, "0")}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN GAME ────────────────────────────────────────────────────────────────

export default function SnakeGame() {
  const [state, setState] = useState(createInitialState);
  const [best, setBest] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Game loop
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next = tick(prev);
        if (!next.alive && prev.alive) {
          setBest((b) => Math.max(b, next.score));
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Keyboard
  const handleKey = useCallback((e) => {
    const map = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
    };
    if (map[e.key]) {
      e.preventDefault();
      setState((prev) => ({
        ...prev,
        started: true,
        nextDir: applyDir(prev.dir, map[e.key]),
      }));
    }
    if (e.key === " " || e.key === "Enter") {
      if (!stateRef.current.alive) restart();
      else setState((prev) => ({ ...prev, started: true }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const restart = () => setState(createInitialState());

  // Mobile controls
  const move = (dir) => setState((prev) => ({ ...prev, started: true, nextDir: applyDir(prev.dir, dir) }));

  const grid = buildGrid(state.snake, state.food);
  const cellSize = "min(calc((100vw - 48px) / 20), 26px)";

  return (
    <div style={{
      minHeight: "100vh", background: "#030712", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "16px 12px", userSelect: "none",
    }}>
      {/* Title */}
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "#374151", fontFamily: "monospace", marginBottom: 4 }}>
          REACT SNAKE CLONE
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f9fafb", fontFamily: "monospace", letterSpacing: "-0.02em", margin: 0 }}>
          SN<span style={{ color: "#4ade80" }}>AK</span>E
        </h1>
      </div>

      <ScoreBoard score={state.score} best={best} />

      {/* Board */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${COLS}, ${cellSize})`,
        gridTemplateRows: `repeat(${ROWS}, ${cellSize})`,
        gap: 1,
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 6,
        padding: 6,
        position: "relative",
      }}>
        {grid.map((cell, i) => <Cell key={i} type={cell} />)}

        {/* Overlay: not started */}
        {!state.started && state.alive && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "#030712cc",
            borderRadius: 6, gap: 8,
          }}>
            <div style={{ fontSize: 24 }}>🐍</div>
            <div style={{ fontSize: 13, color: "#9ca3af", fontFamily: "monospace", textAlign: "center" }}>
              Pressione qualquer seta<br />ou WASD para começar
            </div>
          </div>
        )}

        {/* Overlay: game over */}
        {!state.alive && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", background: "#030712dd",
            borderRadius: 6, gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>💀</div>
            <div style={{ fontFamily: "monospace", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb", marginBottom: 4 }}>GAME OVER</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Score: {state.score}</div>
            </div>
            <button
              onClick={restart}
              style={{
                background: "#16a34a", color: "#fff", border: "none",
                padding: "8px 20px", borderRadius: 6, fontFamily: "monospace",
                fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em",
              }}
            >
              JOGAR DE NOVO
            </button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <button onClick={() => move({ x: 0, y: -1 })} style={btnStyle}>▲</button>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => move({ x: -1, y: 0 })} style={btnStyle}>◀</button>
          <button onClick={() => move({ x: 0, y: 1 })} style={btnStyle}>▼</button>
          <button onClick={() => move({ x: 1, y: 0 })} style={btnStyle}>▶</button>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "#1f2937", fontFamily: "monospace", textAlign: "center", lineHeight: 1.7 }}>
        ↑↓←→ ou WASD · ESPAÇO para reiniciar
      </div>
    </div>
  );
}

const btnStyle = {
  width: 44, height: 44, background: "#111827", border: "1px solid #1f2937",
  color: "#6b7280", borderRadius: 8, fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "monospace",
};
