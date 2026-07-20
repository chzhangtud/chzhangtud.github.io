---
title: "数值分析讲义（一）：插值方法"
lang: "zh"
date: 2026-07-20
permalink: /zh/interpolation-lab/
categories:
  - Math
tags:
  - Numerical Methods
  - Interpolation
  - Visualization
toc: true
---

<style>
body {
  font-size: 14px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

<link rel="stylesheet" href="{{ '/assets/css/interpolation-lab.css' | relative_url }}">

<script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
**写在前面。** 最近在阅读一些 AI、图形学和机器人相关研究时，越来越觉得有必要系统回顾基础数学知识。因此，我重新复习了一部分数值分析内容，并借助 AI 将其中若干图表改造成可交互的网页示意图。本文基本是对课程讲义第一章插值部分的中文整理与翻译，尽量保留原意；秉持开源分享的精神，我把整理后的内容发布在这里。

本文内容主要参考 TU Darmstadt 课程开源仓库中的 [mathe3-script-2011-SoSe.pdf](https://github.com/tu-darmstadt-informatik/Mathematik-3/blob/master/script/mathe3-script-2011-SoSe.pdf)。若涉及侵权，请联系我删除；若文中存在疏漏或不准确之处，也欢迎勘误。

---

**插值**

实际问题中，我们常常只知道某个函数关系

$$
y = f(x), \qquad f : [a,b] \to \mathbb{R}
$$

的有限多个函数值

$$
y_i = f(x_i), \qquad i = 0,\ldots,n,
$$

但又希望近似计算、绘制或进一步使用任意 $x \in [a,b]$ 处的 $f(x)$。这就引出了下面的问题。

**插值问题：**  
构造一个简单的替代函数 $\Phi(x)$，使得

$$
\Phi(x_i) = y_i, \qquad i = 0,\ldots,n.
$$

目标是使误差 $\lvert f(x)-\Phi(x)\rvert$ 在 $[a,b]$ 上尽量小。

**例子：**

1. 函数 $f(x)$ 的计算代价很高，例如 $\sin(x)$、$\exp(x)$、$\ln(x)$、$\Gamma(x)$ 等，而我们只知道有限个数值 $y_i=f(x_i)$，$i=0,\ldots,n$。  
   目标：为 $f(x)$ 构造一个精确的近似 $\Phi(x)$，或者用 $\Phi'(x)$ 近似 $f'(x)$。

2. 某个实验（或一次数值计算）反映了未知的函数关系 $y=f(x)$，并对输入参数 $x_i$ 给出观测值或计算值 $y_i$。  
   目标：为未知函数 $f(x)$ 建立一个较好的模型 $\Phi(x)$。

3. 一个数字音频信号（CD、MP3 播放器、DVD 等）在时刻 $t_i$，$i=0,\ldots,n$，给出振幅 $y_i$。  
   问题：相应的模拟音频信号 $y(t)$ 应该是什么样的？

4. 一个采样率为 44.1 kHz（CD）的数字音频信号 $(t_i,y_i)$，$i=0,\ldots,n$，需要重采样为 48 kHz（DAT、DVD-Video）。  
   目标：求出 48 kHz 采样时刻 $\tilde t_j$ 上的 $(\tilde t_j, y(\tilde t_j))$。

5. 二维例子：给定数据点 $(x_i,y_i,z_i)$，希望构造一张经过这些点的光滑曲面 $(x,y,z(x,y))$（CAD、计算机图形学、激光扫描等）。

**形式化任务表述**

给定一个待定形式

$$
\Phi(x; a_0,\ldots,a_n), \qquad x \in \mathbb{R},
$$

它依赖于参数 $a_0,\ldots,a_n \in \mathbb{R}$。本章研究下面的插值问题。

**插值任务：**  
给定数据对

$$
(x_i,y_i), \qquad i=0,\ldots,n,
$$

其中 $x_i,y_i \in \mathbb{R}$，并且当 $i \ne j$ 时 $x_i \ne x_j$。要求确定参数 $a_0,\ldots,a_n$，使插值条件

$$
\Phi(x_i; a_0,\ldots,a_n)=y_i, \qquad i=0,\ldots,n
$$

成立。数据对 $(x_i,y_i)$ 称为插值点。

## 1.1 多项式插值

多项式插值是一类非常常用的方法。这里把次数不超过 $n$ 的多项式作为待定函数，即

$$
p_n(x) = \Phi(x; a_0,\ldots,a_n) = a_0 + a_1x + \cdots + a_nx^n.
$$

于是插值问题变为：寻找一个次数不超过 $n$ 的多项式 $p_n(x)$，使其满足插值条件

$$
p_n(x_i)=y_i, \qquad i=0,\ldots,n. \tag{1.1}
$$

**朴素求解思路**

一个自然但实际并不适用的思路如下：由 (1.1) 得到 $n+1$ 个线性方程

$$
a_0 + x_i a_1 + x_i^2 a_2 + \cdots + x_i^n a_n = y_i,
\qquad i=0,\ldots,n,
$$

用来确定 $n+1$ 个系数 $a_0,\ldots,a_n$。写成矩阵形式即

$$
\begin{pmatrix}
1 & x_0 & x_0^2 & \cdots & x_0^n \\
1 & x_1 & x_1^2 & \cdots & x_1^n \\
\vdots & \vdots & \vdots & & \vdots \\
1 & x_n & x_n^2 & \cdots & x_n^n
\end{pmatrix}
\begin{pmatrix}
a_0\\
a_1\\
a_2\\
\vdots\\
a_n
\end{pmatrix}
=
\begin{pmatrix}
y_0\\
y_1\\
y_2\\
\vdots\\
y_n
\end{pmatrix}.
\tag{1.2}
$$

**该方法的缺点**

- 求解线性方程组 (1.2) 需要 $O(n^3)$ 次基本运算。与后面将要介绍的 $O(n^2)$ 方法相比，代价很高。
- (1.2) 中的系数矩阵（Vandermonde 矩阵）虽然可逆，但当 $n$ 较大时条件数极差。因此，在计算机上很难精确求解 (1.2)，因为较差的条件数会显著放大舍入误差（见第 4 章）。

下面用 $O(g(n))$ 表示所有渐近增长不快于 $g$ 的函数组成的集合。也就是说，对于函数 $g:\mathbb{N}\to\mathbb{R}$，

$$
O(g(n)) :=
\{f:\mathbb{N}\to\mathbb{R}:\exists n_0\in\mathbb{N}, c\in\mathbb{R},
f(n)\le c\,g(n)\ \text{对所有 } n\ge n_0\}.
$$

因此，$O(n^3)$ 表示一种在 $n$ 较大时大致按 $n^3$ 增长的计算量，其中乘法常数不计入主要影响。

### 1.1.1 拉格朗日插值公式

下面给出一种数值上更稳定、计算也更高效的插值方法。

**图 1.1：** 在 $[0,1]$ 上等距插值节点对应的 $L_{0,5}$ 和 $L_{3,5}$。

<div data-interpolation-figure="basis"></div>

**拉格朗日插值多项式**

$$
p_n(x)=\sum_{k=0}^{n} y_k L_{k,n}(x),
\qquad
L_{k,n}(x)=\prod_{\substack{j=0\\ j\ne k}}^n
\frac{x-x_j}{x_k-x_j}. \tag{1.3}
$$

拉格朗日基多项式 $L_{k,n}(x)$ 的构造正好保证

$$
L_{k,n}(x_i)=
\begin{cases}
1, & k=i,\\
0, & \text{否则},
\end{cases}
=: \delta_{ki},
$$

其中 $\delta_{ki}$ 是 Kronecker 符号。图 1.1 给出了例子。

(1.3) 中的多项式 $p_n$ 满足插值条件 (1.1)，因为

$$
p_n(x_i)=\sum_{k=0}^{n} y_k L_{k,n}(x_i)
=\sum_{k=0}^{n} y_k\delta_{ki}=y_i.
$$

事实上，这正是插值问题的唯一解。

**定理 1.1.1**  
存在且仅存在一个次数不超过 $n$ 的多项式 $p(x)$ 满足插值条件 (1.1)，它就是 $p_n(x)$。

**证明：**  
多项式 (1.3) 的次数不超过 $n$，并且满足 (1.1)。如果还存在另一个次数不超过 $n$ 的多项式 $\tilde p_n(x)$ 满足 (1.1)，那么 $p_n(x)-\tilde p_n(x)$ 就是一个次数不超过 $n$ 的多项式，并且有 $n+1$ 个互异零点 $x_0,\ldots,x_n$，因此它只能恒等于 0。

**注。**  
(1.3) 表明 $p_n$ 线性依赖于 $y_k$。

Lagrange 表示 (1.3) 在理论分析中非常有用，在实际计算中也经常使用。

**优点**

- 计算量为：计算系数（即 (1.3) 中的分母）需要 $O(n^2)$，求 $p_n(x)$ 的函数值需要 $O(n)$。
- 表示直观且方便。

**例 1.1.2：** 图 1.2 显示了函数 $f(x)=\sin(\pi x)$ 在 $[0,2]$ 上的多项式插值函数，其中 $n=5$ 时，等距插值节点为

$$
x_i=\frac{2i}{5}, \qquad i=0,\ldots,n.
$$

**图 1.2：** $\sin(\pi x)$ 和 $p_5(x)$，以及插值误差 $\sin(\pi x)-p_5(x)$。读者可交互式改变插值节点数量。

<div data-interpolation-figure="sine-error"></div>

在实际应用中，特别是当我们希望能够高效加入新的插值节点时，下面的 Newton 插值公式更加方便。

### 1.1.2 Newton 插值公式

我们采用 Newton 形式：

$$
p_n(x)
= \gamma_0
+\gamma_1(x-x_0)
+\gamma_2(x-x_0)(x-x_1)
+\cdots
+\gamma_n(x-x_0)(x-x_1)\cdots(x-x_{n-1}),
$$

其中待定参数为 $\gamma_0,\ldots,\gamma_n$。将其代入 (1.1) 可得

$$
p_n(x_0)=\gamma_0=y_0,
$$

$$
p_n(x_1)=\gamma_0+\gamma_1(x_1-x_0)=y_1
\quad\Longrightarrow\quad
\gamma_1=\frac{y_1-y_0}{x_1-x_0},
$$

继续代入后可以得到更高阶的系数。例如

$$
\gamma_2=
\frac{
\frac{y_2-y_1}{x_2-x_1}
-
\frac{y_1-y_0}{x_1-x_0}
}{x_2-x_0}.
$$

记

$$
f_{[x_0,\ldots,x_i]} := \gamma_i
$$

为节点 $x_0,\ldots,x_i$ 上的第 $i$ 阶差商，其中

$$
f_{[x_0]}=\gamma_0=y_0.
$$

一般地，节点 $x_j,\ldots,x_{j+k}$ 上的差商可通过递推计算：

$$
j=0,\ldots,n:\qquad f_{[x_j]}=y_j,
$$

$$
k=1,\ldots,n,\quad j=0,\ldots,n-k:\qquad
f_{[x_j,\ldots,x_{j+k}]}
=
\frac{
f_{[x_{j+1},\ldots,x_{j+k}]}
-
f_{[x_j,\ldots,x_{j+k-1}]}
}{x_{j+k}-x_j}. \tag{1.4}
$$

于是得到：

**Newton 插值多项式**

$$
p_n(x)=\gamma_0+\sum_{i=1}^{n}
\gamma_i (x-x_0)\cdots(x-x_{i-1}),
\qquad
\gamma_i=f_{[x_0,\ldots,x_i]},
\tag{1.5}
$$

其中差商 $f_{[x_0,\ldots,x_i]}$ 按 (1.4) 计算。

**说明：**  
当 $n=0$ 时，上述表示显然成立。设 $p_{1,\ldots,i+1}$ 与 $p_{0,\ldots,i}$ 分别是节点
$x_1,\ldots,x_{i+1}$ 和 $x_0,\ldots,x_i$ 上次数不超过 $i$ 的插值多项式，则

$$
p_{i+1}(x)=
\frac{(x-x_0)p_{1,\ldots,i+1}(x)
+(x_{i+1}-x)p_{0,\ldots,i}(x)}
{x_{i+1}-x_0}.
$$

因此

$$
p_{i+1}(x)
=
\frac{f_{[x_1,\ldots,x_{i+1}]}-f_{[x_0,\ldots,x_i]}}
{x_{i+1}-x_0}
(x-x_0)\cdots(x-x_i)
+ q_i(x),
$$

其中 $q_i(x)$ 是一个次数为 $i$ 的多项式。由于第一项在 $x_0,\ldots,x_i$ 处为零，由 (1.1) 可得 $q_i(x)=p_i(x)$。再与 (1.5) 比较，即得到 (1.4)。

由 (1.4) 可得到如下计算系数 $\gamma_i=f_{[x_0,\ldots,x_i]}$ 的规则。

**差商的计算：**  
令

$$
f_{[x_j]}=y_j,\qquad j=0,\ldots,n.
$$

对 $k=1,\ldots,n$ 和 $j=0,\ldots,n-k$，计算

$$
f_{[x_j,\ldots,x_{j+k}]}
=
\frac{
f_{[x_{j+1},\ldots,x_{j+k}]}
-
f_{[x_j,\ldots,x_{j+k-1}]}
}{x_{j+k}-x_j}.
$$

由此得到如下差商表：

$$
\begin{array}{c|cccc}
x_0 & f_{[x_0]}=y_0 & & & \\
    & & \searrow & \\
    & & & f_{[x_0,x_1]} & \\
x_1 & f_{[x_1]}=y_1 & \nearrow & & \searrow \\
    & & \searrow & & & f_{[x_0,x_1,x_2]} \\
    & & & f_{[x_1,x_2]} & \nearrow & \\
x_2 & f_{[x_2]}=y_2 & \nearrow & & \\
\vdots & \vdots & & & 
\end{array}
$$

**优点：**

- 计算量为：计算差商需要 $O(n^2)$，求 $p_n(x)$ 的函数值需要 $O(n)$。
- 增加一个新的插值节点时，只需要额外计算 $n$ 个差商。

### 1.1.3 误差估计

假设插值数据来自某个函数 $f:[a,b]\to\mathbb{R}$，即

$$
y_i=f(x_i),\qquad i=0,\ldots,n,
$$

那么读者自然会问：插值多项式 $p_n$ 在 $[a,b]$ 上对 $f$ 的近似有多好？下面的定理给出了答案。

**定理 1.1.3**  
设 $f$ 具有 $n+1$ 阶连续导数，简记为

$$
f\in C^{n+1}([a,b]).
$$

设 $x_0,\ldots,x_n\in[a,b]$ 是互异点，$p_n$ 是由数据 $(x_i,f(x_i))$，$i=0,\ldots,n$，确定的唯一次数不超过 $n$ 的插值多项式。那么对每个 $x\in[a,b]$，都存在 $\xi_x\in[a,b]$，使得

$$
f(x)-p_n(x)
=
\frac{f^{(n+1)}(\xi_x)}{(n+1)!}
(x-x_0)\cdots(x-x_n).
$$

因此，插值余项由两个因子组成：一个是所谓的节点多项式

$$
\omega(x)=\prod_{i=0}^{n}(x-x_i)
$$

以及因子

$$
\frac{f^{(n+1)}(\xi_x)}{(n+1)!}.
$$

分别估计这两项，就可以得到例如下面的误差界。

**推论 1.1.4**  
在定理 1.1.3 的条件下，有

$$
\max_{x\in[a,b]} |f(x)-p_n(x)|
\le
\max_{x\in[a,b]}
\frac{|f^{(n+1)}(x)|}{(n+1)!}
\max_{x\in[a,b]}|\omega(x)|
\le
\max_{x\in[a,b]}
\frac{|f^{(n+1)}(x)|}{(n+1)!}
(b-a)^{n+1}.
$$

**注意**  
若等距选择插值节点，即

$$
x_i=a+ih,\qquad h=\frac{b-a}{n},
$$

并不总能保证

$$
\lim_{n\to\infty} \left(f(x)-p_n(x)\right)=0
\qquad\text{对所有 } x\in[a,b].
$$

**例。**  
考虑

$$
f(x)=\frac{1}{1+x^2}
\qquad\text{在 } [a,b]=[-5,5]\text{ 上}.
$$

当插值节点等距时，误差 $\lvert f(x)-p_n(x)\rvert$ 在 $n\to\infty$ 时并不会在所有 $x\in[a,b]$ 处趋于 0。见图 1.3。

**图 1.3：** 对 $f(x)=1/(1+x^2)$ 在 $[a,b]=[-5,5]$ 上取等距插值节点时的插值多项式 $p_{10}$ 与 $p_{20}$（读者可在图中交互式选择 $n$ 的值）。

<div data-interpolation-figure="runge-equal"></div>

一种解决办法是把 $x_i$ 选为所谓的 Chebyshev 节点（Chebyshev 横坐标），它们使

$$
\max_{x\in[a,b]}|\omega(x)|
$$

最小。

**Chebyshev 节点**

取节点

$$
x_i =
\frac{b-a}{2}
\cos\left(\frac{2i+1}{n+1}\frac{\pi}{2}\right)
+\frac{b+a}{2},
\qquad i=0,\ldots,n
\tag{1.6}
$$

可以使 $\max_{x\in[a,b]}|\omega(x)|$ 取到最小值，即

$$
\max_{x\in[a,b]}|\omega(x)|
=
\left(\frac{b-a}{2}\right)^{n+1}2^{-n}.
$$

**例。** 图 1.4 显示了 $f(x)=1/(1+x^2)$ 在 Chebyshev 节点下的插值多项式。

**图 1.4：** 对 $f(x)=1/(1+x^2)$ 在 $[a,b]=[-5,5]$ 上取 Chebyshev 节点时的插值多项式 $p_{10}$ 与 $p_{20}$。

<div data-interpolation-figure="runge-chebyshev"></div>

一般来说，实际计算中不宜把 $n$ 选得过大，更好的做法是在较小区间上分段处理，见 1.2。

### 1.1.4 多项式插值的应用

下面给出多项式插值的一些应用：

1. **区间上函数的近似：** 我们已经看到，这里不应选等距插值节点，而应选 Chebyshev 节点。

2. **反插值：** 设 $f:[a,b]\to\mathbb{R}$ 是双射，例如在 $[a,b]$ 上有 $f'(x)\ne 0$。若 $(x_i,y_i)$ 且 $y_i=f(x_i)$ 是 $f$ 的插值点，那么由于 $x_i=f^{-1}(y_i)$，$(y_i,x_i)$ 就是 $f^{-1}$ 的插值点。对这些点 $(y_i,x_i)$ 做插值，就可以得到 $f^{-1}$ 的近似。

3. **数值积分：** （后续内容会介绍）  
   为了近似计算某个函数的积分，可以先构造一个插值多项式，再对该多项式积分：

   $$
   \int_a^b f(x)\,dx \approx \int_a^b p_n(x)\,dx.
   $$

4. **数值微分：** 若 $p_n$ 是 $f$ 的插值多项式，则 $p_n'$ 是 $f'$ 的近似。

**注。**  
多项式插值可以向不同方向扩展：

- 可以改用三角多项式：

  $$
  \frac{a_0}{2}+\sum_{k=1}^{n}\left(a_k\cos(kx)+b_k\sin(kx)\right).
  $$

  这会引出 Fourier 分析。

- 也可以不在 $n$ 个位置给定多项式的函数值，而是在某个特定点 $x_0$ 给定各阶导数。这就得到 Taylor 多项式：

  $$
  f(x_0)+f'(x_0)(x-x_0)
  +\frac{f''(x_0)}{2}(x-x_0)^2
  +\cdots
  +\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n.
  $$

这两种变体都能在许多场景中发挥作用。

## 1.2 样条插值

在多项式插值中，我们用一个次数为 $n$ 的多项式在区间 $[a,b]$ 上插值函数 $f$。前面已经看到，仅仅增加很多插值节点，并不一定能保证高精度。

一种解决办法是采用分段插值。也就是说，把原区间 $[a,b]$ 分成较小的子区间，并在每个子区间上使用固定次数的插值多项式。在子区间的交界处，要让这些多项式以 $k$ 次连续可微的方式衔接，其中 $k$ 固定；同时还希望插值函数的振荡尽可能小。这个思想就引出了样条插值。

### 1.2.1 基础

设

$$
\Delta = \{x_i : a=x_0 < x_1 < \cdots < x_n=b\}
$$

是区间 $[a,b]$ 的一个划分。按照传统，$x_i$ 称为节点。

**定义 1.2.1**  
关于划分 $\Delta$ 的 $l$ 阶样条函数，是指满足下列条件的函数 $s:[a,b]\to\mathbb{R}$：

- $s\in C^{l-1}([a,b])$，即 $s$ 连续，并且具有 $l-1$ 阶连续导数。
- 在每个区间 $[x_i,x_{i+1}]$ 上，$s$ 与一个次数不超过 $l$ 的多项式 $s_i$ 一致。

这类样条函数的集合记为 $S_{\Delta,l}$。

下面只讨论 $l=1$（线性样条）和 $l=3$（三次样条）这两种情形。

现在考虑如何用样条进行插值。

**样条插值**

给定划分

$$
\Delta = \{x_i : a=x_0<x_1<\cdots<x_n=b\}
$$

以及数值 $y_i\in\mathbb{R}$，$i=0,\ldots,n$，求一个 $s\in S_{\Delta,l}$，使

$$
s(x_i)=y_i,\qquad i=0,\ldots,n. \tag{1.7}
$$

### 1.2.2 线性样条插值

线性样条 $s\in S_{\Delta,1}$ 是连续函数，并且在每个区间 $[x_i,x_{i+1}]$ 上都是次数不超过 1 的多项式 $s_i$。因此，插值条件 (1.7) 要求

$$
s_i(x_i)=y_i,\qquad s_i(x_{i+1})=y_{i+1},
$$

这就唯一确定了 $s_i$：

$$
s(x)=s_i(x)
=
\frac{x_{i+1}-x}{x_{i+1}-x_i}y_i
+
\frac{x-x_i}{x_{i+1}-x_i}y_{i+1},
\qquad
\forall x\in[x_i,x_{i+1}].
\tag{1.8}
$$

定义“帽函数”

$$
\varphi_i(x)=
\begin{cases}
0, & x<x_{i-1},\\
\dfrac{x-x_{i-1}}{x_i-x_{i-1}}, & x\in[x_{i-1},x_i],\\
\dfrac{x_{i+1}-x}{x_{i+1}-x_i}, & x\in[x_i,x_{i+1}],\\
0, & x>x_{i+1},
\end{cases}
$$

其中辅助节点 $x_{-1}<a$ 和 $x_{n+1}>b$ 可以任意选取。于是，在 $[a,b]$ 上可将 $s(x)$ 方便地表示为

$$
s(x)=\sum_{i=0}^{n}y_i\varphi_i(x),
\qquad x\in[a,b].
$$

**定理 1.2.2**  
给定 $[a,b]$ 的划分

$$
\Delta=\{x_i:a=x_0<x_1<\cdots<x_n=b\}
$$

以及数值 $y_i$，$i=0,\ldots,n$，存在唯一的线性插值样条。

此外，还有如下误差估计。

**定理 1.2.3**  
设 $f\in C^2([a,b])$。那么对 $[a,b]$ 的任意划分

$$
\Delta=\{x_i:a=x_0<x_1<\cdots<x_n=b\},
$$

以及由 $f$ 得到的相应线性插值样条 $s\in S_{\Delta,1}$，有

$$
\max_{x\in[a,b]} |f(x)-s(x)|
\le
\frac{1}{8}
\max_{x\in[a,b]} |f''(x)|\,h_{\max}^2,
\qquad
h_{\max}:=\max_{i=0,\ldots,n-1}(x_{i+1}-x_i).
$$

**证明：**  
在每个区间 $[x_i,x_{i+1}]$ 上，$s$ 都是次数不超过 1 的插值多项式。因此由定理 1.1.3，

$$
|f(x)-s(x)|
=
\frac{|f''(\xi_x)|}{2!}|(x-x_i)(x-x_{i+1})|
\le
\frac{|f''(\xi_x)|}{2!}\frac{h_{\max}^2}{4},
\qquad
\forall x\in[x_i,x_{i+1}],
$$

其中 $\xi_x\in[x_i,x_{i+1}]$ 依赖于 $x$。由此立即得到结论。

### 1.2.3 三次样条插值

三次样条由三次多项式分段拼接而成，并且具有二阶连续导数。我们将看到，三次样条插值可以用一条曲率最小的函数曲线经过给定点。

**三次样条插值函数的计算**

若 $s\in S_{\Delta,3}$ 是三次样条，那么 $s''$ 显然连续且分段线性，即 $s''\in S_{\Delta,1}$。因此，可以先确定 $s_i''$，再通过积分得到 $s_i$。

令

$$
M_i=s''(x_i)
$$

称为矩。由 (1.8) 得

$$
s_i''(x)
=
\frac{x_{i+1}-x}{x_{i+1}-x_i}M_i
+
\frac{x-x_i}{x_{i+1}-x_i}M_{i+1}.
$$

对上式积分两次，得到如下待定形式：

$$
s_i(x)
=
\frac{1}{6}
\left(
\frac{(x_{i+1}-x)^3}{x_{i+1}-x_i}M_i
+
\frac{(x-x_i)^3}{x_{i+1}-x_i}M_{i+1}
\right)
+c_i(x-x_i)+d_i,
$$

其中 $c_i,d_i\in\mathbb{R}$。利用条件

$$
s_i(x_i)=y_i,\qquad s_i(x_{i+1})=y_{i+1}
$$

可以确定 $c_i$ 和 $d_i$。令 $h_i=x_{i+1}-x_i$，得到

$$
d_i=y_i-\frac{h_i^2}{6}M_i,
\qquad
c_i=\frac{y_{i+1}-y_i}{h_i}
-\frac{h_i}{6}(M_{i+1}-M_i).
$$

尚未确定的 $M_i$ 可以通过一阶导数

$$
s_i'(x)
=
-\frac{1}{2}
\left(
\frac{(x_{i+1}-x)^2}{x_{i+1}-x_i}M_i
-
\frac{(x-x_i)^2}{x_{i+1}-x_i}M_{i+1}
\right)
+c_i
$$

以及方程

$$
s_i'(x_i)=s_{i-1}'(x_i)
$$

计算出来。最终得到关于矩 $M_i$ 的方程

$$
\frac{h_{i-1}}{6}M_{i-1}
+
\frac{h_{i-1}+h_i}{3}M_i
+
\frac{h_i}{6}M_{i+1}
=
\frac{y_{i+1}-y_i}{h_i}
-
\frac{y_i-y_{i-1}}{h_{i-1}},
\qquad
i=1,\ldots,n-1.
\tag{1.9}
$$

这里共有 $n-1$ 个方程，但未知量有 $n+1$ 个。因此还需要两个额外的边界条件，才能唯一确定样条插值函数。

**三次样条常用的边界条件：**

a) **自然边界条件：**

$$
s''(a)=s''(b)=0,
\qquad\text{即 } M_0=M_n=0.
$$

b) **Hermite 边界条件：**

