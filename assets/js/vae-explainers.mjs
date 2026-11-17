import { plot, curve, dot, legend, samples, element, normalPdf, BLUE, OCHRE, GRAY } from './statistics-foundations.mjs';
import { normalLogPdf, gaussianKl, normalSamples } from './vae-foundations.mjs';
import { chartDimensions, figurePanels, initializeFigure } from './figure-layout.mjs';

export function gaussianElbo(x, mu, sigma, tau = 0.6) {
  const variance = tau ** 2 / (1 + tau ** 2);
  const posteriorMu = x / (1 + tau ** 2);
  const reconstruction = -0.5 * (((x - mu) ** 2 + sigma ** 2) / tau ** 2 + Math.log(2 * Math.PI * tau ** 2));
  const priorKl = gaussianKl(mu, 2 * Math.log(sigma));
  return { reconstruction, priorKl, elbo: reconstruction - priorKl,
    evidence: normalLogPdf(x, 0, Math.sqrt(1 + tau ** 2)),
    posteriorKl: gaussianKl(mu, 2 * Math.log(sigma), posteriorMu, variance),
    posteriorMu, variance };
}

// X = Z + B + noise; independent standard-normal priors for Z and B.
export function sensorApproximation(x, tau, matchMarginals = false) {
  const noiseVariance = tau ** 2;
  const mean = x / (2 + noiseVariance);
  const marginalVariance = (1 + noiseVariance) / (2 + noiseVariance);
  const covariance = -1 / (2 + noiseVariance);
  const meanFieldVariance = noiseVariance / (1 + noiseVariance);
  const variance = matchMarginals ? marginalVariance : meanFieldVariance;
  const posteriorKl = 0.5 * (2 * variance * (1 + 1 / noiseVariance) - 2
    + Math.log(noiseVariance / (2 + noiseVariance)) - 2 * Math.log(variance));
  return { mean, marginalVariance, covariance, meanFieldVariance, variance,
    correlation: covariance / marginalVariance, posteriorKl };
}

export function neuron(w, x) {
  const mean = Math.tanh(w * x);
  return { mean, loss: (mean - 0.6) ** 2 / 2,
    gradient: (mean - 0.6) * (1 - mean ** 2) * x };
}

export function gradientReplicates(mu, sigma, n, repeats = 128) {
  const noise = normalSamples(n * repeats, 83);
  return Array.from({ length: repeats }, (_, j) =>
    2 * (mu - 1) + 2 * sigma * noise.slice(j * n, (j + 1) * n).reduce((a, b) => a + b) / n);
}

const text = {
  zh: { prior: '先验 p(z)', likelihood: '条件观测密度 p(x|z)', joint: '联合密度 p(x,z)', posterior: '真实后验 p(z|x)',
    density: '密度 / 似然', exact: '真实后验', approx: '近似 q', reconstruction: '重建项',
    priorKl: '先验 KL', posteriorKl: '后验 KL', evidence: '边缘对数似然',
    loss: '目标 J(w)', step: '建议更新方向', weight: '权重 w', gradient: '梯度估计值',
    histogram: '128 次估计的直方图', analytic: '估计量的解析密度', sd: '估计量标准差',
    temperature: '温差 z', bias: '偏差 b', posteriorVariance: '真实边际方差', approximateVariance: '近似边际方差',
  },
  en: { prior: 'Prior p(z)', likelihood: 'Conditional density p(x|z)', joint: 'Joint p(x,z)', posterior: 'True posterior p(z|x)',
    density: 'Density / likelihood', exact: 'Exact posterior', approx: 'Approximation q', reconstruction: 'Reconstruction',
    priorKl: 'Prior KL', posteriorKl: 'Posterior KL', evidence: 'Log marginal likelihood',
    loss: 'Objective J(w)', step: 'Proposed update', weight: 'Weight w', gradient: 'Gradient estimate',
    histogram: '128 repeated estimates', analytic: 'Exact estimator density', sd: 'Estimator SD',
    temperature: 'Temperature z', bias: 'Bias b', posteriorVariance: 'Posterior marginal variance', approximateVariance: 'Approximate marginal variance',
  },
};
const f = v => v.toFixed(4);

