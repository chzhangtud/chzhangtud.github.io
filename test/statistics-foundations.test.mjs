import test from 'node:test';
import assert from 'node:assert/strict';
import {
  binomialPmf, poissonPmf, normalPdf, normalCdf, normalInterval,
  standardizedUniformPdf, gaussianConditional, bernoulliEntropy,
  bernoulliCrossEntropy, bernoulliKl, animationValue,
} from '../assets/js/statistics-foundations.mjs';

const close = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
};

function integrate(fn, a, b, steps = 12000) {
  const dx = (b - a) / steps;
  let value = (fn(a) + fn(b)) / 2;
  for (let i = 1; i < steps; i += 1) value += fn(a + i * dx);
  return value * dx;
}

test('binomial probabilities normalize and reproduce the stated moments, including endpoint probabilities', () => {
  for (const n of [1, 10, 40]) {
    for (const theta of [0, 0.02, 0.25, 0.5, 0.98, 1]) {
      let mass = 0;
      let mean = 0;
      let second = 0;
      for (let k = 0; k <= n; k += 1) {
        const p = binomialPmf(k, n, theta);
        mass += p;
        mean += k * p;
        second += k ** 2 * p;
      }
      close(mass, 1);
      close(mean, n * theta);
      close(second - mean ** 2, n * theta * (1 - theta));
    }
  }
  close(binomialPmf(3, 10, 0.25), 0.25028228759765625);
});

test('Poisson probabilities retain their original mass and converge to binomial rare-event counts', () => {
  for (const lambda of [0.2, 3, 15]) {
    let mass = 0;
    let mean = 0;
    for (let k = 0; k <= 150; k += 1) {
      const p = poissonPmf(k, lambda);
      mass += p;
      mean += k * p;
    }
    close(mass, 1);
    close(mean, lambda);
  }
  close(poissonPmf(0, 0.4), Math.exp(-0.4));
  for (let k = 0; k <= 6; k += 1) close(binomialPmf(k, 1000, 0.003), poissonPmf(k, 3), 0.0004);
});

test('normal interval area agrees with reference values and reordered endpoints', () => {
  close(normalPdf(0), 1 / Math.sqrt(2 * Math.PI));
  close(normalCdf(0), 0.5, 1e-7);
  close(normalCdf(1.96), 0.9750021048517795, 1e-7);
  close(normalInterval(-1, 1, 0, 1), 0.6826894921370859, 2e-7);
  close(normalInterval(-1, 1, 0, 1), normalInterval(1, -1, 0, 1));
  close(normalInterval(1, 1, 0, 1), 0);
  assert.ok(normalPdf(0, 0, 0.2) > 1);
  close(integrate((x) => normalPdf(x, -2, 0.2), -4, 0), 1, 1e-7);
});

test('exact standardized uniform sums normalize, have mean zero and variance one, and approach a Gaussian', () => {
  for (let n = 1; n <= 12; n += 1) {
    const support = Math.sqrt(3 * n);
    const pdf = (z) => standardizedUniformPdf(z, n);
    close(integrate(pdf, -support, support), 1, 1e-6);
    close(integrate((z) => z * pdf(z), -support, support), 0, 1e-7);
    close(integrate((z) => z ** 2 * pdf(z), -support, support), 1, 1e-6);
    close(pdf(0.7), pdf(-0.7), 1e-9);
    close(pdf(support + 0.01), 0);
  }
  const error = (n) => integrate((z) => Math.abs(standardizedUniformPdf(z, n) - normalPdf(z)), -7, 7);
  assert.ok(error(12) < error(2) / 5);
});

test('Gaussian conditionals preserve the marginal at zero correlation and update both signs correctly', () => {
  assert.deepEqual(gaussianConditional(0, 2), { mean: 0, variance: 1 });
  const positive = gaussianConditional(0.8, 1.5);
  close(positive.mean, 1.2);
  close(positive.variance, 0.36);
  const negative = gaussianConditional(-0.8, 1.5);
  close(negative.mean, -1.2);
  close(negative.variance, 0.36);
});

test('entropy, cross-entropy, and KL obey endpoint conventions, decomposition, and asymmetry', () => {
  close(bernoulliEntropy(0), 0);
  close(bernoulliEntropy(1), 0);
  close(bernoulliEntropy(0.5), Math.log(2));
  close(bernoulliCrossEntropy(0, 0), 0);
  close(bernoulliCrossEntropy(1, 1), 0);
  assert.equal(bernoulliCrossEntropy(0.2, 0), Infinity);
  assert.equal(bernoulliCrossEntropy(0.8, 1), Infinity);
  for (const p of [0, 0.01, 0.2, 0.5, 0.99, 1]) {
    for (const q of [0.01, 0.2, 0.5, 0.99]) {
      const kl = bernoulliKl(p, q);
      assert.ok(kl >= -1e-12);
      close(bernoulliEntropy(p) + kl, bernoulliCrossEntropy(p, q));
    }
    close(bernoulliKl(p, p), 0);
  }
  assert.ok(Math.abs(bernoulliKl(0.2, 0.6) - bernoulliKl(0.6, 0.2)) > 0.01);
});

test('animation cycles keep parameters valid and resume from the selected starting value', () => {
  close(animationValue('conditional', 0, 0.65), 0.65);
  close(animationValue('conditional', 0, -0.9), -0.9);
  for (let time = 0; time < 60000; time += 100) {
    const rho = animationValue('conditional', time, 0.65);
    assert.ok(rho >= -0.9 && rho <= 0.9);
    assert.ok(gaussianConditional(rho, 1).variance > 0);
  }
  close(animationValue('clt', 0, 5), 5);
  close(animationValue('clt', 1800, 5), 6);
  close(animationValue('clt', 1800 * 12, 5), 5);
  close(animationValue('clt', 1800, 12), 1);
});
