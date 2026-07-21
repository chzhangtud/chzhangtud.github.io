const EPSILON = 1e-12;
const SVG_NS = 'http://www.w3.org/2000/svg';

const colors = {
  target: '#24343b',
  polynomial: '#c1121f',
  linear: '#007f7f',
  cubic: '#5a3d8f',
  basisA: '#c1121f',
  basisB: '#1d6fb8',
  nodes: '#e85d04',
  grid: '#d7dee2',
};

const labelSets = {
  zh: {
    degree: '次数 n ',
    basisA: '基函数 A ',
    basisB: '基函数 B ',
    nodeCount: '节点数 ',
    figureBasis: '图 1.1 Lagrange 基函数',
    figureSineError: '图 1.2 sin(pi x) 与插值误差',
    figureRungeChebyshev: '图 1.4 Runge 函数，Chebyshev 节点',
    figureRungeEqual: '图 1.3 Runge 函数，等距节点',
    figureSpline: '图 1.5 线性样条与自然三次样条',
    equidistantNodes: '等距节点',
    chebyshevNodes: 'Chebyshev 节点',
    interpolationNodes: '插值节点',
    nodeAria: '节点',
    errorMax: '误差，最大采样值',
    linearSpline: '线性样条',
    naturalCubicSpline: '自然三次样条',
    xAxisLabel: 'x',
    yAxisLabel: 'y',
  },
  en: {
    degree: 'Degree n ',
    basisA: 'Basis A ',
    basisB: 'Basis B ',
    nodeCount: 'Node count ',
    figureBasis: 'Figure 1.1 Lagrange Basis Functions',
    figureSineError: 'Figure 1.2 sin(pi x) and Interpolation Error',
    figureRungeChebyshev: 'Figure 1.4 Runge Function, Chebyshev Nodes',
    figureRungeEqual: 'Figure 1.3 Runge Function, Equidistant Nodes',
    figureSpline: 'Figure 1.5 Linear and Natural Cubic Splines',
    equidistantNodes: 'Equidistant nodes',
    chebyshevNodes: 'Chebyshev nodes',
    interpolationNodes: 'Interpolation nodes',
    nodeAria: 'Node',
    errorMax: 'Error, max sampled value',
    linearSpline: 'Linear spline',
    naturalCubicSpline: 'Natural cubic spline',
    xAxisLabel: 'x',
    yAxisLabel: 'y',
  },
};

const getLabels = (root = null) => {
  const lang = root?.dataset?.interpolationLang
    || (typeof document === 'undefined' ? 'zh' : document.documentElement.lang);
  return String(lang).toLowerCase().startsWith('en') ? labelSets.en : labelSets.zh;
};

const validateSamples = (xs, ys) => {
  if (!Array.isArray(xs) || !Array.isArray(ys) || xs.length !== ys.length || xs.length < 2) {
    throw new Error('Interpolation needs at least two x/y samples with matching lengths.');
  }

  for (let i = 0; i < xs.length; i += 1) {
    if (!Number.isFinite(xs[i]) || !Number.isFinite(ys[i])) {
      throw new Error('Interpolation samples must be finite numbers.');
    }
    if (i > 0 && xs[i] <= xs[i - 1]) {
      throw new Error('Interpolation x samples must be strictly increasing.');
    }
  }
};

const findSegment = (xs, x) => {
  if (x <= xs[0]) return 0;
  if (x >= xs.at(-1)) return xs.length - 2;

  let low = 0;
  let high = xs.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (xs[mid] <= x) low = mid;
    else high = mid;
  }
  return low;
};

export const chebyshevNodes = (a, b, count) => {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a || count < 2) {
    throw new Error('Chebyshev nodes need a valid interval and at least two nodes.');
  }

  const mid = (a + b) / 2;
  const half = (b - a) / 2;
  return Array.from({ length: count }, (_, i) => (
    mid + half * Math.cos(((2 * i + 1) * Math.PI) / (2 * count))
  )).sort((left, right) => left - right);
};

export const equidistantNodes = (a, b, count) => {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a || count < 2) {
    throw new Error('Equidistant nodes need a valid interval and at least two nodes.');
  }
  return Array.from({ length: count }, (_, i) => a + ((b - a) * i) / (count - 1));
};