$$
s'(a)=f'(a),\qquad s'(b)=f'(b),
$$

即

$$
\frac{h_0}{3}M_0+\frac{h_0}{6}M_1
=
\frac{y_1-y_0}{h_0}-f'(a),
$$

$$
\frac{h_{n-1}}{3}M_n+\frac{h_{n-1}}{6}M_{n-1}
=
f'(b)-\frac{y_n-y_{n-1}}{h_{n-1}}.
$$

无论采用 a) 还是 b)，与 (1.9) 联立后都可以唯一确定 $M_0,\ldots,M_n$。由此得到如下形式的严格对角占优三对角线性方程组：

$$
\begin{pmatrix}
\mu_0 & \lambda_0 & & & \\
\frac{h_0}{6} & \frac{h_0+h_1}{3} & \frac{h_1}{6} & & \\
& \ddots & \ddots & \ddots & \\
& & \frac{h_{i-1}}{6} & \frac{h_{i-1}+h_i}{3} & \frac{h_i}{6} \\
& & & \ddots & \ddots \\
& & & \lambda_n & \mu_n
\end{pmatrix}
\begin{pmatrix}
M_0\\
M_1\\
\vdots\\
M_n
\end{pmatrix}
=
\begin{pmatrix}
b_0\\
\frac{y_2-y_1}{h_1}-\frac{y_1-y_0}{h_0}\\
\vdots\\
\frac{y_{i+1}-y_i}{h_i}-\frac{y_i-y_{i-1}}{h_{i-1}}\\
\vdots\\
b_n
\end{pmatrix}.
\tag{1.10}
$$

