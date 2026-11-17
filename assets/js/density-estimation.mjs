import { normalPdf, plot, curve, dot, legend, samples, element, mountFigure,
  BLUE, OCHRE, GRAY } from './statistics-foundations.mjs';
import { figurePanels } from './figure-layout.mjs';

export function gaussianMle(data) {
  const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
  const variance = data.reduce((sum, x) => sum + (x - mean) ** 2, 0) / data.length;
  return { mean, variance };
}

export function normalMeanPosterior(data, priorMean, priorVariance, noiseVariance = 1) {
  const variance = 1 / (1 / priorVariance + data.length / noiseVariance);
  const mean = variance * (priorMean / priorVariance + data.reduce((sum, x) => sum + x, 0) / noiseVariance);
  return { mean, variance, predictiveVariance: noiseVariance + variance };
}

export function kernel(u, kind = 'gaussian') {
  if (kind === 'box') return Math.abs(u) <= 0.5 ? 1 : 0;
  if (kind === 'epanechnikov') return Math.abs(u) <= 1 ? 0.75 * (1 - u ** 2) : 0;
  return normalPdf(u);
}

export function kde(x, data, h, kind = 'gaussian') {
  return data.reduce((sum, value) => sum + kernel((x - value) / h, kind), 0) / (data.length * h);
}

export function histogram(data, h, origin = 0) {
  const first = Math.floor((Math.min(...data) - origin) / h);
  const last = Math.floor((Math.max(...data) - origin) / h);
  const counts = Array(last - first + 1).fill(0);
  for (const x of data) counts[Math.floor((x - origin) / h) - first] += 1;
  return counts.map((count, i) => ({ left: origin + (first + i) * h,
    right: origin + (first + i + 1) * h, count, density: count / (data.length * h) }));
}

export function knnLocal(x, data, k) {
  const distances = data.map((value, index) => ({ index, distance: Math.abs(value - x) }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index);
  const radius = distances[k - 1].distance;
  return { radius, density: radius > 0 ? k / (2 * data.length * radius) : Infinity,
    indices: distances.slice(0, k).map((point) => point.index) };
}

const logJoint = (x, component) => Math.log(component.weight)
  - 0.5 * Math.log(2 * Math.PI * component.variance)
  - (x - component.mean) ** 2 / (2 * component.variance);

export function responsibilities(x, components) {
  const logs = components.map((component) => logJoint(x, component));
  const max = Math.max(...logs);
  const values = logs.map((value) => Math.exp(value - max));
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

export function mixtureLogLikelihood(data, components) {
  return data.reduce((sum, x) => {
    const logs = components.map((component) => logJoint(x, component));
    const max = Math.max(...logs);
    return sum + max + Math.log(logs.reduce((total, value) => total + Math.exp(value - max), 0));
  }, 0);
}

export function emStep(data, components, minVariance = 0.04) {
  const gamma = data.map((x) => responsibilities(x, components));
  return components.map((component, j) => {
    const count = gamma.reduce((sum, row) => sum + row[j], 0);
    if (count === 0) return { ...component, weight: 0 };
    const mean = data.reduce((sum, x, i) => sum + gamma[i][j] * x, 0) / count;
    const variance = data.reduce((sum, x, i) => sum + gamma[i][j] * (x - mean) ** 2, 0) / count;
    return { mean, variance: Math.max(minVariance, variance), weight: count / data.length };
  });
}

export function seededSamples(n, mixture = true, seed = 37) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296;
  };
  return Array.from({ length: n }, () => {
    const left = random() < 0.55;
    const z = Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random());
    return mixture ? (left ? -1.4 + 0.45 * z : 1.1 + 0.7 * z) : 1 + z;
  });
}

export const trueDensity = (x) => 0.55 * normalPdf(x, -1.4, 0.45) + 0.45 * normalPdf(x, 1.1, 0.7);
export function densityAnimation(kind, elapsed, initial) {
  if (kind === 'posterior') return (initial + Math.floor(elapsed / 550)) % 81;
  if (kind === 'em') return (initial + Math.floor(elapsed / 1400)) % 31;
  const phase = Math.asin(Math.max(-1, Math.min(1, (initial - 0.81) / 0.69)));
  return Number((0.81 + 0.69 * Math.sin(elapsed / 3000 + phase)).toFixed(2));
}