export const evaluateLagrange = (xs, ys, x) => {
  validateSamples(xs, ys);
  let sum = 0;
  for (let k = 0; k < xs.length; k += 1) {
    let basis = 1;
    for (let j = 0; j < xs.length; j += 1) {
      if (j !== k) basis *= (x - xs[j]) / (xs[k] - xs[j]);
    }
    sum += ys[k] * basis;
  }
  return sum;
};

export const newtonDividedDifferences = (xs, ys) => {
  validateSamples(xs, ys);
  const coeffs = [...ys];
  for (let order = 1; order < xs.length; order += 1) {
    for (let i = xs.length - 1; i >= order; i -= 1) {
      const denominator = xs[i] - xs[i - order];
      if (Math.abs(denominator) < EPSILON) {
        throw new Error('Repeated interpolation nodes are not allowed.');
      }
      coeffs[i] = (coeffs[i] - coeffs[i - 1]) / denominator;
    }
  }
  return coeffs;
};

export const evaluateNewton = (xs, coeffs, x) => {
  if (xs.length !== coeffs.length || xs.length < 2) {
    throw new Error('Newton evaluation needs matching nodes and coefficients.');
  }

  let value = coeffs.at(-1);
  for (let i = coeffs.length - 2; i >= 0; i -= 1) {
    value = value * (x - xs[i]) + coeffs[i];
  }
  return value;
};

export const evaluateLinearSpline = (xs, ys, x) => {
  validateSamples(xs, ys);
  const i = findSegment(xs, x);
  const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
  return ys[i] * (1 - t) + ys[i + 1] * t;
};

const solveTridiagonal = (lower, diagonal, upper, rhs) => {
  const n = diagonal.length;
  const c = [...upper];
  const d = [...rhs];
  const b = [...diagonal];

  for (let i = 1; i < n; i += 1) {
    const factor = lower[i] / b[i - 1];
    b[i] -= factor * c[i - 1];
    d[i] -= factor * d[i - 1];
  }

  const solution = Array(n).fill(0);
  solution[n - 1] = d[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i -= 1) {
    solution[i] = (d[i] - c[i] * solution[i + 1]) / b[i];
  }
  return solution;
};

export const buildNaturalCubicSpline = (xs, ys) => {
  validateSamples(xs, ys);
  const count = xs.length;
  if (count === 2) {
    return {
      secondDerivatives: [0, 0],
      evaluate: (x) => evaluateLinearSpline(xs, ys, x),
    };
  }

  const h = Array.from({ length: count - 1 }, (_, i) => xs[i + 1] - xs[i]);
  const lower = Array(count).fill(0);
  const diagonal = Array(count).fill(0);
  const upper = Array(count).fill(0);
  const rhs = Array(count).fill(0);

  diagonal[0] = 1;
  diagonal[count - 1] = 1;
  for (let i = 1; i < count - 1; i += 1) {
    lower[i] = h[i - 1] / 6;
    diagonal[i] = (h[i - 1] + h[i]) / 3;
    upper[i] = h[i] / 6;
    rhs[i] = (ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1];
  }

  const secondDerivatives = solveTridiagonal(lower, diagonal, upper, rhs);
  return {
    secondDerivatives,
    evaluate: (x) => {
      const i = findSegment(xs, x);
      const width = xs[i + 1] - xs[i];
      const left = xs[i + 1] - x;
      const right = x - xs[i];
      return (
        (secondDerivatives[i] * left ** 3) / (6 * width)
        + (secondDerivatives[i + 1] * right ** 3) / (6 * width)
        + (ys[i] - (secondDerivatives[i] * width ** 2) / 6) * (left / width)
        + (ys[i + 1] - (secondDerivatives[i + 1] * width ** 2) / 6) * (right / width)
      );
    },
  };
};

const samplePath = (fn, xMin, xMax, steps) => Array.from({ length: steps + 1 }, (_, i) => {
  const x = xMin + ((xMax - xMin) * i) / steps;
  return { x, y: fn(x) };
});

const pathFromPoints = (points, project) => points.map((point, index) => {
  const [x, y] = project(point.x, point.y);
  return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
}).join(' ');

const formatTick = (value) => {
  if (Math.abs(value) < EPSILON) return '0';
  if (Math.abs(value) >= 100 || Math.abs(value) < 0.01) return value.toExponential(1);
  return Number(value.toFixed(2)).toString();
};

const linearTicks = (min, max, count = 5) => (
  Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1))
);

const createHtml = (tag, attributes = {}, text = '') => {
  const element = document.createElement(tag);
  setAttributes(element, attributes);
  if (text) element.textContent = text;
  return element;
};

