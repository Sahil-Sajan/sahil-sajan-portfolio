import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import './Error404.css';
import Digit from '../components/Digit';

// ─── Pixel arrow icons (arrow.svg rotated per direction) ─────────────────────
const ArrowUp    = () => <img src="/arrow.svg" alt="" width="23" height="22" style={{ transform: 'rotate(-90deg)' }} />;
const ArrowDown  = () => <img src="/arrow.svg" alt="" width="23" height="22" style={{ transform: 'rotate(90deg)' }} />;
const ArrowLeft  = () => <img src="/arrow.svg" alt="" width="23" height="22" style={{ transform: 'rotate(180deg)' }} />;
const ArrowRight = () => <img src="/arrow.svg" alt="" width="23" height="22" />;

// ─── Isometric constants ────────────────────────────────────────────────────
const TW  = 64;
const TH  = 32;
const TD  = 10;
const BUH = 42;
const PAD = 50;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const MOVE_DUR = 180;  // ms
const FALL_ROLL  = 160;   // roll to edge
const FALL_TUMBLE = 500;  // tumble off edge with gravity

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  tileTop:    '#F0FBF7',
  tileLeft:   '#C0DED6',
  tileRight:  '#9EC9BF',
  tileStroke: 'rgba(0,60,40,0.12)',
  goalTop:    '#4EDF88',
  goalLeft:   '#28B060',
  goalRight:  '#178040',
  blockTop:   '#4EDF88',
  blockLeft:  '#28B060',
  blockRight: '#178040',
};

// ─── Level ───────────────────────────────────────────────────────────────────
const LEVEL = {
  grid: [
    [1,1,1,0,0,0,0,0,0],  //  0  Platform A
    [1,1,1,0,0,0,0,0,0],  //  1
    [1,1,1,0,0,0,0,0,0],  //  2
    [0,0,1,0,0,0,0,0,0],  //  3  Bridge 1
    [0,0,1,0,0,0,0,0,0],  //  4
    [0,0,1,1,1,1,1,0,0],  //  5  Platform B
    [0,0,1,1,1,1,1,0,0],  //  6
    [0,0,1,1,1,1,1,0,0],  //  7
    [0,0,0,0,0,0,1,0,0],  //  8  Bridge 2
    [0,0,0,0,0,0,1,0,0],  //  9
    [0,0,0,0,1,1,1,1,1],  // 10  Platform C
    [0,0,0,0,1,1,1,1,1],  // 11
    [0,0,0,0,1,1,1,1,1],  // 12
    [0,0,0,0,1,0,0,0,0],  // 13  Bridge 3
    [0,0,0,0,1,0,0,0,0],  // 14
    [0,0,1,1,1,0,0,0,0],  // 15  Platform D
    [0,0,1,1,1,0,0,0,0],  // 16
    [0,0,1,1,1,0,0,0,0],  // 17
    [0,0,2,0,0,0,0,0,0],  // 18  Goal
  ],
  start: { type: 'U', x: 0, y: 0 },
};

// ─── Precompute actual tile bounds for tight canvas sizing ──────────────────
const _bounds = (() => {
  const g = LEVEL.grid;
  let minCR = Infinity, maxCR = -Infinity;
  let minCP = Infinity, maxCP = -Infinity;
  for (let ry = 0; ry < g.length; ry++)
    for (let cx = 0; cx < g[0].length; cx++)
      if (g[ry][cx] !== 0) {
        const cr = cx - ry, cp = cx + ry;
        if (cr < minCR) minCR = cr;
        if (cr > maxCR) maxCR = cr;
        if (cp < minCP) minCP = cp;
        if (cp > maxCP) maxCP = cp;
      }
  return { minCR, maxCR, minCP, maxCP };
})();

