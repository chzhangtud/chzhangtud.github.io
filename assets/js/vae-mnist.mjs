import { forward, normalSamples, gaussianKl } from './vae-foundations.mjs';
import { initializeFigure } from './figure-layout.mjs';

export function encodeDigit(model, pixels) {
  const output = forward(model.encoder, pixels);
  return { mu: output.slice(0, 2), logvar: output.slice(2).map(v =>
    Math.max(model.logvarBounds[0], Math.min(model.logvarBounds[1], v))) };
}
export const decodeDigit = (model, z) => forward(model.decoder, z).map(v => 1 / (1 + Math.exp(-v)));
export const interpolate = (a, b, alpha) => a.map((v, i) => (1 - alpha) * v + alpha * b[i]);
export function bernoulliPixels(probabilities, seed = 97) {
  let state = seed >>> 0;
  return probabilities.map(p => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return (state + 0.5) / 4294967296 < p ? 1 : 0;
  });
}

const requests = new Map();
const gridCache = new WeakMap();
const text = {
  zh: { original: '测试输入（二值）', mean: '解码后验均值', sampled: '解码后验样本',
    lattice: '潜空间网格', prior: '先验随机样本', chosen: '当前坐标输出', sourceA: '测试输入 A', sourceB: '测试输入 B',
    intermediate: '当前 α 的解码', strip: '九步插值：α 从 0 到 1', failed: '模型读取失败，请刷新页面或运行文中训练脚本。',
    label: '原始数字标签（未参与训练）', kl: '到先验的 KL', probability: '概率均值图', binary: '伯努利二值抽样',
  },
  en: { original: 'Binary test input', mean: 'Decode posterior mean', sampled: 'Decode posterior sample',
    lattice: 'Latent grid', prior: 'Random prior draws', chosen: 'Chosen coordinate', sourceA: 'Test input A', sourceB: 'Test input B',
    intermediate: 'Decode current α', strip: 'Nine steps: α from 0 to 1', failed: 'Model loading failed. Refresh or run the training script.',
    label: 'Original digit label (not used in training)', kl: 'KL to prior', probability: 'Probability means', binary: 'Bernoulli binary sample',
  },
};
const f = values => values.map(v => v.toFixed(3)).join(', ');

function imageData(context, values) {
  const pixels = context.createImageData(28, 28);
  values.forEach((value, i) => {
    const gray = Math.round(255 * Math.max(0, Math.min(1, value)));
    pixels.data[i * 4] = gray; pixels.data[i * 4 + 1] = gray;
    pixels.data[i * 4 + 2] = gray; pixels.data[i * 4 + 3] = 255;
  });
  return pixels;
}
function panel(container, title, cols = 1, rows = 1) {
  const wrapper = document.createElement('div'); wrapper.className = 'mnist-panel';
  const label = document.createElement('p'); label.textContent = title; wrapper.append(label);
  const canvas = document.createElement('canvas');
  canvas.width = cols * 28; canvas.height = rows * 28;
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', title);
  canvas.className = cols > 1 ? 'mnist-grid' : 'mnist-digit';
  wrapper.append(canvas); container.append(wrapper);
  return canvas;
}

