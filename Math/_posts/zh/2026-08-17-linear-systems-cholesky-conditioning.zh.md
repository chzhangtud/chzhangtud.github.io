---
title: "数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part II"
lang: "zh"
date: 2026-08-17
permalink: /zh/linear-systems-cholesky-conditioning/
en_link: /en/linear-systems-cholesky-conditioning/
categories:
  - Math
tags:
  - Numerical Methods
  - Linear Systems
  - Matrix Factorization
  - Error Analysis
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.linear-system-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.linear-system-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.linear-system-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.linear-system-figure__note {
  border-top: 1px solid #d7dee2;
  color: #455461;
  margin: 0;
  padding: 0.75rem 0.9rem;
}

@media (max-width: 640px) {
  mjx-container[display='true'] {
    -webkit-overflow-scrolling: touch;
    display: block;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 0.2rem;
  }

  mjx-container[display='true'] > svg,
  mjx-container[display='true'] > mjx-math {
    max-width: none;
  }
}
</style>

<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

<a href="{{ page.en_link }}" class="btn">Read in English</a>

建议先阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part I]({{ '/zh/linear-systems-direct-methods/' | relative_url }})。本篇继续整理线性方程组求解的后半部分：对称正定矩阵的 Cholesky 分解，以及条件数、扰动和舍入误差对求解结果的影响。

---

## 4.3 Cholesky 方法

对一般可逆矩阵，若不选主元，Gauss 方法可能会失败；而且我们也会看到，出于数值稳定性的原因，主元搜索通常是明智的。不过，对于重要的正定矩阵类，不选主元的 Gauss 方法总是可以稳定地执行。

**定义 4.3.1**: 实矩阵 $A\in\mathbb{R}^{n\times n}$ 称为正定，如果

$$
A=A^T,\qquad x^TAx>0\quad \forall x\in\mathbb{R}^n\setminus\{0\}.
$$

称为正半定，如果

$$
A=A^T,\qquad x^TAx\ge 0\quad \forall x\in\mathbb{R}^n.
$$

更一般地，复矩阵 $A\in\mathbb{C}^{n\times n}$ 称为正定，如果

$$
A=A^H,\qquad x^HAx>0\quad \forall x\in\mathbb{C}^n\setminus\{0\}.
$$

称为正半定，如果

$$
A=A^H,\qquad x^HAx\ge 0\quad \forall x\in\mathbb{C}^n.
$$

这里 $A^H=(\overline a_{ji})_{1\le i\le n,1\le j\le n}$，其中横线表示复共轭。

正定矩阵在应用中非常常见，例如椭圆型偏微分方程（如 Laplace 方程）和抛物型偏微分方程（如热传导方程）的数值求解。

正定矩阵一定可逆。

Cholesky 给出了用于正定矩阵线性方程组的一种高效 Gauss 方法变体。Cholesky 方法基于如下观察。

**定理 4.3.2**: 设 $A\in\mathbb{R}^{n\times n}$ 正定。则存在唯一的下三角矩阵 $L$，其对角元为正，即 $l_{ii}>0$，并且

$$
LL^T=A
$$

成立。这称为 Cholesky 分解。

此外，$A$ 具有唯一的三角分解

$$
\widetilde L\widetilde R=A,
$$

其中

$$
\widetilde L=LD^{-1},\qquad
\widetilde R=DL^T,\qquad
D=\operatorname{diag}(l_{11},\ldots,l_{nn}).
$$

该分解由不选主元的 Gauss 方法给出。

证明可以用关于 $n$ 的完全归纳法完成，这里不展开。

Cholesky 分解 $LL^T=A$ 可以通过求解如下 $\frac{n(n+1)}2$ 个方程得到；由于对称性，只需考虑含对角线的下三角部分：

$$
a_{ij}=\sum_{k=1}^j l_{ik}l_{jk},
\qquad j\le i,\quad i=1,\ldots,n.
\tag{4.11}
$$

由此可以按列依次计算 $L$ 的元素，顺序为

$$
l_{11},\ldots,l_{n1},\ l_{22},\ldots,l_{n2},\ \ldots,\ l_{nn}.
$$

对 $L$ 的第一列，取 $j=1$ 得到

$$
a_{11}=l_{11}^2,\qquad \text{因此 } l_{11}=\sqrt{a_{11}},
$$

$$
a_{i1}=l_{i1}l_{11},\qquad \text{因此 } l_{i1}=a_{i1}/l_{11}.
$$