// ─── Block logic ─────────────────────────────────────────────────────────────
function rollBlock({ type, x, y }, dir) {
  if (type === 'U') {
    if (dir === 'right') return { type: 'X', x: x + 1, y };
    if (dir === 'left')  return { type: 'X', x: x - 2, y };
    if (dir === 'down')  return { type: 'Y', x, y: y + 1 };
    if (dir === 'up')    return { type: 'Y', x, y: y - 2 };
  }
  if (type === 'X') {
    if (dir === 'right') return { type: 'U', x: x + 2, y };
    if (dir === 'left')  return { type: 'U', x: x - 1, y };
    if (dir === 'down')  return { type: 'X', x, y: y + 1 };
    if (dir === 'up')    return { type: 'X', x, y: y - 1 };
  }
  if (type === 'Y') {
    if (dir === 'right') return { type: 'Y', x: x + 1, y };
    if (dir === 'left')  return { type: 'Y', x: x - 1, y };
    if (dir === 'down')  return { type: 'U', x, y: y + 2 };
    if (dir === 'up')    return { type: 'U', x, y: y - 1 };
  }
}

function blockCells({ type, x, y }) {
  if (type === 'U') return [[x, y]];
  if (type === 'X') return [[x, y], [x + 1, y]];
  if (type === 'Y') return [[x, y], [x, y + 1]];
}

function isValid(grid, block) {
  const rows = grid.length, cols = grid[0].length;
  return blockCells(block).every(([cx, cy]) =>
    cx >= 0 && cx < cols && cy >= 0 && cy < rows && grid[cy][cx] !== 0
  );
}

function isWin(grid, block) {
  return block.type === 'U' && grid[block.y]?.[block.x] === 2;
}

// ─── Easing ──────────────────────────────────────────────────────────────────
function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
function easeInQuad(t) { return t * t; }
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ─── BFS: find minimum moves to win ──────────────────────────────────────────
const MIN_MOVES = (() => {
  const queue = [{ block: LEVEL.start, moves: 0 }];
  const visited = new Set();
  const key = (b) => `${b.type},${b.x},${b.y}`;
  visited.add(key(LEVEL.start));
  while (queue.length) {
    const { block, moves } = queue.shift();
    for (const dir of ['up', 'down', 'left', 'right']) {
      const next = rollBlock(block, dir);
      if (!isValid(LEVEL.grid, next)) continue;
      if (isWin(LEVEL.grid, next)) return moves + 1;
      const k = key(next);
      if (!visited.has(k)) { visited.add(k); queue.push({ block: next, moves: moves + 1 }); }
    }
  }
  return null;
})();

function getWinMessage(moves, falls) {
  const extra = moves - MIN_MOVES;
  if (falls === 0 && extra === 0)  return "Flawless.";
  if (falls === 0 && extra <= 3)   return "Clean and efficient.";
  if (falls === 0 && extra <= 8)   return "No falls. Decent.";
  if (falls === 0)                 return "You took the scenic route.";
  if (extra === 0 && falls === 1)  return "Optimal line, one slip.";
  if (extra === 0 && falls <= 3)   return "Optimal path, shaky landing.";
  if (extra === 0)                 return "You know the route, just not the edges.";
  if (falls === 1 && extra <= 3)   return "Almost clean.";
  if (falls <= 2 && extra <= 6)    return "Decent run.";
  if (falls <= 2)                  return "A few detours.";
  if (falls >= 15)                 return "Absolute chaos, so I'll let you pass.";
  if (falls >= 8)                  return "Stubborn. It paid off.";
  if (falls >= 4 && extra <= 5)    return "Efficient but clumsy.";
  if (falls >= 4)                  return "More falls than it needed.";
  return "You got there eventually.";
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
const FALL_LIMIT = 15;

const INIT = {
  block: { ...LEVEL.start },
  moves: 0,
  fell: false,
  fallCount: 0,
  won: false,
  gameover: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'MOVE_DONE': {
      const won = isWin(LEVEL.grid, action.block);
      return { ...state, block: action.block, moves: state.moves + 1, won };
    }
    case 'FELL': {
      const newCount = state.fallCount + 1;
      return { ...state, fell: true, fallCount: newCount, gameover: newCount >= FALL_LIMIT };
    }
    case 'UNFALL':
      if (state.gameover) return { ...state, fell: false };
      return { ...state, fell: false, block: { ...LEVEL.start }, moves: 0 };
    case 'RESET':
      return { ...INIT };
    default: return state;
  }
}

