import { normalPdf, plot, curve, dot, legend, samples, element,
  BLUE, OCHRE, GRAY } from './statistics-foundations.mjs';
import { figurePanels, initializeFigure } from './figure-layout.mjs';

export const normalLogPdf = (z, mu = 0, sigma = 1) =>
  -0.5 * Math.log(2 * Math.PI) - Math.log(sigma) - 0.5 * ((z - mu) / sigma) ** 2;

export function gaussianKl(mu, logvar, priorMu = 0, priorVariance = 1) {
  return 0.5 * ((Math.exp(logvar) + (mu - priorMu) ** 2) / priorVariance
    - 1 + Math.log(priorVariance) - logvar);
}

export function mixtureLogPdf(z, a) {
  const left = normalLogPdf(z, -a, 0.65);
  const right = normalLogPdf(z, a, 0.65);
  const max = Math.max(left, right);
  return max + Math.log(Math.exp(left - max) + Math.exp(right - max)) - Math.log(2);
}

export function variationalGap(mu, sigma, a) {
  let kl = 0;
  const dx = 0.01;
  for (let i = 0; i < 3200; i += 1) {
    const z = -16 + (i + 0.5) * dx;
    const logq = normalLogPdf(z, mu, sigma);
    kl += Math.exp(logq) * (logq - mixtureLogPdf(z, a)) * dx;
  }
  return kl;
}

export function normalSamples(count, seed = 47) {
  let state = seed >>> 0;
  const uniform = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296;
  };
  return Array.from({ length: count }, () =>
    Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform()));
}

export function reparameterizedCost(mu, logvar, noise) {
  const sigma = Math.exp(logvar / 2);
  let cost = 0, dmu = 0, dlogvar = 0;
  for (const epsilon of noise) {
    const residual = mu + sigma * epsilon - 1;
    cost += residual ** 2;
    dmu += 2 * residual;
    dlogvar += residual * sigma * epsilon;
  }
  return { cost: cost / noise.length, dmu: dmu / noise.length,
    dlogvar: dlogvar / noise.length,
    exactCost: (mu - 1) ** 2 + sigma ** 2,
    exactDmu: 2 * (mu - 1), exactDlogvar: sigma ** 2 };
}

export function probabilityNetwork(x, bias = 0) {
  return { mu: 0.8 * Math.tanh(1.2 * x + 0.4) - 0.5 * Math.tanh(-0.7 * x) + bias,
    logvar: -1 + 0.5 * Math.tanh(x) };
}

export function linearPosterior(x) {
  return { mu: x / 1.36, variance: 0.36 / 1.36 };
}

export function forward(layers, input) {
  return layers.reduce((values, layer) => layer.weight.map((row, i) => {
    const value = row.reduce((sum, weight, j) => sum + weight * values[j], layer.bias[i]);
    return layer.activation === 'tanh' ? Math.tanh(value) : value;
  }), input);
}

export function encode(model, x) {
  const [mu, rawLogvar] = forward(model.encoder, x);
  return { mu, logvar: Math.max(model.logvarBounds[0], Math.min(model.logvarBounds[1], rawLogvar)) };
}

export function predictiveSample(model, z, noise) {
  return forward(model.decoder, [z]).map((mean, i) => mean + model.tau * noise[i]);
}

const ui = {
  zh: { density: '概率密度', target: '目标后验 p(z|x)', approx: '近似 q(z)',
    mean: '条件均值 μ(x)', band: '均值 ±2σ(x)', output: '输出 y',
    noise: '标准正态噪声 ε', transformed: '变换后的 z',
    sample: '固定噪声对应的样本', exactMean: '真实后验均值', sharedMean: '共享编码器 kx',
    prior: '先验 p(z)', heldout: '留出观测', generated: '先验生成样本',
    decoder: '解码器均值曲线', selected: '当前 z 的解码均值', reconstruction: '后验均值的解码',
    mc: '蒙特卡洛', exact: '解析', loss: '留出集平均负 ELBO 估计',
    steps: '离线训练步数', failed: '模型读取失败。可刷新页面，或使用文中训练脚本。',
    variance: '后验方差', posteriorKl: '后验 KL', priorKl: '先验 KL',
  },
  en: { density: 'Probability density', target: 'Target posterior p(z|x)', approx: 'Approximation q(z)',
    mean: 'Conditional mean μ(x)', band: 'Mean ±2σ(x)', output: 'Output y',
    noise: 'Standard-normal noise ε', transformed: 'Transformed z',
    sample: 'Samples from fixed noise', exactMean: 'Exact posterior mean', sharedMean: 'Shared encoder kx',
    prior: 'Prior p(z)', heldout: 'Held-out data', generated: 'Prior samples',
    decoder: 'Decoder mean', selected: 'Selected z', reconstruction: 'Reconstruction',
    mc: 'Monte Carlo', exact: 'Analytic', loss: 'Held-out mean negative-ELBO estimate',
    steps: 'Offline training steps', failed: 'Model loading failed. Refresh or use the training script in the article.',
    variance: 'Posterior variance', posteriorKl: 'Posterior KL', priorKl: 'Prior KL',
  },
};
const states = new WeakMap();
const fmt = value => value.toFixed(3);

