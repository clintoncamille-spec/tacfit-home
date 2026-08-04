// Tiny dependency-free canvas charts. Kept intentionally simple so the whole
// app stays offline with zero external libraries.

function drawLineChart(canvas, points, opts) {
  opts = opts || {};
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { l: 34, r: 12, t: 14, b: 22 };
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const styles = getComputedStyle(document.documentElement);
  const line = styles.getPropertyValue("--accent").trim() || "#3ddc84";
  const grid = styles.getPropertyValue("--border").trim() || "#333";
  const text = styles.getPropertyValue("--text-dim").trim() || "#888";

  if (!points.length) {
    ctx.fillStyle = text;
    ctx.font = "13px -apple-system, system-ui";
    ctx.fillText(opts.emptyText || "No data yet", pad.l, h / 2);
    return;
  }

  const ys = points.map((p) => p.y);
  let minY = opts.minY != null ? opts.minY : Math.min(...ys);
  let maxY = opts.maxY != null ? opts.maxY : Math.max(...ys);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const padY = (maxY - minY) * 0.1;
  if (opts.minY == null) minY -= padY;
  if (opts.maxY == null) maxY += padY;

  const xForI = (i) => pad.l + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yForV = (v) => pad.t + plotH - ((v - minY) / (maxY - minY)) * plotH;

  // gridlines
  ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const gy = pad.t + (plotH / 3) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w - pad.r, gy); ctx.stroke();
  }

  // line
  ctx.strokeStyle = line; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xForI(i), y = yForV(p.y);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // points
  ctx.fillStyle = line;
  points.forEach((p, i) => {
    const x = xForI(i), y = yForV(p.y);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  });

  // y-axis labels
  ctx.fillStyle = text; ctx.font = "11px -apple-system, system-ui";
  ctx.fillText(maxY.toFixed(1), 2, pad.t + 8);
  ctx.fillText(minY.toFixed(1), 2, pad.t + plotH);

  // x-axis first/last labels
  if (opts.xLabels) {
    ctx.fillText(opts.xLabels[0] || "", pad.l, h - 4);
    ctx.textAlign = "right";
    ctx.fillText(opts.xLabels[opts.xLabels.length - 1] || "", w - pad.r, h - 4);
    ctx.textAlign = "left";
  }
}

function drawBarChart(canvas, bars, opts) {
  opts = opts || {};
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { l: 8, r: 8, t: 14, b: 20 };
  const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#3ddc84";
  const text = styles.getPropertyValue("--text-dim").trim() || "#888";

  if (!bars.length) {
    ctx.fillStyle = text; ctx.font = "13px -apple-system, system-ui";
    ctx.fillText(opts.emptyText || "No data yet", pad.l, h / 2);
    return;
  }

  const maxV = opts.maxV || Math.max(...bars.map((b) => b.v), 1);
  const bw = (plotW / bars.length) * 0.6;
  const gap = (plotW / bars.length) * 0.4;

  bars.forEach((b, i) => {
    const x = pad.l + i * (bw + gap) + gap / 2;
    const bh = (b.v / maxV) * plotH;
    const y = pad.t + plotH - bh;
    ctx.fillStyle = b.color || accent;
    ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = text; ctx.font = "10px -apple-system, system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.label, x + bw / 2, h - 4);
    ctx.textAlign = "left";
  });
}
