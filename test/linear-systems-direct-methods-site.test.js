import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const part1Article = readFileSync('Math/_posts/zh/2026-07-29-linear-systems-direct-methods.zh.md', 'utf8');
const part2Article = readFileSync('Math/_posts/zh/2026-08-17-linear-systems-cholesky-conditioning.zh.md', 'utf8');
const part1EnglishArticle = readFileSync('Math/_posts/zh/2026-07-29-linear-systems-direct-methods.en.md', 'utf8');
const part2EnglishArticle = readFileSync('Math/_posts/zh/2026-08-17-linear-systems-cholesky-conditioning.en.md', 'utf8');
const normalizedPart1 = part1Article.replace(/\r\n/g, '\n');
const normalizedPart2 = part2Article.replace(/\r\n/g, '\n');
const normalizedPart1English = part1EnglishArticle.replace(/\r\n/g, '\n');
const normalizedPart2English = part2EnglishArticle.replace(/\r\n/g, '\n');

test('linear systems lecture is split into bilingual Part I and Part II pages', () => {
  assert.match(part1Article, /title: "数值分析讲义（四）：线性方程组\/矩阵运算数值求解 Part I"/);
  assert.match(part1Article, /lang: "zh"/);
  assert.match(part1Article, /date: 2026-07-29/);
  assert.match(part1Article, /permalink: \/zh\/linear-systems-direct-methods\//);
  assert.match(part1Article, /en_link: \/en\/linear-systems-direct-methods\//);
  assert.match(part1Article, /<a href="\{\{ page\.en_link \}\}" class="btn">Read in English<\/a>/);
  assert.match(normalizedPart1, /categories:\r?\n  - Math/);
  assert.match(part1Article, /Linear Systems/);
  assert.match(part1Article, /Matrix Factorization/);

  assert.match(part2Article, /title: "数值分析讲义（四）：线性方程组\/矩阵运算数值求解 Part II"/);
  assert.match(part2Article, /lang: "zh"/);
  assert.match(part2Article, /date: 2026-08-17/);
  assert.match(part2Article, /permalink: \/zh\/linear-systems-cholesky-conditioning\//);
  assert.match(part2Article, /en_link: \/en\/linear-systems-cholesky-conditioning\//);
  assert.match(part2Article, /<a href="\{\{ page\.en_link \}\}" class="btn">Read in English<\/a>/);
  assert.match(normalizedPart2, /categories:\r?\n  - Math/);
  assert.match(part2Article, /Linear Systems/);
  assert.match(part2Article, /Error Analysis/);
  assert.ok(part2Article.includes('a) $\\|A\\|=0$ 当且仅当 $A=0$；'));
  assert.ok(part2Article.includes('b) 对所有 $\\alpha\\in\\mathbb{R}$ 和所有 $A\\in\\mathbb{R}^{n\\times n}$，有 $\\|\\alpha A\\|=\\lvert\\alpha\\rvert\\,\\|A\\|$；'));
  assert.ok(part2Article.includes('c) 对所有 $A,B\\in\\mathbb{R}^{n\\times n}$，有三角不等式'));
  assert.doesNotMatch(part2Article, /^[abc]\).*\$\$/m);

  assert.match(part1EnglishArticle, /title: "Numerical Analysis Lecture \(IV\): Solving Linear Systems and Matrix Computations Part I"/);
  assert.match(part1EnglishArticle, /lang: "en"/);
  assert.match(part1EnglishArticle, /permalink: \/en\/linear-systems-direct-methods\//);
  assert.match(part1EnglishArticle, /zh_link: \/zh\/linear-systems-direct-methods\//);
  assert.match(part2EnglishArticle, /title: "Numerical Analysis Lecture \(IV\): Solving Linear Systems and Matrix Computations Part II"/);
  assert.match(part2EnglishArticle, /lang: "en"/);
  assert.match(part2EnglishArticle, /date: 2026-08-17/);
  assert.match(part2EnglishArticle, /permalink: \/en\/linear-systems-cholesky-conditioning\//);
  assert.match(part2EnglishArticle, /zh_link: \/zh\/linear-systems-cholesky-conditioning\//);
  assert.match(part2EnglishArticle, /<a href="\{\{ page\.zh_link \}\}" class="btn">中文版<\/a>/);
  assert.match(part2EnglishArticle, /Error Estimates and the Effect of Rounding Errors/);
  assert.match(part2EnglishArticle, /Cholesky factorization/);
  assert.match(part1EnglishArticle, /\u4e2d\u6587\u7248/);
});

test('linear systems split preserves the requested section boundaries', () => {
  const part1Headings = normalizedPart1
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));
  const part2Headings = normalizedPart2
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));
  const part1EnglishHeadings = normalizedPart1English
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));
  const part2EnglishHeadings = normalizedPart2English
    .split('\n')
    .filter((line) => /^#{1,6} /.test(line));

  assert.deepEqual(part1Headings, [
    '## 4.1 问题表述与引言',
    '## 4.2 Gauss 消去法与矩阵三角分解',
    '### 4.2.1 阶梯型方程组的求解',
    '### 4.2.2 Gauss 消去法',
    '### 4.2.3 主元策略',
    '### 4.2.4 Gauss 方法的实际实现',
    '### 4.2.5 完全主元搜索',
    '### 4.2.6 得到一个三角分解',
    '### 4.2.7 消去步骤的矩阵表示',
    '### 4.2.8 不需要主元搜索的矩阵类',
  ]);
  assert.deepEqual(part2Headings, [
    '## 4.3 Cholesky 方法',
    '## 4.4 误差估计与舍入误差影响',
    '### 4.4.1 扰动方程组的误差估计',
    '### 4.4.2 Gauss 方法的舍入误差分析',
  ]);

  assert.deepEqual(part1EnglishHeadings, [
    '## 4.1 Problem Statement and Introduction',
    '## 4.2 Gaussian Elimination and Matrix Triangular Factorization',
    '### 4.2.1 Solving Triangular Systems',
    '### 4.2.2 Gaussian Elimination',
    '### 4.2.3 Pivoting Strategies',
    '### 4.2.4 Practical Implementation of the Gaussian Method',
    '### 4.2.5 Complete Pivoting',
    '### 4.2.6 Obtaining a Triangular Factorization',
    '### 4.2.7 Matrix Representation of Elimination Steps',
    '### 4.2.8 Matrix Classes That Do Not Require Pivoting',
  ]);
  assert.deepEqual(part2EnglishHeadings, [
    '## 4.3 The Cholesky Method',
    '## 4.4 Error Estimates and the Effect of Rounding Errors',
    '### 4.4.1 Error Estimates for Perturbed Systems',
    '### 4.4.2 Rounding Error Analysis for Gaussian Elimination',
  ]);

  assert.doesNotMatch(part1Article, /^## 4\.3/m);
  assert.doesNotMatch(part1Article, /^## 4\.4/m);
  assert.doesNotMatch(part2Article, /^## 4\.1/m);
  assert.doesNotMatch(part1EnglishArticle, /^## 4\.3/m);
  assert.doesNotMatch(part1EnglishArticle, /^## 4\.4/m);
  assert.doesNotMatch(part2Article, /^## 4\.2/m);
  assert.doesNotMatch(part2EnglishArticle, /^## 4\.1/m);
  assert.doesNotMatch(part2EnglishArticle, /^## 4\.2/m);
  assert.match(part1Article, /\*\*算法 4\.2\.4：带列主元搜索的 Gauss 消去法\*\*/);
  assert.match(part1Article, /\*\*算法 4\.2\.6：带完全主元搜索的 Gauss 消去法\*\*/);
  assert.match(part2Article, /\*\*算法 4\.3\.3：用于计算分解 \$LL\^T=A\$ 的 Cholesky 方法\*\*/);
  assert.match(part2Article, /\*\*定理 4\.4\.4（矩阵和右端项扰动的影响）\*\*/);
  assert.match(part2EnglishArticle, /\*\*Algorithm 4\.3\.3: Cholesky method for computing the factorization/);
  assert.match(part2EnglishArticle, /\*\*Theorem 4\.4\.4 \(Effect of perturbations in the matrix and right-hand side\)/);
  assert.match(part1Article, /\\mathbb\{R\}\^\{n\\times m\}/);
  assert.match(part1Article, /在 \$O\(n\^2\)\$ 次操作内求解/);
});

test('linear systems split pages link to prerequisites and navigate between Parts I and II', () => {
  assert.match(part1Article, /\/zh\/ode-stiffness-stability\//);
  assert.match(part1EnglishArticle, /\/en\/ode-stiffness-stability\//);
  assert.match(part1Article, /继续阅读 \[数值分析讲义（四）：线性方程组\/矩阵运算数值求解 Part II\]\(\{\{ '\/zh\/linear-systems-cholesky-conditioning\/' \| relative_url \}\}\)。/);
  assert.match(part1EnglishArticle, /Continue with \[Numerical Analysis Lecture \(IV\): Solving Linear Systems and Matrix Computations Part II\]\(\{\{ '\/en\/linear-systems-cholesky-conditioning\/' \| relative_url \}\}\)\./);
  assert.match(part2Article, /\/zh\/linear-systems-direct-methods\//);
  assert.match(part2EnglishArticle, /\/en\/linear-systems-direct-methods\//);
  assert.match(part2Article, /<a href="\{\{ page\.en_link \}\}" class="btn">Read in English<\/a>/);
  assert.match(part2EnglishArticle, /<a href="\{\{ page\.zh_link \}\}" class="btn">中文版<\/a>/);
  assert.match(part2Article, /返回阅读 \[数值分析讲义（四）：线性方程组\/矩阵运算数值求解 Part I\]\(\{\{ '\/zh\/linear-systems-direct-methods\/' \| relative_url \}\}\)。/);
  assert.match(part2EnglishArticle, /Return to \[Numerical Analysis Lecture \(IV\): Solving Linear Systems and Matrix Computations Part I\]\(\{\{ '\/en\/linear-systems-direct-methods\/' \| relative_url \}\}\)\./);
  assert.doesNotMatch(part1Article, /linear-series-nav/);
  assert.doesNotMatch(part1EnglishArticle, /linear-series-nav/);
  assert.doesNotMatch(part2Article, /linear-series-nav/);
  assert.doesNotMatch(part2EnglishArticle, /linear-series-nav/);
});

test('English Part I localizes visible explanatory text and keeps only the language button in Chinese', () => {
  const cjkMatches = [...part1EnglishArticle.matchAll(/[\p{Script=Han}]+/gu)].map((match) => match[0]);
  assert.deepEqual(cjkMatches, ['\u4e2d\u6587\u7248']);
  assert.match(part1EnglishArticle, /Figure 4-1: Step-by-step partial-pivot Gaussian elimination and back substitution for Example 4\.2\.3/);
  assert.match(part1EnglishArticle, /Previous/);
  assert.match(part1EnglishArticle, /Next/);
  assert.match(part1EnglishArticle, /Reset/);
  assert.match(part1EnglishArticle, /Figure 4-2: How the multipliers in the same example form \$L\$/);
  assert.match(part1EnglishArticle, /Here \$L\^\{\(1\)\}\$ is not the final factor \$L\$/);
  assert.match(part1EnglishArticle, /The final lower triangular matrix is the identity matrix plus these multipliers, namely \$L=I\+L\^\{\(n\)\}\$/);
  assert.match(part1EnglishArticle, /\*\*Source, Copyright, and Usage Notes\*\*/);
});

test('English Part II localizes prose and both explanatory diagrams', () => {
  const cjkMatches = [...part2EnglishArticle.matchAll(/[\p{Script=Han}]+/gu)].map((match) => match[0]);
  assert.deepEqual(cjkMatches, ['中文版']);
  assert.match(part2EnglishArticle, /Figure 4-3: Cholesky factorization exploits the symmetric positive definite structure/);
  assert.match(part2EnglishArticle, /Figure 4-4: The condition number is not the algorithmic error itself/);
  assert.match(part2EnglishArticle, /Positive definiteness keeps the quantity under the square root positive/);
  assert.match(part2EnglishArticle, /The Hilbert matrix example shows that even a residual caused by tiny rounding errors/);
  assert.match(part2EnglishArticle, /\*\*Source, Copyright, and Usage Notes\*\*/);
});

test('linear systems split includes focused explanatory SVG diagrams', () => {
  const part1FigureTags = [...part1Article.matchAll(/<figure class="linear-system-figure">/g)];
  const part2FigureTags = [...part2Article.matchAll(/<figure class="linear-system-figure">/g)];
  const part2EnglishFigureTags = [...part2EnglishArticle.matchAll(/<figure class="linear-system-figure">/g)];
  const part1Svgs = [...part1Article.matchAll(/<svg role="img" aria-labelledby=/g)];
  const part2Svgs = [...part2Article.matchAll(/<svg role="img" aria-labelledby=/g)];
  const part2EnglishSvgs = [...part2EnglishArticle.matchAll(/<svg role="img" aria-labelledby=/g)];

  assert.equal(part1FigureTags.length, 2);
  assert.equal(part2FigureTags.length, 2);
  assert.equal(part2EnglishFigureTags.length, 2);
  assert.equal(part1Svgs.length, 1);
  assert.equal(part2Svgs.length, 2);
  assert.equal(part2EnglishSvgs.length, 2);
  assert.match(part1Article, /data-gauss-stepper/);
  assert.match(part1Article, /图 4-1：用例 4\.2\.3 逐步跟踪列主元 Gauss 消去和回代/);
  assert.match(part1Article, /l21 = 1\/2/);
  assert.match(part1Article, /R3 <- R3 - R2/);
  assert.match(part1Article, /解为 x = \(1, 2, 3\)\^T/);
  assert.match(part1Article, /图 4-2：同一例子的乘子如何组成 \$L\$，消去结果如何成为 \$R\$/);
  assert.match(part1Article, /PA = LR/);
  assert.match(part1Article, /l21=1\/2, l31=1, l32=1/);
  assert.match(part2Article, /图 4-3：Cholesky 分解利用对称正定结构，只构造一个下三角因子/);
  assert.match(part2Article, /图 4-4：条件数不是算法误差本身，而是问题本身对扰动的敏感度/);
  assert.match(part2EnglishArticle, /id="kap4-cholesky-title-en"/);
  assert.match(part2EnglishArticle, /id="kap4-condition-title-en"/);
  assert.match(part2EnglishArticle, /Column j: obtain l/);
});

test('linear systems split configures formulas and explains notation', () => {
  for (const article of [part1Article, part2Article, part1EnglishArticle, part2EnglishArticle]) {
    assert.match(article, /inlineMath: \[\['\$', '\$'\], \['\\\\\(', '\\\\\)'\]\]/);
    assert.match(article, /tex-mml-chtml\.js/);
    assert.match(article, /mjx-container\[display='true'\]/);
    assert.match(article, /overflow-x:\s*auto/);
    assert.match(article, /\*\*(?:英文缩写与记号说明|Abbreviations and Notation)\*\*/);
  }

  assert.match(part1Article, /LR 分解：这里沿用讲义记号/);
  assert.match(part1Article, /partial pivoting 对应本文的列主元搜索/);
  assert.match(part2Article, /SPD：symmetric positive definite/);
  assert.match(part2Article, /Cholesky 分解：对称正定矩阵的分解/);
  assert.match(part2Article, /\$\\operatorname\{cond\}\(A\)\$：condition number/);
  assert.match(part2EnglishArticle, /SPD: symmetric positive definite/);
  assert.match(part2EnglishArticle, /Cholesky factorization: the factorization \$A=LL\^T\$/);
  assert.match(part2EnglishArticle, /\$\\operatorname\{cond\}\(A\)\$: the condition number/);
});

test('Part I protects inline formulas that would otherwise become Markdown emphasis', () => {
  const basicConceptStart = part1Article.indexOf('**Gauss 消去法的基本概念**');
  const basicConceptEnd = part1Article.indexOf('### 4.2.3 主元策略');
  const basicConcept = part1Article.slice(basicConceptStart, basicConceptEnd);

  assert.match(part1Article, /\*\*步骤 0：初始化。\*\*/);
  assert.match(part1Article, /\*\*步骤 1：选主元。\*\*/);
  assert.match(part1Article, /\*\*步骤 2：消去。\*\*/);
  assert.match(part1Article, /\*\*步骤 3：迭代。\*\*/);
  assert.match(part1Article, /a\^\{\(1\)\}_\{r1\}&\\cdots&a\^\{\(1\)\}_\{rn\}&b\^\{\(1\)\}_r/);
  assert.match(part1Article, /\\widehat A\^\{\(2\)\}&\\widehat b\^\{\(2\)\}/);
  assert.match(part1Article, /第 <span>\$k\$<\/span> 轮步骤 1：选主元并换行/);
  assert.match(part1Article, /第 <span>\$k\$<\/span> 轮步骤 2：消去/);
  assert.doesNotMatch(basicConcept, /^0\. 初始化：/m);
  assert.doesNotMatch(basicConcept, /^1\. 选主元：/m);
  assert.doesNotMatch(basicConcept, /^2\. 消去：/m);
  assert.doesNotMatch(basicConcept, /^3\. 迭代：/m);
  assert.match(part1Article, /第 <span>\$k\$<\/span> 轮步骤 1：选主元并换行。\*\* 选取主元 <span>\$a\^\{\(k\)\}_\{rk\}\\ne 0\$<\/span>/);
  assert.match(part1Article, /第 <span>\$k\$<\/span> 轮步骤 2：消去。\*\* 从第 <span>\$i\$<\/span> 个方程中减去第 <span>\$k\$<\/span> 个方程的 <span>\$l_\{ik\}\$<\/span> 倍/);
  assert.match(part1Article, /在第 <span>\$k\$<\/span> 轮的主元选择步骤中确定的元素 <span>\$a\^\{\(k\)\}_\{rk\}\$<\/span> 称为主元/);
  assert.match(part1Article, /可以选择任意 <span>\$a\^\{\(k\)\}_\{rk\}\\ne 0\$<\/span>/);
  assert.doesNotMatch(part1Article, /在步骤 <span>\$1_k\$<\/span>/);
});

test('Part I carries the example 4.2.3 LR computation through to PA equals LR', () => {
  assert.match(part1Article, /把这个例子继续写成三角分解/);
  assert.match(part1Article, /P=\s*\\begin\{pmatrix\}\s*0&1&0\\\\\s*1&0&0\\\\\s*0&0&1/s);
  assert.match(part1Article, /l_\{21\}=\\frac\{1\}\{2\},\\qquad l_\{31\}=1/);
  assert.match(part1Article, /l_\{32\}=1/);
  assert.match(part1Article, /L=\s*\\begin\{pmatrix\}\s*1&0&0\\\\\s*\\frac12&1&0\\\\\s*1&1&1/s);
  assert.match(part1Article, /R=\s*\\begin\{pmatrix\}\s*2&-2&4\\\\\s*0&3&-3\\\\\s*0&0&-3/s);
  assert.match(part1Article, /<span>\$PA=LR\$<\/span>/);
  assert.match(part1Article, /P_k=\s*\\begin\{array\}\{c\}/);
  assert.match(part1Article, /\\tag\{4\.9\}/);
});

test('Part I explains the temporary L store before forming the final L factor', () => {
  assert.match(part1Article, /L\^\{\(1\)\}=0\\in\\mathbb\{R\}\^\{n\\times n\}/);
  assert.match(part1Article, /这里的 \$L\^\{\(1\)\}\$ 不是最终分解中的 \$L\$/);
  assert.match(part1Article, /只是一个用来暂存消去乘子的辅助矩阵/);
  assert.match(part1Article, /它的主对角线全为 \$0\$/);
  assert.match(part1Article, /最终的下三角矩阵才是单位矩阵加上这些乘子，即 \$L=I\+L\^\{\(n\)\}\$/);
  assert.match(part1Article, /并把乘子 \$l_\{ik\}\$ 存入 \$\\widetilde L\^\{\(k\)\}\$/);
  assert.match(part1Article, /R:=A\^\{\(n\)\},\\qquad c:=b\^\{\(n\)\},\\qquad L:=I\+L\^\{\(n\)\}/);
  assert.doesNotMatch(part1Article, /M\^\{\(1\)\}/);
  assert.doesNotMatch(part1Article, /I\+M\^\{\(n\)\}/);
});

test('linear systems split keeps source and reuse boundaries explicit', () => {
  for (const article of [part1Article, part2Article]) {
    assert.match(article, /\*\*来源、版权与使用说明\*\*/);
    assert.match(article, /Skript-Mathe4ET-3Inf-2016-Kap4-5\.pdf/);
    assert.match(article, /Skript-Mathe4ET-3Inf-2016-Kap4\.zh\.md/);
    assert.match(article, /原始讲义及其中可能包含的材料仍应以其原作者、课程页面及相关授权说明为准/);
    assert.doesNotMatch(article, /The Unlicense/);
    assert.doesNotMatch(article, /mathe3-script-2011-SoSe\.pdf/);
  }
  for (const article of [part1EnglishArticle, part2EnglishArticle]) {
    assert.match(article, /\*\*Source, Copyright, and Usage Notes\*\*/);
    assert.match(article, /Skript-Mathe4ET-3Inf-2016-Kap4-5\.pdf/);
    assert.match(article, /Skript-Mathe4ET-3Inf-2016-Kap4\.zh\.md/);
    assert.match(article, /original lecture notes and any materials they may contain/);
    assert.doesNotMatch(article, /The Unlicense/);
    assert.doesNotMatch(article, /mathe3-script-2011-SoSe\.pdf/);
  }
});
