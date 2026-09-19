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
  const motionSeed = Math.random() * 20;

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

  // A smooth, non-repeating-looking signal assembled from unrelated frequencies.
  // The random seed varies each visit, while the sine blend prevents frame-to-frame jumps.
  function wander(time, seed) {
    const phase = seed + motionSeed;
    return (
      Math.sin(time * (0.53 + seed * 0.07) + phase * 2.1) * 0.52
      + Math.sin(time * (0.91 + seed * 0.03) + phase * 5.7) * 0.3
      + Math.sin(time * (1.37 - seed * 0.02) + phase * 8.3) * 0.18
    );
  }

  function fieldAt(x, y, time) {
    const scale = Math.min(width, height);
    const safeX = Math.min(scale * 0.28, width * 0.36);
    const safeY = Math.min(scale * 0.28, height * 0.36);
    const travelX = Math.max(0, width * 0.5 - safeX);
    const travelY = Math.max(0, height * 0.5 - safeY);
    const cx = width * 0.5 + wander(time, 0.7) * travelX;
    const cy = height * 0.5 + wander(time, 1.9) * travelY;

    const pulseA = 1 + wander(time, 3.1) * 0.24;
    const pulseB = 1 + wander(time, 4.3) * 0.3;
    const pulseC = 1 + wander(time, 5.6) * 0.34;

    const blobs = [
      [cx + wander(time, 2.2) * scale * 0.1,
        cy + wander(time, 2.8) * scale * 0.09, scale * 0.18 * pulseA, 0.96],
      [cx + wander(time, 6.2) * scale * 0.2,
        cy + wander(time, 7.4) * scale * 0.17, scale * 0.145 * pulseB, 0.82],
      [cx + wander(time, 8.7) * scale * 0.21,
        cy + wander(time, 9.3) * scale * 0.19, scale * 0.125 * pulseC, 0.74],
      [cx + wander(time, 10.8) * scale * 0.22,
        cy + wander(time, 12.1) * scale * 0.2, scale * 0.1 * (2 - pulseB), 0.58],
    ];

    let energy = 0;
    for (const [bx, by, radius, weight] of blobs) {
      const dx = x - bx;
      const dy = y - by;
      energy += (radius * radius * weight) / (dx * dx + dy * dy + radius * radius * 0.08);
    }

    const warpX = x + Math.sin(y * 0.009 + time * 1.1) * scale * 0.035;
    const warpY = y + Math.cos(x * 0.011 - time * 0.86) * scale * 0.03;
    const waves = Math.sin(warpX * 0.014 + time * 1.26)
      * Math.cos(warpY * 0.012 - time * 0.93);
    return smoothstep(0.54, 2.45, energy + waves * 0.13);
  }

  function draw(time) {
    const motionTime = time * 0.58;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);
    for (const point of points) {
      const intensity = fieldAt(point.x, point.y, motionTime);
      const shimmer = 0.5 + 0.5 * Math.sin(motionTime * 1.1 + point.phase);
      const radius = 0.8 + intensity * (spacing * 0.145) + intensity * shimmer * 0.08;
      const alpha = 0.4 + intensity * 0.4;
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
