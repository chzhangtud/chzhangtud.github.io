---
title: "数值分析讲义（三）：常微分方程初值问题与刚性 Part I"
lang: "zh"
date: 2026-07-27
permalink: /zh/ode-initial-value-stability/
en_link: /en/ode-initial-value-stability/
categories:
  - Math
tags:
  - Numerical Methods
  - Ordinary Differential Equations
  - Stability
toc: true
---

<style>
body {
  font-size: 14px;
}

.ode-figure {
  border: 1px solid #d7dee2;
  border-radius: 8px;
  background: #fbfcfd;
  color: #1f2933;
  margin: 1.5rem 0;
  overflow: hidden;
}

.ode-figure__caption {
  background: #eef3f5;
  border-bottom: 1px solid #d7dee2;
  font-weight: 600;
  padding: 0.75rem 0.9rem;
}

.ode-figure svg {
  background: #ffffff;
  display: block;
  height: auto;
  width: 100%;
}

.ode-figure__note {
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

建议先阅读 [数值分析讲义（二）：数值积分]({{ '/zh/numerical-integration-lab/' | relative_url }})。本篇是 Part I，只整理常微分方程（ordinary differential equation, ODE）初值问题中的基本数值方法、相容性、稳定性和收敛性；
<!-- 刚性微分方程与稳定区域放在 [Part II]({{ '/zh/ode-stiffness-stability/' | relative_url }})。 -->

---

## 3.1 引言

自然科学、工程技术和经济学中的许多应用都会导向常微分方程的初值问题。

**初值问题**

给定函数

$$
f:[a,b]\times\mathbb{R}^n\to\mathbb{R}^n
$$

以及初值 $y_0\in\mathbb{R}^n$。要求寻找函数

$$
y:[a,b]\to\mathbb{R}^n,
$$

使其导数 $y'$ 满足形如

$$
y'(t)=f(t,y(t)),\qquad t\in[a,b]
$$

的常微分方程，并且满足初始条件 $y(a)=y_0$。下面采用英语缩写 IVP（initial value problem）表示初值问题，简写为

$$
\text{(IVP)}\qquad
y'(t)=f(t,y(t)),\qquad t\in[a,b],
\tag{3.1}
$$

$$
y(a)=y_0.
\tag{3.2}
$$

在很多情形下，$t$ 表示时间，因此，把这类问题称为初值问题是自然的。

**应用**

运动方程（例如车辆动力学、行星运动）、反应动力学、电路仿真等。

下面的定理给出了 (IVP) 解的存在唯一性基础。

**定理 3.1.1（存在唯一性定理）**  
设 $f:[a,b]\times\mathbb{R}^n\to\mathbb{R}^n$ 连续。此外，存在固定常数 $L>0$，使得

$$
\|f(t,y)-f(t,z)\|\le L\|y-z\|
$$

对所有 $t\in[a,b]$ 和 $y,z\in\mathbb{R}^n$ 成立（Lipschitz 条件）。则：

a) 根据 **Picard-Lindelöf 定理**，对每个 $y_0\in\mathbb{R}^n$，(IVP) 恰有一个解

$$
y\in C^1([a,b];\mathbb{R}^n).
$$

b) 若 $y,z$ 分别是初值 $y(a)=y_0$ 和 $z(a)=z_0$ 对应的解，则

$$
\|y(t)-z(t)\|
\le
e^{L(t-a)}\|y_0-z_0\|,
\qquad \forall t\in[a,b].
\tag{3.3}
$$

证明可参见 Heuser [3] 或 Walter [7]。其中 b) 是 Gronwall 引理的一个推论。

**注：** b) 表明解连续依赖于初值 $y_0$。

### 3.1.1 数值方法的基本概念

为了数值求解 (IVP)，把区间 $[a,b]$ 划分为若干子区间：

$$
t_j=a+jh,\qquad j=0,1,\ldots,N,\qquad h=\frac{b-a}{N}.
$$

对 (IVP) 积分，并记

$$
y_j=y(t_j),\qquad j=0,\ldots,N,
$$

得到

$$
y_{j+1}
=y_j+\int_{t_j}^{t_{j+1}}y'(t)\,dt
=y_j+\int_{t_j}^{t_{j+1}}f(t,y(t))\,dt.
\tag{3.4}
$$

右端积分无法精确计算，因为 $y(t)$ 未知。因此用插值型求积近似该积分，由此得到计算近似值

$$
u_j\approx y(t_j),\qquad j=1,\ldots,N,\qquad u_0=y_0
$$

的数值算法。误差

$$
e_j=y(t_j)-u_j
$$

称为离散化误差。

### 3.1.2 一些重要方法

**显式 Euler 方法**

若用矩形规则近似 (3.4) 中的积分，并采用左端点作为支撑点，即

$$
\int_{t_j}^{t_{j+1}}f(t,y(t))\,dt
\approx
h f(t_j,y_j),
$$

则得到显式 Euler 方法：

$$
u_0:=y_0,
$$

$$
u_{j+1}:=u_j+h f(t_j,u_j),
\qquad j=0,\ldots,N-1.
\tag{3.5}
$$

也可以把差商

$$
\frac{y(t_{j+1})-y(t_j)}{h}
$$

看作 $y'(t)$ 的近似，因此它大约等于 $f(t_j,y_j)$。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：显式 Euler 方法只使用左端点斜率</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-explicit-euler-title ode-explicit-euler-desc">
    <title id="ode-explicit-euler-title">显式 Euler 方法的单步几何图示</title>
    <desc id="ode-explicit-euler-desc">坐标轴上显示精确曲线、左端点切线和从 u_j 到 u_{j+1} 的显式 Euler 一步近似。</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="264" fill="#64748b" font-size="14">t_j</text>
    <text x="404" y="264" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 150 176 C 250 154 330 115 430 100 C 520 88 590 70 635 50" fill="none" stroke="#111827" stroke-width="4" />
    <line x1="150" y1="176" x2="430" y2="114" stroke="#c1121f" stroke-width="4" stroke-linecap="round" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="430" cy="114" r="7" fill="#c1121f" />
    <path d="M 150 176 L 430 114" fill="none" stroke="#c1121f" stroke-width="8" stroke-opacity="0.12" />
    <text x="184" y="152" fill="#c1121f" font-size="16">斜率 f(t_j,u_j)</text>
    <text x="438" y="118" fill="#c1121f" font-size="16">u_{j+1}</text>
    <text x="438" y="92" fill="#111827" font-size="16">精确解</text>
  </svg>
  <p class="ode-figure__note">显式 Euler 的特点是一步可以直接算出，但只用左端点的一条切线，步长较大时误差会迅速累积。</p>
