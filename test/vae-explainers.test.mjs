import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { gaussianElbo, sensorApproximation, neuron, gradientReplicates } from '../assets/js/vae-explainers.mjs';
import { normalPdf } from '../assets/js/statistics-foundations.mjs';
import { encodeDigit, decodeDigit, interpolate, bernoulliPixels } from '../assets/js/vae-mnist.mjs';

const close = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
const model = JSON.parse(readFileSync(new URL('../assets/data/vae-mnist-model.json', import.meta.url), 'utf8'));

test('the interactive ELBO obeys both decompositions and distinguishes the two KLs', () => {
  for (const x of [-2, 0, 1.5]) for (const mu of [-1, 0.3, 2]) for (const sigma of [0.2, 0.7, 1.5]) {
    const r = gaussianElbo(x, mu, sigma);
    close(r.evidence, r.elbo + r.posteriorKl);
    close(r.elbo, r.reconstruction - r.priorKl);
    assert.ok(r.posteriorKl >= -1e-10 && r.priorKl >= -1e-10);
  }
  const exact = gaussianElbo(1, 1 / 1.36, Math.sqrt(0.36 / 1.36));
  close(exact.posteriorKl, 0);
  assert.ok(exact.priorKl > 0.1);
});

test('temperature and bias posterior moments agree with integration of the measurement joint', () => {
  const step = 0.07;
  for (const x of [-1.5, 0, 1]) for (const tau of [0.35, 0.6, 1.3]) {
    let total = 0, first = 0, second = 0, cross = 0;
    for (let i = 0; i < 200; i++) for (let j = 0; j < 200; j++) {
      const z = -7 + (i + 0.5) * step, b = -7 + (j + 0.5) * step;
      const mass = normalPdf(z) * normalPdf(b) * normalPdf(x, z + b, tau) * step ** 2;
      total += mass; first += mass * z; second += mass * z * z; cross += mass * z * b;
    }
    const result = sensorApproximation(x, tau);
    close(total, normalPdf(x, 0, Math.sqrt(2 + tau * tau)), 1e-8);
    close(first / total, result.mean, 1e-8);
    close(second / total - result.mean ** 2, result.marginalVariance, 1e-8);
    close(cross / total - result.mean ** 2, result.covariance, 1e-8);
  }
});

test('independent sensor approximation minimizes posterior KL rather than matching marginal variance', () => {
  const tau = 0.6, x = 1, step = 0.07;
  for (const match of [false, true]) {
    const result = sensorApproximation(x, tau, match);
    let kl = 0;
    const logEvidence = Math.log(normalPdf(x, 0, Math.sqrt(2 + tau * tau)));
    for (let i = 0; i < 200; i++) for (let j = 0; j < 200; j++) {
      const z = -7 + (i + 0.5) * step, b = -7 + (j + 0.5) * step;
      const q = normalPdf(z, result.mean, Math.sqrt(result.variance)) * normalPdf(b, result.mean, Math.sqrt(result.variance));
      const logJoint = Math.log(normalPdf(z)) + Math.log(normalPdf(b)) + Math.log(normalPdf(x, z + b, tau));
      kl += q * (Math.log(q) - logJoint + logEvidence) * step ** 2;
    }
    close(kl, result.posteriorKl, 1e-8);
  }
  const optimal = sensorApproximation(x, tau), matched = sensorApproximation(x, tau, true);
  assert.ok(optimal.posteriorKl < matched.posteriorKl);
  assert.ok(optimal.variance < optimal.marginalVariance);
  close(optimal.mean, 1 / 2.36);
  close(optimal.variance, 0.36 / 1.36);
  close(2 * optimal.marginalVariance + 2 * optimal.covariance, 0.72 / 2.36);
});

test('the shown backpropagation gradient matches the loss and improves it for small steps', () => {
  for (const w of [-0.8, 0.2, 1.2]) {
    const x = 1.3, h = 1e-5, result = neuron(w, x);
    close(result.gradient, (neuron(w + h, x).loss - neuron(w - h, x).loss) / (2 * h));
    assert.ok(neuron(w - 0.05 * result.gradient, x).loss < result.loss);
  }
});

test('repeated pathwise gradients have the predicted mean and sampling scale', () => {
  for (const n of [1, 16, 128]) {
    const values = gradientReplicates(0, 1, n, 4096);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    close(mean, -2, 0.1);
    close(variance, 4 / n, 0.05 * 4 / n);
  }
});

test('quantized browser MNIST weights reproduce PyTorch on independent test inputs', () => {
  for (let i = 0; i < 3; i++) {
    const pixels = Array.from(model.images[i], Number);
    assert.equal(pixels.length, 784);
    assert.ok(pixels.every(v => v === 0 || v === 1));
    const q = encodeDigit(model, pixels);
    q.mu.forEach((v, j) => close(v, model.reference.mu[i][j], 2e-5));
    q.logvar.forEach((v, j) => close(v, model.reference.logvar[i][j], 2e-5));
    const probability = decodeDigit(model, q.mu);
    probability.forEach((v, j) => close(v, model.reference.probabilities[i][j], 3e-5));
  }
});

test('interpolation preserves endpoints, and observation sampling produces actual binary pixels', () => {
  const a = [1, -2], b = [-3, 4];
  assert.deepEqual(interpolate(a, b, 0), a);
  assert.deepEqual(interpolate(a, b, 1), b);
  assert.deepEqual(interpolate(a, b, 0.5), [-1, 1]);
  assert.deepEqual(bernoulliPixels([0, 1, 0, 1]), [0, 1, 0, 1]);
  const probabilities = Array(20000).fill(0.3);
  close(bernoulliPixels(probabilities).reduce((a, b) => a + b) / probabilities.length, 0.3, 0.015);
});

test('the MNIST export records separated training, validation and final test metrics', () => {
  assert.equal(model.training.trainCount, 55000);
  assert.equal(model.training.validationCount, 5000);
  assert.equal(model.training.testCount, 10000);
  assert.equal(model.training.klWeight, 1);
  assert.equal(model.history.length, 17);
  assert.ok(model.history.at(-1).negativeElbo < model.history[0].negativeElbo / 2);
  close(model.testMetrics.negativeElbo, model.testMetrics.nll + model.testMetrics.kl);
  assert.ok(model.testMetrics.negativeElbo > 0 && model.testMetrics.negativeElbo < 300);
});
