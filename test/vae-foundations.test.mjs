import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { gaussianKl, variationalGap, normalSamples, reparameterizedCost,
  linearPosterior, forward, encode, predictiveSample } from '../assets/js/vae-foundations.mjs';

const close = (actual, expected, tolerance = 1e-7) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
const model = JSON.parse(readFileSync(new URL('../assets/data/vae-toy-model.json', import.meta.url), 'utf8'));

test('Gaussian KL vanishes at equality and agrees with known special cases', () => {
  close(gaussianKl(0, 0), 0);
  close(gaussianKl(2, 0), 2);
  close(gaussianKl(0, Math.log(4)), 0.5 * (3 - Math.log(4)));
  close(gaussianKl(3, Math.log(0.7), 3, 0.7), 0);
});

test('numerical posterior KL recovers an analytic Gaussian case and distinguishes bimodal approximations', () => {
  close(variationalGap(0.8, 1.2, 0), gaussianKl(0.8, 2 * Math.log(1.2), 0, 0.65 ** 2), 1e-6);
  close(variationalGap(0, 0.65, 0), 0);
  assert.ok(variationalGap(2, 0.65, 2) < variationalGap(0, 1, 2));
});

test('fixed-noise pathwise gradients agree with finite differences of the actual sample objective', () => {
  const noise = normalSamples(41);
  const mu = 0.4, logvar = -0.6, h = 1e-5;
  const result = reparameterizedCost(mu, logvar, noise);
  close(result.dmu, (reparameterizedCost(mu + h, logvar, noise).cost
    - reparameterizedCost(mu - h, logvar, noise).cost) / (2 * h));
  close(result.dlogvar, (reparameterizedCost(mu, logvar + h, noise).cost
    - reparameterizedCost(mu, logvar - h, noise).cost) / (2 * h));
  const balanced = [-1, 1];
  const exact = reparameterizedCost(mu, logvar, balanced);
  close(exact.cost, exact.exactCost); close(exact.dmu, exact.exactDmu);
  close(exact.dlogvar, exact.exactDlogvar);
});

test('sample prefixes stay fixed as L changes and normal moments are plausible', () => {
  assert.deepEqual(normalSamples(8), normalSamples(16).slice(0, 8));
  assert.notDeepEqual(normalSamples(8, 47), normalSamples(8, 48));
  const draws = normalSamples(20000);
  close(draws.reduce((a, b) => a + b) / draws.length, 0, 0.03);
  close(draws.reduce((a, b) => a + b * b) / draws.length, 1, 0.04);
});

test('amortized demonstration matches conjugate Gaussian inference', () => {
  const p = linearPosterior(2);
  close(p.mu, 2 / 1.36); close(p.variance, 0.36 / 1.36);
  close(gaussianKl(p.mu, Math.log(p.variance), p.mu, p.variance), 0);
});

test('browser encoder and decoder reproduce PyTorch forward values on held-out observations', () => {
  for (let i = 0; i < model.reference.inputs.length; i += 1) {
    const q = encode(model, model.reference.inputs[i]);
    close(q.mu, model.reference.mu[i][0], 2e-6);
    close(q.logvar, model.reference.logvar[i][0], 2e-6);
    const decoded = forward(model.decoder, [q.mu]);
    decoded.forEach((v, j) => close(v, model.reference.decodedMean[i][j], 2e-6));
    assert.ok(gaussianKl(q.mu, q.logvar) >= 0);
  }
});

test('generated observations include the declared noise, and held-out training metrics improve', () => {
  const mean = forward(model.decoder, [0.7]);
  const observed = predictiveSample(model, 0.7, [1, -2]);
  close(observed[0] - mean[0], model.tau);
  close(observed[1] - mean[1], -2 * model.tau);
  assert.equal(model.observations.length, 80);
  assert.ok(model.history.at(-1).negativeElbo < model.history[0].negativeElbo / 3);
  for (const entry of model.history) {
    close(entry.negativeElbo, entry.nll + entry.kl, 1e-4);
    assert.ok(entry.kl >= 0 && Number.isFinite(entry.negativeElbo));
  }
});