</figure>

**隐式 Euler 方法**

如果用右端点 $t_{j+1}$ 作为支撑点的矩形规则近似积分，则得到隐式 Euler 方法：

$$
u_0:=y_0,
$$

$$
u_{j+1}:=u_j+h f(t_{j+1},u_{j+1}),
\qquad j=0,\ldots,N-1.
\tag{3.6}
$$

这里要注意，每走一步，都必须先从这个方程中解出 $u_{j+1}$。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：隐式 Euler 方法使用右端点斜率</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-implicit-euler-title ode-implicit-euler-desc">
    <title id="ode-implicit-euler-title">隐式 Euler 方法的单步几何图示</title>
    <desc id="ode-implicit-euler-desc">图中显示从未知的右端点斜率反推一步，因此 u_{j+1} 出现在方程两侧。</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="264" fill="#64748b" font-size="14">t_j</text>
    <text x="404" y="264" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 525 88 590 72 635 54" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="184" r="7" fill="#111827" />
    <circle cx="430" cy="100" r="7" fill="#1d6fb8" />
    <line x1="150" y1="184" x2="430" y2="100" stroke="#1d6fb8" stroke-width="4" stroke-linecap="round" />
    <line x1="330" y1="130" x2="500" y2="79" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" />
    <text x="456" y="112" fill="#1d6fb8" font-size="16">未知 u_{j+1}</text>
    <text x="352" y="78" fill="#1d6fb8" font-size="16">右端点切线方向</text>
  </svg>
  <p class="ode-figure__note">隐式 Euler 的斜率取在右端点，稳定性更好；代价是每一步通常要解一个非线性方程。</p>
</figure>

若用梯形规则近似 (3.4) 中的积分，则得到

$$
u_{j+1}
=u_j+\frac{h}{2}
\left(f(t_j,u_j)+f(t_{j+1},u_{j+1})\right).
$$

右端依赖于 $u_{j+1}$，因此该方法是隐式的。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：隐式梯形规则取两端斜率的平均</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-trapezoid-title ode-trapezoid-desc">
    <title id="ode-trapezoid-title">隐式梯形规则的单步几何图示</title>
    <desc id="ode-trapezoid-desc">图中用左右端点两条切线和中间的平均方向表示梯形规则。</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <path d="M 150 176 C 250 154 330 130 430 100 C 520 88 590 70 635 50" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="430" cy="100" r="7" fill="#111827" />
    <line x1="108" y1="185" x2="250" y2="154" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="342" y1="126" x2="515" y2="75" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="150" y1="176" x2="430" y2="100" stroke="#2a9d55" stroke-width="4" />
    <text x="156" y="130" fill="#c1121f" font-size="15">左端斜率</text>
    <text x="444" y="80" fill="#1d6fb8" font-size="15">右端斜率</text>
    <text x="300" y="178" fill="#2a9d55" font-size="15">平均方向</text>
  </svg>
  <p class="ode-figure__note">梯形规则可以看成把左、右端点的斜率平均，因此比单纯 Euler 步更对称，但仍是隐式方法。</p>
</figure>

**Heun 方法，第一个二阶 Runge-Kutta 方法**

在右端用显式 Euler 步

$$
u_{j+1}=u_j+h f(t_j,u_j)
$$

替代 $u_{j+1}$，就得到 Heun 方法，也就是第一个二阶 Runge-Kutta 方法（Heun, 1900）：

$$
u_0=y_0,
$$

$$
u_{j+1}
=u_j+\frac{h}{2}
\left(
f(t_j,u_j)
+f(t_{j+1},u_j+h f(t_j,u_j))
\right),
\qquad j=0,\ldots,N-1.
$$

该方法也可以写成

$$
u_{j+1}=u_j+\frac{h}{2}(k_1+k_2),
$$

其中

$$
k_1=f(t_j,u_j),
\qquad
k_2=f(t_{j+1},u_j+hk_1).
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：Heun 方法先预测，再用端点斜率修正</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-heun-title ode-heun-desc">
    <title id="ode-heun-title">Heun 方法的预测校正图示</title>
    <desc id="ode-heun-desc">图中显示 k1 沿精确曲线起点切线预测端点，再在预测端点取向量场斜率 k2，最后用两者平均得到修正后的 u_{j+1}。</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <path d="M 150 176 C 250 154 330 130 430 100 C 525 88 590 70 635 52" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="430" cy="100" r="7" fill="#2a9d55" />
    <circle cx="430" cy="114" r="6" fill="#c1121f" />
    <line x1="150" y1="176" x2="430" y2="114" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="340" y1="141" x2="510" y2="90" stroke="#1d6fb8" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="150" y1="176" x2="430" y2="100" stroke="#2a9d55" stroke-width="4" />
    <text x="248" y="142" fill="#c1121f" font-size="15">预测 k1</text>
    <text x="462" y="104" fill="#1d6fb8" font-size="15">预测点处 k2</text>
    <text x="450" y="126" fill="#2a9d55" font-size="15">平均修正</text>
  </svg>
  <p class="ode-figure__note">Heun 方法仍是显式的：红线从精确起点出发，所以画成起点切线；蓝线是在红色预测点处采样的向量场方向，不表示黑色精确曲线的切线。</p>
</figure>

**改进 Euler 方法（二阶 Runge-Kutta 方法）**

若用矩形规则近似积分，并用 Euler 步

$$
u_j+\frac{h}{2}f(t_j,u_j)
$$

近似 $u_{j+1/2}$，则得到改进 Euler 方法/二阶 Runge-Kutta 二阶方法（Runge, 1895）：

$$
u_0=y_0,
$$

$$
u_{j+1}
=u_j+h f\left(t_j+\frac{h}{2},\,
u_j+\frac{h}{2}f(t_j,u_j)\right),
\qquad j=0,\ldots,N-1.
$$

该方法也可以写成

$$
u_{j+1}=u_j+hk_2,
$$

其中