const mixtureData = seededSamples(80);
const gaussianData = seededSamples(80, false);
const trajectories = new Map();
const INK = '#343c43';
const uiText = {
  zh: {
    density: '概率密度', meanAxis: '参数 μ', prior: '先验 p(μ)', posterior: '后验 p(μ | D)',
    sampleMean: '样本均值', noSamples: '未定义（无样本）', posteriorMean: '后验均值', posteriorSd: '后验标准差', prediction: '预测方差',
    truth: '生成分布（仅用于演示）', estimate: '估计密度', samples: '样本位置', local: '近邻窗口的局部估计',
    radius: '近邻半径', components: '分量', mixture: '混合密度', iteration: '迭代轮数', likelihood: '总对数似然 ℓ',
    snapshot: '当前轮次', dataCount: '样本数', histogramArea: '密度面积之和',
  },
  en: {
    density: 'Probability density', meanAxis: 'Parameter μ', prior: 'Prior p(μ)', posterior: 'Posterior p(μ | D)',
    sampleMean: 'Sample mean', noSamples: 'undefined (no samples)', posteriorMean: 'Posterior mean', posteriorSd: 'Posterior SD', prediction: 'Predictive variance',
    truth: 'True density', estimate: 'Estimated density', samples: 'Sample locations', local: 'Local neighbor-window estimate',
    radius: 'Neighbor radius', components: 'Component', mixture: 'Mixture density', iteration: 'Iteration', likelihood: 'Total log-likelihood ℓ',
    snapshot: 'Selected iteration', dataCount: 'Sample size', histogramArea: 'Total histogram area',
  },
};
const fmt = (value) => Number.isFinite(value) ? value.toFixed(3) : '∞';

function rug(chart, data, selected = []) {
  const chosen = new Set(selected);
  for (const [i, x] of data.entries()) curve(chart, [[x, 0], [x, chart.ymax * 0.045]], chosen.has(i) ? OCHRE : GRAY);
}

function trajectory(mode) {
  if (!trajectories.has(mode)) {
    const means = mode === 'separated' ? [-2, 2] : mode === 'symmetric' ? [0, 0] : [-0.5, 0];
    const states = [means.map((mean) => ({ mean, variance: 1.5, weight: 0.5 }))];
    for (let i = 0; i < 30; i += 1) states.push(emStep(mixtureData, states.at(-1)));
    trajectories.set(mode, { states, scores: states.map((state) => mixtureLogLikelihood(mixtureData, state)) });
  }
  return trajectories.get(mode);
}