逐步解出 $l_{ij}$，$i=j,\ldots,n$，得到如下算法。

**算法 4.3.3：用于计算分解 $LL^T=A$ 的 Cholesky 方法**

对 $j=1,\ldots,n$：

$$
l_{jj}
=
\sqrt{
a_{jj}-\sum_{k=1}^{j-1}l_{jk}^2
}.
$$

对 $i=j+1,\ldots,n$：

$$
l_{ij}
=
\frac{
a_{ij}-\sum_{k=1}^{j-1}l_{ik}l_{jk}
}{l_{jj}}.
$$

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">图 4-3：Cholesky 分解利用对称正定结构，只构造一个下三角因子。</figcaption>
<svg role="img" aria-labelledby="kap4-cholesky-title kap4-cholesky-desc" viewBox="0 0 920 390" xmlns="http://www.w3.org/2000/svg">
  <title id="kap4-cholesky-title">Cholesky 分解按列构造下三角矩阵</title>
  <desc id="kap4-cholesky-desc">对称正定矩阵只需要计算下三角因子 L。每一列先算对角元素，再算对角线以下的元素。</desc>
  <rect width="920" height="390" fill="#f8fafc"/>
  <text x="460" y="38" text-anchor="middle" font-size="24" font-weight="700" fill="#111827">Cholesky：正定矩阵的专用三角分解</text>
  <g transform="translate(72 78)">
    <rect x="0" y="0" width="210" height="210" fill="#ffffff" stroke="#94a3b8"/>
    <line x1="0" y1="42" x2="210" y2="42" stroke="#cbd5e1"/>
    <line x1="0" y1="84" x2="210" y2="84" stroke="#cbd5e1"/>
    <line x1="0" y1="126" x2="210" y2="126" stroke="#cbd5e1"/>
    <line x1="0" y1="168" x2="210" y2="168" stroke="#cbd5e1"/>
    <line x1="42" y1="0" x2="42" y2="210" stroke="#cbd5e1"/>
    <line x1="84" y1="0" x2="84" y2="210" stroke="#cbd5e1"/>
    <line x1="126" y1="0" x2="126" y2="210" stroke="#cbd5e1"/>
    <line x1="168" y1="0" x2="168" y2="210" stroke="#cbd5e1"/>
    <rect x="0" y="0" width="210" height="210" fill="#dbeafe" opacity="0.55"/>
    <line x1="0" y1="0" x2="210" y2="210" stroke="#1d4ed8" stroke-width="3"/>
    <text x="105" y="244" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">A = Aᵀ，且 xᵀAx &gt; 0</text>
  </g>
  <g transform="translate(356 78)">
    <rect x="0" y="0" width="210" height="210" fill="#ffffff" stroke="#94a3b8"/>
    <line x1="0" y1="42" x2="210" y2="42" stroke="#cbd5e1"/>
    <line x1="0" y1="84" x2="210" y2="84" stroke="#cbd5e1"/>
    <line x1="0" y1="126" x2="210" y2="126" stroke="#cbd5e1"/>
    <line x1="0" y1="168" x2="210" y2="168" stroke="#cbd5e1"/>
    <line x1="42" y1="0" x2="42" y2="210" stroke="#cbd5e1"/>
    <line x1="84" y1="0" x2="84" y2="210" stroke="#cbd5e1"/>
    <line x1="126" y1="0" x2="126" y2="210" stroke="#cbd5e1"/>
    <line x1="168" y1="0" x2="168" y2="210" stroke="#cbd5e1"/>
    <polygon points="0,0 0,210 210,210" fill="#dcfce7" stroke="#16a34a"/>
    <rect x="0" y="0" width="42" height="210" fill="#bbf7d0" stroke="#16a34a"/>
    <circle cx="21" cy="21" r="10" fill="#15803d"/>
    <text x="105" y="244" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">按列构造 L</text>
  </g>
  <g transform="translate(640 78)">
    <rect x="0" y="0" width="210" height="210" fill="#ffffff" stroke="#94a3b8"/>
    <polygon points="0,0 0,210 210,210" fill="#dcfce7" stroke="#16a34a"/>
    <polygon points="0,0 210,0 210,210" fill="#fee2e2" stroke="#ef4444"/>
    <line x1="0" y1="0" x2="210" y2="210" stroke="#1e293b" stroke-width="2"/>
    <text x="70" y="154" text-anchor="middle" font-size="22" font-weight="700" fill="#166534">L</text>
    <text x="144" y="70" text-anchor="middle" font-size="22" font-weight="700" fill="#991b1b">Lᵀ</text>
    <text x="105" y="244" text-anchor="middle" font-size="16" font-weight="700" fill="#1e293b">A = LLᵀ</text>
  </g>
  <g stroke="#475569" stroke-width="2" marker-end="url(#kap4-arrow-chol)">
    <defs>
      <marker id="kap4-arrow-chol" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6 Z" fill="#475569"/>
      </marker>
    </defs>
    <path d="M294 183 H344"/>
    <path d="M578 183 H628"/>
  </g>
  <text x="460" y="356" text-anchor="middle" font-size="15" fill="#475569">第 j 列：先由平方根得到 l<tspan baseline-shift="sub" font-size="11">jj</tspan>，再向下计算 l<tspan baseline-shift="sub" font-size="11">ij</tspan>；只需存储和更新下三角部分。</text>