$$
k_1=f(t_j,u_j),
\qquad
k_2=f\left(t_j+\frac{h}{2},u_j+\frac{h}{2}k_1\right).
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：改进 Euler 方法使用中点斜率</figcaption>
  <svg viewBox="0 0 720 300" role="img" aria-labelledby="ode-midpoint-title ode-midpoint-desc">
    <title id="ode-midpoint-title">改进 Euler 方法的中点斜率图示</title>
    <desc id="ode-midpoint-desc">图中显示先沿起点切线做半步 Euler 预测，再在预测中点采样向量场斜率完成整个步长。</desc>
    <rect x="0" y="0" width="720" height="300" fill="#ffffff" />
    <line x1="70" y1="238" x2="650" y2="238" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="238" stroke="#334155" stroke-width="2" />
    <text x="636" y="266" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="238" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="290" y1="238" x2="290" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="238" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="264" fill="#64748b" font-size="14">t_j</text>
    <text x="266" y="264" fill="#64748b" font-size="14">t_j+h/2</text>
    <text x="404" y="264" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 150 176 C 250 154 330 130 430 100 C 520 88 590 70 635 50" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#111827" />
    <circle cx="290" cy="145" r="7" fill="#c1121f" />
    <circle cx="430" cy="108" r="7" fill="#2a9d55" />
    <line x1="150" y1="176" x2="290" y2="145" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 6" />
    <line x1="150" y1="176" x2="430" y2="108" stroke="#2a9d55" stroke-width="4" />
    <text x="196" y="134" fill="#c1121f" font-size="15">半步预测</text>
    <text x="344" y="98" fill="#2a9d55" font-size="15">预测中点斜率</text>
  </svg>
  <p class="ode-figure__note">改进 Euler 方法不取右端预测斜率，而是在预测中点采样向量场方向，再用这个方向走完整一步；绿色线不应理解为黑色曲线某一点的切线。</p>
</figure>

**经典四阶 Runge-Kutta 方法（RK4，fourth-order Runge-Kutta method）**

最后，如果应用 Simpson 规则，并用 Taylor 展开适当地替代 $u_{j+1/2}$ 和 $u_{j+1}$，经过一些计算可得到非常精确且常用的经典四阶 Runge-Kutta 方法（下文简称 RK4）：

$$
u_0=y_0,
$$

$$
u_{j+1}
=u_j+\frac{h}{6}(k_1+2k_2+2k_3+k_4),
\qquad j=0,\ldots,N-1,
$$

其中

$$
k_1=f(t_j,u_j),
$$

$$
k_2=f\left(t_j+\frac{h}{2},u_j+\frac{h}{2}k_1\right),
$$

$$
k_3=f\left(t_j+\frac{h}{2},u_j+\frac{h}{2}k_2\right),
$$

$$
k_4=f(t_{j+1},u_j+hk_3).
$$

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">方法示意图：RK4 组合四个采样斜率</figcaption>
  <svg viewBox="0 0 720 320" role="img" aria-labelledby="ode-rk4-title ode-rk4-desc">
    <title id="ode-rk4-title">经典四阶 Runge-Kutta 方法的四级斜率图示</title>
    <desc id="ode-rk4-desc">图中标出 k1、k2、k3、k4 的向量场采样位置，并显示 RK4 用 1:2:2:1 的权重组合它们。</desc>
    <rect x="0" y="0" width="720" height="320" fill="#ffffff" />
    <line x1="70" y1="250" x2="650" y2="250" stroke="#334155" stroke-width="2" />
    <line x1="70" y1="45" x2="70" y2="250" stroke="#334155" stroke-width="2" />
    <text x="636" y="278" fill="#334155" font-size="16">t</text>
    <text x="32" y="55" fill="#334155" font-size="16">y</text>
    <line x1="150" y1="250" x2="150" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="290" y1="250" x2="290" y2="48" stroke="#d7dee2" stroke-width="1" />
    <line x1="430" y1="250" x2="430" y2="48" stroke="#d7dee2" stroke-width="1" />
    <path d="M 150 176 C 250 154 330 130 430 100 C 524 88 590 72 635 52" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="150" cy="176" r="7" fill="#c1121f" />
    <circle cx="290" cy="145" r="7" fill="#1d6fb8" />
    <circle cx="290" cy="132" r="7" fill="#2a9d55" />
    <circle cx="430" cy="104" r="7" fill="#7c3aed" />
    <line x1="150" y1="176" x2="245" y2="155" stroke="#c1121f" stroke-width="3" />
    <line x1="290" y1="145" x2="382" y2="118" stroke="#1d6fb8" stroke-width="3" />
    <line x1="290" y1="132" x2="382" y2="106" stroke="#2a9d55" stroke-width="3" />
    <line x1="430" y1="104" x2="530" y2="76" stroke="#7c3aed" stroke-width="3" />
    <text x="118" y="166" fill="#c1121f" font-size="15">k1</text>
    <text x="258" y="162" fill="#1d6fb8" font-size="15">k2</text>
    <text x="258" y="122" fill="#2a9d55" font-size="15">k3</text>
    <text x="436" y="96" fill="#7c3aed" font-size="15">k4</text>
    <rect x="458" y="178" width="176" height="58" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <text x="474" y="203" fill="#334155" font-size="15">权重：1 : 2 : 2 : 1</text>
    <text x="474" y="226" fill="#334155" font-size="15">再乘 h/6</text>
  </svg>
  <p class="ode-figure__note">RK4 的精度来自多次向量场采样：$k_1$ 从起点切线出发，$k_2,k_3,k_4$ 是预测点处的采样方向，最终以 $k_1+2k_2+2k_3+k_4$ 组合。</p>
</figure>

**例：** 考虑一个串联电路：线圈电感为 $L$，电阻为 $R$，电容器电容为 $C$。电流可由下面的二阶线性微分方程描述：

$$
LC\,I''(t)+RC\,I'(t)+I(t)=0.
$$

为了使用数值方法，必须把该系统转化为一阶系统。为此令

$$
y_1(t)=I(t),
\qquad
y_2(t)=I'(t).
$$

得到系统

$$
y'(t)
=
\begin{pmatrix}
y_1'(t)\\
y_2'(t)
\end{pmatrix}
=f(t,y)
=
\begin{pmatrix}
y_2(t)\\
-\frac{R}{L}y_2(t)-\frac{1}{LC}y_1(t)
\end{pmatrix},
$$

其中使用了

$$
y_2'(t)=I''(t)
=-\frac{R}{L}I'(t)-\frac{1}{LC}I(t).
$$

现在取

$$
L=C=1,\qquad R=\frac14,
$$

于是

$$
d=\frac14,\qquad k=1,\qquad \omega=\sqrt{1-\frac{1}{64}}.
$$

初值取为

$$
y_1(0)=I(0)=1,\qquad y_2(0)=I'(0)=1.
$$

**图 3.1：** 振荡电路微分方程

$$
I''(t)+\frac14 I'(t)+I(t)=0
$$