对于情形 a)，例如可以取

$$
b_0=b_n=\lambda_0=\lambda_n=0,
\qquad
\mu_0=\mu_n=1.
$$

对于情形 b)，有

$$
\mu_0=\frac{h_0}{3},\quad
\lambda_0=\frac{h_0}{6},\quad
b_0=\frac{y_1-y_0}{h_0}-f'(a),
$$

以及

$$
\mu_n=\frac{h_{n-1}}{3},\quad
\lambda_n=\frac{h_{n-1}}{6},\quad
b_n=f'(b)-\frac{y_n-y_{n-1}}{h_{n-1}}.
$$

由于该矩阵严格对角占优，根据 Gershgorin 定理，0 不是它的特征值，因此系数矩阵可逆。

**例 1.2.4：** 图 1.5 给出了线性样条和三次样条插值的一个例子。

**图 1.5：** 在 $[a,b]=[0,2]$ 上对 $\sin(4\pi x)$ 插值，使用线性样条和三次样条（自然边界条件）。读者可交互式选择 $n=10$ 或 $n=20$ 查看。

<div data-interpolation-figure="spline"></div>

**三次样条的最小性质**

可以证明，带边界条件 a) 或 b) 的三次样条插值函数，在所有二阶连续可微函数中，按下面的意义具有最小曲率。