// ─── Isometric drawing ────────────────────────────────────────────────────────
function g2s(col, row, ox, oy) {
  return { x: ox + (col - row) * TW / 2, y: oy + (col + row) * TH / 2 };
}

function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function polyS(ctx, pts, fill, stroke) {
  poly(ctx, pts, fill);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

function drawTile(ctx, col, row, cell, ox, oy) {
  const goal = cell === 2;
  const a = g2s(col,     row,     ox, oy);
  const b = g2s(col + 1, row,     ox, oy);
  const c = g2s(col + 1, row + 1, ox, oy);
  const d = g2s(col,     row + 1, ox, oy);
  const dn = (p) => ({ x: p.x, y: p.y + TD });

  polyS(ctx, [b, c, dn(c), dn(b)], goal ? C.goalRight : C.tileRight, C.tileStroke);
  polyS(ctx, [d, c, dn(c), dn(d)], goal ? C.goalLeft  : C.tileLeft,  C.tileStroke);
  polyS(ctx, [a, b, c, d],          goal ? C.goalTop   : C.tileTop,   C.tileStroke);

}

function drawBlockRaw(ctx, bx, by, w, d, h, lift, sinkY, alpha) {
  const ox = ctx._ox, oy = ctx._oy;
  const tl = g2s(bx,     by,     ox, oy);
  const tr = g2s(bx + w, by,     ox, oy);
  const br = g2s(bx + w, by + d, ox, oy);
  const bl = g2s(bx,     by + d, ox, oy);

  const adj = (p) => ({ x: p.x, y: p.y - lift + sinkY });
  const ftl = adj(tl), ftr = adj(tr), fbr = adj(br), fbl = adj(bl);
  const up = (p) => ({ x: p.x, y: p.y - h });
  const ttl = up(ftl), ttr = up(ftr), tbr = up(fbr), tbl = up(fbl);

  ctx.globalAlpha = alpha;
  poly(ctx, [ttr, tbr, fbr, ftr], C.blockRight);
  poly(ctx, [tbl, tbr, fbr, fbl], C.blockLeft);
  poly(ctx, [ttl, ttr, tbr, tbl], C.blockTop);
  // top-edge highlight
  ctx.beginPath(); ctx.moveTo(ttl.x, ttl.y); ctx.lineTo(ttr.x, ttr.y);
  ctx.strokeStyle = `rgba(255,255,255,${0.25 * alpha})`; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.globalAlpha = 1;
}

function dims(block) {
  return {
    w: block.type === 'X' ? 2 : 1,
    d: block.type === 'Y' ? 2 : 1,
    h: block.type === 'U' ? BUH * 2 : BUH,
  };
}

// ─── 3D rotating block renderer ─────────────────────────────────────────────
// Rotates block vertices around the pivot edge, projects to isometric, draws visible faces.
function drawBlockRotating(ctx, from, dir, theta, sinkY, alpha) {
  const ox = ctx._ox, oy = ctx._oy;
  // Block dims in grid units (height in block-units: U=2, flat=1)
  const w = from.type === 'X' ? 2 : 1;
  const d = from.type === 'Y' ? 2 : 1;
  const h = from.type === 'U' ? 2 : 1;
  const fx = from.x, fy = from.y;

  // 8 vertices in world coords: [x, y, z]
  const V = [
    [fx, fy, 0], [fx+w, fy, 0], [fx+w, fy+d, 0], [fx, fy+d, 0],
    [fx, fy, h], [fx+w, fy, h], [fx+w, fy+d, h], [fx, fy+d, h],
  ];

  // Rotate around the pivot edge
  const isX = dir === 'left' || dir === 'right';
  const isPos = dir === 'right' || dir === 'down';
  const ang = isPos ? theta : -theta;
  const ca = Math.cos(ang), sa = Math.sin(ang);

  if (isX) {
    const px = isPos ? fx + w : fx;
    for (const v of V) {
      const dx = v[0] - px, dz = v[2];
      v[0] = px + dx * ca + dz * sa;
      v[2] = -dx * sa + dz * ca;
    }
  } else {
    const py = isPos ? fy + d : fy;
    for (const v of V) {
      const dy = v[1] - py, dz = v[2];
      v[1] = py + dy * ca + dz * sa;
      v[2] = -dy * sa + dz * ca;
    }
  }

  // Project to isometric screen coords (z in block-units → pixels via BUH)
  const P = V.map(([vx, vy, vz]) => ({
    x: ox + (vx - vy) * TW / 2,
    y: oy + (vx + vy) * TH / 2 - vz * BUH + sinkY,
  }));

  // 6 faces: [vertex indices, outward normal before rotation]
  const defs = [
    [[4,5,6,7], [0,0,1]],    // top
    [[0,3,2,1], [0,0,-1]],   // bottom
    [[1,2,6,5], [1,0,0]],    // east
    [[0,4,7,3], [-1,0,0]],   // west
    [[3,7,6,2], [0,1,0]],    // south
    [[0,1,5,4], [0,-1,0]],   // north
  ];

  // Rotate normals, test visibility, assign colors by lighting direction
  const vis = [];
  for (const [vi, n] of defs) {
    let nx = n[0], ny = n[1], nz = n[2];
    if (isX) {
      const rx = nx * ca + nz * sa, rz = -nx * sa + nz * ca;
      nx = rx; nz = rz;
    } else {
      const ry = ny * ca + nz * sa, rz = -ny * sa + nz * ca;
      ny = ry; nz = rz;
    }
    // Face visible if normal points toward camera at (1,1,1)
    if (nx + ny + nz <= 0.01) continue;

    const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    const color = az >= ax && az >= ay ? C.blockTop
               : ax >= ay             ? C.blockRight
               :                        C.blockLeft;
    const depth = vi.reduce((s, i) => s + V[i][0] + V[i][1] + V[i][2], 0);
    vis.push({ vi, color, depth });
  }

  // Painter's algorithm: draw furthest from camera first
  vis.sort((a, b) => a.depth - b.depth);

  ctx.globalAlpha = alpha;
  for (const f of vis) poly(ctx, f.vi.map(i => P[i]), f.color);

  // Top-edge highlight on the most upward-facing face
  const topFace = vis.find(f => f.color === C.blockTop);
  if (topFace) {
    const pts = topFace.vi.map(i => P[i]);
    let best = 0, bestY = Infinity;
    for (let i = 0; i < 4; i++) {
      const my = (pts[i].y + pts[(i+1)%4].y) / 2;
      if (my < bestY) { bestY = my; best = i; }
    }
    ctx.beginPath();
    ctx.moveTo(pts[best].x, pts[best].y);
    ctx.lineTo(pts[(best+1)%4].x, pts[(best+1)%4].y);
    ctx.strokeStyle = `rgba(255,255,255,${0.25 * alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function setupCanvas(canvas, grid) {
  const { minCR, maxCR, minCP, maxCP } = _bounds;
  const W = (maxCR - minCR + 2) * TW / 2 + PAD * 2;
  const H = (maxCP - minCP + 2) * TH / 2 + TD + BUH * 2 + PAD * 2;
  const wPx = Math.round(W * DPR), hPx = Math.round(H * DPR);
  if (canvas.width !== wPx || canvas.height !== hPx) {
    canvas.width = wPx; canvas.height = hPx;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const ox = PAD - (minCR - 1) * TW / 2;
  const oy = PAD + BUH * 2 - (minCP - 1) * TH / 2;
  ctx._ox = ox; ctx._oy = oy;
  return ctx;
}

function drawAllTiles(ctx, grid) {
  const rows = grid.length, cols = grid[0].length;
  const tiles = [];
  for (let ry = 0; ry < rows; ry++)
    for (let cx = 0; cx < cols; cx++)
      if (grid[ry][cx] !== 0) tiles.push({ col: cx, row: ry, cell: grid[ry][cx], key: cx + ry });
  tiles.sort((a, b) => a.key - b.key);
  return tiles;
}

// Static scene (no animation)
function drawScene(canvas, state) {
  if (!canvas) return;
  const { grid } = LEVEL;
  const ctx = setupCanvas(canvas, grid);
  const tiles = drawAllTiles(ctx, grid);
  const { w, d, h } = dims(state.block);
  const cells = blockCells(state.block);
  const bKey = Math.max(...cells.map(([cx, cy]) => cx + cy));

  let drawn = false;
  for (const t of tiles) {
    if (!drawn && bKey < t.key) {
      drawBlockRaw(ctx, state.block.x, state.block.y, w, d, h, 0, 0, 1);
      drawn = true;
    }
    drawTile(ctx, t.col, t.row, t.cell, ctx._ox, ctx._oy);
  }
  if (!drawn) drawBlockRaw(ctx, state.block.x, state.block.y, w, d, h, 0, 0, 1);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Error404() {
  const canvasRef   = useRef(null);
  const shakeRef    = useRef(null);
  const animRef     = useRef({ active: false });
  const rafRef      = useRef(null);
  const btnUpRef    = useRef(null);
  const btnDownRef  = useRef(null);
  const btnLeftRef  = useRef(null);
  const btnRightRef = useRef(null);
  const btnResetRef = useRef(null);
  const [state, dispatch] = useReducer(reducer, INIT);
  const stateRef  = useRef(state);
  stateRef.current = state;
  const [countdown, setCountdown] = useState(3);

  // Draw static frame when state changes (skip if animation running)
  useEffect(() => {
    if (animRef.current.active) return;
    if (!state.fell) drawScene(canvasRef.current, state);
  }, [state]);

  // Cleanup rAF
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Auto-reset after fall
  useEffect(() => {
    if (!state.fell) return;
    const id = setTimeout(() => dispatch({ type: 'UNFALL' }), 250);
    return () => clearTimeout(id);
  }, [state.fell, state.fallCount]);

  // ── Animation engine (3D rotation) ────────────────────────────────────────
  const startAnim = useCallback((kind, from, to, dir) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const grid = LEVEL.grid;
    const a = { active: true, kind, from: { ...from }, to: { ...to }, dir, start: performance.now(), grid };
    animRef.current = a;

    // Helper: draw tiles + block interleaved by depth (painter's algorithm)
    const drawInterleaved = (ctx, tiles, bKey, drawBlockFn) => {
      let drawn = false;
      for (const t of tiles) {
        if (!drawn && bKey < t.key) {
          drawBlockFn();
          drawn = true;
        }
        drawTile(ctx, t.col, t.row, t.cell, ctx._ox, ctx._oy);
      }
      if (!drawn) drawBlockFn();
    };

    const tick = () => {
      if (!a.active) return;
      const elapsed = performance.now() - a.start;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = setupCanvas(canvas, a.grid);
      const tiles = drawAllTiles(ctx, a.grid);

      if (a.kind === 'move') {
        const t = Math.min(1, elapsed / MOVE_DUR);
        const theta = easeInOutQuad(t) * Math.PI / 2;
        const bKey = Math.max(
          ...blockCells(a.from).map(([cx,cy]) => cx+cy),
          ...blockCells(a.to).map(([cx,cy]) => cx+cy)
        );
        drawInterleaved(ctx, tiles, bKey, () => {
          drawBlockRotating(ctx, a.from, a.dir, theta, 0, 1);
        });
        if (t >= 1) { a.active = false; dispatch({ type: 'MOVE_DONE', block: a.to }); return; }
      } else {
        if (elapsed < FALL_ROLL) {
          // Phase 1: roll to the invalid position
          const t = elapsed / FALL_ROLL;
          const theta = easeInOutQuad(t) * Math.PI / 2;
          const bKey = Math.max(...blockCells(a.from).map(([cx,cy]) => cx+cy));
          drawInterleaved(ctx, tiles, bKey, () => {
            drawBlockRotating(ctx, a.from, a.dir, theta, 0, 1);
          });
        } else {
          // Phase 2: tumble off the far edge with gravity
          const tumbleT = Math.min(1, (elapsed - FALL_ROLL) / FALL_TUMBLE);
          const tumbleTheta = easeInQuad(tumbleT) * Math.PI * 0.75;
          const sinkY = easeInQuad(tumbleT) * 160;
          const fadeStart = 0.55;
          const alpha = tumbleT < fadeStart ? 1 : Math.max(0, 1 - (tumbleT - fadeStart) / (1 - fadeStart));
          // Left/up = falling away from camera → draw behind all tiles
          // Right/down = falling toward camera → interleave at depth
          if (a.dir === 'left' || a.dir === 'up') {
            drawBlockRotating(ctx, a.to, a.dir, tumbleTheta, sinkY, alpha);
            for (const t of tiles) drawTile(ctx, t.col, t.row, t.cell, ctx._ox, ctx._oy);
          } else {
            const bKey = Math.max(...blockCells(a.to).map(([cx,cy]) => cx+cy));
            drawInterleaved(ctx, tiles, bKey, () => {
              drawBlockRotating(ctx, a.to, a.dir, tumbleTheta, sinkY, alpha);
            });
          }
        }

        if (elapsed >= FALL_ROLL + FALL_TUMBLE) {
          a.active = false;
          const el = shakeRef.current;
          if (el) { el.classList.remove('e4-shake'); void el.offsetWidth; el.classList.add('e4-shake'); }
          dispatch({ type: 'FELL' });
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Move handler ──────────────────────────────────────────────────────────
  const handleMove = useCallback((dir) => {
    if (animRef.current.active) return;
    const s = stateRef.current;
    if (s.fell || s.won || s.gameover) return;
    const { grid } = LEVEL;
    const next = rollBlock(s.block, dir);
    startAnim(isValid(grid, next) ? 'move' : 'fall', s.block, next, dir);
  }, [startAnim]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const MAP = {
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right',
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
    };
    const DIR_BTN = {
      left: btnLeftRef, right: btnRightRef, up: btnUpRef, down: btnDownRef,
    };
    const pressBtn   = (ref) => ref.current?.classList.add('e4-db--pressed');
    const releaseBtn = (ref) => ref.current?.classList.remove('e4-db--pressed');

    const onKeyDown = (e) => {
      if (animRef.current.active) return;
      const s = stateRef.current;
      if (s.fell) return;
      if (s.won || s.gameover) { if (e.key === 'Enter') window.location.href = '/'; return; }
      if (e.key === 'r' || e.key === 'R') { pressBtn(btnResetRef); dispatch({ type: 'RESET' }); return; }
      const dir = MAP[e.key];
      if (!dir) return;
      if (e.key.startsWith('Arrow')) e.preventDefault();
      pressBtn(DIR_BTN[dir]);
      handleMove(dir);
    };
    const onKeyUp = (e) => {
      if (e.key === 'r' || e.key === 'R') { releaseBtn(btnResetRef); return; }
      const dir = MAP[e.key];
      if (dir) releaseBtn(DIR_BTN[dir]);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [handleMove]);

  // Countdown and redirect after win or gameover
  useEffect(() => {
    if (!state.won && !state.gameover) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); window.location.href = '/'; return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.won, state.gameover]);

  return (
    <div className="e4-root">
      <section className="e4-section">

        <div className={"extremes-wrapper-left"}>
          <div className={"extremes"}></div>
        </div>

        <div className="e4-middle">

          {/* ── LEFT ── */}
          <div className="e4-left">
            <div className="e4-sticky">

              {/* Title */}
              <div className="e4-title-box">
                PAGE NOT FOUND
                <span className="e4-counter">404</span>
              </div>

              {/* Description */}
              <div className="e4-third">
                <h4 className="e4-label-sm">ABOUT THIS PAGE</h4>
                <p className="e4-desc">
                  This URL doesn't exist. Roll the block onto the green tile to find your way home. Don't fall off the edge [ Idea by my bsf Isha ]
                </p>
              </div>

              {/* Metrics */}
              <div className="e4-metrics-row">
                <div className="e4-metric">
                  <p className="e4-label-sm">MOVES</p>
                  <Digit key={`m${state.moves}`} number={state.moves} isLoaded={true} />
                </div>
                <div className="e4-metric">
                  <p className="e4-label-sm">FALLS</p>
                  <Digit key={`f${state.fallCount}`} number={state.fallCount} isLoaded={true} />
                </div>
              </div>

              {/* Controls */}
              <div className="e4-controls-panel">
                <div className="e4-controls-info">
                  <h4 className="e4-label-sm">CONTROLS</h4>
                  <div className="e4-bullet-list">
                    <div className="e4-bullet-item">
                      <div className="e4-bullet-wrap"><img src="/star.svg" alt="" /></div>
                      <span className="e4-desc">WASD / Arrows</span>
                    </div>
                    <div className="e4-bullet-item">
                      <div className="e4-bullet-wrap"><img src="/star.svg" alt="" /></div>
                      <span className="e4-desc">R — Reset</span>
                    </div>
                  </div>
                </div>
                <div className="e4-dpad-wrap">
                  <div className="e4-dpad">
                    <div className="e4-drow">
                      <div className="e4-db-empty" />
                      <button ref={btnUpRef} className="e4-db" onClick={() => handleMove('up')}><ArrowUp /></button>
                      <div className="e4-db-empty" />
                    </div>
                    <div className="e4-drow">
                      <button ref={btnLeftRef} className="e4-db" onClick={() => handleMove('left')}><ArrowLeft /></button>
                      <button ref={btnResetRef} className="e4-db e4-db-r" onClick={() => dispatch({ type: 'RESET' })}>
                        <img src="/R.svg" alt="R" width="22" height="22" />
                      </button>
                      <button ref={btnRightRef} className="e4-db" onClick={() => handleMove('right')}><ArrowRight /></button>
                    </div>
                    <div className="e4-drow">
                      <div className="e4-db-empty" />
                      <button ref={btnDownRef} className="e4-db" onClick={() => handleMove('down')}><ArrowDown /></button>
                      <div className="e4-db-empty" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="e4-rounder">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M0 0H9C4.02944 0 3.22128e-07 4.02944 0 9V0Z" fill="var(--off-teal)" />
                </svg>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M9 0H0C4.97056 0 9 4.02944 9 9V0Z" fill="var(--off-teal)" />
                </svg>
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="e4-right">
            <div className="e4-content-wrapper">
              <div className="e4-content-block">
                <div ref={shakeRef} className="e4-board-outer">
                  <canvas ref={canvasRef} className="e4-canvas" />
                  {state.won && (
                    <div className="e4-overlay">
                      <div className="e4-ol-title">{getWinMessage(state.moves, state.fallCount)}</div>
                      <div className="e4-ol-stats">{state.moves} moves · {state.fallCount} {state.fallCount === 1 ? 'fall' : 'falls'} · best {MIN_MOVES}</div>
                      <div className="e4-ol-sub">Redirecting in {countdown}s</div>
                    </div>
                  )}
                  {state.gameover && (
                    <div className="e4-overlay">
                      <div className="e4-ol-title">Absolute chaos, so I'll let you pass.</div>
                      <div className="e4-ol-stats">{state.fallCount} {state.fallCount === 1 ? 'fall' : 'falls'} · {state.moves} moves</div>
                      <div className="e4-ol-sub">Redirecting in {countdown}s</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className={"extremes-wrapper-right"}>
          <div className={"extremes"}></div>
        </div>
        
      </section>
    </div>
  );
}
