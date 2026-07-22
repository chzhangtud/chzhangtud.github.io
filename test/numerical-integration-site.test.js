import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const article = readFileSync('Math/_posts/zh/2026-07-22-numerical-integration-lab.zh.md', 'utf8');
const normalizedArticle = article.replace(/\r\n/g, '\n');
const englishArticle = readFileSync('Math/_posts/zh/2026-07-22-numerical-integration-lab.en.md', 'utf8');
const normalizedEnglishArticle = englishArticle.replace(/\r\n/g, '\n');

test('numerical integration article publishes the second Chinese lecture page', () => {
  assert.match(article, /title: "数值分析讲义（二）：数值积分"/);
  assert.match(article, /lang: "zh"/);
  assert.match(article, /permalink: \/zh\/numerical-integration-lab\//);
  assert.match(article, /en_link: \/en\/numerical-integration-lab\//);
  assert.match(article, /Read in English/);
  assert.match(article, /categories:\n  - Math/);
  assert.match(article, /Numerical Integration/);
});

test('numerical integration article publishes the second English lecture page', () => {
  assert.match(englishArticle, /title: "Numerical Analysis Lecture \(II\): Numerical Integration"/);
  assert.match(englishArticle, /lang: "en"/);
  assert.match(englishArticle, /permalink: \/en\/numerical-integration-lab\//);
  assert.match(englishArticle, /zh_link: \/zh\/numerical-integration-lab\//);
  assert.match(englishArticle, /中文版/);
  assert.match(englishArticle, /You may want to read \[Numerical Analysis Lecture \(I\): Interpolation Methods\]\(\{\{ '\/en\/interpolation-lab\/' \| relative_url \}\}\)/);
});

test('numerical integration article preserves the chapter structure', () => {
  const headings = normalizedArticle
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));

  assert.deepEqual(headings, [
    '## 2.1 Newton-Cotes 求积',
    '### 2.1.1 闭型 Newton-Cotes 求积',
    '### 2.1.2 开型 Newton-Cotes 求积',
    '## 2.2 复化 Newton-Cotes 公式',
  ]);

  assert.match(article, /\*\*数值积分\*\*/);
  assert.match(article, /\*\*闭型 Newton-Cotes 公式\*\*/);
  assert.match(article, /\*\*开型 Newton-Cotes 公式\*\*/);
  assert.match(article, /\*\*复化闭型 Newton-Cotes 公式\*\*/);
});

test('English numerical integration article preserves the chapter structure', () => {
  const headings = normalizedEnglishArticle
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));

  assert.deepEqual(headings, [
    '## 2.1 Newton-Cotes Quadrature',
    '### 2.1.1 Closed Newton-Cotes Quadrature',
    '### 2.1.2 Open Newton-Cotes Quadrature',
    '## 2.2 Composite Newton-Cotes Formulas',
  ]);

  assert.match(englishArticle, /\*\*Numerical Integration\*\*/);
  assert.match(englishArticle, /\*\*Closed Newton-Cotes formula\*\*/);
  assert.match(englishArticle, /\*\*Open Newton-Cotes formula\*\*/);
  assert.match(englishArticle, /\*\*Composite closed Newton-Cotes formula\*\*/);
});

test('numerical integration article starts with a chapter one reading link', () => {
  assert.doesNotMatch(article, /\*\*写在前面。\*\*/);
  assert.match(article, /建议先阅读 \[数值分析讲义（一）：插值方法\]\(\{\{ '\/zh\/interpolation-lab\/' \| relative_url \}\}\)/);
  assert.match(article, /Newton-Cotes 求积会直接用到插值多项式和 Lagrange 基函数/);
});

test('English numerical integration diagrams are localized', () => {
  const figureCaptions = [...englishArticle.matchAll(/\*\*Diagram 2\.\d:\*\*/g)];
  const inlineSvgs = [...englishArticle.matchAll(/<svg viewBox=/g)];
  const imageTitles = [...englishArticle.matchAll(/role="img" aria-labelledby=/g)];

  assert.equal(figureCaptions.length, 3);
  assert.equal(inlineSvgs.length, 3);
  assert.equal(imageTitles.length, 3);
  assert.match(englishArticle, /Trapezoidal Rule and Simpson's Rule/);
  assert.match(englishArticle, /Midpoint Rectangle Rule/);
  assert.match(englishArticle, /trapezoid: O\(h\^2\)/);
  assert.match(englishArticle, /Simpson: O\(h\^4\)/);
  assert.doesNotMatch(englishArticle, /示意图/);
  assert.doesNotMatch(englishArticle, /梯形规则/);
});

test('numerical integration article includes focused explanatory diagrams', () => {
  const figureCaptions = [...article.matchAll(/\*\*示意图 2\.\d：\*\*/g)];
  const inlineSvgs = [...article.matchAll(/<svg viewBox=/g)];
  const imageTitles = [...article.matchAll(/role="img" aria-labelledby=/g)];

  assert.equal(figureCaptions.length, 3);
  assert.equal(inlineSvgs.length, 3);
  assert.equal(imageTitles.length, 3);
  assert.match(article, /梯形规则与 Simpson 规则/);
  assert.match(article, /中点矩形规则/);
  assert.match(article, /梯形：O\(h²\)/);
  assert.match(article, /Simpson：O\(h⁴\)/);
});

test('English numerical integration article configures formulas and mobile formula overflow', () => {
  assert.match(englishArticle, /inlineMath: \[\['\$', '\$'\], \['\\\\\(', '\\\\\)'\]\]/);
  assert.match(englishArticle, /tex-mml-chtml\.js/);
  assert.match(englishArticle, /mjx-container\[display='true'\]/);
  assert.match(englishArticle, /overflow-x:\s*auto/);
  assert.match(englishArticle, /\\int_a\^b f\(x\)\\,dx/);
  assert.match(englishArticle, /R_N\^\{\(2\)\}\(f\)/);
});

test('numerical integration article configures formulas and mobile formula overflow', () => {
  assert.match(article, /inlineMath: \[\['\$', '\$'\], \['\\\\\(', '\\\\\)'\]\]/);
  assert.match(article, /tex-mml-chtml\.js/);
  assert.match(article, /mjx-container\[display='true'\]/);
  assert.match(article, /overflow-x:\s*auto/);
  assert.match(article, /\\int_a\^b f\(x\)\\,dx/);
  assert.match(article, /R_N\^\{\(2\)\}\(f\)/);
});

test('English numerical integration article keeps source and reuse boundaries explicit', () => {
  assert.match(englishArticle, /mathe3-script-2011-SoSe\.pdf/);
  assert.match(englishArticle, /Unlicense notice/);
  assert.match(englishArticle, /personal study, translation, and knowledge organization/);
  assert.match(englishArticle, /do not represent the original authors or any official position/);
  assert.match(englishArticle, /non-commercial study, discussion, and citation/);
  assert.match(englishArticle, /original authors, repository, and license notices/);
});

test('numerical integration article keeps source and reuse boundaries explicit', () => {
  assert.match(article, /mathe3-script-2011-SoSe\.pdf/);
  assert.match(article, /The Unlicense/);
  assert.match(article, /个人学习、翻译与知识整理/);
  assert.match(article, /不代表原作者或官方立场/);
  assert.match(article, /非商业学习、交流和引用/);
  assert.match(article, /原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准/);
});