</svg>
<p class="linear-system-figure__note">正定性保证开方项为正；一旦某一步开方项不正，算法也给出了一个有效的正定性测试。</p>
</figure>

**注 4.3.4**: Cholesky 方法有一些很好的性质：

- 由于 Cholesky 方法利用了对称性，除了 $n$ 次开方外，它只需要 $O(n^3/6)$ 次操作。这大约是不选结构的一般 Gauss 方法所需操作的一半。

- 由 (4.11) 可得

$$
|l_{ij}|\le \sqrt{a_{ii}},
\qquad j\le i,\quad i=1,\ldots,n.
$$

因此矩阵 $L$ 的元素不会变得过大。这是 Cholesky 方法数值稳定的一个重要原因。

- Cholesky 方法是最有效的一般正定性测试方法。只需把算法 4.3.3 如下扩展：

$$
a=a_{jj}-\sum_{k=1}^{j-1}l_{jk}^2.
$$

若 $a\le 0$：停止，$A$ 非正定。否则令

$$
l_{jj}=\sqrt a.
$$

## 4.4 误差估计与舍入误差影响

在描述求解线性方程组的直接方法时，我们到目前为止都假定所有输入数据精确给出，并且计算过程中没有舍入误差。这并不现实，因为特别是在大型系统中，舍入误差可能显著影响计算。

### 4.4.1 扰动方程组的误差估计

我们先研究：当矩阵和右端项发生扰动时，线性方程组的解会发生多大变化。考虑线性方程组

$$
Ax=b
$$

以及受扰系统

$$
(A+\Delta A)\widetilde x=b+\Delta b,
$$

其中 $\Delta A$ 和 $\Delta b$ “很小”。

问题是：$x-\widetilde x$ 有多小？

这个问题有很高的实际意义：

- 可以估计解对矩阵和右端项扰动的敏感程度。
- 计算得到的近似解，例如用 Gauss 方法的某个实现得到的 $\widetilde x$，是如下系统的精确解：

$$
A\widetilde x=b+\Delta b,
\qquad
\Delta b=A\widetilde x-b.
$$

于是，可以由容易计算的残差 $\Delta b=A\widetilde x-b$ 推导出未知误差 $\|x-\widetilde x\|$ 的界。

事实表明，矩阵的所谓条件数描述了这种扰动影响。

为了度量 $x-\widetilde x$、$\Delta b$ 和 $\Delta A$，我们需要向量和矩阵的“长度”概念。

**定义 4.4.1**: $\mathbb{R}^n$ 上的向量范数是一个映射

$$
x\in\mathbb{R}^n\mapsto \|x\|\in[0,\infty[
$$

并满足：

a) $\|x\|=0$ 当且仅当 $x=0$；

b) 对所有 $\alpha\in\mathbb{R}$ 和所有 $x\in\mathbb{R}^n$，有

$$
\|\alpha x\|=|\alpha|\,\|x\|;
$$

c) 对所有 $x,y\in\mathbb{R}^n$，有三角不等式

$$
\|x+y\|\le \|x\|+\|y\|.
$$

现在引入矩阵范数。设 $\|\cdot\|$ 是 $\mathbb{R}^n$ 上的任意范数，则可以在 $\mathbb{R}^{n\times n}$ 上定义对应的矩阵范数：

$$
\|A\|:=\sup_{\|x\|=1}\|Ax\|
=\sup_{x\ne 0}\frac{\|Ax\|}{\|x\|},
\qquad A\in\mathbb{R}^{n\times n}.
\tag{4.12}
$$

