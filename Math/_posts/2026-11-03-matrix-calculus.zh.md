---
title: "矩阵与向量求导入门：从形状到指数运算"
date: 2026-11-03
lang: zh
permalink: /zh/matrix-calculus/
en_link: /en/matrix-calculus/
categories:
  - Math
tags:
  - Linear Algebra
  - Matrix Calculus
classes: statistics-article
toc: true
toc_label: 本文目录
toc_sticky: true
excerpt: "用小例子理解矩阵、向量和标量混合运算的求导：梯度、雅可比、最小二乘、链式法则，以及逐元素指数与矩阵指数的区别。"
---

{% include statistics-assets.html %}

<a href="{{ page.en_link | relative_url }}" class="btn">Read in English</a>

看到 $Ax$、$x^\top Ax$ 或 $e^A$ 时，最容易困惑的往往是：结果是什么形状？究竟对谁求导？这里用几个小例子把这两件事说明白，不追求列出所有矩阵求导公式。

全文使用实数，向量默认是列向量。**求导时，未被指定为变量的量都当常量。**矩阵不必都是方阵；只有涉及矩阵幂、矩阵指数等运算时，才需要方阵。

## 1. 先看形状，再看运算

> **提示：**同一个表达式里，标量、向量和矩阵承担不同角色。

设 $A\in\mathbb R^{m\times n}$、$x\in\mathbb R^n$、$a$ 为标量：

| 表达式 | 结果形状 | 做了什么 |
| --- | --- | --- |
| $ax$ | $n\times1$ | 每个分量乘同一个数 |
| $Ax$ | $m\times1$ | 矩阵与向量相乘 |
| $x^\top x$ | 标量 | 各分量平方后相加 |
| $xx^\top$ | $n\times n$ | 外积，第 $(i,j)$ 项为 $x_ix_j$ |
| $x\odot x$ | $n\times1$ | 逐元素相乘，即各分量分别平方 |

例如 $x=(1,2)^\top$，则 $x^\top x=5$，而

$$
xx^\top=\begin{pmatrix}1&2\\2&4\end{pmatrix},
\qquad x\odot x=\begin{pmatrix}1\\4\end{pmatrix}.
$$

**标量加矩阵需要说明规则。**软件里的 `A + 2` 通常按广播规则给每个元素加 2；数学上应明确写成 $A+2\mathbf1_m\mathbf1_n^\top$。对方阵，$A+2I$ 则只给对角线加 2，两者不同。

**小结：**矩阵乘法、内积、外积、逐元素运算要分开看；维度能帮助发现许多错误。

## 2. 导数会是什么形状？

> **提示：**先数输入有几个分量，再数输出有几个分量。

标量对标量求导仍是一个数。若 $f(x)$ 是标量、$x$ 是 $n$ 维向量，本文把各偏导排成列向量，称为**梯度**：

$$
\nabla_x f=\begin{pmatrix}\partial f/\partial x_1\\\vdots\\\partial f/\partial x_n\end{pmatrix}.
$$

若 $y(x)\in\mathbb R^m$，就把每个输出对每个输入的偏导排成**雅可比矩阵**：

$$
J_{y,x}\in\mathbb R^{m\times n},\qquad
(J_{y,x})_{ij}=\frac{\partial y_i}{\partial x_j}.
$$

**例子：**$y_1=x_1^2+x_2$、$y_2=3x_1$，于是

$$
J_{y,x}=\begin{pmatrix}2x_1&1\\3&0\end{pmatrix}.
$$

若 $f(W)$ 是标量、$W\in\mathbb R^{m\times n}$，则用同样大小的矩阵装下偏导：$$(\nabla_W f)_{ij}=\partial f/\partial W_{ij}$$。矩阵输出对矩阵输入的导数一般需要更多下标；本文用“微小变化怎样传递”来表示，不展开高阶数组。

有些教材把标量对向量的导数写成行向量。那与本文的列梯度约定相差一个转置，不能脱离约定直接拼公式。

**小结：**标量目标对向量或矩阵的梯度，与变量同形状；向量对向量的导数，用雅可比装起来。

## 3. 从线性函数开始：转置为什么出现？

> **提示：**把矩阵表达式展开成加法，导数通常就很熟悉了。

对常向量 $a$，$f(x)=a^\top x=\sum_i a_ix_i$，所以 $\nabla_x f=a$。