const createSvg = (tag, attributes = {}, text = '') => {
  const element = document.createElementNS(SVG_NS, tag);
  setAttributes(element, attributes);
  if (text) element.textContent = text;
  return element;
};

const setAttributes = (element, attributes) => {
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value == null) continue;
    if (value === true) element.setAttribute(name, '');
    else element.setAttribute(name, String(value));
  }
};

const createLabeledSelect = (label, options, value, onChange) => {
  const wrapper = createHtml('label', {}, label);
  const select = createHtml('select');
  for (const option of options) {
    select.append(createHtml('option', { value: option.value, selected: option.value === value }, option.label));
  }
  select.addEventListener('change', () => onChange(select.value));
  wrapper.append(select);
  return wrapper;
};

const createPanel = (root, title, controls = []) => {
  root.classList.add('interpolation-lab');
  root.innerHTML = '';
  const header = createHtml('div', { class: 'interpolation-lab__toolbar' });
  header.append(createHtml('strong', { class: 'interpolation-lab__title' }, title));
  controls.forEach((control) => header.append(control));
  const chart = createHtml('div', { class: 'interpolation-lab__chart' });
  const svg = createSvg('svg', { viewBox: '0 0 900 440', role: 'img', 'aria-label': title });
  chart.append(svg);
  const metrics = createHtml('div', { class: 'interpolation-lab__metrics', 'aria-live': 'polite' });
  root.append(header, chart, metrics);
  return { svg, metrics };
};

const drawChart = (svg, series, nodes, domain, yDomain = null, labels = getLabels()) => {
  const [xMin, xMax] = domain;
  const sampled = series.flatMap((entry) => entry.points.map((point) => point.y)).filter(Number.isFinite);
  const nodeYs = nodes.map((point) => point.y).filter(Number.isFinite);
  const rawMin = yDomain ? yDomain[0] : Math.min(...sampled, ...nodeYs);
  const rawMax = yDomain ? yDomain[1] : Math.max(...sampled, ...nodeYs);
  const yPadding = yDomain ? 0 : Math.max(0.06, (rawMax - rawMin) * 0.12);
  const yMin = rawMin - yPadding;
  const yMax = rawMax + yPadding;
  const padding = { left: 76, right: 26, top: 24, bottom: 58 };
  const width = 900;
  const height = 440;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const project = (x, y) => [
    padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth,
    padding.top + (1 - (y - yMin) / (yMax - yMin)) * plotHeight,
  ];

  svg.replaceChildren();
  const grid = createSvg('g', { class: 'interpolation-lab__grid' });
  for (let i = 0; i <= 5; i += 1) {
    const y = padding.top + (plotHeight * i) / 5;
    const x = padding.left + (plotWidth * i) / 5;
    grid.append(createSvg('line', { x1: padding.left, y1: y, x2: width - padding.right, y2: y }));
    grid.append(createSvg('line', { x1: x, y1: padding.top, x2: x, y2: height - padding.bottom }));
  }
  svg.append(grid);

  const axes = createSvg('g', { class: 'interpolation-lab__axes' });
  axes.append(createSvg('line', {
    class: 'interpolation-lab__axis interpolation-lab__axis--x',
    x1: padding.left,
    y1: height - padding.bottom,
    x2: width - padding.right,
    y2: height - padding.bottom,
  }));
  axes.append(createSvg('line', {
    class: 'interpolation-lab__axis interpolation-lab__axis--y',
    x1: padding.left,
    y1: padding.top,
    x2: padding.left,
    y2: height - padding.bottom,
  }));

  const xTicks = linearTicks(xMin, xMax);
  for (const value of xTicks) {
    const [x] = project(value, yMin);
    const tick = createSvg('g', { class: 'interpolation-lab__tick interpolation-lab__tick--x' });
    tick.append(createSvg('line', {
      x1: x,
      y1: height - padding.bottom,
      x2: x,
      y2: height - padding.bottom + 6,
    }));
    tick.append(createSvg('text', {
      x,
      y: height - padding.bottom + 22,
      'text-anchor': 'middle',
    }, formatTick(value)));
    axes.append(tick);
  }

  const yTicks = linearTicks(yMin, yMax);
  for (const value of yTicks) {
    const [, y] = project(xMin, value);
    const tick = createSvg('g', { class: 'interpolation-lab__tick interpolation-lab__tick--y' });
    tick.append(createSvg('line', {
      x1: padding.left - 6,
      y1: y,
      x2: padding.left,
      y2: y,
    }));
    tick.append(createSvg('text', {
      x: padding.left - 10,
      y: y + 4,
      'text-anchor': 'end',
    }, formatTick(value)));
    axes.append(tick);
  }

  axes.append(createSvg('text', {
    class: 'interpolation-lab__axis-label interpolation-lab__axis-label--x',
    x: padding.left + plotWidth / 2,
    y: height - 10,
    'text-anchor': 'middle',
  }, labels.xAxisLabel));
  axes.append(createSvg('text', {
    class: 'interpolation-lab__axis-label interpolation-lab__axis-label--y',
    x: 18,
    y: padding.top + plotHeight / 2,
    'text-anchor': 'middle',
    transform: `rotate(-90 18 ${padding.top + plotHeight / 2})`,
  }, labels.yAxisLabel));
  svg.append(axes);

  for (const entry of series) {
    svg.append(createSvg('path', {
      class: `interpolation-lab__curve ${entry.className || ''}`,
      d: pathFromPoints(entry.points, project),
      fill: 'none',
      stroke: entry.color,
      'stroke-dasharray': entry.dash || null,
    }));
  }

  for (const point of nodes) {
    const [cx, cy] = project(point.x, point.y);
    svg.append(createSvg('circle', {
      class: 'interpolation-lab__node',
      cx,
      cy,
      r: 6,
      tabindex: 0,
      'aria-label': `${labels.nodeAria}: x=${point.x.toFixed(3)}, y=${point.y.toFixed(3)}`,
    }));
  }
};

