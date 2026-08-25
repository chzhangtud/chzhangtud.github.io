const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const article = readFileSync(
  'Math/_posts/zh/2026-08-20-nonlinear-equations.zh.md',
  'utf8',
);
const englishArticle = readFileSync(
  'Math/_posts/zh/2026-08-20-nonlinear-equations.en.md',
  'utf8',
);
const previousChineseArticle = readFileSync(
  'Math/_posts/zh/2026-08-17-linear-systems-cholesky-conditioning.zh.md',
  'utf8',
);
const previousEnglishArticle = readFileSync(
  'Math/_posts/zh/2026-08-17-linear-systems-cholesky-conditioning.en.md',
  'utf8',
);

const normalize = (content) => content.replace(/\r\n/g, '\n');

function extractCopyrightSection(content, heading) {
  const normalized = normalize(content);
  const start = normalized.indexOf(heading);
  assert.notEqual(start, -1, 'Missing copyright heading: ' + heading);
  return normalized.slice(start).trim();
}

test('Example 5.2.4 protects inline absolute-value math from Kramdown tables', () => {
  assert.doesNotMatch(article, /\$\|x\^\{\(0\)\}\|>1\$/);
  assert.match(article, /\$\\lvert x\^\{\(0\)\}\\rvert>1\$/);
});

test('nonlinear Newton article includes localized static diagrams', () => {
  assert.match(article, /id="nonlinear-local-newton-title"/);
  assert.match(article, /id="nonlinear-global-newton-title"/);
  assert.match(article, /局部 Newton 方法的几何直观/);
  assert.match(article, /Armijo 步长选择示意/);
});

test('nonlinear Newton lecture has bilingual routes and series navigation', () => {
  assert.match(article, /title: "数值分析讲义（五）：非线性方程组"/);
  assert.match(article, /lang: "zh"/);
  assert.match(article, /permalink: \/zh\/nonlinear-equations\//);
  assert.match(article, /en_link: \/en\/nonlinear-equations\//);
  assert.match(article, /<a href="\{\{ page\.en_link \}\}" class="btn">Read in English<\/a>/);

  assert.match(englishArticle, /title: "Numerical Analysis Lecture \(V\): Nonlinear Systems of Equations"/);
  assert.match(englishArticle, /lang: "en"/);
  assert.match(englishArticle, /permalink: \/en\/nonlinear-equations\//);
  assert.match(englishArticle, /zh_link: \/zh\/nonlinear-equations\//);
  assert.match(englishArticle, /<a href="\{\{ page\.zh_link \}\}" class="btn">中文版<\/a>/);

  assert.ok(article.includes(
    "建议先阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part II]({{ '/zh/linear-systems-cholesky-conditioning/' | relative_url }})。",
  ));
  assert.ok(englishArticle.includes(
    "It is best to read [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part II]({{ '/en/linear-systems-cholesky-conditioning/' | relative_url }}) first.",
  ));
  assert.ok(article.includes(
    "返回阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part II]({{ '/zh/linear-systems-cholesky-conditioning/' | relative_url }})。",
  ));
  assert.ok(englishArticle.includes(
    "Return to [Numerical Analysis Lecture (IV): Solving Linear Systems and Matrix Computations Part II]({{ '/en/linear-systems-cholesky-conditioning/' | relative_url }}).",
  ));
  assert.ok(previousChineseArticle.includes(
    "继续阅读 [数值分析讲义（五）：非线性方程组]({{ '/zh/nonlinear-equations/' | relative_url }})。",
  ));
  assert.ok(previousEnglishArticle.includes(
    "Continue with [Numerical Analysis Lecture (V): Nonlinear Systems of Equations]({{ '/en/nonlinear-equations/' | relative_url }}).",
  ));
});

test('Chinese and English pages preserve the Chapter 5 section structure', () => {
  const chineseHeadings = normalize(article)
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));
  const englishHeadings = normalize(englishArticle)
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));

  assert.deepEqual(chineseHeadings, [
    '## 5.1 引言',
    '## 5.2 Newton 方法',
    '### 5.2.1 方法推导',
    '### 5.2.2 Newton 方法的超线性和二次局部收敛',
    '### 5.2.3 Newton 方法的全局化',
  ]);
  assert.deepEqual(englishHeadings, [
    '## 5.1 Introduction',
    "## 5.2 Newton's Method",
    '### 5.2.1 Derivation',
    "### 5.2.2 Local Superlinear and Quadratic Convergence of Newton's Method",
    "### 5.2.3 Globalization of Newton's Method",
  ]);
});

test('English Newton diagrams localize all visible explanatory text', () => {
  assert.equal((article.match(/<svg\b/g) || []).length, 2);
  assert.equal((englishArticle.match(/<svg\b/g) || []).length, 2);
  assert.match(englishArticle, /id="nonlinear-local-newton-en-title"/);
  assert.match(englishArticle, /id="nonlinear-local-newton-en-desc"/);
  assert.match(englishArticle, /id="nonlinear-global-newton-en-title"/);
  assert.match(englishArticle, /id="nonlinear-global-newton-en-desc"/);
  assert.match(englishArticle, /Figure 5\.1: Geometric intuition for local Newton's method/);
  assert.match(englishArticle, /Figure 5\.2: Armijo step-size selection in globalized Newton's method/);
  assert.match(englishArticle, /Function curve/);
  assert.match(englishArticle, /Tangent and next iterate/);
  assert.match(englishArticle, /Armijo decrease bound/);
  assert.match(englishArticle, /largest accepted step/);
  assert.match(englishArticle, /σ=1: rejected/);

  const cjkMatches = [...englishArticle.matchAll(/[\p{Script=Han}]+/gu)].map(
    (match) => match[0],
  );
  assert.deepEqual(cjkMatches, ['中文版']);
});

test('Chinese and English Chapter 5 reuse the preceding chapter copyright sections exactly', () => {
  assert.equal(
    extractCopyrightSection(article, '**来源、版权与使用说明**'),
    extractCopyrightSection(previousChineseArticle, '**来源、版权与使用说明**'),
  );
  assert.equal(
    extractCopyrightSection(englishArticle, '**Source, Copyright, and Usage Notes**'),
    extractCopyrightSection(previousEnglishArticle, '**Source, Copyright, and Usage Notes**'),
  );
});

test('Theorem 5.2.6 uses natural Chinese wording for compactness', () => {
  assert.ok(article.includes(
    '雅可比矩阵 $F\'(x)$ 都可逆，且 $N_f(x^{(0)})$ 是紧集（在 $\\mathbb{R}^n$ 中等价于有界且闭）',
  ));
  assert.doesNotMatch(article, /中的所有\s+\$\$?\s+都可逆/);
});
