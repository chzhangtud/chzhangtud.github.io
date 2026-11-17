import { plot, curve, dot, legend, samples, element, mountFigure, BLUE, OCHRE, GRAY, normalPdf } from './statistics-foundations.mjs';
import { figurePanels } from './figure-layout.mjs';

// These closed-form models are deliberately separate from any learned model.
export function noiseSchedule(t) { return Math.exp(-10 * t); }
export function normals(count, seed = 47) {
  let state = seed >>> 0;
  const uniform = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296;
  };
  return Array.from({ length: count }, () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform()));
}
// Surface samples of six boxes: a procedural teaching input, not ShapeNet data.
export function chairPoints(count = 768) {
  const boxes = [
    { center: [0, 0, 0], size: [1.8, 0.18, 1.6] },
    { center: [0, 0.85, 0.72], size: [1.8, 1.6, 0.16] },
    ...[-0.72, 0.72].flatMap(x => [-0.6, 0.6].map(z =>
      ({ center: [x, -0.7, z], size: [0.16, 1.4, 0.16] }))),
  ];
  const faces = boxes.flatMap(box => [0, 1, 2].flatMap(axis => [-1, 1].map(sign => ({
    ...box, axis, sign, area: box.size[(axis + 1) % 3] * box.size[(axis + 2) % 3],
  }))));
  const total = faces.reduce((sum, face) => sum + face.area, 0);
  let seed = 83;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296; };
  return Array.from({ length: count }, () => {
    let remaining = random() * total;
    const face = faces.find(f => (remaining -= f.area) <= 0) || faces.at(-1);
    return face.center.map((v, k) => v + face.size[k] * (k === face.axis ? face.sign / 2 : random() - 0.5));
  });
}

export function chairState(t, flow = false) {
  const clean = chairPoints();
  const noise = normals(clean.length * 3);
  const a = flow ? t : Math.sqrt(noiseSchedule(t));
  const b = flow ? 1 - t : Math.sqrt(1 - noiseSchedule(t));
  return { clean, current: clean.map((p, i) => p.map((v, k) => a * v + b * noise[3 * i + k])), a, b };
}

export function mixture(x, sigma) {
  const variance = 0.25 ** 2 + sigma ** 2;
  const logs = [-2, 2].map(m => -((x - m) ** 2) / (2 * variance));
  const peak = Math.max(...logs);
  const weights = logs.map(l => Math.exp(l - peak));
  const sum = weights[0] + weights[1];
  const mean = (-2 * weights[0] + 2 * weights[1]) / sum;
  return { density: (normalPdf(x, -2, Math.sqrt(variance)) + normalPdf(x, 2, Math.sqrt(variance))) / 2,
    score: (mean - x) / variance, weights: weights.map(w => w / sum) };
}
export function posterior(y, sigma) {
  const variance = 1 / (1 / 0.25 ** 2 + 1 / sigma ** 2);
  const means = [-2, 2].map(m => variance * (m / 0.25 ** 2 + y / sigma ** 2));
  const weights = mixture(y, sigma).weights;
  return { means, weights, variance, mean: means.reduce((v, m, i) => v + m * weights[i], 0),
    density: x => means.reduce((v, m, i) => v + weights[i] * normalPdf(x, m, Math.sqrt(variance)), 0) };
}
export function marginalFlow(t, x) {
  const variance = (1 - t) ** 2 + (0.25 * t) ** 2;
  const covariance = t * 0.25 ** 2 - (1 - t);
  const logits = [-2, 2].map(m => -((x - t * m) ** 2) / (2 * variance));
  const max = Math.max(...logits);
  const weights = logits.map(l => Math.exp(l - max));
  const sum = weights[0] + weights[1];
  const velocity = [-2, 2].reduce((v, m, i) => v + weights[i] / sum * (m + covariance / variance * (x - t * m)), 0);
  const density = [-2, 2].reduce((p, m) => p + normalPdf(x, t * m, Math.sqrt(variance)) / 2, 0);
  return { velocity, density };
}
export function integrate(field, initial, steps, method = 'heun', end = 1) {
  const result = [[0, ...initial]];
  let x = [...initial];
  const h = end / steps;
  for (let i = 0; i < steps; i++) {
    const a = field(i * h, x);
    const predicted = x.map((v, k) => v + h * a[k]);
    if (method === 'heun') {
      const b = field((i + 1) * h, predicted);
      x = x.map((v, k) => v + h * (a[k] + b[k]) / 2);
    } else x = predicted;
    result.push([(i + 1) * h, ...x]);
  }
  return result;
}
export function warp([x, y], a) { return [x, Math.exp(a * x) * y + 0.4 * Math.sin(2 * x)]; }
export function chamferSquared(a, b) {
  const oneWay = (left, right) => left.reduce((sum, p) => sum + Math.min(...right.map(q => p.reduce((d, v, i) => d + (v - q[i]) ** 2, 0))), 0) / left.length;
  return oneWay(a, b) + oneWay(b, a);
}
export function correspondence(t, shuffled = false) {
  // Multiplication by 17 permutes 64 indices; no changing random draws on input.
  return Array.from({ length: 64 }, (_, i) => {
    const start = 2 * Math.PI * i / 64;
    const end = 2 * Math.PI * (shuffled ? (17 * i + 11) % 64 : i) / 64;
    return [(1 - t) * Math.cos(start) + t * 1.6 * Math.cos(end),
      (1 - t) * Math.sin(start) + t * 0.65 * Math.sin(end)];
  });
}