function draw(root, state) {
  if (!state.model) return;
  const model = state.model, t = text[root.dataset.lang] || text.en;
  const controls = {};
  root.querySelectorAll('[data-param]').forEach(input => {
    controls[input.dataset.param] = input.tagName === 'SELECT' ? input.value : Number(input.value);
    const output = root.querySelector(`[data-value="${input.dataset.param}"]`);
    if (output) output.value = input.value;
  });
  const target = root.querySelector('.mnist-display'); target.replaceChildren();
  const readout = root.querySelector('.statistics-figure__readout');
  const pixels = index => Array.from(model.images[index], Number);
  const image = (title, values) => {
    const canvas = panel(target, title), context = canvas.getContext('2d');
    context.putImageData(imageData(context, values), 0, 0); return canvas;
  };
  if (root.dataset.mnist === 'reconstruction') {
    const input = pixels(controls.index), q = encodeDigit(model, input);
    const epsilon = normalSamples(2, state.seed);
    const z = q.mu.map((v, i) => v + Math.exp(q.logvar[i] / 2) * epsilon[i]);
    image(t.original, input); image(t.mean, decodeDigit(model, q.mu)); image(t.sampled, decodeDigit(model, z));
    const kl = q.mu.reduce((sum, value, i) => sum + gaussianKl(value, q.logvar[i]), 0);
    readout.textContent = `${t.label}: ${model.labels[controls.index]}; μ = (${f(q.mu)}); log σ² = (${f(q.logvar)}); ε = (${f(epsilon)}); z = (${f(z)}); ${t.kl} = ${kl.toFixed(3)} nat`;
  } else if (root.dataset.mnist === 'generation') {
    const size = root.clientWidth < 500 ? 5 : 9;
    const step = 6 / (size - 1);
    if (!gridCache.has(model)) gridCache.set(model, new Map());
    const grids = gridCache.get(model);
    if (!grids.has(size)) grids.set(size, Array.from({ length: size * size }, (_, i) =>
      decodeDigit(model, [-3 + (i % size) * step, 3 - Math.floor(i / size) * step])));
    const isGrid = controls.layout === 'grid';
    const canvas = panel(target, isGrid ? `${t.lattice} ${size}×${size}; z₂ ↑; z₁ →; [−3,3]` : `${t.prior} (${size * size})`, size, size);
    const context = canvas.getContext('2d');
    const priorKey = `${state.seed}-${size}`;
    if (state.priorSeed !== priorKey) {
      const noise = normalSamples(size * size * 2, state.seed + 1000);
      state.prior = Array.from({ length: size * size }, (_, i) => decodeDigit(model, [noise[2 * i], noise[2 * i + 1]]));
      state.priorSeed = priorKey;
    }
    (isGrid ? grids.get(size) : state.prior).forEach((probability, i) => {
      const values = controls.mode === 'sample' ? bernoulliPixels(probability, state.seed + i) : probability;
      context.putImageData(imageData(context, values), (i % size) * 28, Math.floor(i / size) * 28);
    });
    if (isGrid) {
      context.strokeStyle = '#ff5b55'; context.lineWidth = 1.5;
      context.beginPath(); context.arc(14 + (controls.z1 + 3) / 6 * (size - 1) * 28, 14 + (3 - controls.z2) / 6 * (size - 1) * 28, 7, 0, 2 * Math.PI); context.stroke();
    }
    const probabilities = decodeDigit(model, [controls.z1, controls.z2]);
    image(t.chosen, controls.mode === 'sample' ? bernoulliPixels(probabilities, state.seed) : probabilities);
    const logprior = -Math.log(2 * Math.PI) - (controls.z1 ** 2 + controls.z2 ** 2) / 2;
    readout.textContent = `z = (${controls.z1.toFixed(2)}, ${controls.z2.toFixed(2)}); log p(z) = ${logprior.toFixed(3)}; ${isGrid ? t.lattice : t.prior}; ${controls.mode === 'sample' ? t.binary : t.probability}`;
  } else {
    const qa = encodeDigit(model, pixels(controls.a)), qb = encodeDigit(model, pixels(controls.b));
    const z = interpolate(qa.mu, qb.mu, controls.alpha);
    image(t.sourceA, pixels(controls.a)); image(t.intermediate, decodeDigit(model, z)); image(t.sourceB, pixels(controls.b));
    const strip = panel(target, t.strip, 9, 1); strip.parentElement.classList.add('mnist-strip');
    const context = strip.getContext('2d');
    for (let i = 0; i < 9; i++) context.putImageData(imageData(context,
      decodeDigit(model, interpolate(qa.mu, qb.mu, i / 8))), i * 28, 0);
    readout.textContent = `μ(A) = (${f(qa.mu)}); μ(B) = (${f(qb.mu)}); α = ${controls.alpha.toFixed(2)}; zα = (${f(z)})`;
  }
}

async function mount(root) {
  initializeFigure(root);
  const state = { seed: 97, model: null };
  root.addEventListener('input', () => draw(root, state));
  root.addEventListener('change', () => draw(root, state));
  root.querySelector('[data-resample]')?.addEventListener('click', () => { state.seed++; draw(root, state); });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    root.querySelectorAll('input').forEach(input => { input.value = input.defaultValue; });
    root.querySelectorAll('select').forEach(input => { input.selectedIndex = 0; });
    state.seed = 97; draw(root, state);
  });
  try {
    const url = root.dataset.model;
    if (!requests.has(url)) requests.set(url, fetch(url).then(response => {
      if (!response.ok) throw new Error(`MNIST model HTTP ${response.status}`);
      return response.json();
    }));
    state.model = await requests.get(url);
    if (state.model.version !== 1 || state.model.images.length !== 40) throw new Error('Unsupported MNIST model');
    draw(root, state);
    let previousWidth = Math.round(root.clientWidth);
    new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      if (width !== previousWidth) { previousWidth = width; draw(root, state); }
    }).observe(root);
  } catch {
    root.querySelector('.statistics-figure__readout').textContent = (text[root.dataset.lang] || text.en).failed;
  }
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-mnist]').forEach(mount);