function rug(chart, values) {
  for (const z of values) chart.marks.append(element('line', {
    x1: chart.sx(z), x2: chart.sx(z), y1: chart.sy(0), y2: chart.sy(0) - 12,
    stroke: OCHRE, 'stroke-width': 1.4, opacity: 0.7,
  }));
}

function scatter(chart, point, color, radius = 2, opacity = 0.6) {
  chart.marks.append(element('circle', { cx: chart.sx(point[0]), cy: chart.sy(point[1]),
    r: radius, fill: color, opacity }));
}

function render(root) {
  const labels = ui[root.dataset.lang] || ui.en;
  const current = states.get(root);
  const state = {};
  for (const control of root.querySelectorAll('[data-param]')) {
    state[control.dataset.param] = Number(control.value);
    root.querySelector(`[data-value="${control.dataset.param}"]`).value = control.value;
  }
  const target = root.querySelector('.statistics-figure__plots');
  const readout = root.querySelector('.statistics-figure__readout');
  if (root.dataset.vae === 'vae' && !current.model) return;
  const titles = {
    network: root.dataset.lang === 'zh' ? ['输入与均值', '输出分布'] : ['Input and mean', 'Output distribution'],
    reparam: root.dataset.lang === 'zh' ? ['基础噪声', '变换样本'] : ['Base noise', 'Transformed samples'],
    amortized: root.dataset.lang === 'zh' ? ['共享映射', '后验比较'] : ['Shared mapping', 'Posterior comparison'],
    vae: root.dataset.lang === 'zh' ? ['观测空间', '潜变量分布'] : ['Observation space', 'Latent distribution'],
  };
  const panels = figurePanels(root, titles[root.dataset.vae] || [labels.density]);
  const [left, right] = panels;
  if (root.dataset.vae === 'vi') {
    const chart = plot(left, { xmin: -6, xmax: 6, ymax: Math.max(0.8, normalPdf(state.mu, state.mu, state.sigma) * 1.15),
      xlabel: 'z', ylabel: labels.density });
    curve(chart, samples(z => Math.exp(mixtureLogPdf(z, state.a)), -6, 6), BLUE);
    curve(chart, samples(z => normalPdf(z, state.mu, state.sigma), -6, 6), OCHRE);
    legend(root, [[labels.target, BLUE], [labels.approx, OCHRE]]);
    readout.textContent = `KL(q ‖ p) ≈ ${fmt(variationalGap(state.mu, state.sigma, state.a))} nat`;
  } else if (root.dataset.vae === 'network') {
    const distribution = probabilityNetwork(state.x, state.bias);
    const sigma = Math.exp(distribution.logvar / 2);
    const chart = plot(left, { xmin: -3, xmax: 3, ymin: -4, ymax: 4, xlabel: 'x', ylabel: labels.output });
    curve(chart, samples(x => probabilityNetwork(x, state.bias).mu, -3, 3), BLUE);
    for (const sign of [-1, 1]) curve(chart, samples(x => {
      const p = probabilityNetwork(x, state.bias); return p.mu + sign * 2 * Math.exp(p.logvar / 2);
    }, -3, 3), GRAY, true);
    dot(chart, state.x, distribution.mu, OCHRE);
    const density = plot(right, { xmin: -5, xmax: 5, ymax: 1.1, xlabel: 'y', ylabel: labels.density });
    curve(density, samples(y => normalPdf(y, distribution.mu, sigma), -5, 5), BLUE);
    const meanLegend = [[labels.mean, BLUE], [labels.band, GRAY, true]];
    legend(root, meanLegend, [meanLegend, [[labels.density, BLUE]]]);
    readout.textContent = `μ(x) = ${fmt(distribution.mu)}; log σ²(x) = ${fmt(distribution.logvar)}; σ(x) = ${fmt(sigma)}`;
  } else if (root.dataset.vae === 'reparam') {
    const epsilon = normalSamples(state.n, current.seed);
    const chart = plot(left, { xmin: -4, xmax: 4, ymax: 0.5, xlabel: 'ε', ylabel: labels.noise });
    curve(chart, samples(z => normalPdf(z), -4, 4), BLUE); rug(chart, epsilon);
    const transformed = plot(right, { xmin: -8, xmax: 8, ymax: Math.max(0.5, 0.46 / state.sigma), xlabel: 'z', ylabel: labels.density });
    curve(transformed, samples(z => normalPdf(z, state.mu, state.sigma), -8, 8), BLUE);
    rug(transformed, epsilon.map(e => state.mu + state.sigma * e));
    const cost = reparameterizedCost(state.mu, 2 * Math.log(state.sigma), epsilon);
    const sampleLegend = [[labels.transformed, BLUE], [labels.sample, OCHRE]];
    legend(root, sampleLegend, [[[labels.noise, BLUE], [labels.sample, OCHRE]], sampleLegend]);
    readout.textContent = `${labels.mc}: ∂J/∂μ = ${fmt(cost.dmu)}, ∂J/∂log σ² = ${fmt(cost.dlogvar)}; ${labels.exact}: ${fmt(cost.exactDmu)}, ${fmt(cost.exactDlogvar)}`;
  } else if (root.dataset.vae === 'amortized') {
    const posterior = linearPosterior(state.x);
    const chart = plot(left, { xmin: -3, xmax: 3, ymin: -4.5, ymax: 4.5, xlabel: 'x', ylabel: 'μ(x)' });
    curve(chart, samples(x => linearPosterior(x).mu, -3, 3), BLUE);
    curve(chart, samples(x => state.slope * x, -3, 3), OCHRE);
    dot(chart, state.x, state.slope * state.x, OCHRE);
    const density = plot(right, { xmin: -4, xmax: 4, ymax: 0.9, xlabel: 'z', ylabel: labels.density });
    curve(density, samples(z => normalPdf(z, posterior.mu, Math.sqrt(posterior.variance)), -4, 4), BLUE);
    curve(density, samples(z => normalPdf(z, state.slope * state.x, Math.sqrt(posterior.variance)), -4, 4), OCHRE);
    const mappingLegend = [[labels.exactMean, BLUE], [labels.sharedMean, OCHRE]];
    legend(root, mappingLegend, [mappingLegend, [[labels.target, BLUE], [labels.approx, OCHRE]]]);
    readout.textContent = `${labels.variance} = ${fmt(posterior.variance)}; ${labels.posteriorKl} = ${fmt(gaussianKl(state.slope * state.x, Math.log(posterior.variance), posterior.mu, posterior.variance))} nat`;
  } else if (root.dataset.vae === 'vae') {
    const model = current.model;
    const observation = model.observations[state.observation];
    const posterior = encode(model, observation);
    const chart = plot(left, { xmin: -3.5, xmax: 3.5, ymin: -1.8, ymax: 5, xlabel: 'x₁', ylabel: 'x₂', square: true });
    const noise = normalSamples(240, current.seed);
    for (let i = 0; i < 80; i += 1) scatter(chart,
      predictiveSample(model, noise[i], [noise[80 + 2 * i], noise[81 + 2 * i]]), GRAY);
    for (const x of model.observations) scatter(chart, x, BLUE);
    const decoded = samples(z => z, -3, 3, 150).map(([z]) => forward(model.decoder, [z]));
    curve(chart, decoded, '#343c43');
    dot(chart, observation[0], observation[1], '#a8463b');
    const reconstruction = forward(model.decoder, [posterior.mu]);
    dot(chart, reconstruction[0], reconstruction[1], OCHRE);
    const generated = forward(model.decoder, [state.z]);
    dot(chart, generated[0], generated[1], '#397e60');
    const density = plot(right, { xmin: -4, xmax: 4, ymax: Math.max(0.6, 0.46 / Math.exp(posterior.logvar / 2)), xlabel: 'z', ylabel: 'qφ(z|x); p(z)' });
    curve(density, samples(z => normalPdf(z), -4, 4), GRAY, true);
    curve(density, samples(z => normalPdf(z, posterior.mu, Math.exp(posterior.logvar / 2)), -4, 4), OCHRE);
    const observationLegend = [[labels.heldout, BLUE], [labels.generated, GRAY], [labels.decoder, '#343c43'],
      [labels.reconstruction, OCHRE], [labels.selected, '#397e60']];
    const latentLegend = [[labels.prior, GRAY, true], [labels.approx, OCHRE]];
    legend(root, [...observationLegend, ...latentLegend], [observationLegend, latentLegend]);
    readout.textContent = `μ(x) = ${fmt(posterior.mu)}; σ(x) = ${fmt(Math.exp(posterior.logvar / 2))}; ${labels.priorKl} = ${fmt(gaussianKl(posterior.mu, posterior.logvar))} nat; z = ${fmt(state.z)}; mθ(z) = (${generated.map(fmt).join(', ')})`;
  }
}