const ui = {
  zh: { original: '原始数据', noisy: '带噪数据', density: '概率密度', score: 'Score', posterior: '真实后验', mean: '后验均值',
    exact: '解析轨迹', euler: 'Euler', heun: 'Heun', source: '源网格', warped: '变换后网格',
    paths: '轨迹：纵轴为样本值 x', marginal: '边缘概率密度', conditional: '条件直线', flow: '边缘流轨迹',
    aligned: '按角度对应', shuffled: '打乱对应', target: '目标椭圆', samples: '插值点',
    failed: '图表数据未能加载。请刷新页面；正文和公式仍可直接阅读。',
    mnist: '真实二值 MNIST 测试图像', noise: '前向加噪结果', time: '时间 t',
    area: '局部面积倍率', inverse: '局部密度倍率', endpoint: '终点误差',
    axisU: '投影坐标 u', axisV: '投影坐标 v', chair: '教学椅子', interpolation: '训练插值',
  },
  en: { original: 'Original data', noisy: 'Noisy data', density: 'Density', score: 'Score', posterior: 'Exact posterior', mean: 'Posterior mean',
    exact: 'Exact path', euler: 'Euler', heun: 'Heun', source: 'Source grid', warped: 'Warped grid',
    paths: 'Paths: sample value x on vertical axis', marginal: 'Marginal density', conditional: 'Conditional straight paths', flow: 'Marginal flow paths',
    aligned: 'Angular correspondence', shuffled: 'Shuffled correspondence', target: 'Target ellipse', samples: 'Interpolated points',
    failed: 'Figure data could not be loaded. Refresh the page; the text and equations remain readable.',
    mnist: 'Real binarized MNIST test input', noise: 'Forward corruption', time: 'Time t',
    area: 'Local area multiplier', inverse: 'Local density multiplier', endpoint: 'Endpoint error',
    axisU: 'Projected coordinate u', axisV: 'Projected coordinate v', chair: 'Teaching chair', interpolation: 'Training interpolation',
  },
};
const loaded = new WeakMap();
const f = x => x.toFixed(3);
const axes = { xmin: -3, xmax: 3, ymin: -3, ymax: 3, xlabel: 'x', ylabel: 'y', square: true };

