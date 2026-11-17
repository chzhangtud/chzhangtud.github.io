import assert from 'node:assert/strict';
import test from 'node:test';
import { mixture, posterior, marginalFlow, integrate, warp, chamferSquared, correspondence, chairPoints, chairState, normals } from '../assets/js/generative-models.mjs';

test('chair illustrations preserve endpoints and differentiate to the stated FM velocity', () => {
  const clean = chairPoints();
  assert.equal(clean.length, 768);
  assert.ok(clean.every(point => point.length === 3 && point.every(Number.isFinite)));
  assert.deepEqual(chairState(0).current, clean);
  assert.deepEqual(chairState(1, true).current, clean);
  const noise = normals(clean.length * 3);
  assert.deepEqual(chairState(0, true).current.flat(), noise);
  const h = 1e-5;
  const before = chairState(0.4 - h, true).current.flat();
  const after = chairState(0.4 + h, true).current.flat();
  clean.flat().forEach((value, i) => {
    assert.ok(Math.abs((after[i] - before[i]) / (2 * h) - (value - noise[i])) < 1e-9);
  });
  const diffusion = chairState(0.4);
  assert.ok(Math.abs(diffusion.a ** 2 + diffusion.b ** 2 - 1) < 1e-12);
});

test('analytic mixture score agrees with a numerical log-density derivative', () => {
  const h = 1e-5;
  for (const sigma of [0.1, 0.6, 2.5]) for (const x of [-3, -0.8, 0, 1.3, 4]) {
    const numeric = (Math.log(mixture(x + h, sigma).density) - Math.log(mixture(x - h, sigma).density)) / (2 * h);
    assert.ok(Math.abs(numeric - mixture(x, sigma).score) < 1e-6);
  }
});

test('ambiguous posterior is normalized and its mean can lie in a density valley', () => {
  const p = posterior(0, 1.5);
  let mass = 0, mean = 0;
  for (let x = -5; x < 5; x += 0.002) { mass += p.density(x) * 0.002; mean += x * p.density(x) * 0.002; }
  assert.ok(Math.abs(mass - 1) < 1e-8);
  assert.ok(Math.abs(mean - p.mean) < 1e-8);
  assert.ok(p.density(p.mean) < p.density(p.means[0]) / 100);
});

test('marginal flow satisfies the continuity equation rather than following individual training segments', () => {
  const h = 1e-5;
  const flux = (t, x) => { const m = marginalFlow(t, x); return m.velocity * m.density; };
  for (const t of [0.15, 0.5, 0.85]) for (const x of [-2.2, -0.7, 0.2, 1.4]) {
    const dt = (marginalFlow(t + h, x).density - marginalFlow(t - h, x).density) / (2 * h);
    const dx = (flux(t, x + h) - flux(t, x - h)) / (2 * h);
    assert.ok(Math.abs(dt + dx) < 1e-6, `${t},${x}: probability mass is not conserved`);
  }
});

test('rotation solver approaches the known endpoint at the expected order', () => {
  const field = (t, [x, y]) => [-Math.PI * y / 2, Math.PI * x / 2];
  const error = (steps, method) => { const p = integrate(field, [1, 0], steps, method).at(-1); return Math.hypot(p[1], p[2] - 1); };
  assert.ok(error(20, 'euler') / error(40, 'euler') > 1.9);
  assert.ok(error(20, 'heun') / error(40, 'heun') > 3.9);
  assert.ok(error(20, 'heun') < error(20, 'euler') / 10);
});

test('warp has the advertised local area determinant and invertible coordinates', () => {
  const h = 1e-5;
  for (const a of [-0.8, 0, 0.8]) for (const point of [[-0.7, 0.2], [0.5, -0.9]]) {
    const [x, y] = warp(point, a);
    assert.ok(Math.abs((y - 0.4 * Math.sin(2 * x)) / Math.exp(a * x) - point[1]) < 1e-10);
    const dx = warp([point[0] + h, point[1]], a).map((v, k) => (v - [x, y][k]) / h);
    const dy = warp([point[0], point[1] + h], a).map((v, k) => (v - [x, y][k]) / h);
    assert.ok(Math.abs(dx[0] * dy[1] - dx[1] * dy[0] - Math.exp(a * point[0])) < 1e-8);
  }
});

test('correspondence changes intermediate geometry while preserving endpoint sets', () => {
  for (const t of [0, 1]) assert.ok(chamferSquared(correspondence(t), correspondence(t, true)) < 1e-25);
  assert.ok(chamferSquared(correspondence(0.5), correspondence(0.5, true)) > 0.05);
});

test('squared Chamfer is blind to duplicated samples and scales quadratically', () => {
  assert.equal(chamferSquared([[0], [1]], [[0], [0], [1]]), 0);
  const a = [[0, 0], [1, 0]], b = [[0, 1], [1, 2]];
  assert.equal(chamferSquared(a.map(p => p.map(x => 2 * x)), b.map(p => p.map(x => 2 * x))), 4 * chamferSquared(a, b));
});