对 $y=Ax+b$，每个分量是 $y_i=\sum_j A_{ij}x_j+b_i$，因此

$$
J_{y,x}=A.
$$

但若最终目标是标量 $f=c^\top y=c^\top(Ax+b)$，梯度则是

$$
\nabla_x f=A^\top c.
$$

这两个结果不冲突：前一个输出是向量，后一个输出是标量。

**数值例子。**取

$$
A=\begin{pmatrix}1&2\\3&4\end{pmatrix},\quad
c=\begin{pmatrix}5\\6\end{pmatrix},\quad b=0.
$$

则 $f=5(x_1+2x_2)+6(3x_1+4x_2)=23x_1+34x_2$，故 $\nabla_x f=(23,34)^\top=A^\top c$。

**小结：**向量线性映射的雅可比是 $A$；把标量目标的梯度传回输入时，会出现 $A^\top$。

## 4. 平方与最小二乘：最常用的几条公式

> **提示：**先算残差，再把残差对变量的影响传回去。

向量平方和是 $f=x^\top x=\sum_i x_i^2$，所以 $\nabla_x f=2x$。更一般的二次型为

$$
f=x^\top Ax,\qquad \nabla_x f=(A+A^\top)x.
$$

只有在 $A$ 对称时才能简写成 $2Ax$。

**例子：非对称矩阵。**若 $$A=\begin{pmatrix}1&2\\0&3\end{pmatrix}$$，则 $f=x_1^2+2x_1x_2+3x_2^2$，梯度为 $(2x_1+2x_2,\ 2x_1+6x_2)^\top$，与 $(A+A^\top)x$ 一致。

**最小二乘。**设 $r=Ax-b$，则

$$
f(x)=\frac12\lVert Ax-b\rVert_2^2,
\qquad \boxed{\nabla_x f=A^\top(Ax-b)}.
$$

例如 $$A=\begin{pmatrix}1&2\\0&1\end{pmatrix}$$、$x=(1,1)^\top$、$b=(2,0)^\top$，残差为 $(1,1)^\top$，损失为 1，梯度为 $(1,3)^\top$。

<details markdown="1">
<summary>展开：只用一元链式法则推导最小二乘梯度</summary>

$$
f=\frac12\sum_i\left(\sum_j A_{ij}x_j-b_i\right)^2,
\qquad
\frac{\partial f}{\partial x_k}=\sum_i r_iA_{ik}.
$$

右边正是 $A^\top r$ 的第 $k$ 个分量。前面的 $1/2$ 抵消了平方求导产生的 2。

</details>

**小结：**最小二乘的梯度是“转置矩阵 × 残差”；一般二次型则要同时考虑 $A$ 和 $A^\top$。

## 5. 对矩阵求导：每个元素都是一个变量

> **提示：**不必先想象复杂的四阶导数，先看一个标量损失。

设 $y=Wx+b$、$\ell=\tfrac12\lVert y-t\rVert_2^2$、$r=y-t$。固定 $x,b,t$，对权重矩阵求导：

$$
\boxed{\nabla_W\ell=rx^\top},\qquad
\nabla_b\ell=r,\qquad \nabla_x\ell=W^\top r.
$$

因为 $W_{ij}$ 只影响 $y_i$，影响程度为 $x_j$，所以 $\partial\ell/\partial W_{ij}=r_ix_j$。

**例子。**若 $x=(1,2)^\top$、$r=(3,-1)^\top$，则

$$
\nabla_W\ell=\begin{pmatrix}3\\-1\end{pmatrix}
\begin{pmatrix}1&2\end{pmatrix}
=\begin{pmatrix}3&6\\-1&-2\end{pmatrix}.
$$

**批量版本。**把样本作为列放入 $X\in\mathbb R^{n\times B}$，固定目标 $T$，不计偏置时

$$
\ell(W)=\frac1{2B}\lVert WX-T\rVert_F^2,
\qquad \nabla_W\ell=\frac1B(WX-T)X^\top.
$$

Frobenius 范数平方 $\lVert M\rVert_F^2=\sum_{i,j}M_{ij}^2$，就是把矩阵各元素平方后相加。每个样本的外积梯度相加，再取平均，就得到批量公式。

**小结：**标量损失对矩阵求导，就是对每个元素求偏导；梯度必须能与原矩阵逐元素相减。

