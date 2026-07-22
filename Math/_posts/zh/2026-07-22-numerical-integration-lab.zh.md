---
title: "数值分析讲义（二）：数值积分"
lang: "zh"
date: 2026-07-22
permalink: /zh/numerical-integration-lab/
en_link: /en/numerical-integration-lab/
categories:
  - Math
tags:
  - Numerical Methods
  - Numerical Integration
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}

.quadrature-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.quadrature-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.quadrature-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.quadrature-figure__note {
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

建议先阅读 [数值分析讲义（一）：插值方法]({{ '/zh/interpolation-lab/' | relative_url }})，因为本章的 Newton-Cotes 求积会直接用到插值多项式和 Lagrange 基函数。本文接着讨论数值积分，也就是如何用有限个函数值近似计算定积分。

---

**数值积分**

本章讨论如何近似计算定积分

$$
\int_a^b f(x)\,dx
$$

的常用方法。

**积分任务**  
给定可积函数 $f:[a,b]\to\mathbb{R}$，计算

$$
I(f)=\int_a^b f(x)\,dx.
$$

即使函数形式并不复杂，也未必能解析地写出原函数，例如

$$
\frac{\sin x}{x}
\qquad\text{和}\qquad
e^{-x^2}.
$$

这时就需要数值积分。许多数值积分方法都基于同一个想法：先在若干支撑点

$$
(x_i,f(x_i)),\qquad x_i\in[a,b],
$$

上用多项式 $p_n$ 近似 $f$，再对这个多项式积分。这样得到的近似为

$$
I_n(f)=\int_a^b p_n(x)\,dx,
$$

这类方法称为**插值型求积**。

## 2.1 Newton-Cotes 求积

### 2.1.1 闭型 Newton-Cotes 求积

对 $n\in\mathbb{N}$，选择等距支撑点

$$
x_i=a+ih,\qquad i=0,\ldots,n,\qquad h=\frac{b-a}{n}.
$$

于是插值多项式 $p_n$ 的 Lagrange 表示为

$$
p_n(x)=\sum_{i=0}^{n} f(x_i)L_{i,n}(x),
\qquad
L_{i,n}(x)=
\prod_{\substack{j=0\\ j\ne i}}^{n}
\frac{x-x_j}{x_i-x_j}.
$$

由此得到数值求积公式

$$
I_n(f)
=\int_a^b p_n(x)\,dx
=\sum_{i=0}^{n} f(x_i)\int_a^b L_{i,n}(x)\,dx.
$$

作代换 $x=a+sh$，其中 $s\in[0,n]$，可得：

**闭型 Newton-Cotes 公式**

$$
I_n(f)
=h\sum_{i=0}^{n}\alpha_{i,n}f(x_i),
\qquad
\alpha_{i,n}
=\int_0^n
\prod_{\substack{j=0\\ j\ne i}}^{n}
\frac{s-j}{i-j}\,ds.
\tag{2.1}
$$

数 $\alpha_{0,n},\ldots,\alpha_{n,n}$ 称为权重。它们与 $f$ 以及区间 $[a,b]$ 无关，因此可以预先制表。并且总有

$$
\sum_{i=0}^{n}h\alpha_{i,n}=b-a.
$$

**定义 2.1.1**  
积分公式

$$
J(f)=\sum_{i=0}^{n}\beta_i f(x_i)
$$

如果它至少能精确积分所有次数不超过 $n$ 的多项式, 称为具有 $n$ 阶精确度。

闭型 Newton-Cotes 公式 $I_n(f)$ 按构造具有 $n$ 阶精确度。

重要的是估计误差

$$
E_n(f):=I(f)-I_n(f).
$$

由推论 1.1.4 可知

$$
|f(x)-p_n(x)|
\le
\frac{|f^{(n+1)}(\xi)|}{(n+1)!}(b-a)^{n+1},
$$

其中 $\xi\in[a,b]$。因此，对某个（可能不同的）$\xi\in[a,b]$ 有

$$
\left|
\int_a^b f(x)\,dx-\int_a^b p_n(x)\,dx
\right|
\le
\int_a^b |f(x)-p_n(x)|\,dx
\le
\frac{|f^{(n+1)}(\xi)|}{(n+1)!}(b-a)^{n+2}.
$$

通过 Taylor 展开可以得到更精细的余项估计。结果如下表所示。

| $n$ | $\alpha_{i,n}$ | 最大误差 $E_n(f)$ | 名称 |
|---:|---|---|---|
| 1 | $\frac12,\frac12$ | $-\frac{f^{(2)}(\xi)}{12}h^3$ | 梯形规则 |
| 2 | $\frac13,\frac43,\frac13$ | $-\frac{f^{(4)}(\xi)}{90}h^5$ | Simpson 规则 |
| 3 | $\frac38,\frac98,\frac98,\frac38$ | $-\frac{3f^{(4)}(\xi)}{80}h^5$ | 3/8 规则 |
| 4 | $\frac{14}{45},\frac{64}{45},\frac{24}{45},\frac{64}{45},\frac{14}{45}$ | $-\frac{8f^{(6)}(\xi)}{945}h^7$ | Milne 规则 |

需要注意的是，当 $n\ge 7$ 时，Newton-Cotes 权重会出现负值。负权重会带来相消，使公式在数值上越来越不稳定，所以实际计算中通常不会单纯通过增大 $n$ 来提高精度。

**示意图 2.1：** 闭型 Newton-Cotes 会使用端点。梯形规则用一条直线连接端点，Simpson 规则则用通过三个节点的二次曲线近似函数。

<figure class="quadrature-figure">
  <figcaption class="quadrature-figure__caption">闭型 Newton-Cotes：梯形规则与 Simpson 规则</figcaption>
  <svg viewBox="0 0 920 430" role="img" aria-labelledby="closed-quadrature-title closed-quadrature-desc">
    <title id="closed-quadrature-title">闭型 Newton-Cotes 面积近似示意图</title>
    <desc id="closed-quadrature-desc">图中显示函数曲线、端点节点、梯形近似区域以及 Simpson 二次曲线近似区域。</desc>
    <defs>
      <linearGradient id="closed-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#a7d8c9" stop-opacity="0.65" />
        <stop offset="100%" stop-color="#a7d8c9" stop-opacity="0.2" />
      </linearGradient>
      <linearGradient id="simpson-fill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#f4b860" stop-opacity="0.55" />
        <stop offset="100%" stop-color="#f4b860" stop-opacity="0.18" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="920" height="430" fill="#fff" />
    <line x1="70" y1="350" x2="860" y2="350" stroke="#64748b" stroke-width="2" />
    <line x1="90" y1="360" x2="90" y2="70" stroke="#64748b" stroke-width="2" />
    <text x="845" y="382" fill="#334155" font-size="20">x</text>
    <text x="54" y="84" fill="#334155" font-size="20">f(x)</text>
    <path d="M 120 350 L 120 255 L 450 142 L 780 235 L 780 350 Z" fill="url(#closed-fill)" stroke="#18745f" stroke-width="2" />
    <path d="M 120 350 L 120 255 Q 450 40 780 235 L 780 350 Z" fill="url(#simpson-fill)" stroke="#d27d00" stroke-width="3" />
    <path d="M 120 255 C 210 188 310 122 450 118 C 590 116 690 181 780 235" fill="none" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <line x1="120" y1="255" x2="780" y2="235" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="9 8" />
    <circle cx="120" cy="255" r="8" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <circle cx="450" cy="118" r="8" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <circle cx="780" cy="235" r="8" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <line x1="120" y1="350" x2="120" y2="365" stroke="#64748b" stroke-width="2" />
    <line x1="450" y1="350" x2="450" y2="365" stroke="#64748b" stroke-width="2" />
    <line x1="780" y1="350" x2="780" y2="365" stroke="#64748b" stroke-width="2" />
    <text x="112" y="392" fill="#334155" font-size="20">a</text>
    <text x="429" y="392" fill="#334155" font-size="20">中点</text>
    <text x="772" y="392" fill="#334155" font-size="20">b</text>
    <rect x="590" y="74" width="238" height="96" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="614" y1="100" x2="672" y2="100" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <text x="690" y="107" fill="#334155" font-size="19">原函数</text>
    <line x1="614" y1="130" x2="672" y2="130" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="9 8" />
    <text x="690" y="137" fill="#334155" font-size="19">梯形规则</text>
    <line x1="614" y1="160" x2="672" y2="160" stroke="#d27d00" stroke-width="3" />
    <text x="690" y="167" fill="#334155" font-size="19">Simpson 规则</text>
  </svg>
  <p class="quadrature-figure__note">闭型公式把端点 $a,b$ 也作为节点。二次插值通常能更好贴合曲率，但高阶 Newton-Cotes 不一定更稳定。</p>
</figure>

**例：**考虑 $f(x)=\log_2(x)$ 在区间 $[a,b]=[2,4]$ 上的积分。精确积分为

$$
I(f)
=\int_2^4 f(x)\,dx
=\int_2^4 \log_2(x)\,dx
=\left.\frac{1}{\ln(2)}(x\ln(x)-x)\right|_2^4
$$

$$
=\frac{4\ln(4)-4-2\ln(2)+2}{\ln(2)}
\approx 3.11461.
$$

梯形规则给出：$h=\frac{2}{1}=2$，因此

$$
I_1(f)
=2\left(\frac12 f(2)+\frac12 f(4)\right)
=2\left(\frac12\log_2(2)+\frac12\log_2(4)\right)
=2\left(\frac12+1\right)=3.
$$

对 Simpson 规则，有 $h=\frac{2}{2}=1$，并且

$$
I_2(f)
=1\left(\frac13 f(2)+\frac43 f(3)+\frac13 f(4)\right)
\approx 3.11328.
$$

使用 $\xi\in[2,4]$ 时，梯形规则的误差估计为

$$
E_1(f)
=-\frac{f''(\xi)h^3}{12}
=\frac{1}{\xi^2\ln(2)}\frac{8}{12}
\le
\frac{1}{2^2\ln(2)}\frac{2}{3}
\approx 0.24045.
$$

这与实际误差 $0.11461$ 可以接受地吻合。Simpson 规则的误差为

$$
E_2(f)
=-\frac{f^{(4)}(\xi)h^5}{90}
=\frac{6}{\xi^4\ln(2)}\frac{1}{90}
\le
\frac{6}{2^4\ln(2)}\frac{1}{90}
\approx 0.00601,
$$

这与实际误差 $0.00133$ 吻合得很好。

### 2.1.2 开型 Newton-Cotes 求积

这里对 $n\in\mathbb{N}\cup\{0\}$，选择位于开区间 $(a,b)$ 内的等距支撑点

$$
x_i=a+ih,\qquad i=1,\ldots,n+1,\qquad h=\frac{b-a}{n+2}.
$$

用完全类似的方式处理，可以得到插值型积分公式：

**开型 Newton-Cotes 公式**

$$
\tilde I_n(f)
=h\sum_{i=1}^{n+1}\tilde\alpha_{i,n}f(x_i),
\qquad
\tilde\alpha_{i,n}
=
\int_0^{n+2}
\prod_{\substack{j=1\\ j\ne i}}^{n+1}
\frac{s-j}{i-j}\,ds.
$$

求积误差也有与闭型情形类似的公式：

| $n$ | $\tilde\alpha_{i,n}$ | 最大误差 $\tilde E_n(f)$ | 名称 |
|---:|---|---|---|
| 0 | $2$ | $\frac{f^{(2)}(\xi)}{3}h^3$ | 矩形规则 |
| 1 | $\frac32,\frac32$ | $\frac{3f^{(2)}(\xi)}{4}h^3$ |  |
| 2 | $\frac83,-\frac43,\frac83$ | $\frac{28f^{(4)}(\xi)}{90}h^5$ |  |

**示意图 2.2：** 开型 Newton-Cotes 不使用端点。矩形规则只取区间内部的一个点，常见做法是用中点函数值乘以区间长度。

<figure class="quadrature-figure">
  <figcaption class="quadrature-figure__caption">开型 Newton-Cotes：中点矩形规则</figcaption>
  <svg viewBox="0 0 920 400" role="img" aria-labelledby="open-quadrature-title open-quadrature-desc">
    <title id="open-quadrature-title">开型 Newton-Cotes 节点示意图</title>
    <desc id="open-quadrature-desc">图中端点以空心点表示，中点作为实际采样节点，并用矩形面积近似曲线下方的积分。</desc>
    <rect x="0" y="0" width="920" height="400" fill="#fff" />
    <line x1="70" y1="320" x2="860" y2="320" stroke="#64748b" stroke-width="2" />
    <line x1="90" y1="335" x2="90" y2="70" stroke="#64748b" stroke-width="2" />
    <text x="845" y="354" fill="#334155" font-size="20">x</text>
    <text x="54" y="84" fill="#334155" font-size="20">f(x)</text>
    <rect x="190" y="130" width="520" height="190" fill="#cfe8f3" stroke="#1d6fb8" stroke-width="3" />
    <path d="M 190 260 C 280 220 360 145 450 130 C 550 114 642 142 710 190" fill="none" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <line x1="190" y1="320" x2="190" y2="335" stroke="#64748b" stroke-width="2" />
    <line x1="450" y1="320" x2="450" y2="335" stroke="#64748b" stroke-width="2" />
    <line x1="710" y1="320" x2="710" y2="335" stroke="#64748b" stroke-width="2" />
    <circle cx="190" cy="260" r="8" fill="#fff" stroke="#64748b" stroke-width="3" />
    <circle cx="710" cy="190" r="8" fill="#fff" stroke="#64748b" stroke-width="3" />
    <circle cx="450" cy="130" r="9" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <text x="184" y="360" fill="#334155" font-size="20">a</text>
    <text x="428" y="360" fill="#334155" font-size="20">内部节点</text>
    <text x="704" y="360" fill="#334155" font-size="20">b</text>
    <text x="330" y="217" fill="#1d4f6f" font-size="22">2h · f(x₁)</text>
    <rect x="610" y="70" width="220" height="78" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <circle cx="632" cy="96" r="7" fill="#fff" stroke="#64748b" stroke-width="3" />
    <text x="654" y="103" fill="#334155" font-size="18">端点不取样</text>
    <circle cx="632" cy="126" r="7" fill="#e85d04" stroke="#fff" stroke-width="3" />
    <text x="654" y="133" fill="#334155" font-size="18">内部采样点</text>
  </svg>
  <p class="quadrature-figure__note">当函数在端点不可取值、端点值不可靠，或者算法本身要求避开端点时，开型公式会更自然。</p>
</figure>

**例：**再次考虑 $f(x)=\log_2(x)$ 在 $[2,4]$ 上的积分，其精确值为 $I(f)\approx 3.11461$。矩形规则给出：$h=\frac22=1$，于是

$$
\tilde I_0(f)=2f(3)\approx 3.16992.
$$

误差估计为

$$
\tilde E_0(f)
=\frac{f^{(2)}(\xi)h^3}{3}
=-\frac{1}{\xi^2\ln(2)}\frac13
\ge
-\frac{1}{2^2\ln(2)}\frac13
\approx -0.12022,
$$

而精确误差为 $-0.05529$。

## 2.2 复化 Newton-Cotes 公式

Newton-Cotes 公式只在积分区间较小、节点数不过大时比较可靠。因此，更常用的做法是把区间 $[a,b]$ 分解成多个小区间，并在每个小区间上分别使用 Newton-Cotes 公式，最后把这些子积分相加。

把区间 $[a,b]$ 分解为 $m$ 个长度为

$$
H=\frac{b-a}{m}
$$

的子区间，在这些子区间上分别应用 $n$ 次 Newton-Cotes 公式，并把结果相加。令

$$
N=m\cdot n,\qquad
H=\frac{b-a}{m},\qquad
h=\frac{H}{n}=\frac{b-a}{N},
$$

$$
x_i=a+ih,\qquad i=0,\ldots,N,
$$

$$
y_j=a+jH,\qquad j=0,\ldots,m.
$$

由于

$$
I(f)=\sum_{j=0}^{m-1}\int_{y_j}^{y_{j+1}}f(x)\,dx,
$$

得到：**复化闭型 Newton-Cotes 公式**

$$
S_N^{(n)}(f)
=h\sum_{j=0}^{m-1}\sum_{i=0}^{n}
\alpha_{i,n}f(x_{jn+i}).
$$

权重 $\alpha_{i,n}$ 仍由 (2.1) 给出。求积误差

$$
R_N^{(n)}(f)=I(f)-S_N^{(n)}(f)
$$

可以通过累加各个子区间上的误差得到。

**定理 2.2.1：**设 $f\in C^{n+2}([a,b])$。则存在中间点 $\xi\in(a,b)$，使得

$$
R_N^{(n)}(f)=
\begin{cases}
C(n)f^{(n+2)}(\xi)(b-a)h^{n+2}, & n \text{ 为偶数},\\
C(n)f^{(n+1)}(\xi)(b-a)h^{n+1}, & n \text{ 为奇数}.
\end{cases}
$$

这里 $C(n)$ 是只依赖于 $n$ 的常数。

下面列出最常用的几个复化公式及其求积误差。

**复化梯形规则**

闭型，$n=1$，$h=\frac{b-a}{m}$：

$$
S_N^{(1)}(f)
=\frac{h}{2}
\sum_{j=0}^{m-1}
\left(f(x_j)+f(x_{j+1})\right),
\qquad
x_j=a+jh.
$$

误差：

$$
R_N^{(1)}(f)
=-\frac{f''(\xi)}{12}(b-a)h^2.
$$

**复化 Simpson 规则**

闭型，$n=2$，$h=\frac{b-a}{2m}$：

$$
S_N^{(2)}(f)
=\frac{h}{3}
\sum_{j=0}^{m-1}
\left(f(x_{2j})+4f(x_{2j+1})+f(x_{2j+2})\right),
\qquad
x_j=a+jh.
$$

误差：

$$
R_N^{(2)}(f)
=-\frac{f^{(4)}(\xi)}{180}(b-a)h^4.
$$

**复化矩形规则**

开型，$n=0$，$2m=N$，$h=\frac{b-a}{N}$：

$$
\tilde S_N^{(0)}(f)
=2h\sum_{j=1}^{m} f(x_{2j-1}),
\qquad
x_j=a+jh.
$$

误差：

$$
\tilde R_N^{(0)}(f)
=\frac{f''(\xi)}{6}(b-a)h^2.
$$

**示意图 2.3：** 复化公式通过缩小步长 $h$ 来降低误差。梯形规则的误差主阶通常随 $h^2$ 下降，Simpson 规则则随 $h^4$ 下降。

<figure class="quadrature-figure">
  <figcaption class="quadrature-figure__caption">复化公式：把区间切细后累加子积分</figcaption>
  <svg viewBox="0 0 920 430" role="img" aria-labelledby="composite-quadrature-title composite-quadrature-desc">
    <title id="composite-quadrature-title">复化 Newton-Cotes 和误差收敛示意图</title>
    <desc id="composite-quadrature-desc">左侧显示区间被分成多个小梯形，右侧显示梯形规则和 Simpson 规则随步长减小而下降的误差曲线。</desc>
    <rect x="0" y="0" width="920" height="430" fill="#fff" />
    <line x1="70" y1="330" x2="430" y2="330" stroke="#64748b" stroke-width="2" />
    <line x1="90" y1="340" x2="90" y2="70" stroke="#64748b" stroke-width="2" />
    <path d="M 110 270 C 155 220 190 165 240 150 C 310 130 365 185 410 232" fill="none" stroke="#24343b" stroke-width="4" stroke-linecap="round" />
    <path d="M 110 330 L 110 270 L 170 202 L 230 152 L 290 144 L 350 176 L 410 232 L 410 330 Z" fill="#a7d8c9" fill-opacity="0.45" stroke="#18745f" stroke-width="2" />
    <g stroke="#18745f" stroke-width="2">
      <line x1="170" y1="202" x2="170" y2="330" />
      <line x1="230" y1="152" x2="230" y2="330" />
      <line x1="290" y1="144" x2="290" y2="330" />
      <line x1="350" y1="176" x2="350" y2="330" />
    </g>
    <text x="196" y="374" fill="#334155" font-size="20">多个小区间</text>
    <text x="84" y="58" fill="#334155" font-size="18">f(x)</text>
    <text x="410" y="360" fill="#334155" font-size="18">x</text>
    <line x1="520" y1="330" x2="850" y2="330" stroke="#64748b" stroke-width="2" />
    <line x1="540" y1="340" x2="540" y2="70" stroke="#64748b" stroke-width="2" />
    <text x="812" y="360" fill="#334155" font-size="18">h 减小</text>
    <text x="492" y="84" fill="#334155" font-size="18">误差</text>
    <path d="M 570 110 C 650 158 730 218 820 295" fill="none" stroke="#1d6fb8" stroke-width="4" stroke-linecap="round" />
    <path d="M 570 86 C 630 154 700 250 820 316" fill="none" stroke="#c1121f" stroke-width="4" stroke-linecap="round" />
    <circle cx="570" cy="110" r="6" fill="#1d6fb8" />
    <circle cx="820" cy="295" r="6" fill="#1d6fb8" />
    <circle cx="570" cy="86" r="6" fill="#c1121f" />
    <circle cx="820" cy="316" r="6" fill="#c1121f" />
    <rect x="610" y="98" width="210" height="76" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="632" y1="124" x2="690" y2="124" stroke="#1d6fb8" stroke-width="4" />
    <text x="704" y="131" fill="#334155" font-size="18">梯形：O(h²)</text>
    <line x1="632" y1="154" x2="690" y2="154" stroke="#c1121f" stroke-width="4" />
    <text x="704" y="161" fill="#334155" font-size="18">Simpson：O(h⁴)</text>
  </svg>
  <p class="quadrature-figure__note">复化思想的重点不是把单个区间上的插值次数无限提高，而是把区间切细，让每一段上的低阶公式更可靠。</p>
</figure>

**例：**再次考虑 $f(x)=\log_2(x)$ 在 $[2,4]$ 上的积分，精确值为 $I(f)\approx 3.11461$，并取 $m=2$。

- 对复化梯形规则，有 $n=1$、$N=m=2$、$h=\frac22=1$，得到

  $$
  S_N^{(1)}(f)
  =\frac12\left(f(2)+f(3)+f(3)+f(4)\right)
  \approx
  \frac12(1+1.5849+1.5849+2)
  =3.08496.
  $$

  误差估计给出

  $$
  R_N^{(1)}(f)
  =-\frac{f''(\xi)}{12}(b-a)h^2
  =
  \frac{1}{\xi^2\ln(2)}\frac{2}{12}
  \le
  \frac{1}{2^2\ln(2)}\frac{2}{12}
  \approx 0.06011.
  $$

  这明显减小了简单梯形规则的误差；真实误差为 $0.02965$。

- 对复化 Simpson 规则，有 $n=2$、$N=4$、$h=\frac24=\frac12$，并且

  $$
  S_N^{(2)}(f)
  =
  \frac{1}{2\cdot 3}
  \left(
  (f(2)+4f(2.5)+f(3))
  +(f(3)+4f(3.5)+f(4))
  \right)
  \approx 3.11450.
  $$

  误差估计为 $R_N^{(2)}(f)\le 0.00037$，真实误差为 $0.00011$。

- 对复化矩形规则，得到 $h=\frac24=\frac12$，并且

  $$
  \tilde S_N^{(0)}(f)
  =
  \frac22\bigl(f(2.5)+f(3.5)\bigr)
  \approx 3.12928.
  $$

  误差估计为

  $$
  \tilde R_N^{(0)}(f)
  =
  \frac{f''(\xi)}{6}(b-a)h^2
  =
  -\frac{1}{\xi^2\ln(2)}\frac16\frac24
  \ge
  -\frac{1}{2^2\ln(2)}\frac16\frac12
  \approx -0.03005,
  $$

  真实误差为 $-0.01467$。

**来源、版权与使用说明**

本文主要参考 TU Darmstadt 信息学专业公开仓库中的数值分析基础课讲义：
mathe3-script-2011-SoSe.pdf
原仓库包含 The Unlicense 授权说明。本文作为个人学习、翻译与知识整理用途发布，文中的中文表述、补充解释和图表重制不代表原作者或官方立场。

本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原文链接的前提下，用于非商业学习、交流和引用。由于本文部分内容基于 TU Darmstadt 公开讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议同时确认原始材料的授权状态。

如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系我指出，我会及时处理或删除。