在初值 $I(0)=I'(0)=1$ 下的解与近似；左图取 $n=50$，右图取 $n=100$。图中比较了显式 Euler、Heun、RK4 和精确解。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">图 3.1：振荡电路微分方程的解与近似（左：$n=50$；右：$n=100$）</figcaption>
  <svg viewBox="0 0 920 460" role="img" aria-labelledby="ode-osc-title ode-osc-desc">
    <title id="ode-osc-title">振荡电路微分方程在 n=50 和 n=100 时的数值近似对比</title>
    <desc id="ode-osc-desc">图中左右两栏分别对应 n=50 和 n=100，比较方程 I''(t)+1/4 I'(t)+I(t)=0、初值 I(0)=I'(0)=1 时的精确解、显式 Euler、Heun 和 RK4 近似。</desc>
    <defs>
      <clipPath id="ode-osc-left-clip"><rect x="84" y="88" width="330" height="230" /></clipPath>
      <clipPath id="ode-osc-right-clip"><rect x="506" y="88" width="330" height="230" /></clipPath>
    </defs>
    <rect x="0" y="0" width="920" height="460" fill="#ffffff" />
    <text x="250" y="50" fill="#111827" font-size="18" text-anchor="middle">左：n=50</text>
    <text x="672" y="50" fill="#111827" font-size="18" text-anchor="middle">右：n=100</text>
    <text x="228" y="28" fill="#334155" font-size="16">I''(t)+1/4 I'(t)+I(t)=0，I(0)=I'(0)=1</text>

    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="84" y1="88" x2="84" y2="318" />
      <line x1="249" y1="88" x2="249" y2="318" />
      <line x1="414" y1="88" x2="414" y2="318" />
      <line x1="84" y1="124" x2="414" y2="124" />
      <line x1="84" y1="203" x2="414" y2="203" />
      <line x1="84" y1="283" x2="414" y2="283" />
      <line x1="506" y1="88" x2="506" y2="318" />
      <line x1="671" y1="88" x2="671" y2="318" />
      <line x1="836" y1="88" x2="836" y2="318" />
      <line x1="506" y1="124" x2="836" y2="124" />
      <line x1="506" y1="203" x2="836" y2="203" />
      <line x1="506" y1="283" x2="836" y2="283" />
    </g>
    <g stroke="#334155" stroke-width="2">
      <line x1="84" y1="318" x2="414" y2="318" />
      <line x1="84" y1="88" x2="84" y2="318" />
      <line x1="506" y1="318" x2="836" y2="318" />
      <line x1="506" y1="88" x2="506" y2="318" />
    </g>
    <g fill="#64748b" font-size="13">
      <text x="78" y="340">0</text><text x="241" y="340">10</text><text x="405" y="340">20</text>
      <text x="498" y="340">0</text><text x="663" y="340">10</text><text x="827" y="340">20</text>
      <text x="55" y="128">1</text><text x="48" y="207">0</text><text x="43" y="287">-1</text>
      <text x="477" y="128">1</text><text x="470" y="207">0</text><text x="465" y="287">-1</text>
      <text x="395" y="364">t</text><text x="817" y="364">t</text>
      <text x="36" y="98">I(t)</text><text x="458" y="98">I(t)</text>
    </g>

    <g clip-path="url(#ode-osc-left-clip)" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <polyline points="84,124 101,98 117,164 134,247 150,276 167,239 183,181 200,154 216,173 233,212 249,235 266,227 282,201 299,183 315,185 332,201 348,216 365,217 381,206 398,196 414,193" stroke="#111827" stroke-width="4" />
      <polyline points="84,124 91,92 97,76 104,80 110,103 117,144 124,197 130,254 137,306 143,345 150,363 157,357 163,326 170,274 176,207 183,135 190,70 196,22 203,0 209,10 216,51 223,119 229,204 236,294 242,375 249,434 256,459 262,444 269,391 275,303 282,195 289,81 295,-20 302,-91 308,-120 315,-98 322,-28 328,84 335,222 341,365 348,490 355,577 361,610 368,579 374,486 381,343 388,168 394,-11 401,-167 407,-273 414,-310" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 7" />
      <polyline points="84,124 91,100 97,95 104,107 110,134 117,169 124,206 130,239 137,263 143,275 150,275 157,263 163,243 170,219 176,194 183,173 190,159 196,153 203,156 209,166 216,181 223,197 229,214 236,226 242,234 249,237 256,233 262,226 269,215 275,203 282,193 289,185 295,181 302,181 308,184 315,190 322,197 328,205 335,212 341,216 348,218 355,218 361,215 368,211 374,205 381,200 388,196 394,194 401,193 407,194 414,196" stroke="#1d6fb8" stroke-width="3" />
      <polyline points="84,124 91,100 97,95 104,106 110,130 117,164 124,200 130,233 137,258 143,273 150,276 157,267 163,250 170,228 176,203 183,181 190,165 196,156 203,154 209,160 216,172 223,188 229,204 236,219 242,229 249,235 256,236 262,231 269,223 275,212 282,201 289,192 295,185 302,181 308,181 315,184 322,190 328,197 335,205 341,211 348,216 355,218 361,218 368,215 374,211 381,206 388,202 394,197 401,194 407,193 414,193" stroke="#2a9d55" stroke-width="3" />
    </g>
    <g clip-path="url(#ode-osc-right-clip)" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <polyline points="506,124 523,98 539,164 556,247 572,276 589,239 605,181 622,154 638,173 655,212 671,235 688,227 704,201 721,183 737,185 754,201 770,216 787,217 803,206 820,196 836,193" stroke="#111827" stroke-width="4" />
      <polyline points="506,124 513,96 519,86 526,94 532,119 539,157 546,202 552,246 559,282 565,305 572,311 579,301 585,275 592,238 598,197 605,157 612,125 618,107 625,103 631,116 638,142 645,177 651,216 658,251 664,279 671,294 678,294 684,280 691,254 697,221 704,185 711,153 717,130 724,118 730,120 737,135 744,161 750,193 757,225 763,254 770,274 777,282 783,278 790,262 796,237 803,207 810,178 816,152 823,136 829,130 836,136" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 7" />
      <polyline points="506,124 513,100 519,95 526,106 532,131 539,165 546,201 552,234 559,259 565,273 572,275 579,266 585,248 592,225 598,201 605,180 612,164 618,155 625,155 631,162 638,175 645,190 651,206 658,221 664,231 671,236 678,235 684,230 691,221 697,210 704,199 711,190 717,184 724,181 730,182 737,186 744,192 750,199 757,206 763,212 770,216 777,218 783,217 790,214 796,210 803,205 810,200 816,196 823,194 829,193 836,194" stroke="#1d6fb8" stroke-width="3" />
      <polyline points="506,124 513,100 519,95 526,106 532,131 539,164 546,200 552,233 559,258 565,273 572,276 579,267 585,250 592,228 598,203 605,181 612,165 618,156 625,154 631,161 638,172 645,188 651,204 658,219 664,230 671,235 678,236 684,231 691,223 697,212 704,201 711,192 717,185 724,181 730,181 737,185 744,190 750,197 757,205 763,211 770,216 777,218 783,218 790,215 796,211 803,206 810,202 816,197 823,194 829,193 836,193" stroke="#2a9d55" stroke-width="3" />
    </g>

    <rect x="286" y="374" width="356" height="54" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="306" y1="394" x2="354" y2="394" stroke="#111827" stroke-width="4" />
    <text x="366" y="400" fill="#334155" font-size="15">精确解</text>
    <line x1="448" y1="394" x2="496" y2="394" stroke="#c1121f" stroke-width="3" stroke-dasharray="8 7" />
    <text x="508" y="400" fill="#334155" font-size="15">显式 Euler</text>
    <line x1="306" y1="418" x2="354" y2="418" stroke="#1d6fb8" stroke-width="3" />
    <text x="366" y="424" fill="#334155" font-size="15">Heun</text>
    <line x1="448" y1="418" x2="496" y2="418" stroke="#2a9d55" stroke-width="3" />
    <text x="508" y="424" fill="#334155" font-size="15">RK4</text>
  </svg>
  <p class="ode-figure__note">这张图按原讲义图 3.1 的题注组织为左右两栏：左栏 $n=50$，右栏 $n=100$。步数增加后，Heun 和 RK4 明显贴近精确解；显式 Euler 对该振荡问题的误差仍更明显。</p>