## 6. 微分与链式法则：把复杂表达式拆成几步

> **提示：**用 $dx$ 表示很小的输入变化，观察它怎样影响输出。

对标量目标，$df=(\nabla_x f)^\top dx$；对矩阵变量，约定

$$
df=\sum_{i,j}(\nabla_W f)_{ij}\,dW_{ij}
=\operatorname{tr}((\nabla_W f)^\top dW).
$$

迹 $\operatorname{tr}(M)$ 是方阵对角线之和。上式只是把逐元素乘积求和写紧凑，不需要额外记一整套迹求导公式。

**例子：矩阵乘积。**若 $Y=AB$，则

$$
dY=(dA)B+A(dB).
$$

若下游已经给出 $G=\nabla_Y f$，对应的梯度是 $\nabla_A f=GB^\top$、$\nabla_B f=A^\top G$。例如 $Y=A^2$ 时，同一个 $A$ 在两处出现，必须两条路径都算：

$$
d(A^2)=(dA)A+A(dA).
$$

通常不能合成 $2A\,dA$，因为矩阵乘法不一定可交换。

**向量链式法则。**若 $y=y(x)$、$f=f(y)$，则

$$
\boxed{\nabla_x f=J_{y,x}^\top\nabla_y f}.
$$

**例子：线性变换后做 sigmoid。**令 $z=Ax+b$、$h=\sigma(z)$（逐元素）、$f=\sum_i h_i$，则

$$
\nabla_x f=A^\top\bigl(h\odot(1-h)\bigr).
$$

$1-h$ 表示每个分量用 1 减去 $h_i$。若最终损失换成别的函数，先把 $\nabla_h f$ 逐元素乘进来，再左乘 $A^\top$。这就是一层网络的反向传播。

**小结：**乘法顺序要保留；多个依赖路径的贡献相加；标量目标的梯度通过转置雅可比向前传回。

## 7. 指数里是向量或矩阵，究竟怎么算？

> **提示：**先确认“每个元素分别取指数”，还是“整个矩阵作为线性变换取指数”。

**逐元素指数。**对向量 $x$，在机器学习公式中 $\exp(x)$ 通常表示

$$
\exp(x)=\begin{pmatrix}e^{x_1}\\\vdots\\e^{x_n}\end{pmatrix},\qquad
J_{\exp(x),x}=\operatorname{diag}(e^{x_1},\ldots,e^{x_n}).
$$

例如 $x=(0,\log2)^\top$，输出为 $(1,2)^\top$。若 $f=e^{x_1}+e^{x_2}$，则 $\nabla_x f=(e^{x_1},e^{x_2})^\top$，在该点为 $(1,2)^\top$。

同样可以对矩阵逐元素取指数，结果形状不变。例如

$$
A=\begin{pmatrix}0&1\\0&0\end{pmatrix},\qquad
\exp_{\mathrm{elem}}(A)=\begin{pmatrix}1&e\\1&1\end{pmatrix}.
$$

若 $f(A)=\sum_{i,j}e^{A_{ij}}$，则 $\nabla_A f=\exp_{\mathrm{elem}}(A)$。

**矩阵指数。**对方阵 $A$，线性代数中的 $e^A$ 通常定义为

$$
\boxed{e^A=I+A+\frac{A^2}{2!}+\frac{A^3}{3!}+\cdots}.
$$

这里 $A^2=AA$ 是矩阵乘法，常数项是单位矩阵 $I$。对上面那个 $A$，因为 $A^2=0$，所以

$$
e^A=I+A=\begin{pmatrix}1&1\\0&1\end{pmatrix}.
$$

它明显不同于逐元素指数。甚至对零矩阵，矩阵指数是 $I$，逐元素指数却是全 1 矩阵。