const addLegend = (metrics, entries) => {
  metrics.replaceChildren();
  const legend = createHtml('div', { class: 'interpolation-lab__legend' });
  for (const entry of entries) {
    legend.append(createHtml('span', { style: `--swatch:${entry.color}` }, entry.label));
  }
  metrics.append(legend);
};

const polynomialSeries = (fn, xs, steps, xMin, xMax) => {
  const ys = xs.map(fn);
  const coeffs = newtonDividedDifferences(xs, ys);
  return {
    ys,
    points: samplePath((x) => evaluateNewton(xs, coeffs, x), xMin, xMax, steps),
  };
};

const renderBasisFigure = (root) => {
  const labels = getLabels(root);
  let n = 5;
  let first = 0;
  let second = 3;
  const controls = [
    createLabeledSelect(labels.degree, [5, 7, 9].map((value) => ({ value: String(value), label: String(value) })), '5', (value) => {
      n = Number(value);
      first = Math.min(first, n);
      second = Math.min(second, n);
      update();
    }),
    createLabeledSelect(labels.basisA, Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `L${i},n` })), '0', (value) => {
      first = Number(value);
      update();
    }),
    createLabeledSelect(labels.basisB, Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `L${i},n` })), '3', (value) => {
      second = Number(value);
      update();
    }),
  ];
  const { svg, metrics } = createPanel(root, labels.figureBasis, controls);
  const update = () => {
    const xs = equidistantNodes(0, 1, n + 1);
    const basisY = (k) => xs.map((_, index) => (index === k ? 1 : 0));
    const aPoints = samplePath((x) => evaluateLagrange(xs, basisY(first), x), 0, 1, 420);
    const bPoints = samplePath((x) => evaluateLagrange(xs, basisY(second), x), 0, 1, 420);
    drawChart(svg, [
      { points: aPoints, color: colors.basisA },
      { points: bPoints, color: colors.basisB },
    ], xs.map((x) => ({ x, y: 0 })), [0, 1], null, labels);
    addLegend(metrics, [
      { label: `L_${first},${n}`, color: colors.basisA },
      { label: `L_${second},${n}`, color: colors.basisB },
      { label: labels.equidistantNodes, color: colors.nodes },
    ]);
  };
  update();
};