它称为由向量范数 $\|\cdot\|$ 诱导的矩阵范数。

它同样满足：

a) $\|A\|=0$ 当且仅当 $A=0$；

b) 对所有 $\alpha\in\mathbb{R}$ 和所有 $A\in\mathbb{R}^{n\times n}$，有 $\|\alpha A\|=\lvert\alpha\rvert\,\|A\|$；

c) 对所有 $A,B\in\mathbb{R}^{n\times n}$，有三角不等式

$$
\|A+B\|\le \|A\|+\|B\|.
$$

此外，(4.12) 保证如下有用不等式：

d) 对所有 $x\in\mathbb{R}^n$ 和所有 $A\in\mathbb{R}^{n\times n}$，

$$
\|Ax\|\le \|A\|\,\|x\|
$$

成立；这称为相容性条件。

e) 对所有 $A,B\in\mathbb{R}^{n\times n}$，

$$
\|AB\|\le \|A\|\,\|B\|
$$

成立；这称为次乘性。

**例 4.4.2**

$$
\|x\|_2=\sqrt{x^Tx}
\quad\text{诱导}\quad
\|A\|_2=\sqrt{\lambda_{\max}(A^TA)}.
$$

$$
\|x\|_1=\sum_{i=1}^n |x_i|
\quad\text{诱导}\quad
\|A\|_1=\max_{j=1,\ldots,n}\sum_{i=1}^n |a_{ij}|
$$

这称为列和范数。

$$
\|x\|_\infty=\max_{i=1,\ldots,n}|x_i|
\quad\text{诱导}\quad
\|A\|_\infty=\max_{i=1,\ldots,n}\sum_{j=1}^n |a_{ij}|
$$

这称为行和范数。

现在可以引入前面提到的矩阵条件数。

**定义 4.4.3**: 设 $A\in\mathbb{R}^{n\times n}$ 可逆，$\|\cdot\|$ 是一个诱导矩阵范数。则

$$
\operatorname{cond}(A)=\|A\|\,\|A^{-1}\|
$$

称为 $A$ 关于该矩阵范数的条件数。

可以证明如下结论。

<figure class="linear-system-figure">
<figcaption class="linear-system-figure__caption">图 4-4：条件数不是算法误差本身，而是问题本身对扰动的敏感度。</figcaption>
<svg role="img" aria-labelledby="kap4-condition-title kap4-condition-desc" viewBox="0 0 940 330" xmlns="http://www.w3.org/2000/svg">
  <title id="kap4-condition-title">条件数放大扰动</title>
  <desc id="kap4-condition-desc">矩阵和右端项的相对扰动通过条件数放大，形成解的相对误差界。残差可以看成右端项扰动。</desc>
  <rect width="940" height="330" fill="#f8fafc"/>
  <text x="470" y="38" text-anchor="middle" font-size="24" font-weight="700" fill="#111827">误差估计的核心：输入扰动经过 cond(A) 放大</text>
  <rect x="54" y="92" width="210" height="104" rx="8" fill="#ffffff" stroke="#94a3b8"/>
  <text x="159" y="125" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">数据扰动</text>
  <text x="159" y="154" text-anchor="middle" font-size="15" fill="#475569">ΔA / A 与 Δb / b</text>
  <text x="159" y="179" text-anchor="middle" font-size="14" fill="#64748b">模型误差、输入误差、舍入误差</text>
  <rect x="364" y="82" width="212" height="124" rx="8" fill="#fffbeb" stroke="#d97706"/>
  <text x="470" y="121" text-anchor="middle" font-size="20" font-weight="700" fill="#92400e">cond(A)</text>
  <text x="470" y="151" text-anchor="middle" font-size="15" fill="#92400e">= ||A|| · ||A⁻¹||</text>
  <text x="470" y="178" text-anchor="middle" font-size="14" fill="#92400e">越大，解越敏感</text>
  <rect x="676" y="92" width="210" height="104" rx="8" fill="#ffffff" stroke="#94a3b8"/>
  <text x="781" y="125" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">解的相对误差</text>
  <text x="781" y="154" text-anchor="middle" font-size="15" fill="#475569">||x̃ - x|| / ||x||</text>
  <text x="781" y="179" text-anchor="middle" font-size="14" fill="#64748b">由定理 4.4.4 给出上界</text>
  <rect x="260" y="236" width="420" height="54" rx="8" fill="#ecfdf5" stroke="#16a34a"/>
  <text x="470" y="269" text-anchor="middle" font-size="16" font-weight="700" fill="#166534">残差 r = A x̃ - b 可视作 Δb，用来做后验误差估计</text>
  <g stroke="#475569" stroke-width="2" marker-end="url(#kap4-arrow-cond)">
    <defs>
      <marker id="kap4-arrow-cond" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6 Z" fill="#475569"/>
      </marker>
    </defs>
    <path d="M274 144 H352"/>
    <path d="M588 144 H666"/>
    <path d="M470 208 V226"/>
  </g>