function draw(root) {
  const ui = uiText[root.dataset.lang] || uiText.en;
  const state = {};
  root.querySelectorAll('[data-param]').forEach((control) => {
    state[control.dataset.param] = control.tagName === 'SELECT' ? control.value : Number(control.value);
    const output = root.querySelector(`[data-value="${control.dataset.param}"]`);
    if (output) output.value = control.value;
  });
  const panels = figurePanels(root, root.dataset.density === 'em'
    ? (root.dataset.lang === 'zh' ? ['拟合分布', '似然变化'] : ['Fitted density', 'Likelihood history'])
    : [ui.density]);
  const target = panels[0];
  const readout = root.querySelector('.statistics-figure__readout');
  if (root.dataset.density === 'posterior') {
    const data = gaussianData.slice(0, state.n);
    const sampleMean = data.length ? gaussianMle(data).mean : null;
    const posterior = normalMeanPosterior(data, state.priorMean, state.priorSd ** 2);
    const priorFn = (x) => normalPdf(x, state.priorMean, state.priorSd);
    const posteriorFn = (x) => normalPdf(x, posterior.mean, Math.sqrt(posterior.variance));
    const chart = plot(target, { xmin: -3, xmax: 4, ymax: Math.max(priorFn(state.priorMean), posteriorFn(posterior.mean)) * 1.15,
      xlabel: ui.meanAxis, ylabel: ui.density });
    curve(chart, samples(priorFn, -3, 4), GRAY, true);
    curve(chart, samples(posteriorFn, -3, 4), BLUE);
    const entries = [[ui.prior, GRAY, true], [ui.posterior, BLUE]];
    if (sampleMean !== null) {
      curve(chart, [[sampleMean, 0], [sampleMean, chart.ymax]], OCHRE, true);
      entries.push([ui.sampleMean, OCHRE, true]);
    }
    legend(root, entries);
    readout.textContent = `n = ${state.n} · x̄ = ${sampleMean === null ? ui.noSamples : fmt(sampleMean)} · ${ui.posteriorMean} = ${fmt(posterior.mean)} · ${ui.posteriorSd} = ${fmt(Math.sqrt(posterior.variance))} · ${ui.prediction} = ${fmt(posterior.predictiveVariance)}`;
  } else if (root.dataset.density === 'smoothing') {
    const isHistogram = state.method === 'histogram';
    root.querySelector('[data-bin-origin]').hidden = !isHistogram;
    const values = samples((x) => kde(x, mixtureData, state.h, state.method), -4.5, 4.5, 600);
    const bins = isHistogram ? histogram(mixtureData, state.h, state.origin * state.h) : [];
    const peak = isHistogram ? Math.max(...bins.map((bin) => bin.density)) : Math.max(...values.map((point) => point[1]));
    const chart = plot(target, { xmin: -4.5, xmax: 4.5, ymax: Math.max(0.6, peak) * 1.2, xlabel: 'x', ylabel: ui.density });
    if (isHistogram) {
      for (const bin of bins) chart.marks.append(element('rect', { x: chart.sx(bin.left), y: chart.sy(bin.density),
        width: chart.sx(bin.right) - chart.sx(bin.left), height: chart.sy(0) - chart.sy(bin.density),
        fill: BLUE, 'fill-opacity': 0.35, stroke: BLUE, 'stroke-width': 0.8 }));
    } else curve(chart, values, BLUE);
    curve(chart, samples(trueDensity, -4.5, 4.5), GRAY, true);
    rug(chart, mixtureData);
    legend(root, [[ui.estimate, BLUE], [ui.truth, GRAY, true]]);
    readout.textContent = `n = 80 · h = ${fmt(state.h)}` + (isHistogram ? ` · ${ui.histogramArea} = ${fmt(bins.reduce((sum, bin) => sum + bin.density * (bin.right - bin.left), 0))}` : ' · ∫ p̂(x) dx = 1');
  } else if (root.dataset.density === 'neighbors') {
    const local = knnLocal(state.query, mixtureData, state.k);
    const chart = plot(target, { xmin: -4.5, xmax: 4.5, ymax: Math.max(0.6, local.density) * 1.2, xlabel: 'x', ylabel: ui.density });
    const left = state.query - local.radius;
    const right = state.query + local.radius;
    chart.marks.append(element('rect', { x: chart.sx(left), y: chart.sy(local.density), width: chart.sx(right) - chart.sx(left),
      height: chart.sy(0) - chart.sy(local.density), fill: BLUE, 'fill-opacity': 0.15, stroke: BLUE }));
    curve(chart, samples(trueDensity, -4.5, 4.5), GRAY, true);
    curve(chart, [[state.query, 0], [state.query, chart.ymax]], BLUE, true);
    rug(chart, mixtureData, local.indices);
    legend(root, [[ui.local, BLUE], [ui.truth, GRAY, true], [ui.samples, OCHRE]]);
    readout.textContent = `k = ${state.k} · x = ${fmt(state.query)} · rₖ(x) = ${fmt(local.radius)} · p̂(x) = ${fmt(local.density)}`;
  } else if (root.dataset.density === 'em') {
    const { states, scores } = trajectory(state.initialization);
    const components = states[state.iteration];
    const componentFn = (component) => (x) => component.weight * normalPdf(x, component.mean, Math.sqrt(component.variance));
    const mixtureFn = (x) => components.reduce((sum, component) => sum + componentFn(component)(x), 0);
    const values = samples(mixtureFn, -4.5, 4.5);
    const chart = plot(target, { xmin: -4.5, xmax: 4.5, ymax: Math.max(0.65, ...values.map((v) => v[1])) * 1.2, xlabel: 'x', ylabel: ui.density });
    components.forEach((component, j) => curve(chart, samples(componentFn(component), -4.5, 4.5), j === 0 ? BLUE : OCHRE));
    curve(chart, values, INK);
    curve(chart, samples(trueDensity, -4.5, 4.5), GRAY, true);
    rug(chart, mixtureData);
    const padding = Math.max(1, (Math.max(...scores) - Math.min(...scores)) * 0.08);
    const scorePlot = plot(panels[1], { xmin: 0, xmax: 30, ymin: Math.min(...scores) - padding,
      ymax: Math.max(...scores) + padding, xlabel: ui.iteration, ylabel: ui.likelihood });
    curve(scorePlot, scores.slice(0, state.iteration + 1).map((score, i) => [i, score]), INK);
    dot(scorePlot, state.iteration, scores[state.iteration], OCHRE);
    const densityLegend = [[`${ui.components} 1: π₁ N₁`, BLUE], [`${ui.components} 2: π₂ N₂`, OCHRE], [ui.mixture, INK], [ui.truth, GRAY, true]];
    legend(root, densityLegend, [densityLegend, [[ui.likelihood, INK], [ui.snapshot, OCHRE]]]);
    readout.textContent = `${ui.snapshot} = ${state.iteration} · ℓ = ${fmt(scores[state.iteration])} · ` + components.map((component, j) => `π${j + 1}=${fmt(component.weight)}, μ${j + 1}=${fmt(component.mean)}, σ${j + 1}=${fmt(Math.sqrt(component.variance))}`).join(' · ');
    root.querySelector('[data-em-step]').disabled = state.iteration === 30;
  }
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-density]').forEach((root) => {
    const kind = root.dataset.density;
    const parameter = kind === 'posterior' ? 'n' : kind === 'em' ? 'iteration' : 'h';
    mountFigure(root, draw, { parameter, value: (elapsed, initial) => densityAnimation(kind, elapsed, initial) });
    const step = root.querySelector('[data-em-step]');
    if (step) step.addEventListener('click', () => {
      const input = root.querySelector('[data-param="iteration"]');
      input.value = Math.min(30, Number(input.value) + 1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}