</figure>

解析解可以写成

$$
I(t)
=e^{-\frac18 t}
\left(A\cos(\omega t)+B\sin(\omega t)\right),
$$

其中

$$
\omega
=\sqrt{1-\left(\frac18\right)^2}
=\frac{3\sqrt{7}}{8}.
$$

由初值 $I(0)=1$ 可得 $A=1$（令 $t=0$）。由初值 $I'(0)=1$，通过求导并令 $t=0$ 得到

$$
B=\frac{1+\frac18}{\omega}
=\frac{3\sqrt{7}}{7}.
$$

完整解为

$$
I(t)
=e^{-\frac18 t}
\left(
\cos(\omega t)+\frac{3\sqrt{7}}{7}\sin(\omega t)
\right).
$$

图 3.1 表明，用 Heun 方法和 RK4 得到的近似相当好。相反，显式 Euler 方法误差明显更大。

### 3.1.3 收敛性和相容性

现在考察上述方法的实际可用性和精度。这些方法可以写成一般形式

$$
u_0=y_0,
$$

$$
u_{j+1}
=u_j+h\varphi(t_j,h;u_j,u_{j+1}),
\qquad j=0,\ldots,N-1.
\tag{3.7}
$$

**定义 3.1.2**  
函数 $\varphi(t,h;u,v)$ 在 (3.7) 中称为**方法函数**。如果 $\varphi$ 不依赖于 $v$，则称该方法为显式方法，否则称为隐式方法。

德语原文中的记号是 *Die Funktion* $\varphi(t,h;u,v)$。

这里 $u$ 表示当前步左端点的状态，在 (3.7) 中对应 $u_j$；$v$ 表示当前步右端点的状态，在 (3.7) 中对应 $u_{j+1}$。显式方法不真正使用 $v$，隐式方法则会让 $v$ 出现在方法函数中，因此需要通过方程一起求出 $u_{j+1}$。

量

$$
\tau(t,h)
=
\frac{1}{h}
\left(
y(t+h)-y(t)
-h\varphi(t,h;y(t),y(t+h))
\right),
$$

其中 $h>0$、$t\in[a,b-h]$，称为方法 (3.7) 对 (IVP) 在位置 $t$ 处的**局部截断误差**或**相容性误差**。

换言之，它等于把精确解代入方法后得到的缺陷再除以 $h$。

**定义 3.1.3**  
若存在常数 $C>0$ 和 $\bar h>0$，使得

$$
\|\tau(t,h)\|\le Ch^p
$$

对所有 $0<h\le\bar h$ 和所有 $t\in[a,b-h]$ 成立，则称方法 (3.7) 对 (IVP) 具有 $p$ 阶相容性。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">性质示意图：相容性看的是一步局部缺陷</figcaption>
  <svg viewBox="0 0 760 330" role="img" aria-labelledby="ode-consistency-title ode-consistency-desc">
    <title id="ode-consistency-title">相容性和局部截断误差示意图</title>
    <desc id="ode-consistency-desc">图中比较从精确点出发后，精确解在 t+h 的位置和数值一步给出的位置，两者的距离就是一步局部缺陷。</desc>
    <rect x="0" y="0" width="760" height="330" fill="#ffffff" />
    <line x1="78" y1="258" x2="690" y2="258" stroke="#334155" stroke-width="2" />
    <line x1="78" y1="48" x2="78" y2="258" stroke="#334155" stroke-width="2" />
    <text x="674" y="286" fill="#334155" font-size="16">t</text>
    <text x="38" y="58" fill="#334155" font-size="16">y</text>
    <line x1="170" y1="258" x2="170" y2="62" stroke="#d7dee2" stroke-width="1" />
    <line x1="500" y1="258" x2="500" y2="62" stroke="#d7dee2" stroke-width="1" />
    <text x="156" y="286" fill="#64748b" font-size="14">t</text>
    <text x="482" y="286" fill="#64748b" font-size="14">t+h</text>
    <path d="M 110 228 C 205 184 330 118 500 96 C 585 86 642 70 682 54" fill="none" stroke="#111827" stroke-width="4" />
    <circle cx="170" cy="198" r="7" fill="#111827" />
    <circle cx="500" cy="96" r="7" fill="#111827" />
    <circle cx="500" cy="128" r="7" fill="#c1121f" />
    <line x1="170" y1="198" x2="500" y2="128" stroke="#c1121f" stroke-width="4" stroke-dasharray="9 7" />
    <line x1="500" y1="96" x2="500" y2="128" stroke="#7c3aed" stroke-width="4" />
    <path d="M 514 104 L 536 104 L 536 120 L 514 120" fill="none" stroke="#7c3aed" stroke-width="2" />
    <text x="512" y="88" fill="#111827" font-size="15">精确 y(t+h)</text>
    <text x="512" y="144" fill="#c1121f" font-size="15">数值一步</text>
    <text x="542" y="116" fill="#7c3aed" font-size="15">局部缺陷</text>
  </svg>
  <p class="ode-figure__note">相容性不是先看很多步之后的总误差，而是问：如果这一步从精确解 $y(t)$ 出发，数值公式在 $t+h$ 处偏离精确解多少。</p>