</svg>
<p class="linear-system-figure__note">Hilbert 矩阵的例子说明：即使残差来自很小的舍入误差，条件数也可能把它放大成明显的解误差。</p>
</figure>

**定理 4.4.4（矩阵和右端项扰动的影响）**  
设 $A\in\mathbb{R}^{n\times n}$ 可逆，$b,\Delta b\in\mathbb{R}^n$，$b\ne 0$，并且 $\Delta A\in\mathbb{R}^{n\times n}$ 满足

$$
\|\Delta A\|<\frac1{\|A^{-1}\|},
$$

其中 $\|\cdot\|$ 是由 $\mathbb{R}^n$ 上任意范数诱导的矩阵范数。若 $x$ 是

$$
Ax=b
$$

的解，$\widetilde x$ 是

$$
(A+\Delta A)\widetilde x=b+\Delta b
$$

的解，则有

$$
\frac{\|\widetilde x-x\|}{\|x\|}
\le
\frac{\operatorname{cond}(A)}
{1-\operatorname{cond}(A)\|\Delta A\|/\|A\|}
\left(
\frac{\|\Delta A\|}{\|A\|}
+\frac{\|\Delta b\|}{\|b\|}
\right).
$$

**证明**  
为简单起见，只考虑 $\Delta A=0$ 的情形。将受扰方程与未受扰方程相减，得到

$$
A(\widetilde x-x)=\Delta b,
$$

因此

$$
\|\widetilde x-x\|
=\|A^{-1}\Delta b\|
\le \|A^{-1}\|\,\|\Delta b\|.
$$

又因为

$$
\|b\|=\|Ax\|\le \|A\|\,\|x\|,
$$

所以

$$
\frac1{\|x\|}\le \frac{\|A\|}{\|b\|}.
$$

于是

$$
\frac{\|\widetilde x-x\|}{\|x\|}
\le
\|A\|\,\|A^{-1}\|\frac{\|\Delta b\|}{\|b\|}.
$$

因此，条件数决定了解对矩阵和右端项扰动的敏感程度。

### 4.4.2 Gauss 方法的舍入误差分析

通过对 Gauss 方法中出现的舍入误差放大作基本但繁琐的估计，可以得到如下结果。

**定理 4.4.5**: 设 $A\in\mathbb{R}^{n\times n}$ 可逆。在一台机器精度为 $\mathrm{eps}$ 的计算机上，对 $A$ 应用 Gauss 方法，并使用一种保证 $\lvert l_{ij}\rvert\le 1$ 的主元技术，例如列主元搜索或完全主元搜索。则计算得到的 $\overline L,\overline R$ 满足

$$
\overline L\,\overline R=PAQ+F,
\qquad
|f_{ij}|\le \frac{2j\,\overline a\,\mathrm{eps}}{1-\mathrm{eps}}.
$$

这里 $P,Q$ 是主元搜索产生的置换，并且

$$
\overline a=\max_k \overline a_k,
\qquad
\overline a_k=\max_{i,j}|a^{(k)}_{ij}|.
\tag{4.13}
$$

若借助 $\overline L,\overline R$ 通过前代和回代计算出 $Ax=b$ 的近似解 $\overline x$，则存在矩阵 $E$，使

$$
(A+E)\overline x=b,
\qquad
|e_{ij}|
\le
\frac{2(n+1)\mathrm{eps}}{1-n\mathrm{eps}}
(|\overline L|\,|\overline R|)_{ij}
\le
\frac{2(n+1)\mathrm{eps}}{1-n\cdot\mathrm{eps}}\,n\overline a.
$$

这里

$$
|\overline L|=(|\overline l_{ij}|),
\qquad
|\overline R|=(|\overline r_{ij}|).
$$

**证明**  
见 Stoer [5]。

**注 4.4.6**: 利用定理 4.4.4，现在也可以估计近似解 $\overline x$ 的相对误差。

**主元策略的影响**

