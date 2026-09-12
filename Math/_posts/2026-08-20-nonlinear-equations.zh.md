---
title: "数值分析讲义（五）：非线性方程组"
lang: "zh"
date: 2026-08-20
permalink: /zh/nonlinear-equations/
en_link: /en/nonlinear-equations/
categories:
  - Math
tags:
  - Numerical Methods
  - Nonlinear Equations
  - Newton Method
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.newton-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.newton-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.newton-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.newton-figure__note {
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

建议先阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part II]({{ '/zh/linear-systems-cholesky-conditioning/' | relative_url }})。本篇整理非线性方程组的基本问题、Newton 方法的局部收敛性及其全局化策略。

---

## 5.1 引言

本章讨论求解非线性方程组的方法。

**非线性方程组**  
要求解 $x\in D$，使

$$
F(x)=0
$$

成立，其中给定一个映射

$$
F=
\begin{pmatrix}
F_1\\
\vdots\\
F_n
\end{pmatrix}
:D\to\mathbb{R}^n,
\qquad
D\subseteq\mathbb{R}^n
$$

$D$ 是非空闭集。

许多具有实际意义的问题，尤其是在技术领域，都具有非线性特征，需要求解非线性方程组。例如，电路仿真以及非线性偏微分方程的离散化，会在天气和气候模型、结构力学计算、生产技术中的成形过程等问题中产生大型非线性方程组。

线性方程组的解集只可能是唯一解、无解，或者整个仿射子空间。与此不同，非线性方程也可能有多个孤立解，甚至有无穷多个孤立解。

**例 5.1.1**

1. $n=1$，$D=\mathbb{R}$，$F(x)=x^2-a$，$a>0$。  
   存在两个实数解

$$
x=\pm\sqrt a.
$$

2. $n=1$，$D=\mathbb{R}$，$F(x)=x^2+a$，$a>0$。  
   不存在实数解。

3. $n=1$，$D=\mathbb{R}$，$F(x)=x\sin(x)$。  
   存在无穷多个解

$$
x=k\pi,\qquad k\in\mathbb{Z}.
$$

4. 单位圆与直线 $G:x_2=ax_1+b$ 的交点，其中 $a,b\in\mathbb{R}$：  
   $n=2$，$D=\mathbb{R}^2$，

$$
F(x)=
\begin{pmatrix}
x_1^2+x_2^2-1\\
x_2-ax_1-b
\end{pmatrix}.
$$

   解的个数由 $a,b$ 的取值决定，可能有两个、一个或没有实数解。

在许多应用中，函数 $F$ 是连续可微的，即其偏导数

$$
\frac{\partial F_i}{\partial x_j},
\qquad 1\le i,j\le n
$$

存在且连续。在这种情况下，一阶泰勒展开给出

$$
F(x+s)=F(x)+F'(x)s+R(x;s),
$$

其中雅可比矩阵为

$$
F'(x)=
\begin{pmatrix}
\frac{\partial F_1}{\partial x_1}(x)&\cdots&\frac{\partial F_1}{\partial x_n}(x)\\
\vdots&\ddots&\vdots\\
\frac{\partial F_n}{\partial x_1}(x)&\cdots&\frac{\partial F_n}{\partial x_n}(x)
\end{pmatrix},
$$

余项为 $R(x;s)$，并且

$$
\lim_{s\to 0}\frac{\|R(x;s)\|}{\|s\|}=0,
\qquad
\text{简写为 } R(x;s)=o(\|s\|).
$$

这为构造快速求解方法提供了基础。

## 5.2 Newton 方法

Newton 方法是求解非线性方程组的重要方法之一，因为它在解附近通常收敛很快。为便于说明，下面假设 $D=\mathbb{R}^n$。

考虑用 Newton 方法求解方程组

$$
F(x)=0
\tag{5.1}
$$

其中 $F:\mathbb{R}^n\to\mathbb{R}^n$ 连续可微。

### 5.2.1 方法推导

**一维情形下的直观推导**