</figure>

若存在常数 $K>0$，使得

$$
\|\varphi(t,h;u,v)-\varphi(t,h;\tilde u,\tilde v)\|
\le
K\bigl(\|u-\tilde u\|+\|v-\tilde v\|\bigr)
$$

对所有 $t\in[a,b]$ 和 $u,v,\tilde u,\tilde v\in\mathbb{R}^n$ 成立，则称方法 (3.7) 稳定。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">性质示意图：稳定性看的是扰动是否被温和传播</figcaption>
  <svg viewBox="0 0 760 340" role="img" aria-labelledby="ode-stability-title ode-stability-desc">
    <title id="ode-stability-title">单步方法稳定性的扰动传播示意图</title>
    <desc id="ode-stability-desc">图中比较两组相近输入状态经过同一个单步方法后得到的两条数值轨道，稳定性要求一步后的差距仍由输入差距控制。</desc>
    <rect x="0" y="0" width="760" height="340" fill="#ffffff" />
    <line x1="82" y1="262" x2="690" y2="262" stroke="#334155" stroke-width="2" />
    <line x1="82" y1="55" x2="82" y2="262" stroke="#334155" stroke-width="2" />
    <text x="674" y="292" fill="#334155" font-size="16">t</text>
    <text x="42" y="65" fill="#334155" font-size="16">y</text>
    <line x1="170" y1="262" x2="170" y2="62" stroke="#d7dee2" stroke-width="1" />
    <line x1="330" y1="262" x2="330" y2="62" stroke="#d7dee2" stroke-width="1" />
    <line x1="500" y1="262" x2="500" y2="62" stroke="#d7dee2" stroke-width="1" />
    <text x="136" y="292" fill="#64748b" font-size="14">t_j</text>
    <text x="298" y="292" fill="#64748b" font-size="14">t_j+h/2</text>
    <text x="468" y="292" fill="#64748b" font-size="14">t_{j+1}</text>
    <path d="M 170 196 C 250 160 340 124 500 98" fill="none" stroke="#111827" stroke-width="4" />
    <path d="M 170 218 C 250 182 340 148 500 126" fill="none" stroke="#c1121f" stroke-width="4" stroke-dasharray="10 7" />
    <circle cx="170" cy="196" r="7" fill="#111827" />
    <circle cx="500" cy="98" r="7" fill="#111827" />
    <circle cx="170" cy="218" r="7" fill="#c1121f" />
    <circle cx="500" cy="126" r="7" fill="#c1121f" />
    <line x1="145" y1="196" x2="145" y2="218" stroke="#7c3aed" stroke-width="4" />
    <line x1="138" y1="196" x2="152" y2="196" stroke="#7c3aed" stroke-width="3" />
    <line x1="138" y1="218" x2="152" y2="218" stroke="#7c3aed" stroke-width="3" />
    <line x1="528" y1="98" x2="528" y2="126" stroke="#7c3aed" stroke-width="4" />
    <line x1="521" y1="98" x2="535" y2="98" stroke="#7c3aed" stroke-width="3" />
    <line x1="521" y1="126" x2="535" y2="126" stroke="#7c3aed" stroke-width="3" />
    <line x1="178" y1="193" x2="490" y2="102" stroke="#111827" stroke-width="2" stroke-opacity="0.35" />
    <line x1="178" y1="215" x2="490" y2="129" stroke="#c1121f" stroke-width="2" stroke-opacity="0.35" stroke-dasharray="7 6" />
    <text x="106" y="190" fill="#111827" font-size="15">u_j, v_j</text>
    <text x="84" y="232" fill="#c1121f" font-size="15">扰动输入</text>
    <text x="544" y="108" fill="#111827" font-size="15">数值一步</text>
    <text x="544" y="134" fill="#c1121f" font-size="15">扰动后一步</text>
    <text x="96" y="162" fill="#7c3aed" font-size="15">输入差距</text>
    <text x="544" y="166" fill="#7c3aed" font-size="15">输出差距受控</text>
    <text x="250" y="72" fill="#334155" font-size="16">φ 对 u、v 的扰动满足 Lipschitz 控制</text>
  </svg>
  <p class="ode-figure__note">稳定性在这里不是说单步误差为零，而是说方法函数 $\varphi(t,h;u,v)$ 对 $u$、$v$ 的小扰动不会产生不受控制的斜率变化；这正是后面把局部相容性误差转化为全局收敛性估计时需要的条件。</p>
</figure>

若存在常数 $M>0$、$H>0$，使得

$$
\|e_j\|
=\|y(t_j)-u_j\|
\le
Mh^p,
$$

对 $j=0,\ldots,N$ 以及所有

$$
h=\frac{b-a}{N}\le H
$$

成立，则称方法 (3.7) 具有 $p$ 阶收敛性。