**定理 1.2.5**  
给定任意函数 $f\in C^2([a,b])$ 和 $[a,b]$ 的划分 $\Delta$，且 $y_i=f(x_i)$。若 $s\in S_{\Delta,3}$ 是满足边界条件 a) 或 b) 的三次样条插值函数，则有

$$
\int_a^b f''(x)^2\,dx
=
\int_a^b s''(x)^2\,dx
+
\int_a^b (f''(x)-s''(x))^2\,dx
\ge
\int_a^b s''(x)^2\,dx.
$$

**证明：** 参考 [4,5]。

**三次样条插值的误差估计**

利用下面这个事实可以证明后续结论：矩

$$
\hat M_i=f''(x_i)
$$

以 $O(h_{\max}^3)$ 的精度满足线性方程组 (1.10)，其中

$$
h_{\max}=\max_{0\le i<n} h_i,
$$

同时，(1.10) 中系数矩阵的逆矩阵范数阶为 $O(1/h_{\min})$，其中

$$
h_{\min}=\min_{0\le i<n} h_i.
$$

**定理 1.2.6**  
设 $f\in C^4([a,b])$，且

$$
f''(a)=f''(b)=0.
$$

则对任意划分 $\Delta$，令 $y_i=f(x_i)$，并令 $s\in S_{\Delta,3}$ 为满足边界条件 a) 的三次样条插值函数，有