function bars(target, values, names) {
  const { width, height, top, bottom } = chartDimensions(target);
  const svg = element('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': names.join('; ') });
  svg.append(element('title', {}, names.join('; ')));
  const low = Math.min(...values, -0.1) * 1.15, high = Math.max(0, ...values) + 0.5;
  const sy = v => bottom - (v - low) / (high - low) * (bottom - top);
  for (let j = 0; j <= 4; j++) {
    const v = low + (high - low) * j / 4;
    svg.append(element('line', { x1: 48, x2: width - 8, y1: sy(v), y2: sy(v), stroke: '#d8d7d2' }));
    svg.append(element('text', { x: 43, y: sy(v) + 4, 'text-anchor': 'end' }, v.toFixed(1)));
  }
  svg.append(element('text', { x: 48, y: 18 }, 'nat'));
  const cell = (width - 60) / values.length;
  values.forEach((v, i) => {
    const x = 52 + cell * i;
    svg.append(element('rect', { x: x + cell * 0.18, y: Math.min(sy(0), sy(v)), width: cell * 0.64,
      height: Math.abs(sy(v) - sy(0)), fill: i === 3 ? BLUE : OCHRE, opacity: 0.8 }));
    svg.append(element('text', { x: x + cell / 2, y: bottom + 24, 'text-anchor': 'middle' }, names[i]));
  });
  svg.append(element('line', { x1: 48, x2: width - 8, y1: sy(0), y2: sy(0), stroke: GRAY }));
  target.append(svg);
}