先设 $n=1$。此时 $F(x):\mathbb{R}\to\mathbb{R}$ 是实函数。设 $x^{(k)}$ 是方程 (5.1) 的某个解 $\overline x$ 的近似值。Newton 方法的思想是：在 $x^{(k)}$ 处用函数图像 $(x,F(x))$ 的切线近似 $F$，并将切线与 $x$ 轴的交点作为下一次迭代点 $x^{(k+1)}$。

切线方程为

$$
y=F(x^{(k)})+F'(x^{(k)})(x-x^{(k)}),
$$

$x^{(k+1)}$ 是下式

$$
F(x^{(k)})+F'(x^{(k)})(x-x^{(k)})=0
$$

的解。若 $F'(x^{(k)})\ne 0$，则

$$
x^{(k+1)}
=x^{(k)}-F'(x^{(k)})^{-1}F(x^{(k)}).
$$

因此

$$
x^{(k+1)}=x^{(k)}+s^{(k)},
$$

其中 $s^{(k)}$ 通过求解下列方程得到：

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)}).
$$

**例 5.2.1**  
对于 $F(x)=x^2-a$，$a>0$，有

$$
x^{(k+1)}
=x^{(k)}-\frac1{2x^{(k)}}\left((x^{(k)})^2-a\right)
=\frac12\left(x^{(k)}+\frac{a}{x^{(k)}}\right).
$$

**一般情形**

在一般情形下，设 $x^{(k)}\in\mathbb{R}^n$ 为当前迭代点。则 $\overline x$ 是方程 (5.1) 的解，当且仅当 $\overline x=x^{(k)}+s$，其中 $s$ 满足方程

$$
F(x^{(k)}+s)=0.
\tag{5.2}
$$

Newton 方法用一阶泰勒展开近似 $F(x^{(k)}+s)$，即

$$
F(x^{(k)}+s)
=F(x^{(k)})+F'(x^{(k)})s+o(\|s\|),
$$

其中 $F'(x^{(k)})$ 是 $F$ 在 $x^{(k)}$ 处的雅可比矩阵；当 $s$ 较小时，余项也较小。

因此，在第 $k$ 次 Newton 迭代中，用下面的线性化方程代替 (5.2)：

$$
F(x^{(k)})+F'(x^{(k)})s=0.
$$

由此得到如下算法。

**算法 5.2.2：方程组的局部 Newton 方法**

选择初始点 $x^{(0)}\in\mathbb{R}^n$。

对 $k=0,1,\ldots$：

1. 若 $F(x^{(k)})=0$：停止，结果为 $x^{(k)}$。
2. 求解 Newton 方程，得到 Newton 步 $s^{(k)}\in\mathbb{R}^n$：

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)}).
$$

3. 令

$$
x^{(k+1)}=x^{(k)}+s^{(k)}.
$$

