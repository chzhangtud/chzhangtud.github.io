import test from 'node:test';
import assert from 'node:assert/strict';
import { gaussianMle, normalMeanPosterior, kernel, kde, histogram, knnLocal,
  responsibilities, mixtureLogLikelihood, emStep, seededSamples, densityAnimation,
} from '../assets/js/density-estimation.mjs';

const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const integrate = (fn, a, b, steps = 30000) => {
  const dx = (b - a) / steps;
  let value = 0.5 * (fn(a) + fn(b));
  for (let i = 1; i < steps; i += 1) value += fn(a + i * dx);
  return value * dx;
};

test('Gaussian MLE uses n, and the conjugate posterior retains predictive uncertainty', () => {
  close(gaussianMle([1, 2, 3]).mean, 2);
  close(gaussianMle([1, 2, 3]).variance, 2 / 3);
  close(gaussianMle([2]).variance, 0);
  const posterior = normalMeanPosterior([1, 1], 0, 1);
  close(posterior.mean, 2 / 3);
  close(posterior.variance, 1 / 3);
  close(posterior.predictiveVariance, 4 / 3);
  const noData = normalMeanPosterior([], 1.2, 0.49, 2);
  close(noData.mean, 1.2);
  close(noData.variance, 0.49);
  close(noData.predictiveVariance, 2.49);
  assert.ok(normalMeanPosterior(Array(80).fill(1), 0, 1).variance < posterior.variance);
});

test('kernels are normalized, and Epanechnikov has the correct quadratic shape and finite support', () => {
  close(integrate((u) => kernel(u), -10, 10), 1, 1e-7);
  close(integrate((u) => kernel(u, 'box'), -0.5, 0.5), 1, 1e-7);
  close(integrate((u) => kernel(u, 'epanechnikov'), -1, 1), 1, 1e-7);
  close(kernel(0.5, 'epanechnikov'), 0.5625);
  close(kernel(0.5, 'epanechnikov'), kernel(-0.5, 'epanechnikov'));
  close(kernel(1.01, 'epanechnikov'), 0);
  close(kernel(0.51, 'box'), 0);
});

test('histogram bin alignment preserves counts and density area', () => {
  const data = seededSamples(80);
  for (const h of [0.12, 0.4, 1.5]) {
    for (const fraction of [0, 0.5, 1]) {
      const bins = histogram(data, h, fraction * h);
      close(bins.reduce((sum, bin) => sum + bin.count, 0), data.length);
      close(bins.reduce((sum, bin) => sum + bin.density * (bin.right - bin.left), 0), 1);
    }
  }
  const bins = histogram([0, 1, 2], 1);
  assert.deepEqual(bins.map((bin) => bin.count), [1, 1, 1]);
});

test('bandwidth rescales KDE area without renormalizing plotted tails', () => {
  const data = [-1.5, -1, 0.3, 1.2];
  for (const h of [0.12, 0.4, 1.5]) {
    close(integrate((x) => kde(x, data, h), -15, 15), 1, 1e-7);
  }
  close(integrate((x) => kde(x, data, 0.4, 'epanechnikov'), -4, 4), 1, 1e-6);
});

test('kNN returns a local radius, exact selected indices, and the nonintegrable far-tail scale', () => {
  const data = [-2, -1, 1, 4];
  const local = knnLocal(0, data, 2);
  close(local.radius, 1);
  close(local.density, 0.25);
  assert.deepEqual(local.indices, [1, 2]);
  close(1e6 * knnLocal(1e6, data, 2).density, 2 / (2 * data.length), 1e-6);
});

test('responsibilities remain normalized even when ordinary densities underflow', () => {
  const components = [{ mean: -1, variance: 0.04, weight: 0.4 }, { mean: 1, variance: 0.04, weight: 0.6 }];
  for (const x of [-1000, 0, 1000]) {
    const row = responsibilities(x, components);
    close(row.reduce((sum, value) => sum + value, 0), 1);
    assert.ok(row.every(Number.isFinite));
    assert.ok(Number.isFinite(mixtureLogLikelihood([x], components)));
  }
});

test('constrained EM updates weights, respects the variance floor, and never lowers observed likelihood', () => {
  const data = seededSamples(80);
  for (const means of [[-2, 2], [-0.5, 0], [0, 0]]) {
    let components = means.map((mean) => ({ mean, variance: 1.5, weight: 0.5 }));
    let score = mixtureLogLikelihood(data, components);
    for (let iteration = 0; iteration < 30; iteration += 1) {
      components = emStep(data, components);
      close(components.reduce((sum, c) => sum + c.weight, 0), 1);
      assert.ok(components.every((c) => c.variance >= 0.04));
      const next = mixtureLogLikelihood(data, components);
      assert.ok(next >= score - 1e-9, `${next} decreased from ${score}`);
      score = next;
    }
  }
});

test('fully symmetric components remain symmetric, while label permutations leave density unchanged', () => {
  const data = seededSamples(80);
  const initial = [0, 0].map((mean) => ({ mean, variance: 1.5, weight: 0.5 }));
  const next = emStep(data, initial);
  close(next[0].mean, next[1].mean);
  close(next[0].variance, next[1].variance);
  const asymmetric = [{ mean: -1, variance: 0.4, weight: 0.3 }, { mean: 2, variance: 0.8, weight: 0.7 }];
  close(mixtureLogLikelihood(data, asymmetric), mixtureLogLikelihood(data, [...asymmetric].reverse()));
});

test('fixed-seed prefixes and animation parameters make demonstrations repeatable', () => {
  assert.deepEqual(seededSamples(80).slice(0, 20), seededSamples(20));
  close(densityAnimation('posterior', 0, 8), 8);
  close(densityAnimation('posterior', 0, 0), 0);
  close(densityAnimation('posterior', 550, 0), 1);
  close(densityAnimation('posterior', 550, 80), 0);
  close(densityAnimation('posterior', 81 * 550, 0), 0);
  close(densityAnimation('em', 0, 7), 7);
  close(densityAnimation('em', 31 * 1400, 7), 7);
  close(densityAnimation('smoothing', 0, 0.4), 0.4);
  for (let time = 0; time < 60000; time += 100) {
    const h = densityAnimation('smoothing', time, 0.4);
    assert.ok(h >= 0.12 && h <= 1.5);
  }
});
