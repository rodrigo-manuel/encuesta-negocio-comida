import { useEffect, useRef } from "react";

const COMIDAS = ["🍔", "🍕", "🌮", "🍖", "🦐", "🍗", "🍣", "🥙", "🍩", "🍜", "🌭", "🥗", "🍟", "🍤", "🥩", "🍰"];
const COLORES = ["#FFD166", "#FFFFFF", "#FF6B6B", "#4ECDC4", "#F9F871"];

export default function Fondo() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const puntero = { x: -9999, y: -9999 };
    let w = 0;
    let h = 0;
    let raf = 0;
    let items = [];
    let chispas = [];

    function crearItems() {
      const max = w < 640 ? 16 : 34;
      const cantidad = Math.max(10, Math.min(max, Math.round((w * h) / 42000)));
      items = Array.from({ length: cantidad }, (_, i) => ({
        e: COMIDAS[i % COMIDAS.length],
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.15 - Math.random() * 0.35,
        px: 0,
        py: 0,
        s: 24 + Math.random() * 34,
        r: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01,
        o: 0.35 + Math.random() * 0.4,
        f: Math.random() * Math.PI * 2,
      }));
    }

    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const anchoAnterior = w;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Solo se reinician las comidas si cambió el ancho (no cuando la barra del navegador sube o baja)
      if (w !== anchoAnterior) crearItems();
    }

    function chisparEn(x, y) {
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 1.5 + Math.random() * 4;
        chispas.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          vida: 1,
          c: COLORES[i % COLORES.length],
          s: 2 + Math.random() * 3.5,
        });
      }
      if (chispas.length > 220) chispas = chispas.slice(-220);
    }

    function dibujar(t) {
      ctx.clearRect(0, 0, w, h);

      for (const it of items) {
        if (!reducir) {
          const dx = it.x - puntero.x;
          const dy = it.y - puntero.y;
          const d = Math.hypot(dx, dy);
          if (d < 150 && d > 0) {
            const f = (150 - d) / 150;
            it.px += (dx / d) * f * 2.4;
            it.py += (dy / d) * f * 2.4;
          }
          it.px *= 0.92;
          it.py *= 0.92;
          it.x += it.vx + it.px + Math.sin(t / 900 + it.f) * 0.25;
          it.y += it.vy + it.py;
          it.r += it.vr;
          if (it.y < -60) {
            it.y = h + 60;
            it.x = Math.random() * w;
          }
          if (it.y > h + 80) it.y = -60;
          if (it.x < -60) it.x = w + 60;
          if (it.x > w + 60) it.x = -60;
        }
        ctx.save();
        ctx.globalAlpha = it.o;
        ctx.translate(it.x, it.y);
        ctx.rotate(it.r);
        ctx.font = `${it.s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.e, 0, 0);
        ctx.restore();
      }

      chispas = chispas.filter((c) => c.vida > 0);
      for (const c of chispas) {
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.08;
        c.vx *= 0.97;
        c.vida -= 0.022;
        ctx.globalAlpha = Math.max(c.vida, 0);
        ctx.fillStyle = c.c;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reducir) raf = requestAnimationFrame(dibujar);
    }

    const mover = (e) => {
      puntero.x = e.clientX;
      puntero.y = e.clientY;
    };
    const salir = () => {
      puntero.x = -9999;
      puntero.y = -9999;
    };
    const tocar = (e) => {
      if (reducir) return;
      mover(e);
      chisparEn(e.clientX, e.clientY);
    };
    const soltar = (e) => {
      if (e.pointerType !== "mouse") salir();
    };
    const redimensionar = () => {
      medir();
      if (reducir) dibujar(0);
    };
    const visibilidad = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reducir) raf = requestAnimationFrame(dibujar);
    };

    medir();
    if (reducir) dibujar(0);
    else raf = requestAnimationFrame(dibujar);

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerdown", tocar);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    window.addEventListener("resize", redimensionar);
    document.addEventListener("visibilitychange", visibilidad);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerdown", tocar);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      window.removeEventListener("resize", redimensionar);
      document.removeEventListener("visibilitychange", visibilidad);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none" />;
}