<figure class="newton-figure">
  <figcaption class="newton-figure__caption">图 5.1：局部 Newton 方法的几何直观</figcaption>
  <svg viewBox="0 0 760 430" role="img" aria-labelledby="nonlinear-local-newton-title nonlinear-local-newton-desc">
    <title id="nonlinear-local-newton-title">局部 Newton 方法的切线迭代示意图</title>
    <desc id="nonlinear-local-newton-desc">以 F(x)=x²−2 为例，从初始点 x^(0) 出发，连续作切线并取切线与 x 轴的交点，迭代点逐步靠近根 x̄=√2。</desc>
    <defs>
      <marker id="nonlinear-local-newton-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#607d8b"></path>
      </marker>
      <marker id="nonlinear-local-newton-tangent-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#d97706"></path>
      </marker>
    </defs>
    <rect x="0" y="0" width="760" height="430" fill="#ffffff"></rect>

    <line x1="90" y1="275" x2="705" y2="275" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-local-newton-arrow)"></line>
    <line x1="90" y1="345" x2="90" y2="45" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-local-newton-arrow)"></line>

    <line x1="125.3" y1="270" x2="125.3" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="271.5" y1="270" x2="271.5" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="478.2" y1="270" x2="478.2" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="619.4" y1="270" x2="619.4" y2="280" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="120" y="300" font-size="14" fill="#455461">1</text>
    <text x="249" y="300" font-size="14" fill="#455461">x̄=√2</text>
    <text x="473" y="300" font-size="14" fill="#455461">2</text>
    <text x="610" y="300" font-size="14" fill="#455461">2.4</text>
    <text x="705" y="294" font-size="16" fill="#263238">x</text>
    <text x="63" y="54" font-size="16" fill="#263238">F(x)</text>

    <line x1="84" y1="185" x2="96" y2="185" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="95" x2="96" y2="95" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="65" y="280" font-size="14" fill="#455461">0</text>
    <text x="58" y="190" font-size="14" fill="#455461">2</text>
    <text x="58" y="100" font-size="14" fill="#455461">4</text>

    <path d="M90 328.6 L125.3 320 L160.6 310.6 L195.9 300.2 L231.2 288.9 L266.5 276.8 L301.8 263.7 L337.1 249.8 L372.4 234.9 L407.6 219.2 L442.9 202.5 L478.2 185 L513.5 166.5 L548.8 147.2 L584.1 126.9 L619.4 105.8 L654.7 83.7 L690 60.8" fill="none" stroke="#1565c0" stroke-width="3"></path>
    <line x1="271.5" y1="275" x2="271.5" y2="335" stroke="#546e7a" stroke-width="1.4" stroke-dasharray="5 5"></line>

    <line x1="619.4" y1="105.8" x2="342.9" y2="275" stroke="#d97706" stroke-width="2.2" stroke-dasharray="8 5" marker-end="url(#nonlinear-local-newton-tangent-arrow)"></line>
    <line x1="342.9" y1="247.4" x2="276.0" y2="273.4" stroke="#2e7d32" stroke-width="2.2" stroke-dasharray="8 5" marker-end="url(#nonlinear-local-newton-arrow)"></line>

    <circle cx="619.4" cy="105.8" r="6" fill="#d97706"></circle>
    <circle cx="342.9" cy="247.4" r="6" fill="#2e7d32"></circle>
    <circle cx="276.0" cy="273.4" r="6" fill="#7b1fa2"></circle>
    <circle cx="271.5" cy="275" r="5" fill="#263238"></circle>

    <text x="625" y="92" font-size="15" fill="#9a5b00">x^(0)</text>
    <text x="348" y="239" font-size="15" fill="#246b29">x^(1)</text>
    <text x="282" y="292" font-size="15" fill="#6a187f">x^(2)</text>
    <text x="520" y="117" font-size="15" fill="#12529d">F(x)=x²−2</text>
    <text x="470" y="205" font-size="14" fill="#9a5b00">在 x^(0) 处的切线</text>
    <text x="306" y="224" font-size="14" fill="#246b29">在 x^(1) 处的切线</text>

    <line x1="490" y1="350" x2="520" y2="350" stroke="#1565c0" stroke-width="3"></line>
    <text x="528" y="355" font-size="13" fill="#455461">函数曲线</text>
    <line x1="490" y1="375" x2="520" y2="375" stroke="#d97706" stroke-width="2.2" stroke-dasharray="8 5"></line>
    <text x="528" y="380" font-size="13" fill="#455461">切线与下一次迭代</text>
  </svg>
  <p class="newton-figure__note">示意取 $F(x)=x^2-2$。每次在当前迭代点作切线，并把切线与 $x$ 轴的交点作为下一次迭代；初始点足够接近根时，迭代点会很快靠近 $\overline x=\sqrt{2}$。</p>
</figure>

### 5.2.2 Newton 方法的超线性和二次局部收敛

在适当条件下，可以证明 Newton 方法具有很快的局部收敛速度。

为简化记号，下面始终使用欧几里得范数 $\|\cdot\|_2$ 及其诱导的矩阵范数；当然，也可以使用其他范数。

下面的定理给出 Newton 方法的超线性和二次局部收敛性。

**定理 5.2.3（Newton 方法的快速局部收敛）**  
设 $F:\mathbb{R}^n\to\mathbb{R}^n$ 连续可微，$\overline x\in\mathbb{R}^n$ 满足

