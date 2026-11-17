import { chartDimensions, figurePanels, initializeFigure } from './figure-layout.mjs';

// Small, deterministic probability calculations shared by the figures and tests.
export function binomialPmf(k, n, theta) {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  let choose = 1;
  for (let j = 1; j <= k; j += 1) choose *= (n - j + 1) / j;
  return choose * theta ** k * (1 - theta) ** (n - k);
}

export function poissonPmf(k, lambda) {
  if (k < 0 || !Number.isInteger(k)) return 0;
  let value = Math.exp(-lambda);
  for (let j = 1; j <= k; j += 1) value *= lambda / j;
  return value;
}

export function normalPdf(x, mu = 0, sigma = 1) {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}

export function normalCdf(x) {
  // Abramowitz–Stegun 7.1.26; absolute error of the erf approximation < 1.5e-7.
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}

export function normalInterval(a, b, mu, sigma) {
  return normalCdf((Math.max(a, b) - mu) / sigma) - normalCdf((Math.min(a, b) - mu) / sigma);
}

export function standardizedUniformPdf(z, n) {
  const scale = Math.sqrt(n / 12);
  let x = z * scale + n / 2;
  if (x < 0 || x > n) return 0;
  if (n === 1) return scale;
  // Irwin–Hall density. Symmetry keeps the alternating sum away from its
  // numerically unstable right tail. Figures deliberately limit n to 12.
  x = Math.min(x, n - x);
  let sum = 0;
  let choose = 1;
  let factorial = 1;
  for (let j = 2; j < n; j += 1) factorial *= j;
  for (let k = 0; k <= Math.floor(x); k += 1) {
    if (k > 0) choose *= (n - k + 1) / k;
    sum += (k % 2 === 0 ? 1 : -1) * choose * (x - k) ** (n - 1);
  }
  return Math.max(0, scale * sum / factorial);
}

export function gaussianConditional(rho, observed) {
  return { mean: rho * observed, variance: 1 - rho ** 2 };
}

const xlogx = (x) => x === 0 ? 0 : x * Math.log(x);
export const bernoulliEntropy = (p) => -xlogx(p) - xlogx(1 - p);
export function bernoulliCrossEntropy(p, q) {
  if (q === 0) return p === 0 ? 0 : Infinity;
  if (q === 1) return p === 1 ? 0 : Infinity;
  return -p * Math.log(q) - (1 - p) * Math.log1p(-q);
}
export const bernoulliKl = (p, q) => bernoulliCrossEntropy(p, q) - bernoulliEntropy(p);

export function animationValue(kind, elapsedMs, initial) {
  if (kind === 'clt') return 1 + (initial - 1 + Math.floor(elapsedMs / 1800)) % 12;
  const phase = Math.asin(Math.max(-1, Math.min(1, initial / 0.9)));
  return Number((0.9 * Math.sin(elapsedMs / 3200 + phase)).toFixed(2));
}

const BLUE = '#3e6683';
const OCHRE = '#a16c37';
const GRAY = '#70736e';
const RULE = '#d8d7d2';
const SVG_NS = 'http://www.w3.org/2000/svg';
let figureSequence = 0;
const labels = {
  zh: {
    mass: '概率 P(X=k)', density: '概率密度', value: '取值', standardized: '标准化后的 z',
    probability: '真实概率 p', nats: '信息量 / nat', mean: '均值', variance: '方差',
    plotted: '绘图区累计概率', area: '区间概率', peak: '峰值密度',
    exact: '标准化均匀和的密度', normal: '标准正态密度', marginal: '边缘密度 p(X)',
    conditional: '条件密度 p(X | Y=y)', contour: '等密度线', observation: '观测切片 Y=y',
    conditionalMean: '条件均值', conditionalVariance: '条件方差',
    entropy: '熵 H(p)', crossEntropy: '交叉熵 H(p,q)', kl: 'KL(p ‖ q)',
    reverseKl: 'KL(q ‖ p)', sdSum: '原始和的标准差',
    play: '播放动画', pause: '暂停动画',
  },
  en: {
    mass: 'Probability P(X=k)', density: 'Probability density', value: 'Value', standardized: 'Standardized z',
    probability: 'True probability p', nats: 'Information / nat', mean: 'Mean', variance: 'Variance',
    plotted: 'Probability in plot', area: 'Interval probability', peak: 'Peak density',
    exact: 'Standardized uniform-sum density', normal: 'Standard normal density', marginal: 'Marginal p(X)',
    conditional: 'Conditional p(X | Y=y)', contour: 'Density contours', observation: 'Observed slice Y=y',
    conditionalMean: 'Conditional mean', conditionalVariance: 'Conditional variance',
    entropy: 'Entropy H(p)', crossEntropy: 'Cross-entropy H(p,q)', kl: 'KL(p ‖ q)',
    reverseKl: 'KL(q ‖ p)', sdSum: 'Unstandardized sum SD',
    play: 'Play animation', pause: 'Pause animation',
  },
};