**对角矩阵最容易算。**若 $D=\operatorname{diag}(a,b)$，则 $e^D=\operatorname{diag}(e^a,e^b)$，非对角线仍为 0。若 $A=PDP^{-1}$，则 $e^A=Pe^DP^{-1}$；但并非每个矩阵都可对角化，实际数值计算也不必依赖对角化。[MIT 的讲义](https://math.mit.edu/~dyatlov/18.03/lectures/Section8-3.pdf)给出了这一定义及性质。

**怎样求导？**若变量是标量 $t$、$A$ 是固定方阵，则

$$
\frac{d}{dt}e^{tA}=Ae^{tA}=e^{tA}A.
$$

上面的幂零矩阵就有 $e^{tA}=I+tA$，导数恰为 $A$。它用于线性微分方程 $$u'(t)=Au(t)$$，解为 $u(t)=e^{tA}u(0)$。

但若 $A=A(t)$，一般不能直接套标量公式写成 $$e^{A(t)}A'(t)$$，因为 $A$ 与 $$A'$$ 可能不交换。入门时记住这个限制即可。

<details markdown="1">
<summary>可选：矩阵本身变化时，指数的一阶变化是什么？</summary>

从幂级数求变化，前几项为

$$
d(e^A)=dA+\frac{A\,dA+dA\,A}{2!}
+\frac{A^2dA+A\,dA\,A+dA\,A^2}{3!}+\cdots.
$$

只在 $A$ 与 $dA$ 可交换时，才可合并成 $e^A dA$。这也说明“矩阵指数对矩阵求导还是它自己”不是一般成立的说法。

</details>

**小结：**机器学习中的向量指数通常逐元素计算；线性系统中的 $e^A$ 通常指矩阵指数。遇到含糊记号，先找定义。

## 8. 三个混合运算例子

> **提示：**将长表达式拆成“打分 → 非线性 → 标量目标”。

**例一：标量指数里装着内积。**$f(x)=e^{a^\top x+b}$ 的指数是标量，所以

$$
\nabla_x f=e^{a^\top x+b}a.
$$

若 $a=(1,2)^\top,b=0,x=(0,0)^\top$，梯度就是 $(1,2)^\top$。

**例二：先矩阵乘法，再逐元素指数，最后求和。**设 $f(x)=\sum_i e^{(Ax+b)_i}$，则

$$
\nabla_x f=A^\top\exp(Ax+b).
$$

若 $$A=\begin{pmatrix}1&2\\3&4\end{pmatrix}$$、$x=b=0$，指数向量是 $(1,1)^\top$，梯度为 $(4,6)^\top$。

**例三：高斯函数中的二次型。**若 $A$ 为对称矩阵，

$$
f(x)=e^{-\frac12x^\top Ax},\qquad
\nabla_x f=-f(x)Ax.
$$

当 $A=I$、$x=(1,0)^\top$，$f=e^{-1/2}$、梯度为 $(-e^{-1/2},0)^\top$。方向朝原点，因为朝中心移动会让函数值增加。若要把它归一化成非退化高斯密度，还需 $A$ 正定及相应的归一化常数。

**小结：**这些混合公式仍然只用到了线性求导、平方求导、指数求导和链式法则。

## 9. 一张够用的速查表

> **提示：**先确认常量、变量和约定，再使用公式。

| 表达式 | 对谁求导 | 结果 |
| --- | --- | --- |
| $a^\top x$ | $x$ | $a$ |
| $Ax+b$ | $x$，雅可比 | $A$ |
| $x^\top x$ | $x$ | $2x$ |
| $x^\top Ax$ | $x$ | $(A+A^\top)x$ |
| $\tfrac12\lVert Ax-b\rVert_2^2$ | $x$ | $A^\top(Ax-b)$ |
| $\tfrac12\lVert Wx-t\rVert_2^2$ | $W$ | $(Wx-t)x^\top$ |
| $e^{a^\top x}$ | $x$ | $e^{a^\top x}a$ |
| $\sum_i e^{(Ax)_i}$ | $x$ | $A^\top\exp(Ax)$，逐元素指数 |
| $e^{tA}$，固定 $A$ | 标量 $t$ | $Ae^{tA}$，矩阵指数 |

计算后检查三件事：结果形状是否正确？有没有把矩阵乘法换序？同一个变量出现在多处时，是否遗漏了某条路径？若仍不确定，就展开一个二维例子，逐分量求导。

**本节小结：**先辨形状，再拆步骤，最后核对；多数入门问题都能用这套方法处理。

**进一步阅读。**[Stanford CS231n：向量化反向传播](https://cs231n.stanford.edu/slides/2017/cs231n_2017_lecture4.pdf)；[MIT：矩阵指数](https://math.mit.edu/~dyatlov/18.03/lectures/Section8-3.pdf)。本文的数值例子与推导为独立整理，重点是统一列梯度约定与运算含义。