$$
F(\overline x)=0
$$

且 $F'(\overline x)$ 非奇异。则存在 $\delta>0$，使得：

i) 在半径为 $\delta$ 的球

$$
B_\delta(\overline x)
:=
\{x\in\mathbb{R}^n:\|x-\overline x\|_2<\delta\}
$$

中，$\overline x$ 是 $F$ 的唯一零点。

ii) 对所有 $x^{(0)}\in B_\delta(\overline x)$，算法 5.2.2 要么在某一步达到 $x^{(k)}=\overline x$ 并终止，要么生成一个序列，满足

$$
(x^{(k)})\subset B_\delta(\overline x),
$$

该序列超线性收敛到 $\overline x$，即

$$
\lim_{k\to\infty}x^{(k)}=\overline x,
$$

并且

$$
\|x^{(k+1)}-\overline x\|_2
\le
\nu_k\|x^{(k)}-\overline x\|_2
$$

其中 $\nu_k\downarrow 0$，即该收敛因子趋于零。

iii) 若 $F'$ 在 $B_\delta(\overline x)$ 上满足 Lipschitz 条件，且 $L$ 为 Lipschitz 常数，即

$$
\|F'(x)-F'(y)\|_2
\le
L\|x-y\|_2
\qquad
\forall x,y\in B_\delta(\overline x),
$$

则 $(x^{(k)})$ 甚至以二次速度收敛到 $\overline x$，即

$$
\lim_{k\to\infty}x^{(k)}=\overline x,
$$

并且

$$
\|x^{(k+1)}-\overline x\|_2
\le
C\|x^{(k)}-\overline x\|_2^2,
$$

其中，当 $\delta>0$ 足够小时，可以选取

$$
C=L\cdot\|F'(\overline x)^{-1}\|_2.
$$

提示：若 $F$ 在闭球 $B_\delta(\overline x)$ 上具有连续的二阶导数，则 $F'$ 自动满足 Lipschitz 条件。

不过，算法 5.2.2 中的 Newton 方法通常只从足够接近某个解 $\overline x$ 的初始点出发时才会收敛。

**例 5.2.4**  
考虑

$$
F(x)=\frac{x}{\sqrt{1+x^2}}.
$$

函数 $F$ 只有一个零点 $\overline x=0$，且连续可微，并满足 $F'(x)>0$。尽管如此，当 $\lvert x^{(0)}\rvert>1$ 时，从任意这样的初始点出发，Newton 方法都不会收敛（见习题）。

为了使 Newton 方法从任意初始点出发都能收敛，需要对它进行适当的全局化处理。

### 5.2.3 Newton 方法的全局化

本节介绍 Newton 方法的一种改进。对于一大类函数 $F$，这种改进能够保证从任意初始点出发的全局收敛。

这一方法基于如下观察：方程 (5.1) 的每个解 $\overline x$ 都是最小化问题

$$
\min_{x\in\mathbb{R}^n}\|F(x)\|_2^2
$$

的全局极小点。

具体采用如下策略：

- 使用 Newton 步 $s^{(k)}$，但配合步长 $\sigma_k\in(0,1]$，将新迭代点取为

$$
x^{(k+1)}=x^{(k)}+\sigma_k s^{(k)}.
$$

- 选择步长 $\sigma_k$，使

$$
\|F(x^{(k+1)})\|_2<\|F(x^{(k)})\|_2
\tag{5.3}
$$

成立，而且下降幅度足够大。

对函数

$$
\phi(\sigma)
:=
\|F(x^{(k)}+\sigma s^{(k)})\|_2^2
$$