function element(name, attrs = {}, text = null) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== null) node.textContent = text;
  return node;
}

function plot(container, { xmin, xmax, ymin = 0, ymax, xlabel, ylabel, square = false }) {
  const geometry = chartDimensions(container);
  const { width, height, top, bottom } = geometry;
  let { left, right } = geometry;
  if (square) {
    const side = Math.min(right - left, bottom - top);
    left = (width - side) / 2;
    right = left + side;
  }
  const sx = (x) => left + (x - xmin) / (xmax - xmin) * (right - left);
  const sy = (y) => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  const svg = element('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `${ylabel}; ${xlabel}` });
  svg.append(element('title', {}, `${ylabel}; ${xlabel}`));
  const clipId = `statistics-clip-${figureSequence++}`;
  const clip = element('clipPath', { id: clipId });
  clip.append(element('rect', { x: left, y: top, width: right - left, height: bottom - top }));
  const defs = element('defs');
  defs.append(clip);
  svg.append(defs);
  for (let j = 0; j <= 4; j += 1) {
    const y = ymin + (ymax - ymin) * j / 4;
    svg.append(element('line', { x1: left, x2: right, y1: sy(y), y2: sy(y), stroke: RULE }));
    svg.append(element('text', { x: left - 8, y: sy(y) + 4, 'text-anchor': 'end' }, number(y)));
    const x = xmin + (xmax - xmin) * j / 4;
    svg.append(element('line', { x1: sx(x), x2: sx(x), y1: bottom, y2: bottom + 5, stroke: GRAY }));
    svg.append(element('text', { x: sx(x), y: bottom + 21, 'text-anchor': 'middle' }, number(x)));
  }
  svg.append(element('path', { d: `M${left},${top}V${bottom}H${right}`, fill: 'none', stroke: GRAY }));
  svg.append(element('text', { x: left, y: 18 }, ylabel));
  svg.append(element('text', { x: right, y: height - 8, 'text-anchor': 'end' }, xlabel));
  const marks = element('g', { 'clip-path': `url(#${clipId})` });
  svg.append(marks);
  container.append(svg);
  return { svg, marks, sx, sy, xmin, xmax, ymin, ymax };
}

const number = (value) => Math.abs(value) < 1e-9 ? '0' : Number(value.toPrecision(3)).toString();
const fixed = (value) => Number.isFinite(value) ? value.toFixed(4) : '∞';
const samples = (fn, min, max, count = 400) => Array.from({ length: count + 1 }, (_, i) => {
  const x = min + (max - min) * i / count;
  return [x, fn(x)];
});
function curve(chart, points, color, dashed = false) {
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${chart.sx(x)},${chart.sy(y)}`).join('');
  chart.marks.append(element('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.2,
    ...(dashed ? { 'stroke-dasharray': '6 4' } : {}) }));
}
function dot(chart, x, y, color) {
  const node = element('circle', { cx: chart.sx(x), cy: chart.sy(y), r: 4.5, fill: color, stroke: '#f5f4f0', 'stroke-width': 1.5 });
  node.append(element('title', {}, `(${number(x)}, ${number(y)})`));
  chart.marks.append(node);
}
const legendStates = new WeakMap();
function paintLegend(root) {
  const state = legendStates.get(root);
  const items = root.dataset.figureMode === 'tabs' && state.views
    ? state.views[Number(root.dataset.figureView)] : state.items;
  const target = root.querySelector('.statistics-figure__legend');
  target.replaceChildren();
  for (const [text, color, dashed] of items) {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.setProperty('--swatch', color);
    if (dashed) span.className = 'is-dashed';
    target.append(span);
  }
}

function legend(root, items, views = null) {
  if (!legendStates.has(root)) root.addEventListener('figureviewchange', () => paintLegend(root));
  legendStates.set(root, { items, views });
  paintLegend(root);
}

function render(root) {
  const ui = labels[root.dataset.lang] || labels.en;
  const state = {};
  root.querySelectorAll('[data-param]').forEach((control) => {
    state[control.dataset.param] = control.tagName === 'SELECT' ? control.value : Number(control.value);
    const output = root.querySelector(`[data-value="${control.dataset.param}"]`);
    if (output) output.value = control.value;
  });
  const panels = figurePanels(root, root.dataset.statistics === 'conditional'
    ? (root.dataset.lang === 'zh' ? ['联合分布', '条件密度'] : ['Joint distribution', 'Conditional density'])
    : [ui.density]);
  const target = panels[0];
  const readout = root.querySelector('.statistics-figure__readout');
  switch (root.dataset.statistics) {
    case 'discrete': {
      const isPoisson = state.distribution === 'poisson';
      root.querySelector('[data-control="n"]').hidden = state.distribution !== 'binomial';
      root.querySelector('[data-control="theta"]').hidden = isPoisson;
      root.querySelector('[data-control="lambda"]').hidden = !isPoisson;
      const n = state.distribution === 'bernoulli' ? 1 : state.n;
      const max = isPoisson ? Math.ceil(state.lambda + 6 * Math.sqrt(state.lambda) + 8) : n;
      const values = Array.from({ length: max + 1 }, (_, k) => [k, isPoisson ? poissonPmf(k, state.lambda) : binomialPmf(k, n, state.theta)]);
      const chart = plot(target, { xmin: -0.5, xmax: max + 0.5, ymax: Math.max(...values.map((v) => v[1])) * 1.2, xlabel: 'k', ylabel: ui.mass });
      values.forEach(([k, mass]) => {
        const bar = element('rect', { x: chart.sx(k - 0.35), y: chart.sy(mass), width: chart.sx(k + 0.35) - chart.sx(k - 0.35), height: chart.sy(0) - chart.sy(mass), fill: BLUE });
        bar.append(element('title', {}, `P(X=${k}) = ${fixed(mass)}`));
        chart.marks.append(bar);
      });
      const mean = isPoisson ? state.lambda : n * state.theta;
      const variance = isPoisson ? state.lambda : n * state.theta * (1 - state.theta);
      readout.textContent = `${ui.mean} = ${fixed(mean)} · ${ui.variance} = ${fixed(variance)} · ${ui.plotted} = ${fixed(values.reduce((sum, v) => sum + v[1], 0))}`;
      legend(root, [[ui.mass, BLUE]]);
      break;
    }
    case 'gaussian': {
      const { mu, sigma } = state;
      const a = Math.min(state.a, state.b);
      const b = Math.max(state.a, state.b);
      const extent = Math.max(4, Math.abs(mu) + 4 * sigma);
      const fn = (x) => normalPdf(x, mu, sigma);
      const chart = plot(target, { xmin: -extent, xmax: extent, ymax: fn(mu) * 1.15, xlabel: 'x', ylabel: ui.density });
      const area = samples(fn, a, b, 120);
      const d = `M${chart.sx(a)},${chart.sy(0)}` + area.map(([x, y]) => `L${chart.sx(x)},${chart.sy(y)}`).join('') + `L${chart.sx(b)},${chart.sy(0)}Z`;
      chart.marks.append(element('path', { d, fill: OCHRE, 'fill-opacity': 0.22 }));
      curve(chart, samples(fn, -extent, extent), BLUE);
      readout.textContent = `P(${number(a)} ≤ X ≤ ${number(b)}) = ${fixed(normalInterval(a, b, mu, sigma))} · ${ui.peak} = ${fixed(fn(mu))}`;
      legend(root, [[ui.density, BLUE], [ui.area, OCHRE]]);
      break;
    }
    case 'clt': {
      const { n } = state;
      const chart = plot(target, { xmin: -4, xmax: 4, ymax: 0.65, xlabel: ui.standardized, ylabel: ui.density });
      const exact = n === 1 ? [[-4, 0], [-Math.sqrt(3), 0], [-Math.sqrt(3), 1 / Math.sqrt(12)], [Math.sqrt(3), 1 / Math.sqrt(12)], [Math.sqrt(3), 0], [4, 0]] : samples((z) => standardizedUniformPdf(z, n), -4, 4);
      curve(chart, exact, BLUE);
      curve(chart, samples((z) => normalPdf(z), -4, 4), GRAY, true);
      legend(root, [[ui.exact, BLUE], [ui.normal, GRAY, true]]);
      readout.textContent = `E[Zₙ] = 0 · Var(Zₙ) = 1 · ${ui.sdSum} = √(n/12) = ${fixed(Math.sqrt(n / 12))}`;
      break;
    }
    case 'conditional': {
      const { rho, observed } = state;
      const conditional = gaussianConditional(rho, observed);
      const chart = plot(target, { xmin: -3, xmax: 3, ymin: -3, ymax: 3, xlabel: 'X', ylabel: `Y · ${ui.contour}`, square: true });
      for (const radius of [1, 2]) {
        const points = Array.from({ length: 181 }, (_, i) => {
          const t = i * 2 * Math.PI / 180;
          return [radius * Math.cos(t), radius * (rho * Math.cos(t) + Math.sqrt(1 - rho ** 2) * Math.sin(t))];
        });
        curve(chart, points, BLUE, radius === 2);
      }
      curve(chart, [[-3, observed], [3, observed]], OCHRE, true);
      dot(chart, conditional.mean, observed, OCHRE);
      const density = plot(panels[1], { xmin: -4, xmax: 4, ymax: normalPdf(conditional.mean, conditional.mean, Math.sqrt(conditional.variance)) * 1.2, xlabel: 'X', ylabel: ui.density });
      curve(density, samples((x) => normalPdf(x), -4, 4), BLUE);
      curve(density, samples((x) => normalPdf(x, conditional.mean, Math.sqrt(conditional.variance)), -4, 4), OCHRE);
      const jointLegend = [[ui.contour, BLUE], [ui.observation, OCHRE, true]];
      const conditionalLegend = [[ui.marginal, BLUE], [ui.conditional, OCHRE]];
      legend(root, [...jointLegend, ...conditionalLegend], [jointLegend, conditionalLegend]);
      readout.textContent = `${ui.conditionalMean} = ρy = ${fixed(conditional.mean)} · ${ui.conditionalVariance} = 1 − ρ² = ${fixed(conditional.variance)}`;
      break;
    }
    case 'entropy': {
      const { p, q } = state;
      const ymax = Math.max(bernoulliCrossEntropy(0, q), bernoulliCrossEntropy(1, q)) * 1.1;
      const chart = plot(target, { xmin: 0, xmax: 1, ymax, xlabel: ui.probability, ylabel: ui.nats });
      curve(chart, samples(bernoulliEntropy, 0, 1), BLUE);
      curve(chart, samples((x) => bernoulliCrossEntropy(x, q), 0, 1), OCHRE);
      curve(chart, [[p, bernoulliEntropy(p)], [p, bernoulliCrossEntropy(p, q)]], GRAY, true);
      dot(chart, p, bernoulliEntropy(p), BLUE);
      dot(chart, p, bernoulliCrossEntropy(p, q), OCHRE);
      legend(root, [[ui.entropy, BLUE], [ui.crossEntropy, OCHRE]]);
      readout.textContent = `H(p) = ${fixed(bernoulliEntropy(p))} · H(p,q) = ${fixed(bernoulliCrossEntropy(p, q))} · ${ui.kl} = ${fixed(bernoulliKl(p, q))} · ${ui.reverseKl} = ${fixed(bernoulliKl(q, p))}`;
      break;
    }
    default:
      break;
  }
}

export function mountFigure(root, draw, animation = null) {
  initializeFigure(root);
  const controls = Array.from(root.querySelectorAll('[data-param]'));
  const defaults = controls.map((control) => control.value);
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; draw(root); });
  };
  root.addEventListener('input', schedule);
  root.addEventListener('change', schedule);
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  root.querySelector('[data-reset]').addEventListener('click', () => {
    controls.forEach((control, i) => { control.value = defaults[i]; });
    schedule();
  });
  if (typeof ResizeObserver !== 'undefined') {
    let previousWidth = 0;
    new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width !== previousWidth) { previousWidth = width; schedule(); }
    }).observe(root);
  }
  const animationButton = root.querySelector('[data-animation]');
  if (animationButton) {
    const ui = labels[root.dataset.lang] || labels.en;
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const parameter = animation?.parameter || (root.dataset.statistics === 'clt' ? 'n' : 'rho');
    const input = root.querySelector(`[data-param="${parameter}"]`);
    const liveOutput = root.querySelector('.statistics-figure__readout');
    let running = !motionPreference.matches;
    let visible = false;
    let elapsed = 0;
    let initial = Number(input.value);
    let lastTime = null;
    let lastPaint = 0;
    let frameId = null;
    const updateButton = () => {
      root.dataset.animationState = running ? 'running' : 'paused';
      animationButton.textContent = running ? ui.pause : ui.play;
      animationButton.setAttribute('aria-pressed', String(running));
      // Automatic updates should not continuously interrupt screen readers.
      liveOutput.setAttribute('aria-live', running ? 'off' : 'polite');
    };
    const stopFrame = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      lastTime = null;
    };
    const animate = (time) => {
      frameId = null;
      if (!running || !visible || document.hidden) { lastTime = null; return; }
      if (lastTime !== null) elapsed += Math.min(time - lastTime, 100);
      lastTime = time;
      if (time - lastPaint >= 80) {
        const value = String(animation ? animation.value(elapsed, initial) : animationValue(root.dataset.statistics, elapsed, initial));
        if (input.value !== value) { input.value = value; schedule(); }
        lastPaint = time;
      }
      frameId = requestAnimationFrame(animate);
    };
    const startFrame = () => {
      if (running && visible && !document.hidden && frameId === null) frameId = requestAnimationFrame(animate);
    };
    const pause = () => { running = false; stopFrame(); updateButton(); };
    // Manual interaction takes ownership of the current state. Pointer hover
    // alone does not stop the demo, avoiding ambiguous automatic resumes.
    root.addEventListener('pointerdown', (event) => { if (event.target.matches('[data-param]')) pause(); });
    root.addEventListener('focusin', (event) => { if (event.target.matches('[data-param]')) pause(); });
    root.addEventListener('input', pause);
    root.addEventListener('change', pause);
    root.querySelector('[data-reset]').addEventListener('click', pause);
    animationButton.addEventListener('click', () => {
      if (running) pause();
      else {
        running = true;
        elapsed = 0;
        initial = Number(input.value);
        updateButton();
        startFrame();
      }
    });
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startFrame();
      else stopFrame();
    }, { threshold: 0.15 }).observe(root);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopFrame();
      else startFrame();
    });
    motionPreference.addEventListener('change', (event) => { if (event.matches) pause(); });
    updateButton();
  }
  draw(root);
}

export { plot, curve, dot, legend, samples, element, BLUE, OCHRE, GRAY };

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-statistics]').forEach((root) => mountFigure(root, render));
}
