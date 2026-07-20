import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildNaturalCubicSpline,
  chebyshevNodes,
  evaluateLagrange,
  evaluateLinearSpline,
  evaluateNewton,
  newtonDividedDifferences,
} from '../assets/js/interpolation-lab.mjs';

const closeTo = (actual, expected, tolerance = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test('polynomial interpolation recovers a quadratic through its sample nodes', () => {
  const xs = [-2, -0.5, 1, 3];
  const ys = xs.map((x) => x * x - 2 * x + 1);
  const coeffs = newtonDividedDifferences(xs, ys);

  for (const x of [-1.5, 0, 2.25]) {
    const expected = x * x - 2 * x + 1;
    closeTo(evaluateLagrange(xs, ys, x), expected);
    closeTo(evaluateNewton(xs, coeffs, x), expected);
  }
});

test('Chebyshev nodes stay in the interval and cluster near both ends', () => {
  const nodes = chebyshevNodes(-5, 5, 8);

  assert.equal(nodes.length, 8);
  assert.ok(nodes.every((x) => x >= -5 && x <= 5));
  assert.ok(nodes[0] < nodes[1]);
  assert.ok(nodes.at(-2) < nodes.at(-1));
  assert.ok(nodes[1] - nodes[0] < nodes[4] - nodes[3]);
  assert.ok(nodes.at(-1) - nodes.at(-2) < nodes[4] - nodes[3]);
});

test('linear and natural cubic spline pass through every control point', () => {
  const xs = [0, 0.5, 1.2, 2];
  const ys = [0, 1, -0.25, 0.5];
  const spline = buildNaturalCubicSpline(xs, ys);

  for (let i = 0; i < xs.length; i += 1) {
    closeTo(evaluateLinearSpline(xs, ys, xs[i]), ys[i]);
    closeTo(spline.evaluate(xs[i]), ys[i]);
  }
});

test('natural cubic spline uses zero second derivative at the boundaries', () => {
  const xs = [0, 0.5, 1.2, 2];
  const ys = [0, 1, -0.25, 0.5];
  const spline = buildNaturalCubicSpline(xs, ys);

  closeTo(spline.secondDerivatives[0], 0);
  closeTo(spline.secondDerivatives.at(-1), 0);
});