async function mount(root) {
  initializeFigure(root);
  states.set(root, { seed: 47, model: null });
  root.addEventListener('input', () => render(root));
  root.querySelector('[data-reset]').addEventListener('click', () => {
    root.querySelectorAll('input').forEach(input => { input.value = input.defaultValue; });
    states.get(root).seed = 47; render(root);
  });
  root.querySelector('[data-resample]')?.addEventListener('click', () => {
    states.get(root).seed += 1; render(root);
  });
  let previousWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width !== previousWidth) { previousWidth = width; render(root); }
  }).observe(root);
  window.addEventListener('resize', () => render(root));
  window.visualViewport?.addEventListener('resize', () => render(root));
  if (root.dataset.vae === 'vae') {
    try {
      const response = await fetch(root.dataset.model);
      if (!response.ok) throw new Error(`Model HTTP ${response.status}`);
      const model = await response.json();
      if (model.version !== 1 || model.observations.length !== 80) throw new Error('Unsupported model');
      states.get(root).model = model;
    } catch {
      root.querySelector('.statistics-figure__readout').textContent = (ui[root.dataset.lang] || ui.en).failed;
      return;
    }
  }
  render(root);
}

if (typeof document !== 'undefined') document.querySelectorAll('[data-vae]').forEach(mount);
