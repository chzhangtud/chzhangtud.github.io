import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { orbitMatrix } from '../assets/js/reconstruction.mjs';

const root = new URL('../assets/data/reconstruction/', import.meta.url);
const json = file => JSON.parse(readFileSync(new URL(file, root), 'utf8'));
const manifest = json('manifest.json');

test('display geometry retains declared sparse and mesh counts, and valid faces', () => {
  for (const [file, count] of [['sparse.bin', manifest.sparsePoints], ['dense.bin', manifest.displayDensePoints], ['mesh.bin', manifest.meshVertices]]) {
    const bytes = readFileSync(new URL(file, root));
    assert.equal(bytes.length, count * 24);
    for (let offset = 0; offset < bytes.length; offset += 4) assert.ok(Number.isFinite(bytes.readFloatLE(offset)));
  }
  const faces = readFileSync(new URL('faces.bin', root));
  assert.equal(faces.length, manifest.meshFaces * 12);
  for (let offset = 0; offset < faces.length; offset += 4) assert.ok(faces.readUInt32LE(offset) < manifest.meshVertices);
  assert.equal(manifest.densePoints, 425342);
  assert.equal(manifest.displayDensePoints, 65000);
});

test('matches contain measured inliers and outliers within both images', () => {
  const data = json('features.json');
  assert.ok(data.candidates > data.inliers && data.inliers > data.matches.length);
  assert.ok(data.matches.some(m => m.inlier) && data.matches.some(m => !m.inlier));
  for (const m of data.matches) for (const [x, y] of [m.a, m.b]) {
    assert.ok(x >= 0 && x < data.width && y >= 0 && y < data.height);
  }
});

test('bundle readout matches all-view 2D RMS and optimization reduces error', () => {
  const data = json('bundle.json');
  for (const frame of data.frames) {
    let squared = 0, count = 0;
    frame.projections.forEach((view, c) => view.forEach((q, p) => {
      squared += (q[0] - data.observed[c][p][0]) ** 2 + (q[1] - data.observed[c][p][1]) ** 2; count++;
    }));
    assert.ok(Math.abs(Math.sqrt(squared / count) - frame.rms) < .002);
  }
  assert.ok(data.frames.at(-1).rms < data.frames[0].rms / 20);
  assert.ok(data.frames.at(-1).rms > 0, 'noisy observations should not be reported as exact');
});

test('orbit projection keeps aspect and depth ordering consistent', () => {
  const m = orbitMatrix(0, 0, 1, 2);
  assert.equal(m[0], .5); assert.equal(m[5], 1);
  assert.ok(m[10] < 0, 'front points at positive Z must be nearer in depth');
  const turned = orbitMatrix(Math.PI / 2, .2, 1, 1);
  assert.ok([...turned].every(Number.isFinite));
  assert.ok(Math.abs(turned[8] - 1) < 1e-6);
});

test('plane sweep projects reference-camera depth through the recovered calibrated pose', () => {
  const data = json('plane-sweep.json');
  assert.ok(data.poseInliers > 50);
  assert.ok(Math.abs(Math.hypot(...data.translation) - 1) < 1e-8);
  assert.equal(data.inverseDepths.length, 161);
  for (let i = 1; i < data.inverseDepths.length; i++) assert.ok(data.inverseDepths[i] > data.inverseDepths[i - 1]);
  const k = data.calibration;
  for (const item of data.cases) for (const index of [0, 80, 160]) {
    // Independent ray -> 3D -> transformed 3D -> pixel calculation.
    const z = 1 / data.inverseDepths[index];
    const point = [(item.center[0] - k[0][2]) / k[0][0] * z,
      (item.center[1] - k[1][2]) / k[1][1] * z, z];
    const support = data.rotation.map((row, i) => row.reduce((sum, v, j) => sum + v * point[j], data.translation[i]));
    const pixel = [k[0][0] * support[0] / support[2] + k[0][2], k[1][1] * support[1] / support[2] + k[1][2]];
    for (const window of Object.values(item.windows)) {
      const measured = window.samples[index].center;
      assert.ok(Math.hypot(pixel[0] - measured[0], pixel[1] - measured[1]) < .002);
    }
  }
});

test('real-photo cost experiment preserves weak-texture evidence instead of claiming ground truth', () => {
  const data = json('plane-sweep.json');
  for (const item of data.cases) for (const window of Object.values(item.windows)) {
    assert.equal(window.samples.length, data.inverseDepths.length);
    for (const row of window.samples) {
      assert.ok(row.ncc === null || row.ncc >= 0 && row.ncc <= 2);
      assert.ok(row.ssd === null || row.ssd >= 0);
    }
  }
  assert.ok(data.cases.find(c => c.key === 'sky').windows['21'].referenceStd < 2);
  assert.ok(data.cases.find(c => c.key === 'corner').windows['21'].referenceStd > 10);
  assert.ok(Math.min(...data.cases[0].windows['21'].samples.map(s => s.ncc ?? 2)) < .1);
});