<figure class="ode-figure">
  <figcaption class="ode-figure__caption">性质示意图：收敛性看的是网格整体误差</figcaption>
  <svg viewBox="0 0 760 340" role="img" aria-labelledby="ode-convergence-title ode-convergence-desc">
    <title id="ode-convergence-title">收敛性和全局离散化误差示意图</title>
    <desc id="ode-convergence-desc">图中显示粗网格和细网格在多个时间点上的数值解，步长变小时离精确曲线更近。</desc>
    <rect x="0" y="0" width="760" height="340" fill="#ffffff" />
    <line x1="82" y1="262" x2="690" y2="262" stroke="#334155" stroke-width="2" />
    <line x1="82" y1="55" x2="82" y2="262" stroke="#334155" stroke-width="2" />
    <text x="674" y="292" fill="#334155" font-size="16">t</text>
    <text x="42" y="65" fill="#334155" font-size="16">y</text>
    <g stroke="#e2e8f0" stroke-width="1">
      <line x1="190" y1="262" x2="190" y2="62" />
      <line x1="300" y1="262" x2="300" y2="62" />
      <line x1="410" y1="262" x2="410" y2="62" />
      <line x1="520" y1="262" x2="520" y2="62" />
      <line x1="630" y1="262" x2="630" y2="62" />
    </g>
    <path d="M 110 232 C 190 195 282 135 410 116 C 520 100 595 82 668 60" fill="none" stroke="#111827" stroke-width="4" />
    <polyline points="110,232 240,184 370,142 500,115 630,90" fill="none" stroke="#c1121f" stroke-width="4" stroke-dasharray="10 7" />
    <polyline points="110,232 175,204 240,173 305,149 370,132 435,119 500,108 565,96 630,82" fill="none" stroke="#1d6fb8" stroke-width="4" />
    <g fill="#c1121f">
      <circle cx="240" cy="184" r="6" />
      <circle cx="370" cy="142" r="6" />
      <circle cx="500" cy="115" r="6" />
      <circle cx="630" cy="90" r="6" />
    </g>
    <g fill="#1d6fb8">
      <circle cx="175" cy="204" r="5" />
      <circle cx="240" cy="173" r="5" />
      <circle cx="305" cy="149" r="5" />
      <circle cx="370" cy="132" r="5" />
      <circle cx="435" cy="119" r="5" />
      <circle cx="500" cy="108" r="5" />
      <circle cx="565" cy="96" r="5" />
      <circle cx="630" cy="82" r="5" />
    </g>
    <line x1="500" y1="100" x2="500" y2="115" stroke="#7c3aed" stroke-width="4" />
    <text x="512" y="108" fill="#7c3aed" font-size="15">e_j</text>
    <rect x="454" y="185" width="184" height="58" rx="6" fill="#ffffff" stroke="#d7dee2" />
    <line x1="472" y1="204" x2="522" y2="204" stroke="#c1121f" stroke-width="4" stroke-dasharray="10 7" />
    <text x="536" y="210" fill="#334155" font-size="15">粗步长 h</text>
    <line x1="472" y1="226" x2="522" y2="226" stroke="#1d6fb8" stroke-width="4" />
    <text x="536" y="232" fill="#334155" font-size="15">细步长 h/2</text>
  </svg>
  <p class="ode-figure__note">收敛性关心的是所有网格点上的全局离散化误差 $e_j=y(t_j)-u_j$。如果方法收敛，步长变小后整条数值轨道会贴近精确轨道。</p>
</figure>

**例 3.1.4（显式 Euler 方法）：** Euler 方法具有 1 阶相容性。

证明：设

$$
f\in C^1([a,b]\times\mathbb{R}^n;\mathbb{R}^n)
$$

且 $y$ 是 $y'=f(t,y)$ 的解。那么

$$
y'\in C^1([a,b];\mathbb{R}^n),
$$

所以

$$
y\in C^2([a,b];\mathbb{R}^n).
$$

Taylor 展开按分量给出，对某些 $\xi_i\in[0,1]$ 有

$$
y(t+h)
=y(t)+y'(t)h
+\frac12\bigl(y_i''(t+\xi_i h)\bigr)_{1\le i\le n}h^2
$$

$$
=y(t)+f(t,y(t))h
+\frac12\bigl(y_i''(t+\xi_i h)\bigr)_{1\le i\le n}h^2.
$$

因此

$$
\|\tau(t,h)\|
=
\left\|
\frac1h\bigl(y(t+h)-y(t)-h f(t,y(t))\bigr)
\right\|
$$

$$
=\frac12
\left\|
\bigl(y_i''(t+\xi_i h)\bigr)_{1\le i\le n}
\right\|h
\le Ch.
$$

这里 $C$ 是 $y''$ 在 $[a,b]$ 上的一个上界常数。因此显式 Euler 方法具有 1 阶相容性。

### 3.1.4 一个收敛性定理

现在考虑显式单步方法的一个基本收敛性定理。

**定理 3.1.5**  
设

$$
y\in C^1([a,b];\mathbb{R}^n)
$$

是 (IVP) 的解。方法 (3.7) 具有 $p$ 阶相容性并且稳定。则该方法具有 $p$ 阶收敛性。更精确地说，存在 $H>0$，使得全局离散化误差满足

$$
\|e_j\|
=\|y(t_j)-u_j\|
\le
\frac{e^{4K|t_j-a|}-1}{4K}\,2C h^p,
$$

对 $j=0,\ldots,N$ 和所有

$$
h=\frac{b-a}{N}\le H
$$

成立。

**证明（供感兴趣的读者参考）：** 令

$$
y_j=y(t_j),\qquad e_j=y_j-u_j,\qquad j=0,\ldots,N.
$$

根据方法 (3.7) 和局部离散化误差的定义，对 $j=0,\ldots,N-1$ 有

$$
u_{j+1}=u_j+h\varphi(t_j,h;u_j,u_{j+1}),
$$

$$
y_{j+1}
=y_j+h\varphi(t_j,h;y_j,y_{j+1})
+h\tau(t_j,h).
$$

第二式减去第一式得到

$$
e_{j+1}
=e_j
+h\left(
\varphi(t_j,h;y_j,y_{j+1})
-\varphi(t_j,h;u_j,u_{j+1})
\right)
+h\tau(t_j,h).
$$

令

$$
0<h=\frac{b-a}{N}\le\bar h.
$$

由于 $t_j\in[a,b-h]$，相容性条件给出

$$
\|\tau(t_j,h)\|\le Ch^p.
$$

结合方法的稳定性和三角不等式，得到

$$
\|e_{j+1}\|
\le
(1+hK)\|e_j\|+hK\|e_{j+1}\|+hCh^p.
$$

取 $0<H\le\bar h$ 足够小，使得 $HK\le\frac12$。那么对所有

$$
0<h=\frac{b-a}{N}\le H
$$

都有

$$
\|e_{j+1}\|
\le
\frac{1+hK}{1-hK}\|e_j\|+2Ch^{p+1}
\le
(1+4hK)\|e_j\|+2Ch^{p+1}.
$$

下面的引理再结合 $e_0=0$，给出

$$
\|e_{j+1}\|
\le
\frac{e^{4K|t_{j+1}-a|}-1}{4K}\,2C h^p.
$$

定理得证。

为了完成证明，还需要下面的离散 Gronwall 引理，用来估计误差累积。

**引理 3.1.6：** 对数 $L>0$、$a_j\ge0$、$h_j>0$ 和 $b\ge0$，若

$$
a_{j+1}\le(1+h_jL)a_j+h_jb,
\qquad j=0,1,\ldots,n-1,
$$

则

$$
a_j
\le
\frac{e^{Lt_j}-1}{L}b
+e^{Lt_j}a_0,
\qquad
t_j:=\sum_{i=0}^{j-1}h_i.
$$

**证明（供感兴趣的读者参考）：** 当 $j=0$ 时命题显然成立。归纳步骤 $j\to j+1$ 由下式给出：

