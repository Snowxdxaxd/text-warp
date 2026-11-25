import { useEffect, useRef } from "react";

// Резиновая типографика: экран из крупного текста, каждый символ на пружине.
// Текст изгибается вокруг курсора, по клику — ударная волна, без мыши курсор
// заменяет «призрак», чтобы страница жила сама по себе.

const PHRASES = [
  "ТЕКСТ ИЗГИБАЕТСЯ",
  "ВОКРУГ КУРСОРА",
  "ЖИВЫЕ ИНТЕРФЕЙСЫ",
  "SPRING PHYSICS",
  "БЕЗ КАРТИНОК",
  "ТОЛЬКО МАТЕМАТИКА",
  "REACT CANVAS",
  "ПОПРОБУЙ КЛИКНУТЬ",
];

const BG = "#0b0709";
const BASE = [245, 233, 216]; // обычный цвет текста
const ACCENT = [255, 205, 90]; // цвет у курсора
const STEPS = 12;

// настройка физики
const STIFFNESS = 0.085; // жёсткость пружины
const DAMPING = 0.84; // затухание
const REPEL = 0.55; // сила отталкивания (доля радиуса)
const WAVE_SPEED = 1400; // скорость ударной волны, px/с
const WAVE_WIDTH = 90; // толщина фронта, px
const WAVE_KICK = 26; // импульс волны

const COLORS = Array.from({ length: STEPS + 1 }, (_, i) => {
  const t = i / STEPS;
  const c = BASE.map((v, k) => Math.round(v + (ACCENT[k] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
});

const font = (s) => `900 ${s}px Arial, "Segoe UI", sans-serif`;

export default function TextWarp() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let raf = 0;
    let glyphs = [];
    let waves = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let t0 = performance.now();
    const mouse = { x: -1e4, y: -1e4, real: false };
    let smx = 0;
    let smy = 0;
    let smInit = false;

    function rebuild() {
      glyphs = [];
      const rows = Math.max(3, Math.round(H / Math.max(48, Math.min(110, H / 7))));
      const step = H / rows;
      for (let r = 0; r < rows; r++) {
        const phrase = PHRASES[r % PHRASES.length];
        ctx.font = font(step * 0.86);
        const m = ctx.measureText(phrase).width || 1;
        const size = step * 0.86 * Math.min((W * 0.94) / m, 1.5);
        ctx.font = font(size);
        const wpx = ctx.measureText(phrase).width;
        const y = step * (r + 0.5);
        let x = (W - wpx) / 2;
        for (const ch of phrase) {
          const cw = ctx.measureText(ch).width;
          glyphs.push({
            ch,
            size,
            row: r,
            hx: x + cw / 2, // «домашняя» точка
            hy: y,
            x: x + cw / 2,
            y,
            vx: 0,
            vy: 0,
          });
          x += cw;
        }
      }
    }

    function fit() {
      dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = Math.max(1, Math.floor(W * dpr));
      cv.height = Math.max(1, Math.floor(H * dpr));
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      rebuild();
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
    }

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.real = true;
    };
    const onDown = (e) => {
      waves.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    };

    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;

      // курсор: реальный или «призрак», пока мышь не двигали
      let mx = mouse.x;
      let my = mouse.y;
      if (!mouse.real) {
        mx = W / 2 + Math.sin(t * 0.7) * W * 0.3;
        my = H / 2 + Math.sin(t * 1.13 + 1.3) * H * 0.28;
      }
      if (!smInit) {
        smx = mx;
        smy = my;
        smInit = true;
      }
      smx += (mx - smx) * 0.25;
      smy += (my - smy) * 0.25;

      waves = waves.filter((w) => now - w.t < 1200);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const R = Math.min(W, H) * 0.22;
      const R2 = R * R;

      for (const g of glyphs) {
        // дом + лёгкое дыхание
        const wob = Math.sin(t * 1.4 + g.hx * 0.012 + g.row * 0.8);
        let tx = g.hx;
        let ty = g.hy + wob * 3;

        // отталкивание от курсора
        const dx = tx - smx;
        const dy = ty - smy;
        const d2 = dx * dx + dy * dy;
        let prox = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          prox = 1 - d / R;
          const push = prox * prox * R * REPEL;
          tx += (dx / d) * push;
          ty += (dy / d) * push;
        }

        // ударные волны от кликов
        for (const w of waves) {
          const age = (now - w.t) / 1000;
          const rr = age * WAVE_SPEED;
          const wx = g.hx - w.x;
          const wy = g.hy - w.y;
          const wd = Math.hypot(wx, wy) || 1;
          const band = Math.abs(wd - rr);
          if (band < WAVE_WIDTH) {
            const k = (1 - band / WAVE_WIDTH) * Math.exp(-age * 2.2);
            g.vx += (wx / wd) * k * WAVE_KICK;
            g.vy += (wy / wd) * k * WAVE_KICK;
          }
        }

        // пружина
        g.vx += (tx - g.x) * STIFFNESS;
        g.vy += (ty - g.y) * STIFFNESS;
        g.vx *= DAMPING;
        g.vy *= DAMPING;
        g.x += g.vx;
        g.y += g.vy;

        ctx.fillStyle = COLORS[Math.round(prox * STEPS)];
        ctx.font = font(g.size);
        const rot = Math.max(-0.3, Math.min(0.3, g.vx * 0.03));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(g.x, g.y);
        ctx.rotate(rot);
        ctx.fillText(g.ch, 0, 0);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ display: "block", position: "fixed", inset: 0, background: BG }}
    />
  );
}