<figure class="newton-figure">
  <figcaption class="newton-figure__caption">图 5.2：全局化 Newton 方法的 Armijo 步长选择示意</figcaption>
  <svg viewBox="0 0 760 420" role="img" aria-labelledby="nonlinear-global-newton-title nonlinear-global-newton-desc">
    <title id="nonlinear-global-newton-title">全局化 Newton 方法的步长搜索示意图</title>
    <desc id="nonlinear-global-newton-desc">图中绘制残差平方函数 φ(σ)。完整步长 σ=1 没有达到 Armijo 下降条件而被拒绝，最大的可接受步长是 σ=1/2。</desc>
    <defs>
      <marker id="nonlinear-global-newton-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#607d8b"></path>
      </marker>
    </defs>
    <rect x="0" y="0" width="760" height="420" fill="#ffffff"></rect>

    <line x1="90" y1="320" x2="705" y2="320" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-global-newton-arrow)"></line>
    <line x1="90" y1="350" x2="90" y2="55" stroke="#607d8b" stroke-width="1.8" marker-end="url(#nonlinear-global-newton-arrow)"></line>

    <line x1="90" y1="315" x2="90" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="240" y1="315" x2="240" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="390" y1="315" x2="390" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="690" y1="315" x2="690" y2="325" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="84" y="345" font-size="14" fill="#455461">0</text>
    <text x="224" y="345" font-size="14" fill="#455461">1/4</text>
    <text x="374" y="345" font-size="14" fill="#455461">1/2</text>
    <text x="685" y="345" font-size="14" fill="#455461">1</text>
    <text x="708" y="338" font-size="16" fill="#263238">步长 σ</text>
    <text x="40" y="55" font-size="15" fill="#263238">φ(σ)</text>

    <line x1="84" y1="320" x2="96" y2="320" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="230" x2="96" y2="230" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="140" x2="96" y2="140" stroke="#607d8b" stroke-width="1.2"></line>
    <line x1="84" y1="95" x2="96" y2="95" stroke="#607d8b" stroke-width="1.2"></line>
    <text x="63" y="325" font-size="14" fill="#455461">0</text>
    <text x="57" y="235" font-size="14" fill="#455461">2</text>
    <text x="57" y="145" font-size="14" fill="#455461">4</text>
    <text x="57" y="100" font-size="14" fill="#455461">5</text>

    <line x1="90" y1="140" x2="690" y2="176" stroke="#78909c" stroke-width="2" stroke-dasharray="8 6"></line>
    <text x="505" y="165" font-size="14" fill="#546e7a">Armijo 下降界</text>

    <path d="M90 140 C135 150 185 173 240 180.5 C290 188 340 210 390 212 C485 220 580 153 690 95" fill="none" stroke="#1565c0" stroke-width="3"></path>
    <circle cx="90" cy="140" r="5" fill="#1565c0"></circle>
    <circle cx="240" cy="180.5" r="6" fill="#2e7d32"></circle>
    <circle cx="390" cy="212" r="7" fill="#2e7d32"></circle>
    <circle cx="690" cy="95" r="7" fill="#c62828"></circle>

    <text x="104" y="130" font-size="14" fill="#12529d">φ(0)</text>
    <text x="185" y="169" font-size="14" fill="#246b29">可接受</text>
    <text x="400" y="231" font-size="14" fill="#246b29">最大可接受步长</text>
    <text x="575" y="87" font-size="14" fill="#a21f1f">σ=1：拒绝</text>

    <circle cx="490" cy="275" r="6" fill="#2e7d32"></circle>
    <text x="505" y="280" font-size="13" fill="#455461">满足 Armijo 条件</text>
    <circle cx="490" cy="300" r="6" fill="#c62828"></circle>
    <text x="505" y="305" font-size="13" fill="#455461">完整 Newton 步未被接受</text>
  </svg>
  <p class="newton-figure__note">全局化策略沿离散候选步长 $1,1/2,1/4,\ldots$ 回溯，选取满足 Armijo 条件的最大步长。图中完整步长 $\sigma=1$ 使残差平方增大，因此改用 $\sigma=1/2$。</p>
</figure>

在 $\sigma=0$ 处作泰勒展开，得到

$$
\phi(\sigma)
=\phi(0)+\phi'(0)\sigma+o(\sigma)
=
\|F(x^{(k)})\|_2^2
+2\sigma F(x^{(k)})^T F'(x^{(k)})s^{(k)}
+o(\sigma).
$$

