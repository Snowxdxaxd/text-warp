import { useEffect, useRef } from "react";

// Резиновая типографика: контейнер с крупным текстом, каждый символ живёт
// на пружине. Курсор расталкивает буквы, клик — ударная волна, без мыши
// гуляет «призрак». Компонент встраивается в любой блок нужной высоты
// (props: phrases, rows, repel, radius, ghost, waves, breathe) и ставится
// на паузу, когда блок вне экрана.

const DEFAULT_PHRASES = [
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
const BASE = [245, 233, 216];
const ACCENT = [255, 205, 90];
const STEPS = 12;

const STIFFNESS = 0.085;
const DAMPING = 0.84;
const WAVE_SPEED = 1400;
const WAVE_WIDTH = 90;
const WAVE_KICK = 26;

const COLORS = Array.from({ length: STEPS + 1 }, (_, i) => {
  const t = i / STEPS;
  const c = BASE.map((v, k) => Math.round(v + (ACCENT[k] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
});

const font = (s) => `900 ${s}px Arial, "Segoe UI", sans-serif`;

export default function TextWarp({
  phrases = DEFAULT_PHRASES,
  rows = null,
  repel = 0.55,
  radius = null,
  ghost = true,
  waves = true,
  breathe = 3,
}) {
  const wrapRef = useRef(null);
  const cvRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    const ctx = cv.getContext("2d");
    let raf = 0;
    let glyphs = [];
    let waveList = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let visible = true;
    const mouse = { x: -1e4, y: -1e4, real: false };
    let smx = 0;
    let smy = 0;
    let smInit = false;
    const t0 = performance.now();

    function rebuild() {
      glyphs = [];
      const rowsN = rows ?? Math.max(3, Math.round(H / Math.max(48, Math.min(110, H / 7))));
      const step = H / rowsN;
      for (let r = 0; r < rowsN; r++) {
        const phrase = phrases[r % phrases.length];
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
            hx: x + cw / 2,
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
      W = Math.max(1, wrap.clientWidth);
      H = Math.max(1, wrap.clientHeight);
      cv.width = Math.max(1, Math.floor(W * dpr));
      cv.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      rebuild();
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
    }

    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(wrap);

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.real = true;
    };
    const onDown = (e) => {
      if (!waves) return;
      const rect = cv.getBoundingClientRect();
      waveList.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() });
    };
    window.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerdown", onDown);

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - t0) / 1000;
      const rect = cv.getBoundingClientRect();

      let mx;
      let my;
      if (!mouse.real && ghost) {
        mx = W / 2 + Math.sin(t * 0.7) * W * 0.3;
        my = H / 2 + Math.sin(t * 1.13 + 1.3) * H * 0.28;
      } else {
        mx = mouse.x - rect.left;
        my = mouse.y - rect.top;
      }
      if (!smInit) {
        smx = mx;
        smy = my;
        smInit = true;
      }
      smx += (mx - smx) * 0.25;
      smy += (my - smy) * 0.25;

      waveList = waveList.filter((w) => now - w.t < 1200);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const R = radius ?? Math.min(W, H) * 0.22;
      const R2 = R * R;

      for (const g of glyphs) {
        const wob = Math.sin(t * 1.4 + g.hx * 0.012 + g.row * 0.8);
        let tx = g.hx;
        let ty = g.hy + wob * breathe;

        const dx = tx - smx;
        const dy = ty - smy;
        const d2 = dx * dx + dy * dy;
        let prox = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          prox = 1 - d / R;
          const push = prox * prox * R * repel;
          tx += (dx / d) * push;
          ty += (dy / d) * push;
        }

        for (const w of waveList) {
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
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerdown", onDown);
    };
  }, [phrases, rows, repel, radius, ghost, waves, breathe]);

  return (
    <div ref={wrapRef} className="warpbox">
      <canvas ref={cvRef} />
    </div>
  );
}