function points(chart, values, color, radius = 1.8) {
  for (const [x, y] of values) chart.marks.append(element('circle', { cx: chart.sx(x), cy: chart.sy(y), r: radius, fill: color, opacity: 0.65 }));
}
function imagePanel(panel, values, title) {
  const wrap = document.createElement('div'); wrap.className = 'generative-image';
  const caption = document.createElement('p'); caption.textContent = title;
  const canvas = document.createElement('canvas'); canvas.width = 28; canvas.height = 28;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', title);
  const context = canvas.getContext('2d'); const pixels = context.createImageData(28, 28);
  values.forEach((x, i) => {
    const gray = Math.round(255 * Math.max(0, Math.min(1, (x + 1) / 2)));
    pixels.data.set([gray, gray, gray, 255], 4 * i);
  });
  context.putImageData(pixels, 0, 0); wrap.append(caption, canvas); panel.append(wrap);
}
function draw(root) {
  const l = ui[root.dataset.lang] || ui.en;
  const state = {};
  root.querySelectorAll('[data-param]').forEach(control => {
    state[control.dataset.param] = Number(control.value);
    root.querySelector(`[data-value="${control.dataset.param}"]`).value = control.value;
  });
  const kind = root.dataset.generative;
  const readout = root.querySelector('.statistics-figure__readout');
  if (kind === 'mnist') {
    const data = loaded.get(root); const [left, right] = figurePanels(root, [l.original, l.noisy]);
    const clean = Array.from(data.images[state.digit], Number).map(v => 2 * v - 1);
    const alpha = noiseSchedule(state.t); const epsilon = normals(784, 47 + state.digit);
    const noisy = clean.map((x, i) => Math.sqrt(alpha) * x + Math.sqrt(1 - alpha) * epsilon[i]);
    imagePanel(left, clean, `${l.mnist} (${data.labels[state.digit]})`);
    imagePanel(right, noisy, `${l.noise}: t=${f(state.t)}`);
    readout.textContent = `√ᾱ = ${f(Math.sqrt(alpha))} · √(1−ᾱ) = ${f(Math.sqrt(1 - alpha))} · SNR = ${alpha === 1 ? '∞' : f(alpha / (1 - alpha))}`;
    legend(root, []);
  } else if (kind === 'chair' || kind === 'chair-flow') {
    const flow = kind === 'chair-flow';
    const data = chairState(state.t, flow);
    const panels = figurePanels(root, [l.chair, flow ? l.interpolation : l.noisy]);
    const angle = state.angle * Math.PI / 180;
    panels.forEach((panel, index) => {
      const chart = plot(panel, { ...axes, xmin: -3, xmax: 3, ymin: -3, ymax: 3, xlabel: l.axisU, ylabel: l.axisV });
      const projected = (index ? data.current : data.clean).map(([x, y, z]) => {
        const depth = -x * Math.sin(angle) + z * Math.cos(angle);
        return [x * Math.cos(angle) + z * Math.sin(angle), 0.94 * y - 0.34 * depth];
      });
      points(chart, projected, index ? OCHRE : BLUE, 1.5);
    });
    legend(root, [[l.chair, BLUE], [flow ? l.interpolation : l.noisy, OCHRE]]);
    readout.textContent = `t=${f(state.t)} · a=${f(data.a)} · b=${f(data.b)} · N=${data.clean.length} · ${state.angle}°`;
  } else if (kind === 'posterior') {
    const [panel] = figurePanels(root, [l.posterior]); const p = posterior(state.y, state.sigma);
    const chart = plot(panel, { xmin: -4, xmax: 4, ymax: 2.4, xlabel: 'x₀', ylabel: l.density });
    curve(chart, samples(p.density, -4, 4), BLUE);
    curve(chart, [[p.mean, 0], [p.mean, 1.9]], OCHRE, true);
    legend(root, [[l.posterior, BLUE], [l.mean, OCHRE, true]]);
    readout.textContent = `σ=${f(state.sigma)} · P(−)=${f(p.weights[0])} · P(+)=${f(p.weights[1])} · E[X₀|y]=${f(p.mean)}`;
  } else if (kind === 'sampler') {
    const [panel] = figurePanels(root, [l.paths]);
    const chart = plot(panel, { ...axes, xmin: -0.3, xmax: 1.9, ymin: -0.3, ymax: 1.9 });
    const field = (t, [x, y]) => [-Math.PI * y / 2, Math.PI * x / 2];
    const paths = ['euler', 'heun'].map(method => integrate(field, [1, 0], state.steps, method));
    curve(chart, samples(t => Math.sin(t), 0, Math.PI / 2).map(([t, y]) => [Math.cos(t), y]), GRAY, true);
    paths.forEach((path, i) => { curve(chart, path.map(v => v.slice(1)), [BLUE, OCHRE][i]); dot(chart, ...path.at(-1).slice(1), [BLUE, OCHRE][i]); });
    const errors = paths.map(path => Math.hypot(path.at(-1)[1], path.at(-1)[2] - 1));
    readout.textContent = `${l.endpoint}: Euler ${f(errors[0])}, Heun ${f(errors[1])} · NFE: ${state.steps}, ${2 * state.steps}`;
    legend(root, [[l.euler, BLUE], [l.heun, OCHRE], [l.exact, GRAY, true]]);
  } else if (kind === 'score') {
    const panels = figurePanels(root, [l.density, l.score]);
    const density = plot(panels[0], { xmin: -5, xmax: 5, ymax: 0.85, xlabel: 'x', ylabel: l.density });
    const score = plot(panels[1], { xmin: -5, xmax: 5, ymin: -12, ymax: 12, xlabel: 'x', ylabel: l.score });
    curve(density, samples(x => mixture(x, state.sigma).density, -5, 5), BLUE);
    curve(score, samples(x => mixture(x, state.sigma).score, -5, 5), OCHRE);
    curve(score, [[-5, 0], [5, 0]], GRAY, true);
    legend(root, [[l.density, BLUE], [l.score, OCHRE]], [[[l.density, BLUE]], [[l.score, OCHRE]]]);
    readout.textContent = `σ=${f(state.sigma)} · s(0)=${f(mixture(0, state.sigma).score)} · s(1)=${f(mixture(1, state.sigma).score)}`;
  } else if (kind === 'jacobian') {
    const panels = figurePanels(root, [l.source, l.warped]);
    panels.forEach((panel, index) => {
      const chart = plot(panel, { ...axes, xmin: -1.4, xmax: 1.4, ymin: -2.8, ymax: 2.8, xlabel: index ? 'x' : 'z₁', ylabel: index ? 'y' : 'z₂', square: false });
      for (let i = 0; i <= 8; i++) {
        const at = -1 + i / 4;
        for (const horizontal of [false, true]) {
          const line = samples(v => at, -1, 1, 70).map(([v, fixed]) => horizontal ? [v, fixed] : [fixed, v]);
          curve(chart, index ? line.map(p => warp(p, state.a)) : line, i % 2 ? GRAY : BLUE);
        }
      }
    });
    legend(root, [[l.source, BLUE], [l.warped, GRAY]]);
    readout.textContent = `z₁=0.5 · ${l.area} = ${f(Math.exp(state.a * 0.5))} · ${l.inverse} = ${f(Math.exp(-state.a * 0.5))}`;
  } else if (kind === 'matching') {
    const panels = figurePanels(root, [l.paths, l.marginal]);
    const chart = plot(panels[0], { xmin: 0, xmax: 1, ymin: -3.5, ymax: 3.5, xlabel: l.time, ylabel: 'x' });
    for (let i = 0; i < 8; i++) {
      const start = normals(8, 19)[i]; const end = (i % 2 ? 2 : -2) + normals(8, 23)[i] * 0.25;
      curve(chart, [[0, start], [1, end]], GRAY, true);
    }
    for (let i = 0; i < 14; i++) {
      const start = -1.9 + i * 3.8 / 13;
      const path = integrate((t, [x]) => [marginalFlow(t, x).velocity], [start], 100);
      curve(chart, path.map(([t, x]) => [t, x]), BLUE);
    }
    curve(chart, [[state.t, -3.5], [state.t, 3.5]], OCHRE);
    const density = plot(panels[1], { xmin: -4, xmax: 4, ymax: 0.85, xlabel: 'x', ylabel: l.density });
    curve(density, samples(x => marginalFlow(state.t, x).density, -4, 4), BLUE);
    legend(root, [[l.conditional, GRAY, true], [l.flow, BLUE]], [[[l.conditional, GRAY, true], [l.flow, BLUE]], [[l.density, BLUE]]]);
    readout.textContent = `t=${f(state.t)} · v(t, x=0.6)=${f(marginalFlow(state.t, 0.6).velocity)}`;
  } else if (kind === 'bunny') {
    const data = loaded.get(root); const panels = figurePanels(root, [l.original, l.noisy]);
    const eps = normals(3 * data.points.length); const angle = state.angle * Math.PI / 180;
    panels.forEach((panel, index) => {
      const chart = plot(panel, { ...axes, xmin: -1.6, xmax: 1.6, ymin: -1.6, ymax: 1.6, xlabel: l.axisU, ylabel: l.axisV });
      const projected = data.points.map((p, i) => {
        const q = p.map((v, k) => v + (index ? state.sigma * eps[3 * i + k] : 0));
        return [q[0] * Math.cos(angle) + q[2] * Math.sin(angle), q[1]];
      });
      points(chart, projected, index ? OCHRE : BLUE, 1.2);
    });
    legend(root, [[l.original, BLUE], [l.noisy, OCHRE]]);
    readout.textContent = `1024 · σ=${f(state.sigma)} · ${state.angle}° · Stanford Computer Graphics Laboratory`;
  } else if (kind === 'correspondence') {
    const panels = figurePanels(root, [l.aligned, l.shuffled]);
    panels.forEach((panel, index) => {
      const chart = plot(panel, { ...axes, xmin: -1.9, xmax: 1.9, ymin: -1.9, ymax: 1.9 });
      curve(chart, samples(t => 0, 0, 2 * Math.PI, 90).map(([t]) => [1.6 * Math.cos(t), 0.65 * Math.sin(t)]), GRAY, true);
      points(chart, correspondence(state.t, !!index), index ? OCHRE : BLUE, 2.1);
    });
    legend(root, [[l.aligned, BLUE], [l.shuffled, OCHRE], [l.target, GRAY, true]]);
    readout.textContent = `t=${f(state.t)} · N=64`;
  }
  root.dataset.ready = 'true';
}

async function mount(root) {
  try {
    if (root.dataset.source) {
      const response = await fetch(root.dataset.source);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      loaded.set(root, await response.json());
    }
    mountFigure(root, draw);
  } catch (error) {
    root.dataset.ready = 'error';
    root.querySelector('.statistics-figure__readout').textContent = (ui[root.dataset.lang] || ui.en).failed;
    console.error('Generative figure:', error);
  }
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-generative]').forEach(mount);