代入 Newton 方程

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)})
$$

代入上式可得

$$
\|F(x^{(k)}+\sigma s^{(k)})\|_2^2
=
\|F(x^{(k)})\|_2^2
-2\sigma\|F(x^{(k)})\|_2^2
+o(\sigma).
$$

固定 $\delta\in(0,1)$。当 $F(x^{(k)})\ne 0$ 且 $\sigma$ 足够小时，有

$$
\|F(x^{(k)}+\sigma s^{(k)})\|_2^2
\le
\|F(x^{(k)})\|_2^2
-2\delta\sigma\|F(x^{(k)})\|_2^2.
$$

这说明可以采用下面的 Armijo 步长规则。

**Armijo 步长选择**  
取定

$$
\delta\in(0,\tfrac12)
$$

（例如取 $\delta=10^{-3}$ 通常效果较好）。从下列集合中选取满足条件的最大步长

$$
\sigma_k\in\left\{1,\frac12,\frac14,\ldots\right\}
$$

使

$$
\|F(x^{(k)}+\sigma_k s^{(k)})\|_2^2
\le
\|F(x^{(k)})\|_2^2
-2\delta\sigma_k\|F(x^{(k)})\|_2^2.
\tag{5.4}
$$

由此得到如下算法。

**算法 5.2.5：方程组的全局化 Newton 方法**

选择初始点 $x^{(0)}\in\mathbb{R}^n$。

对 $k=0,1,\ldots$：

1. 若 $F(x^{(k)})=0$：停止，结果为 $x^{(k)}$。
2. 求解 Newton 方程，得到 Newton 步 $s^{(k)}\in\mathbb{R}^n$：

$$
F'(x^{(k)})s^{(k)}=-F(x^{(k)}).
$$

3. 按 Armijo 规则 (5.4) 确定 $\sigma_k$。
4. 令

$$
x^{(k+1)}=x^{(k)}+\sigma_k s^{(k)}.
$$

相应的收敛性由下面的定理保证。

**定理 5.2.6**  
设 $F:\mathbb{R}^n\to\mathbb{R}^n$ 连续可微，并取任意初始点 $x^{(0)}\in\mathbb{R}^n$。记

$$
f(x)=\|F(x)\|_2^2,
$$

并定义水平集

$$
N_f(x^{(0)})
:=
\{\,y:f(y)\le f(x^{(0)})\,\},
$$

若对该水平集中的每个点 $x$，雅可比矩阵 $F'(x)$ 都可逆，且 $N_f(x^{(0)})$ 是紧集（在 $\mathbb{R}^n$ 中等价于有界且闭），则从 $x^{(0)}$ 出发运行算法 5.2.5 时，要么在有限步内终止，要么生成序列

$$
(x^{(k)})\subset N_f(x^{(0)}),
$$

并满足：

i) $(x^{(k)})$ 收敛到方程 (5.1) 的某个解 $\overline x$。

ii) 存在 $l\ge 0$，使得当 $k\ge l$ 时都有 $\sigma_k=1$。因此，算法最终会恢复为每一步都取完整 Newton 步的局部方法，并以超线性或二次速度收敛到 $\overline x$。

---

返回阅读 [数值分析讲义（四）：线性方程组/矩阵运算数值求解 Part II]({{ '/zh/linear-systems-cholesky-conditioning/' | relative_url }})。

继续阅读 [数值分析讲义（六）：特征值和特征向量计算方法 Part I]({{ '/zh/eigenvalue-problems-part-i/' | relative_url }})。

**来源、版权与使用说明**

本文主要参考 TU Darmstadt 信息学专业公开仓库中的数值分析基础课讲义：
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
原仓库包含 The Unlicense 授权说明。本文作为个人学习、翻译与知识整理用途发布，文中的中文表述、补充解释和图表重制不代表原作者或官方立场。
本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原文链接的前提下，用于非商业学习、交流和引用。由于本文部分内容基于 TU Darmstadt 公开讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议同时确认原始材料的授权状态。
如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系我指出，我会及时处理或删除。
