import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const article = readFileSync('Math/_posts/zh/2026-07-20-interpolation-lab.zh.md', 'utf8');
const normalizedArticle = article.replace(/\r\n/g, '\n');
const englishArticle = readFileSync('Math/_posts/zh/2026-07-20-interpolation-lab.en.md', 'utf8');
const normalizedEnglishArticle = englishArticle.replace(/\r\n/g, '\n');
const script = readFileSync('assets/js/interpolation-lab.mjs', 'utf8');
const styles = readFileSync('assets/css/interpolation-lab.css', 'utf8');

test('interpolation article keeps only the interpolation chapter content', () => {
  assert.match(article, /title: "数值分析讲义（一）：插值方法"/);
  assert.match(article, /en_link: \/en\/interpolation-lab\//);
  assert.match(article, /Read in English/);
  assert.match(article, /基本是对课程讲义第一章插值部分的中文整理与翻译/);
  assert.match(normalizedArticle, /欢迎勘误。\n\n---\n\n\*\*插值\*\*/);
  assert.match(article, /\*\*插值\*\*/);
  assert.doesNotMatch(article, /# 电气工程数学 IV \/ 计算机科学数学 III/);
  assert.doesNotMatch(article, /## 数值数学/);
  assert.doesNotMatch(article, /工程科学和自然科学中的许多问题都可以用数学模型描述。/);
  assert.doesNotMatch(article, /2\. 数值积分/);
  assert.doesNotMatch(article, /10\. 多元分布和随机变量之和/);
  assert.match(article, /## 1\.2 样条插值/);
  assert.match(article, /三次样条的最小性质/);
});

test('English interpolation article mirrors the chapter and links back to Chinese', () => {
  assert.match(englishArticle, /title: "Numerical Analysis Lecture \(I\): Interpolation Methods"/);
  assert.match(englishArticle, /lang: "en"/);
  assert.match(englishArticle, /permalink: \/en\/interpolation-lab\//);
  assert.match(englishArticle, /zh_link: \/zh\/interpolation-lab\//);
  assert.match(englishArticle, /中文版/);
  assert.match(normalizedEnglishArticle, /corrections are welcome\.\n\n---\n\n\*\*Interpolation\*\*/);
  assert.match(englishArticle, /## 1\.1 Polynomial Interpolation/);
  assert.match(englishArticle, /## 1\.2 Spline Interpolation/);
  assert.match(englishArticle, /\*\*References\*\*/);
  assert.doesNotMatch(englishArticle, /# 电气工程数学 IV/);

  const figures = [...englishArticle.matchAll(/data-interpolation-figure="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(figures, ['basis', 'sine-error', 'runge-equal', 'runge-chebyshev', 'spline']);
  assert.equal((englishArticle.match(/data-interpolation-lang="en"/g) || []).length, 5);
});

test('interpolation article only uses markdown headings for numbered sections', () => {
  const headings = article
    .split(/\r?\n/)
    .filter((line) => /^#{1,6} /.test(line));

  assert.deepEqual(headings, [
    '## 1.1 多项式插值',
    '### 1.1.1 拉格朗日插值公式',
    '### 1.1.2 Newton 插值公式',
    '### 1.1.3 误差估计',
    '### 1.1.4 多项式插值的应用',
    '## 1.2 样条插值',
    '### 1.2.1 基础',
    '### 1.2.2 线性样条插值',
    '### 1.2.3 三次样条插值',
  ]);
});

test('interpolation article configures formulas for the page renderer', () => {
  assert.match(article, /inlineMath: \[\['\$', '\$'\], \['\\\\\(', '\\\\\)'\]\]/);
  assert.match(article, /tex-mml-chtml\.js/);
  assert.match(article, /\\lvert f\(x\)-\\Phi\(x\)\\rvert/);
});

test('interpolation article uses the same compact Chinese post font size', () => {
  assert.match(article, /body\s*\{\s*font-size: 14px;/);
});

test('mobile MathJax formulas scroll inside the article width', () => {
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*mjx-container/);
  assert.match(styles, /mjx-container\[display='true'\]\s*\{[\s\S]*max-width:\s*100%;/);
  assert.match(styles, /mjx-container\[display='true'\]\s*\{[\s\S]*overflow-x:\s*auto;/);
  assert.match(styles, /-webkit-overflow-scrolling:\s*touch;/);
});

test('interpolation article references available bibliography entries', () => {
  assert.doesNotMatch(article, /见例如 \[[^\]]+\]/);
  assert.match(article, /\*\*参考文献\*\*/);

  const bibliographyNumbers = new Set(
    [...article.matchAll(/^- \[(\d+)\]/gm)].map((match) => match[1]),
  );
  const citedNumbers = [...article.matchAll(/参考 \[([0-9,\s]+)\]/g)]
    .flatMap((match) => match[1].split(',').map((value) => value.trim()));

  assert.ok(citedNumbers.length > 0);
  for (const number of citedNumbers) {
    assert.ok(bibliographyNumbers.has(number), `missing bibliography entry ${number}`);
  }
});

test('interpolation article loads resources and only adds labs for original figures', () => {
  assert.match(article, /\/assets\/css\/interpolation-lab\.css/);
  assert.match(article, /\/assets\/js\/interpolation-lab\.mjs/);
  assert.doesNotMatch(article, /id="interpolation-lab"/);

  const figures = [...article.matchAll(/data-interpolation-figure="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(figures, ['basis', 'sine-error', 'runge-equal', 'runge-chebyshev', 'spline']);

  for (const figureNumber of ['1.1', '1.2', '1.3', '1.4', '1.5']) {
    const captionIndex = article.indexOf(`**图 ${figureNumber}：**`);
    const labIndex = article.indexOf('data-interpolation-figure=', captionIndex);
    assert.ok(captionIndex >= 0, `missing figure ${figureNumber} caption`);
    assert.ok(labIndex > captionIndex, `missing lab after figure ${figureNumber}`);
  }
});

test('interpolation article covers the expected comparison methods', () => {
  for (const label of ['拉格朗日', 'Newton', '等距插值节点', 'Chebyshev 节点', '线性样条', '三次样条']) {
    assert.match(article, new RegExp(label));
  }
});

test('interactive figures create SVG primitives in the SVG namespace', () => {
  const createSvgHelper = script.slice(script.indexOf('const createSvg'), script.indexOf('const setAttributes'));
  assert.match(createSvgHelper, /document\.createElementNS\(SVG_NS,\s*tag\)/);
  assert.doesNotMatch(createSvgHelper, /document\.createElement\(tag\)/);
});

test('interactive figures localize labels for English pages', () => {
  assert.match(script, /interpolationLang/);
  assert.match(script, /document\.documentElement\.lang/);
  assert.match(script, /Figure 1\.1 Lagrange Basis Functions/);
  assert.match(script, /Degree n/);
  assert.match(script, /Equidistant nodes/);
  assert.match(script, /Interpolation nodes/);
  assert.match(script, /Linear spline/);
  assert.match(script, /Natural cubic spline/);
  assert.match(script, /Error, max sampled value/);
});

test('interactive figures draw labeled axes with tick marks', () => {
  assert.match(script, /xAxisLabel/);
  assert.match(script, /yAxisLabel/);
  assert.match(script, /interpolation-lab__axis/);
  assert.match(script, /interpolation-lab__tick/);
  assert.match(script, /interpolation-lab__axis-label/);
  assert.match(script, /xTicks/);
  assert.match(script, /yTicks/);
  assert.match(styles, /\.interpolation-lab__axis/);
  assert.match(styles, /\.interpolation-lab__tick text/);
  assert.match(styles, /\.interpolation-lab__axis-label/);
});