$$
|f(x)-s(x)|
\le
\frac{h_{\max}}{h_{\min}}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^4,
$$

$$
|f^{(k)}(x)-s^{(k)}(x)|
\le
\frac{2h_{\max}}{h_{\min}}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^{4-k},
\qquad k=1,2.
$$

**证明：** 参考 [4]。

对于 Hermite 边界条件，上述结论还可以加强。

**定理 1.2.7**  
设 $f\in C^4([a,b])$。则对任意划分 $\Delta$，令 $y_i=f(x_i)$，并令 $s\in S_{\Delta,3}$ 为满足边界条件 b) 的三次样条插值函数，有

$$
|f(x)-s(x)|
\le
\frac{5}{384}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^4,
$$

$$
|f^{(k)}(x)-s^{(k)}(x)|
\le
\frac{2h_{\max}}{h_{\min}}
\sup_{\xi\in[a,b]} |f^{(4)}(\xi)|\,h_{\max}^{4-k},
\qquad k=1,2.
$$

**证明：** 参考 [2,4,6]。

**参考文献**

- [1] P. Deuflhard and F. Bornemann. *Numerische Mathematik II*. de Gruyter, Berlin, 2002. 3.1.5.
- [2] P. Deuflhard and F. Hohmann. *Numerische Mathematik I*. de Gruyter, Berlin, 2008. 1.2.3.
- [3] H. Heuser. *Gewöhnliche Differentialgleichungen*. Teubner, Stuttgart, 1989. 3.1.
- [4] R. Plato. *Numerische Mathematik kompakt*. Vieweg Verlag, Braunschweig, 2000. 1.2.3, 6.3.2.
- [5] J. Stoer. *Numerische Mathematik 1*. Springer Verlag, Berlin, 1994. 1.2.3, 4.4.2.
- [6] W. Törnig and P. Spellucci. *Numerische Mathematik für Ingenieure und Physiker 2*. Springer Verlag, Berlin, 1990. 1.2.3.
- [7] W. Walter. *Gewöhnliche Differentialgleichungen*. Springer, Berlin, 1986. 3.1.
- [8] J. Werner. *Numerische Mathematik 2*. Vieweg Verlag, Braunschweig, 1992. 6.1.4.


<script type="module" src="{{ '/assets/js/interpolation-lab.mjs' | relative_url }}"></script>