$$
\begin{aligned}
a_{j+1}
&\le
(1+h_jL)
\left(
\frac{e^{Lt_j}-1}{L}b
+e^{Lt_j}a_0
\right)
+h_jb\\
&\le
\left(
\frac{e^{L(t_j+h_j)}-1-h_jL}{L}
+h_j
\right)b
+e^{L(t_j+h_j)}a_0\\
&=
\frac{e^{Lt_{j+1}}-1}{L}b
+e^{Lt_{j+1}}a_0.
\end{aligned}
$$

### 3.1.5 显式 Runge-Kutta 方法

可以通过推广 RK4 方法中的思想来构造高相容性阶的方法。

**$r$ 级显式 Runge-Kutta 方法**

这里选择方法函数

$$
k_i(t,u,h)=k_i
:=
f\left(
t+\gamma_i h,\,
u+h\sum_{j=1}^{i-1}\alpha_{ij}k_j
\right),
\qquad i=1,\ldots,r,
$$

$$
\varphi(t,h;u)
=\sum_{i=1}^{r}\beta_i k_i.
\tag{3.8}
$$

其中 $k_i=k_i(t,u,h)$ 称为第 $i$ 级。为了紧凑描述显式 Runge-Kutta 方法，通常把系数写成一个表，称为：

**Butcher 表**

$$
\begin{array}{c|ccccc}
\gamma_1 & 0 \\
\gamma_2 & \alpha_{21} & 0 \\
\gamma_3 & \alpha_{31} & \alpha_{32} & 0 \\
\vdots & \vdots & \vdots & \ddots & \ddots \\
\gamma_r & \alpha_{r1} & \cdots & \cdots & \alpha_{r,r-1} & 0 \\
\hline
& \beta_1 & \beta_2 & \cdots & \beta_{r-1} & \beta_r
\end{array}
$$

**Butcher 表例子**

显式 Euler 方法：

$$
\begin{array}{c|c}
0 & 0\\
\hline
& 1
\end{array}
$$

改进 Euler 方法：

$$
\begin{array}{c|cc}
0 & 0 & 0\\
\frac12 & \frac12 & 0\\
\hline
& 0 & 1
\end{array}
$$

Heun 方法：

$$
\begin{array}{c|cc}
0 & 0 & 0\\
1 & 1 & 0\\
\hline
& \frac12 & \frac12
\end{array}
$$

用这种方法可以构造任意相容性阶 $p$ 的方法。为此必须把级数 $r$ 选得足够大。对局部截断误差作 Taylor 展开后，会得到关于系数的方程。

由 Taylor 展开可证明下面的定理。

**定理 3.1.7**  
考虑带有方法函数 (3.8) 的 Runge-Kutta 方法 (3.7)，并满足

$$
\gamma_i=\sum_{j=1}^{r}\alpha_{ij},
\qquad i=1,\ldots,r.
$$

它对每个右端项

$$
f\in C^p([a,b]\times\mathbb{R})
$$

具有如下相容性阶，当且仅当系数满足相应方程：

$p=1$：系数满足

$$
\sum_{i=1}^{r}\beta_i=1.
$$

$p=2$：系数还满足

$$
\sum_{i=1}^{r}\beta_i\gamma_i=\frac12.
$$

$p=3$：系数还满足以下两个方程

$$
\sum_{i=1}^{r}\beta_i\gamma_i^2=\frac13,
$$

$$
\sum_{i,j=1}^{r}\beta_i\alpha_{ij}\gamma_j=\frac16.
$$

$p=4$：系数还满足以下四个方程

$$
\sum_{i=1}^{r}\beta_i\gamma_i^3=\frac14,
$$

$$
\sum_{i,j=1}^{r}\beta_i\gamma_i\alpha_{ij}\gamma_j=\frac18,
$$

$$
\sum_{i,j=1}^{r}\beta_i\alpha_{ij}\gamma_j^2=\frac{1}{12},
$$

$$
\sum_{i,j,k=1}^{r}\beta_i\alpha_{ij}\alpha_{jk}\gamma_k=\frac{1}{24}.
$$

证明略。详细推导可参见 Deuflhard 和 Bornemann [1]。

---

<!-- 继续阅读 [数值分析讲义（三）：常微分方程初值问题与刚性 Part II]({{ '/zh/ode-stiffness-stability/' | relative_url }})。 -->

**参考文献**

- [1] P. Deuflhard and F. Bornemann. *Numerische Mathematik II*. de Gruyter, Berlin, 2002. 3.1.5.
- [2] P. Deuflhard and F. Hohmann. *Numerische Mathematik I*. de Gruyter, Berlin, 2008. 1.2.3.
- [3] H. Heuser. *Gewöhnliche Differentialgleichungen*. Teubner, Stuttgart, 1989. 3.1.
- [4] R. Plato. *Numerische Mathematik kompakt*. Vieweg Verlag, Braunschweig, 2000. 1.2.3, 6.3.2.
- [5] J. Stoer. *Numerische Mathematik 1*. Springer Verlag, Berlin, 1994. 1.2.3, 4.4.2.
- [6] W. Törnig and P. Spellucci. *Numerische Mathematik für Ingenieure und Physiker 2*. Springer Verlag, Berlin, 1990. 1.2.3.
- [7] W. Walter. *Gewöhnliche Differentialgleichungen*. Springer, Berlin, 1986. 3.1.
- [8] J. Werner. *Numerische Mathematik 2*. Vieweg Verlag, Braunschweig, 1992. 6.1.4.

**英文缩写与术语说明**

- ODE：ordinary differential equation，常微分方程。
- IVP：initial value problem，初值问题。
- RK4：fourth-order Runge-Kutta method，经典四阶 Runge-Kutta 方法。

**来源、版权与使用说明**

本文主要参考 TU Darmstadt 信息学专业公开仓库中的数值分析基础课讲义：
[mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3)
原仓库包含 The Unlicense 授权说明。本文作为个人学习、翻译与知识整理用途发布，文中的中文表述、补充解释和图表重制不代表原作者或官方立场。
本文中的个人整理、中文表述、补充解释以及我重新制作的图表，可在注明作者与原文链接的前提下，用于非商业学习、交流和引用。由于本文部分内容基于 TU Darmstadt 公开讲义的翻译与整理，原始讲义及其中可能包含的材料仍应以其原作者、原仓库及相关授权说明为准。若需进行商业使用、系统转载、出版，或大规模改编，建议同时确认原始材料的授权状态。
如文中存在翻译、公式、术语或理解上的疏漏，或相关权利方认为内容使用不当，欢迎联系我指出，我会及时处理或删除。