const renderSineErrorFigure = (root) => {
  const labels = getLabels(root);
  let nodeCount = 6;
  const controls = [
    createLabeledSelect(labels.nodeCount, [4, 6, 8, 10, 12].map((value) => ({ value: String(value), label: String(value) })), '6', (value) => {
      nodeCount = Number(value);
      update();
    }),
  ];
  const { svg, metrics } = createPanel(root, labels.figureSineError, controls);
  const update = () => {
    const fn = (x) => Math.sin(Math.PI * x);
    const xs = equidistantNodes(0, 2, nodeCount);
    const { ys, points } = polynomialSeries(fn, xs, 520, 0, 2);
    const target = samplePath(fn, 0, 2, 520);
    const error = samplePath((x) => fn(x) - evaluateNewton(xs, newtonDividedDifferences(xs, ys), x), 0, 2, 520);
    drawChart(svg, [
      { points: target, color: colors.target, dash: '7 7' },
      { points, color: colors.polynomial },
      { points: error, color: colors.cubic },
    ], xs.map((x, i) => ({ x, y: ys[i] })), [0, 2], null, labels);
    const maxError = error.reduce((best, point) => Math.max(best, Math.abs(point.y)), 0);
    addLegend(metrics, [
      { label: 'sin(pi x)', color: colors.target },
      { label: `p_${nodeCount - 1}(x)`, color: colors.polynomial },
      { label: `${labels.errorMax} ${maxError.toExponential(2)}`, color: colors.cubic },
      { label: labels.interpolationNodes, color: colors.nodes },
    ]);
  };
  update();
};

const renderRungeFigure = (root, useChebyshev) => {
  const labels = getLabels(root);
  let nodeCount = 11;
  const label = useChebyshev ? labels.figureRungeChebyshev : labels.figureRungeEqual;
  const controls = [
    createLabeledSelect(labels.nodeCount, [11, 21].map((value) => ({ value: String(value), label: `n=${value - 1}` })), '11', (value) => {
      nodeCount = Number(value);
      update();
    }),
  ];
  const { svg, metrics } = createPanel(root, label, controls);
  const update = () => {
    const fn = (x) => 1 / (1 + x * x);
    const xs = useChebyshev ? chebyshevNodes(-5, 5, nodeCount) : equidistantNodes(-5, 5, nodeCount);
    const { ys, points } = polynomialSeries(fn, xs, 700, -5, 5);
    const target = samplePath(fn, -5, 5, 700);
    drawChart(svg, [
      { points: target, color: colors.target, dash: '7 7' },
      { points, color: colors.polynomial },
    ], xs.map((x, i) => ({ x, y: ys[i] })), [-5, 5], null, labels);
    addLegend(metrics, [
      { label: '1/(1+x^2)', color: colors.target },
      { label: `p_${nodeCount - 1}(x)`, color: colors.polynomial },
      { label: useChebyshev ? labels.chebyshevNodes : labels.equidistantNodes, color: colors.nodes },
    ]);
  };
  update();
};

const renderSplineFigure = (root) => {
  const labels = getLabels(root);
  let nodeCount = 11;
  const controls = [
    createLabeledSelect(labels.nodeCount, [11, 21].map((value) => ({ value: String(value), label: `n=${value - 1}` })), '11', (value) => {
      nodeCount = Number(value);
      update();
    }),
  ];
  const { svg, metrics } = createPanel(root, labels.figureSpline, controls);
  const update = () => {
    const fn = (x) => Math.sin(4 * Math.PI * x);
    const xs = equidistantNodes(0, 2, nodeCount);
    const ys = xs.map(fn);
    const cubic = buildNaturalCubicSpline(xs, ys);
    drawChart(svg, [
      { points: samplePath(fn, 0, 2, 700), color: colors.target, dash: '7 7' },
      { points: samplePath((x) => evaluateLinearSpline(xs, ys, x), 0, 2, 700), color: colors.linear },
      { points: samplePath((x) => cubic.evaluate(x), 0, 2, 700), color: colors.cubic },
    ], xs.map((x, i) => ({ x, y: ys[i] })), [0, 2], [-1.15, 1.15], labels);
    addLegend(metrics, [
      { label: 'sin(4 pi x)', color: colors.target },
      { label: labels.linearSpline, color: colors.linear },
      { label: labels.naturalCubicSpline, color: colors.cubic },
      { label: labels.interpolationNodes, color: colors.nodes },
    ]);
  };
  update();
};

const renderers = {
  basis: renderBasisFigure,
  'sine-error': renderSineErrorFigure,
  'runge-equal': (root) => renderRungeFigure(root, false),
  'runge-chebyshev': (root) => renderRungeFigure(root, true),
  spline: renderSplineFigure,
};

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-interpolation-figure]').forEach((root) => {
    const renderer = renderers[root.dataset.interpolationFigure];
    if (renderer) renderer(root);
  });
}