(4.13) 中 $\overline a$ 的大小取决于主元策略。可以证明：

- 列主元搜索：

$$
\overline a_k\le 2^k\max_{i,j}|a_{ij}|.
$$

这个界可以达到，但通常过于悲观。实践中几乎总是出现

$$
\overline a_k\le 10\max_{i,j}|a_{ij}|.
$$

- 三对角矩阵的列主元搜索：

$$
\overline a_k\le 2\max_{i,j}|a_{ij}|.
$$

- 完全主元搜索：

$$
\overline a_k\le f(k)\max_{i,j}|a_{ij}|,
\qquad
f(k)=k^{1/2}\left(2\,3^{1/2}\cdots k^{1/(k-1)}\right)^{1/2}.
$$

$f(n)$ 增长很慢。到目前为止，还没有发现满足

$$
\overline a_k\ge (k+1)\max_{i,j}|a_{ij}|
$$

的例子。

**例 4.4.7**  
考虑 Hilbert 矩阵 $H^n=(h^n_{ij})\in\mathbb{R}^{n\times n}$，其中

$$
h^n_{ij}=\frac1{i+j-1},
\qquad i,j\in\{1,\ldots,n\}.
$$

众所周知，这个矩阵条件很差。例如，

$$
\operatorname{cond}(H^5)\approx 9.4\cdot 10^5
$$

关于 $\|\cdot\|_\infty$，并且

$$
\|H^5\|_\infty\approx 2.3,
\qquad
\|(H^5)^{-1}\|_\infty\approx 4.1\cdot 10^5.
$$

对它应用带列主元搜索的 Gauss 方法时，$\overline a=1$。

对 $n=5$ 和 $\mathrm{eps}=10^{-16}$，由定理 4.4.5 得

$$
|e_{ij}|
\le
\frac{2(n+1)\mathrm{eps}}{1-n\cdot\mathrm{eps}}\,n\overline a
=
\frac{6\cdot 10^{-15}}{1-5\cdot 10^{-16}}
\approx 6\cdot 10^{-15}.
$$

因此

$$
\|E\|_\infty\le 3\cdot 10^{-14}.
$$

定理 4.4.4 给出

$$
\frac{\|\widetilde x-x\|_\infty}{\|x\|_\infty}
\le
\frac{\operatorname{cond}(A)}
{1-\operatorname{cond}(A)\|E\|_\infty/\|A\|_\infty}
\frac{\|E\|_\infty}{\|A\|_\infty}
=
\frac{\|A^{-1}\|_\infty\|E\|_\infty}
{1-\|A^{-1}\|_\infty\|E\|_\infty}
$$

$$
\approx
\frac{4.1\cdot 10^5\cdot 3\cdot 10^{-14}}
{1-4.1\cdot 10^5\cdot 3\cdot 10^{-14}}
\approx 1.23\cdot 10^{-8}.
$$

因此，仅由舍入误差就会“损失”大约一半有效数字。对更大的 $n$，舍入误差会迅速变大，很快使结果不再可用。

注：对更大的 $n$，定理 4.4.4 不再适用，因为

$$
\|\Delta A\|>\frac1{\|A^{-1}\|}
$$

成立。

---

返回阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part I]({{ '/zh/linear-systems-direct-methods/' | relative_url }})。

**英文缩写与记号说明**

- SPD：symmetric positive definite，对称正定矩阵，即 $A=A^T$ 且 $x^TAx>0$。
- Cholesky 分解：对称正定矩阵的分解 $A=LL^T$。
- $\operatorname{cond}(A)$：condition number，条件数，用来描述线性方程组对输入扰动的敏感程度。
- pivot：主元；partial pivoting 对应列主元搜索，complete pivoting 对应完全主元搜索。

**来源、版权与使用说明**

本文整理自本地保存的 TU Darmstadt 2016 年 Mathematik 4 ET/3Inf 讲义文件 `Skript-Mathe4ET-3Inf-2016-Kap4-5.pdf` 中的第 4 章，并参考同目录下的中文翻译草稿 `Skript-Mathe4ET-3Inf-2016-Kap4.zh.md`。正文为个人学习、翻译与知识整理用途发布，文中的中文表述、补充说明和重新制作的图表不代表原作者或官方立场。

本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原始材料来源的前提下，用于非商业学习、交流和引用。由于本文部分内容基于课程讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、课程页面及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议先确认原始材料的授权状态。

如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系指出，我会及时处理或删除。