function draw(root) {
  const t = text[root.dataset.lang] || text.en;
  const s = {};
  root.querySelectorAll('[data-param]').forEach(input => {
    s[input.dataset.param] = Number(input.value);
    const output = root.querySelector(`[data-value="${input.dataset.param}"]`);
    if (output) output.value = Number.isInteger(Number(input.value)) ? input.value : Number(input.value).toFixed(3);
  });
  const titles = {
    bayes: root.dataset.lang === 'zh' ? ['概率因子', '生成关系'] : ['Probability factors', 'Generative graph'],
    elbo: root.dataset.lang === 'zh' ? ['后验对比', 'ELBO 分解'] : ['Posterior comparison', 'ELBO decomposition'],
    sensor: root.dataset.lang === 'zh' ? ['联合后验', '温度边际'] : ['Joint posterior', 'Temperature marginal'],
    backprop: root.dataset.lang === 'zh' ? ['损失与更新', '计算链'] : ['Loss and update', 'Computational chain'],
    gradient: root.dataset.lang === 'zh' ? ['梯度波动', '采样数与误差'] : ['Gradient noise', 'Samples and error'],
  };
  const panels = figurePanels(root, titles[root.dataset.vaeExplain]);
  const readout = root.querySelector('.statistics-figure__readout');
  const kind = root.dataset.vaeExplain;
  if (kind === 'bayes') {
    const variance = s.tau ** 2 / (1 + s.tau ** 2), mean = s.x / (1 + s.tau ** 2);
    const evidence = normalPdf(s.x, 0, Math.sqrt(1 + s.tau ** 2));
    const chart = plot(panels[0], { xmin: -4, xmax: 4, ymax: 1.1 / Math.sqrt(2 * Math.PI * variance), xlabel: 'z', ylabel: t.density });
    const functions = [z => normalPdf(z), z => normalPdf(s.x, z, s.tau),
      z => normalPdf(z) * normalPdf(s.x, z, s.tau), z => normalPdf(z, mean, Math.sqrt(variance))];
    const names = [t.prior, t.likelihood, t.joint, t.posterior];
    const colors = [GRAY, OCHRE, '#856c9b', BLUE];
    for (let i = 0; i <= s.stage; i++) curve(chart, samples(functions[i], -4, 4), colors[i], i !== s.stage);
    const factorLegend = names.slice(0, s.stage + 1).map((name, i) => [name, colors[i], i !== s.stage]);
    legend(root, factorLegend, [factorLegend, []]);
    const { width, height } = chartDimensions(panels[1]);
    const svg = element('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'p(z) → p(x|z); p(z|x)=p(z)p(x|z)/p(x)' });
    svg.append(element('title', {}, 'p(z)p(x|z) = p(x,z)'));
    const cy = height * 0.34, radius = 26;
    for (const [cx, name, label] of [[width * 0.2, 'Z', 'p(z)'], [width * 0.8, 'X', `x = ${f(s.x)}`]]) {
      svg.append(element('circle', { cx, cy, r: radius, fill: name === 'X' ? '#c4d8dc' : '#fffefa', stroke: BLUE, 'stroke-width': 2 }));
      svg.append(element('text', { x: cx, y: cy + 4, 'text-anchor': 'middle' }, name));
      svg.append(element('text', { x: cx, y: cy + 48, 'text-anchor': 'middle' }, label));
    }
    const end = width * 0.8 - radius - 3;
    svg.append(element('path', { d: `M${width * 0.2 + radius + 3} ${cy}H${end}M${end - 8} ${cy - 6}L${end} ${cy}L${end - 8} ${cy + 6}`, fill: 'none', stroke: BLUE, 'stroke-width': 2 }));
    svg.append(element('text', { x: width / 2, y: cy - 16, 'text-anchor': 'middle' }, 'p(x|z)'));
    svg.append(element('text', { x: width / 2, y: height * 0.78, 'text-anchor': 'middle' }, 'p(x,z) = p(z)p(x|z)'));
    svg.append(element('text', { x: width / 2, y: height - 14, 'text-anchor': 'middle' }, `p(x) = ${f(evidence)}`));
    panels[1].append(svg);
    readout.textContent = `${names[s.stage]}; p(x) = ${f(evidence)}; μ(z|x) = ${f(mean)}; σ²(z|x) = ${f(variance)}`;
  } else if (kind === 'elbo') {
    const result = gaussianElbo(s.x, s.mu, s.sigma);
    const chart = plot(panels[0], { xmin: -4, xmax: 4, ymax: Math.max(1, 0.46 / s.sigma), xlabel: 'z', ylabel: t.density });
    curve(chart, samples(z => normalPdf(z, result.posteriorMu, Math.sqrt(result.variance)), -4, 4), BLUE);
    curve(chart, samples(z => normalPdf(z, s.mu, s.sigma), -4, 4), OCHRE);
    bars(panels[1], [result.reconstruction, -result.priorKl, result.elbo, result.evidence], ['E log p', '−KLprior', 'ELBO', 'log p(x)']);
    const posteriorLegend = [[t.exact, BLUE], [t.approx, OCHRE]];
    legend(root, posteriorLegend, [posteriorLegend, [[t.evidence, BLUE], ['ELBO', OCHRE]]]);
    readout.textContent = `ELBO = ${f(result.elbo)}; log p(x) = ${f(result.evidence)}; ${t.posteriorKl} = ${f(result.posteriorKl)}; ${t.priorKl} = ${f(result.priorKl)} nat`;
  } else if (kind === 'sensor') {
    const result = sensorApproximation(s.x, s.tau, s.approximation === 1);
    const chart = plot(panels[0], { xmin: -3, xmax: 3, ymin: -3, ymax: 3,
      xlabel: t.temperature, ylabel: t.bias, square: true });
    const sumSd = s.tau / Math.sqrt(2 + s.tau ** 2);
    for (const radius of [1, 2]) {
      const angles = samples(angle => angle, 0, 2 * Math.PI, 180).map(([angle]) => angle);
      curve(chart, angles.map(angle => [
        result.mean + radius * (sumSd * Math.cos(angle) + Math.sin(angle)) / Math.SQRT2,
        result.mean + radius * (sumSd * Math.cos(angle) - Math.sin(angle)) / Math.SQRT2,
      ]), BLUE);
      curve(chart, angles.map(angle => [
        result.mean + radius * Math.sqrt(result.variance) * Math.cos(angle),
        result.mean + radius * Math.sqrt(result.variance) * Math.sin(angle),
      ]), OCHRE, true);
    }
    const marginal = plot(panels[1], { xmin: -3, xmax: 3,
      ymax: 0.6 / Math.sqrt(result.variance), xlabel: t.temperature,
      ylabel: root.dataset.lang === 'zh' ? '概率密度' : 'Probability density' });
    curve(marginal, samples(z => normalPdf(z, result.mean, Math.sqrt(result.marginalVariance)), -3, 3), BLUE);
    curve(marginal, samples(z => normalPdf(z, result.mean, Math.sqrt(result.variance)), -3, 3), OCHRE, true);
    const entries = [[t.exact, BLUE], [t.approx, OCHRE, true]];
    legend(root, entries, [entries, entries]);
    readout.textContent = `μz = μb = ${f(result.mean)}; ${t.posteriorVariance} = ${f(result.marginalVariance)}; ${t.approximateVariance} = ${f(result.variance)}; ρ = ${f(result.correlation)}; KL(q‖p) = ${f(result.posteriorKl)} nat`;
  } else if (kind === 'backprop') {
    const result = neuron(s.w, s.x), next = s.w - s.rate * result.gradient;
    const chart = plot(panels[0], { xmin: -3, xmax: 3, ymax: 1.4, xlabel: t.weight, ylabel: t.loss });
    curve(chart, samples(w => neuron(w, s.x).loss, -3, 3), BLUE);
    dot(chart, s.w, result.loss, OCHRE);
    curve(chart, [[s.w, result.loss], [next, neuron(next, s.x).loss]], OCHRE, true);
    dot(chart, next, neuron(next, s.x).loss, GRAY);
    const { width, height } = chartDimensions(panels[1]);
    const svg = element('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'w → wx → tanh(wx) → J' });
    svg.append(element('title', {}, 'w → wx → tanh(wx) → J'));
    const lines = [`w = ${f(s.w)}`, `a = wx = ${f(s.w * s.x)}`, `μ = tanh(a) = ${f(result.mean)}`,
      `J = (μ−0.6)²/2 = ${f(result.loss)}`, `∂J/∂w = (μ−0.6)(1−μ²)x`, `= ${f(result.gradient)}`];
    lines.forEach((line, i) => svg.append(element('text', { x: 12, y: 20 + (height - 38) * i / 5 }, line)));
    panels[1].append(svg);
    const stepLegend = [[t.loss, BLUE], [t.step, OCHRE, true]];
    legend(root, stepLegend, [stepLegend, []]);
    readout.textContent = `J = ${f(result.loss)}; ∂J/∂w = ${f(result.gradient)}; w(next) = ${f(next)}; J(next) = ${f(neuron(next, s.x).loss)}`;
  } else {
    const values = gradientReplicates(s.mu, s.sigma, s.n);
    const mean = 2 * (s.mu - 1), sd = 2 * s.sigma / Math.sqrt(s.n);
    const width = sd * 0.4, start = mean - 4 * sd;
    const counts = Array(20).fill(0);
    values.forEach(value => { const bin = Math.floor((value - start) / width); if (bin >= 0 && bin < 20) counts[bin]++; });
    const ymax = Math.max(0.45 / sd, ...counts.map(n => n / (128 * width))) * 1.2;
    const chart = plot(panels[0], { xmin: -12, xmax: 8, ymax, xlabel: t.gradient, ylabel: t.density });
    counts.forEach((n, i) => chart.marks.append(element('rect', { x: chart.sx(start + width * i),
      y: chart.sy(n / (128 * width)), width: Math.max(0.3, chart.sx(start + width * (i + 1)) - chart.sx(start + width * i)),
      height: chart.sy(0) - chart.sy(n / (128 * width)), fill: BLUE, opacity: 0.5 })));
    curve(chart, samples(x => normalPdf(x, mean, sd), Math.max(-12, mean - 5 * sd), Math.min(8, mean + 5 * sd)), OCHRE);
    const spread = plot(panels[1], { xmin: 1, xmax: 128, ymax: 4.5, xlabel: 'L', ylabel: t.sd });
    curve(spread, samples(n => 2 * s.sigma / Math.sqrt(n), 1, 128), BLUE);
    dot(spread, s.n, sd, OCHRE);
    const gradientLegend = [[t.histogram, BLUE], [t.analytic, OCHRE]];
    legend(root, gradientLegend, [gradientLegend, [[t.sd, BLUE]]]);
    readout.textContent = `E[∂J/∂μ] = ${f(mean)}; ${t.sd} = ${f(sd)}; L = ${s.n}; 128 × ${s.n} = ${128 * s.n}`;
  }
}

function mount(root) {
  initializeFigure(root);
  root.addEventListener('input', () => draw(root));
  root.addEventListener('change', () => draw(root));
  root.querySelector('[data-reset]').addEventListener('click', () => {
    root.querySelectorAll('input').forEach(i => { i.value = i.defaultValue; });
    root.querySelectorAll('select').forEach(i => { i.selectedIndex = [...i.options].findIndex(o => o.defaultSelected); });
    draw(root);
  });
  root.querySelector('[data-exact]')?.addEventListener('click', () => {
    const x = Number(root.querySelector('[data-param=x]').value);
    root.querySelector('[data-param=mu]').step = 'any'; root.querySelector('[data-param=sigma]').step = 'any';
    root.querySelector('[data-param=mu]').value = x / 1.36;
    root.querySelector('[data-param=sigma]').value = Math.sqrt(0.36 / 1.36);
    draw(root);
  });
  root.querySelector('[data-step]')?.addEventListener('click', () => {
    const w = root.querySelector('[data-param=w]'), x = Number(root.querySelector('[data-param=x]').value);
    const next = Number(w.value) - Number(root.querySelector('[data-param=rate]').value) * neuron(Number(w.value), x).gradient;
    w.min = Math.min(-3, next); w.max = Math.max(3, next); w.step = 'any'; w.value = next;
    draw(root);
  });
  let previousWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width !== previousWidth) { previousWidth = width; draw(root); }
  }).observe(root);
  window.addEventListener('resize', () => draw(root));
  window.visualViewport?.addEventListener('resize', () => draw(root));
  draw(root);
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-vae-explain]').forEach(mount);
