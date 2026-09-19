(() => {
  const canvas = document.querySelector("#dot-field");
  const ctx = canvas.getContext("2d", { alpha: false });
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let spacing = 16;
  let points = [];
  let raf = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    spacing = width < 600 ? 13 : width < 1100 ? 15 : 17;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const columns = Math.ceil(width / spacing) + 2;
    const rows = Math.ceil(height / spacing) + 2;
    const offsetX = (width - (columns - 1) * spacing) / 2;
    const offsetY = (height - (rows - 1) * spacing) / 2;
    points = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        points.push({
          x: offsetX + column * spacing,
          y: offsetY + row * spacing,
          phase: Math.sin(column * 12.9898 + row * 78.233) * 43758.5453,
        });
      }
    }
    if (reducedMotion) draw(6.4);
  }

  function smoothstep(edge0, edge1, value) {
    const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return x * x * (3 - 2 * x);
  }

  function fieldAt(x, y, time) {
    const scale = Math.min(width, height);
    const cx = width * 0.5;
    const cy = height * 0.49;
    const orbitX = Math.cos(time * 0.43) * scale * 0.075;
    const orbitY = Math.sin(time * 0.52) * scale * 0.065;

    const blobs = [
      [cx + orbitX, cy + orbitY, scale * 0.22, 1.0],
      [cx - scale * 0.13 + Math.sin(time * 0.37) * scale * 0.055,
        cy + scale * 0.1 + Math.cos(time * 0.46) * scale * 0.06, scale * 0.18, 0.86],
      [cx + scale * 0.14 + Math.cos(time * 0.31) * scale * 0.05,
        cy - scale * 0.11 + Math.sin(time * 0.4) * scale * 0.05, scale * 0.15, 0.76],
    ];

    let energy = 0;
    for (const [bx, by, radius, weight] of blobs) {
      const dx = x - bx;
      const dy = y - by;
      energy += (radius * radius * weight) / (dx * dx + dy * dy + radius * radius * 0.08);
    }

    const wave = Math.sin(x * 0.012 + time * 0.8) * Math.cos(y * 0.014 - time * 0.6);
    return smoothstep(0.62, 2.7, energy + wave * 0.08);
  }

  function draw(time) {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);
    for (const point of points) {
      const intensity = fieldAt(point.x, point.y, time);
      const shimmer = 0.5 + 0.5 * Math.sin(time * 1.1 + point.phase);
      const radius = 0.72 + intensity * (spacing * 0.255) + intensity * shimmer * 0.2;
      const alpha = 0.3 + intensity * 0.66;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 247, 244, ${alpha})`;
      ctx.fill();
    }
  }

  function animate(milliseconds) {
    draw(milliseconds * 0.001);
    raf = requestAnimationFrame(animate);
  }

  addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reducedMotion) raf = requestAnimationFrame(animate);
  });

  resize();
  if (!reducedMotion) raf = requestAnimationFrame(animate);
})();
