import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const part1Article = readFileSync('Math/_posts/zh/2026-07-27-ode-initial-value-stability.zh.md', 'utf8');
const part2Article = readFileSync('Math/_posts/zh/2026-07-27-ode-stiffness-stability.zh.md', 'utf8');
const part1EnglishArticle = readFileSync('Math/_posts/zh/2026-07-27-ode-initial-value-stability.en.md', 'utf8');
const part2EnglishArticle = readFileSync('Math/_posts/zh/2026-07-27-ode-stiffness-stability.en.md', 'utf8');
const combinedArticle = `${part1Article}\n${part2Article}`;
const combinedEnglishArticle = `${part1EnglishArticle}\n${part2EnglishArticle}`;
const normalizedPart1 = part1Article.replace(/\r\n/g, '\n');
const normalizedPart2 = part2Article.replace(/\r\n/g, '\n');
const normalizedPart1English = part1EnglishArticle.replace(/\r\n/g, '\n');
const normalizedPart2English = part2EnglishArticle.replace(/\r\n/g, '\n');

test('ODE lecture is split into Part I and Part II Chinese pages', () => {
  assert.match(part1Article, /title: "数值分析讲义（三）：常微分方程初值问题与刚性 Part I"/);
  assert.match(part1Article, /lang: "zh"/);
  assert.match(part1Article, /permalink: \/zh\/ode-initial-value-stability\//);
  assert.match(part1Article, /en_link: \/en\/ode-initial-value-stability\//);
  assert.match(part1Article, /categories:\n  - Math/);
  assert.match(part1Article, /Ordinary Differential Equations/);
  assert.match(part1Article, /Stability/);

  assert.match(part2Article, /title: "数值分析讲义（三）：常微分方程初值问题与刚性 Part II"/);
  assert.match(part2Article, /lang: "zh"/);
  assert.match(part2Article, /permalink: \/zh\/ode-stiffness-stability\//);
  assert.match(part2Article, /en_link: \/en\/ode-stiffness-stability\//);
  assert.match(part2Article, /categories:\n  - Math/);
  assert.match(part2Article, /Ordinary Differential Equations/);
  assert.match(part2Article, /Stability/);
});

test('ODE lecture has matching English Part I and Part II pages', () => {
  assert.match(part1EnglishArticle, /title: "Numerical Analysis Lecture \(III\): Initial Value Problems and Stiffness Part I"/);
  assert.match(part1EnglishArticle, /lang: "en"/);
  assert.match(part1EnglishArticle, /permalink: \/en\/ode-initial-value-stability\//);
  assert.match(part1EnglishArticle, /zh_link: \/zh\/ode-initial-value-stability\//);
  assert.match(part1EnglishArticle, /中文版/);

  assert.match(part2EnglishArticle, /title: "Numerical Analysis Lecture \(III\): Initial Value Problems and Stiffness Part II"/);
  assert.match(part2EnglishArticle, /lang: "en"/);
  assert.match(part2EnglishArticle, /permalink: \/en\/ode-stiffness-stability\//);
  assert.match(part2EnglishArticle, /zh_link: \/zh\/ode-stiffness-stability\//);
  assert.match(part2EnglishArticle, /中文版/);
});

test('Part I contains only section 3.1 and Part II contains section 3.2 in both languages', () => {
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
    '## 3.1 引言',
    '### 3.1.1 数值方法的基本概念',
    '### 3.1.2 一些重要方法',
    '### 3.1.3 收敛性和相容性',
    '### 3.1.4 一个收敛性定理',
    '### 3.1.5 显式 Runge-Kutta 方法',
  ]);
  assert.deepEqual(part2Headings, [
    '## 3.2 刚性微分方程',
    '### 3.2.1 一些方法的稳定区域',
  ]);
  assert.deepEqual(part1EnglishHeadings, [
    '## 3.1 Introduction',
    '### 3.1.1 Basic Concepts of Numerical Methods',
    '### 3.1.2 Some Important Methods',
    '### 3.1.3 Convergence and Consistency',
    '### 3.1.4 A Convergence Theorem',
    '### 3.1.5 Explicit Runge-Kutta Methods',
  ]);
  assert.deepEqual(part2EnglishHeadings, [
    '## 3.2 Stiff Differential Equations',
    '### 3.2.1 Stability Regions of Some Methods',
  ]);

  assert.doesNotMatch(part1Article, /^## 3\.2/m);
  assert.doesNotMatch(part2Article, /^## 3\.1/m);
  assert.doesNotMatch(part1EnglishArticle, /^## 3\.2/m);
  assert.doesNotMatch(part2EnglishArticle, /^## 3\.1/m);
  assert.match(part1Article, /\*\*显式 Euler 方法\*\*/);
  assert.match(part1Article, /\*\*经典四阶 Runge-Kutta 方法（RK4，fourth-order Runge-Kutta method）\*\*/);
  assert.match(part2Article, /\*\*定义 3\.2\.3（A 稳定，绝对稳定）\*\*/);
  assert.match(part1EnglishArticle, /\*\*Explicit Euler method\*\*/);
  assert.match(part1EnglishArticle, /\*\*Classical fourth-order Runge-Kutta method \(RK4, fourth-order Runge-Kutta method\)\*\*/);
  assert.match(part2EnglishArticle, /\*\*Definition 3\.2\.3 \(A-stability, absolute stability\)\*\*/);
});

test('ODE split pages link to prerequisites and to each other', () => {
  assert.match(part1Article, /建议先阅读 \[数值分析讲义（二）：数值积分\]\(\{\{ '\/zh\/numerical-integration-lab\/' \| relative_url \}\}\)/);
  assert.match(part1Article, /刚性微分方程与稳定区域放在 \[Part II\]\(\{\{ '\/zh\/ode-stiffness-stability\/' \| relative_url \}\}\)/);
  assert.match(part1Article, /继续阅读 \[数值分析讲义（三）：常微分方程初值问题与刚性 Part II\]\(\{\{ '\/zh\/ode-stiffness-stability\/' \| relative_url \}\}\)/);
  assert.match(part2Article, /建议先阅读 \[数值分析讲义（三）：常微分方程初值问题与刚性 Part I\]\(\{\{ '\/zh\/ode-initial-value-stability\/' \| relative_url \}\}\)/);
  assert.match(part2Article, /返回阅读 \[数值分析讲义（三）：常微分方程初值问题与刚性 Part I\]\(\{\{ '\/zh\/ode-initial-value-stability\/' \| relative_url \}\}\)/);
  assert.match(part1Article, /<a href="\{\{ page\.en_link \}\}" class="btn">Read in English<\/a>/);
  assert.match(part2Article, /<a href="\{\{ page\.en_link \}\}" class="btn">Read in English<\/a>/);
  assert.match(part1EnglishArticle, /It is best to read \[Numerical Analysis Lecture \(II\): Numerical Integration\]\(\{\{ '\/en\/numerical-integration-lab\/' \| relative_url \}\}\)/);
  assert.match(part1EnglishArticle, /continued in \[Part II\]\(\{\{ '\/en\/ode-stiffness-stability\/' \| relative_url \}\}\)/);
  assert.match(part1EnglishArticle, /Continue with \[Numerical Analysis Lecture \(III\): Initial Value Problems and Stiffness Part II\]\(\{\{ '\/en\/ode-stiffness-stability\/' \| relative_url \}\}\)/);
  assert.match(part2EnglishArticle, /read \[Numerical Analysis Lecture \(III\): Initial Value Problems and Stiffness Part I\]\(\{\{ '\/en\/ode-initial-value-stability\/' \| relative_url \}\}\) first/);
  assert.match(part2EnglishArticle, /Return to \[Numerical Analysis Lecture \(III\): Initial Value Problems and Stiffness Part I\]\(\{\{ '\/en\/ode-initial-value-stability\/' \| relative_url \}\}\)/);
});

test('ODE articles use natural Chinese labels instead of translation-shaped standalone punctuation', () => {
  assert.doesNotMatch(combinedArticle, /\*\*例。\*\*/);
  assert.doesNotMatch(combinedArticle, /\*\*注。\*\*/);
  assert.doesNotMatch(combinedArticle, /\*\*证明 - 给感兴趣者。\*\*/);
  assert.match(part1Article, /\*\*例：\*\* 考虑一个串联电路/);
  assert.match(part1Article, /\*\*注：\*\* b\) 表明解连续依赖于初值/);
  assert.match(part1Article, /\*\*证明（供感兴趣的读者参考）：\*\* 令/);
  assert.match(part1Article, /\*\*例 3\.1\.4（显式 Euler 方法）：\*\* Euler 方法具有 1 阶相容性/);
  assert.doesNotMatch(combinedArticle, /另一个通常会非常迅速阻尼的部分组成/);
  assert.match(part2Article, /刚性问题的解往往同时包含两个时间尺度：一部分变化较慢，另一部分会在很短时间内迅速衰减/);
  assert.doesNotMatch(combinedArticle, /很负特征值|实部弱负|负得很大|只是弱负/);
  assert.match(part2Article, /特征值实部远小于 \$0\$，仍会限制显式方法可选的稳定步长/);
  assert.match(part2Article, /实部接近 \$0\$ 但仍为负的特征值/);
  assert.doesNotMatch(combinedArticle, /\*\*证明：\*\* 见 Deuflhard 和 Bornemann \[1\]/);
  assert.match(part1Article, /证明略。详细推导可参见 Deuflhard 和 Bornemann \[1\]/);
  assert.match(part1Article, /每走一步，都必须先从这个方程中解出 \$u_\{j\+1\}\$/);
  assert.match(part1Article, /德语原文中的记号是 \*Die Funktion\* \$\\varphi\(t,h;u,v\)\$/);
  assert.match(part1Article, /\$v\$ 表示当前步右端点的状态，在 \(3\.7\) 中对应 \$u_\{j\+1\}\$/);
});

test('ODE split articles include focused explanatory diagrams with accessible SVGs', () => {
  const part1FigureCaptions = [...part1Article.matchAll(/<figcaption class="ode-figure__caption">(?:图|示意图) 3\.\d：/g)];
  const part2FigureCaptions = [...part2Article.matchAll(/<figcaption class="ode-figure__caption">(?:图|示意图) 3\.\d：/g)];
  const part1MethodCaptions = [...part1Article.matchAll(/方法示意图：/g)];
  const part1PropertyCaptions = [...part1Article.matchAll(/性质示意图：/g)];
  const part2PropertyCaptions = [...part2Article.matchAll(/性质示意图：/g)];
  const allInlineSvgs = [...combinedArticle.matchAll(/<svg viewBox=/g)];
  const allImageTitles = [...combinedArticle.matchAll(/role="img" aria-labelledby=/g)];

  assert.equal(part1FigureCaptions.length, 1);
  assert.equal(part2FigureCaptions.length, 1);
  assert.equal(part1MethodCaptions.length, 6);
  assert.equal(part1PropertyCaptions.length, 3);
  assert.equal(part2PropertyCaptions.length, 1);
  assert.equal(allInlineSvgs.length, 12);
  assert.equal(allImageTitles.length, 12);
  assert.match(part1Article, /方法示意图：显式 Euler 方法只使用左端点斜率/);
  assert.match(part1Article, /方法示意图：隐式 Euler 方法使用右端点斜率/);
  assert.match(part1Article, /方法示意图：隐式梯形规则取两端斜率的平均/);
  assert.match(part1Article, /方法示意图：Heun 方法先预测，再用端点斜率修正/);
  assert.match(part1Article, /方法示意图：改进 Euler 方法使用中点斜率/);
  assert.match(part1Article, /方法示意图：RK4 组合四个采样斜率/);
  assert.match(part1Article, /<path d="M 150 176 C 250 154 330 115 430 100 C 520 88 590 70 635 50"/);
  assert.match(part1Article, /<line x1="150" y1="176" x2="430" y2="114" stroke="#c1121f"/);
  assert.match(part1Article, /<line x1="330" y1="130" x2="500" y2="79" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" \/>/);
  assert.match(part1Article, /<line x1="108" y1="185" x2="250" y2="154" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" \/>/);
  assert.match(part1Article, /<line x1="342" y1="126" x2="515" y2="75" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" \/>/);
  assert.match(part1Article, /红线从精确起点出发，所以画成起点切线/);
  assert.match(part1Article, /预测点处采样的向量场方向，不表示黑色精确曲线的切线/);
  assert.match(part1Article, /绿色线不应理解为黑色曲线某一点的切线/);
  assert.match(part1Article, /k_1\$ 从起点切线出发/);
  assert.match(part1Article, /性质示意图：相容性看的是一步局部缺陷/);
  assert.match(part1Article, /性质示意图：稳定性看的是扰动是否被温和传播/);
  assert.match(part1Article, /性质示意图：收敛性看的是网格整体误差/);
  assert.match(part2Article, /性质示意图：刚性来自快慢尺度同时存在/);
  assert.match(part1Article, /局部缺陷/);
  assert.match(part1Article, /输出差距受控/);
  assert.match(part1Article, /φ 对 u、v 的扰动满足 Lipschitz 控制/);
  assert.match(part1Article, /全局离散化误差/);
  assert.match(part2Article, /快模态基本消失/);
  assert.match(part1Article, /图 3\.1：振荡电路微分方程的解与近似（左：\$n=50\$；右：\$n=100\$）/);
  assert.match(part1Article, /左：n=50/);
  assert.match(part1Article, /右：n=100/);
  assert.match(part1Article, /I''\(t\)\+\\frac14 I'\(t\)\+I\(t\)=0/);
  assert.match(part1Article, /\\begin\{aligned\}\na_\{j\+1\}/);
  assert.doesNotMatch(part1Article, /\$\$\n=\n\\frac\{e\^\{Lt_\{j\+1\}\}-1\}\{L\}b/);
  assert.match(part2Article, /模型方程 \$y'=\\lambda y\$ 的稳定区域/);
  assert.match(part2Article, /显式 Euler、隐式 Euler 和隐式梯形规则的稳定区域/);
  assert.equal((part1EnglishArticle.match(/<svg viewBox=/g) || []).length, 10);
  assert.equal((part2EnglishArticle.match(/<svg viewBox=/g) || []).length, 2);
  assert.equal((combinedEnglishArticle.match(/role="img" aria-labelledby=/g) || []).length, 12);
  assert.match(part1EnglishArticle, /Method diagram: explicit Euler uses only the left endpoint slope/);
  assert.match(part1EnglishArticle, /The blue line is a vector-field sample at the red predicted point/);
  assert.match(part1EnglishArticle, /Figure 3\.1: Solution and approximation of the oscillator equation \(left: \$n=50\$; right: \$n=100\$\)/);
  assert.match(part1EnglishArticle, /Property diagram: stability controls how perturbations propagate/);
  assert.match(part2EnglishArticle, /Property diagram: stiffness comes from simultaneous fast and slow scales/);
  assert.match(part2EnglishArticle, /Figure 3\.2: Stability regions for the model equation \$y'=\\lambda y\$/);
});

test('ODE split articles configure formulas and explain abbreviations', () => {
  for (const article of [part1Article, part2Article]) {
    assert.match(article, /inlineMath: \[\['\$', '\$'\], \['\\\\\(', '\\\\\)'\]\]/);
    assert.match(article, /tex-mml-chtml\.js/);
    assert.match(article, /mjx-container\[display='true'\]/);
    assert.match(article, /overflow-x:\s*auto/);
    assert.match(article, /ordinary differential equation, ODE/);
    assert.match(article, /\*\*英文缩写与术语说明\*\*/);
    assert.match(article, /ODE：ordinary differential equation/);
    assert.match(article, /IVP：initial value problem/);
    assert.doesNotMatch(article, /AWP/);
    assert.doesNotMatch(article, /LAWP/);
  }
  assert.match(part1Article, /initial value problem/);
  assert.match(part1Article, /\\text\{\(IVP\)\}\\qquad/);
  assert.match(part1Article, /RK4，fourth-order Runge-Kutta method/);
  assert.match(part1Article, /RK4：fourth-order Runge-Kutta method/);
  assert.doesNotMatch(part1Article, /LIVP：linear initial value problem/);
  assert.match(part2Article, /linear initial value problem/);
  assert.match(part2Article, /\\text\{\(LIVP}_n\\text\{\)\}\\qquad/);
  assert.match(part2Article, /A 稳定来自 A-stability/);
  assert.match(part2Article, /L 稳定来自 L-stability/);
  assert.match(part2Article, /LIVP：linear initial value problem/);
  assert.match(part2Article, /A-stability：A 稳定/);
  assert.match(part2Article, /L-stability：L 稳定/);
  assert.match(part2Article, /R\(q\)/);
  for (const article of [part1EnglishArticle, part2EnglishArticle]) {
    assert.match(article, /inlineMath: \[\['\$', '\$'\], \['\\\\\(', '\\\\\)'\]\]/);
    assert.match(article, /tex-mml-chtml\.js/);
    assert.match(article, /mjx-container\[display='true'\]/);
    assert.match(article, /overflow-x:\s*auto/);
    assert.match(article, /\*\*Abbreviations and Terms\*\*/);
    assert.match(article, /ODE: ordinary differential equation/);
    assert.match(article, /IVP: initial value problem/);
    assert.doesNotMatch(article, /AWP/);
    assert.doesNotMatch(article, /LAWP/);
  }
  assert.match(part1EnglishArticle, /initial value problem, abbreviated below as IVP|IVP \(initial value problem\)/);
  assert.match(part1EnglishArticle, /RK4: fourth-order Runge-Kutta method/);
  assert.doesNotMatch(part1EnglishArticle, /LIVP: linear initial value problem/);
  assert.match(part2EnglishArticle, /LIVP: linear initial value problem/);
  assert.match(part2EnglishArticle, /A-stability: A-stability/);
  assert.match(part2EnglishArticle, /L-stability: L-stability/);
  assert.match(part2EnglishArticle, /R\(q\)/);
});

test('ODE split articles keep source and reuse boundaries explicit', () => {
  for (const article of [part1Article, part2Article]) {
    assert.match(article, /\*\*参考文献\*\*/);
    assert.match(article, /\[1\] P\. Deuflhard and F\. Bornemann/);
    assert.match(article, /\[3\] H\. Heuser/);
    assert.match(article, /\[7\] W\. Walter/);
    assert.match(article, /Skript-Mathe4ET-3Inf-2016-Kap2-3\.pdf/);
    assert.match(article, /个人学习、翻译与知识整理/);
    assert.match(article, /不代表原作者或官方立场/);
    assert.match(article, /公开来源、文件级授权以及其中可能包含的第三方材料尚未在本文中逐项核验/);
    assert.match(article, /非商业学习、交流和引用/);
    assert.doesNotMatch(article, /mathe3-script-2011-SoSe\.pdf/);
    assert.doesNotMatch(article, /The Unlicense/);
  }
  for (const article of [part1EnglishArticle, part2EnglishArticle]) {
    assert.match(article, /\*\*References\*\*/);
    assert.match(article, /\[1\] P\. Deuflhard and F\. Bornemann/);
    assert.match(article, /\[3\] H\. Heuser/);
    assert.match(article, /\[7\] W\. Walter/);
    assert.match(article, /Skript-Mathe4ET-3Inf-2016-Kap2-3\.pdf/);
    assert.match(article, /personal study, translation, and knowledge organization/);
    assert.match(article, /do not represent the original authors or any official position/);
    assert.doesNotMatch(article, /mathe3-script-2011-SoSe\.pdf/);
    assert.doesNotMatch(article, /The Unlicense/);
  }
});
